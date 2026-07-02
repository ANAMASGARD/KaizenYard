"use client";

import { useState } from "react";
import { Mic, Square, Volume2 } from "lucide-react";
import { useAssemblyAIStreaming } from "@/lib/notes/use-assemblyai-streaming";
import {
  loadSpeechPrefs,
  saveSpeechPrefs,
  SPEECH_LANGUAGE_OPTIONS,
  type SpeechLanguageId,
} from "@/lib/notes/speech-languages";
import { Button } from "@/components/retroui/Button";
import { KaizenLoadingDots } from "@/components/loading/kaizen-loading";
import { Select } from "@/components/retroui/Select";
import { cn } from "@/lib/utils";

type SpeakToNoteProps = {
  enabled?: boolean;
  compact?: boolean;
  onTranscript: (text: string) => void;
  onStart?: () => void;
  onLanguageChange?: (language: SpeechLanguageId) => void;
};

const LANGUAGE_HINT =
  "Auto detects language; pin a language for mixed-content notes.";

export function SpeakToNote({
  enabled = true,
  compact = false,
  onTranscript,
  onStart,
  onLanguageChange,
}: SpeakToNoteProps) {
  const [language, setLanguage] = useState<SpeechLanguageId>(() => {
    if (typeof window === "undefined") return "auto";
    return loadSpeechPrefs().sttLang;
  });

  const { isRecording, isConnecting, preview, error, start, stop } =
    useAssemblyAIStreaming({
    enabled,
    language,
    onFinalTranscript: onTranscript,
    onStart,
  });

  function handleLanguageChange(nextLanguage: SpeechLanguageId | null) {
    if (!nextLanguage || isRecording) return;
    setLanguage(nextLanguage);
    saveSpeechPrefs({ sttLang: nextLanguage, ttsLang: nextLanguage });
    onLanguageChange?.(nextLanguage);
  }

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col",
        compact ? "gap-1" : "gap-2",
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-1">
        {!isRecording ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "shrink-0 gap-1.5 border-violet-600 text-violet-700 shadow-sm hover:translate-y-0 hover:shadow-sm active:translate-y-0 active:shadow-sm dark:text-violet-300",
              compact ? "h-8 px-2.5 text-xs" : "gap-2",
            )}
            disabled={!enabled || isConnecting}
            onClick={() => void start()}
          >
            {isConnecting ? (
              <KaizenLoadingDots size="sm" aria-label="Connecting" />
            ) : (
              <Mic className={cn(compact ? "size-3.5" : "size-4")} />
            )}
            {isConnecting
              ? compact
                ? "Connecting"
                : "Connecting…"
              : compact
                ? "Dictate"
                : "Speak to Note"}
          </Button>
        ) : (
          <Button
            type="button"
            variant="default"
            size="sm"
            className={cn(
              "shrink-0 gap-1.5 shadow-sm hover:translate-y-0 hover:shadow-sm active:translate-y-0 active:shadow-sm",
              compact ? "h-8 px-2.5 text-xs" : "gap-2",
            )}
            onClick={() => void stop()}
          >
            <span className="relative flex size-3.5 items-center justify-center">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500/60" />
              <Mic className="relative size-3.5" />
            </span>
            {compact ? "Stop" : "Stop Recording"}
            <Square className="size-2.5 fill-current" />
          </Button>
        )}

        <Select
          value={language}
          onValueChange={handleLanguageChange}
          disabled={isRecording || isConnecting}
        >
          <Select.Trigger
            className={cn(
              "h-8 shrink-0 px-2 text-xs shadow-sm",
              compact ? "min-w-22" : "min-w-32 text-sm",
            )}
            title={LANGUAGE_HINT}
            aria-label={`Speech language. ${LANGUAGE_HINT}`}
          >
            <Select.Value placeholder="Language" />
          </Select.Trigger>
          <Select.Content>
            {SPEECH_LANGUAGE_OPTIONS.map((option) => (
              <Select.Item key={option.id} value={option.id}>
                {option.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>

      {!compact ? (
        <p className="font-sans text-[11px] text-muted-foreground">
          {LANGUAGE_HINT}
        </p>
      ) : null}

      {isRecording && preview ? (
        <p
          className={cn(
            "rounded border-2 border-dashed border-violet-400 bg-violet-50 font-sans text-violet-900 dark:bg-violet-950/40 dark:text-violet-100",
            compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm",
          )}
        >
          {preview}
        </p>
      ) : null}

      {isRecording && !compact ? (
        <p className="inline-flex items-center gap-1 font-sans text-[11px] text-muted-foreground">
          <Volume2 className="size-3" />
          Stop recording to change language.
        </p>
      ) : null}

      {error ? (
        <p className="font-sans text-[11px] text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
