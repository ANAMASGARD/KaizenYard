"use client";

import { Mic, Square } from "lucide-react";
import { useAssemblyAIStreaming } from "@/lib/notes/use-assemblyai-streaming";
import { Button } from "@/components/retroui/Button";
import { cn } from "@/lib/utils";

type SpeakToNoteProps = {
  enabled?: boolean;
  onTranscript: (text: string) => void;
};

export function SpeakToNote({ enabled = true, onTranscript }: SpeakToNoteProps) {
  const { isRecording, preview, error, start, stop } = useAssemblyAIStreaming({
    enabled,
    onFinalTranscript: onTranscript,
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {!isRecording ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 border-violet-600 text-violet-700 dark:text-violet-300"
            disabled={!enabled}
            onClick={() => void start()}
          >
            <Mic className="size-4" />
            Speak to Note
          </Button>
        ) : (
          <Button
            type="button"
            variant="default"
            size="sm"
            className="gap-2"
            onClick={() => void stop()}
          >
            <span className="relative flex size-4 items-center justify-center">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500/60" />
              <Mic className="relative size-4" />
            </span>
            Stop Recording
            <Square className="size-3 fill-current" />
          </Button>
        )}
      </div>

      {isRecording && preview ? (
        <p
          className={cn(
            "rounded border-2 border-dashed border-violet-400 bg-violet-50 px-3 py-2 font-sans text-sm text-violet-900 dark:bg-violet-950/40 dark:text-violet-100",
          )}
        >
          {preview}
        </p>
      ) : null}

      {error ? (
        <p className="font-sans text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
