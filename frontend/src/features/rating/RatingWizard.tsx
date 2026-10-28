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
  Pause,
  Play,
  CheckCircle2,
} from "lucide-react";
import { api, ApiError } from "../../lib/api";
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  startSpeechSession,
  SpeechSessionController,
  speakText,
  stopSpeaking,
} from "../../lib/voice";
import {
  parseSpokenRating,
  ParsedVoiceRating,
} from "../../lib/voiceRatingParser";
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

  // Input Mode: "text" (tap buttons) vs "voice" (speak answers)
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [voiceStarted, setVoiceStarted] = useState(false);

  // Voice State Management
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "listening" | "confirming" | "paused" | "error">("idle");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [readAloud, setReadAloud] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Concurrency & Lifecycle Protection Refs
  const controllerRef = useRef<SpeechSessionController | null>(null);
  const advanceTimerRef = useRef<any>(null);
  const autoAdvanceDebounceRef = useRef<any>(null);
  const latestTranscriptRef = useRef<string>("");
  const isAdvancingRef = useRef<boolean>(false);
  const isSavingRef = useRef<boolean>(false);
  const currentQuestionIndexRef = useRef<number>(0);
  const voiceStartedRef = useRef<boolean>(false);
  const readAloudRef = useRef<boolean>(false);

  const clearAutoAdvanceDebounce = useCallback(() => {
    if (autoAdvanceDebounceRef.current) {
      clearTimeout(autoAdvanceDebounceRef.current);
      autoAdvanceDebounceRef.current = null;
    }
  }, []);

  // Sync refs with state
  useEffect(() => {
    currentQuestionIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    voiceStartedRef.current = voiceStarted;
  }, [voiceStarted]);

  useEffect(() => {
    readAloudRef.current = readAloud;
  }, [readAloud]);

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
      clearAutoAdvanceDebounce();
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
    };
  }, [session.id, college.college_id, clearAutoAdvanceDebounce]);

  // Clean teardown on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      clearAutoAdvanceDebounce();
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
    };
  }, [clearAutoAdvanceDebounce]);

  // Saves an answer through the backend API
  const handleAnswerChange = async (score: number | null, isNoView: boolean): Promise<boolean> => {
    const currentParam = parameters[currentIndex];
    if (!currentParam || savingAnswer || isSavingRef.current) return false;

    isSavingRef.current = true;
    setSavingAnswer(true);

    // Cancel pending voice progression if user manually taps
    clearAutoAdvanceDebounce();
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    isAdvancingRef.current = false;

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

  // Helper to start speech recognition for a specific question index
  const startListeningForQuestion = useCallback(
    (targetIndex: number) => {
      if (!isSpeechRecognitionSupported()) {
        setVoiceError(
          "Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari, or switch to text mode."
        );
        setVoiceStatus("error");
        return;
      }

      // Teardown any existing controller cleanly
      clearAutoAdvanceDebounce();
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }

      isAdvancingRef.current = false;
      setVoiceError(null);
      setVoiceStatus("listening");
      setInterimTranscript("");
      latestTranscriptRef.current = "";

      const param = parameters[targetIndex];
      if (!param) return;

      // Centralized processor for any recognized speech (interim debounce, final, or silence timeout)
      const processSpokenTranscript = async (
        transcriptText: string,
        activeController?: SpeechSessionController | null
      ) => {
        if (isAdvancingRef.current) return;
        if (currentQuestionIndexRef.current !== targetIndex) return;

        const cleanTranscript = (transcriptText || "").trim();
        if (!cleanTranscript) {
          setVoiceStatus("paused");
          setVoiceFeedback("Listening paused due to silence. Tap 'Resume' to continue.");
          return;
        }

        setInterimTranscript(cleanTranscript);
        const parsed: ParsedVoiceRating = parseSpokenRating(cleanTranscript);

        // 1. Navigation Commands
        if (parsed.isNavigation === "previous") {
          clearAutoAdvanceDebounce();
          activeController?.abort();
          controllerRef.current = null;
          if (targetIndex > 0) {
            setVoiceFeedback("Going back to previous question...");
            if (readAloudRef.current) {
              speakText("Going back to previous question.");
            }
            setCurrentIndex(targetIndex - 1);
          } else {
            setVoiceFeedback("Already at the first question.");
          }
          return;
        }

        if (parsed.isNavigation === "repeat") {
          clearAutoAdvanceDebounce();
          activeController?.abort();
          controllerRef.current = null;
          announceOrPromptQuestion(targetIndex);
          return;
        }

        if (parsed.isNavigation === "review") {
          clearAutoAdvanceDebounce();
          activeController?.abort();
          controllerRef.current = null;
          setVoiceStatus("idle");
          setViewState("review");
          return;
        }

        if (parsed.isNavigation === "next") {
          clearAutoAdvanceDebounce();
          activeController?.abort();
          controllerRef.current = null;
          if (targetIndex < parameters.length - 1) {
            setCurrentIndex(targetIndex + 1);
          } else {
            setViewState("review");
          }
          return;
        }

        // 2. Invalid or Ambiguous Speech: Do NOT advance, do NOT store answer!
        if (!parsed.valid) {
          clearAutoAdvanceDebounce();
          const clarifyMsg =
            parsed.clarification ||
            "I didn't catch a rating. Say a number from 1 to 10, or say 'No view'.";
          setVoiceFeedback(clarifyMsg);

          if (readAloudRef.current) {
            activeController?.abort();
            controllerRef.current = null;
            setIsSpeaking(true);
            speakText(clarifyMsg, {
              onEnd: () => {
                setIsSpeaking(false);
                startListeningForQuestion(targetIndex);
              },
              onError: () => {
                setIsSpeaking(false);
                startListeningForQuestion(targetIndex);
              },
            });
          }
          return;
        }

        // 3. Valid Rating Parsed: Lock against duplicate advancing
        isAdvancingRef.current = true;
        clearAutoAdvanceDebounce();
        activeController?.stop();
        controllerRef.current = null;
        setVoiceStatus("confirming");

        const score = parsed.score;
        const isNoView = parsed.isNoView;
        const feedbackMsg = isNoView
          ? 'Heard "No view" — selected'
          : `Heard ${score} — selected`;

        setVoiceFeedback(feedbackMsg);

        // Immediately update local answers so ParameterInput highlights the selected button!
        setAnswers((prev) => ({
          ...prev,
          [param.parameter_id]: { score, isNoView },
        }));

        try {
          // Persist answer to backend before scheduling progression
          await api.saveAnswer(session.id, param.parameter_id, {
            score,
            is_no_view: isNoView,
          });

          // Prevent progression if user navigated away while save was in-flight
          if (currentQuestionIndexRef.current !== targetIndex) {
            isAdvancingRef.current = false;
            return;
          }

          setVoiceFeedback(`${feedbackMsg}. Advancing...`);

          // Visual confirmation delay (~900ms) before advancing to next question
          advanceTimerRef.current = setTimeout(() => {
            isAdvancingRef.current = false;
            advanceTimerRef.current = null;

            if (targetIndex < parameters.length - 1) {
              setCurrentIndex(targetIndex + 1);
            } else {
              setVoiceStatus("idle");
              setViewState("review");
            }
          }, 900);
        } catch (err: any) {
          isAdvancingRef.current = false;
          setVoiceStatus("error");
          const errText = err?.message || "Failed to save answer. Please check your connection and tap retry.";
          setVoiceError(errText);
          setError(errText);
        }
      };

      const controller = startSpeechSession({
        lang: "en-IN",
        silenceTimeoutMs: 3500,
        autoStopOnSilence: true,
        onStart: () => {
          setVoiceStatus("listening");
          setVoiceError(null);
          latestTranscriptRef.current = "";
        },
        onInterimTranscript: (combined: string, isComplete?: boolean) => {
          if (isAdvancingRef.current) return;
          latestTranscriptRef.current = combined;
          setInterimTranscript(combined);

          clearAutoAdvanceDebounce();

          const parsed = parseSpokenRating(combined);
          if (parsed.valid) {
            if (isComplete || parsed.isNavigation) {
              processSpokenTranscript(combined, controllerRef.current);
            } else {
              // Valid rating hypothesis (e.g. user said "2" or "two"):
              // Wait 500ms for user to finish potential phrase (e.g. "two out of ten"), then commit
              autoAdvanceDebounceRef.current = setTimeout(() => {
                autoAdvanceDebounceRef.current = null;
                processSpokenTranscript(combined, controllerRef.current);
              }, 500);
            }
          }
        },
        onFinalTranscript: async (finalText: string) => {
          clearAutoAdvanceDebounce();
          processSpokenTranscript(finalText, controllerRef.current);
        },
        onSilenceTimeout: (finalTranscript?: string) => {
          clearAutoAdvanceDebounce();
          if (isAdvancingRef.current) return;
          const candidate = (finalTranscript || latestTranscriptRef.current || "").trim();
          if (candidate) {
            processSpokenTranscript(candidate, controllerRef.current);
          } else {
            setVoiceStatus("paused");
            setVoiceFeedback("Listening paused due to silence. Tap 'Resume' to continue.");
          }
        },
        onError: (errMsg: string) => {
          clearAutoAdvanceDebounce();
          if (isAdvancingRef.current) return;
          setVoiceStatus("error");
          setVoiceError(errMsg);
        },
        onEnd: () => {
          clearAutoAdvanceDebounce();
          if (!isAdvancingRef.current && voiceStartedRef.current) {
            setVoiceStatus((curr) => (curr === "confirming" ? curr : "paused"));
          }
        },
      });

      controllerRef.current = controller;
    },
    [parameters, session.id, clearAutoAdvanceDebounce]
  );

  // Announces question if readAloud is enabled, then begins listening
  const announceOrPromptQuestion = useCallback(
    (targetIndex: number) => {
      const param = parameters[targetIndex];
      if (!param) return;

      clearAutoAdvanceDebounce();
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }

      if (readAloudRef.current && isSpeechSynthesisSupported()) {
        setIsSpeaking(true);
        setVoiceStatus("idle");
        const narration = `Question ${targetIndex + 1} of 25. ${param.parameter_name}. Say a rating from 1 to 10, or say No view.`;
        speakText(narration, {
          onStart: () => setIsSpeaking(true),
          onEnd: () => {
            setIsSpeaking(false);
            startListeningForQuestion(targetIndex);
          },
          onError: () => {
            setIsSpeaking(false);
            startListeningForQuestion(targetIndex);
          },
        });
      } else {
        startListeningForQuestion(targetIndex);
      }
    },
    [parameters, startListeningForQuestion, clearAutoAdvanceDebounce]
  );

  // Automatically start voice listening when question changes in voice mode
  useEffect(() => {
    if (
      inputMode !== "voice" ||
      !voiceStarted ||
      viewState !== "questions" ||
      parameters.length === 0
    ) {
      return;
    }

    announceOrPromptQuestion(currentIndex);

    return () => {
      clearAutoAdvanceDebounce();
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
      stopSpeaking();
    };
  }, [currentIndex, inputMode, voiceStarted, viewState, parameters.length, announceOrPromptQuestion, clearAutoAdvanceDebounce]);

  // Mode Switcher: Safely switches between Text and Voice while preserving answers
  const handleSwitchMode = (mode: "text" | "voice") => {
    if (mode === inputMode) return;

    if (mode === "text") {
      stopSpeaking();
      clearAutoAdvanceDebounce();
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
      isAdvancingRef.current = false;
      setInputMode("text");
      setVoiceStatus("idle");
      setVoiceFeedback(null);
      setVoiceError(null);
    } else {
      if (!isSpeechRecognitionSupported()) {
        setVoiceError(
          "Voice input is not supported in this browser. Please use Chrome, Edge, or Safari."
        );
      }
      setInputMode("voice");
    }
  };

  // Explicit user action to initiate voice session and browser permissions flow
  const handleStartVoiceRating = () => {
    if (!isSpeechRecognitionSupported()) {
      setVoiceError(
        "Voice input is not supported in this browser. Please use Chrome, Edge, or Safari."
      );
      return;
    }
    setVoiceStarted(true);
    setVoiceError(null);
    setVoiceFeedback("Starting voice rating...");
  };

  // Resume listening after silence pause or manual stop
  const handleResumeListening = () => {
    startListeningForQuestion(currentIndex);
  };

  // Pause listening
  const handlePauseListening = () => {
    clearAutoAdvanceDebounce();
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    setVoiceStatus("paused");
    setVoiceFeedback("Listening paused. Tap 'Resume' to continue.");
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
    <div className="py-5 sm:py-8 px-3.5 sm:px-6 max-w-3xl mx-auto font-sans">
      {/* Top Bar: Navigation & Review CTA */}
      <div className="mb-3 sm:mb-4 flex flex-col xs:flex-row xs:items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={onExit}
          className="text-xs font-semibold text-charcoal-muted hover:text-charcoal inline-flex items-center gap-1.5 min-h-[36px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Session</span>
        </button>

        <button
          type="button"
          onClick={() => setViewState("review")}
          className="btn-secondary text-xs py-1.5 px-3 min-h-[36px] flex items-center gap-1.5 font-medium self-start xs:self-auto"
        >
          <ListChecks className="w-4 h-4 text-olive" />
          <span>Review ({answeredCount}/25)</span>
        </button>
      </div>

      {/* SECTION 4: Dual Input Mode Selector (Text vs Voice) */}
      <div className="mb-5 sm:mb-6 p-1 bg-warm-grey-light/80 rounded-lg border border-warm-grey grid grid-cols-2 gap-1.5">
        <button
          type="button"
          id="mode-selector-text"
          onClick={() => handleSwitchMode("text")}
          className={`min-h-[42px] py-2 px-3 rounded-md font-sans text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            inputMode === "text"
              ? "bg-card text-charcoal shadow-sm border border-warm-grey ring-1 ring-charcoal/10"
              : "text-charcoal-muted hover:text-charcoal"
          }`}
        >
          <span>✍️ Rate with text</span>
          <span className="text-[10px] hidden sm:inline text-charcoal-muted font-normal">
            (Tap buttons)
          </span>
        </button>

        <button
          type="button"
          id="mode-selector-voice"
          onClick={() => handleSwitchMode("voice")}
          className={`min-h-[42px] py-2 px-3 rounded-md font-sans text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            inputMode === "voice"
              ? "bg-olive text-paper shadow-sm ring-1 ring-olive/40 font-bold"
              : "text-charcoal-muted hover:text-charcoal"
          }`}
        >
          <Mic className={`w-3.5 h-3.5 ${inputMode === "voice" ? "text-paper" : "text-olive"}`} />
          <span>Rate with voice</span>
          <span className="text-[10px] hidden sm:inline opacity-85 font-normal">
            (Speak numbers)
          </span>
        </button>
      </div>

      {/* Voice Mode Onboarding / Start Card (Before Mic starts) */}
      {inputMode === "voice" && !voiceStarted && (
        <div className="editorial-card p-5 sm:p-7 bg-card border-warm-grey shadow-card mb-6 sm:mb-8 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5 mb-4 text-center sm:text-left">
            <div className="w-11 h-11 rounded-full bg-olive-light flex items-center justify-center shrink-0 border border-olive/30">
              <Mic className="w-5 h-5 text-olive" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-charcoal">
                Voice-Controlled Rating
              </h3>
              <p className="text-xs sm:text-sm text-charcoal-muted mt-1 leading-relaxed">
                Say a number from 1 to 10 to answer each question. Say 'No view' if you don't have enough experience to rate this category.
              </p>
            </div>
          </div>

          <div className="bg-warm-grey-light/60 border border-warm-grey rounded-lg p-3 sm:p-4 mb-4 text-xs text-charcoal space-y-2">
            <span className="font-semibold text-charcoal block">Spoken commands supported:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-charcoal-muted text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="text-olive font-bold">•</span>
                <span>Numbers <strong>1 to 10</strong> or words <em>"one"</em> to <em>"ten"</em></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-olive font-bold">•</span>
                <span><strong>"No view"</strong>, <strong>"pass"</strong>, or <strong>"skip"</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-olive font-bold">•</span>
                <span><strong>"Previous"</strong> or <strong>"go back"</strong> to undo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-olive font-bold">•</span>
                <span><strong>"Repeat"</strong> to hear the question again</span>
              </div>
            </div>
          </div>

          {/* Optional Narration Toggle */}
          {isSpeechSynthesisSupported() && (
            <label className="flex items-center gap-2.5 mb-5 cursor-pointer select-none text-xs text-charcoal">
              <input
                type="checkbox"
                id="voice-read-aloud-toggle"
                checked={readAloud}
                onChange={(e) => {
                  setReadAloud(e.target.checked);
                  readAloudRef.current = e.target.checked;
                }}
                className="rounded border-warm-grey text-olive focus:ring-olive w-4 h-4 cursor-pointer"
              />
              <span className="font-medium">
                Read questions aloud (narrate criteria before listening)
              </span>
            </label>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              id="start-voice-rating-btn"
              onClick={handleStartVoiceRating}
              className="btn-primary min-h-[44px] w-full sm:w-auto px-6 py-2.5 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <Mic className="w-4 h-4" />
              <span>Start voice rating</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode("text")}
              className="btn-secondary min-h-[44px] w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-charcoal-muted hover:text-charcoal"
            >
              <span>Stay with text mode</span>
            </button>
          </div>
        </div>
      )}

      {/* Progress Indicator Bar */}
      <div className="mb-6 sm:mb-8 p-3.5 sm:p-4 rounded bg-card border border-warm-grey shadow-subtle">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between text-xs text-charcoal-muted mb-2 font-mono gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-charcoal">
              Question #{currentIndex + 1} of 25
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
        <div className="mt-3.5 pt-3 border-t border-warm-grey flex items-center gap-1.5 flex-wrap justify-center xs:justify-start">
          {parameters.map((p, idx) => {
            const isAns = Boolean(answers[p.parameter_id]);
            const isCurr = idx === currentIndex;
            return (
              <button
                key={p.parameter_id}
                onClick={() => setCurrentIndex(idx)}
                title={`Jump to #${idx + 1}: ${p.parameter_name}`}
                className={`w-7 h-7 sm:w-6 sm:h-6 rounded text-[11px] sm:text-[10px] font-mono font-bold transition-all flex items-center justify-center ${
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
        <div className="editorial-card p-4 sm:p-8 md:p-10 bg-card mb-6 sm:mb-8 shadow-card border-warm-grey">
          {/* Category Header */}
          <div className="flex flex-col xs:flex-row xs:items-center justify-between pb-3 sm:pb-4 mb-5 sm:mb-6 border-b border-warm-grey gap-1.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-olive-light flex items-center justify-center flex-shrink-0">
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

          {/* Active Voice Control & Live Feedback Panel */}
          {inputMode === "voice" && voiceStarted && (
            <div className="mb-6 p-3.5 sm:p-4 rounded-lg bg-warm-grey-light/70 border border-warm-grey shadow-subtle flex flex-col gap-3 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      voiceStatus === "listening"
                        ? "bg-emerald-600 text-white animate-pulse"
                        : voiceStatus === "confirming"
                        ? "bg-olive text-white scale-105"
                        : isSpeaking
                        ? "bg-olive text-white animate-pulse"
                        : voiceStatus === "paused"
                        ? "bg-amber-600 text-white"
                        : voiceStatus === "error"
                        ? "bg-rose-600 text-white"
                        : "bg-warm-grey text-charcoal"
                    }`}
                  >
                    {isSpeaking ? (
                      <Volume2 className="w-4 h-4" />
                    ) : voiceStatus === "listening" ? (
                      <Mic className="w-4 h-4 animate-bounce" />
                    ) : voiceStatus === "confirming" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : voiceStatus === "paused" ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <MicOff className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-charcoal flex items-center gap-2 flex-wrap">
                      <span>
                        {isSpeaking
                          ? "Reading question aloud..."
                          : voiceStatus === "listening"
                          ? "Listening for your rating (say 1-10 or 'No view')..."
                          : voiceStatus === "confirming"
                          ? "Answer confirmed — advancing..."
                          : voiceStatus === "paused"
                          ? (voiceFeedback && (voiceFeedback.includes("Scores must be") || voiceFeedback.includes("Could not recognize") || voiceFeedback.includes("multiple numbers"))
                              ? "Listening paused — tap Resume to answer"
                              : "Listening paused due to silence")
                          : "Voice input ready"}
                      </span>
                    </div>

                    {/* Live Transcript / Feedback line */}
                    <p className="text-[11px] text-charcoal-muted mt-0.5 font-sans">
                      {interimTranscript ? (
                        <span>
                          <strong className="text-charcoal font-semibold">Heard: </strong>
                          <span className="italic text-olive font-medium">"{interimTranscript}"</span>
                        </span>
                      ) : voiceFeedback ? (
                        <span>{voiceFeedback}</span>
                      ) : (
                        <span>Say a number from 1 to 10, or say 'No view'.</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Voice Action Controls */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
                  {voiceStatus === "paused" && (
                    <button
                      type="button"
                      onClick={handleResumeListening}
                      className="px-3 py-1.5 rounded text-xs font-semibold bg-olive text-white hover:bg-olive-dark flex items-center gap-1.5 min-h-[34px] shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Resume</span>
                    </button>
                  )}

                  {voiceStatus === "listening" && (
                    <button
                      type="button"
                      onClick={handlePauseListening}
                      className="px-2.5 py-1.5 rounded text-[11px] font-medium bg-card border border-warm-grey text-charcoal-muted hover:text-charcoal min-h-[32px] flex items-center gap-1"
                    >
                      <Pause className="w-3 h-3" />
                      <span>Pause</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => announceOrPromptQuestion(currentIndex)}
                    title="Repeat question audio"
                    className="px-2.5 py-1.5 rounded text-[11px] font-medium bg-card border border-warm-grey text-charcoal hover:border-olive flex items-center gap-1 min-h-[32px]"
                  >
                    <RotateCcw className="w-3 h-3 text-olive" />
                    <span>Repeat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchMode("text")}
                    className="px-2.5 py-1.5 rounded text-[11px] font-medium bg-card border border-warm-grey text-charcoal-muted hover:text-charcoal hover:border-rose-300 min-h-[32px]"
                  >
                    <span>Use Text</span>
                  </button>
                </div>
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
          <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-charcoal mt-1 mb-3 sm:mb-4 leading-snug">
            {currentParam.parameter_name}
          </h2>

          <p className="text-xs sm:text-sm text-charcoal-muted mb-6 sm:mb-8 leading-relaxed font-sans">
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
          <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-warm-grey flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => {
                if (advanceTimerRef.current) {
                  clearTimeout(advanceTimerRef.current);
                  advanceTimerRef.current = null;
                }
                setCurrentIndex((prev) => Math.max(prev - 1, 0));
              }}
              className="btn-secondary min-h-[44px] text-xs py-2 px-4 disabled:opacity-30 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {currentIndex < parameters.length - 1 ? (
              <button
                type="button"
                onClick={() => {
                  if (advanceTimerRef.current) {
                    clearTimeout(advanceTimerRef.current);
                    advanceTimerRef.current = null;
                  }
                  setCurrentIndex((prev) => Math.min(prev + 1, parameters.length - 1));
                }}
                className="btn-secondary min-h-[44px] text-xs py-2 px-5 flex items-center gap-1.5 font-medium"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setViewState("review")}
                className="btn-primary min-h-[44px] text-xs py-2 px-5 font-semibold flex items-center gap-1.5"
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
