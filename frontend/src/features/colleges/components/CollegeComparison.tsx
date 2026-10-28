import React, { useState, useEffect } from "react";
import { ArrowLeftRight, Building2, HelpCircle, AlertCircle, RefreshCw } from "lucide-react";
import { api } from "../../../lib/api";
import type { CollegeDetail, CollegeRatingReport, CollegeSummary } from "../../../types/college";
import { THEMATIC_CATEGORIES } from "../../../lib/thematicCategories";
import { getCollegeCategoryMetrics } from "../../../lib/matchEngine";

interface CollegeComparisonProps {
  currentCollege: CollegeDetail;
  currentReport: CollegeRatingReport;
  allColleges: CollegeSummary[];
}

export const CollegeComparison: React.FC<CollegeComparisonProps> = ({
  currentCollege,
  currentReport,
  allColleges,
}) => {
  const [targetCollegeId, setTargetCollegeId] = useState<string>("");
  const [targetCollege, setTargetCollege] = useState<CollegeDetail | null>(null);
  const [targetReport, setTargetReport] = useState<CollegeRatingReport | null>(null);
  const [loadingTarget, setLoadingTarget] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter out current college from options
  const otherColleges = allColleges.filter(
    (c) => c.college_id !== currentCollege.college_id
  );

  useEffect(() => {
    if (!targetCollegeId) {
      setTargetCollege(null);
      setTargetReport(null);
      return;
    }

    let mounted = true;
    setLoadingTarget(true);
    setError(null);

    Promise.all([
      api.getCollege(targetCollegeId),
      api.getCollegeRatings(targetCollegeId),
    ])
      .then(([col, rep]) => {
        if (mounted) {
          setTargetCollege(col);
          setTargetReport(rep);
        }
      })
      .catch((err: any) => {
        if (mounted) {
          setError(err.message || "Failed to load comparison college.");
        }
      })
      .finally(() => {
        if (mounted) setLoadingTarget(false);
      });

    return () => {
      mounted = false;
    };
  }, [targetCollegeId]);

  return (
    <div className="editorial-card p-4 sm:p-6 bg-card border-warm-grey shadow-card mb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-warm-grey pb-4 mb-5 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-olive" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-muted">
              Interactive Analytics • Head-to-Head
            </span>
          </div>
          <h3 className="font-serif text-xl font-bold text-charcoal mt-1">
            Compare Across Matching Rubric Categories
          </h3>
        </div>

        {/* Dropdown selector for Target College */}
        <div className="flex items-center gap-2 min-w-[260px]">
          <Building2 className="w-4 h-4 text-charcoal-muted shrink-0" />
          <select
            value={targetCollegeId}
            onChange={(e) => setTargetCollegeId(e.target.value)}
            className="w-full text-xs bg-paper border border-warm-grey rounded py-2 px-3 text-charcoal font-sans focus:outline-none focus:border-olive cursor-pointer"
          >
            <option value="">Select a college to compare...</option>
            {otherColleges.map((c) => (
              <option key={c.college_id} value={c.college_id}>
                {c.name} ({c.city}) {c.is_demo ? "[DEMO]" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* When no college is selected yet */}
      {!targetCollegeId && (
        <div className="p-8 text-center text-charcoal-muted bg-warm-grey-light/30 rounded border border-dashed border-warm-grey text-xs font-sans">
          <ArrowLeftRight className="w-8 h-8 text-charcoal-muted/60 mx-auto mb-2" />
          <p className="font-semibold text-charcoal mb-1">
            Side-by-Side Category Benchmarking
          </p>
          <p className="max-w-md mx-auto text-[11px] leading-relaxed">
            Select another institution from the dropdown above to contrast student-verified category scores (1–10 scale) on identical evaluation criteria.
          </p>
        </div>
      )}

      {/* Loading state */}
      {loadingTarget && (
        <div className="p-8 text-center text-charcoal-muted font-mono text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-olive" />
          <span>Loading comparison telemetry...</span>
        </div>
      )}

      {/* Comparison Grid when target college is selected */}
      {targetCollege && targetReport && !loadingTarget && (
        <div>
          {/* Legend & College Headers */}
          <div className="grid grid-cols-12 gap-2 sm:gap-4 pb-3 mb-4 border-b border-warm-grey/80 items-center text-xs">
            <div className="col-span-5 sm:col-span-4 text-left">
              <span className="font-serif font-bold text-charcoal block sm:text-sm truncate">
                {currentCollege.name}
              </span>
              <span className="text-[10px] font-mono text-charcoal-muted block">
                {currentCollege.total_submitted_sessions} session{currentCollege.total_submitted_sessions !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-4 text-center font-mono text-[10px] sm:text-xs uppercase text-olive font-bold">
              Rubric Category
            </div>

            <div className="col-span-5 sm:col-span-4 text-right">
              <span className="font-serif font-bold text-charcoal block sm:text-sm truncate">
                {targetCollege.name}
              </span>
              <span className="text-[10px] font-mono text-charcoal-muted block">
                {targetCollege.total_submitted_sessions} session{targetCollege.total_submitted_sessions !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* 6 Category Row Comparisons */}
          <div className="space-y-4">
            {THEMATIC_CATEGORIES.map((cat) => {
              const currentMetrics = getCollegeCategoryMetrics(currentReport, cat);
              const targetMetrics = getCollegeCategoryMetrics(targetReport, cat);

              const currentAvg = currentMetrics.avg;
              const targetAvg = targetMetrics.avg;

              const currentPct = currentAvg !== null ? (currentAvg / 10) * 100 : 0;
              const targetPct = targetAvg !== null ? (targetAvg / 10) * 100 : 0;

              return (
                <div
                  key={cat.id}
                  className="p-3 sm:p-4 rounded-lg bg-paper/60 border border-warm-grey/70 text-xs"
                >
                  <div className="text-center mb-2">
                    <span className="font-serif font-bold text-charcoal text-xs sm:text-sm">
                      {cat.name}
                    </span>
                    <span className="text-[10px] text-charcoal-muted block mt-0.5 line-clamp-1">
                      {cat.description}
                    </span>
                  </div>

                  {/* Split Bars Row */}
                  <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center">
                    {/* Current College Bar & Value */}
                    <div className="col-span-5 flex items-center gap-2">
                      <div className="font-mono text-right w-10 shrink-0">
                        <span className="font-bold text-charcoal sm:text-sm">
                          {currentAvg !== null ? currentAvg.toFixed(1) : "—"}
                        </span>
                        <span className="text-[9px] text-charcoal-muted block">/ 10</span>
                      </div>
                      <div className="w-full bg-warm-grey-light rounded-full h-2.5 overflow-hidden">
                        {currentAvg !== null ? (
                          <div
                            className={`h-full rounded-full transition-all ${
                              currentAvg >= 8
                                ? "bg-emerald-700"
                                : currentAvg >= 4
                                ? "bg-olive"
                                : "bg-rose-700"
                            }`}
                            style={{ width: `${currentPct}%` }}
                            title={`${currentCollege.name}: ${currentAvg.toFixed(1)}/10 (${currentMetrics.responseCount} votes)`}
                          />
                        ) : (
                          <div className="h-full bg-warm-grey w-0" />
                        )}
                      </div>
                    </div>

                    {/* Middle Divider Icon */}
                    <div className="col-span-2 text-center text-charcoal-muted text-[10px] font-mono">
                      VS
                    </div>

                    {/* Target College Bar & Value */}
                    <div className="col-span-5 flex items-center gap-2 flex-row-reverse sm:flex-row">
                      <div className="w-full bg-warm-grey-light rounded-full h-2.5 overflow-hidden">
                        {targetAvg !== null ? (
                          <div
                            className={`h-full rounded-full transition-all ${
                              targetAvg >= 8
                                ? "bg-emerald-700"
                                : targetAvg >= 4
                                ? "bg-olive"
                                : "bg-rose-700"
                            }`}
                            style={{ width: `${targetPct}%` }}
                            title={`${targetCollege.name}: ${targetAvg.toFixed(1)}/10 (${targetMetrics.responseCount} votes)`}
                          />
                        ) : (
                          <div className="h-full bg-warm-grey w-0" />
                        )}
                      </div>
                      <div className="font-mono text-left w-10 shrink-0">
                        <span className="font-bold text-charcoal sm:text-sm">
                          {targetAvg !== null ? targetAvg.toFixed(1) : "—"}
                        </span>
                        <span className="text-[9px] text-charcoal-muted block">/ 10</span>
                      </div>
                    </div>
                  </div>

                  {/* Subline with response counts and missing data disclosure */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-charcoal-muted pt-2 mt-1">
                    <span>
                      {currentMetrics.responseCount > 0
                        ? `${currentMetrics.responseCount} votes`
                        : "Awaiting ratings"}
                    </span>
                    <span>
                      {targetMetrics.responseCount > 0
                        ? `${targetMetrics.responseCount} votes`
                        : "Awaiting ratings"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footnote */}
          <div className="mt-4 pt-3 border-t border-warm-grey/60 flex items-start gap-1.5 text-[10px] text-charcoal-muted font-sans">
            <HelpCircle className="w-3.5 h-3.5 text-olive shrink-0 mt-0.5" />
            <span>
              Both institutions are contrasted on identical parameter aggregations. Missing category feedback is indicated by dashes ("—") and is never treated as zero.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
