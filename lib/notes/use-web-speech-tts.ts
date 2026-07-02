"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  resolveTtsLang,
  type SpeechLanguageId,
} from "@/lib/notes/speech-languages";
import { waitForSpeechVoices } from "@/lib/notes/wait-for-speech-voices";

const MAX_CHUNK_LEN = 300;
const MAX_TOTAL_LEN = 10_000;

function chunkText(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= MAX_CHUNK_LEN) return [trimmed];

  const chunks: string[] = [];
  const parts = trimmed.match(/[^.!?]+[.!?]+|[^\s]+/g) ?? [trimmed];
  let current = "";

  for (const part of parts) {
    const piece = part.trim();
    if (!piece) continue;

    const candidate = current ? `${current} ${piece}` : piece;
    if (candidate.length <= MAX_CHUNK_LEN) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
      current = "";
    }

    if (piece.length <= MAX_CHUNK_LEN) {
      current = piece;
      continue;
    }

    for (let offset = 0; offset < piece.length; offset += MAX_CHUNK_LEN) {
      chunks.push(piece.slice(offset, offset + MAX_CHUNK_LEN));
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function pickVoice(
  voices: SpeechSynthesisVoice[],
  lang: string,
): SpeechSynthesisVoice | null {
  const langBase = lang.split("-")[0]?.toLowerCase() ?? lang.toLowerCase();

  return (
    voices.find((voice) => voice.lang === lang) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith(langBase)) ??
    voices.find((voice) => voice.default) ??
    voices[0] ??
    null
  );
}

function mapSpeechError(event: SpeechSynthesisErrorEvent): string | null {
  switch (event.error) {
    case "interrupted":
      return null;
    case "not-allowed":
      return "Browser blocked speech — try again from a button click";
    case "synthesis-failed":
    case "voice-unavailable":
    case "text-too-long":
    case "audio-busy":
      return "No speech voice available on this system";
    default:
      return "Speech playback failed";
  }
}

function isFirefoxAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Firefox/i.test(navigator.userAgent) && /Android/i.test(navigator.userAgent);
}

type UseWebSpeechTtsOptions = {
  languageId?: SpeechLanguageId;
};

export function useWebSpeechTts({
  languageId = "auto",
}: UseWebSpeechTtsOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasVoices, setHasVoices] = useState(false);
  const [supported] = useState(
    () => typeof window !== "undefined" && "speechSynthesis" in window,
  );

  const queueRef = useRef<string[]>([]);
  const chunkIndexRef = useRef(0);
  const abortedRef = useRef(false);
  const warmedUpRef = useRef(false);
  const languageIdRef = useRef(languageId);

  useEffect(() => {
    languageIdRef.current = languageId;
  }, [languageId]);

  const stop = useCallback(() => {
    abortedRef.current = true;
    queueRef.current = [];
    chunkIndexRef.current = 0;
    if (supported) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!supported) {
        setError("Read aloud is not supported in this browser");
        return;
      }

      if (isFirefoxAndroid()) {
        setError(
          "Read aloud requires desktop Firefox or Chrome — not supported on Firefox for Android",
        );
        return;
      }

      const trimmed = text.trim().slice(0, MAX_TOTAL_LEN);
      if (!trimmed) {
        setError("Nothing to read aloud");
        return;
      }

      stop();
      abortedRef.current = false;
      setError(null);

      const chunks = chunkText(trimmed);
      if (chunks.length === 0) {
        setError("Nothing to read aloud");
        return;
      }

      queueRef.current = chunks;
      chunkIndexRef.current = 0;
      setIsSpeaking(true);

      void (async () => {
        const { voices } = await waitForSpeechVoices();
        if (abortedRef.current) return;

        setHasVoices(voices.length > 0);

        const lang = resolveTtsLang(languageIdRef.current);

        if (!warmedUpRef.current) {
          warmedUpRef.current = true;
          const warmup = new SpeechSynthesisUtterance(" ");
          warmup.volume = 0;
          warmup.lang = lang;
          window.speechSynthesis.speak(warmup);
        }

        function speakNextChunk(
          availableVoices: SpeechSynthesisVoice[],
          utteranceLang: string,
        ) {
          if (abortedRef.current) {
            setIsSpeaking(false);
            return;
          }

          if (chunkIndexRef.current >= queueRef.current.length) {
            setIsSpeaking(false);
            return;
          }

          const chunkTextValue = queueRef.current[chunkIndexRef.current];
          const utterance = new SpeechSynthesisUtterance(chunkTextValue);
          utterance.lang = utteranceLang;

          const voice = pickVoice(availableVoices, utteranceLang);
          if (voice) {
            utterance.voice = voice;
          }

          utterance.onend = () => {
            if (abortedRef.current) return;
            chunkIndexRef.current += 1;
            speakNextChunk(availableVoices, utteranceLang);
          };

          utterance.onerror = (event) => {
            if (abortedRef.current) return;
            const message = mapSpeechError(event);
            if (message) {
              setError(message);
            }
            stop();
          };

          window.speechSynthesis.speak(utterance);
        }

        speakNextChunk(voices, lang);
      })();
    },
    [stop, supported],
  );

  useEffect(() => {
    if (!supported) return;

    const onVisibilityChange = () => {
      if (document.hidden) {
        stop();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [stop, supported]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    speak,
    stop,
    isSpeaking,
    supported,
    hasVoices,
    error,
  };
}
