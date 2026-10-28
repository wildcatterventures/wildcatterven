import React, { useState, useEffect, useRef } from "react";
import { Search, PlusCircle, AlertCircle, RefreshCw, Mic, MicOff, X } from "lucide-react";

import { api } from "../../lib/api";
import { isSpeechRecognitionSupported, startSpeechSession, SpeechSessionController, SpeechState } from "../../lib/voice";
import type { CollegeSummary } from "../../types/college";
import { CollegeCard } from "./CollegeCard";

interface CollegeListProps {
  initialQuery?: string;
  onSelectCollege: (collegeId: string) => void;
  onRateCollege: (collegeId: string) => void;
  onOpenUnknownModal: () => void;
}

export const CollegeList: React.FC<CollegeListProps> = ({
  initialQuery = "",
  onSelectCollege,
  onRateCollege,
  onOpenUnknownModal,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [includeDemo, setIncludeDemo] = useState(true);
  const [colleges, setColleges] = useState<CollegeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Voice Search State
  const [speechState, setSpeechState] = useState<SpeechState>("idle");
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const sessionControllerRef = useRef<SpeechSessionController | null>(null);

  useEffect(() => {
    return () => {
      if (sessionControllerRef.current) {
        sessionControllerRef.current.abort();
        sessionControllerRef.current = null;
      }
    };
  }, []);

  const isListening = speechState === "listening" || speechState === "starting";
  const lastFetchedRef = useRef<string | null>(null);

  const fetchColleges = async (searchQuery: string, demo: boolean) => {
    const key = `${searchQuery.trim()}::${demo}`;
    if (lastFetchedRef.current === key) return;
    lastFetchedRef.current = key;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getColleges(searchQuery, demo);
      setColleges(data);
    } catch (err: any) {
      setError(err.message || "Unable to load colleges from backend database.");
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceToggle = () => {
    setVoiceNotice(null);
    if (isListening) {
      if (sessionControllerRef.current) {
        sessionControllerRef.current.abort();
        sessionControllerRef.current = null;
      }
      setSpeechState("idle");
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setVoiceNotice("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    // SECTION 3.A: Immediately clear previous search text on new session
    setQuery("");
    lastFetchedRef.current = null;

    const controller = startSpeechSession({
      silenceTimeoutMs: 3500,
      autoStopOnSilence: true,
      onStateChange: (state) => {
        setSpeechState(state);
      },
      onInterimTranscript: (combined) => {
        // Live dynamic transcription
        setQuery(combined);
      },
      onSilenceTimeout: (finalTranscript) => {
        const target = (finalTranscript || query).trim();
        if (target) {
          setQuery(target);
          fetchColleges(target, includeDemo);
        }
      },
      onFinalTranscript: (finalTranscript) => {
        const target = (finalTranscript || query).trim();
        if (target) {
          setQuery(target);
          fetchColleges(target, includeDemo);
        }
      },
      onError: (errorMsg) => {
        sessionControllerRef.current = null;
        setSpeechState("error");
        setVoiceNotice(errorMsg);
      },
      onEnd: () => {
        sessionControllerRef.current = null;
      },
    });

    sessionControllerRef.current = controller;
  };

  useEffect(() => {
    // While microphone is actively listening, wait until speech recognition completes
    if (isListening) return;
    const timer = setTimeout(() => {
      fetchColleges(query, includeDemo);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, includeDemo, isListening]);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      {/* Page Header */}
      <div className="mb-8 border-b border-warm-grey pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-olive font-semibold">
            Institutional Registry
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal mt-1">
            Explore Colleges
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-1 max-w-2xl font-sans">
            Search institutions across India. Verified base scores begin at 100 and update automatically when 20 qualifying student or alumni ratings are submitted.
          </p>
        </div>

        <button
          onClick={onOpenUnknownModal}
          className="btn-primary min-h-[44px] text-xs self-stretch sm:self-start md:self-auto py-2.5 px-4 font-semibold flex items-center justify-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Unlisted College</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 bg-card p-3 sm:p-3.5 rounded border border-warm-grey shadow-subtle">
        <div className={`relative w-full sm:max-w-md rounded transition-all ${
          isListening ? "ring-2 ring-olive" : ""
        }`}>
          <Search className="w-4 h-4 text-charcoal-muted absolute left-3 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isListening
                ? "Listening... speak now"
                : "Search by college name, city, state, or code..."
            }
            className="w-full min-h-[44px] pl-9 pr-16 py-2 text-xs sm:text-sm bg-paper border border-warm-grey rounded focus:outline-none focus:border-olive font-sans"
          />
          <div className="absolute right-2 top-2 flex items-center gap-1">
            {isListening && (
              <button
                type="button"
                onClick={() => {
                  if (sessionControllerRef.current) {
                    sessionControllerRef.current.abort();
                    sessionControllerRef.current = null;
                  }
                  setSpeechState("idle");
                }}
                className="w-7 h-7 flex items-center justify-center rounded text-charcoal-muted hover:text-charcoal hover:bg-warm-grey-light transition-colors"
                title="Cancel voice search"
                aria-label="Cancel voice search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleVoiceToggle}
              title={isListening ? "Cancel listening" : "Search with voice"}
              className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
                isListening
                  ? "bg-rose-600 text-white animate-pulse"
                  : "text-charcoal-muted hover:text-charcoal hover:bg-warm-grey-light"
              }`}
              aria-label={isListening ? "Cancel listening" : "Search with voice"}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {voiceNotice && (
          <div className="mt-2 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded p-2 flex items-center justify-between">
            <span>{voiceNotice}</span>
            <button
              type="button"
              onClick={() => setVoiceNotice(null)}
              className="text-[10px] font-bold uppercase hover:underline ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <label className="flex items-center gap-2 text-xs text-charcoal cursor-pointer select-none min-h-[40px]">
            <input
              type="checkbox"
              checked={includeDemo}
              onChange={(e) => setIncludeDemo(e.target.checked)}
              className="rounded border-warm-grey text-olive focus:ring-olive w-4 h-4"
            />
            <span className="text-[11px] sm:text-xs font-sans text-charcoal-muted">Include Demo Campuses</span>
          </label>

          <button
            onClick={() => fetchColleges(query, includeDemo)}
            title="Refresh records from PostgreSQL"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 text-charcoal-muted hover:text-charcoal rounded hover:bg-warm-grey-light border border-warm-grey transition-colors flex-shrink-0"
            aria-label="Refresh records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 mb-8 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchColleges(query, includeDemo)}
            className="underline font-semibold ml-4 hover:text-rose-950"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="editorial-card p-5 sm:p-6 bg-card animate-pulse space-y-4">
              <div className="h-6 bg-warm-grey rounded w-3/4" />
              <div className="h-4 bg-warm-grey rounded w-1/2" />
              <div className="h-20 bg-warm-grey-light rounded w-full mt-4" />
            </div>
          ))}
        </div>
      ) : colleges.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {colleges.map((college) => (
            <CollegeCard
              key={college.college_id}
              college={college}
              onSelect={onSelectCollege}
              onRate={onRateCollege}
            />
          ))}
        </div>
      ) : (
        /* Illustrated Empty State */
        <div className="editorial-card p-6 sm:p-8 md:p-12 text-center bg-card max-w-xl mx-auto my-8 sm:my-12 border-warm-grey shadow-card">
          <div className="w-40 sm:w-48 h-28 sm:h-32 mx-auto mb-5 sm:mb-6">
            <img
              src="/images/empty_search.svg"
              alt="No colleges found illustration"
              className="w-full h-full object-contain"
            />
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-charcoal mb-2">
            No Colleges Found
          </h3>
          <p className="text-xs sm:text-sm text-charcoal-muted max-w-md mx-auto mb-6 leading-relaxed">
            {query
              ? `No registered institutions match '${query}'. You can add your college to the registry with a starting score of 100.`
              : "No institutions found matching your filter criteria."}
          </p>
          <button
            onClick={onOpenUnknownModal}
            className="btn-primary min-h-[44px] text-xs py-2.5 px-6 font-semibold flex items-center justify-center gap-1.5 mx-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add This College to Directory</span>
          </button>
        </div>
      )}
    </div>
  );
};
