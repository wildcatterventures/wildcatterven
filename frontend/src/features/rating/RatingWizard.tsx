import React, { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Check, ListChecks } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import type { CollegeSummary, ParameterRating } from "../../types/college";
import type {
  RatingSessionResponse,
  SubmitSessionResult,
} from "../../types/rating";
import { ParameterInput } from "./ParameterInput";
import { ReviewSummary } from "./ReviewSummary";
import { SubmissionSuccess } from "./SubmissionSuccess";

interface RatingWizardProps {
  session: RatingSessionResponse;
  college: CollegeSummary;
  onExit: () => void;
  onViewCollege: (collegeId: string) => void;
}

export const RatingWizard: React.FC<RatingWizardProps> = ({
  session,
  college,
  onExit,
  onViewCollege,
}) => {
  const [parameters, setParameters] = useState<ParameterRating[]>([]);
  const [answers, setAnswers] = useState<
    Record<string, { score: number | null; isNoView: boolean }>
  >({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewState, setViewState] = useState<"questions" | "review" | "success">("questions");
  const [submitResult, setSubmitResult] = useState<SubmitSessionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load 25 parameters & restored session answers
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      api.getCollegeRatings(college.college_id),
      api.getRatingSession(session.id),
    ])
      .then(([ratingsData, sessionData]) => {
        if (!mounted) return;
        setParameters(ratingsData.parameters);

        // Populate existing answers from backend
        const answersMap: Record<string, { score: number | null; isNoView: boolean }> = {};
        sessionData.answers.forEach((ans) => {
          answersMap[ans.parameter_id] = {
            score: ans.score,
            isNoView: ans.is_no_view,
          };
        });
        setAnswers(answersMap);

        // Find first unanswered index if resuming
        const firstUnanswered = ratingsData.parameters.findIndex(
          (p) => !answersMap[p.parameter_id]
        );
        if (firstUnanswered !== -1) {
          setCurrentIndex(firstUnanswered);
        }
      })
      .catch((err) => {
        if (mounted) setError(err.message || "Failed to load rating questions.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [session.id, college.college_id]);

  const handleAnswerChange = async (score: number | null, isNoView: boolean) => {
    const currentParam = parameters[currentIndex];
    if (!currentParam || savingAnswer) return;

    // Optimistically update local state
    setAnswers((prev) => ({
      ...prev,
      [currentParam.parameter_id]: { score, isNoView },
    }));

    // Save immediately to backend
    setSavingAnswer(true);
    try {
      await api.saveAnswer(session.id, currentParam.parameter_id, {
        score,
        is_no_view: isNoView,
      });

      // Advance automatically to next question if not at end
      if (currentIndex < parameters.length - 1) {
        setTimeout(() => {
          setCurrentIndex((prev) => prev + 1);
        }, 200);
      }
    } catch (err: any) {
      setError("Failed to save answer. Please check your connection.");
    } finally {
      setSavingAnswer(false);
    }
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.submitRatingSession(session.id);
      setSubmitResult(res);
      setViewState("success");
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) {
        setError(
          err.detail ||
            "A rating has already been submitted for this college from this profile."
        );
      } else if (err instanceof ApiError && err.status === 422) {
        setError("Incomplete session: please ensure all 25 parameters are answered.");
      } else {
        setError(err.message || "Failed to submit rating. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 px-4 text-center font-sans max-w-md mx-auto">
        <div className="inline-block w-8 h-8 border-2 border-olive border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-charcoal font-medium">Preparing rating session...</p>
        <p className="text-xs text-charcoal-muted mt-1">Retrieving 25 parameter criteria.</p>
      </div>
    );
  }

  if (viewState === "success" && submitResult) {
    return (
      <SubmissionSuccess
        collegeName={college.name}
        result={submitResult}
        onViewCollege={onViewCollege}
        onGoHome={onExit}
      />
    );
  }

  if (viewState === "review") {
    return (
      <ReviewSummary
        collegeName={college.name}
        parameters={parameters}
        answers={answers}
        onEditParameter={(idx) => {
          setCurrentIndex(idx);
          setViewState("questions");
        }}
        onSubmit={handleFinalSubmit}
        onBackToWizard={() => setViewState("questions")}
        isSubmitting={submitting}
        error={error}
      />
    );
  }

  const currentParam = parameters[currentIndex];
  const currentAnswer = currentParam ? answers[currentParam.parameter_id] : null;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / 25) * 100);

  return (
    <div className="py-8 px-4 sm:px-6 max-w-3xl mx-auto font-sans">
      {/* Top Bar: Progress and Exit */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onExit}
          className="text-xs font-semibold text-charcoal-muted hover:text-charcoal inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Session</span>
        </button>

        <button
          onClick={() => setViewState("review")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-olive hover:underline"
        >
          <ListChecks className="w-4 h-4" />
          <span>Review All ({answeredCount}/25)</span>
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-charcoal-muted mb-1.5 font-mono">
          <span>
            Question <strong>{currentIndex + 1}</strong> of 25
          </span>
          <span>
            {answeredCount} Answered ({progressPercent}%)
          </span>
        </div>
        <div className="w-full bg-warm-grey-light h-2 rounded-full overflow-hidden">
          <div
            className="bg-olive h-full transition-all duration-300 rounded-full"
            style={{ width: `${(answeredCount / 25) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {error}
        </div>
      )}

      {/* Question Card */}
      {currentParam && (
        <div className="editorial-card p-6 sm:p-10 bg-card mb-8 shadow-card">
          <div className="flex items-center justify-between text-xs mb-3 font-mono">
            <span className="text-olive uppercase tracking-wider font-semibold">
              Category: {currentParam.parameter_category}
            </span>
            <span className="text-charcoal-muted">
              Rating for: <strong>{college.short_code}</strong>
            </span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal mb-4 leading-snug">
            {currentParam.parameter_name}
          </h2>

          <p className="text-sm text-charcoal-muted leading-relaxed mb-8 bg-paper p-3.5 rounded border border-warm-grey font-sans">
            How would you rate the reality of this parameter on campus? Score from 1 (very poor) through 10 (outstanding/completely safe), or select "No view" if you lack firsthand experience.
          </p>

          {/* Interactive Score Selector */}
          <ParameterInput
            score={currentAnswer?.score ?? null}
            isNoView={currentAnswer?.isNoView ?? false}
            onChange={handleAnswerChange}
            disabled={savingAnswer}
          />

          {/* Question Navigation Footer */}
          <div className="mt-8 pt-6 border-t border-warm-grey flex items-center justify-between">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => prev - 1)}
              className="btn-secondary text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-2">
              {currentIndex < parameters.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="btn-primary text-xs"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setViewState("review")}
                  className="btn-primary text-xs"
                >
                  <span>Proceed to Final Review</span>
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fast Question Index Navigator */}
      <div className="p-4 rounded border border-warm-grey bg-paper flex items-center justify-center gap-1.5 flex-wrap">
        {parameters.map((p, idx) => {
          const isAns = Boolean(answers[p.parameter_id]);
          const isCurr = idx === currentIndex;
          return (
            <button
              key={p.parameter_id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-7 h-7 rounded text-xs font-mono font-bold transition-all border ${
                isCurr
                  ? "border-charcoal bg-charcoal text-paper"
                  : isAns
                  ? "border-olive/50 bg-olive-light text-olive-dark"
                  : "border-warm-grey bg-card text-charcoal-muted hover:border-charcoal"
              }`}
              title={`#${idx + 1}: ${p.parameter_name}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};
