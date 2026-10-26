import React from "react";
import { AlertTriangle, CheckCircle2, Info, ChevronRight } from "lucide-react";
import type { ParameterRating } from "../../../types/college";

interface HonestVerdictProps {
  totalSessions: number;
  parameters: ParameterRating[];
  onSelectParameter: (parameterKey: string, categoryId?: string) => void;
}

export const HonestVerdict: React.FC<HonestVerdictProps> = ({
  totalSessions,
  parameters,
  onSelectParameter,
}) => {
  // If zero ratings submitted overall
  if (totalSessions === 0) {
    return null; // Empty state handled by StudentPulse
  }

  // Filter scored parameters with at least 1 numeric response
  const scoredParams = parameters.filter(
    (p) => p.average_score !== null && p.numeric_response_count > 0
  );

  if (scoredParams.length === 0) {
    return null;
  }

  // Deterministic sorting
  const sortedBest = [...scoredParams].sort((a, b) => {
    if ((b.average_score ?? 0) !== (a.average_score ?? 0)) {
      return (b.average_score ?? 0) - (a.average_score ?? 0);
    }
    if (b.numeric_response_count !== a.numeric_response_count) {
      return b.numeric_response_count - a.numeric_response_count;
    }
    return a.display_order - b.display_order;
  });

  const sortedWorst = [...scoredParams].sort((a, b) => {
    if ((a.average_score ?? 0) !== (b.average_score ?? 0)) {
      return (a.average_score ?? 0) - (b.average_score ?? 0);
    }
    if (b.numeric_response_count !== a.numeric_response_count) {
      return b.numeric_response_count - a.numeric_response_count;
    }
    return a.display_order - b.display_order;
  });

  const bestParam = sortedBest[0];
  const worstParam = sortedWorst[0]?.parameter_id !== bestParam.parameter_id ? sortedWorst[0] : null;

  // Determine evidence confidence tier
  const isEarlySignal = totalSessions < 5;
  const isLimitedEvidence = totalSessions >= 5 && totalSessions < 20;

  const confidenceBadge = isEarlySignal
    ? { label: "Early Signal", color: "bg-amber-100 text-amber-900 border-amber-300" }
    : isLimitedEvidence
    ? { label: "Limited Evidence", color: "bg-blue-100 text-blue-900 border-blue-300" }
    : { label: "Broader Feedback", color: "bg-emerald-100 text-emerald-900 border-emerald-300" };

  return (
    <section className="mb-10">
      <div className="editorial-card p-6 bg-card border-warm-grey shadow-card">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-warm-grey pb-4 mb-5 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider font-bold ${confidenceBadge.color}`}>
                {confidenceBadge.label} (n={totalSessions} session{totalSessions !== 1 ? "s" : ""})
              </span>
              <span className="text-[11px] font-mono text-charcoal-muted">
                Student Telemetry
              </span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-charcoal mt-1">
              What Students Appreciate — And What to Look Into
            </h2>
          </div>

          <span className="text-xs text-charcoal-muted font-sans sm:text-right max-w-xs">
            Student-reported perspectives. Never treated as independently established facts.
          </span>
        </div>

        {/* Cautious Editorial Notice for Small Sample Sizes (< 5 sessions) */}
        {isEarlySignal && (
          <div className="mb-6 p-4 rounded-md bg-amber-50/70 border border-amber-200/90 text-xs font-sans text-amber-950 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-semibold text-amber-950">
                The student picture is still developing:
              </strong>{" "}
              With only <strong>{totalSessions} submitted rating session{totalSessions !== 1 ? "s" : ""}</strong>,
              feedback reflects initial individual impressions rather than a verified campus-wide consensus. Campus Uncut requires at least <strong>5 distinct sessions</strong> before generating definitive institutional takeaways. Preliminary signals are presented below with explicit qualification.
            </div>
          </div>
        )}

        {/* Two-Column Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Favorable Signal */}
          {bestParam && (
            <div className="p-5 rounded-md border border-warm-grey bg-paper/40 flex flex-col justify-between hover:border-charcoal/40 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{isEarlySignal ? "Preliminary Positive Signal" : "Student-Reported Strength"}</span>
                  </span>
                  <span className="text-xs font-mono font-semibold text-charcoal-muted">
                    #{bestParam.display_order.toString().padStart(2, "0")}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-bold text-charcoal leading-snug">
                  {bestParam.parameter_name}
                </h3>
                <span className="text-[10px] font-mono text-olive uppercase tracking-wider block mt-0.5">
                  Category: {bestParam.parameter_category}
                </span>

                <p className="text-xs text-charcoal-muted font-sans mt-3 leading-relaxed">
                  {isEarlySignal
                    ? `Initial submission recorded favorable marks (${bestParam.average_score?.toFixed(1)}/10) for ${bestParam.parameter_name.toLowerCase()}. Additional student responses will clarify if this represents broad campus sentiment.`
                    : `Students rate ${bestParam.parameter_name.toLowerCase()} favorably at an average of ${bestParam.average_score?.toFixed(1)}/10 across ${bestParam.numeric_response_count} verified evaluations.`}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-warm-grey/60 flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="font-serif text-2xl font-bold text-charcoal">
                    {bestParam.average_score?.toFixed(1)}
                  </span>
                  <span className="text-xs font-mono text-charcoal-muted">/ 10</span>
                  <span className="text-[11px] text-charcoal-muted font-sans ml-2">
                    ({bestParam.numeric_response_count} numeric vote{bestParam.numeric_response_count !== 1 ? "s" : ""})
                  </span>
                </div>

                <button
                  onClick={() => onSelectParameter(bestParam.parameter_key)}
                  className="text-xs font-medium text-olive hover:text-charcoal hover:underline inline-flex items-center gap-1"
                >
                  <span>Inspect evidence</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Area to Investigate */}
          {worstParam && (
            <div className="p-5 rounded-md border border-warm-grey bg-paper/40 flex flex-col justify-between hover:border-charcoal/40 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                    <span>{isEarlySignal ? "Preliminary Area to Review" : "Reported Area for Inquiry"}</span>
                  </span>
                  <span className="text-xs font-mono font-semibold text-charcoal-muted">
                    #{worstParam.display_order.toString().padStart(2, "0")}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-bold text-charcoal leading-snug">
                  {worstParam.parameter_name}
                </h3>
                <span className="text-[10px] font-mono text-olive uppercase tracking-wider block mt-0.5">
                  Category: {worstParam.parameter_category}
                </span>

                <p className="text-xs text-charcoal-muted font-sans mt-3 leading-relaxed">
                  {isEarlySignal
                    ? `Initial respondent noted comparatively lower satisfaction (${worstParam.average_score?.toFixed(1)}/10) for ${worstParam.parameter_name.toLowerCase()}. Prospective students should inquire further with current students.`
                    : `Student evaluations reflect comparatively lower satisfaction (${worstParam.average_score?.toFixed(1)}/10) for ${worstParam.parameter_name.toLowerCase()}. Investigating this area during campus visits is recommended.`}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-warm-grey/60 flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="font-serif text-2xl font-bold text-charcoal">
                    {worstParam.average_score?.toFixed(1)}
                  </span>
                  <span className="text-xs font-mono text-charcoal-muted">/ 10</span>
                  <span className="text-[11px] text-charcoal-muted font-sans ml-2">
                    ({worstParam.numeric_response_count} numeric vote{worstParam.numeric_response_count !== 1 ? "s" : ""})
                  </span>
                </div>

                <button
                  onClick={() => onSelectParameter(worstParam.parameter_key)}
                  className="text-xs font-medium text-olive hover:text-charcoal hover:underline inline-flex items-center gap-1"
                >
                  <span>Inspect evidence</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
