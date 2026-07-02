"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { StreamingTranscriber } from "assemblyai/streaming";
import {
  getSttConfigForLanguage,
  type SpeechLanguageId,
} from "@/lib/notes/speech-languages";

type UseAssemblyAIStreamingOptions = {
  onFinalTranscript: (text: string) => void;
  language?: SpeechLanguageId;
  enabled?: boolean;
  onStart?: () => void;
};

function float32ToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

function formatStartError(err: unknown): string {
  if (!(err instanceof Error)) {
    return "Could not start recording";
  }

  const message = err.message.toLowerCase();
  if (
    message.includes("permission") ||
    message.includes("notallowed") ||
    message.includes("not allowed")
  ) {
    return "Microphone access denied — allow mic permission and try again";
  }
  if (message.includes("token")) {
    return "Failed to get transcription token — check AssemblyAI configuration";
  }
  if (
    message.includes("concurrent") ||
    message.includes("too many") ||
    message.includes("too many streams")
  ) {
    return "Speech session limit reached — stop recording, wait a few seconds, then try again";
  }
  if (message.includes("timed out") || message.includes("timeout")) {
    return "Speech connection timed out — check your network and try again";
  }
  return err.message;
}

async function closeTranscriber(transcriber: StreamingTranscriber | null) {
  if (!transcriber) return;
  try {
    await transcriber.close();
  } catch {
    // ignore close errors
  }
}

export function useAssemblyAIStreaming({
  onFinalTranscript,
  language = "auto",
  enabled = true,
  onStart,
}: UseAssemblyAIStreamingOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState<string | null>(null);

  const transcriberRef = useRef<StreamingTranscriber | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastFinalRef = useRef("");
  const onFinalRef = useRef(onFinalTranscript);
  const onStartRef = useRef(onStart);
  const languageRef = useRef(language);
  const startingRef = useRef(false);

  useEffect(() => {
    onFinalRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  useEffect(() => {
    onStartRef.current = onStart;
  }, [onStart]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  const cleanup = useCallback(async () => {
    processorRef.current?.disconnect();
    processorRef.current = null;

    audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    const transcriber = transcriberRef.current;
    transcriberRef.current = null;
    await closeTranscriber(transcriber);

    setIsRecording(false);
    setIsConnecting(false);
    setPreview("");
    lastFinalRef.current = "";
  }, []);

  const start = useCallback(async () => {
    if (!enabled || isRecording || startingRef.current) return;

    startingRef.current = true;
    setIsConnecting(true);
    onStartRef.current?.();
    setError(null);
    setPreview("");
    lastFinalRef.current = "";

    let transcriber: StreamingTranscriber | null = null;

    try {
      await cleanup();

      const tokenRes = await fetch("/api/assemblyai/token", { method: "POST" });
      if (!tokenRes.ok) {
        const body = (await tokenRes.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Failed to get transcription token");
      }
      const { token } = (await tokenRes.json()) as { token: string };

      const sttConfig = getSttConfigForLanguage(languageRef.current);
      transcriber = new StreamingTranscriber({
        token,
        sampleRate: 16_000,
        formatTurns: true,
        connectTimeout: 10_000,
        maxConnectionRetries: 0,
        ...sttConfig,
      });

      transcriber.on("turn", (turn) => {
        const text = turn.transcript?.trim() ?? "";
        if (!text) return;

        if (turn.end_of_turn) {
          if (text !== lastFinalRef.current) {
            lastFinalRef.current = text;
            onFinalRef.current(text);
          }
          setPreview("");
        } else {
          setPreview(text);
        }
      });

      transcriber.on("error", (err) => {
        setError(err.message ?? "Transcription error");
        void cleanup();
      });

      try {
        await transcriber.connect();
      } catch (connectErr) {
        await closeTranscriber(transcriber);
        transcriber = null;
        throw connectErr;
      }

      transcriberRef.current = transcriber;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const context = new AudioContext({ sampleRate: 16_000 });
      audioContextRef.current = context;

      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        const active = transcriberRef.current;
        if (!active) return;
        const pcm = event.inputBuffer.getChannelData(0);
        const int16 = float32ToInt16(pcm);
        active.sendAudio(int16.buffer);
      };

      source.connect(processor);
      processor.connect(context.destination);

      setIsRecording(true);
    } catch (err) {
      if (transcriber && transcriberRef.current !== transcriber) {
        await closeTranscriber(transcriber);
      }
      setError(formatStartError(err));
      await cleanup();
    } finally {
      startingRef.current = false;
      setIsConnecting(false);
    }
  }, [cleanup, enabled, isRecording]);

  const stop = useCallback(async () => {
    await cleanup();
  }, [cleanup]);

  useEffect(() => {
    return () => {
      void cleanup();
    };
  }, [cleanup]);

  return {
    isRecording,
    isConnecting,
    preview,
    error,
    start,
    stop,
  };
}
