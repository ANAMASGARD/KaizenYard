const DEFAULT_VOICE_WAIT_MS = 2500;

export type WaitForVoicesResult = {
  voices: SpeechSynthesisVoice[];
  timedOut: boolean;
};

export function waitForSpeechVoices(
  timeoutMs = DEFAULT_VOICE_WAIT_MS,
): Promise<WaitForVoicesResult> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.resolve({ voices: [], timedOut: false });
  }

  const synth = window.speechSynthesis;

  return new Promise((resolve) => {
    let settled = false;

    const finish = (timedOut: boolean) => {
      if (settled) return;
      settled = true;
      synth.removeEventListener("voiceschanged", onVoicesChanged);
      window.clearTimeout(timer);
      resolve({ voices: synth.getVoices(), timedOut });
    };

    const onVoicesChanged = () => {
      if (synth.getVoices().length > 0) {
        finish(false);
      }
    };

    synth.addEventListener("voiceschanged", onVoicesChanged);

    if (synth.getVoices().length > 0) {
      finish(false);
      return;
    }

    const timer = window.setTimeout(() => finish(true), timeoutMs);
  });
}
