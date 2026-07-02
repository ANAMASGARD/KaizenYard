"use client";

import Link from "next/link";
import { useFreighter } from "@/hooks/use-freighter";
import { usePersistedSidebarOpen } from "@/lib/use-persisted-sidebar-open";
import { useAssistantSession } from "@/hooks/use-assistant-session";
import { requiresTokenization } from "@/lib/assistant/modes";
import { useAiFeatures } from "@/lib/settings/use-ai-features";
import { AssistantSidebar } from "@/components/assistant/assistant-sidebar";
import { AssistantChat } from "@/components/assistant/assistant-chat";
import { AssistantComposer } from "@/components/assistant/assistant-composer";
import { PrivacyModeRail } from "@/components/assistant/privacy-mode-rail";
import { ProxyChainIndicator } from "@/components/assistant/proxy-chain-indicator";
import { LlmViewButton } from "@/components/assistant/llm-view-drawer";
import { DelegateWalletChip } from "@/components/assistant/delegate-wallet-chip";
import { VaultGateBanner } from "@/components/assistant/vault-gate-banner";
import { Button } from "@/components/retroui/Button";
import { KaizenLoadingScreen } from "@/components/loading/kaizen-loading";
import { renameAssistantSession, deleteAssistantSession } from "@/lib/assistant/actions";
import { Menu, PanelLeft } from "lucide-react";
import { useState } from "react";

export function AssistantPage() {
  const { isFeatureEnabled, aiDisabled } = useAiFeatures();
  const assistantEnabled = isFeatureEnabled("assistant");
  const { connected, address, connect } = useFreighter();
  const [proxyHop, setProxyHop] = useState(0);
  const { open: sidebarOpen, setOpen: setSidebarOpen } = usePersistedSidebarOpen(
    "kaizenyard-assistant-sidebar-open",
  );

  const {
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
  } = useAssistantSession();

  function animateProxyChain() {
    setProxyHop(0);
    const intervals = [0, 1, 2, 3, 4].map((hop, i) =>
      window.setTimeout(() => setProxyHop(hop), i * 200),
    );
    return () => intervals.forEach(clearTimeout);
  }

  function handleSend(text: string) {
    if (!activeSessionId) return;
    const cleanup = animateProxyChain();
    void sendMessage({ text }).finally(cleanup);
  }

  if (loading) {
    return <KaizenLoadingScreen label="Loading Kaizen Witness" />;
  }

  if (!assistantEnabled || aiDisabled) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="font-head text-lg">AI Assistant is disabled</p>
        <p className="font-sans text-sm text-muted-foreground">
          Enable the assistant in your AI settings to use Kaizen Witness.
        </p>
        <Link
          href="/settings/ai"
          className="inline-flex items-center justify-center border-2 border-border bg-primary px-4 py-2 font-head text-sm uppercase tracking-wide text-primary-foreground shadow-md"
        >
          Open AI settings
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-0 flex-col lg:flex-row">
      {sidebarOpen ? (
        <AssistantSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelect={(id) => void selectSession(id)}
          onNew={() => void handleNewSession()}
          onRename={(id, title) => {
            void renameAssistantSession(id, title).then(refreshSessions);
          }}
          onDelete={(id) => {
            void deleteAssistantSession(id).then(async () => {
              const list = await refreshSessions();
              if (activeSessionId === id) {
                const next = list[0];
                if (next) {
                  void selectSession(next.id);
                }
              }
            });
          }}
          className="hidden lg:flex"
        />
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-3 border-b-2 border-border p-3">
          <button
            type="button"
            className="hidden border-2 border-border p-2 lg:inline-flex"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="size-4" />
          </button>
          <button
            type="button"
            className="border-2 border-border p-2 lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Menu"
          >
            <Menu className="size-4" />
          </button>
          <div className="flex-1">
            <h1 className="font-head text-sm uppercase tracking-wider">Kaizen Witness</h1>
            <p className="font-sans text-xs text-muted-foreground">
              Privacy Proxy Agent · Chapter 11
            </p>
          </div>
          {requiresTokenization(privacyMode) ? (
            <LlmViewButton sessionId={activeSessionId} />
          ) : null}
          <DelegateWalletChip address={activeSession?.delegateAddress ?? address} />
          {privacyMode === "delegate" && !connected ? (
            <Button type="button" variant="outline" size="sm" onClick={() => void connect()}>
              Connect wallet
            </Button>
          ) : null}
        </header>

        <div className="border-b-2 border-border px-3 py-2">
          <PrivacyModeRail
            mode={privacyMode}
            onChange={(m) => void handleModeChange(m, connected, address)}
          />
        </div>

        {requiresTokenization(privacyMode) ? (
          <div className="border-b-2 border-border px-3 py-2">
            <ProxyChainIndicator activeHop={proxyHop} />
          </div>
        ) : null}

        {privacyMode === "vault" ? (
          <VaultGateBanner className="m-3" />
        ) : null}

        <AssistantChat
          messages={messages}
          status={status}
          privacyMode={privacyMode}
          onSuggestion={handleSend}
          onApprove={(toolCallId) => {
            void addToolApprovalResponse({ id: toolCallId, approved: true });
          }}
          onDeny={(toolCallId) => {
            void addToolApprovalResponse({ id: toolCallId, approved: false });
          }}
        />

        <AssistantComposer
          onSend={handleSend}
          onStopStream={() => void stop()}
          disabled={!activeSessionId || status === "streaming" || status === "submitted"}
        />
      </div>
    </div>
  );
}
