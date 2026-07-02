"use client";

import { useAssemblyAIStreaming } from "@/lib/notes/use-assemblyai-streaming";
import { Button } from "@/components/retroui/Button";
import { KaizenLoadingDots } from "@/components/loading/kaizen-loading";
import { Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";

type AssistantVoiceButtonProps = {
  onTranscript: (text: string) => void;
  onStart?: () => void;
  disabled?: boolean;
  className?: string;
};

export function AssistantVoiceButton({
  onTranscript,
  onStart,
  disabled,
  className,
}: AssistantVoiceButtonProps) {
  const { isRecording, isConnecting, start, stop } = useAssemblyAIStreaming({
    onFinalTranscript: onTranscript,
    onStart,
  });

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled || isConnecting}
      className={cn(
        isRecording && "border-violet-600 bg-violet-50 text-violet-800",
        className,
      )}
      onClick={() => {
        if (isRecording) {
          void stop();
        } else {
          void start();
        }
      }}
      aria-label={isRecording ? "Stop voice input" : "Start voice input"}
    >
      {isConnecting ? (
        <KaizenLoadingDots size="sm" aria-label="Connecting" />
      ) : isRecording ? (
        <Square className="size-4 text-violet-600" aria-hidden />
      ) : (
        <Mic className="size-4 text-violet-600" aria-hidden />
      )}
    </Button>
  );
}
