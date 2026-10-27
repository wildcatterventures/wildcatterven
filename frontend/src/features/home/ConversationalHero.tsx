import React, { useState, useRef, useEffect } from "react";
import { Search, Mic, MicOff, ArrowRight, BookOpen, MessageSquareQuote, Sparkles } from "lucide-react";

import { isSpeechRecognitionSupported, startSpeechRecognition } from "../../lib/voice";

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
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);
  const baseTextRef = useRef<string>("");

  useEffect(() => {
    return () => {
      if (stopListeningRef.current) stopListeningRef.current();
    };
  }, []);

  const handleVoiceToggle = () => {
    setVoiceError(null);
    if (isListening) {
      if (stopListeningRef.current) {
        stopListeningRef.current();
        stopListeningRef.current = null;
      }
      setIsListening(false);
    } else {
      if (!isSpeechRecognitionSupported()) {
        setVoiceError("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
        return;
      }
      baseTextRef.current = query.trim();
      setIsListening(true);
      const stop = startSpeechRecognition({
        onStart: () => {
          setIsListening(true);
          setVoiceError(null);
        },
        onTranscript: (transcript) => {
          const base = baseTextRef.current;
          const combined = base ? `${base} ${transcript.trim()}` : transcript;
          setQuery(combined);
        },
        onError: (errorMsg) => {
          setIsListening(false);
          stopListeningRef.current = null;
          setVoiceError(errorMsg);
        },
        onEnd: () => {
          setIsListening(false);
          stopListeningRef.current = null;
        },
      });
      stopListeningRef.current = stop;
    }
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
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    if (isConversational(cleanQuery)) {
      onOpenAssistantWithQuery(cleanQuery);
    } else {
      onSearch(cleanQuery);
    }
  };

  return (
    <section className="relative overflow-hidden bg-paper min-h-[500px] sm:min-h-[580px] md:min-h-[620px] lg:min-h-[660px] flex items-center">
      {/* 1. Cinematic Full-Bleed Campus Photograph Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
        <img
          src="/images/hero_quad.jpg"
          alt="Indian university campus quad with students gathered on stone steps in candid discussion"
          className="w-full h-full object-cover object-[78%_35%] md:object-[75%_35%] lg:object-[72%_30%] translate-x-[10%] transition-opacity duration-700"
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
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8 sm:py-14 md:py-20 lg:py-24">
        <div className="max-w-xl lg:max-w-2xl flex flex-col justify-center">
          
          {/* Small Editorial Header Label */}
          <div className="inline-flex items-center gap-2 mb-3 sm:mb-4 self-start flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-olive-light text-olive border border-olive/30">
              Vol. 01 • Student Intelligence
            </span>
            <span className="text-[11px] font-mono text-charcoal-muted">
              Mumbai • Bhopal • Coimbatore
            </span>
          </div>

          {/* Display Headline */}
          <h1 className="font-serif text-3xl xs:text-4xl sm:text-5xl lg:text-[3.75rem] font-bold tracking-tight text-charcoal mb-3 sm:mb-4 leading-[1.12]">
            College life. <br />
            <span className="italic font-normal text-olive">Without the editing.</span>
          </h1>

          {/* Concise Supporting Text */}
          <p className="text-xs sm:text-base text-charcoal-muted max-w-xl mb-5 sm:mb-8 leading-relaxed font-sans">
            Surface the lived experiences behind prospectus claims. Unedited ratings across food quality, hostels, faculty accessibility, ragging prevention, and placements—governed by deterministic 20-submission blocks.
          </p>

          {/* Micro-label above search for focal clarity */}
          <label htmlFor="hero-search-input" className="block text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-charcoal/70 mb-2 font-medium">
            Search verified metrics or ask AI directly
          </label>

          {/* Conversational Text & Voice Search Box */}
          <form
            onSubmit={handleSubmit}
            className="editorial-card p-1.5 sm:p-2 bg-card/95 backdrop-blur-sm shadow-card max-w-xl mb-4 border-charcoal/20 focus-within:border-olive focus-within:ring-2 focus-within:ring-olive/20 transition-all rounded flex flex-col xs:flex-row items-stretch xs:items-center gap-2"
          >
            <div className="flex items-center flex-1 min-w-0">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-charcoal-muted ml-2 sm:ml-2.5 flex-shrink-0" />
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
                className="w-full bg-transparent px-2.5 py-2 text-xs sm:text-sm text-charcoal placeholder:text-charcoal-muted/60 focus:outline-none font-sans min-w-0"
              />
              <button
                type="button"
                onClick={handleVoiceToggle}
                title={isListening ? "Stop listening" : "Speak search with voice"}
                className={`min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded transition-colors flex-shrink-0 ${
                  isListening
                    ? "bg-rose-600 text-white animate-pulse"
                    : "text-charcoal-muted hover:text-charcoal hover:bg-warm-grey-light"
                }`}
                aria-label={isListening ? "Stop listening" : "Voice search"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-1.5 xs:gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  const targetQuery = query.trim() || "What can you tell me about the colleges on Campus Uncut?";
                  onOpenAssistantWithQuery(targetQuery);
                }}
                title="Ask Groq AI Assistant"
                className="flex-1 xs:flex-initial min-h-[40px] px-3 py-2 rounded bg-olive-light border border-olive/30 text-olive hover:bg-olive hover:text-paper text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI</span>
              </button>

              <button
                type="submit"
                className="btn-primary flex-1 xs:flex-initial min-h-[40px] py-2 px-4 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <span>Explore</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Voice Feedback / Error Banner */}
          {voiceError && (
            <div className="mb-4 p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between max-w-xl">
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

          {/* Suggested Prompt Chips */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs text-charcoal-muted max-w-xl mb-6 sm:mb-7">
            <span className="font-mono text-[10px] uppercase text-charcoal/70 mr-1 font-semibold">
              Suggested:
            </span>
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
                className="px-2.5 py-1 rounded bg-card/90 backdrop-blur-sm border border-warm-grey hover:border-olive hover:text-charcoal text-[11px] font-sans transition-colors min-h-[32px] flex items-center"
              >
                {sample}
              </button>
            ))}
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2.5 sm:gap-3">
            <button
              onClick={onExplore}
              className="btn-primary min-h-[44px] text-xs py-2.5 px-5 font-semibold flex items-center justify-center"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explore Directory</span>
            </button>
            <button
              onClick={onRate}
              className="btn-secondary min-h-[44px] text-xs py-2.5 px-5 font-semibold bg-paper/50 backdrop-blur-sm flex items-center justify-center"
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
