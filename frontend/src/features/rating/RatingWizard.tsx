import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ListChecks,
  BookOpen,
  Building,
  ShieldCheck,
  Utensils,
  Layers,
} from "lucide-react";
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

        const answersMap: Record<string, { score: number | null; isNoView: boolean }> = {};
        sessionData.answers.forEach((ans) => {
          answersMap[ans.parameter_id] = {
            score: ans.score,
            isNoView: ans.is_no_view,
          };
        });
        setAnswers(answersMap);

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

    setAnswers((prev) => ({
      ...prev,
      [currentParam.parameter_id]: { score, isNoView },
    }));

    setSavingAnswer(true);
    try {
      await api.saveAnswer(session.id, currentParam.parameter_id, {
        score,
        is_no_view: isNoView,
      });

      if (currentIndex < parameters.length - 1) {
        setTimeout(() => {
          setCurrentIndex((prev) => prev + 1);
        }, 180);
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
      if (err instanceof ApiError && err.status === 422) {
        setError(
          "All 25 parameters must be answered before official submission. Please review any missing questions."
        );
      } else if (err instanceof ApiError && err.status === 409) {
        setError("This rating session has already been submitted or completed.");
      } else {
        setError(err.message || "Failed to submit rating session.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 px-4 max-w-xl mx-auto text-center font-sans">
        <div className="inline-block w-8 h-8 border-2 border-olive border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-charcoal font-medium">Preparing rating session...</p>
        <p className="text-xs text-charcoal-muted mt-1">Retrieving 25 parameter criteria from PostgreSQL.</p>
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

  // Category calculation
  const categoryParams = currentParam
    ? parameters.filter((p) => p.parameter_category === currentParam.parameter_category)
    : [];
  const categoryIndex = currentParam
    ? categoryParams.findIndex((p) => p.parameter_id === currentParam.parameter_id) + 1
    : 1;

  // Category Icon selection
  const getCategoryIcon = (category: string) => {
    const catLower = category.toLowerCase();
    if (catLower.includes("academic") || catLower.includes("faculty")) return <BookOpen className="w-4 h-4 text-olive" />;
    if (catLower.includes("hostel") || catLower.includes("infra")) return <Building className="w-4 h-4 text-olive" />;
    if (catLower.includes("safety") || catLower.includes("ragging") || catLower.includes("govern")) return <ShieldCheck className="w-4 h-4 text-olive" />;
    if (catLower.includes("food") || catLower.includes("mess") || catLower.includes("campus")) return <Utensils className="w-4 h-4 text-olive" />;
    return <Layers className="w-4 h-4 text-olive" />;
  };

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
          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 font-medium"
        >
          <ListChecks className="w-4 h-4 text-olive" />
          <span>Review All ({answeredCount}/25)</span>
        </button>
      </div>

      {/* Progress Indicator Bar */}
      <div className="mb-8 p-4 rounded bg-card border border-warm-grey shadow-subtle">
        <div className="flex items-center justify-between text-xs text-charcoal-muted mb-2 font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-charcoal">
              Question #{currentIndex + 1}
            </span>
            <span>•</span>
            <span className="uppercase text-[11px] text-olive font-semibold">
              {currentParam?.parameter_category}
            </span>
          </div>
          <span>
            {answeredCount}/25 Answered ({progressPercent}%)
          </span>
        </div>

        <div className="w-full bg-warm-grey-light h-2 rounded-full overflow-hidden">
          <div
            className="bg-olive h-full transition-all duration-300 rounded-full"
            style={{ width: `${(answeredCount / 25) * 100}%` }}
          />
        </div>

        {/* 25 Question Mini Jump Pills */}
        <div className="mt-4 pt-3 border-t border-warm-grey flex items-center gap-1 flex-wrap justify-between">
          {parameters.map((p, idx) => {
            const isAns = Boolean(answers[p.parameter_id]);
            const isCurr = idx === currentIndex;
            return (
              <button
                key={p.parameter_id}
                onClick={() => setCurrentIndex(idx)}
                title={`Jump to #${idx + 1}: ${p.parameter_name}`}
                className={`w-6 h-6 rounded text-[10px] font-mono font-bold transition-all ${
                  isCurr
                    ? "bg-charcoal text-paper ring-2 ring-olive"
                    : isAns
                    ? "bg-olive-light text-olive border border-olive/30"
                    : "bg-paper text-charcoal-muted/60 border border-warm-grey hover:border-charcoal"
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {error}
        </div>
      )}

      {/* Active Question Card */}
      {currentParam && (
        <div className="editorial-card p-6 sm:p-10 bg-card mb-8 shadow-card border-warm-grey">
          {/* Category Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-warm-grey">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-olive-light flex items-center justify-center">
                {getCategoryIcon(currentParam.parameter_category)}
              </div>
              <span className="font-mono text-xs text-olive uppercase tracking-wider font-bold">
                {currentParam.parameter_category}
              </span>
            </div>
            <span className="text-[11px] font-mono text-charcoal-muted">
              Criterion {categoryIndex} of {categoryParams.length} in this category
            </span>
          </div>

          {/* Parameter Title */}
          <span className="text-xs font-mono text-charcoal-muted uppercase">
            Parameter #{currentParam.display_order} of 25
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal mt-1 mb-4 leading-snug">
            {currentParam.parameter_name}
          </h2>

          <p className="text-xs sm:text-sm text-charcoal-muted mb-8 leading-relaxed font-sans">
            Please provide your candid, unedited assessment for <strong>{college.name}</strong> based on your firsthand observations as a student or alumnus.
          </p>

          {/* 1-10 or No View Input Component */}
          <ParameterInput
            score={currentAnswer?.score ?? null}
            isNoView={currentAnswer?.isNoView ?? false}
            onChange={handleAnswerChange}
            disabled={savingAnswer}
          />

          {/* Previous / Next Stepper */}
          <div className="mt-8 pt-6 border-t border-warm-grey flex items-center justify-between gap-4">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
              className="btn-secondary text-xs py-2 px-4 disabled:opacity-30"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {currentIndex < parameters.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, parameters.length - 1))}
                className="btn-secondary text-xs py-2 px-4"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setViewState("review")}
                className="btn-primary text-xs py-2 px-5 font-semibold"
              >
                <span>Proceed to Review</span>
                <ListChecks className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
