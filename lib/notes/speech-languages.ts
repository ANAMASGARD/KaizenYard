export type SpeechLanguageId =
  | "auto"
  | "en"
  | "es"
  | "fr"
  | "de"
  | "hi"
  | "ja"
  | "ko"
  | "pt"
  | "zh";

export type SpeechLanguageOption = {
  id: SpeechLanguageId;
  label: string;
  sttPrompt?: string;
  ttsLang: string;
};

export const SPEECH_LANGUAGE_OPTIONS: SpeechLanguageOption[] = [
  { id: "auto", label: "Auto", ttsLang: "en-US" },
  {
    id: "en",
    label: "English",
    sttPrompt: "Transcribe English",
    ttsLang: "en-US",
  },
  {
    id: "es",
    label: "Spanish",
    sttPrompt: "Transcribe Spanish",
    ttsLang: "es-ES",
  },
  {
    id: "fr",
    label: "French",
    sttPrompt: "Transcribe French",
    ttsLang: "fr-FR",
  },
  {
    id: "de",
    label: "German",
    sttPrompt: "Transcribe German",
    ttsLang: "de-DE",
  },
  {
    id: "hi",
    label: "Hindi",
    sttPrompt: "Transcribe Hindi",
    ttsLang: "hi-IN",
  },
  {
    id: "ja",
    label: "Japanese",
    sttPrompt: "Transcribe Japanese",
    ttsLang: "ja-JP",
  },
  {
    id: "ko",
    label: "Korean",
    sttPrompt: "Transcribe Korean",
    ttsLang: "ko-KR",
  },
  {
    id: "pt",
    label: "Portuguese",
    sttPrompt: "Transcribe Portuguese",
    ttsLang: "pt-BR",
  },
  {
    id: "zh",
    label: "Chinese",
    sttPrompt: "Transcribe Chinese",
    ttsLang: "zh-CN",
  },
];

export const SPEECH_PREFS_KEY = "kaizenyard-notes-speech-prefs";

export type SpeechPrefs = {
  sttLang: SpeechLanguageId;
  ttsLang: SpeechLanguageId;
};

const DEFAULT_PREFS: SpeechPrefs = {
  sttLang: "auto",
  ttsLang: "auto",
};

function isSpeechLanguageId(value: string): value is SpeechLanguageId {
  return SPEECH_LANGUAGE_OPTIONS.some((option) => option.id === value);
}

export function getDefaultTtsLang(): string {
  if (typeof document !== "undefined") {
    const htmlLang = document.documentElement.lang?.trim();
    if (htmlLang) return htmlLang;
  }
  return "en-US";
}

export function resolveTtsLang(languageId: SpeechLanguageId): string {
  if (languageId === "auto") {
    return getDefaultTtsLang();
  }
  const option = SPEECH_LANGUAGE_OPTIONS.find((item) => item.id === languageId);
  return option?.ttsLang ?? "en-US";
}

export type SttTranscriberConfig =
  | {
      speechModel: "universal-streaming-multilingual";
      languageDetection: true;
    }
  | {
      speechModel: "u3-rt-pro";
      prompt: string;
    };

export function getSttConfigForLanguage(
  languageId: SpeechLanguageId,
): SttTranscriberConfig {
  if (languageId === "auto") {
    return {
      speechModel: "universal-streaming-multilingual",
      languageDetection: true,
    };
  }

  const option = SPEECH_LANGUAGE_OPTIONS.find((item) => item.id === languageId);
  return {
    speechModel: "u3-rt-pro",
    prompt: option?.sttPrompt ?? `Transcribe ${languageId}`,
  };
}

export function loadSpeechPrefs(): SpeechPrefs {
  if (typeof window === "undefined") {
    return DEFAULT_PREFS;
  }

  try {
    const raw = window.localStorage.getItem(SPEECH_PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;

    const parsed = JSON.parse(raw) as Partial<SpeechPrefs>;
    return {
      sttLang:
        parsed.sttLang && isSpeechLanguageId(parsed.sttLang)
          ? parsed.sttLang
          : DEFAULT_PREFS.sttLang,
      ttsLang:
        parsed.ttsLang && isSpeechLanguageId(parsed.ttsLang)
          ? parsed.ttsLang
          : DEFAULT_PREFS.ttsLang,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveSpeechPrefs(patch: Partial<SpeechPrefs>): SpeechPrefs {
  const next = { ...loadSpeechPrefs(), ...patch };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SPEECH_PREFS_KEY, JSON.stringify(next));
  }
  return next;
}
