import React, { useState, useRef, useEffect } from "react";
import { Search, Mic, MicOff, ArrowRight, BookOpen, MessageSquareQuote, Sparkles, X, Loader2 } from "lucide-react";

import { isSpeechRecognitionSupported, startSpeechSession, SpeechSessionController, SpeechState } from "../../lib/voice";

interface ConversationalHeroProps {
  onSearch: (query: string) => void;
  onOpenAssistantWithQuery: (query: string) => void;
  onExplore: () => void;
  onRate: () => void;
}

export const ConversationalHero: React.FC<ConversationalHeroProps> = ({
  onSearch,
  onOpenAssistantWithQuery,
  onExplore,
  onRate,
}) => {
  const [query, setQuery] = useState("");
  const [speechState, setSpeechState] = useState<SpeechState>("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const sessionControllerRef = useRef<SpeechSessionController | null>(null);
  const lastSearchedRef = useRef<string>("");

  useEffect(() => {
    return () => {
      if (sessionControllerRef.current) {
        sessionControllerRef.current.abort();
        sessionControllerRef.current = null;
      }
    };
  }, []);

  const isListening = speechState === "listening" || speechState === "starting";
  const isProcessing = speechState === "processing" || speechState === "submitting";

  const executeSearch = (rawQuery: string) => {
    const cleanQuery = rawQuery.trim();
    if (!cleanQuery) {
      setSpeechState("idle");
      return;
    }

    if (lastSearchedRef.current === cleanQuery) {
      setSpeechState("idle");
      return;
    }
    lastSearchedRef.current = cleanQuery;
    setSpeechState("submitting");

    if (isConversational(cleanQuery)) {
      onOpenAssistantWithQuery(cleanQuery);
    } else {
      onSearch(cleanQuery);
    }

    setTimeout(() => {
      setSpeechState("idle");
    }, 1000);
  };

  const handleVoiceToggle = () => {
    setVoiceError(null);

    // If currently listening, clicking mic acts as Cancel
    if (isListening || isProcessing) {
      if (sessionControllerRef.current) {
        sessionControllerRef.current.abort();
        sessionControllerRef.current = null;
      }
      setSpeechState("idle");
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setVoiceError("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    // SECTION 3.A: Immediately clear previous search text on new session
    setQuery("");
    lastSearchedRef.current = "";

    const controller = startSpeechSession({
      silenceTimeoutMs: 3500, // 3.5 seconds inactivity timeout
      autoStopOnSilence: true,
      onStateChange: (state) => {
        setSpeechState(state);
      },
      onInterimTranscript: (combined) => {
        // SECTION 3.B: Live dynamic transcription inside search field
        setQuery(combined);
      },
      onSilenceTimeout: (finalTranscript) => {
        // SECTION 3.C & 3.D: Auto stop and search after 3.5s silence
        const target = (finalTranscript || query).trim();
        if (target) {
          setQuery(target);
          executeSearch(target);
        }
      },
      onFinalTranscript: (finalTranscript) => {
        // Handle pending final results if speech engine finalized and stopped before silence timeout
        const target = (finalTranscript || query).trim();
        if (target) {
          setQuery(target);
          executeSearch(target);
        }
      },
      onError: (errorMsg) => {
        sessionControllerRef.current = null;
        setSpeechState("error");
        setVoiceError(errorMsg);
      },
      onEnd: () => {
        sessionControllerRef.current = null;
      },
    });

    sessionControllerRef.current = controller;
  };

  const handleStopAndSearch = () => {
    if (sessionControllerRef.current) {
      sessionControllerRef.current.stop();
      sessionControllerRef.current = null;
    }
    executeSearch(query);
  };

  const handleCancelVoice = () => {
    if (sessionControllerRef.current) {
      sessionControllerRef.current.abort();
      sessionControllerRef.current = null;
    }
    setSpeechState("idle");
  };

  const isConversational = (text: string) => {
    const lower = text.toLowerCase().trim();
    return (
      lower.startsWith("what") ||
      lower.startsWith("how") ||
      lower.startsWith("why") ||
      lower.startsWith("tell") ||
      lower.startsWith("can") ||
      lower.startsWith("is ") ||
      lower.startsWith("which") ||
      lower.startsWith("show me") ||
      lower.startsWith("find me") ||
      lower.includes("score of") ||
      lower.includes("ratings at") ||
      lower.includes("placements at") ||
      lower.includes("hostels at") ||
      lower.includes("reviews for") ||
      lower.endsWith("?")
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionControllerRef.current) {
      sessionControllerRef.current.stop();
      sessionControllerRef.current = null;
    }
    executeSearch(query);
  };

  return (
    <section className="relative overflow-hidden bg-paper flex items-center">
      {/* 1. Cinematic Full-Bleed Campus Photograph Layer (Both Mobile and Desktop) */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
        <img
          src="/images/hero_quad.jpg"
          alt="Indian university campus quad with students gathered on stone steps in candid discussion"
          className="w-full h-full object-cover object-[78%_35%] md:object-[75%_35%] lg:object-[72%_30%] translate-x-[8%] md:translate-x-[10%] transition-opacity duration-700 opacity-80 sm:opacity-90 md:opacity-100"
          loading="eager"
        />

        {/* Multi-stop horizontal ivory gradient blend */}
        <div className="hero-gradient-horizontal" />

        {/* Top subtle fade for seamless header border blend */}
        <div className="hero-top-fade" />

        {/* Bottom subtle fade for seamless divider transition */}
        <div className="hero-bottom-fade" />
      </div>

      {/* 2. Left-Anchored Editorial & Interactive Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6 sm:py-12 md:py-20 lg:py-24">
        <div className="max-w-xl lg:max-w-2xl flex flex-col justify-center">
          {/* Display Headline */}
          <h1 className="font-serif text-3xl xs:text-4xl sm:text-5xl lg:text-[3.75rem] font-bold tracking-tight text-charcoal mb-2.5 sm:mb-4 leading-[1.12]">
            College life. <br />
            <span className="italic font-normal text-olive">Without the editing.</span>
          </h1>

          {/* Concise Supporting Text */}
          <p className="text-xs sm:text-base text-charcoal-muted max-w-xl mb-3 sm:mb-5 leading-relaxed font-sans">
            Surface the lived experiences behind prospectus claims. Unedited ratings across food quality, hostels, faculty accessibility, ragging prevention, and placements—governed by deterministic 20-submission blocks.
          </p>

          {/* Micro-label above search for focal clarity */}
          <label htmlFor="hero-search-input" className="block text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-charcoal/70 mb-1.5 font-medium">
            Search verified metrics or ask AI directly
          </label>

          {/* Conversational Text & Voice Search Box */}
          <form
            onSubmit={handleSubmit}
            className={`editorial-card p-1 sm:p-1.5 bg-card shadow-card max-w-xl mb-2.5 sm:mb-3 transition-all rounded flex items-center gap-1.5 ${
              isListening ? "border-olive ring-2 ring-olive/20" : "border-charcoal/20 focus-within:border-olive focus-within:ring-2 focus-within:ring-olive/20"
            }`}
          >
            <Search className="w-4 h-4 text-charcoal-muted ml-2 shrink-0" />
            <input
              id="hero-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isListening
                  ? "Listening... speak query now"
                  : "Search colleges, city, or ask AI..."
              }
              className="w-full bg-transparent px-2 py-2 text-xs sm:text-sm text-charcoal placeholder:text-charcoal-muted/60 focus:outline-none font-sans min-w-0"
            />
            <button
              type="button"
              onClick={handleVoiceToggle}
              title={isListening ? "Cancel voice search" : "Search with voice"}
              className={`w-9 h-9 flex items-center justify-center rounded transition-colors shrink-0 ${
                isListening
                  ? "bg-rose-600 text-white animate-pulse"
                  : "text-charcoal-muted hover:text-charcoal hover:bg-warm-grey-light"
              }`}
              aria-label={isListening ? "Cancel voice search" : "Search with voice"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="btn-primary min-h-[38px] px-3.5 py-2 text-xs font-semibold flex items-center justify-center gap-1 shrink-0 rounded"
              title="Search or explore"
            >
              {isProcessing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span className="hidden xs:inline">Search</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* SECTION 3.E: Live Speech Feedback & Controls Strip */}
          {(isListening || isProcessing) && (
            <div className="mb-3 p-2.5 rounded bg-card/95 border border-olive/40 shadow-xs flex items-center justify-between gap-2 max-w-xl animate-in fade-in text-xs font-sans">
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
                </span>
                <span className="font-medium text-charcoal truncate">
                  {speechState === "starting" && "Opening microphone..."}
                  {speechState === "listening" && (
                    <>
                      Listening... <span className="text-charcoal-muted font-normal hidden sm:inline">(auto-searches after 3.5s silence)</span>
                    </>
                  )}
                  {speechState === "processing" && "Finishing what you said..."}
                  {speechState === "submitting" && `Searching for "${query}"...`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleStopAndSearch}
                  disabled={!query.trim()}
                  className="px-2.5 py-1 rounded bg-olive text-paper hover:bg-olive-dark text-[11px] font-semibold flex items-center gap-1 disabled:opacity-40 transition-colors min-h-[28px]"
                  title="Search immediately without waiting for silence"
                >
                  <span>Search Now</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={handleCancelVoice}
                  className="p-1 rounded text-charcoal-muted hover:text-charcoal hover:bg-warm-grey-light transition-colors min-h-[28px] min-w-[28px] flex items-center justify-center"
                  title="Cancel voice search"
                  aria-label="Cancel voice search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Voice Feedback / Error Banner */}
          {voiceError && (
            <div className="mb-3 p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between max-w-xl">
              <span>{voiceError}</span>
              <button
                type="button"
                onClick={() => setVoiceError(null)}
                className="text-rose-600 hover:text-rose-900 font-bold ml-2 text-sm"
              >
                ×
              </button>
            </div>
          )}

          {/* Suggested Prompt Chips & AI Trigger */}
          <div className="flex flex-wrap items-center gap-1.5 max-w-xl mb-5 sm:mb-6">
            <button
              type="button"
              onClick={() => {
                const targetQuery = query.trim() || "What can you tell me about the colleges on Campus Uncut?";
                onOpenAssistantWithQuery(targetQuery);
              }}
              title="Ask AI Assistant directly"
              className="px-2.5 py-1.5 rounded-full bg-olive-light border border-olive/40 text-olive hover:bg-olive hover:text-paper text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors shadow-2xs"
            >
              <Sparkles className="w-3 h-3" />
              <span>Ask AI</span>
            </button>
            {[
              "Search SFIT",
              "Score of COEP",
              "Placements at VJTI",
              "Colleges in Mumbai",
            ].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => onOpenAssistantWithQuery(sample)}
                className="px-2.5 py-1.5 rounded-full bg-card border border-warm-grey hover:border-olive hover:text-charcoal text-[11px] font-sans shrink-0 transition-colors shadow-2xs"
              >
                {sample}
              </button>
            ))}
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2.5 sm:gap-3 max-w-md">
            <button
              onClick={onExplore}
              className="btn-primary min-h-[44px] text-xs py-2.5 px-5 font-semibold flex items-center justify-center gap-2 shadow-xs"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explore Directory</span>
            </button>
            <button
              onClick={onRate}
              className="btn-secondary min-h-[44px] text-xs py-2.5 px-5 font-semibold bg-card border border-warm-grey hover:border-charcoal text-charcoal flex items-center justify-center gap-2 shadow-xs"
            >
              <MessageSquareQuote className="w-4 h-4 text-olive" />
              <span>Rate Your Campus</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
