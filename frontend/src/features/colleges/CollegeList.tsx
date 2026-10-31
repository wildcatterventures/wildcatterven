import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  AlertCircle,
  Mic,
  MicOff,
  X,
  SlidersHorizontal,
  MapPin,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";

import { api } from "../../lib/api";
import { isSpeechRecognitionSupported, startSpeechSession, SpeechSessionController, SpeechState } from "../../lib/voice";
import type { CollegeSummary } from "../../types/college";
import { CollegeCard, INSTITUTIONAL_FACTS } from "./CollegeCard";
import { getCollegeCategory, CATEGORY_FILTER_OPTIONS } from "./collegeCategories";

interface CollegeListProps {
  initialQuery?: string;
  onSelectCollege: (collegeId: string) => void;
  onRateCollege: (collegeId: string) => void;
  onOpenUnknownModal?: () => void;
  onOpenScoringDemo?: () => void;
  onBack?: () => void;
}

export const CollegeList: React.FC<CollegeListProps> = ({
  initialQuery = "",
  onSelectCollege,
  onRateCollege,
  onOpenUnknownModal: _onOpenUnknownModal,
  onOpenScoringDemo,
  onBack,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [includeDemo, setIncludeDemo] = useState(true);
  const [colleges, setColleges] = useState<CollegeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sub-tab selection: "all" | "trending" | "top_rated" | "near_you" (Matches Image 1 Screen 4)
  const [activeSubTab, setActiveSubTab] = useState<"all" | "trending" | "top_rated" | "near_you">("all");

  // Client-side filter state
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedCollegeType, setSelectedCollegeType] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<"all" | "rated" | "unrated">("all");
  const [sortBy, setSortBy] = useState<"default" | "score_high" | "sessions_high">("default");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

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

    setQuery("");
    lastFetchedRef.current = null;

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
          fetchColleges(target, includeDemo);
        }
        setSpeechState("idle");
      },
      onFinalTranscript: (transcript) => {
        const target = transcript.trim();
        if (target) {
          setQuery(target);
          fetchColleges(target, includeDemo);
        }
      },
      onError: (err) => {
        setVoiceNotice(err);
        setSpeechState("idle");
      },
    });

    sessionControllerRef.current = controller;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionControllerRef.current) {
      sessionControllerRef.current.stop();
      sessionControllerRef.current = null;
    }
    fetchColleges(query, includeDemo);
  };

  useEffect(() => {
    const qLower = (initialQuery || "").trim().toLowerCase();
    if (qLower === "medical" || qLower === "engineering" || qLower === "mba" || qLower === "arts") {
      setSelectedCourse(qLower);
      setQuery("");
      fetchColleges("", includeDemo);
    } else if (initialQuery) {
      setQuery(initialQuery);
      fetchColleges(initialQuery, includeDemo);
    } else {
      fetchColleges("", includeDemo);
    }
  }, [initialQuery, includeDemo]);

  // Available unique cities for filtering
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    colleges.forEach((c) => {
      if (c.city) set.add(c.city);
    });
    return Array.from(set).sort();
  }, [colleges]);

  // Category counts computed across all loaded institutions
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: colleges.length,
      engineering: 0,
      medical: 0,
      mba: 0,
      arts: 0,
    };
    colleges.forEach((c) => {
      const cat = getCollegeCategory(c);
      if (counts[cat] !== undefined) {
        counts[cat]++;
      }
    });
    return counts;
  }, [colleges]);

  // Filter and sort computation
  const displayedColleges = useMemo(() => {
    let result = [...colleges];

    // Search query filter (client-side text refinement)
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.short_code.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.state.toLowerCase().includes(q)
      );
    }

    // Category / Stream Filter
    if (selectedCourse !== "all") {
      const targetCourse = selectedCourse.toLowerCase();
      result = result.filter((c) => {
        const cat = getCollegeCategory(c);
        if (targetCourse === "business") return cat === "mba";
        return cat === targetCourse;
      });
    }

    // City Filter
    if (selectedCity !== "all") {
      result = result.filter((c) => c.city.toLowerCase() === selectedCity.toLowerCase());
    }

    // College Type Filter
    if (selectedCollegeType.length > 0) {
      result = result.filter((c) => {
        const code = (c.short_code || "").toUpperCase();
        const fact = INSTITUTIONAL_FACTS[code];
        const typeStr = (fact?.type || "").toLowerCase();
        return selectedCollegeType.some((t) => typeStr.includes(t.toLowerCase()));
      });
    }

    // Status Filter
    if (selectedStatus === "rated") {
      result = result.filter((c) => c.total_submitted_sessions > 0);
    } else if (selectedStatus === "unrated") {
      result = result.filter((c) => c.total_submitted_sessions === 0);
    }

    // Sub-tab logic (Matches Reference Image 1 Screen 4)
    if (activeSubTab === "top_rated") {
      result.sort((a, b) => b.current_score - a.current_score);
    } else if (activeSubTab === "trending") {
      result.sort((a, b) => b.total_submitted_sessions - a.total_submitted_sessions);
    } else if (activeSubTab === "near_you") {
      result = result.filter((c) =>
        c.city.toLowerCase().includes("mumbai") || c.city.toLowerCase().includes("pune")
      );
    } else {
      // Manual Sort By
      if (sortBy === "score_high") {
        result.sort((a, b) => b.current_score - a.current_score);
      } else if (sortBy === "sessions_high") {
        result.sort((a, b) => b.total_submitted_sessions - a.total_submitted_sessions);
      }
    }

    return result;
  }, [
    colleges,
    query,
    selectedCourse,
    selectedCity,
    selectedCollegeType,
    selectedStatus,
    sortBy,
    activeSubTab,
  ]);

  const activeFilterCount =
    (selectedCity !== "all" ? 1 : 0) +
    (selectedCourse !== "all" ? 1 : 0) +
    (selectedCollegeType.length > 0 ? 1 : 0) +
    (selectedStatus !== "all" ? 1 : 0) +
    (sortBy !== "default" ? 1 : 0);

  const resetFilters = () => {
    setSelectedCity("all");
    setSelectedCourse("all");
    setSelectedCollegeType([]);
    setSelectedStatus("all");
    setSortBy("default");
    setActiveSubTab("all");
  };

  return (
    <div className="py-4 sm:py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto font-sans pb-28 md:pb-12">
      {/* 1. Header with Back Arrow and Title (Matches Reference Image 1 Screen 4) */}
      <div className="flex items-center gap-3 mb-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-paper border border-warm-grey flex items-center justify-center text-charcoal hover:bg-warm-grey-light transition-colors shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal tracking-tight">
          Explore Colleges
        </h1>
      </div>

      {/* 2. Pill Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative mb-3.5">
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
              onClick={() => {
                setQuery("");
                fetchColleges("", includeDemo);
              }}
              className="p-1 text-charcoal-muted hover:text-charcoal shrink-0 mr-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleVoiceToggle}
            className={`p-1.5 rounded-full transition-colors shrink-0 ${
              isListening ? "bg-rose-600 text-white animate-pulse" : "text-charcoal-muted hover:text-charcoal"
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>
      </form>

      {/* Voice notice */}
      {voiceNotice && (
        <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{voiceNotice}</span>
          <button type="button" onClick={() => setVoiceNotice(null)} className="font-bold">
            ×
          </button>
        </div>
      )}

      {/* 2.5 Primary Category Stream Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 mb-3 select-none">
        {CATEGORY_FILTER_OPTIONS.map((opt) => {
          const isSelected = selectedCourse.toLowerCase() === opt.id.toLowerCase();
          const count = categoryCounts[opt.id] ?? 0;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedCourse(isSelected && opt.id !== "all" ? "all" : opt.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                isSelected
                  ? "bg-[#727D60] text-white shadow-xs"
                  : "bg-white border border-warm-grey text-charcoal hover:border-charcoal/60"
              }`}
            >
              <span>{opt.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  isSelected ? "bg-white/20 text-white" : "bg-warm-grey-light text-charcoal-muted"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Filter Quick Actions Row (Matches Reference Image 1 Screen 4) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 mb-4 select-none">
        {/* Dedicated Filters Sheet Trigger */}
        <button
          type="button"
          onClick={() => setIsFilterSheetOpen(true)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors ${
            activeFilterCount > 0
              ? "bg-[#727D60] text-white shadow-xs"
              : "bg-[#727D60]/90 hover:bg-[#727D60] text-white shadow-xs"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-white text-[#727D60] text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* City Filter Dropdown Pill */}
        <div className="relative shrink-0">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="appearance-none bg-card border border-warm-grey text-charcoal px-3 py-1.5 pr-6 rounded-full text-xs font-medium cursor-pointer focus:outline-none hover:border-charcoal"
          >
            <option value="all">City ▾</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-charcoal-muted absolute right-2 top-2.5 pointer-events-none" />
        </div>

        {/* Course Filter Dropdown Pill */}
        <div className="relative shrink-0">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="appearance-none bg-card border border-warm-grey text-charcoal px-3 py-1.5 pr-6 rounded-full text-xs font-medium cursor-pointer focus:outline-none hover:border-charcoal"
          >
            <option value="all">Stream ▾</option>
            <option value="engineering">Engineering</option>
            <option value="medical">Medical</option>
            <option value="mba">MBA</option>
            <option value="arts">Arts</option>
          </select>
          <ChevronDown className="w-3 h-3 text-charcoal-muted absolute right-2 top-2.5 pointer-events-none" />
        </div>

        {/* Rating Filter Dropdown Pill */}
        <div className="relative shrink-0">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="appearance-none bg-card border border-warm-grey text-charcoal px-3 py-1.5 pr-6 rounded-full text-xs font-medium cursor-pointer focus:outline-none hover:border-charcoal"
          >
            <option value="all">Rating ▾</option>
            <option value="rated">Has Reviews</option>
            <option value="unrated">Awaiting Ratings</option>
          </select>
          <ChevronDown className="w-3 h-3 text-charcoal-muted absolute right-2 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* 4. Secondary Sub-Tabs: All | Trending | Top Rated | Near You (Matches Reference Image 1 Screen 4) */}
      <div className="flex items-center gap-4 sm:gap-6 border-b border-warm-grey mb-4 text-xs font-semibold select-none overflow-x-auto no-scrollbar">
        {[
          { id: "all", label: "All" },
          { id: "trending", label: "Trending" },
          { id: "top_rated", label: "Top Rated" },
          { id: "near_you", label: "Near You" },
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`pb-2.5 whitespace-nowrap transition-colors relative ${
                isActive
                  ? "text-charcoal font-bold border-b-2 border-charcoal -mb-[1px]"
                  : "text-charcoal-muted hover:text-charcoal"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 5. Error State */}
      {error && (
        <div className="p-3.5 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchColleges(query, includeDemo)}
            className="underline font-semibold ml-2 text-rose-950"
          >
            Retry
          </button>
        </div>
      )}

      {/* 6. College Rows (Matches Reference Image 1 Screen 4: Compact Horizontal Card Layout on Mobile, Grid on Desktop) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-3 bg-card rounded-2xl border border-warm-grey animate-pulse flex flex-row md:flex-col items-center md:items-stretch gap-3 sm:gap-3.5 md:gap-0 min-h-[120px] max-h-[155px] md:min-h-0 md:max-h-none md:p-0 overflow-hidden"
            >
              <div className="w-[104px] sm:w-[114px] min-w-[104px] sm:min-w-[114px] max-w-[104px] sm:max-w-[114px] h-[104px] sm:h-[114px] md:w-full md:min-w-full md:max-w-none md:h-44 md:aspect-[16/9] bg-warm-grey-light rounded-xl md:rounded-none md:rounded-t-2xl shrink-0" />
              <div className="flex-1 min-w-0 w-full space-y-2 py-0.5 md:p-5">
                <div className="h-4 bg-warm-grey rounded w-3/4" />
                <div className="h-3 bg-warm-grey rounded w-1/2" />
                <div className="h-3 bg-warm-grey rounded w-1/3 mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : displayedColleges.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-5 mb-8">
          {displayedColleges.map((college) => (
            <CollegeCard
              key={college.college_id}
              college={college}
              onSelect={onSelectCollege}
              onRate={onRateCollege}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="editorial-card p-8 text-center bg-card max-w-md mx-auto my-8 rounded-2xl border border-warm-grey shadow-subtle">
          <h3 className="font-serif text-lg font-bold text-charcoal mb-1">
            No Colleges Found
          </h3>
          <p className="text-xs text-charcoal-muted mb-4 leading-relaxed">
            {query
              ? `No registered institutions match '${query}'.`
              : "No institutions match the current filter selection."}
          </p>
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="btn-secondary text-xs py-2 px-4 font-semibold rounded-lg"
            >
              Reset All Filters
            </button>
          )}
        </div>
      )}

      {/* 7. Dedicated Filters Sheet / Modal (Matches Reference Image 2 Screen 5) */}
      {isFilterSheetOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-end sm:items-center justify-center">
          <div
            className="fixed inset-0 bg-charcoal/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsFilterSheetOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="relative w-full max-w-lg bg-[#F5F2EB] rounded-t-3xl sm:rounded-3xl border border-warm-grey shadow-2xl p-5 sm:p-6 z-50 max-h-[90vh] overflow-y-auto pb-safe animate-in slide-in-from-bottom duration-200 font-sans"
          >
            {/* Header: < Filters & Clear all */}
            <div className="flex items-center justify-between border-b border-warm-grey pb-3.5 mb-5">
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                className="flex items-center gap-1.5 text-xs font-semibold text-charcoal hover:text-olive"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Filters</span>
              </button>

              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-semibold text-charcoal hover:underline"
              >
                Clear all
              </button>
            </div>

            <div className="space-y-6 text-xs font-sans">
              {/* Location: Search city */}
              <div>
                <label className="block text-xs font-bold text-charcoal mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-charcoal-muted absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={selectedCity === "all" ? "" : selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value || "all")}
                    placeholder="Search city..."
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-warm-grey rounded-xl text-xs text-charcoal focus:outline-none focus:border-charcoal"
                  />
                </div>
              </div>

              {/* Course Type / Stream: Chips */}
              <div>
                <label className="block text-xs font-bold text-charcoal mb-2">
                  Academic Stream
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "All Streams", val: "all" },
                    { label: "Engineering", val: "engineering" },
                    { label: "Medical", val: "medical" },
                    { label: "MBA", val: "mba" },
                    { label: "Arts", val: "arts" },
                  ].map((stream) => {
                    const isSelected = selectedCourse.toLowerCase() === stream.val.toLowerCase();
                    return (
                      <button
                        key={stream.val}
                        type="button"
                        onClick={() => setSelectedCourse(isSelected && stream.val !== "all" ? "all" : stream.val)}
                        className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
                          isSelected
                            ? "bg-[#727D60] text-white font-semibold"
                            : "bg-white border border-warm-grey text-charcoal hover:border-charcoal"
                        }`}
                      >
                        {stream.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* College Type: Checkboxes (Matches Reference Image 2 Screen 5) */}
              <div>
                <label className="block text-xs font-bold text-charcoal mb-2">
                  College Type
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {["Government", "Private", "Deemed", "Autonomous"].map((type) => {
                    const isChecked = selectedCollegeType.includes(type);
                    return (
                      <label
                        key={type}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-warm-grey cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedCollegeType((prev) => prev.filter((t) => t !== type));
                            } else {
                              setSelectedCollegeType((prev) => [...prev, type]);
                            }
                          }}
                          className="w-4 h-4 rounded text-olive focus:ring-olive border-warm-grey"
                        />
                        <span className="font-medium text-charcoal">{type}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Include Demo Colleges Toggle */}
              <div className="pt-2 border-t border-warm-grey">
                <label className="flex items-center justify-between cursor-pointer py-1">
                  <div>
                    <span className="font-bold text-charcoal block">
                      Include Demo Campuses
                    </span>
                    <span className="text-[11px] text-charcoal-muted">
                      Shows PICT &amp; VJTI demo fixtures
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeDemo}
                    onChange={(e) => setIncludeDemo(e.target.checked)}
                    className="w-4 h-4 rounded text-olive focus:ring-olive border-warm-grey"
                  />
                </label>
              </div>

              {/* Apply Filters Full-Width Button (Matches Reference Image 2 Screen 5) */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setIsFilterSheetOpen(false)}
                  className="w-full py-3.5 rounded-xl bg-[#727D60] text-white font-bold text-sm shadow-md hover:bg-[#5C6450] transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Understated Scoring Demo Link at the bottom */}
      {onOpenScoringDemo && (
        <div className="mt-8 pt-4 border-t border-warm-grey flex items-center justify-between text-xs text-charcoal-muted">
          <span>Looking for scoring progression mechanics?</span>
          <button
            type="button"
            onClick={onOpenScoringDemo}
            className="text-xs font-semibold text-olive hover:underline"
          >
            Scoring Demo &rarr;
          </button>
        </div>
      )}
    </div>
  );
};
