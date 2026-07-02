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
import { Select } from "@/components/retroui/Select";
import { cn } from "@/lib/utils";

type SpeakToNoteProps = {
  enabled?: boolean;
  onTranscript: (text: string) => void;
  onStart?: () => void;
  onLanguageChange?: (language: SpeechLanguageId) => void;
};

export function SpeakToNote({
  enabled = true,
  onTranscript,
  onStart,
  onLanguageChange,
}: SpeakToNoteProps) {
  const [language, setLanguage] = useState<SpeechLanguageId>(() => {
    if (typeof window === "undefined") return "auto";
    return loadSpeechPrefs().sttLang;
  });

  const { isRecording, preview, error, start, stop } = useAssemblyAIStreaming({
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

        <Select
          value={language}
          onValueChange={handleLanguageChange}
          disabled={isRecording}
        >
            <Select.Trigger className="h-8 min-w-32 px-2 text-sm shadow-sm">
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

      <p className="font-sans text-[11px] text-muted-foreground">
        Auto detects language; pin a language for mixed-content notes.
      </p>

      {isRecording && preview ? (
        <p
          className={cn(
            "rounded border-2 border-dashed border-violet-400 bg-violet-50 px-3 py-2 font-sans text-sm text-violet-900 dark:bg-violet-950/40 dark:text-violet-100",
          )}
        >
          {preview}
        </p>
      ) : null}

      {isRecording ? (
        <p className="inline-flex items-center gap-1 font-sans text-[11px] text-muted-foreground">
          <Volume2 className="size-3" />
          Stop recording to change language.
        </p>
      ) : null}

      {error ? (
        <p className="font-sans text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
