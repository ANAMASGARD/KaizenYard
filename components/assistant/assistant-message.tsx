"use client";

import type { UIMessage } from "ai";
import { AssistantToolPart, AssistantApprovalCard } from "@/components/assistant/assistant-tool-part";
import { cn } from "@/lib/utils";

type AssistantMessageProps = {
  message: UIMessage;
  onApprove?: (toolCallId: string) => void;
  onDeny?: (toolCallId: string) => void;
};

export function AssistantMessage({ message, onApprove, onDeny }: AssistantMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded border-2 border-border px-4 py-3 shadow-sm",
          isUser ? "bg-primary text-primary-foreground" : "bg-background",
        )}
      >
        {message.parts.map((part, index) => {
          if (part.type === "text") {
            return (
              <p key={index} className="whitespace-pre-wrap font-sans text-sm">
                {part.text}
              </p>
            );
          }

          if (part.type.startsWith("tool-")) {
            const toolPart = part as {
              type: string;
              toolCallId?: string;
              state?: string;
              input?: unknown;
              toolName?: string;
            };

            if (toolPart.state === "approval-requested" && toolPart.toolCallId && onApprove && onDeny) {
              return (
                <AssistantApprovalCard
                  key={toolPart.toolCallId}
                  toolName={toolPart.toolName ?? toolPart.type}
                  input={toolPart.input}
                  onApprove={() => onApprove(toolPart.toolCallId!)}
                  onDeny={() => onDeny(toolPart.toolCallId!)}
                />
              );
            }

            return <AssistantToolPart key={index} part={part} />;
          }

          return null;
        })}
      </div>
    </div>
  );
}
