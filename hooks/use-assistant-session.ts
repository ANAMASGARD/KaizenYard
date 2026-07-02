"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  type UIMessage,
} from "ai";
import { createAssistantSession,
  listAssistantSessions,
  loadSessionMessages,
  updateAssistantSessionMode,
  bindDelegateToSession,
} from "@/lib/assistant/actions";
import type { AssistantSessionRecord, PrivacyMode } from "@/lib/assistant/types";
import { getAssistantVaultUnlockedIds } from "@/lib/assistant/witness/session";

function partsToUIMessage(
  rows: Array<{ id: number; role: string; parts: unknown }>,
): UIMessage[] {
  return rows.map((row) => ({
    id: String(row.id),
    role: row.role as UIMessage["role"],
    parts: (Array.isArray(row.parts) ? row.parts : []) as UIMessage["parts"],
  }));
}

export function useAssistantSession() {
  const searchParams = useSearchParams();
  const witnessParam = searchParams.get("witness");
  const modeParam = searchParams.get("mode");
  const queryHandledRef = useRef(false);
  const initialQueryRef = useRef({ witnessParam, modeParam });

  const [sessions, setSessions] = useState<AssistantSessionRecord[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>("standard");
  const [loading, setLoading] = useState(true);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/assistant/chat",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: {
            messages,
            sessionId: activeSessionId,
            vaultUnlockedSpaceIds: getAssistantVaultUnlockedIds(),
          },
        }),
      }),
    [activeSessionId],
  );

  const { messages, sendMessage, status, setMessages, stop, addToolApprovalResponse } =
    useChat({
      transport,
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    });

  const refreshSessions = useCallback(async () => {
    const list = await listAssistantSessions();
    setSessions(list);
    return list;
  }, []);

  useEffect(() => {
    async function init() {
      let list = await refreshSessions();

      if (list.length === 0 && !queryHandledRef.current) {
        queryHandledRef.current = true;
        const { witnessParam: w, modeParam: m } = initialQueryRef.current;
        const initialMode: PrivacyMode = m === "witness" || w ? "witness" : "standard";
        const session = await createAssistantSession({
          privacyMode: initialMode,
          witnessGroupId: w ? Number(w) : undefined,
        });
        list = [session];
        setSessions(list);
      }

      const first = list[0];
      if (first) {
        setActiveSessionId(first.id);
        setPrivacyMode(first.privacyMode);
        const history = await loadSessionMessages(first.id);
        setMessages(partsToUIMessage(history));
      }

      setLoading(false);
    }
    void init();
  }, [refreshSessions, setMessages]);

  async function selectSession(id: number) {
    setActiveSessionId(id);
    const session = sessions.find((s) => s.id === id);
    if (session) {
      setPrivacyMode(session.privacyMode);
    }
    const history = await loadSessionMessages(id);
    setMessages(partsToUIMessage(history));
  }

  async function handleNewSession() {
    const session = await createAssistantSession({ privacyMode });
    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(session.id);
    setMessages([]);
  }

  async function handleModeChange(mode: PrivacyMode, connected: boolean, address: string | null) {
    setPrivacyMode(mode);
    if (activeSessionId) {
      await updateAssistantSessionMode(activeSessionId, mode);
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, privacyMode: mode } : s)),
      );
    }
    if (mode === "delegate" && connected && address && activeSessionId) {
      await bindDelegateToSession(activeSessionId, address);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId ? { ...s, delegateAddress: address, privacyMode: "delegate" } : s,
        ),
      );
    }
  }

  return {
    sessions,
    activeSessionId,
    activeSession,
    privacyMode,
    loading,
    messages,
    status,
    sendMessage,
    stop,
    addToolApprovalResponse,
    refreshSessions,
    selectSession,
    handleNewSession,
    handleModeChange,
  };
}
