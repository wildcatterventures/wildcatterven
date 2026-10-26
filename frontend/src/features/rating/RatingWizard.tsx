import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ListChecks,
  BookOpen,
  Building,
  ShieldCheck,
  Utensils,
  Layers,
  Mic,
  MicOff,
  Volume2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { api, ApiError } from "../../lib/api";
import {
  isSpeechRecognitionSupported,
  startSpeechRecognition,
  speakText,
  stopSpeaking,
} from "../../lib/voice";
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

interface ParsedVoiceRating {
  valid: boolean;
  score: number | null;
  isNoView: boolean;
  isNavigation?: "previous" | "next" | "repeat" | "review";
  rawText: string;
  clarification?: string;
}

export function parseSpokenRating(text: string): ParsedVoiceRating {
  const clean = text.trim().toLowerCase();

  // Navigation commands
  if (clean.includes("previous") || clean.includes("go back") || clean === "back") {
    return { valid: true, score: null, isNoView: false, isNavigation: "previous", rawText: text };
  }
  if (clean.includes("repeat") || clean.includes("say again") || clean.includes("what question")) {
    return { valid: true, score: null, isNoView: false, isNavigation: "repeat", rawText: text };
  }
  if (clean === "review" || clean.includes("review all") || clean === "finish") {
    return { valid: true, score: null, isNoView: false, isNavigation: "review", rawText: text };
  }
  if (clean === "next" || clean === "skip") {
    return { valid: true, score: null, isNoView: false, isNavigation: "next", rawText: text };
  }

  // No View expressions
  if (
    clean.includes("no view") ||
    clean.includes("not applicable") ||
    clean === "n/a" ||
    clean === "na" ||
    clean.includes("no opinion") ||
    clean.includes("haven't used") ||
    clean.includes("havent used") ||
    clean.includes("never used")
  ) {
    return { valid: true, score: null, isNoView: true, rawText: text };
  }

  // Word-to-number dictionary for English / Indian English
  const wordsToNum: Record<string, number> = {
    one: 1, won: 1,
    two: 2, to: 2, too: 2,
    three: 3, tree: 3,
    four: 4, for: 4, fore: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8, ate: 8,
    nine: 9,
    ten: 10,
  };

  // Reject out of range numbers with explicit clarification
  const outOfRangeRegex = /\b(0|1[1-9]|[2-9]\d|zero|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b/i;
  if (outOfRangeRegex.test(clean)) {
    return {
      valid: false,
      score: null,
      isNoView: false,
      rawText: text,
      clarification: "Scores must be between 1 and 10, or say 'No view'.",
    };
  }

  // Match digits 1-10
  const digitMatch = clean.match(/\b(10|[1-9])\b/);
  if (digitMatch) {
    const val = parseInt(digitMatch[1], 10);
    return { valid: true, score: val, isNoView: false, rawText: text };
  }

  // Match word numbers 1-10
  for (const [w, num] of Object.entries(wordsToNum)) {
    const wordRegex = new RegExp(`\\b${w}\\b`, "i");
    if (wordRegex.test(clean)) {
      return { valid: true, score: num, isNoView: false, rawText: text };
    }
  }

  return {
    valid: false,
    score: null,
    isNoView: false,
    rawText: text,
    clarification: `Heard "${text}". Could not recognize a rating between 1 and 10 or 'No view'.`,
  };
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

  // Voice Guidance State
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);
  const isSavingRef = useRef<boolean>(false);

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
      stopSpeaking();
      if (stopListeningRef.current) {
        stopListeningRef.current();
        stopListeningRef.current = null;
      }
    };
  }, [session.id, college.college_id]);

  const handleAnswerChange = async (score: number | null, isNoView: boolean): Promise<boolean> => {
    const currentParam = parameters[currentIndex];
    if (!currentParam || savingAnswer || isSavingRef.current) return false;

    isSavingRef.current = true;
    setSavingAnswer(true);

    setAnswers((prev) => ({
      ...prev,
      [currentParam.parameter_id]: { score, isNoView },
    }));

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
      return true;
    } catch (err: any) {
      setError("Failed to save answer. Please check your connection.");
      return false;
    } finally {
      isSavingRef.current = false;
      setSavingAnswer(false);
    }
  };

  // Helper to start listening for an answer
  const listenForAnswer = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      setVoiceError("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (stopListeningRef.current) {
      stopListeningRef.current();
      stopListeningRef.current = null;
    }

    setVoiceError(null);
    setIsListening(true);

    const stopFn = startSpeechRecognition({
      onStart: () => {
        setIsListening(true);
        setVoiceError(null);
      },
      onTranscript: async (spokenText: string, isFinal: boolean) => {
        if (!isFinal || isSavingRef.current) return;

        const parsed = parseSpokenRating(spokenText);

        if (parsed.isNavigation === "previous") {
          setVoiceFeedback("Navigating to previous question...");
          speakText("Going back to previous question.");
          setCurrentIndex((prev) => Math.max(prev - 1, 0));
          return;
        }

        if (parsed.isNavigation === "next") {
          setVoiceFeedback("Navigating to next question...");
          setCurrentIndex((prev) => Math.min(prev + 1, parameters.length - 1));
          return;
        }

        if (parsed.isNavigation === "repeat") {
          announceCurrentQuestion();
          return;
        }

        if (parsed.isNavigation === "review") {
          setViewState("review");
          return;
        }

        if (!parsed.valid) {
          const msg = parsed.clarification || "Please say a rating from 1 to 10, or say 'No view'.";
          setVoiceFeedback(msg);
          speakText(msg, {
            onEnd: () => {
              listenForAnswer();
            },
          });
          return;
        }

        // Valid rating parsed: stop listening before saving to prevent duplicate captures
        if (stopListeningRef.current) {
          stopListeningRef.current();
          stopListeningRef.current = null;
        }
        setIsListening(false);

        const savedDesc = parsed.isNoView ? 'Marked as "No view"' : `Saved rating as ${parsed.score} out of 10`;
        setVoiceFeedback(`${savedDesc}. Proceeding...`);

        const success = await handleAnswerChange(parsed.score, parsed.isNoView);
        if (success) {
          speakText(savedDesc);
        }
      },
      onError: (errMsg: string) => {
        setIsListening(false);
        stopListeningRef.current = null;
        setVoiceError(errMsg);
      },
      onEnd: () => {
        setIsListening(false);
        stopListeningRef.current = null;
      },
    });

    stopListeningRef.current = stopFn;
  }, [currentIndex, parameters]);

  // Announces the active question prompt via speech synthesis
  const announceCurrentQuestion = useCallback(() => {
    const currentParam = parameters[currentIndex];
    if (!currentParam) return;

    if (stopListeningRef.current) {
      stopListeningRef.current();
      stopListeningRef.current = null;
    }
    setIsListening(false);
    setIsSpeaking(true);

    const questionSpeech = `Question ${currentIndex + 1} of 25. ${currentParam.parameter_name}. Say a rating from 1 to 10, or say No view.`;
    speakText(questionSpeech, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => {
        setIsSpeaking(false);
        listenForAnswer();
      },
      onError: () => {
        setIsSpeaking(false);
        listenForAnswer();
      },
    });
  }, [currentIndex, parameters, listenForAnswer]);

  // When voice mode is active and current question changes, announce it
  useEffect(() => {
    if (!isVoiceMode || viewState !== "questions" || parameters.length === 0) return;
    announceCurrentQuestion();

    return () => {
      stopSpeaking();
      if (stopListeningRef.current) {
        stopListeningRef.current();
        stopListeningRef.current = null;
      }
    };
  }, [currentIndex, isVoiceMode, viewState, parameters.length]);

  const toggleVoiceMode = () => {
    if (isVoiceMode) {
      // Turn voice mode off
      stopSpeaking();
      if (stopListeningRef.current) {
        stopListeningRef.current();
        stopListeningRef.current = null;
      }
      setIsListening(false);
      setIsSpeaking(false);
      setIsVoiceMode(false);
      setVoiceFeedback(null);
      setVoiceError(null);
    } else {
      if (!isSpeechRecognitionSupported()) {
        setVoiceError("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.");
        return;
      }
      setIsVoiceMode(true);
      setVoiceError(null);
      setVoiceFeedback("Voice guidance enabled. Reading question...");
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

        <div className="flex items-center gap-2">
          {isSpeechRecognitionSupported() && (
            <button
              type="button"
              onClick={toggleVoiceMode}
              title={isVoiceMode ? "Disable Voice Guidance" : "Enable Voice Guided Rating"}
              className={`text-xs py-1.5 px-3 rounded flex items-center gap-1.5 font-medium border transition-colors ${
                isVoiceMode
                  ? "bg-olive text-paper border-olive shadow-sm"
                  : "bg-paper text-charcoal-muted hover:text-charcoal border-warm-grey hover:border-olive"
              }`}
            >
              {isVoiceMode ? (
                <Mic className="w-3.5 h-3.5 text-paper animate-pulse" />
              ) : (
                <MicOff className="w-3.5 h-3.5" />
              )}
              <span>{isVoiceMode ? "Voice Guidance Active" : "Voice Guidance"}</span>
            </button>
          )}

          <button
            onClick={() => setViewState("review")}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 font-medium"
          >
            <ListChecks className="w-4 h-4 text-olive" />
            <span>Review All ({answeredCount}/25)</span>
          </button>
        </div>
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

          {/* Voice Guidance Interactive Card */}
          {isVoiceMode && (
            <div className="mb-6 p-4 rounded-lg bg-olive-light/60 border border-olive/30 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    isListening
                      ? "bg-emerald-600 text-white animate-pulse"
                      : isSpeaking
                      ? "bg-olive text-white animate-pulse"
                      : "bg-card text-olive border border-olive/30"
                  }`}
                >
                  {isSpeaking ? (
                    <Volume2 className="w-4 h-4" />
                  ) : isListening ? (
                    <Mic className="w-4 h-4" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-charcoal flex items-center gap-1.5">
                    <span>
                      {isSpeaking
                        ? "Reading question aloud..."
                        : isListening
                        ? "Listening for your rating (speak 1-10 or 'No view')..."
                        : "Voice Mode Ready"}
                    </span>
                  </div>
                  <p className="text-[11px] text-charcoal-muted mt-0.5">
                    {voiceFeedback || "Speak a number from 1 to 10, or say 'No view'. Say 'Previous' to go back, or 'Repeat' to hear again."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={announceCurrentQuestion}
                  title="Repeat question audio"
                  className="px-2.5 py-1.5 rounded text-[11px] font-medium bg-card border border-warm-grey text-charcoal hover:border-olive flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3 text-olive" />
                  <span>Repeat</span>
                </button>
                <button
                  type="button"
                  onClick={toggleVoiceMode}
                  className="px-2.5 py-1.5 rounded text-[11px] font-medium bg-card border border-warm-grey text-charcoal-muted hover:text-charcoal hover:border-rose-400"
                >
                  Turn Off
                </button>
              </div>
            </div>
          )}

          {voiceError && (
            <div className="mb-4 p-3 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
              <span>{voiceError}</span>
              <button
                type="button"
                onClick={() => setVoiceError(null)}
                className="text-[10px] uppercase font-bold text-amber-900 hover:underline ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

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
