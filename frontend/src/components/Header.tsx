import React, { useEffect, useState } from "react";
import { BookOpen, Sparkles, MessageSquareQuote, PlusCircle } from "lucide-react";
import { api } from "../lib/api";

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, data?: any) => void;
  onOpenUnknownModal: () => void;
  onToggleAssistant: () => void;
  isAssistantOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenUnknownModal,
  onToggleAssistant,
  isAssistantOpen,
}) => {
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "disconnected">("checking");

  useEffect(() => {
    let mounted = true;
    api
      .checkHealth()
      .then((res) => {
        if (mounted) {
          setDbStatus(res.db === "connected" ? "connected" : "disconnected");
        }
      })
      .catch(() => {
        if (mounted) setDbStatus("disconnected");
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <header className="border-b border-warm-grey bg-paper sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo & Tagline */}
          <div
            className="cursor-pointer group flex items-baseline gap-3"
            onClick={() => onNavigate("home")}
          >
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-charcoal">
                Campus Uncut
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-olive self-center" />
            </div>
            <span className="hidden sm:inline-block text-xs text-charcoal-muted font-serif italic border-l border-warm-grey pl-3">
              College life. Without the editing.
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => onNavigate("colleges")}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded transition-colors flex items-center gap-1.5 ${
                currentView === "colleges"
                  ? "bg-warm-grey text-charcoal"
                  : "text-charcoal hover:bg-warm-grey-light"
              }`}
            >
              <BookOpen className="w-4 h-4 text-charcoal-muted" />
              <span>Explore Colleges</span>
            </button>

            <button
              onClick={() => onNavigate("rate")}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded transition-colors flex items-center gap-1.5 ${
                currentView === "rate"
                  ? "bg-warm-grey text-charcoal"
                  : "text-charcoal hover:bg-warm-grey-light"
              }`}
            >
              <MessageSquareQuote className="w-4 h-4 text-olive" />
              <span>Rate a College</span>
            </button>

            <button
              onClick={onOpenUnknownModal}
              title="Add an unlisted institution"
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-charcoal-muted hover:text-charcoal rounded hover:bg-warm-grey-light transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add College</span>
            </button>

            {/* Assistant Trigger Button */}
            <button
              onClick={onToggleAssistant}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded transition-all flex items-center gap-1.5 border ${
                isAssistantOpen
                  ? "bg-charcoal text-paper border-charcoal shadow-sm"
                  : "bg-paper text-charcoal border-warm-grey hover:border-olive hover:bg-warm-grey-light"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-olive" />
              <span className="hidden xs:inline">Assistant</span>
            </button>

            {/* Database Connectivity Indicator */}
            <div
              className="hidden md:flex items-center gap-1.5 pl-3 border-l border-warm-grey text-[11px] font-mono text-charcoal-muted"
              title={`PostgreSQL state: ${dbStatus}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  dbStatus === "connected"
                    ? "bg-emerald-600"
                    : dbStatus === "checking"
                    ? "bg-amber-500 animate-pulse"
                    : "bg-rose-500"
                }`}
              />
              <span className="capitalize">{dbStatus}</span>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};
