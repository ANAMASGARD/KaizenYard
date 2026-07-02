"use client";

import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/retroui/Button";
import { Textarea } from "@/components/retroui/Textarea";
import { AssistantVoiceButton } from "@/components/assistant/assistant-voice-button";
import { cn } from "@/lib/utils";

type AssistantComposerProps = {
  onSend: (text: string) => void;
  onStopStream?: () => void;
  disabled?: boolean;
  className?: string;
};

export function AssistantComposer({
  onSend,
  onStopStream,
  disabled,
  className,
}: AssistantComposerProps) {
  const [value, setValue] = useState("");

  function handleSend() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  }

  return (
    <div className={cn("border-t-2 border-border bg-background p-4", className)}>
      <div className="flex items-end gap-2">
        <Textarea
          value={value}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setValue(e.target.value)}
          placeholder="Ask Kaizen Witness…"
          className="min-h-[3rem] flex-1 resize-none"
          disabled={disabled}
          onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <AssistantVoiceButton
          disabled={disabled}
          onStart={onStopStream}
          onTranscript={(text) => {
            setValue((prev) => (prev ? `${prev} ${text}` : text));
          }}
        />
        <Button type="button" variant="default" disabled={disabled || !value.trim()} onClick={handleSend}>
          <Send className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
