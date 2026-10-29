import { Capacitor } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import { SpeechRecognition } from "@capgo/capacitor-speech-recognition";
import type {
  SpeechRecognitionPermissionStatus,
  SpeechRecognitionAvailability,
  SpeechRecognitionPartialResultEvent,
  SpeechRecognitionListeningEvent,
  SpeechRecognitionErrorEvent,
} from "@capgo/capacitor-speech-recognition";

let activeSpeechRecognitionPlugin: any = SpeechRecognition;

/**
 * Returns the speech recognition plugin instance (defaults to @capgo/capacitor-speech-recognition).
 */
export function getSpeechRecognitionPlugin(): typeof SpeechRecognition {
  return activeSpeechRecognitionPlugin;
}

/**
 * Injects a speech recognition plugin instance (useful for automated testing without hardware).
 */
export function setSpeechRecognitionPlugin(plugin: any): void {
  activeSpeechRecognitionPlugin = plugin;
}

// Web Speech API interfaces for cross-browser compatibility
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

/**
 * Checks whether the current runtime is native Android via Capacitor.
 */
export function isAndroidNative(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  } catch {
    return false;
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (isAndroidNative()) {
    return true;
  }
  if (typeof window === "undefined") return false;
  const win = window as IWindow;
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.speechSynthesis);
}

/**
 * Extracts and normalizes transcribed text from a native plugin event.
 */
export function extractNativeTranscript(event: any): string {
  if (!event) return "";
  if (typeof event.accumulatedText === "string" && event.accumulatedText.trim()) {
    return event.accumulatedText.trim();
  }
  const match =
    Array.isArray(event.matches) && event.matches[0]
      ? String(event.matches[0]).trim()
      : "";
  if (typeof event.accumulated === "string" && event.accumulated.trim()) {
    return match ? `${event.accumulated.trim()} ${match}` : event.accumulated.trim();
  }
  return match;
}

/**
 * Adapts a native partial-result event to the Web Speech result structure expected by TranscriptAssembler.
 */
export function adaptNativeSpeechEvent(
  nativeEvent: any,
  isFinal = false
): { resultIndex: number; results: any[] } {
  const text = extractNativeTranscript(nativeEvent);
  return {
    resultIndex: 0,
    results: text
      ? [Object.assign([{ transcript: text, text }], { isFinal })]
      : [],
  };
}

/**
 * Explicit speech recognition states for clear UI state machines.
 */
export type SpeechState =
  | "idle"
  | "starting"
  | "listening"
  | "processing"
  | "submitting"
  | "error";

/**
 * Friendly, actionable error messages for browser and Android native speech recognition errors.
 */
export function getSpeechRecognitionErrorMessage(error: any): string {
  const errCode = typeof error === "string" ? error : error?.code || error?.error || error?.message || "";
  switch (errCode) {
    case "not-allowed":
    case "permission-denied":
    case "INSUFFICIENT_PERMISSIONS":
      return isAndroidNative()
        ? "Microphone access was denied. Please allow microphone permissions in your Android app settings."
        : "Microphone access was denied. Please allow microphone permissions in your browser address bar.";
    case "audio-capture":
    case "AUDIO":
      return "No microphone was detected on this device. Please connect a microphone.";
    case "no-speech":
    case "NO_MATCH":
    case "SPEECH_TIMEOUT":
      return "No speech detected. Please speak closer to the microphone.";
    case "network":
    case "NETWORK":
    case "NETWORK_TIMEOUT":
    case "SERVER":
    case "SERVER_DISCONNECTED":
      return "Speech service network connection issue. Please check your internet or type your query.";
    case "RECOGNIZER_BUSY":
      return "Speech recognition service is busy. Please try again.";
    case "aborted":
      return "Voice listening was stopped.";
    case "service-not-allowed":
      return "Speech recognition service is not permitted by your browser. Please type your query.";
    case "language-not-supported":
      return "Speech recognition language is not supported. Please type your query.";
    case "SPEECH_UNAVAILABLE":
      return "Speech recognition is not available on this device. Please install or enable Google Speech Services.";
    default:
      return errCode
        ? `Voice error (${errCode}). Please type your query.`
        : "Could not capture voice audio. Please type your query.";
  }
}

export interface SpeechSessionOptions {
  /**
   * Recognition locale (defaults to en-IN).
   */
  lang?: string;
  /**
   * Silence inactivity timeout in milliseconds (defaults to 3500ms).
   */
  silenceTimeoutMs?: number;
  /**
   * Whether to automatically stop and finalize when silence timeout fires (default true).
   */
  autoStopOnSilence?: boolean;
  /**
   * Invoked on state machine transitions.
   */
  onStateChange?: (state: SpeechState) => void;
  /**
   * Invoked on every interim or final update with the full combined transcript.
   */
  onInterimTranscript?: (combinedTranscript: string, isFinal: boolean) => void;
  /**
   * Invoked once when speech recognition finalizes a complete statement.
   */
  onFinalTranscript?: (finalTranscript: string) => void;
  /**
   * Invoked when the 3.5s silence timeout fires after speech.
   */
  onSilenceTimeout?: (finalTranscript: string) => void;
  /**
   * Invoked on error.
   */
  onError?: (errorMessage: string, rawError: any) => void;
  /**
   * Invoked when microphone hardware opens and speech engine starts.
   */
  onStart?: () => void;
  /**
   * Invoked when speech engine terminates.
   */
  onEnd?: () => void;
}

export interface TranscriptSnapshot {
  finalTranscript: string;
  interimTranscript: string;
  combinedTranscript: string;
  isComplete: boolean;
}

/**
 * Authoritative, session-scoped transcript assembler.
 * Reconstructs the transcript from Web Speech API recognition events by tracking
 * segment indices, keeping finalized and interim segments separate, replacing interim
 * hypotheses when finalized, and ensuring no segment is ever duplicated.
 */
export class TranscriptAssembler {
  private finalSegments: Map<number, string> = new Map();
  private interimSegments: Map<number, string> = new Map();

  /**
   * Resets the assembler for a new recognition session.
   */
  public reset(): void {
    this.finalSegments.clear();
    this.interimSegments.clear();
  }

  /**
   * Returns current finalized transcript.
   */
  public getFinalTranscript(): string {
    return this.getSnapshot().finalTranscript;
  }

  /**
   * Returns current combined transcript (final + interim).
   */
  public getCombinedTranscript(): string {
    return this.getSnapshot().combinedTranscript;
  }

  /**
   * Processes a Web Speech API SpeechRecognitionEvent, native partial-result event, or test mock object.
   * Supports both full results snapshots, incremental updates using event.resultIndex, and native Capacitor speech events.
   */
  public processEvent(event: any): TranscriptSnapshot {
    if (!event) {
      return this.getSnapshot();
    }

    if (!event.results && (event.matches || event.accumulatedText || event.accumulated)) {
      event = adaptNativeSpeechEvent(event, Boolean(event.isFinal));
    }

    if (!event.results) {
      return this.getSnapshot();
    }

    const results = event.results;
    const startIndex =
      typeof event.resultIndex === "number" && event.resultIndex >= 0
        ? event.resultIndex
        : 0;

    // Interim segments are transient hypotheses from the speech recognizer.
    // Clear previously stored interim results for this update.
    this.interimSegments.clear();

    // Check if the results list is an incremental slice where index 0 represents startIndex
    // (i.e. results.length <= startIndex) or standard 0-indexed full list.
    const isSlice = results.length <= startIndex && results.length > 0;

    for (let i = isSlice ? 0 : startIndex; i < results.length; ++i) {
      const res = results[i];
      if (!res) continue;

      const alt = res[0] ?? res;
      const transcript = (alt.transcript ?? alt.text ?? "").trim();
      if (!transcript) continue;

      const segIndex = isSlice ? startIndex + i : i;

      if (res.isFinal) {
        // When an interim segment becomes final, it replaces any interim version
        // and is stored permanently in finalSegments by its segment index.
        this.finalSegments.set(segIndex, transcript);
        this.interimSegments.delete(segIndex);
      } else {
        // Interim segment stored by its segment index
        this.interimSegments.set(segIndex, transcript);
      }
    }

    return this.getSnapshot();
  }

  /**
   * Reconstructs the transcript parts in strictly sorted index order.
   */
  public getSnapshot(): TranscriptSnapshot {
    const sortedFinalIndices = Array.from(this.finalSegments.keys()).sort((a, b) => a - b);
    const finalParts: string[] = [];
    for (const idx of sortedFinalIndices) {
      const text = this.finalSegments.get(idx);
      if (text) {
        finalParts.push(text);
      }
    }

    const sortedInterimIndices = Array.from(this.interimSegments.keys()).sort((a, b) => a - b);
    const interimParts: string[] = [];
    for (const idx of sortedInterimIndices) {
      const text = this.interimSegments.get(idx);
      if (text) {
        interimParts.push(text);
      }
    }

    const finalTranscript = finalParts.join(" ").trim();
    const interimTranscript = interimParts.join(" ").trim();

    let combinedTranscript = "";
    if (finalTranscript && interimTranscript) {
      combinedTranscript = `${finalTranscript} ${interimTranscript}`;
    } else {
      combinedTranscript = finalTranscript || interimTranscript;
    }

    const isComplete = interimParts.length === 0 && Boolean(finalTranscript);

    return {
      finalTranscript,
      interimTranscript,
      combinedTranscript,
      isComplete,
    };
  }
}

/**
 * Functional convenience helper for assembling speech recognition results.
 */
export function assembleSpeechResults(event: any, assembler?: TranscriptAssembler): TranscriptSnapshot {
  const instance = assembler ?? new TranscriptAssembler();
  return instance.processEvent(event);
}

export interface SpeechSessionController {
  sessionId: number;
  stop: () => void;
  abort: () => void;
  getState: () => SpeechState;
  getTranscript?: () => string;
}

// Global active session tracker to ensure no competing microphone instances
let globalSessionCounter = 0;
let globalActiveSession: {
  id: number;
  recognition?: any;
  cleanupNative?: () => void;
  assembler: TranscriptAssembler;
  silenceTimer: any;
  state: SpeechState;
  finalTranscript: string;
  latestCombined: string;
  userAborted: boolean;
  hasStarted: boolean;
  silenceFired: boolean;
} | null = null;

/**
 * Starts a reliable, tracked speech recognition session with silence detection,
 * interim result streaming, and race-condition protection.
 */
export function startSpeechSession(options: SpeechSessionOptions): SpeechSessionController {
  const sessionId = ++globalSessionCounter;
  const silenceTimeoutMs = options.silenceTimeoutMs ?? 3500;
  const autoStopOnSilence = options.autoStopOnSilence ?? true;
  const preferredLang = options.lang || "en-IN";

  // Teardown any currently active instance cleanly
  if (globalActiveSession) {
    try {
      globalActiveSession.userAborted = true;
      if (globalActiveSession.silenceTimer) {
        clearTimeout(globalActiveSession.silenceTimer);
      }
      if (globalActiveSession.cleanupNative) {
        globalActiveSession.cleanupNative();
      }
      if (globalActiveSession.recognition) {
        globalActiveSession.recognition.onstart = null;
        globalActiveSession.recognition.onspeechstart = null;
        globalActiveSession.recognition.onsoundstart = null;
        globalActiveSession.recognition.onresult = null;
        globalActiveSession.recognition.onerror = null;
        globalActiveSession.recognition.onend = null;
        globalActiveSession.recognition.abort();
      }
    } catch {
      // ignore
    }
    globalActiveSession = null;
  }

  const setState = (newState: SpeechState) => {
    if (globalActiveSession && globalActiveSession.id === sessionId) {
      globalActiveSession.state = newState;
    }
    options.onStateChange?.(newState);
  };

  if (!isSpeechRecognitionSupported()) {
    const errorMsg = isAndroidNative()
      ? "Speech recognition is not supported on this device."
      : "Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.";
    options.onError?.(errorMsg, new Error("UNSUPPORTED_BROWSER"));
    setState("error");
    return {
      sessionId,
      stop: () => {},
      abort: () => {},
      getState: () => "error",
      getTranscript: () => "",
    };
  }

  if (isAndroidNative()) {
    const plugin = getSpeechRecognitionPlugin();
    const sessionRecord = {
      id: sessionId,
      assembler: new TranscriptAssembler(),
      silenceTimer: null as any,
      state: "starting" as SpeechState,
      finalTranscript: "",
      latestCombined: "",
      userAborted: false,
      hasStarted: false,
      silenceFired: false,
      cleanupNative: null as any,
    };

    globalActiveSession = sessionRecord;

    const setNativeState = (newState: SpeechState) => {
      sessionRecord.state = newState;
      setState(newState);
    };

    setNativeState("starting");

    const clearSilenceTimer = () => {
      if (sessionRecord.silenceTimer) {
        clearTimeout(sessionRecord.silenceTimer);
        sessionRecord.silenceTimer = null;
      }
    };

    const resetSilenceTimer = () => {
      clearSilenceTimer();
      if (!autoStopOnSilence || sessionRecord.userAborted || sessionRecord.silenceFired) return;

      sessionRecord.silenceTimer = setTimeout(() => {
        if (globalActiveSession?.id !== sessionId || sessionRecord.userAborted || sessionRecord.silenceFired) {
          return;
        }
        sessionRecord.silenceFired = true;
        setNativeState("processing");

        const finalSubmission = (sessionRecord.latestCombined || sessionRecord.finalTranscript).trim();

        try {
          plugin.stop().catch(() => {});
        } catch {
          // ignore
        }

        if (options.onSilenceTimeout) {
          options.onSilenceTimeout(finalSubmission);
        } else if (finalSubmission) {
          options.onFinalTranscript?.(finalSubmission);
        }
      }, silenceTimeoutMs);
    };

    const listenerHandles: PluginListenerHandle[] = [];
    let isCleanedUp = false;

    const cleanupNative = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      const handles = listenerHandles.splice(0, listenerHandles.length);
      for (const h of handles) {
        try {
          const res = h?.remove();
          if (res && typeof (res as Promise<void>).catch === "function") {
            (res as Promise<void>).catch(() => {});
          }
        } catch {
          // ignore
        }
      }
    };

    sessionRecord.cleanupNative = () => {
      cleanupNative();
      try {
        plugin.stop().catch(() => {});
      } catch {
        // ignore
      }
    };

    const onNativeStart = () => {
      if (globalActiveSession?.id !== sessionId || sessionRecord.userAborted) return;
      if (sessionRecord.hasStarted) return;
      sessionRecord.hasStarted = true;
      setNativeState("listening");
      options.onStart?.();
      resetSilenceTimer();
    };

    (async () => {
      try {
        if (globalActiveSession?.id !== sessionId || sessionRecord.userAborted) return;

        // 1. Request microphone permission and verify granted
        let permStatus: SpeechRecognitionPermissionStatus;
        try {
          permStatus = await plugin.requestPermissions();
        } catch (permErr) {
          if (globalActiveSession?.id !== sessionId || sessionRecord.userAborted) return;
          setNativeState("error");
          clearSilenceTimer();
          cleanupNative();
          if (globalActiveSession?.id === sessionId) {
            globalActiveSession = null;
          }
          const msg = "Microphone access was denied. Please allow microphone permissions in your Android app settings.";
          options.onError?.(msg, permErr);
          return;
        }

        if (globalActiveSession?.id !== sessionId || sessionRecord.userAborted) return;

        if (permStatus?.speechRecognition !== "granted") {
          setNativeState("error");
          clearSilenceTimer();
          cleanupNative();
          if (globalActiveSession?.id === sessionId) {
            globalActiveSession = null;
          }
          const msg = "Microphone access was denied. Please allow microphone permissions in your Android app settings.";
          options.onError?.(msg, new Error("PERMISSION_DENIED"));
          return;
        }

        // 2. Check availability
        let availability: SpeechRecognitionAvailability;
        try {
          availability = await plugin.available();
        } catch (availErr) {
          if (globalActiveSession?.id !== sessionId || sessionRecord.userAborted) return;
          setNativeState("error");
          clearSilenceTimer();
          cleanupNative();
          if (globalActiveSession?.id === sessionId) {
            globalActiveSession = null;
          }
          const msg = "Speech recognition is not available on this device. Please install or enable Google Speech Services.";
          options.onError?.(msg, availErr);
          return;
        }

        if (globalActiveSession?.id !== sessionId || sessionRecord.userAborted) return;

        if (!availability?.available) {
          setNativeState("error");
          clearSilenceTimer();
          cleanupNative();
          if (globalActiveSession?.id === sessionId) {
            globalActiveSession = null;
          }
          const msg = "Speech recognition is not available on this device. Please install or enable Google Speech Services.";
          options.onError?.(msg, new Error("SPEECH_UNAVAILABLE"));
          return;
        }

        // 3. Register listeners BEFORE starting recognition
        const partialHandle = await plugin.addListener(
          "partialResults",
          (event: SpeechRecognitionPartialResultEvent) => {
            if (globalActiveSession?.id !== sessionId || sessionRecord.userAborted) return;

            resetSilenceTimer();

            const snapshot = sessionRecord.assembler.processEvent(event);
            sessionRecord.latestCombined = snapshot.combinedTranscript;

            if (snapshot.finalTranscript) {
              sessionRecord.finalTranscript = snapshot.finalTranscript;
            }

            options.onInterimTranscript?.(snapshot.combinedTranscript, snapshot.isComplete);
          }
        );
        listenerHandles.push(partialHandle);

        const stateHandle = await plugin.addListener(
          "listeningState",
          (event: SpeechRecognitionListeningEvent) => {
            if (globalActiveSession?.id !== sessionId) return;

            if (event.state === "started" || event.status === "started") {
              onNativeStart();
            } else if (event.state === "stopped" || event.status === "stopped") {
              clearSilenceTimer();
              cleanupNative();

              const finalized = (sessionRecord.latestCombined || sessionRecord.finalTranscript).trim();
              if (finalized && !sessionRecord.userAborted && !sessionRecord.silenceFired) {
                sessionRecord.silenceFired = true;
                options.onFinalTranscript?.(finalized);
              }

              if (globalActiveSession?.id === sessionId) {
                globalActiveSession = null;
              }

              if (sessionRecord.state !== "error") {
                setNativeState("idle");
              }
              options.onEnd?.();
            }
          }
        );
        listenerHandles.push(stateHandle);

        const errorHandle = await plugin.addListener(
          "error",
          (event: SpeechRecognitionErrorEvent) => {
            if (globalActiveSession?.id !== sessionId || sessionRecord.userAborted) return;
            clearSilenceTimer();
            cleanupNative();

            const errCode = event.code || "";
            if (
              (errCode === "NO_MATCH" || errCode === "SPEECH_TIMEOUT" || errCode === "no-speech" || errCode === "CLIENT") &&
              (sessionRecord.finalTranscript || sessionRecord.silenceFired || sessionRecord.latestCombined)
            ) {
              return;
            }

            const errorMsg = getSpeechRecognitionErrorMessage(errCode || event.message);
            setNativeState("error");
            options.onError?.(errorMsg, event);
          }
        );
        listenerHandles.push(errorHandle);

        if (globalActiveSession?.id !== sessionId || sessionRecord.userAborted) {
          cleanupNative();
          return;
        }

        // 4. Start recognition
        await plugin.start({
          language: preferredLang,
          maxResults: 1,
          partialResults: true,
          popup: false,
        });

        // Ensure session transitions to listening if start resolved and listeningState was slightly delayed
        onNativeStart();
      } catch (err: any) {
        setNativeState("error");
        clearSilenceTimer();
        cleanupNative();
        if (globalActiveSession?.id === sessionId) {
          globalActiveSession = null;
        }
        if (!sessionRecord.userAborted) {
          const msg = getSpeechRecognitionErrorMessage(err);
          options.onError?.(msg, err);
        }
      }
    })();

    const controller: SpeechSessionController = {
      sessionId,
      stop: () => {
        if (globalActiveSession?.id !== sessionId) return;
        clearSilenceTimer();
        setNativeState("processing");
        try {
          plugin.stop().catch(() => {});
        } catch {
          // ignore
        }
      },
      abort: () => {
        if (globalActiveSession?.id !== sessionId) return;
        sessionRecord.userAborted = true;
        clearSilenceTimer();
        cleanupNative();
        setNativeState("idle");
        try {
          plugin.stop().catch(() => {});
        } catch {
          // ignore
        }
        if (globalActiveSession?.id === sessionId) {
          globalActiveSession = null;
        }
      },
      getState: () => {
        return sessionRecord.state;
      },
      getTranscript: () => {
        return (sessionRecord.finalTranscript || sessionRecord.latestCombined).trim();
      },
    };

    return controller;
  }

  const win = window as IWindow;
  const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
  const recognition = new SpeechRecognitionClass();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.lang = preferredLang;

  const sessionRecord = {
    id: sessionId,
    recognition,
    assembler: new TranscriptAssembler(),
    silenceTimer: null as any,
    state: "starting" as SpeechState,
    finalTranscript: "",
    latestCombined: "",
    userAborted: false,
    hasStarted: false,
    silenceFired: false,
  };

  globalActiveSession = sessionRecord;
  setState("starting");

  const clearSilenceTimer = () => {
    if (sessionRecord.silenceTimer) {
      clearTimeout(sessionRecord.silenceTimer);
      sessionRecord.silenceTimer = null;
    }
  };

  const resetSilenceTimer = () => {
    clearSilenceTimer();
    if (!autoStopOnSilence || sessionRecord.userAborted || sessionRecord.silenceFired) return;

    sessionRecord.silenceTimer = setTimeout(() => {
      if (globalActiveSession?.id !== sessionId || sessionRecord.userAborted || sessionRecord.silenceFired) {
        return;
      }
      sessionRecord.silenceFired = true;
      setState("processing");

      // Extract the best available transcript before stopping (including pending interim words)
      const finalSubmission = (sessionRecord.latestCombined || sessionRecord.finalTranscript).trim();

      try {
        if (sessionRecord.hasStarted) {
          recognition.stop();
        } else {
          recognition.abort();
        }
      } catch {
        // ignore
      }

      if (options.onSilenceTimeout) {
        options.onSilenceTimeout(finalSubmission);
      } else if (finalSubmission) {
        options.onFinalTranscript?.(finalSubmission);
      }
    }, silenceTimeoutMs);
  };

  recognition.onstart = () => {
    if (globalActiveSession?.id !== sessionId || sessionRecord.userAborted) return;
    sessionRecord.hasStarted = true;
    setState("listening");
    options.onStart?.();
    resetSilenceTimer();
  };

  recognition.onspeechstart = () => {
    if (globalActiveSession?.id !== sessionId || sessionRecord.userAborted) return;
    resetSilenceTimer();
  };

  recognition.onsoundstart = () => {
    if (globalActiveSession?.id !== sessionId || sessionRecord.userAborted) return;
    resetSilenceTimer();
  };

  recognition.onresult = (event: any) => {
    if (globalActiveSession?.id !== sessionId || sessionRecord.userAborted) return;

    // Reset silence timer because user is actively speaking and results are streaming
    resetSilenceTimer();

    const snapshot = sessionRecord.assembler.processEvent(event);
    sessionRecord.latestCombined = snapshot.combinedTranscript;

    if (snapshot.finalTranscript) {
      sessionRecord.finalTranscript = snapshot.finalTranscript;
    }

    options.onInterimTranscript?.(snapshot.combinedTranscript, snapshot.isComplete);
  };

  recognition.onerror = (event: any) => {
    if (globalActiveSession?.id !== sessionId) return;
    clearSilenceTimer();

    const errCode = event.error || "";
    if (errCode === "aborted" && sessionRecord.userAborted) {
      setState("idle");
      return;
    }

    // Ignore no-speech if we already captured a transcript and silence fired
    if (errCode === "no-speech" && (sessionRecord.finalTranscript || sessionRecord.silenceFired)) {
      return;
    }

    const errorMsg = getSpeechRecognitionErrorMessage(errCode);
    setState("error");
    options.onError?.(errorMsg, event);
  };

  recognition.onend = () => {
    if (globalActiveSession?.id !== sessionId) return;
    clearSilenceTimer();

    const finalized = (sessionRecord.latestCombined || sessionRecord.finalTranscript).trim();
    if (finalized && !sessionRecord.userAborted && !sessionRecord.silenceFired) {
      options.onFinalTranscript?.(finalized);
    }

    if (globalActiveSession?.id === sessionId) {
      globalActiveSession = null;
    }

    if (sessionRecord.state !== "error") {
      setState("idle");
    }
    options.onEnd?.();
  };

  try {
    recognition.start();
  } catch (err) {
    clearSilenceTimer();
    if (globalActiveSession?.id === sessionId) {
      globalActiveSession = null;
    }
    const msg = getSpeechRecognitionErrorMessage(err);
    setState("error");
    options.onError?.(msg, err);
  }

  const controller: SpeechSessionController = {
    sessionId,
    stop: () => {
      if (globalActiveSession?.id !== sessionId) return;
      clearSilenceTimer();
      setState("processing");
      try {
        if (sessionRecord.hasStarted) {
          recognition.stop();
        } else {
          recognition.abort();
        }
      } catch {
        // ignore
      }
    },
    abort: () => {
      if (globalActiveSession?.id !== sessionId) return;
      sessionRecord.userAborted = true;
      clearSilenceTimer();
      setState("idle");
      try {
        recognition.abort();
      } catch {
        // ignore
      }
      if (globalActiveSession?.id === sessionId) {
        globalActiveSession = null;
      }
    },
    getState: () => {
      return sessionRecord.state;
    },
    getTranscript: () => {
      return (sessionRecord.finalTranscript || sessionRecord.latestCombined).trim();
    },
  };

  return controller;
}

/**
 * Backward compatibility wrapper for existing startSpeechRecognition callers.
 */
export function startSpeechRecognition(
  optionsOrTranscript:
    | {
        onTranscript: (text: string, isFinal: boolean) => void;
        onError?: (errorMessage: string, rawError: any) => void;
        onStart?: () => void;
        onEnd?: () => void;
      }
    | ((text: string, isFinal: boolean) => void),
  legacyOnError?: (error: any) => void,
  legacyOnEnd?: () => void
): () => void {
  const options =
    typeof optionsOrTranscript === "function"
      ? {
          onTranscript: optionsOrTranscript,
          onError: (msg: string, err: any) => legacyOnError?.(err || msg),
          onEnd: legacyOnEnd,
        }
      : optionsOrTranscript;

  const controller = startSpeechSession({
    autoStopOnSilence: false,
    onInterimTranscript: (combined, isFinal) => options.onTranscript(combined, isFinal),
    onFinalTranscript: (finalText) => options.onTranscript(finalText, true),
    onError: (msg, err) => options.onError?.(msg, err),
    onStart: options.onStart,
    onEnd: options.onEnd,
  });

  return () => controller.abort();
}

/**
 * Strips markdown, code blocks, raw JSON, and URLs to produce natural spoken speech.
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return "";

  let clean = text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\{[\s\S]*?\}/g, "")
    .replace(/[#*_~>]/g, "")
    .replace(/^[•\-\*]\s+/gm, "")
    .replace(/(\d+)\s*\/\s*10/g, "$1 out of 10")
    .replace(/\s+/g, " ")
    .trim();

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
