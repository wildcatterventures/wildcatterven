import React, { useState, useRef, useEffect } from "react";
import { Search, Mic, MicOff, ArrowRight } from "lucide-react";
import { isSpeechRecognitionSupported, startSpeechRecognition } from "../../lib/voice";

interface ConversationalHeroProps {
  onSearch: (query: string) => void;
  onOpenAssistantWithQuery: (query: string) => void;
}

export const ConversationalHero: React.FC<ConversationalHeroProps> = ({
  onSearch,
  onOpenAssistantWithQuery,
}) => {
  const [query, setQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const stopListeningRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (stopListeningRef.current) stopListeningRef.current();
    };
  }, []);

  const handleVoiceToggle = () => {
    if (isListening) {
      if (stopListeningRef.current) {
        stopListeningRef.current();
        stopListeningRef.current = null;
      }
      setIsListening(false);
    } else {
      if (!isSpeechRecognitionSupported()) {
        alert("Speech recognition is not supported in this browser. Please type your query.");
        return;
      }
      setIsListening(true);
      const stop = startSpeechRecognition(
        (transcript, isFinal) => {
          setQuery(transcript);
          if (isFinal) {
            setIsListening(false);
            onSearch(transcript);
          }
        },
        () => setIsListening(false),
        () => setIsListening(false)
      );
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
    <section className="pt-10 pb-16 md:pt-16 md:pb-24 border-b border-warm-grey">
      <div className="max-w-4xl mx-auto text-center px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warm-grey-light border border-warm-grey text-xs font-mono text-charcoal-muted uppercase tracking-wider mb-6">
          <span>Student-Powered Intelligence</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-charcoal mb-6 leading-[1.15]">
          College life. <br className="hidden sm:inline" />
          <span className="italic font-normal">Without the editing.</span>
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-charcoal-muted max-w-2xl mx-auto mb-10 leading-relaxed font-sans">
          Surface the lived experiences behind the brochure. Explore ratings across food, ragging prevention, faculty accessibility, hostels, placements, and campus governance.
        </p>

        {/* Conversational Search Input */}
        <form
          onSubmit={handleSubmit}
          className="relative max-w-2xl mx-auto editorial-card p-1.5 sm:p-2 bg-card flex items-center gap-2 shadow-card"
        >
          <Search className="w-5 h-5 text-charcoal-muted ml-3 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isListening
                ? "Listening... speak your query"
                : "Type or speak: 'Hostels at SFIT', 'Placement ratings', or college name..."
            }
            className="flex-1 bg-transparent px-2 py-2 text-sm sm:text-base text-charcoal placeholder:text-charcoal-muted/60 focus:outline-none"
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
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button type="submit" className="btn-primary py-2 px-4 text-xs sm:text-sm">
            <span>Explore</span>
            <ArrowRight className="w-4 h-4 hidden sm:inline" />
          </button>
        </form>

        {/* Example Queries */}
        <div className="mt-6 flex items-center justify-center gap-2 flex-wrap text-xs text-charcoal-muted">
          <span className="font-mono text-[11px] uppercase text-charcoal/70">Try asking:</span>
          {[
            "Search for SFIT",
            "What are the ratings at St. Jude?",
            "Colleges in Mumbai",
            "Apex Technical Academy",
          ].map((sample) => (
            <button
              key={sample}
              onClick={() => onOpenAssistantWithQuery(sample)}
              className="px-2.5 py-1 rounded-full bg-warm-grey-light border border-warm-grey hover:border-olive hover:text-charcoal transition-colors text-[11px]"
            >
              "{sample}"
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
