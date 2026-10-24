import React, { useState, useRef, useEffect } from "react";
import { Search, Mic, MicOff, ArrowRight, BookOpen, MessageSquareQuote, Shield } from "lucide-react";

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
      setIsListening(true);
      const stop = startSpeechRecognition({
        onStart: () => {
          setIsListening(true);
          setVoiceError(null);
        },
        onTranscript: (transcript, isFinal) => {
          setQuery(transcript);
          if (isFinal) {
            setIsListening(false);
          }
        },
        onError: (errorMsg) => {
          setIsListening(false);
          setVoiceError(errorMsg);
        },
        onEnd: () => {
          setIsListening(false);
        },
      });
      stopListeningRef.current = stop;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <section className="pt-8 pb-12 md:pt-14 md:pb-20 border-b border-warm-grey">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Asymmetrical 2-Column Cover Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Editorial Headline & Search Interface (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Small Editorial Header Label */}
            <div className="inline-flex items-center gap-2 mb-4 self-start">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-olive-light text-olive border border-olive/30">
                Vol. 01 • Student Intelligence
              </span>
              <span className="text-[11px] font-mono text-charcoal-muted">
                Mumbai • Bhopal • Coimbatore
              </span>
            </div>

            {/* Display Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-charcoal mb-4 leading-[1.12]">
              College life. <br />
              <span className="italic font-normal text-olive">Without the editing.</span>
            </h1>

            {/* Concise Supporting Text */}
            <p className="text-sm sm:text-base text-charcoal-muted max-w-xl mb-8 leading-relaxed font-sans">
              Surface the lived experiences behind prospectus claims. Unedited ratings across food quality, hostels, faculty accessibility, ragging prevention, and placements—governed by deterministic 20-submission blocks.
            </p>

            {/* Conversational Text & Voice Search Box */}
            <form
              onSubmit={handleSubmit}
              className="editorial-card p-2 bg-card flex items-center gap-2 shadow-card max-w-xl mb-4 border-charcoal/20 focus-within:border-olive focus-within:ring-1 focus-within:ring-olive transition-all"
            >
              <Search className="w-5 h-5 text-charcoal-muted ml-2.5 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  isListening
                    ? "Listening... speak query now"
                    : "Search colleges, city, or ask: 'Hostels at SFIT'..."
                }
                className="flex-1 bg-transparent px-2 py-2 text-xs sm:text-sm text-charcoal placeholder:text-charcoal-muted/60 focus:outline-none font-sans"
              />

              <button
                type="button"
                onClick={handleVoiceToggle}
                title={isListening ? "Stop listening" : "Speak search with voice"}
                className={`p-2 rounded transition-colors ${
                  isListening
                    ? "bg-rose-600 text-white animate-pulse"
                    : "text-charcoal-muted hover:text-charcoal hover:bg-warm-grey-light"
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button type="submit" className="btn-primary py-2 px-4 text-xs font-semibold">
                <span>Explore</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
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
            <div className="flex items-center gap-1.5 flex-wrap text-xs text-charcoal-muted max-w-xl mb-6">
              <span className="font-mono text-[10px] uppercase text-charcoal/70 mr-1">
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
                  className="px-2.5 py-1 rounded bg-card border border-warm-grey hover:border-olive hover:text-charcoal text-[11px] font-sans transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>

            {/* Primary Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onExplore}
                className="btn-primary text-xs py-2.5 px-5 font-semibold"
              >
                <BookOpen className="w-4 h-4" />
                <span>Explore Directory</span>
              </button>
              <button
                onClick={onRate}
                className="btn-secondary text-xs py-2.5 px-5 font-semibold"
              >
                <MessageSquareQuote className="w-4 h-4 text-olive" />
                <span>Rate Your Campus</span>
              </button>
            </div>
          </div>

          {/* Right Column: Editorial Visual Composition & Photo Collage (5 cols) */}
          <div className="lg:col-span-5 relative mt-6 lg:mt-0">
            {/* Primary Main Image Frame */}
            <div className="editorial-image-frame bg-paper p-2 pb-3">
              <div className="overflow-hidden rounded relative aspect-[16/11]">
                <img
                  src="/images/hero_quad.jpg"
                  alt="Students walking through campus courtyard and discussing coursework"
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-2.5 left-3 right-3 text-white">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-warm-grey-light">
                    On-Campus Documentation
                  </div>
                  <div className="font-serif text-sm font-semibold text-paper leading-snug">
                    Everyday campus movement and lived student experiences.
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Inset Photographic Collage Card */}
            <div className="hidden sm:block absolute -bottom-6 -left-6 w-52 editorial-card p-2 shadow-xl bg-card border-warm-grey-dark">
              <div className="overflow-hidden rounded aspect-[4/3] mb-2">
                <img
                  src="/images/student_discussion.jpg"
                  alt="Student study group discussing projects"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-[10px] font-mono text-charcoal-muted uppercase">
                25 Active Parameters
              </div>
              <div className="text-[11px] font-semibold text-charcoal">
                Deterministic Base 100
              </div>
            </div>

            {/* Editorial Architectural Stamp / Badge */}
            <div className="absolute -top-3 -right-3 px-3 py-1.5 rounded bg-charcoal text-paper shadow-lg border border-warm-grey font-mono text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-olive-light" />
              <span>Independent Platform</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
