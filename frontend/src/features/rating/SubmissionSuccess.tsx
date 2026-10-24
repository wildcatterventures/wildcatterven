import React from "react";
import { CheckCircle2, TrendingDown, TrendingUp, Minus, ArrowRight, Home } from "lucide-react";
import type { SubmitSessionResult } from "../../types/rating";
import { ScoreBadge } from "../../components/ScoreBadge";

interface SubmissionSuccessProps {
  collegeName: string;
  result: SubmitSessionResult;
  onViewCollege: (collegeId: string) => void;
  onGoHome: () => void;
}

export const SubmissionSuccess: React.FC<SubmissionSuccessProps> = ({
  collegeName,
  result,
  onViewCollege,
  onGoHome,
}) => {
  const hasDelta = result.score_delta !== null && result.score_delta !== 0;
  const isPositive = result.score_delta !== null && result.score_delta > 0;


  return (
    <div className="py-12 px-4 max-w-xl mx-auto font-sans">
      <div className="editorial-card p-6 sm:p-10 bg-card text-center">
        <div className="w-14 h-14 rounded-full bg-olive-light flex items-center justify-center mx-auto mb-4 text-olive">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <span className="font-mono text-xs uppercase tracking-wider text-olive font-semibold">
          Submission Recorded
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal mt-1 mb-2">
          Rating Confirmed
        </h1>

        <p className="text-xs sm:text-sm text-charcoal-muted max-w-md mx-auto mb-8 font-sans">
          Your feedback for <strong>{collegeName}</strong> has been atomically recorded in the official PostgreSQL scoring engine.
        </p>

        {/* Score Shift Card */}
        <div className="p-6 rounded border border-warm-grey bg-paper mb-8 text-left space-y-4">
          <div className="flex items-center justify-between border-b border-warm-grey pb-3">
            <span className="text-xs font-semibold uppercase font-mono text-charcoal-muted">
              Official College Score
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-charcoal-muted">
                {result.score_before}
              </span>
              <span className="text-charcoal-muted">→</span>
              <ScoreBadge score={result.score_after} size="md" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-2.5 rounded bg-card border border-warm-grey">
              <div className="font-serif text-xl font-bold text-charcoal">
                {result.unrounded_overall_rating !== null
                  ? result.unrounded_overall_rating.toFixed(2)
                  : "N/A"}
              </div>
              <div className="text-[10px] font-mono uppercase text-charcoal-muted mt-0.5">
                Overall Mean
              </div>
            </div>

            <div className="p-2.5 rounded bg-card border border-warm-grey">
              <div className="font-serif text-xl font-bold capitalize text-charcoal">
                {result.category || "No view"}
              </div>
              <div className="text-[10px] font-mono uppercase text-charcoal-muted mt-0.5">
                Classification
              </div>
            </div>
          </div>

          {/* Threshold Crossing Callout */}
          {hasDelta ? (
            <div
              className={`p-3 rounded border text-xs flex items-start gap-2.5 ${
                isPositive
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <TrendingDown className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <strong className="font-semibold">
                  Threshold Block #{result.threshold_block_triggered} Triggered!
                </strong>
                <p className="mt-0.5">
                  Your submission completed a qualifying block of 20 ratings. The official college score has adjusted by {isPositive ? "+1" : "-1"} point!
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded border border-warm-grey bg-warm-grey-light text-xs text-charcoal-muted flex items-center gap-2">
              <Minus className="w-4 h-4 text-charcoal-muted flex-shrink-0" />
              <span>
                {result.unrounded_overall_rating === null
                  ? "All parameters were marked No view. No qualifying score contribution was applied."
                  : "Your qualifying rating was added toward the next 20-contribution score adjustment."}
              </span>
            </div>
          )}
        </div>

        {/* Next Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onViewCollege(result.college_id)}
            className="btn-primary text-xs w-full sm:w-auto py-2.5 px-6"
          >
            <span>View Updated Campus Report</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onGoHome}
            className="btn-secondary text-xs w-full sm:w-auto py-2.5 px-6"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};
