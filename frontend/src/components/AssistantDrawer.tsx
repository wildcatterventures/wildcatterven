import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
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

export const AssistantDrawer: React.FC<AssistantDrawerProps> = ({
  isOpen,
  onClose,
  onSelectCollege,
}) => {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "init",
      role: "assistant",
      content:
        "Welcome! I am the Campus Uncut AI Assistant. Ask me to search for colleges, summarize official scores, explore ratings across academics, food, or safety, or guide you through rating your campus.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voicePlaybackEnabled, setVoicePlaybackEnabled] = useState(false);
  const stopListeningRef = useRef<(() => void) | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      if (stopListeningRef.current) {
        stopListeningRef.current();
      }
    };
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

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

      const assistantMsg: MessageItem = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: res.reply,
        toolCalls: res.tool_calls,
        structuredPayload: res.structured_payload,
        providerUsed: res.provider_used,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (voicePlaybackEnabled) {
        speakText(res.reply);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          role: "assistant",
          content:
            "I encountered a temporary connection issue. You can still browse and search colleges directly using the Explore view.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (stopListeningRef.current) {
        stopListeningRef.current();
        stopListeningRef.current = null;
      }
      setIsListening(false);
    } else {
      if (!isSpeechRecognitionSupported()) {
        alert("Speech recognition is not supported in this browser. Please use text input.");
        return;
      }
      setIsListening(true);
      const stopFn = startSpeechRecognition(
        (transcript, isFinal) => {
          setInput(transcript);
          if (isFinal) {
            setIsListening(false);
            handleSendMessage(transcript);
          }
        },
        () => {
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );
      stopListeningRef.current = stopFn;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-paper border-l border-warm-grey shadow-dropdown flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-warm-grey flex items-center justify-between bg-card">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-olive" />
          <h3 className="font-serif text-lg font-bold text-charcoal">Campus AI Assistant</h3>
          <span className="text-[10px] font-mono uppercase bg-warm-grey-light px-2 py-0.5 rounded text-charcoal-muted">
            Guardrailed
          </span>
        </div>

        <div className="flex items-center gap-1">
          {isSpeechSynthesisSupported() && (
            <button
              onClick={() => {
                const next = !voicePlaybackEnabled;
                setVoicePlaybackEnabled(next);
                if (!next) stopSpeaking();
              }}
              title={voicePlaybackEnabled ? "Mute spoken replies" : "Enable spoken replies"}
              className={`p-1.5 rounded transition-colors ${
                voicePlaybackEnabled
                  ? "text-olive bg-olive-light"
                  : "text-charcoal-muted hover:text-charcoal"
              }`}
            >
              {voicePlaybackEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="p-1.5 text-charcoal-muted hover:text-charcoal rounded hover:bg-warm-grey-light"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[90%] text-xs sm:text-sm p-3.5 rounded-lg leading-relaxed ${
                m.role === "user"
                  ? "bg-charcoal text-paper rounded-br-none"
                  : "bg-card border border-warm-grey text-charcoal rounded-bl-none shadow-subtle"
              }`}
            >
              <div className="whitespace-pre-line">{m.content}</div>

              {/* Render Structured UI Card if tool produced output */}
              {m.structuredPayload && (
                <div className="mt-3 pt-3 border-t border-warm-grey">
                  {/* College Search Results Card */}
                  {m.structuredPayload.type === "search_colleges" &&
                    m.structuredPayload.data?.colleges && (
                      <div className="space-y-2 mt-1">
                        <div className="text-[11px] font-mono text-charcoal-muted uppercase">
                          Found {m.structuredPayload.data.colleges.length} Match(es)
                        </div>
                        {m.structuredPayload.data.colleges.slice(0, 3).map((col: any) => (
                          <div
                            key={col.college_id}
                            onClick={() => {
                              onSelectCollege(col.college_id);
                              onClose();
                            }}
                            className="p-2.5 rounded border border-warm-grey bg-paper hover:border-olive cursor-pointer transition-colors flex items-center justify-between"
                          >
                            <div>
                              <div className="font-semibold text-xs text-charcoal flex items-center gap-1.5">
                                <span>{col.name}</span>
                                {col.is_demo && <DemoBadge />}
                              </div>
                              <div className="text-[11px] text-charcoal-muted">
                                {col.city}, {col.state} • {col.total_submitted_sessions} ratings
                              </div>
                            </div>
                            <ScoreBadge score={col.current_score} size="sm" />
                          </div>
                        ))}
                      </div>
                    )}

                  {/* College Summary Card */}
                  {m.structuredPayload.type === "get_college_summary" &&
                    m.structuredPayload.data?.college && (
                      <div className="p-3 rounded border border-warm-grey bg-paper mt-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-serif font-bold text-sm text-charcoal">
                              {m.structuredPayload.data.college.name}
                            </div>
                            <div className="text-[11px] text-charcoal-muted mt-0.5">
                              {m.structuredPayload.data.college.city},{" "}
                              {m.structuredPayload.data.college.state}
                            </div>
                          </div>
                          <ScoreBadge
                            score={m.structuredPayload.data.college.current_score}
                            size="sm"
                          />
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-warm-grey flex items-center justify-between text-xs">
                          <span className="text-charcoal-muted text-[11px]">
                            {m.structuredPayload.data.college.total_submitted_sessions} submitted ratings
                          </span>
                          <button
                            onClick={() => {
                              onSelectCollege(m.structuredPayload.data.college.college_id);
                              onClose();
                            }}
                            className="text-xs font-semibold text-olive hover:underline"
                          >
                            View Full Report →
                          </button>
                        </div>
                      </div>
                    )}

                  {/* Create College Confirmation Card */}
                  {m.structuredPayload.type === "create_unknown_college" &&
                    m.structuredPayload.data?.status === "confirmation_required" && (
                      <div className="p-3 rounded border border-warm-grey bg-olive-light/50 mt-1">
                        <div className="text-xs font-medium text-charcoal">
                          Confirmation Required:
                        </div>
                        <p className="text-xs text-charcoal-muted mt-1">
                          {m.structuredPayload.data.message}
                        </p>
                        <button
                          onClick={() =>
                            handleSendMessage(
                              `Yes, please confirm adding ${m.structuredPayload.data.details.name} in ${m.structuredPayload.data.details.city}, ${m.structuredPayload.data.details.state}`
                            )
                          }
                          className="mt-2.5 btn-primary text-xs w-full py-1.5"
                        >
                          Confirm & Add College
                        </button>
                      </div>
                    )}
                </div>
              )}
            </div>

            {m.providerUsed && (
              <span className="text-[10px] font-mono text-charcoal-muted mt-1 px-1">
                Via {m.providerUsed === "mock" ? "Platform Engine" : m.providerUsed}
              </span>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-charcoal-muted p-2">
            <span className="w-2 h-2 rounded-full bg-olive animate-ping" />
            <span>Consulting verified platform records...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 border-t border-warm-grey bg-paper flex items-center gap-1.5 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
        <button
          onClick={() => handleSendMessage("Search for SFIT")}
          className="px-2.5 py-1 rounded bg-card border border-warm-grey text-charcoal-muted hover:text-charcoal text-[11px]"
        >
          Search SFIT
        </button>
        <button
          onClick={() => handleSendMessage("What is the score of St. Jude Demo?")}
          className="px-2.5 py-1 rounded bg-card border border-warm-grey text-charcoal-muted hover:text-charcoal text-[11px]"
        >
          St. Jude Score
        </button>
        <button
          onClick={() => handleSendMessage("List rating parameters")}
          className="px-2.5 py-1 rounded bg-card border border-warm-grey text-charcoal-muted hover:text-charcoal text-[11px]"
        >
          Question Bank
        </button>
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-warm-grey bg-card">
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
              isListening ? "Listening... speak now" : "Ask about a college or rating..."
            }
            className="flex-1 px-3 py-2 text-xs sm:text-sm bg-paper border border-warm-grey rounded focus:outline-none focus:border-olive font-sans"
          />

          <button
            type="button"
            onClick={toggleListening}
            title={isListening ? "Stop listening" : "Speak with voice"}
            className={`p-2 rounded transition-colors ${
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
            className="btn-primary p-2 text-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
