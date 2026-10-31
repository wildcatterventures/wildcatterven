import React, { useState, useEffect } from "react";
import {
  ArrowLeftRight,
  Building2,
  HelpCircle,
  AlertCircle,
  RefreshCw,
  X,
  Plus,
  Star,
} from "lucide-react";
import { api } from "../../../lib/api";
import type { CollegeDetail, CollegeRatingReport, CollegeSummary } from "../../../types/college";
import { THEMATIC_CATEGORIES } from "../../../lib/thematicCategories";
import { getCollegeCategoryMetrics } from "../../../lib/matchEngine";
import { getCollegePhoto } from "../CollegeCard";

function getCollegeOverallAvg(rep: CollegeRatingReport | null): number | null {
  if (!rep || !rep.parameters) return null;
  const scored = rep.parameters.filter((p) => p.average_score !== null);
  if (scored.length === 0) return null;
  return scored.reduce((sum, p) => sum + (p.average_score || 0), 0) / scored.length;
}

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
  const [isPickerOpen, setIsPickerOpen] = useState(false);

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

  const currentOverallAvg = getCollegeOverallAvg(currentReport);
  const targetOverallAvg = getCollegeOverallAvg(targetReport);

  return (
    <div id="college-comparison" className="editorial-card p-4 sm:p-6 bg-card border border-warm-grey rounded-2xl shadow-card mb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-warm-grey pb-4 mb-5 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-olive" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-muted">
              Interactive Analytics • Head-to-Head
            </span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-charcoal mt-1">
            Compare Colleges
          </h3>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Selected Colleges Row (Matches Reference Image 1 Screen 7) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {/* College 1 Card (Primary) */}
        <div className="p-3 rounded-xl bg-paper border border-warm-grey flex items-center gap-3">
          <img
            src={getCollegePhoto(currentCollege)}
            alt={currentCollege.name}
            className="w-14 h-14 rounded-lg object-cover border border-warm-grey shrink-0 bg-warm-grey-light"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-serif font-bold text-sm text-charcoal truncate">
              {currentCollege.name}
            </h4>
            <p className="text-[11px] text-charcoal-muted truncate">
              {currentCollege.city}, {currentCollege.state}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              {currentCollege.total_submitted_sessions > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warm-grey-light font-mono text-[10px] font-bold text-charcoal">
                  <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                  {currentOverallAvg !== null
                    ? currentOverallAvg.toFixed(1)
                    : (currentCollege.current_score / 10).toFixed(1)}
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-warm-grey-light font-mono text-[10px] font-semibold text-charcoal-muted">
                  Unrated
                </span>
              )}
              <span className="text-[10px] font-mono text-charcoal-muted">
                {currentCollege.total_submitted_sessions} reviews
              </span>
            </div>
          </div>
        </div>

        {/* College 2 Card or Add College Action */}
        {targetCollege ? (
          <div className="p-3 rounded-xl bg-paper border border-warm-grey flex items-center gap-3 relative animate-in fade-in duration-150">
            <img
              src={getCollegePhoto(targetCollege)}
              alt={targetCollege.name}
              className="w-14 h-14 rounded-lg object-cover border border-warm-grey shrink-0 bg-warm-grey-light"
            />
            <div className="min-w-0 flex-1 pr-6">
              <h4 className="font-serif font-bold text-sm text-charcoal truncate">
                {targetCollege.name}
              </h4>
              <p className="text-[11px] text-charcoal-muted truncate">
                {targetCollege.city}, {targetCollege.state}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                {targetCollege.total_submitted_sessions > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warm-grey-light font-mono text-[10px] font-bold text-charcoal">
                    <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                    {targetOverallAvg !== null
                      ? targetOverallAvg.toFixed(1)
                      : (targetCollege.current_score / 10).toFixed(1)}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-warm-grey-light font-mono text-[10px] font-semibold text-charcoal-muted">
                    Unrated
                  </span>
                )}
                <span className="text-[10px] font-mono text-charcoal-muted">
                  {targetCollege.total_submitted_sessions} reviews
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setTargetCollegeId("");
                setIsPickerOpen(false);
              }}
              aria-label="Remove college from comparison"
              className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-warm-grey-light hover:bg-warm-grey text-charcoal-muted hover:text-charcoal flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="relative">
            {isPickerOpen ? (
              <div className="p-3 rounded-xl bg-paper border border-olive flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-charcoal">Select Comparison College</span>
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen(false)}
                    className="text-xs text-charcoal-muted hover:text-charcoal"
                  >
                    Cancel
                  </button>
                </div>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-charcoal-muted absolute left-3 top-2.5 pointer-events-none" />
                  <select
                    autoFocus
                    value={targetCollegeId}
                    onChange={(e) => {
                      setTargetCollegeId(e.target.value);
                      setIsPickerOpen(false);
                    }}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-card border border-warm-grey rounded-lg font-sans text-charcoal focus:outline-none focus:border-olive cursor-pointer"
                  >
                    <option value="">Choose an institution...</option>
                    {otherColleges.map((c) => (
                      <option key={c.college_id} value={c.college_id}>
                        {c.name} ({c.city}) {c.is_demo ? "[DEMO]" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="w-full h-full min-h-[76px] p-3 rounded-xl border border-dashed border-warm-grey hover:border-charcoal bg-paper/50 hover:bg-paper flex items-center justify-center gap-2 transition-all text-xs font-semibold text-charcoal group"
              >
                <div className="w-7 h-7 rounded-full bg-warm-grey-light group-hover:bg-charcoal group-hover:text-paper flex items-center justify-center transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
                <span>+ Add College to Compare</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Loading state */}
      {loadingTarget && (
        <div className="p-8 text-center text-charcoal-muted font-mono text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-olive" />
          <span>Loading comparison telemetry...</span>
        </div>
      )}

      {/* Empty state when no comparison college is selected */}
      {!targetCollegeId && !loadingTarget && (
        <div className="p-6 text-center text-charcoal-muted bg-warm-grey-light/40 rounded-xl border border-dashed border-warm-grey text-xs font-sans">
          <ArrowLeftRight className="w-6 h-6 text-charcoal-muted/60 mx-auto mb-2" />
          <p className="font-semibold text-charcoal mb-1">
            Head-to-Head Criteria Comparison
          </p>
          <p className="max-w-md mx-auto text-[11px] leading-relaxed">
            Tap "+ Add College to Compare" above to benchmark academics, placements, infrastructure, and campus culture side-by-side.
          </p>
        </div>
      )}

      {/* Side-by-Side Comparison Table (Matches Reference Image 1 Screen 7) */}
      {targetCollege && targetReport && !loadingTarget && (
        <div className="space-y-4">
          <div className="border-t border-warm-grey pt-4">
            <h4 className="font-serif text-base font-bold text-charcoal mb-3">
              Overall Comparison
            </h4>

            {/* Table structure */}
            <div className="rounded-xl border border-warm-grey overflow-hidden bg-paper">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 p-3 bg-warm-grey-light/60 border-b border-warm-grey text-[11px] font-mono font-bold text-charcoal-muted uppercase">
                <div className="col-span-6 text-left">Category</div>
                <div className="col-span-3 text-center truncate">{currentCollege.name.split(" ")[0]}</div>
                <div className="col-span-3 text-center truncate">{targetCollege.name.split(" ")[0]}</div>
              </div>

              {/* Overall Score Row */}
              <div className="grid grid-cols-12 gap-2 p-3 items-center border-b border-warm-grey/60 text-xs">
                <div className="col-span-6 font-semibold text-charcoal">
                  Overall Rating
                </div>
                <div className="col-span-3 text-center">
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-warm-grey-light font-mono font-bold text-charcoal">
                    {currentCollege.total_submitted_sessions > 0
                      ? (currentOverallAvg !== null
                          ? currentOverallAvg.toFixed(1)
                          : (currentCollege.current_score / 10).toFixed(1))
                      : "Unrated"}
                  </span>
                </div>
                <div className="col-span-3 text-center">
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-warm-grey-light font-mono font-bold text-charcoal">
                    {targetCollege.total_submitted_sessions > 0
                      ? (targetOverallAvg !== null
                          ? targetOverallAvg.toFixed(1)
                          : (targetCollege.current_score / 10).toFixed(1))
                      : "Unrated"}
                  </span>
                </div>
              </div>

              {/* Thematic Category Rows */}
              {THEMATIC_CATEGORIES.map((cat) => {
                const currentMetrics = getCollegeCategoryMetrics(currentReport, cat);
                const targetMetrics = getCollegeCategoryMetrics(targetReport, cat);

                const currentAvg = currentMetrics.avg;
                const targetAvg = targetMetrics.avg;

                const isCurrentHigher =
                  currentAvg !== null && targetAvg !== null && currentAvg > targetAvg;
                const isTargetHigher =
                  currentAvg !== null && targetAvg !== null && targetAvg > currentAvg;

                return (
                  <div
                    key={cat.id}
                    className="grid grid-cols-12 gap-2 p-3 items-center border-b border-warm-grey/40 last:border-b-0 text-xs hover:bg-warm-grey-light/20 transition-colors"
                  >
                    <div className="col-span-6">
                      <span className="font-medium text-charcoal block">
                        {cat.name}
                      </span>
                      <span className="text-[10px] text-charcoal-muted line-clamp-1">
                        {cat.description}
                      </span>
                    </div>

                    <div className="col-span-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg font-mono text-xs transition-all ${
                          isCurrentHigher
                            ? "bg-olive-light text-olive font-bold border border-olive/30 shadow-subtle"
                            : "bg-warm-grey-light/80 text-charcoal font-semibold"
                        }`}
                      >
                        {currentAvg !== null ? currentAvg.toFixed(1) : "—"}
                      </span>
                    </div>

                    <div className="col-span-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg font-mono text-xs transition-all ${
                          isTargetHigher
                            ? "bg-olive-light text-olive font-bold border border-olive/30 shadow-subtle"
                            : "bg-warm-grey-light/80 text-charcoal font-semibold"
                        }`}
                      >
                        {targetAvg !== null ? targetAvg.toFixed(1) : "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footnote */}
          <div className="mt-3 pt-2 flex items-start gap-1.5 text-[10px] text-charcoal-muted font-sans">
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
