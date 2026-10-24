import React from "react";
import { AlertTriangle, ArrowLeft, Send } from "lucide-react";
import type { ParameterRating } from "../../types/college";


interface ReviewSummaryProps {
  collegeName: string;
  parameters: ParameterRating[];
  answers: Record<string, { score: number | null; isNoView: boolean }>;
  onEditParameter: (paramIndex: number) => void;
  onSubmit: () => void;
  onBackToWizard: () => void;
  isSubmitting: boolean;
  error: string | null;
}

export const ReviewSummary: React.FC<ReviewSummaryProps> = ({
  collegeName,
  parameters,
  answers,
  onEditParameter,
  onSubmit,
  onBackToWizard,
  isSubmitting,
  error,
}) => {
  // Compute unrounded mean preview
  const numericScores: number[] = [];
  let noViewCount = 0;
  let unansweredCount = 0;

  parameters.forEach((p) => {
    const ans = answers[p.parameter_id];
    if (!ans) {
      unansweredCount++;
    } else if (ans.isNoView) {
      noViewCount++;
    } else if (ans.score !== null) {
      numericScores.push(ans.score);
    }
  });

  const mean =
    numericScores.length > 0
      ? numericScores.reduce((acc, s) => acc + s, 0) / numericScores.length
      : null;

  let category: "low" | "neutral" | "high" | null = null;
  if (mean !== null) {
    if (mean < 4.0) category = "low";
    else if (mean < 8.0) category = "neutral";
    else category = "high";
  }

  const isComplete = unansweredCount === 0;

  return (
    <div className="py-8 px-4 sm:px-6 max-w-4xl mx-auto font-sans">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBackToWizard}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-muted hover:text-charcoal"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Rating Wizard</span>
        </button>

        <span className="font-mono text-xs uppercase text-olive font-semibold">
          Step 3 of 3 • Final Review
        </span>
      </div>

      <div className="editorial-card p-6 sm:p-8 bg-card mb-8">
        <div className="border-b border-warm-grey pb-6 mb-6">
          <h2 className="font-serif text-3xl font-bold text-charcoal">
            Review Your Responses
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
            Rating for <strong>{collegeName}</strong>. Check your responses before final submission. After submission, answers are permanently recorded in the official score engine.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Calculation Preview Box */}
        <div className="p-4 rounded border border-warm-grey bg-warm-grey-light mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-2.5 rounded bg-card border border-warm-grey/60">
            <div className="font-serif text-2xl font-bold text-charcoal">
              {mean !== null ? mean.toFixed(2) : "—"}
            </div>
            <div className="text-[10px] font-mono text-charcoal-muted uppercase mt-0.5">
              Unrounded Mean
            </div>
          </div>

          <div className="p-2.5 rounded bg-card border border-warm-grey/60">
            <div className={`font-serif text-2xl font-bold capitalize ${
              category === "high" ? "text-emerald-800" : category === "low" ? "text-rose-800" : "text-charcoal"
            }`}>
              {category || "N/A"}
            </div>
            <div className="text-[10px] font-mono text-charcoal-muted uppercase mt-0.5">
              Threshold Tier
            </div>
          </div>

          <div className="p-2.5 rounded bg-card border border-warm-grey/60">
            <div className="font-serif text-2xl font-bold text-charcoal">
              {numericScores.length}
            </div>
            <div className="text-[10px] font-mono text-charcoal-muted uppercase mt-0.5">
              Numeric Ratings (1-10)
            </div>
          </div>

          <div className="p-2.5 rounded bg-card border border-warm-grey/60">
            <div className="font-serif text-2xl font-bold text-olive">
              {noViewCount}
            </div>
            <div className="text-[10px] font-mono text-charcoal-muted uppercase mt-0.5">
              "No view" Excluded
            </div>
          </div>
        </div>


        {!isComplete && (
          <div className="mb-6 p-3.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Incomplete Session:</strong> You have {unansweredCount} unanswered questions. Every parameter must be rated (1–10) or marked "No view" before submitting.
            </span>
          </div>
        )}

        {/* Answer Review Grid */}
        <div className="space-y-2 mb-8 max-h-[460px] overflow-y-auto pr-2 border border-warm-grey rounded p-2 bg-paper">
          {parameters.map((param, idx) => {
            const ans = answers[param.parameter_id];
            const hasAnswer = Boolean(ans);

            return (
              <div
                key={param.parameter_id}
                onClick={() => onEditParameter(idx)}
                className={`p-3 rounded border flex items-center justify-between cursor-pointer transition-colors ${
                  !hasAnswer
                    ? "border-amber-300 bg-amber-50/60"
                    : "border-warm-grey bg-card hover:border-olive"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-charcoal-muted w-6">
                    #{param.display_order}
                  </span>
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-charcoal">
                      {param.parameter_name}
                    </div>
                    <div className="text-[10px] font-mono text-olive uppercase">
                      {param.parameter_category}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {hasAnswer ? (
                    ans.isNoView ? (
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-warm-grey-light text-charcoal-muted">
                        No view
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-charcoal text-paper">
                        {ans.score} / 10
                      </span>
                    )
                  ) : (
                    <span className="px-2 py-0.5 rounded text-xs font-mono text-amber-700 bg-amber-100 font-semibold">
                      Missing
                    </span>
                  )}
                  <span className="text-[11px] text-olive underline">Edit</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-warm-grey">
          <button
            type="button"
            onClick={onBackToWizard}
            className="btn-secondary text-xs w-full sm:w-auto"
          >
            ← Return to Questions
          </button>

          <button
            type="button"
            disabled={!isComplete || isSubmitting}
            onClick={onSubmit}
            className="btn-primary text-xs py-2.5 px-8 w-full sm:w-auto font-semibold"
          >
            {isSubmitting ? (
              <span>Submitting Transaction...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Official Rating</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
