import React, { useState, useEffect, useMemo } from "react";
import {
  Compass,
  Sliders,
  Sparkles,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  TrendingDown,
  RefreshCw,
  Info,
} from "lucide-react";
import { api } from "../../lib/api";
import type { CollegeRatingReport, CollegeSummary } from "../../types/college";
import { THEMATIC_CATEGORIES } from "../../lib/thematicCategories";
import { calculateMatches, type CollegeMatchResult } from "../../lib/matchEngine";

interface MatchEngineProps {
  onSelectCollege: (collegeId: string) => void;
  onExploreAll?: () => void;
  onRateCollege?: (collegeId: string) => void;
}

// Preset priority profiles for one-click setup
const PRESET_PROFILES: { name: string; description: string; weights: Record<string, number> }[] = [
  {
    name: "Academics & Teaching Rigor",
    description: "Prioritizes faculty quality, classroom infrastructure, and academic freedom.",
    weights: { academics: 5, safety: 3, infrastructure: 3, living: 2, culture: 2, career_governance: 3 },
  },
  {
    name: "Placements & Career First",
    description: "Focuses heavily on campus placements, alumni mentorship, and management responsiveness.",
    weights: { career_governance: 5, academics: 4, infrastructure: 3, safety: 3, living: 2, culture: 2 },
  },
  {
    name: "Campus Safety & Well-being",
    description: "Emphasizes anti-ragging safeguards, women's safety, and peer bullying prevention.",
    weights: { safety: 5, living: 4, academics: 3, infrastructure: 3, career_governance: 3, culture: 2 },
  },
  {
    name: "Balanced Campus Experience",
    description: "Equal weighting across all 6 core dimensions of student reality.",
    weights: { academics: 3, safety: 3, infrastructure: 3, living: 3, culture: 3, career_governance: 3 },
  },
];

export const MatchEngine: React.FC<MatchEngineProps> = ({
  onSelectCollege,
  onExploreAll,
}) => {
  const [colleges, setColleges] = useState<CollegeSummary[]>([]);
  const [reports, setReports] = useState<Record<string, CollegeRatingReport>>({});
  const [loading, setLoading] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active category weights (1 to 5; default: balanced 3)
  const [priorities, setPriorities] = useState<Record<string, number>>({
    academics: 4,
    safety: 4,
    infrastructure: 3,
    living: 3,
    culture: 3,
    career_governance: 4,
  });

  const [minCoveragePct, setMinCoveragePct] = useState<number>(0);
  const [includeDemo, setIncludeDemo] = useState<boolean>(true);

  // Fetch initial colleges
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .getColleges("", includeDemo)
      .then((data) => {
        if (mounted) {
          setColleges(data);
        }
      })
      .catch((err) => {
        if (mounted) setError(err.message || "Failed to load colleges.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [includeDemo]);

  // Fetch rating reports for colleges
  useEffect(() => {
    if (colleges.length === 0) return;

    let mounted = true;
    setLoadingReports(true);

    const collegesToFetch = colleges.filter((c) => !reports[c.college_id]);

    if (collegesToFetch.length === 0) {
      setLoadingReports(false);
      return;
    }

    Promise.allSettled(
      collegesToFetch.map((c) =>
        api
          .getCollegeRatings(c.college_id)
          .then((rep) => ({ id: c.college_id, report: rep }))
      )
    )
      .then((results) => {
        if (!mounted) return;
        const newReports: Record<string, CollegeRatingReport> = { ...reports };
        results.forEach((r) => {
          if (r.status === "fulfilled" && r.value) {
            newReports[r.value.id] = r.value.report;
          }
        });
        setReports(newReports);
      })
      .finally(() => {
        if (mounted) setLoadingReports(false);
      });

    return () => {
      mounted = false;
    };
  }, [colleges]);

  const handleWeightChange = (catId: string, val: number) => {
    setPriorities((prev) => ({
      ...prev,
      [catId]: val,
    }));
  };

  const handleApplyPreset = (weights: Record<string, number>) => {
    setPriorities(weights);
  };

  const matches = useMemo<CollegeMatchResult[]>(() => {
    return calculateMatches({
      colleges,
      reports,
      priorities,
      minCoveragePct,
    });
  }, [colleges, reports, priorities, minCoveragePct]);

  const activePrioritiesCount = Object.values(priorities).filter((w) => w > 0).length;

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      {/* 1. Header Banner */}
      <div className="editorial-card p-6 sm:p-10 bg-card border-warm-grey mb-8 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 mb-2 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-olive-light text-olive border border-olive/30">
              <Compass className="w-3.5 h-3.5" />
              <span>Evidence-Driven Discovery</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-charcoal tracking-tight">
              Uncut Match Engine
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted mt-2 leading-relaxed">
              Find campuses aligned with what matters most to you. Rather than relying on a single overall score, the Match Engine computes a personalized fit score from category-level student ratings while transparently accounting for missing evidence.
            </p>
          </div>

          {/* Quick Demo toggle */}
          <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3 shrink-0">
            <label className="flex items-center gap-2 text-xs text-charcoal-muted cursor-pointer select-none bg-paper border border-warm-grey px-3 py-2 rounded">
              <input
                type="checkbox"
                checked={includeDemo}
                onChange={(e) => setIncludeDemo(e.target.checked)}
                className="rounded border-warm-grey text-olive focus:ring-olive w-3.5 h-3.5"
              />
              <span>Include demo institutions</span>
            </label>
          </div>
        </div>

        {/* Preset Profiles Bar */}
        <div className="mt-6 pt-6 border-t border-warm-grey">
          <span className="text-[11px] font-mono text-charcoal-muted uppercase tracking-wider font-semibold block mb-2.5">
            Quick Priority Presets:
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_PROFILES.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleApplyPreset(preset.weights)}
                className="text-xs px-3 py-1.5 rounded-full border border-warm-grey bg-paper text-charcoal hover:border-olive hover:text-olive transition-colors flex items-center gap-1.5"
                title={preset.description}
              >
                <Sparkles className="w-3 h-3 text-olive" />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Interactive Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
        {/* Left Column: Priority Weight Adjusters */}
        <div className="lg:col-span-5 editorial-card p-5 sm:p-6 bg-card border-warm-grey shadow-card sticky top-24">
          <div className="flex items-center justify-between border-b border-warm-grey pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-olive" />
              <h2 className="font-serif text-lg font-bold text-charcoal">
                Adjust Your Priorities
              </h2>
            </div>
            <span className="text-[11px] font-mono text-charcoal-muted">
              {activePrioritiesCount} of 6 active
            </span>
          </div>

          <p className="text-xs text-charcoal-muted mb-5 leading-relaxed">
            Drag the sliders to set importance (1 = Low, 3 = Medium, 5 = Critical). Set to 0 to exclude a category.
          </p>

          <div className="space-y-4">
            {THEMATIC_CATEGORIES.map((cat) => {
              const currentWeight = priorities[cat.id] ?? 3;

              return (
                <div
                  key={cat.id}
                  className={`p-3 rounded-lg border transition-all ${
                    currentWeight > 0
                      ? "bg-paper/70 border-warm-grey"
                      : "bg-warm-grey-light/30 border-dashed border-warm-grey opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-serif text-xs sm:text-sm font-bold text-charcoal">
                      {cat.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        currentWeight === 5
                          ? "bg-olive text-white"
                          : currentWeight >= 3
                          ? "bg-warm-grey text-charcoal"
                          : currentWeight > 0
                          ? "bg-warm-grey-light text-charcoal-muted"
                          : "bg-paper text-charcoal-muted border border-warm-grey"
                      }`}
                    >
                      {currentWeight === 5
                        ? "Critical (5)"
                        : currentWeight >= 3
                        ? `Important (${currentWeight})`
                        : currentWeight > 0
                        ? `Low (${currentWeight})`
                        : "Ignored (0)"}
                    </span>
                  </div>

                  <p className="text-[11px] text-charcoal-muted font-sans line-clamp-1 mb-2">
                    {cat.description}
                  </p>

                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={5}
                      step={1}
                      value={currentWeight}
                      onChange={(e) => handleWeightChange(cat.id, parseInt(e.target.value, 10))}
                      className="w-full accent-olive cursor-pointer"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Evidence Coverage Filter */}
          <div className="mt-5 pt-4 border-t border-warm-grey">
            <div className="flex items-center justify-between text-xs text-charcoal mb-1.5">
              <span className="font-semibold">Minimum Evidence Coverage:</span>
              <span className="font-mono text-olive font-bold">{minCoveragePct}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={80}
              step={20}
              value={minCoveragePct}
              onChange={(e) => setMinCoveragePct(parseInt(e.target.value, 10))}
              className="w-full accent-olive cursor-pointer"
            />
            <p className="text-[10px] text-charcoal-muted mt-1 leading-snug">
              Require colleges to have student ratings across at least {minCoveragePct}% of your selected priorities.
            </p>
          </div>
        </div>

        {/* Right Column: Dynamic Recommendations */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-olive font-bold">
                Personalized Shortlist
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-charcoal mt-0.5">
                Top Matches for Your Profile
              </h2>
            </div>
            <div className="text-xs text-charcoal-muted font-mono">
              {loadingReports ? (
                <span className="inline-flex items-center gap-1.5 text-olive">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Computing telemetry...</span>
                </span>
              ) : (
                <span>
                  {matches.length} candidate institution{matches.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Match Results Cards */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="editorial-card p-6 bg-card animate-pulse space-y-3">
                  <div className="h-6 bg-warm-grey-light rounded w-1/2" />
                  <div className="h-4 bg-warm-grey rounded w-3/4" />
                  <div className="h-10 bg-warm-grey-light rounded w-full" />
                </div>
              ))}
            </div>
          ) : matches.length === 0 ? (
            /* Insufficient Evidence / Empty State */
            <div className="editorial-card p-8 sm:p-12 text-center bg-card border-warm-grey shadow-card">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-warm-grey-light flex items-center justify-center text-charcoal">
                <Info className="w-7 h-7 text-olive" />
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-charcoal mb-2">
                Insufficient Evidence for Selected Criteria
              </h3>
              <p className="text-xs sm:text-sm text-charcoal-muted max-w-md mx-auto mb-6 leading-relaxed">
                None of the colleges currently have student-submitted ratings matching your chosen combination and {minCoveragePct}% coverage requirement.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => {
                    setMinCoveragePct(0);
                    handleApplyPreset(PRESET_PROFILES[3].weights);
                  }}
                  className="btn-primary text-xs py-2 px-4 font-semibold"
                >
                  Reset to Balanced Profile
                </button>
                <button
                  onClick={onExploreAll}
                  className="btn-secondary text-xs py-2 px-4 font-medium"
                >
                  Browse All Colleges
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {matches.map((match, rank) => {
                const hasFullData = match.evidenceCoveragePct === 100;
                const hasPartialData = match.evidenceCoveragePct > 0;

                return (
                  <article
                    key={match.collegeId}
                    className="editorial-card p-5 sm:p-7 bg-card border-warm-grey shadow-card hover:border-charcoal/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: Rank & Scores */}
                      <div className="flex flex-col xs:flex-row xs:items-start justify-between gap-3 mb-4">
                        <div className="flex items-start gap-3">
                          <span className="w-7 h-7 rounded-full bg-charcoal text-paper font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            #{rank + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3
                                onClick={() => onSelectCollege(match.collegeId)}
                                className="font-serif text-lg sm:text-xl font-bold text-charcoal hover:text-olive transition-colors cursor-pointer"
                              >
                                {match.collegeName}
                              </h3>
                              {match.isDemo && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                  Demo College
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-charcoal-muted font-sans mt-0.5">
                              {match.city}, {match.state} • {match.shortCode}
                            </p>
                          </div>
                        </div>

                        {/* Fit Score Badge */}
                        <div className="flex flex-col items-start xs:items-end shrink-0">
                          <div className="flex items-baseline gap-1 font-mono">
                            <span className="font-serif text-2xl sm:text-3xl font-bold text-charcoal">
                              {hasPartialData ? match.personalizedFitScore : "—"}
                            </span>
                            <span className="text-xs text-charcoal-muted font-semibold">% Fit</span>
                          </div>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded mt-1 font-medium ${
                              hasFullData
                                ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                : hasPartialData
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : "bg-warm-grey-light text-charcoal-muted border border-warm-grey"
                            }`}
                          >
                            {match.evidenceCoveragePct}% coverage ({match.prioritiesWithData}/{match.totalPrioritiesSelected} rated)
                          </span>
                        </div>
                      </div>

                      {/* Why it matches highlight */}
                      <div className="p-3 rounded bg-warm-grey-light/60 border border-warm-grey text-xs text-charcoal mb-4 flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-olive shrink-0 mt-0.5" />
                        <div className="leading-relaxed">
                          <strong className="font-semibold">Why this matches: </strong>
                          <span>{match.matchHighlight}</span>
                        </div>
                      </div>

                      {/* Evidence Detail Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs font-sans">
                        {/* Strongest Relevant Category */}
                        {match.strongestCategory && (
                          <div className="p-3 rounded border border-emerald-200/80 bg-emerald-50/40">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold block mb-1">
                              Strongest Priority Alignment
                            </span>
                            <div className="flex items-baseline justify-between">
                              <span className="font-semibold text-charcoal">
                                {match.strongestCategory.categoryName}
                              </span>
                              <span className="font-mono font-bold text-emerald-800">
                                {match.strongestCategory.averageScore.toFixed(1)} / 10
                              </span>
                            </div>
                            <span className="text-[10px] text-charcoal-muted mt-0.5 block">
                              Based on {match.strongestCategory.responseCount} verified student ratings
                            </span>
                          </div>
                        )}

                        {/* Trade-off / Weaker Category Callout */}
                        {match.tradeOffCategory ? (
                          <div className="p-3 rounded border border-rose-200/80 bg-rose-50/40">
                            <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-rose-800 font-bold mb-1">
                              <TrendingDown className="w-3 h-3" />
                              <span>Key Trade-off / Watch Out</span>
                            </div>
                            <div className="flex items-baseline justify-between">
                              <span className="font-semibold text-charcoal">
                                {match.tradeOffCategory.categoryName}
                              </span>
                              <span className="font-mono font-bold text-rose-800">
                                {match.tradeOffCategory.averageScore.toFixed(1)} / 10
                              </span>
                            </div>
                            <span className="text-[10px] text-charcoal-muted mt-0.5 block">
                              Rated lower across {match.tradeOffCategory.responseCount} student votes
                            </span>
                          </div>
                        ) : (
                          <div className="p-3 rounded border border-warm-grey bg-paper/50 flex flex-col justify-center">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-muted font-bold block mb-1">
                              Trade-off Profile
                            </span>
                            <span className="text-charcoal-muted text-[11px]">
                              {hasPartialData
                                ? "No acute critical trade-offs detected in rated categories."
                                : "Awaiting student evaluations to assess potential trade-offs."}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Missing evidence tags */}
                      {match.missingCategories.length > 0 && (
                        <div className="mb-4 text-[11px] text-charcoal-muted flex items-start gap-1.5 flex-wrap">
                          <span className="font-mono font-semibold text-charcoal-muted/80">
                            Missing evidence for:
                          </span>
                          {match.missingCategories.map((cName) => (
                            <span
                              key={cName}
                              className="px-2 py-0.5 rounded bg-warm-grey-light/50 border border-warm-grey/60 text-[10px] font-sans"
                            >
                              {cName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer Row: Evidence badge & CTA */}
                    <div className="pt-4 border-t border-warm-grey flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-olive" />
                        <span className="text-charcoal-muted text-[11px] font-mono">
                          Evidence: <strong>{match.evidenceStrengthLabel}</strong>
                        </span>
                      </div>

                      <button
                        onClick={() => onSelectCollege(match.collegeId)}
                        className="btn-primary min-h-[40px] text-xs py-2 px-4 font-semibold inline-flex items-center justify-center gap-1.5 self-stretch sm:self-auto shadow-xs"
                      >
                        <span>View College & Telemetry</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Footnote Disclosing Methodology */}
          <div className="p-4 rounded-lg bg-warm-grey-light/50 border border-warm-grey text-[11px] text-charcoal-muted leading-relaxed font-sans">
            <div className="flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-olive shrink-0 mt-0.5" />
              <div>
                <strong>Transparency Note:</strong> The personalized fit score is calculated deterministically from your assigned category weights and real available student feedback. It is strictly custom to your priorities and does <em>not</em> represent an official institutional ranking or endorsement. Missing categories are excluded from scoring rather than penalized as zero.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
