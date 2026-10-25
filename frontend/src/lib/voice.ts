// Web Speech API interfaces for cross-browser compatibility
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const win = window as IWindow;
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.speechSynthesis);
}

/**
 * Friendly error messages for common speech recognition failures.
 */
export function getSpeechRecognitionErrorMessage(error: any): string {
  const errCode = typeof error === "string" ? error : error?.error || error?.message || "";
  switch (errCode) {
    case "not-allowed":
    case "permission-denied":
      return "Microphone access was denied. Please allow microphone permissions in your browser address bar.";
    case "audio-capture":
      return "No microphone was detected on this device. Please connect a microphone.";
    case "no-speech":
      return "No speech detected. Please speak closer to the microphone.";
    case "network":
      return "Speech service network connection issue. Please check your internet or type your query.";
    case "aborted":
      return "Voice listening was stopped.";
    case "service-not-allowed":
      return "Speech recognition service is not permitted by your browser. Please type your query.";
    case "language-not-supported":
      return "Speech recognition language is not supported. Please type your query.";
    default:
      return errCode ? `Voice error (${errCode}). Please type your query.` : "Could not capture voice audio. Please type your query.";
  }
}

export interface SpeechRecognitionOptions {
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (errorMessage: string, rawError: any) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

let activeRecognitionInstance: any = null;

export function startSpeechRecognition(
  optionsOrTranscript:
    | SpeechRecognitionOptions
    | ((text: string, isFinal: boolean) => void),
  legacyOnError?: (error: any) => void,
  legacyOnEnd?: () => void
): () => void {
  // Support both legacy (callback arguments) and new options object format
  const options: SpeechRecognitionOptions =
    typeof optionsOrTranscript === "function"
      ? {
          onTranscript: optionsOrTranscript,
          onError: (msg, err) => legacyOnError?.(err || msg),
          onEnd: legacyOnEnd,
        }
      : optionsOrTranscript;

  if (!isSpeechRecognitionSupported()) {
    options.onError?.(
      "Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.",
      new Error("UNSUPPORTED_BROWSER")
    );
    return () => {};
  }

  // Teardown any existing active instance cleanly to prevent duplicate events or memory leaks
  if (activeRecognitionInstance) {
    try {
      activeRecognitionInstance.onstart = null;
      activeRecognitionInstance.onresult = null;
      activeRecognitionInstance.onerror = null;
      activeRecognitionInstance.onend = null;
      activeRecognitionInstance.abort();
    } catch {
      // ignore
    }
    activeRecognitionInstance = null;
  }

  const win = window as IWindow;
  const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
  const recognition = new SpeechRecognitionClass();
  activeRecognitionInstance = recognition;

  // Use continuous listening with interim results so phrases are captured naturally
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  // Determine user's preferred language, falling back to browser default or en-IN
  let preferredLang = "en-IN";
  if (typeof navigator !== "undefined") {
    if (navigator.language) {
      preferredLang = navigator.language;
    } else if (navigator.languages && navigator.languages.length > 0) {
      preferredLang = navigator.languages[0];
    }
  }
  recognition.lang = preferredLang;

  let userStopped = false;
  let hasStarted = false;
  let latestFullTranscript = "";

  recognition.onstart = () => {
    hasStarted = true;
    options.onStart?.();
  };

  recognition.onresult = (event: any) => {
    if (userStopped) return;

    let finalParts = "";
    let interimParts = "";

    // Iterate through all results to build the full transcript without dropping prior phrases
    for (let i = 0; i < event.results.length; ++i) {
      const res = event.results[i];
      if (!res || !res[0]) continue;
      const transcript = res[0].transcript || "";
      if (res.isFinal) {
        finalParts += (finalParts ? " " : "") + transcript.trim();
      } else {
        interimParts += (interimParts ? " " : "") + transcript.trim();
      }
    }

    const currentCombined = (finalParts + (finalParts && interimParts ? " " : "") + interimParts).trim();
    if (currentCombined) {
      latestFullTranscript = currentCombined;
      const isComplete = !interimParts && Boolean(finalParts);
      options.onTranscript(currentCombined, isComplete);
    }
  };

  recognition.onerror = (event: any) => {
    const errCode = event.error || "";
    // If user stopped listening manually, do not show error banner
    if (errCode === "aborted" && userStopped) {
      return;
    }
    const errorMsg = getSpeechRecognitionErrorMessage(errCode);
    options.onError?.(errorMsg, event);
  };

  recognition.onend = () => {
    activeRecognitionInstance = null;
    if (latestFullTranscript) {
      options.onTranscript(latestFullTranscript, true);
    }
    options.onEnd?.();
  };

  try {
    recognition.start();
  } catch (err) {
    activeRecognitionInstance = null;
    const msg = getSpeechRecognitionErrorMessage(err);
    options.onError?.(msg, err);
  }

  return () => {
    userStopped = true;
    try {
      if (hasStarted) {
        recognition.stop();
      } else {
        recognition.abort();
      }
    } catch {
      // ignore
    }
    activeRecognitionInstance = null;
  };
}

/**
 * Strips markdown, code blocks, raw JSON, and URLs to produce natural spoken speech.
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return "";

  let clean = text
    // Remove markdown links [Label](url) -> Label
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove bare URLs
    .replace(/https?:\/\/\S+/g, "")
    // Remove markdown code blocks and inline backticks
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    // Remove raw JSON objects or arrays
    .replace(/\{[\s\S]*?\}/g, "")
    // Remove markdown headers, bold, italics, bullets, blockquotes
    .replace(/[#*_~>]/g, "")
    // Normalize bullets
    .replace(/^[•\-\*]\s+/gm, "")
    // Clean fractions/scores like 100/100 -> 100
    .replace(/(\d+)\s*\/\s*10/g, "$1 out of 10")
    // Clean excessive whitespaces
    .replace(/\s+/g, " ")
    .trim();

  // If text is excessively long (over 450 characters), keep the first 2 concise sentences
  if (clean.length > 450) {
    const sentences = clean.split(/(?<=[.!?])\s+/);
    clean = sentences.slice(0, 3).join(" ");
  }

  return clean;
}

let activeUtterance: SpeechSynthesisUtterance | null = null;

export function isSpeaking(): boolean {
  if (!isSpeechSynthesisSupported()) return false;
  return Boolean(window.speechSynthesis.speaking || activeUtterance);
}

export function speakText(
  text: string,
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): void {
  if (!isSpeechSynthesisSupported()) return;

  try {
    // Cancel any running speech immediately
    stopSpeaking();

    const spokenText = cleanTextForSpeech(text);
    if (!spokenText) {
      options?.onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(spokenText);
    activeUtterance = utterance;

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick an English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(
      (v) => v.lang.startsWith("en-IN") || v.lang.startsWith("en-US") || v.lang.startsWith("en-GB")
    );
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => {
      options?.onStart?.();
    };

    utterance.onend = () => {
      activeUtterance = null;
      options?.onEnd?.();
    };

    utterance.onerror = (err) => {
      activeUtterance = null;
      options?.onError?.(err);
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    activeUtterance = null;
    options?.onError?.(err);
  }
}

export function stopSpeaking(): void {
  if (!isSpeechSynthesisSupported()) return;
  try {
    activeUtterance = null;
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
}
