import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { api } from "../lib/api";
import { getClientUUID, getActiveSessionId } from "../lib/storage";
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  startSpeechRecognition,
  speakText,
  stopSpeaking,
} from "../lib/voice";
import type { ChatMessage, ToolCallRecord } from "../types/assistant";
import { ScoreBadge } from "./ScoreBadge";
import { DemoBadge } from "./DemoBadge";

interface AssistantDrawerProps {
  isOpen: boolean;
  initialQuery?: string;
  onClearInitialQuery?: () => void;
  onClose: () => void;
  onSelectCollege: (collegeId: string) => void;
}

interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCallRecord[];
  structuredPayload?: any;
  providerUsed?: string;
}

/**
 * Cleanly separates natural text from raw JSON payloads.
 * Prevents stringified JSON dumps from ever appearing in chat bubbles.
 */
function cleanAssistantReply(
  rawContent: string,
  existingPayload?: any
): { displayText: string; structuredPayload: any | null } {
  let text = rawContent || "";
  let payload = existingPayload || null;

  // Pattern 1: "Based on retrieved platform records:\n\n{...}"
  const platformRecordsMatch = text.match(
    /Based on retrieved platform records:\s*([\s\S]*)/i
  );
  if (platformRecordsMatch) {
    const rawJson = platformRecordsMatch[1].trim();
    try {
      const parsed = JSON.parse(rawJson);
      // Auto-wrap into structured payload if not already provided
      if (!payload) {
        if (parsed.colleges && Array.isArray(parsed.colleges)) {
          payload = { type: "search_colleges", data: parsed };
          text = `I found ${parsed.colleges.length} institutional record${
            parsed.colleges.length === 1 ? "" : "s"
          } in the directory:`;
        } else if (parsed.college) {
          payload = { type: "get_college_summary", data: parsed };
          text = `Here is the verified score overview from our PostgreSQL database:`;
        } else if (parsed.parameters && Array.isArray(parsed.parameters)) {
          payload = { type: "get_parameter_ratings", data: parsed };
          text = `Here is the parameter-level rating breakdown across core criteria:`;
        } else if (parsed.status === "confirmation_required") {
          payload = { type: "create_unknown_college", data: parsed };
          text = `Please confirm before registering this unlisted campus:`;
        } else {
          text = `Here are the platform details retrieved:`;
        }
      } else {
        text = `Here is what I found in our institutional registry:`;
      }
    } catch {
      // Not valid JSON, leave text as is
      text = text.replace(/Based on retrieved platform records:\s*/i, "").trim();
    }
  }

  // Pattern 2: The entire text is a JSON string
  const trimmed = text.trim();
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      const parsed = JSON.parse(trimmed);
      if (!payload) {
        if (parsed.colleges) {
          payload = { type: "search_colleges", data: parsed };
          text = `Found ${parsed.colleges.length} matching college${
            parsed.colleges.length === 1 ? "" : "s"
          }:`;
        } else if (parsed.college) {
          payload = { type: "get_college_summary", data: parsed };
          text = `Institutional profile retrieved:`;
        } else if (parsed.parameters) {
          payload = { type: "get_parameter_ratings", data: parsed };
          text = `Parameter scores retrieved:`;
        }
      } else {
        text = "Here is the institutional information:";
      }
    } catch {
      // ignore
    }
  }

  return { displayText: text, structuredPayload: payload };
}

/**
 * Renders message text cleanly by stripping raw markdown asterisks (*)
 * and formatting **bold** terms into styled strong elements without visible stars.
 */
function renderMessageContent(content: string, isUser: boolean) {
  if (!content) return null;

  const lines = content.split("\n");

  return (
    <div className="space-y-1.5 font-sans leading-relaxed">
      {lines.map((line, lineIdx) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          return <div key={lineIdx} className="h-1" />;
        }

        // Clean markdown headers (### Header -> styled heading without hashtags or asterisks)
        const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.*)$/);
        if (headerMatch) {
          const headerLevel = headerMatch[1].length;
          const headerText = headerMatch[2].replace(/\*/g, "").trim();
          return (
            <div
              key={lineIdx}
              className={`font-semibold tracking-tight ${
                headerLevel <= 2
                  ? "text-sm sm:text-base text-charcoal font-serif mt-2 mb-0.5"
                  : "text-xs sm:text-sm text-charcoal font-sans mt-1.5 mb-0.5"
              }`}
            >
              {headerText}
            </div>
          );
        }

        // Clean bullet indicators
        const isBullet =
          trimmedLine.startsWith("- ") ||
          trimmedLine.startsWith("* ") ||
          trimmedLine.startsWith("• ");
        const lineContent = isBullet ? trimmedLine.slice(2).trim() : trimmedLine;

        // Parse **bold text** without showing literal asterisks
        const segments: React.ReactNode[] = [];
        const parts = lineContent.split(/(\*\*[^*]+?\*\*)/g);

        parts.forEach((part, partIdx) => {
          if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
            const innerText = part.slice(2, -2).trim();
            segments.push(
              <strong
                key={partIdx}
                className={isUser ? "font-semibold text-paper" : "font-semibold text-charcoal"}
              >
                {innerText}
              </strong>
            );
          } else {
            // Strip any remaining lone or paired asterisks
            const cleaned = part.replace(/\*/g, "");
            if (cleaned) {
              segments.push(<span key={partIdx}>{cleaned}</span>);
            }
          }
        });

        if (isBullet) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                  isUser ? "bg-paper/70" : "bg-olive"
                }`}
              />
              <div className="flex-1">{segments}</div>
            </div>
          );
        }

        return <div key={lineIdx}>{segments}</div>;
      })}
    </div>
  );
}

export const AssistantDrawer: React.FC<AssistantDrawerProps> = ({
  isOpen,
  initialQuery,
  onClearInitialQuery,
  onClose,
  onSelectCollege,
}) => {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "init",
      role: "assistant",
      content:
        "Welcome to the Campus Uncut Intelligence Assistant. Ask me to look up official scores, check parameter ratings (food, hostels, academics, safety), or explore verified student experiences.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voicePlaybackEnabled, setVoicePlaybackEnabled] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);
  const baseInputRef = useRef<string>("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && initialQuery && initialQuery.trim()) {
      handleSendMessage(initialQuery.trim());
      onClearInitialQuery?.();
    }
  }, [isOpen, initialQuery]);

  // Handle Escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        stopSpeaking();
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      if (stopListeningRef.current) {
        stopListeningRef.current();
      }
    };
  }, []);

  const handlePlayMessageAudio = (msg: MessageItem) => {
    if (speakingMessageId === msg.id) {
      stopSpeaking();
      setSpeakingMessageId(null);
      return;
    }

    stopSpeaking();
    setSpeakingMessageId(msg.id);

    // Build spoken text (clean user-facing response + concise spoken summary for cards)
    let speechContent = msg.content;
    if (msg.structuredPayload) {
      if (msg.structuredPayload.type === "get_college_summary" && msg.structuredPayload.data?.college) {
        const col = msg.structuredPayload.data.college;
        speechContent += ` Institutional score is ${col.current_score} out of 100 with ${col.total_submitted_sessions} ratings.`;
      } else if (msg.structuredPayload.type === "search_colleges" && msg.structuredPayload.data?.colleges) {
        const list = msg.structuredPayload.data.colleges;
        speechContent += ` Found ${list.length} colleges in the directory.`;
      }
    }

    speakText(speechContent, {
      onStart: () => setSpeakingMessageId(msg.id),
      onEnd: () => setSpeakingMessageId(null),
      onError: () => setSpeakingMessageId(null),
    });
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    // Interrupt any ongoing speech when user sends a new message
    stopSpeaking();
    setSpeakingMessageId(null);

    const userMsgId = `user_${Date.now()}`;
    const newMessages = [
      ...messages,
      { id: userMsgId, role: "user" as const, content: text },
    ];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const historyPayload: ChatMessage[] = newMessages
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await api.sendAssistantMessage({
        message: text,
        client_uuid: getClientUUID(),
        session_id: getActiveSessionId() || undefined,
        history: historyPayload,
      });

      const { displayText, structuredPayload } = cleanAssistantReply(
        res.reply,
        res.structured_payload
      );

      const assistantMsg: MessageItem = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: displayText,
        toolCalls: res.tool_calls,
        structuredPayload: structuredPayload,
        providerUsed: res.provider_used,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (voicePlaybackEnabled) {
        handlePlayMessageAudio(assistantMsg);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          role: "assistant",
          content:
            "I encountered a temporary connection issue. You can still search and view colleges directly using the Explore Colleges directory.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    stopSpeaking();
    setSpeakingMessageId(null);
    setVoiceError(null);

    if (isListening) {
      if (stopListeningRef.current) {
        stopListeningRef.current();
        stopListeningRef.current = null;
      }
      setIsListening(false);
    } else {
      if (!isSpeechRecognitionSupported()) {
        setVoiceError("Speech recognition is not supported in this browser. Please type your query.");
        return;
      }
      baseInputRef.current = input.trim();
      setIsListening(true);
      const stopFn = startSpeechRecognition({
        onStart: () => {
          setIsListening(true);
          setVoiceError(null);
        },
        onTranscript: (transcript) => {
          const clean = transcript.trim();
          const base = baseInputRef.current;
          if (!base) {
            setInput(clean);
          } else if (clean.toLowerCase().startsWith(base.toLowerCase())) {
            setInput(clean);
          } else {
            setInput(`${base} ${clean}`.trim());
          }
        },
        onError: (errText) => {
          setIsListening(false);
          stopListeningRef.current = null;
          setVoiceError(errText);
        },
        onEnd: () => {
          setIsListening(false);
          stopListeningRef.current = null;
        },
      });
      stopListeningRef.current = stopFn;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop Scrim */}
      <div
        className="fixed inset-0 bg-charcoal/50 backdrop-blur-xs transition-opacity"
        onClick={() => {
          stopSpeaking();
          onClose();
        }}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Campus Intelligence Assistant"
        className="fixed inset-y-0 right-0 w-full sm:w-[460px] max-w-full bg-card border-l border-warm-grey z-50 shadow-2xl flex flex-col font-sans animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-warm-grey flex items-center justify-between bg-paper">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-olive-light flex items-center justify-center text-olive border border-olive/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-base text-charcoal">
              Campus Intelligence
            </h2>
            {(() => {
              const latestAssistant = [...messages].reverse().find((m) => m.role === "assistant");
              const prov = latestAssistant?.providerUsed?.toLowerCase() || "";
              const isGroq = prov === "groq";
              const isFallback = prov === "mock_fallback";
              let label = "AI Assistant Ready";
              let dotClass = "bg-emerald-500";
              if (isGroq) {
                label = "Groq LLM Active";
                dotClass = "bg-emerald-500 animate-pulse";
              } else if (isFallback) {
                label = "Deterministic Fallback Active";
                dotClass = "bg-amber-500";
              } else if (prov === "mock") {
                label = "Deterministic Engine Active";
                dotClass = "bg-olive";
              }
              return (
                <div className="text-[11px] text-charcoal-muted flex items-center gap-1.5 font-mono">
                  <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                  <span>{label}</span>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isSpeechSynthesisSupported() && (
            <button
              onClick={() => {
                if (voicePlaybackEnabled) stopSpeaking();
                setVoicePlaybackEnabled(!voicePlaybackEnabled);
              }}
              title={voicePlaybackEnabled ? "Mute voice playback" : "Enable voice playback"}
              className={`min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded transition-colors ${
                voicePlaybackEnabled
                  ? "text-olive bg-olive-light"
                  : "text-charcoal-muted hover:text-charcoal hover:bg-warm-grey-light"
              }`}
            >
              {voicePlaybackEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
          )}

          <button
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-charcoal-muted hover:text-charcoal rounded hover:bg-warm-grey-light"
            aria-label="Close Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[92%] text-xs sm:text-sm p-4 rounded-lg leading-relaxed ${
                  isUser
                    ? "bg-charcoal text-paper rounded-br-none shadow-sm"
                    : "bg-paper border border-warm-grey text-charcoal rounded-bl-none shadow-subtle"
                }`}
              >
                {/* Clean, readable message text formatted without raw asterisks */}
                {renderMessageContent(m.content, isUser)}

                {/* Structured Visual Cards */}
                {m.structuredPayload && (
                  <div className="mt-3 pt-3 border-t border-warm-grey/80">
                    {/* 1. College Search Results */}
                    {m.structuredPayload.type === "search_colleges" &&
                      m.structuredPayload.data?.colleges && (
                        <div className="space-y-2 mt-1">
                          <div className="text-[10px] font-mono text-charcoal-muted uppercase tracking-wider flex items-center justify-between">
                            <span>Directory Results</span>
                            <span>{m.structuredPayload.data.colleges.length} found</span>
                          </div>
                          {m.structuredPayload.data.colleges.slice(0, 4).map((col: any) => (
                            <div
                              key={col.college_id}
                              onClick={() => {
                                onSelectCollege(col.college_id);
                                onClose();
                              }}
                              className="p-3 rounded border border-warm-grey bg-card hover:border-olive cursor-pointer transition-all hover:shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-semibold text-xs text-charcoal flex items-center gap-1.5">
                                    <span>{col.name}</span>
                                    {col.is_demo ? (
                                      <DemoBadge />
                                    ) : (
                                      <span className="text-[10px] font-mono text-olive font-medium px-1.5 py-0.2 rounded bg-olive-light">
                                        Official
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-charcoal-muted mt-0.5 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-olive" />
                                    <span>
                                      {col.city}, {col.state}
                                    </span>
                                    <span>•</span>
                                    <span>{col.total_submitted_sessions} ratings</span>
                                  </div>
                                </div>
                                <ScoreBadge score={col.current_score} size="sm" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    {/* 2. College Summary Card */}
                    {m.structuredPayload.type === "get_college_summary" &&
                      m.structuredPayload.data?.college && (
                        <div className="p-3.5 rounded border border-warm-grey bg-card mt-1 shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-serif font-bold text-sm sm:text-base text-charcoal">
                                {m.structuredPayload.data.college.name}
                              </div>
                              <div className="text-[11px] text-charcoal-muted mt-0.5 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-olive" />
                                <span>
                                  {m.structuredPayload.data.college.city},{" "}
                                  {m.structuredPayload.data.college.state}
                                </span>
                              </div>
                            </div>
                            <ScoreBadge
                              score={m.structuredPayload.data.college.current_score}
                              size="md"
                            />
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-warm-grey grid grid-cols-2 gap-2 text-center text-[11px]">
                            <div className="p-1.5 rounded bg-warm-grey-light">
                              <span className="font-bold text-charcoal">
                                {m.structuredPayload.data.college.total_submitted_sessions}
                              </span>
                              <div className="text-[10px] text-charcoal-muted uppercase font-mono">
                                Total Ratings
                              </div>
                            </div>
                            <div className="p-1.5 rounded bg-warm-grey-light">
                              <span className="font-bold text-charcoal">
                                {m.structuredPayload.data.college.is_demo ? "Simulated" : "Registry Base"}
                              </span>
                              <div className="text-[10px] text-charcoal-muted uppercase font-mono">
                                Status
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              onSelectCollege(m.structuredPayload.data.college.college_id);
                              onClose();
                            }}
                            className="mt-3 w-full btn-primary text-xs py-1.5 flex items-center justify-center gap-1.5"
                          >
                            <span>Open College Report</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                    {/* 3. Parameter Ratings Breakdown Card */}
                    {m.structuredPayload.type === "get_parameter_ratings" &&
                      m.structuredPayload.data?.parameters && (
                        <div className="space-y-2 mt-1">
                          <div className="text-[10px] font-mono text-charcoal-muted uppercase tracking-wider">
                            Verified Parameter Highlights
                          </div>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {m.structuredPayload.data.parameters
                              .slice(0, 5)
                              .map((param: any) => {
                                const avg = param.average_score;
                                return (
                                  <div
                                    key={param.parameter_id || param.display_order}
                                    className="p-2 rounded bg-card border border-warm-grey text-xs flex items-center justify-between"
                                  >
                                    <div>
                                      <div className="font-medium text-charcoal text-[11px]">
                                        {param.parameter_name}
                                      </div>
                                      <div className="text-[10px] font-mono text-olive uppercase">
                                        {param.parameter_category}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      {avg !== null && avg !== undefined ? (
                                        <span className="font-bold font-mono text-charcoal">
                                          {Number(avg).toFixed(1)}/10
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-charcoal-muted italic">
                                          No ratings
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                    {/* 4. Unknown College Confirmation Card */}
                    {m.structuredPayload.type === "create_unknown_college" &&
                      m.structuredPayload.data?.status === "confirmation_required" && (
                        <div className="p-3.5 rounded border border-terracotta/40 bg-terracotta-light text-xs mt-1">
                          <div className="font-semibold text-charcoal flex items-center gap-1.5 mb-1">
                            <HelpCircle className="w-4 h-4 text-terracotta" />
                            <span>Confirm College Creation</span>
                          </div>
                          <p className="text-charcoal-muted leading-relaxed">
                            {m.structuredPayload.data.message ||
                              "Please confirm adding this new college to the database with a starting baseline score of 100."}
                          </p>
                          <button
                            onClick={() =>
                              handleSendMessage(
                                `Yes, please confirm adding ${m.structuredPayload.data.details.name} in ${m.structuredPayload.data.details.city}, ${m.structuredPayload.data.details.state}`
                              )
                            }
                            className="mt-3 btn-terracotta text-xs w-full py-2 font-medium"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm & Add College</span>
                          </button>
                        </div>
                      )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1 px-1">
                {!isUser && isSpeechSynthesisSupported() && (
                  <button
                    type="button"
                    onClick={() => handlePlayMessageAudio(m)}
                    title={speakingMessageId === m.id ? "Stop voice playback" : "Read message aloud"}
                    className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${
                      speakingMessageId === m.id
                        ? "bg-olive text-paper animate-pulse font-semibold"
                        : "text-charcoal-muted hover:text-charcoal bg-warm-grey-light hover:bg-warm-grey"
                    }`}
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>{speakingMessageId === m.id ? "Stop Voice" : "Listen"}</span>
                  </button>
                )}
                {m.providerUsed && (
                  <span className="text-[10px] font-mono text-charcoal-muted/70">
                    Engine: {m.providerUsed === "groq" ? "Groq LLM (Hosted)" : m.providerUsed === "mock" ? "Deterministic Rule Engine" : m.providerUsed}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-charcoal-muted p-2">
            <span className="w-2 h-2 rounded-full bg-olive animate-ping" />
            <span>Consulting verified platform database...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 border-t border-warm-grey bg-paper flex items-center gap-1.5 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
        <button
          onClick={() => handleSendMessage("Search for SFIT")}
          className="px-2.5 py-1 rounded bg-card border border-warm-grey text-charcoal-muted hover:text-charcoal text-[11px] hover:border-olive transition-colors"
        >
          Search SFIT
        </button>
        <button
          onClick={() => handleSendMessage("What is the score of COEP?")}
          className="px-2.5 py-1 rounded bg-card border border-warm-grey text-charcoal-muted hover:text-charcoal text-[11px] hover:border-olive transition-colors"
        >
          Score of COEP
        </button>
        <button
          onClick={() => handleSendMessage("How are placements at VJTI?")}
          className="px-2.5 py-1 rounded bg-card border border-warm-grey text-charcoal-muted hover:text-charcoal text-[11px] hover:border-olive transition-colors"
        >
          Placements VJTI
        </button>
        <button
          onClick={() => handleSendMessage("List rating parameters")}
          className="px-2.5 py-1 rounded bg-card border border-warm-grey text-charcoal-muted hover:text-charcoal text-[11px] hover:border-olive transition-colors"
        >
          Question Bank
        </button>
      </div>

      {/* Voice Error Notification */}
      {voiceError && (
        <div className="mx-3 mt-2 p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center justify-between">
          <span>{voiceError}</span>
          <button
            type="button"
            onClick={() => setVoiceError(null)}
            className="text-rose-600 hover:text-rose-900 font-bold ml-2 text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 pb-safe border-t border-warm-grey bg-card">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isListening ? "Listening... speak now" : "Ask about scores, ratings, or campuses..."
            }
            className="flex-1 min-h-[44px] px-3 py-2 text-xs sm:text-sm bg-paper border border-warm-grey rounded focus:outline-none focus:border-olive font-sans"
          />

          <button
            type="button"
            onClick={toggleListening}
            title={isListening ? "Stop listening" : "Speak with voice"}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 rounded transition-colors ${
              isListening
                ? "bg-rose-600 text-white animate-pulse"
                : "text-charcoal-muted hover:text-charcoal border border-warm-grey bg-paper"
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="btn-primary min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 text-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  </div>
  );
};
