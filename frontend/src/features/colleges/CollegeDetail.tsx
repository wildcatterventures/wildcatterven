import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  MapPin,
  School,
  GraduationCap,
  MessageSquareQuote,
  AlertCircle,
  HelpCircle,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { api } from "../../lib/api";
import type { CollegeDetail as ICollegeDetail, CollegeRatingReport } from "../../types/college";
import { ScoreBadge } from "../../components/ScoreBadge";
import { DemoBadge } from "../../components/DemoBadge";

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
  const [college, setCollege] = useState<ICollegeDetail | null>(null);
  const [report, setReport] = useState<CollegeRatingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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
      <div className="py-16 px-4 max-w-5xl mx-auto text-center font-sans">
        <div className="inline-block w-8 h-8 border-2 border-olive border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-charcoal-muted">Loading institutional intelligence from database...</p>
      </div>
    );
  }

  if (error || !college || !report) {
    return (
      <div className="py-12 px-4 max-w-xl mx-auto text-center font-sans">
        <div className="p-4 rounded bg-rose-50 border border-rose-200 text-rose-800 text-sm mb-6">
          <AlertCircle className="w-5 h-5 mx-auto mb-2 text-rose-600" />
          <span>{error || "College record not found."}</span>
        </div>
        <button onClick={onBack} className="btn-secondary text-xs">
          ← Back to Directory
        </button>
      </div>
    );
  }

  // Extract unique categories
  const categories = ["all", ...Array.from(new Set(report.parameters.map((p) => p.parameter_category)))];

  const filteredParams =
    selectedCategory === "all"
      ? report.parameters
      : report.parameters.filter((p) => p.parameter_category === selectedCategory);

  const hasRatings = college.total_submitted_sessions > 0;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto font-sans">
      {/* Navigation Breadcrumb */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-muted hover:text-charcoal mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to College Directory</span>
      </button>

      {/* College Overview Masthead */}
      <div className="editorial-card p-6 sm:p-8 bg-card mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
                {college.short_code}
              </span>
              {college.is_demo && <DemoBadge />}
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-charcoal mb-3 leading-tight">
              {college.name}
            </h1>

            <p className="text-sm text-charcoal-muted flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-olive flex-shrink-0" />
              <span>
                {college.city}, {college.state}
              </span>
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-4 sm:pt-0 border-warm-grey">
            <span className="text-[11px] font-mono uppercase text-charcoal-muted mb-1">
              Official College Score
            </span>
            <ScoreBadge score={college.current_score} size="lg" />
          </div>
        </div>

        {/* Demo Alert if Simulated */}
        {college.is_demo && (
          <div className="mt-6 p-3 rounded bg-warm-grey-light border border-warm-grey text-xs text-charcoal flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-olive flex-shrink-0 mt-0.5" />
            <div>
              <strong>Demonstration Scenario Notice:</strong> This is a seeded simulation designed to prove threshold score transitions. Rating entries are clearly isolated and will never affect non-demo college statistics.
            </div>
          </div>
        )}

        {/* Scoring & Participation Metrics Bar */}
        <div className="mt-8 pt-6 border-t border-warm-grey grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-3 rounded bg-paper">
            <div className="text-xl font-bold text-charcoal">{college.total_submitted_sessions}</div>
            <div className="text-[10px] text-charcoal-muted uppercase font-mono mt-0.5">
              Submitted Ratings
            </div>
          </div>

          <div className="p-3 rounded bg-paper" title="Self-declared current student respondents">
            <div className="text-xl font-bold text-charcoal flex items-center justify-center gap-1.5">
              <School className="w-4 h-4 text-olive" />
              <span>{college.current_student_submissions}</span>
            </div>
            <div className="text-[10px] text-charcoal-muted uppercase font-mono mt-0.5">
              Current Students
            </div>
          </div>

          <div className="p-3 rounded bg-paper" title="Self-declared alumni respondents">
            <div className="text-xl font-bold text-charcoal flex items-center justify-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-charcoal-muted" />
              <span>{college.alumni_submissions}</span>
            </div>
            <div className="text-[10px] text-charcoal-muted uppercase font-mono mt-0.5">
              Alumni
            </div>
          </div>

          <div className="p-3 rounded bg-paper" title="Threshold block progress">
            <div className="text-xs font-semibold text-charcoal">
              {college.total_qualifying_low} Low / {college.total_qualifying_high} High
            </div>
            <div className="text-[10px] text-charcoal-muted uppercase font-mono mt-0.5">
              Threshold Blocks
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-charcoal-muted italic">
            Affiliation is self-declared and unverified. Scores update exclusively via completed 20-contribution blocks.
          </p>

          <button
            onClick={() => onRate(college.college_id)}
            className="btn-primary text-xs w-full sm:w-auto py-2.5 px-6 whitespace-nowrap"
          >
            <MessageSquareQuote className="w-4 h-4" />
            <span>Rate This College</span>
          </button>
        </div>
      </div>

      {/* Threshold Status Banner for Demo institutions */}
      {college.is_demo && (
        <div className="mb-8 p-4 rounded editorial-card bg-card border-olive/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-bold text-charcoal text-sm flex items-center gap-2">
              <span>Threshold Demonstration State</span>
            </div>
            <p className="text-charcoal-muted mt-0.5">
              {college.total_qualifying_low === 19 && (
                <span className="flex items-center gap-1 text-[#872023] font-medium mt-1">
                  <TrendingDown className="w-4 h-4" />
                  Seeded with exactly 19 qualifying low contributions. Submitting 1 more low rating will drop the score from 100 to 99!
                </span>
              )}
              {college.total_qualifying_high === 19 && (
                <span className="flex items-center gap-1 text-[#1E513A] font-medium mt-1">
                  <TrendingUp className="w-4 h-4" />
                  Seeded with exactly 19 qualifying high contributions. Submitting 1 more high rating will raise the score from 100 to 101!
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => onRate(college.college_id)}
            className="btn-secondary text-xs self-start sm:self-auto py-1.5"
          >
            Test Threshold Now →
          </button>
        </div>
      )}

      {/* Unrated Institutional Notice (if 0 reviews, like SFIT or newly created college) */}
      {!hasRatings && (
        <div className="editorial-card p-10 text-center bg-card mb-8">
          <div className="w-12 h-12 rounded-full bg-warm-grey-light flex items-center justify-center mx-auto mb-3 text-olive">
            <MessageSquareQuote className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-charcoal mb-2">
            Ratings Not Available Yet
          </h3>
          <p className="text-xs sm:text-sm text-charcoal-muted max-w-md mx-auto mb-6 leading-relaxed">
            Reviews are never fabricated on Campus Uncut. Be the first current student or alumnus to submit your experience and establish verified parameter averages.
          </p>
          <button
            onClick={() => onRate(college.college_id)}
            className="btn-primary text-xs py-2.5 px-6"
          >
            <MessageSquareQuote className="w-4 h-4" />
            <span>Submit First Rating Session</span>
          </button>
        </div>
      )}

      {/* 25-Parameter Breakdown Section */}
      <div className="mt-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-warm-grey pb-4 mb-6 gap-3">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-olive font-semibold">
              Question Bank Breakdown
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal mt-1">
              Parameter Intelligence
            </h2>
            <p className="text-xs text-charcoal-muted mt-1 font-sans">
              25 core campus parameters rated on a 1–10 scale. "No view" answers are excluded from averages.
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
            // Percent width for 10-point scale
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
                      <span className="text-[11px] font-mono text-olive uppercase tracking-wider">
                        {param.parameter_category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-3 self-end sm:self-auto">
                    {hasScore ? (
                      <div className="text-right">
                        <span className="font-serif text-xl sm:text-2xl font-bold text-charcoal">
                          {param.average_score?.toFixed(2)}
                        </span>
                        <span className="text-xs text-charcoal-muted font-mono ml-1">/ 10</span>
                      </div>
                    ) : (
                      <span className="text-xs text-charcoal-muted italic">No ratings yet</span>
                    )}
                  </div>
                </div>

                {/* Score Bar */}
                <div className="w-full bg-warm-grey-light h-2 rounded-full overflow-hidden mb-3">
                  {hasScore ? (
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        avg >= 8
                          ? "bg-[#2D6A4F]"
                          : avg >= 4
                          ? "bg-olive"
                          : "bg-[#9B2226]"
                      }`}
                      style={{ width: `${percentWidth}%` }}
                    />
                  ) : (
                    <div className="h-full bg-warm-grey w-0" />
                  )}
                </div>

                {/* Response Metadata & Histogram */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-charcoal-muted pt-2 border-t border-warm-grey gap-2">
                  <div className="flex items-center gap-4">
                    <span>
                      <strong>{param.numeric_response_count}</strong> numeric reviews
                    </span>
                    <span>
                      <strong>{param.no_view_count}</strong> marked No view
                    </span>
                  </div>

                  {/* Distribution badges if any */}
                  {param.distributions.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] font-mono">
                      <span className="text-charcoal-muted mr-1">Scores:</span>
                      {param.distributions.map((d) => (
                        <span
                          key={d.rating_score}
                          className="px-1.5 py-0.5 rounded bg-warm-grey-light text-charcoal"
                          title={`Score ${d.rating_score}: ${d.frequency} respondents`}
                        >
                          {d.rating_score}★ ({d.frequency})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
