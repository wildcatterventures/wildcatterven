import React, { useState, useMemo } from "react";
import {
  Activity,
  BarChart3,
  Search,
  ChevronDown,
  ChevronUp,
  MessageSquareQuote,
} from "lucide-react";
import type {
  CollegeDetail as CollegeDetailType,
  CollegeRatingReport,
} from "../../../types/college";
import { THEMATIC_CATEGORIES } from "../CollegeDetail";
import { SplitVerdictCard } from "./SplitVerdictCard";
import { analyzeSplitVerdict } from "../../../lib/splitVerdict";

interface StudentPulseProps {
  college: CollegeDetailType;
  report: CollegeRatingReport;
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  selectedParameterKey?: string | null;
  onRate: (collegeId: string) => void;
}

export const StudentPulse: React.FC<StudentPulseProps> = ({
  college,
  report,
  selectedCategory,
  onSelectCategory,
  selectedParameterKey,
  onRate,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"ranked_high" | "ranked_low" | "order">("ranked_high");
  const [expandedParamId, setExpandedParamId] = useState<string | null>(null);

  const hasRatings = college.total_submitted_sessions > 0;

  // Compute category averages safely (strictly excluding No-view)
  const categoryStats = useMemo(() => {
    const stats: Record<
      string,
      { avg: number | null; count: number; scoredCount: number; totalNumericVotes: number }
    > = {};

    THEMATIC_CATEGORIES.forEach((cat) => {
      const catParams = report.parameters.filter((p) =>
        cat.parameterKeys.includes(p.parameter_key)
      );
      const scored = catParams.filter((p) => p.average_score !== null);
      const avg =
        scored.length > 0
          ? scored.reduce((sum, p) => sum + (p.average_score || 0), 0) / scored.length
          : null;
      const totalNumericVotes = catParams.reduce((sum, p) => sum + p.numeric_response_count, 0);

      stats[cat.id] = {
        avg,
        count: catParams.length,
        scoredCount: scored.length,
        totalNumericVotes,
      };
    });

    return stats;
  }, [report]);

  // Aggregate 1-10 score distribution across all parameters in the college
  const aggregateDistribution = useMemo(() => {
    const freqByScore: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
    let totalVotes = 0;

    report.parameters.forEach((param) => {
      param.distributions?.forEach((d) => {
        if (d.rating_score >= 1 && d.rating_score <= 10) {
          freqByScore[d.rating_score] = (freqByScore[d.rating_score] || 0) + d.frequency;
          totalVotes += d.frequency;
        }
      });
    });

    const lowVotes = freqByScore[1] + freqByScore[2] + freqByScore[3];
    const neutralVotes = freqByScore[4] + freqByScore[5] + freqByScore[6] + freqByScore[7];
    const highVotes = freqByScore[8] + freqByScore[9] + freqByScore[10];

    const lowPct = totalVotes > 0 ? (lowVotes / totalVotes) * 100 : 0;
    const neutralPct = totalVotes > 0 ? (neutralVotes / totalVotes) * 100 : 0;
    const highPct = totalVotes > 0 ? (highVotes / totalVotes) * 100 : 0;

    return {
      freqByScore,
      totalVotes,
      lowVotes,
      neutralVotes,
      highVotes,
      lowPct,
      neutralPct,
      highPct,
    };
  }, [report]);

  // Filtered and sorted parameters
  const displayedParams = useMemo(() => {
    let params = [...report.parameters];

    // Filter by thematic category
    if (selectedCategory !== "all") {
      const activeCat = THEMATIC_CATEGORIES.find((c) => c.id === selectedCategory);
      if (activeCat) {
        params = params.filter((p) => activeCat.parameterKeys.includes(p.parameter_key));
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      params = params.filter(
        (p) =>
          p.parameter_name.toLowerCase().includes(q) ||
          p.parameter_category.toLowerCase().includes(q) ||
          p.parameter_key.toLowerCase().includes(q)
      );
    }

    // Sort parameters
    if (sortBy === "ranked_high") {
      params.sort((a, b) => {
        if (a.average_score !== null && b.average_score === null) return -1;
        if (a.average_score === null && b.average_score !== null) return 1;
        if (a.average_score !== null && b.average_score !== null) {
          if (b.average_score !== a.average_score) return b.average_score - a.average_score;
          return b.numeric_response_count - a.numeric_response_count;
        }
        return a.display_order - b.display_order;
      });
    } else if (sortBy === "ranked_low") {
      params.sort((a, b) => {
        if (a.average_score !== null && b.average_score === null) return -1;
        if (a.average_score === null && b.average_score !== null) return 1;
        if (a.average_score !== null && b.average_score !== null) {
          if (a.average_score !== b.average_score) return a.average_score - b.average_score;
          return b.numeric_response_count - a.numeric_response_count;
        }
        return a.display_order - b.display_order;
      });
    } else {
      params.sort((a, b) => a.display_order - b.display_order);
    }

    return params;
  }, [report, selectedCategory, searchQuery, sortBy]);

  const activeCategoryObj = THEMATIC_CATEGORIES.find((c) => c.id === selectedCategory);
  const activeCategoryStat = selectedCategory !== "all" ? categoryStats[selectedCategory] : null;

  if (!hasRatings) {
    return (
      <section id="student-pulse" className="mb-10">
        <div className="editorial-card p-8 sm:p-12 text-center bg-card border-warm-grey shadow-card">
          <div className="w-16 h-16 mx-auto mb-4 p-3.5 rounded-full bg-paper border border-warm-grey flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-olive" />
          </div>
          <span className="font-mono text-xs uppercase tracking-wider text-olive font-semibold block mb-1">
            Student Telemetry
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal mb-2">
            Student Perspective Awaiting First Contributions
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-muted max-w-lg mx-auto mb-6 leading-relaxed font-sans">
            Campus Uncut never fabricates placeholder ratings. <strong>{college.name}</strong> currently holds the starting baseline score of 100. Submit the first authenticated student or alumni evaluation across the 25 parameters.
          </p>
          <button
            onClick={() => onRate(college.college_id)}
            className="btn-primary text-xs py-2.5 px-6 font-semibold inline-flex items-center gap-2 shadow-xs"
          >
            <MessageSquareQuote className="w-4 h-4 text-paper" />
            <span>Submit First Rating Session</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="student-pulse" className="mb-10 space-y-6">
      {/* 1. VISUALIZATION 1: Category Performance Profile */}
      <div className="editorial-card p-4 sm:p-6 bg-card border-warm-grey shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-warm-grey pb-3 sm:pb-4 mb-4 sm:mb-5 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-olive flex-shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-charcoal-muted">
                Student Pulse • Thematic Rubric
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-charcoal mt-1">
              Category Performance Profile
            </h2>
          </div>

          <div className="text-xs text-charcoal-muted font-sans sm:text-right">
            <span>
              <strong>{college.total_submitted_sessions}</strong> session{college.total_submitted_sessions !== 1 ? "s" : ""}
            </span>
            <span> • </span>
            <span>
              <strong>{aggregateDistribution.totalVotes}</strong> numeric response{aggregateDistribution.totalVotes !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <p className="text-xs text-charcoal-muted font-sans mb-4 sm:mb-5 leading-relaxed">
          Mean ratings across the 6 thematic groups (1–10 scale). Click any category to filter the 25 individual parameters below.
        </p>

        {/* 6 Category Horizontal Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {THEMATIC_CATEGORIES.map((cat) => {
            const stat = categoryStats[cat.id];
            const avg = stat?.avg;
            const isSelected = selectedCategory === cat.id;
            const pct = avg !== null && avg !== undefined ? (avg / 10) * 100 : 0;

            return (
              <div
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id === selectedCategory ? "all" : cat.id);
                  const el = document.getElementById("parameter-explorer");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className={`p-4 rounded-md border transition-all cursor-pointer select-none flex flex-col justify-between ${
                  isSelected
                    ? "bg-paper border-charcoal shadow-sm ring-1 ring-charcoal"
                    : "bg-paper/40 border-warm-grey hover:border-charcoal/40 hover:bg-paper/80"
                }`}
                title={`Click to explore ${cat.name}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-serif text-sm font-bold text-charcoal">
                      {cat.name}
                    </span>
                    <div className="flex items-baseline gap-1 font-mono">
                      <span className="font-serif text-lg font-bold text-charcoal">
                        {avg !== null && avg !== undefined ? avg.toFixed(1) : "—"}
                      </span>
                      <span className="text-[10px] text-charcoal-muted">/ 10</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-charcoal-muted font-sans line-clamp-1 mb-2">
                    {cat.description}
                  </p>
                </div>

                <div>
                  {/* Progress track with 4.0 and 8.0 markers */}
                  <div className="relative w-full h-2 rounded-full bg-warm-grey-light overflow-hidden my-1">
                    <div className="absolute top-0 bottom-0 w-0.5 bg-black/15 z-10" style={{ left: "40%" }} />
                    <div className="absolute top-0 bottom-0 w-0.5 bg-black/15 z-10" style={{ left: "80%" }} />
                    {avg !== null && avg !== undefined ? (
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          avg >= 8 ? "bg-emerald-700" : avg >= 4 ? "bg-olive" : "bg-rose-700"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    ) : (
                      <div className="h-full bg-warm-grey w-0" />
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-charcoal-muted font-sans mt-1.5">
                    <span>{stat?.scoredCount || 0} of {cat.parameterKeys.length} parameters rated</span>
                    <span className="text-olive font-medium">{isSelected ? "Viewing details ↓" : "Filter parameters →"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. VISUALIZATION 2: Response Distribution Histogram */}
      {aggregateDistribution.totalVotes > 0 && (
        <div className="editorial-card p-4 sm:p-6 bg-card border-warm-grey shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-warm-grey pb-3 sm:pb-4 mb-3 sm:mb-4 gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-muted block">
                Distribution Profile
              </span>
              <h3 className="font-serif text-base sm:text-lg font-bold text-charcoal mt-0.5">
                Rating Density Across 1–10 Scale
              </h3>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs font-sans flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-700 flex-shrink-0" />
                <span>Low &lt;4.0 ({aggregateDistribution.lowPct.toFixed(0)}%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-olive flex-shrink-0" />
                <span>Neutral 4.0–7.9 ({aggregateDistribution.neutralPct.toFixed(0)}%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-700 flex-shrink-0" />
                <span>High &ge;8.0 ({aggregateDistribution.highPct.toFixed(0)}%)</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-10 gap-1 sm:gap-1.5 text-center items-end h-24 pt-4">
            {Array.from({ length: 10 }, (_, i) => {
              const scoreNum = i + 1;
              const freq = aggregateDistribution.freqByScore[scoreNum] || 0;
              const maxFreq = Math.max(...Object.values(aggregateDistribution.freqByScore), 1);
              const barH = (freq / maxFreq) * 100;

              return (
                <div key={scoreNum} className="flex flex-col items-center h-full justify-end group">
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold text-charcoal mb-1">
                    {freq > 0 ? freq : ""}
                  </span>
                  <div
                    className={`w-full rounded-t transition-all ${
                      freq > 0
                        ? scoreNum >= 8
                          ? "bg-emerald-700 group-hover:bg-emerald-800"
                          : scoreNum >= 4
                          ? "bg-olive group-hover:bg-olive-dark"
                          : "bg-rose-700 group-hover:bg-rose-800"
                        : "bg-warm-grey-light/60 h-1.5"
                    }`}
                    style={{ height: freq > 0 ? `${Math.max(barH, 18)}%` : "6px" }}
                    title={`Score ${scoreNum}: ${freq} votes`}
                  />
                  <span className="text-[10px] font-mono text-charcoal-muted mt-1.5 font-semibold">
                    {scoreNum}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col xs:flex-row items-center justify-between text-[10px] sm:text-[11px] font-mono text-charcoal-muted pt-3 border-t border-warm-grey/60 mt-3 gap-1 text-center xs:text-left">
            <span>Score 1 (Critical)</span>
            <span className="text-charcoal-muted/80 hidden sm:inline">Excluded "No View" selections are transparently omitted from score density</span>
            <span>Score 10 (Exemplary)</span>
          </div>
        </div>
      )}

      {/* 3. VISUALIZATION 3: Parameter Explorer */}
      <div id="parameter-explorer" className="editorial-card p-4 sm:p-6 bg-card border-warm-grey shadow-card">
        {/* Explorer Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-warm-grey pb-4 sm:pb-5 mb-4 sm:mb-5 gap-3">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-olive font-bold">
              Institutional Rubric Explorer
            </span>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-charcoal mt-0.5">
              All 25 Parameters & Evidence Detail
            </h3>
            <p className="text-xs text-charcoal-muted mt-1 font-sans">
              Inspect specific scores, response coverage (n), and score distributions.
            </p>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
            <div className="relative flex-1 xs:flex-initial">
              <Search className="w-3.5 h-3.5 text-charcoal-muted absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter 25 parameters..."
                className="w-full xs:w-44 sm:w-48 pl-8 pr-3 py-1.5 min-h-[36px] text-xs bg-paper border border-warm-grey rounded focus:outline-none focus:border-olive font-sans"
              />
            </div>

            <div className="flex items-center justify-between xs:justify-start gap-1 bg-paper border border-warm-grey rounded p-0.5 text-xs">
              <button
                onClick={() => setSortBy("ranked_high")}
                className={`flex-1 xs:flex-initial px-2 py-1 min-h-[32px] rounded text-[11px] font-medium transition-colors ${
                  sortBy === "ranked_high"
                    ? "bg-charcoal text-paper font-semibold shadow-xs"
                    : "text-charcoal-muted hover:text-charcoal"
                }`}
                title="Sort highest to lowest rating"
              >
                Highest
              </button>
              <button
                onClick={() => setSortBy("ranked_low")}
                className={`flex-1 xs:flex-initial px-2 py-1 min-h-[32px] rounded text-[11px] font-medium transition-colors ${
                  sortBy === "ranked_low"
                    ? "bg-charcoal text-paper font-semibold shadow-xs"
                    : "text-charcoal-muted hover:text-charcoal"
                }`}
                title="Sort lowest to highest rating"
              >
                Lowest
              </button>
              <button
                onClick={() => setSortBy("order")}
                className={`flex-1 xs:flex-initial px-2 py-1 min-h-[32px] rounded text-[11px] font-medium transition-colors ${
                  sortBy === "order"
                    ? "bg-charcoal text-paper font-semibold shadow-xs"
                    : "text-charcoal-muted hover:text-charcoal"
                }`}
                title="Sort standard order #1 to #25"
              >
                Order #1–25
              </button>
            </div>
          </div>
        </div>

        {/* Thematic Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-4 sm:mb-5 scrollbar-none -mx-1 px-1">
          <button
            onClick={() => onSelectCategory("all")}
            className={`px-3 py-1 min-h-[34px] rounded-full text-xs whitespace-nowrap transition-all font-medium flex items-center ${
              selectedCategory === "all"
                ? "bg-charcoal text-paper font-semibold shadow-xs"
                : "bg-paper border border-warm-grey text-charcoal hover:border-charcoal/60"
            }`}
          >
            All Parameters (25)
          </button>

          {THEMATIC_CATEGORIES.map((cat) => {
            const stat = categoryStats[cat.id];
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-3 py-1 min-h-[34px] rounded-full text-xs whitespace-nowrap transition-all flex items-center gap-1.5 font-medium ${
                  isSelected
                    ? "bg-charcoal text-paper font-semibold shadow-xs"
                    : "bg-paper border border-warm-grey text-charcoal hover:border-charcoal/60"
                }`}
              >
                <span>{cat.shortName}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected ? "bg-white/20 text-white" : "bg-warm-grey-light text-charcoal-muted"
                  }`}
                >
                  {cat.parameterKeys.length}
                </span>
                {stat && stat.avg !== null && (
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      isSelected ? "text-emerald-300" : "text-olive"
                    }`}
                  >
                    • {stat.avg.toFixed(1)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Category Header Callout */}
        {activeCategoryObj && (
          <div className="mb-4 sm:mb-5 p-3 sm:p-3.5 rounded bg-warm-grey-light/40 border border-warm-grey/80 flex flex-col xs:flex-row xs:items-center justify-between text-xs font-sans gap-2">
            <div>
              <strong className="text-charcoal">{activeCategoryObj.name}:</strong>{" "}
              <span className="text-charcoal-muted">{activeCategoryObj.description}</span>
            </div>
            {activeCategoryStat?.avg !== null && activeCategoryStat?.avg !== undefined && (
              <span className="font-mono font-bold text-charcoal self-start xs:self-auto flex-shrink-0">
                Mean: {activeCategoryStat.avg.toFixed(2)} / 10
              </span>
            )}
          </div>
        )}

        {/* Parameter List */}
        {displayedParams.length > 0 ? (
          <div className="space-y-3">
            {displayedParams.map((param) => {
              const hasScore = param.average_score !== null;
              const avg = param.average_score ?? 0;
              const percentWidth = Math.min(Math.max((avg / 10) * 100, 0), 100);
              const isExpanded = expandedParamId === param.parameter_id;
              const isHighlighted = selectedParameterKey === param.parameter_key;
              const verdict = analyzeSplitVerdict(
                param.distributions,
                param.average_score,
                param.numeric_response_count
              );

              return (
                <div
                  key={param.parameter_id}
                  id={`param-${param.parameter_key}`}
                  className={`p-3.5 sm:p-4 rounded-md border transition-all ${
                    isHighlighted
                      ? "border-olive bg-olive-light/20 ring-1 ring-olive"
                      : "border-warm-grey bg-paper/30 hover:border-charcoal/40"
                  }`}
                >
                  <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 xs:gap-2 mb-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span className="font-mono text-xs text-charcoal-muted font-bold">
                        #{param.display_order.toString().padStart(2, "0")}
                      </span>
                      <h4 className="font-serif text-sm sm:text-base font-bold text-charcoal">
                        {param.parameter_name}
                      </h4>
                      <span className="text-[10px] font-mono text-olive uppercase tracking-wider">
                        {param.parameter_category}
                      </span>
                      {verdict.totalNumericVotes >= 5 && (
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${verdict.badgeColorClass} ${verdict.badgeBorderClass} ${verdict.textColorClass}`}
                          title={verdict.rationale}
                        >
                          {verdict.verdictType === "split_verdict"
                            ? "⚡ Split Verdict"
                            : verdict.verdictType === "agreement_high"
                            ? "✓ Consensus (High)"
                            : verdict.verdictType === "agreement_low"
                            ? "⚠ Consensus (Critical)"
                            : "Consensus (Neutral)"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-1 self-start xs:self-auto font-mono">
                      {hasScore ? (
                        <>
                          <span className="font-serif text-lg sm:text-xl font-bold text-charcoal">
                            {param.average_score?.toFixed(1)}
                          </span>
                          <span className="text-xs text-charcoal-muted">/ 10</span>
                        </>
                      ) : (
                        <span className="text-xs text-charcoal-muted font-sans italic">
                          Awaiting ratings
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Horizontal Bar with 4.0 and 8.0 markers */}
                  <div className="relative w-full h-2 rounded-full bg-warm-grey-light overflow-hidden my-2">
                    <div className="absolute top-0 bottom-0 w-0.5 bg-black/15 z-10" style={{ left: "40%" }} />
                    <div className="absolute top-0 bottom-0 w-0.5 bg-black/15 z-10" style={{ left: "80%" }} />
                    {hasScore ? (
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          avg >= 8 ? "bg-emerald-700" : avg >= 4 ? "bg-olive" : "bg-rose-700"
                        }`}
                        style={{ width: `${percentWidth}%` }}
                      />
                    ) : (
                      <div className="h-full bg-warm-grey w-0" />
                    )}
                  </div>

                  {/* Subline with response counts and distribution trigger */}
                  <div className="flex flex-col xs:flex-row xs:items-center justify-between text-xs text-charcoal-muted font-sans pt-1 gap-1.5">
                    <div className="flex items-center gap-2 text-[10px] sm:text-[11px]">
                      <span>
                        <strong>{param.numeric_response_count}</strong> numeric vote{param.numeric_response_count !== 1 ? "s" : ""}
                      </span>
                      <span>•</span>
                      <span>
                        <strong>{param.no_view_count}</strong> "No view"
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedParamId(isExpanded ? null : param.parameter_id)}
                        className="inline-flex items-center gap-1 text-[11px] text-charcoal hover:text-olive underline font-sans min-h-[32px]"
                      >
                        <span>{isExpanded ? "Hide Split Verdict" : "View Split Verdict & Votes"}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Split Verdict Card */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-warm-grey/70">
                      <SplitVerdictCard
                        parameterName={param.parameter_name}
                        categoryName={param.parameter_category}
                        distributions={param.distributions}
                        averageScore={param.average_score}
                        numericCount={param.numeric_response_count}
                        noViewCount={param.no_view_count}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-charcoal-muted font-sans text-xs">
            No parameters match your search "{searchQuery}".
          </div>
        )}
      </div>
    </section>
  );
};
