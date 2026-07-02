"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { StreamingTranscriber } from "assemblyai/streaming";

type UseAssemblyAIStreamingOptions = {
  onFinalTranscript: (text: string) => void;
  enabled?: boolean;
};

function float32ToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

export function useAssemblyAIStreaming({
  onFinalTranscript,
  enabled = true,
}: UseAssemblyAIStreamingOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState<string | null>(null);

  const transcriberRef = useRef<StreamingTranscriber | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastFinalRef = useRef("");
  const onFinalRef = useRef(onFinalTranscript);

  useEffect(() => {
    onFinalRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  const cleanup = useCallback(async () => {
    processorRef.current?.disconnect();
    processorRef.current = null;

    audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (transcriberRef.current) {
      try {
        await transcriberRef.current.close();
      } catch {
        // ignore close errors
      }
      transcriberRef.current = null;
    }

    setIsRecording(false);
    setPreview("");
    lastFinalRef.current = "";
  }, []);

  const start = useCallback(async () => {
    if (!enabled || isRecording) return;

    setError(null);
    setPreview("");
    lastFinalRef.current = "";

    try {
      const tokenRes = await fetch("/api/assemblyai/token", { method: "POST" });
      if (!tokenRes.ok) {
        throw new Error("Failed to get transcription token");
      }
      const { token } = (await tokenRes.json()) as { token: string };

      const transcriber = new StreamingTranscriber({
        token,
        sampleRate: 16_000,
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

      await transcriber.connect();
      transcriberRef.current = transcriber;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const context = new AudioContext({ sampleRate: 16_000 });
      audioContextRef.current = context;

      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        const pcm = event.inputBuffer.getChannelData(0);
        const int16 = float32ToInt16(pcm);
        transcriber.sendAudio(int16.buffer);
      };

      source.connect(processor);
      processor.connect(context.destination);

      setIsRecording(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not start recording",
      );
      await cleanup();
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
    preview,
    error,
    start,
    stop,
  };
}
