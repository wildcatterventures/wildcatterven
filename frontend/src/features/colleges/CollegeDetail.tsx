import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  MapPin,
  School,
  GraduationCap,
  MessageSquareQuote,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  BarChart3,
} from "lucide-react";
import { api } from "../../lib/api";
import type { CollegeDetail as CollegeDetailType, CollegeRatingReport } from "../../types/college";
import { ScoreBadge } from "../../components/ScoreBadge";
import { DemoBadge } from "../../components/DemoBadge";
import { getCollegePhoto } from "./CollegeCard";


interface CollegeDetailProps {
  collegeId: string;
  onBack: () => void;
  onRate: (collegeId: string) => void;
}

export const CollegeDetail: React.FC<CollegeDetailProps> = ({
  collegeId,
  onBack,
  onRate,
}) => {
  const [college, setCollege] = useState<CollegeDetailType | null>(null);
  const [report, setReport] = useState<CollegeRatingReport | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    Promise.all([api.getCollege(collegeId), api.getCollegeRatings(collegeId)])
      .then(([colData, repData]) => {
        if (mounted) {
          setCollege(colData);
          setReport(repData);
        }
      })
      .catch((err: any) => {
        if (mounted) {
          setError(err.message || "Failed to load college details.");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [collegeId]);

  if (loading) {
    return (
      <div className="py-20 px-4 max-w-5xl mx-auto text-center font-sans">
        <div className="inline-block w-8 h-8 border-2 border-olive border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-charcoal-muted">Retrieving institutional records from PostgreSQL...</p>
      </div>
    );
  }

  if (error || !college || !report) {
    return (
      <div className="py-16 px-4 max-w-xl mx-auto text-center font-sans">
        <div className="p-4 rounded bg-rose-50 border border-rose-200 text-rose-800 text-sm mb-6">
          <AlertCircle className="w-5 h-5 mx-auto mb-2 text-rose-600" />
          <span>{error || "College record not found."}</span>
        </div>
        <button onClick={onBack} className="btn-secondary text-xs">
          ← Back to Registry
        </button>
      </div>
    );
  }

  // Extract unique categories
  const categories = [
    "all",
    ...Array.from(new Set(report.parameters.map((p) => p.parameter_category))),
  ];

  const filteredParams =
    selectedCategory === "all"
      ? report.parameters
      : report.parameters.filter((p) => p.parameter_category === selectedCategory);

  const hasRatings = college.total_submitted_sessions > 0;

  // Category average summaries for visual overview
  const categorySummaries = categories
    .filter((c) => c !== "all")
    .map((cat) => {
      const catParams = report.parameters.filter((p) => p.parameter_category === cat);
      const scoredParams = catParams.filter((p) => p.average_score !== null);
      const avg =
        scoredParams.length > 0
          ? scoredParams.reduce((acc, p) => acc + (p.average_score || 0), 0) / scoredParams.length
          : null;
      return { category: cat, avg, totalCount: catParams.length };
    });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto font-sans">
      {/* Navigation Breadcrumb */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-muted hover:text-charcoal mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Institutional Directory</span>
      </button>

      {/* College Overview Masthead */}
      <div className="editorial-card overflow-hidden bg-card mb-8 shadow-card">
        {/* Photographic Campus Hero Banner */}
        <div className="relative h-60 sm:h-72 w-full overflow-hidden bg-warm-grey-light">
          <img
            src={getCollegePhoto(college)}
            alt={`${college.name} campus architecture`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/30 to-black/20" />
          <div className="absolute bottom-4 left-6 sm:left-8 right-6 sm:right-8 flex items-end justify-between text-white">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-warm-grey-light mb-1">
                Institutional Campus Document
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-charcoal/80 backdrop-blur-md text-paper border border-white/20 font-bold">
                  {college.short_code}
                </span>
                <span className="text-xs sm:text-sm font-sans flex items-center gap-1.5 text-paper">
                  <MapPin className="w-3.5 h-3.5 text-olive-light" />
                  {college.city}, {college.state}
                </span>
              </div>
            </div>

            {college.is_demo ? (
              <DemoBadge className="shadow-lg" />
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider bg-olive/95 text-white backdrop-blur-md border border-white/20 shadow-lg">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Institution
              </span>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex-1">
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-charcoal mb-3 leading-tight">
                {college.name}
              </h1>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-4 sm:pt-0 border-warm-grey">
              <span className="text-[10px] font-mono uppercase text-charcoal-muted tracking-wider mb-1.5">
                Official College Score
              </span>
              <ScoreBadge score={college.current_score} size="lg" />
            </div>
          </div>


        {/* Demo Alert if Simulated */}
        {college.is_demo && (
          <div className="mt-6 p-3 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Simulated Demonstration Scenario:</strong> This record is populated with synthetic ratings to test threshold scoring transitions (100 → 99 or 100 → 101). Real university benchmarks remain untouched.
            </div>
          </div>
        )}

        {/* Metrics Bar */}
        <div className="mt-8 pt-6 border-t border-warm-grey grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded bg-paper border border-warm-grey/60">
            <div className="text-2xl font-bold text-charcoal font-serif">
              {college.total_submitted_sessions}
            </div>
            <div className="text-[10px] text-charcoal-muted uppercase font-mono mt-0.5">
              Verified Ratings
            </div>
          </div>

          <div className="p-3 rounded bg-paper border border-warm-grey/60" title="Self-declared current students">
            <div className="text-2xl font-bold text-charcoal font-serif flex items-center justify-center gap-1.5">
              <School className="w-4 h-4 text-olive" />
              <span>{college.current_student_submissions}</span>
            </div>
            <div className="text-[10px] text-charcoal-muted uppercase font-mono mt-0.5">
              Current Students
            </div>
          </div>

          <div className="p-3 rounded bg-paper border border-warm-grey/60" title="Self-declared alumni">
            <div className="text-2xl font-bold text-charcoal font-serif flex items-center justify-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-charcoal-muted" />
              <span>{college.alumni_submissions}</span>
            </div>
            <div className="text-[10px] text-charcoal-muted uppercase font-mono mt-0.5">
              Alumni
            </div>
          </div>

          <div className="p-3 rounded bg-paper border border-warm-grey/60" title="Threshold blocks progress">
            <div className="text-sm font-bold text-charcoal font-mono pt-1">
              {college.total_qualifying_low} Low / {college.total_qualifying_high} High
            </div>
            <div className="text-[10px] text-charcoal-muted uppercase font-mono mt-1">
              Threshold Blocks
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-warm-grey/60">
          <p className="text-xs text-charcoal-muted italic">
            Affiliation is self-declared and unverified. Scores update exclusively via completed 20-contribution blocks.
          </p>

          <button
            onClick={() => onRate(college.college_id)}
            className="btn-primary text-xs w-full sm:w-auto py-2.5 px-6 font-semibold whitespace-nowrap"
          >
            <MessageSquareQuote className="w-4 h-4" />
            <span>Rate This College</span>
          </button>
        </div>
      </div>
      </div>


      {/* Threshold Demonstration Notice */}
      {college.is_demo && (
        <div className="mb-8 p-4 rounded editorial-card bg-card border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <div className="font-bold text-charcoal text-sm flex items-center gap-2">
              <span>Threshold Block Progression Status</span>
            </div>
            <p className="text-charcoal-muted mt-1">
              {college.total_qualifying_low === 19 && (
                <span className="flex items-center gap-1.5 text-rose-800 font-medium">
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                  Seeded with 19 qualifying low contributions. Submitting 1 more low rating triggers Threshold Block #1, dropping the score from 100 to 99!
                </span>
              )}
              {college.total_qualifying_high === 19 && (
                <span className="flex items-center gap-1.5 text-emerald-800 font-medium">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Seeded with 19 qualifying high contributions. Submitting 1 more high rating triggers Threshold Block #1, raising the score from 100 to 101!
                </span>
              )}
              {college.total_submitted_sessions >= 20 && (
                <span className="text-charcoal font-medium">
                  Threshold block has been triggered. Official college score is live at {college.current_score}.
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => onRate(college.college_id)}
            className="btn-secondary text-xs py-2 px-4 whitespace-nowrap self-start sm:self-auto"
          >
            Test Threshold Flow →
          </button>
        </div>
      )}

      {/* Unrated Institutional Notice (e.g. SFIT or newly created college with 0 submissions) */}
      {!hasRatings ? (
        <div className="editorial-card p-10 sm:p-14 text-center bg-card mb-8 shadow-card border-warm-grey">
          <div className="w-56 h-36 mx-auto mb-6">
            <img
              src="/images/empty_ratings.svg"
              alt="No reviews submitted yet illustration"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-mono text-xs uppercase tracking-wider text-olive font-semibold">
            Clean Slate Baseline 100
          </span>
          <h3 className="font-serif text-3xl font-bold text-charcoal mt-1 mb-3">
            Ratings Not Available Yet
          </h3>
          <p className="text-xs sm:text-sm text-charcoal-muted max-w-lg mx-auto mb-6 leading-relaxed font-sans">
            Campus Uncut does not invent placeholder ratings. <strong>{college.name}</strong> holds the neutral baseline score of 100. Be the first current student or alumnus to submit an experience across the 25 parameters.
          </p>
          <button
            onClick={() => onRate(college.college_id)}
            className="btn-primary text-xs py-3 px-8 font-semibold"
          >
            <MessageSquareQuote className="w-4 h-4" />
            <span>Submit First Rating Session</span>
          </button>
        </div>
      ) : (
        /* Visual Category Overview Bar */
        <div className="mb-8 editorial-card p-5 bg-card">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-olive" />
            <h3 className="font-serif font-bold text-base text-charcoal">
              Category Performance Averages
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {categorySummaries.map(({ category, avg, totalCount }) => (
              <div
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`p-3 rounded border cursor-pointer transition-all ${
                  selectedCategory === category
                    ? "border-charcoal bg-charcoal text-paper shadow-sm"
                    : "border-warm-grey bg-paper hover:border-olive"
                }`}
              >
                <div className="text-[10px] uppercase font-mono font-semibold truncate mb-1">
                  {category}
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold font-serif">
                    {avg !== null ? avg.toFixed(1) : "—"}
                  </span>
                  <span className="text-[10px] opacity-70 font-mono">
                    {totalCount} criteria
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 25-Parameter Breakdown Section */}
      <div className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-warm-grey pb-4 mb-6 gap-3">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-olive font-semibold">
              The 25 Parameter Standards
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal mt-1">
              Detailed Parameter Ratings
            </h2>
            <p className="text-xs text-charcoal-muted mt-1 font-sans">
              Rated on a 1–10 scale. "No view" selections are mathematically excluded from averages.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full capitalize text-xs transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-charcoal text-paper font-semibold"
                    : "bg-card border border-warm-grey text-charcoal-muted hover:text-charcoal"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Parameter Rows Grid */}
        <div className="space-y-4">
          {filteredParams.map((param) => {
            const hasScore = param.average_score !== null;
            const avg = param.average_score ?? 0;
            const percentWidth = Math.min(Math.max((avg / 10) * 100, 0), 100);

            return (
              <div
                key={param.parameter_id}
                className="editorial-card p-5 bg-card hover:border-warm-grey-dark transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs text-charcoal-muted w-6">
                      #{param.display_order}
                    </span>
                    <div>
                      <h4 className="font-serif text-base sm:text-lg font-bold text-charcoal">
                        {param.parameter_name}
                      </h4>
                      <span className="text-[10px] font-mono text-olive uppercase tracking-wider font-semibold">
                        {param.parameter_category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-3 self-end sm:self-auto">
                    {hasScore ? (
                      <div className="text-right">
                        <span className="font-serif text-2xl font-bold text-charcoal">
                          {param.average_score?.toFixed(2)}
                        </span>
                        <span className="text-xs text-charcoal-muted font-mono ml-1">/ 10</span>
                      </div>
                    ) : (
                      <span className="px-2.5 py-1 rounded bg-warm-grey-light text-charcoal-muted text-[11px] font-mono">
                        No ratings (n=0)
                      </span>
                    )}
                  </div>
                </div>

                {/* Score Horizontal Bar */}
                <div className="w-full bg-warm-grey-light h-2 rounded-full overflow-hidden mb-3">
                  {hasScore ? (
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        avg >= 8
                          ? "bg-emerald-700"
                          : avg >= 4
                          ? "bg-olive"
                          : "bg-rose-700"
                      }`}
                      style={{ width: `${percentWidth}%` }}
                    />
                  ) : (
                    <div className="h-full bg-warm-grey w-0" />
                  )}
                </div>

                {/* Response Metadata */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-charcoal-muted pt-2 border-t border-warm-grey gap-2 font-mono">
                  <div className="flex items-center gap-4 text-[11px]">
                    <span>
                      <strong>{param.numeric_response_count}</strong> numeric reviews (n)
                    </span>
                    <span>•</span>
                    <span>
                      <strong>{param.no_view_count}</strong> "No view"
                    </span>
                  </div>

                  <div className="text-[10px] text-charcoal-muted">
                    {hasScore
                      ? avg >= 8
                        ? "Exceeds Expectations"
                        : avg >= 4
                        ? "Satisfactory Standard"
                        : "Requires Remediation"
                      : "Awaiting baseline evaluation"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
