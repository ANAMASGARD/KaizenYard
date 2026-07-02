"use client";

import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import { AssistantMessage } from "@/components/assistant/assistant-message";
import { AssistantEmptyState } from "@/components/assistant/assistant-empty-state";
import { KaizenLoadingDots } from "@/components/loading/kaizen-loading";
import type { PrivacyMode } from "@/lib/assistant/types";

type AssistantChatProps = {
  messages: UIMessage[];
  status: "submitted" | "streaming" | "ready" | "error";
  privacyMode: PrivacyMode;
  onSuggestion: (prompt: string) => void;
  onApprove?: (toolCallId: string) => void;
  onDeny?: (toolCallId: string) => void;
};

export function AssistantChat({
  messages,
  status,
  privacyMode,
  onSuggestion,
  onApprove,
  onDeny,
}: AssistantChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  if (messages.length === 0) {
    return <AssistantEmptyState mode={privacyMode} onSuggestion={onSuggestion} />;
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        {messages.map((message) => (
          <AssistantMessage
            key={message.id}
            message={message}
            onApprove={onApprove}
            onDeny={onDeny}
          />
        ))}
        {status === "streaming" || status === "submitted" ? (
          <div className="flex justify-start">
            <KaizenLoadingDots aria-label="Assistant is thinking" />
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
