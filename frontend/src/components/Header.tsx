import React, { useEffect, useState } from "react";
import {
  BookOpen,
  Sparkles,
  MessageSquareQuote,
  PlusCircle,
  Menu,
  X,
  Home,
  Compass,
  Trophy,
  Users,
  ShieldCheck,
  FlaskConical,
  User,
} from "lucide-react";
import { api, isBackendHealthy } from "../lib/api";
import { BrandLogo } from "./BrandLogo";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    api
      .checkHealth()
      .then((res) => {
        if (mounted) {
          setDbStatus(isBackendHealthy(res) ? "connected" : "disconnected");
        }
      })
      .catch(() => {
        if (mounted) setDbStatus("disconnected");
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const handleNavClick = (view: string, data?: any) => {
    setIsMobileMenuOpen(false);
    onNavigate(view, data);
  };

  return (
    <>
      <header className="border-b border-warm-grey bg-paper sticky top-0 z-40 pt-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
            {/* Desktop Brand Logo (>= md) */}
            <div className="hidden md:flex items-center">
              <BrandLogo
                variant="full"
                size="md"
                onClick={() => handleNavClick("home")}
              />
            </div>

            {/* Mobile Brand Identity (< md) — Consistent Campus Uncut Branding */}
            <div className="flex md:hidden items-center">
              <BrandLogo
                variant="compact"
                size="sm"
                onClick={() => handleNavClick("home")}
              />
            </div>

            {/* Desktop Navigation (>= md: 768px) */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2 xl:gap-2.5">
              {/* 1. Colleges */}
              <button
                onClick={() => handleNavClick("colleges")}
                className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  currentView === "colleges"
                    ? "bg-warm-grey text-charcoal font-semibold"
                    : "text-charcoal hover:bg-warm-grey-light"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-charcoal-muted shrink-0" />
                <span className="whitespace-nowrap">Colleges</span>
              </button>

              {/* 2. Rate Campus */}
              <button
                onClick={() => handleNavClick("rate")}
                className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  currentView === "rate"
                    ? "bg-warm-grey text-charcoal font-semibold"
                    : "text-charcoal hover:bg-warm-grey-light"
                }`}
              >
                <MessageSquareQuote className="w-3.5 h-3.5 text-olive shrink-0" />
                <span className="whitespace-nowrap">Rate Campus</span>
              </button>

              {/* 3. Find My Fit */}
              <button
                onClick={() => handleNavClick("match")}
                className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  currentView === "match"
                    ? "bg-warm-grey text-charcoal font-semibold"
                    : "text-charcoal hover:bg-warm-grey-light"
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-olive shrink-0" />
                <span className="whitespace-nowrap">Find My Fit</span>
              </button>

              {/* 4. Leaderboard */}
              <button
                onClick={() => handleNavClick("leaderboard")}
                className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  currentView === "leaderboard"
                    ? "bg-warm-grey text-charcoal font-semibold"
                    : "text-charcoal hover:bg-warm-grey-light"
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-charcoal-muted shrink-0" />
                <span className="whitespace-nowrap">Leaderboard</span>
              </button>

              {/* 5. Campus Circle */}
              <button
                onClick={() => handleNavClick("community")}
                className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  currentView === "community"
                    ? "bg-warm-grey text-charcoal font-semibold"
                    : "text-charcoal hover:bg-warm-grey-light"
                }`}
              >
                <Users className="w-3.5 h-3.5 text-charcoal-muted shrink-0" />
                <span className="whitespace-nowrap">Campus Circle</span>
              </button>

              {/* 6. Add College (xl screens) */}
              <button
                onClick={onOpenUnknownModal}
                title="Add an unlisted institution"
                className="hidden xl:flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-charcoal-muted hover:text-charcoal rounded hover:bg-warm-grey-light transition-colors whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">Add College</span>
              </button>

              {/* Assistant Trigger Button */}
              <button
                onClick={onToggleAssistant}
                aria-label="Toggle Campus Intelligence Assistant"
                className={`px-2.5 py-1.5 text-xs font-medium rounded transition-all flex items-center gap-1.5 border whitespace-nowrap ${
                  isAssistantOpen
                    ? "bg-charcoal text-paper border-charcoal shadow-sm"
                    : "bg-paper text-charcoal border-warm-grey hover:border-olive hover:bg-warm-grey-light"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-terracotta shrink-0" />
                <span className="whitespace-nowrap">Assistant</span>
              </button>

              {/* Database Connectivity Indicator */}
              <div
                className="flex items-center gap-1.5 pl-2 border-l border-warm-grey text-[11px] font-mono text-charcoal-muted shrink-0 whitespace-nowrap"
                title={`PostgreSQL state: ${dbStatus}`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    dbStatus === "connected"
                      ? "bg-emerald-600"
                      : dbStatus === "checking"
                      ? "bg-amber-500 animate-pulse"
                      : "bg-rose-500"
                  }`}
                />
                <span className="capitalize hidden xl:inline whitespace-nowrap">{dbStatus}</span>
              </div>
            </nav>

            {/* Mobile Actions (< md: 768px) */}
            <div className="flex md:hidden items-center gap-2">
              {/* Mobile Database Status Indicator */}
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-warm-grey-light/80 border border-warm-grey text-[10px] font-mono text-charcoal-muted"
                title={`Backend: ${dbStatus}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    dbStatus === "connected"
                      ? "bg-emerald-600"
                      : dbStatus === "checking"
                      ? "bg-amber-500 animate-pulse"
                      : "bg-rose-500"
                  }`}
                />
                <span className="capitalize text-[10px]">{dbStatus === "connected" ? "Live" : dbStatus}</span>
              </div>

              {/* Secondary Menu Drawer Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
                className="w-10 h-10 flex items-center justify-center rounded-md border border-warm-grey text-charcoal hover:bg-warm-grey-light focus:outline-none focus-visible:ring-2 focus-visible:ring-olive transition-colors touch-manipulation"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer / Slide-Over Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col">
          {/* Backdrop Scrim */}
          <div
            className="fixed inset-0 bg-charcoal/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
            className="relative bg-paper border-b border-warm-grey shadow-dropdown px-5 py-6 flex flex-col max-h-[85vh] overflow-y-auto animate-in slide-in-from-top duration-200 pt-safe"
          >
            {/* Drawer Top Header */}
            <div className="flex items-center justify-between pb-4 border-b border-warm-grey mb-4">
              <BrandLogo variant="compact" size="sm" onClick={() => handleNavClick("home")} />

              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-charcoal-muted hover:text-charcoal rounded-md hover:bg-warm-grey-light transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Navigation Links */}
            <nav className="flex flex-col space-y-1 font-sans">
              <button
                onClick={() => handleNavClick("home")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors text-left min-h-[44px] ${
                  currentView === "home"
                    ? "bg-warm-grey text-charcoal font-semibold"
                    : "text-charcoal hover:bg-warm-grey-light"
                }`}
              >
                <Home className="w-4 h-4 text-charcoal-muted" />
                <span>Home</span>
              </button>

              <button
                onClick={() => handleNavClick("colleges")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors text-left min-h-[44px] ${
                  currentView === "colleges"
                    ? "bg-warm-grey text-charcoal font-semibold"
                    : "text-charcoal hover:bg-warm-grey-light"
                }`}
              >
                <BookOpen className="w-4 h-4 text-charcoal-muted" />
                <span>Explore Colleges</span>
              </button>

              <button
                onClick={() => handleNavClick("rate")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors text-left min-h-[44px] ${
                  currentView === "rate"
                    ? "bg-warm-grey text-charcoal font-semibold"
                    : "text-charcoal hover:bg-warm-grey-light"
                }`}
              >
                <MessageSquareQuote className="w-4 h-4 text-terracotta" />
                <span>Rate a College</span>
              </button>

              <button
                onClick={() => handleNavClick("match")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors text-left min-h-[44px] ${
                  currentView === "match"
                    ? "bg-warm-grey text-charcoal font-semibold"
                    : "text-charcoal hover:bg-warm-grey-light"
                }`}
              >
                <Compass className="w-4 h-4 text-olive" />
                <span>Find My Fit (Match Engine)</span>
              </button>

              <button
                onClick={() => handleNavClick("leaderboard")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors text-left min-h-[44px] ${
                  currentView === "leaderboard"
                    ? "bg-warm-grey text-charcoal font-semibold"
                    : "text-charcoal hover:bg-warm-grey-light"
                }`}
              >
                <Trophy className="w-4 h-4 text-charcoal-muted" />
                <span>Leaderboard (20+ Responses)</span>
              </button>

              <button
                onClick={() => handleNavClick("community")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors text-left min-h-[44px] ${
                  currentView === "community"
                    ? "bg-warm-grey text-charcoal font-semibold"
                    : "text-charcoal hover:bg-warm-grey-light"
                }`}
              >
                <Users className="w-4 h-4 text-charcoal-muted" />
                <span>Campus Circle (Community)</span>
              </button>

              <button
                onClick={() => handleNavClick("profile")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors text-left min-h-[44px] ${
                  currentView === "profile"
                    ? "bg-warm-grey text-charcoal font-semibold"
                    : "text-charcoal hover:bg-warm-grey-light"
                }`}
              >
                <User className="w-4 h-4 text-charcoal-muted" />
                <span>Profile &amp; Settings</span>
              </button>
            </nav>

            {/* Special Section: Actions & Utilities */}
            <div className="pt-4 mt-3 border-t border-warm-grey space-y-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenUnknownModal();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium text-charcoal-muted hover:text-charcoal hover:bg-warm-grey-light transition-colors text-left min-h-[44px]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Unlisted College</span>
              </button>

              <button
                onClick={() => handleNavClick("scoring_demo")}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-xs font-medium text-olive hover:text-charcoal hover:bg-warm-grey-light transition-colors text-left min-h-[44px]"
              >
                <FlaskConical className="w-4 h-4" />
                <span>Isolated Scoring Demo (PICT &amp; VJTI)</span>
              </button>

              <button
                onClick={() => handleNavClick("privacy_policy")}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-xs font-medium text-charcoal-muted hover:text-charcoal hover:bg-warm-grey-light transition-colors text-left min-h-[44px]"
              >
                <ShieldCheck className="w-4 h-4 text-olive" />
                <span>Privacy Policy &amp; Data Rights</span>
              </button>
            </div>

            {/* Bottom Status Info */}
            <div className="mt-4 pt-4 border-t border-warm-grey flex items-center justify-between text-xs text-charcoal-muted font-mono">
              <span className="text-[11px]">Database Connectivity</span>
              <div className="flex items-center gap-1.5">
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
            </div>
          </div>
        </div>
      )}
    </>
  );
};
