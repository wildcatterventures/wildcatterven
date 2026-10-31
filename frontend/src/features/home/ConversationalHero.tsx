import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Mic,
  MicOff,
  GraduationCap,
  Stethoscope,
  Briefcase,
  Palette,
  MoreHorizontal,
  Sparkles,
  Loader2,
  X,
} from "lucide-react";
import {
  isSpeechRecognitionSupported,
  startSpeechSession,
  SpeechSessionController,
  SpeechState,
} from "../../lib/voice";

interface ConversationalHeroProps {
  onSearch: (query: string) => void;
  onOpenAssistantWithQuery: (query: string) => void;
  onExplore: () => void;
  onRate: () => void;
  onMatch?: () => void;
}

export const ConversationalHero: React.FC<ConversationalHeroProps> = ({
  onSearch,
  onOpenAssistantWithQuery,
  onExplore,
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

    setQuery("");
    lastSearchedRef.current = "";

    const controller = startSpeechSession({
      silenceTimeoutMs: 3500,
      autoStopOnSilence: true,
      onStateChange: (state) => {
        setSpeechState(state);
      },
      onInterimTranscript: (combined) => {
        setQuery(combined);
      },
      onSilenceTimeout: (finalTranscript) => {
        const target = (finalTranscript || query).trim();
        if (target) {
          setQuery(target);
          executeSearch(target);
        } else {
          setSpeechState("idle");
        }
      },
      onFinalTranscript: (transcript) => {
        const target = transcript.trim();
        if (target) {
          setQuery(target);
          executeSearch(target);
        }
      },
      onError: (err) => {
        setVoiceError(err);
        setSpeechState("idle");
      },
    });

    sessionControllerRef.current = controller;
  };

  const isConversational = (text: string): boolean => {
    const lower = text.toLowerCase();
    return (
      lower.startsWith("how") ||
      lower.startsWith("what") ||
      lower.startsWith("tell me") ||
      lower.startsWith("compare") ||
      lower.startsWith("is ") ||
      lower.startsWith("which") ||
      lower.startsWith("show me") ||
      lower.startsWith("find me") ||
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

  const categoryChips = [
    { label: "Engineering", icon: GraduationCap, query: "Engineering" },
    { label: "Medical", icon: Stethoscope, query: "Medical" },
    { label: "MBA", icon: Briefcase, query: "MBA" },
    { label: "Arts", icon: Palette, query: "Arts" },
    { label: "More", icon: MoreHorizontal, query: "" },
  ];

  return (
    <section className="pt-4 sm:pt-8 pb-3 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto font-sans">
      {/* Display Heading (Matches Reference Image 1 Screen 3 & Image 2 Screen 4) */}
      <div className="mb-4 text-left">
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-charcoal tracking-tight leading-tight">
          Find your college, your way.
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-muted mt-1 leading-relaxed">
          Authentic reviews, ratings, and unfiltered campus insights.
        </p>
      </div>

      {/* Pill Search Input Form (Matches Reference Image 1 Screen 3) */}
      <form onSubmit={handleSubmit} className="relative mb-5">
        <div
          className={`flex items-center w-full bg-white rounded-full border px-4 py-2.5 sm:py-3 shadow-subtle transition-all ${
            isListening
              ? "border-olive ring-2 ring-olive/20"
              : "border-warm-grey focus-within:border-charcoal focus-within:ring-1 focus-within:ring-charcoal/10"
          }`}
        >
          <Search className="w-4 h-4 text-charcoal-muted shrink-0 mr-2.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isListening
                ? "Listening... speak now"
                : "Search colleges, cities or courses..."
            }
            className="w-full bg-transparent text-xs sm:text-sm text-charcoal placeholder:text-charcoal-muted/60 focus:outline-none font-sans"
          />

          {query && !isListening && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 text-charcoal-muted hover:text-charcoal shrink-0 mr-1"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleVoiceToggle}
            title={isListening ? "Cancel voice" : "Voice search"}
            className={`p-1.5 rounded-full transition-colors shrink-0 ml-1 ${
              isListening
                ? "bg-rose-600 text-white animate-pulse"
                : "text-charcoal-muted hover:text-charcoal hover:bg-warm-grey-light"
            }`}
            aria-label="Voice search"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>
      </form>

      {/* Live Voice Feedback Strip */}
      {(isListening || isProcessing) && (
        <div className="mb-4 p-2.5 rounded-xl bg-card border border-olive/30 shadow-subtle flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
            </span>
            <span className="text-charcoal font-medium">
              {isListening ? "Listening for your search..." : "Searching..."}
            </span>
          </div>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-olive" />
        </div>
      )}

      {voiceError && (
        <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{voiceError}</span>
          <button type="button" onClick={() => setVoiceError(null)} className="font-bold text-xs">
            ×
          </button>
        </div>
      )}

      {/* 5 Category Quick Filter Circles (Matches Reference Image 1 Screen 3) */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3 py-1 mb-4 select-none">
        {categoryChips.map((chip) => {
          const Icon = chip.icon;
          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => {
                if (chip.query) {
                  onSearch(chip.query);
                } else {
                  onExplore();
                }
              }}
              className="flex flex-col items-center justify-center group focus:outline-none"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-card border border-warm-grey group-hover:border-charcoal group-hover:bg-white flex items-center justify-center text-charcoal shadow-subtle transition-all duration-200 group-active:scale-95">
                <Icon className="w-5 h-5 text-charcoal group-hover:text-olive transition-colors" />
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-charcoal mt-1.5 group-hover:text-charcoal transition-colors truncate max-w-full">
                {chip.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* AI Suggested Query Pill (Matches Reference Image 1 Screen 9) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <button
          type="button"
          onClick={() => onOpenAssistantWithQuery("Tell me about top colleges in Mumbai")}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-olive-light/60 border border-olive/30 text-olive text-[11px] font-semibold whitespace-nowrap shrink-0 hover:bg-olive hover:text-white transition-colors"
        >
          <Sparkles className="w-3 h-3" />
          <span>Ask AI Assistant</span>
        </button>
        {["Colleges in Pune", "Top Engineering", "Placement records"].map((sample) => (
          <button
            key={sample}
            type="button"
            onClick={() => onSearch(sample)}
            className="px-3 py-1 rounded-full bg-card border border-warm-grey hover:border-charcoal text-[11px] font-sans text-charcoal-muted whitespace-nowrap shrink-0 transition-colors"
          >
            {sample}
          </button>
        ))}
      </div>
    </section>
  );
};
