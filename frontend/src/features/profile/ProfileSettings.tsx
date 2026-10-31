import React from "react";
import {
  ShieldCheck,
  FileText,
  FlaskConical,
  MessageSquareQuote,
  Compass,
  Mail,
  ChevronRight,
  ArrowLeftRight,
  Sparkles,
} from "lucide-react";

interface ProfileSettingsProps {
  onNavigate: (view: string, data?: any) => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ onNavigate }) => {
  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-xl mx-auto font-sans text-charcoal pb-28 md:pb-12">
      {/* Profile Identity Card */}
      <div className="editorial-card p-6 bg-card border border-warm-grey rounded-2xl shadow-card mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-charcoal text-paper font-serif font-bold text-2xl flex items-center justify-center border-2 border-warm-grey shrink-0 shadow-subtle">
            CU
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-charcoal truncate">
              Campus Uncut Contributor
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-olive font-medium mt-0.5">
              <ShieldCheck className="w-4 h-4 text-olive shrink-0" />
              <span>Campus Contributor</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-charcoal-muted mt-4 pt-4 border-t border-warm-grey leading-relaxed">
          Campus Uncut is a public, zero-cost intelligence platform dedicated to surfacing authentic student experiences.
          No account registration, phone numbers, or passwords are required to explore or contribute ratings.
        </p>
      </div>

      {/* User-Relevant Navigation & Settings */}
      <div className="editorial-card overflow-hidden bg-card border border-warm-grey rounded-2xl shadow-card mb-6">
        <div className="px-5 py-4 border-b border-warm-grey bg-warm-grey-light/30">
          <h2 className="font-serif text-base font-bold text-charcoal">
            Settings &amp; Navigation
          </h2>
        </div>

        <div className="divide-y divide-warm-grey">
          <button
            type="button"
            onClick={() => onNavigate("colleges")}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-warm-grey-light/50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-warm-grey-light flex items-center justify-center text-charcoal shrink-0">
                <MessageSquareQuote className="w-4 h-4 text-terracotta" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-semibold text-charcoal block group-hover:text-terracotta transition-colors">
                  Rate an Institution
                </span>
                <span className="text-[11px] text-charcoal-muted block">
                  Contribute your experience using text or hands-free voice
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-charcoal-muted group-hover:text-charcoal transition-colors shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate("match")}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-warm-grey-light/50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-warm-grey-light flex items-center justify-center text-charcoal shrink-0">
                <Compass className="w-4 h-4 text-olive" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-semibold text-charcoal block group-hover:text-olive transition-colors">
                  Find My Fit (Match Engine)
                </span>
                <span className="text-[11px] text-charcoal-muted block">
                  Customize priority weights across academics, placements, and campus life
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-charcoal-muted group-hover:text-charcoal transition-colors shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate("colleges")}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-warm-grey-light/50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-warm-grey-light flex items-center justify-center text-charcoal shrink-0">
                <ArrowLeftRight className="w-4 h-4 text-olive" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-semibold text-charcoal block group-hover:text-charcoal transition-colors">
                  Compare Colleges
                </span>
                <span className="text-[11px] text-charcoal-muted block">
                  Side-by-side criteria benchmarking
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-charcoal-muted group-hover:text-charcoal transition-colors shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate("scoring_demo")}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-warm-grey-light/50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-warm-grey-light flex items-center justify-center text-charcoal shrink-0">
                <FlaskConical className="w-4 h-4 text-olive" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-semibold text-charcoal block group-hover:text-charcoal transition-colors">
                  Isolated Scoring Demo
                </span>
                <span className="text-[11px] text-charcoal-muted block">
                  Explore how 20-vote blocks deterministically update college scores
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-charcoal-muted group-hover:text-charcoal transition-colors shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate("privacy_policy")}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-warm-grey-light/50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-warm-grey-light flex items-center justify-center text-charcoal shrink-0">
                <FileText className="w-4 h-4 text-olive" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-semibold text-charcoal block group-hover:text-charcoal transition-colors">
                  Privacy Policy &amp; Data Rights
                </span>
                <span className="text-[11px] text-charcoal-muted block">
                  Disclosures regarding self-declared affiliations and AI safety reporting
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-charcoal-muted group-hover:text-charcoal transition-colors shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate("onboarding")}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-warm-grey-light/50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-warm-grey-light flex items-center justify-center text-charcoal shrink-0">
                <Sparkles className="w-4 h-4 text-olive" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-semibold text-charcoal block group-hover:text-charcoal transition-colors">
                  Welcome Tour &amp; Onboarding
                </span>
                <span className="text-[11px] text-charcoal-muted block">
                  Revisit the editorial guide to Campus Uncut
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-charcoal-muted group-hover:text-charcoal transition-colors shrink-0" />
          </button>

          <a
            href="mailto:mathew.maxwell2021@gmail.com"
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-warm-grey-light/50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-warm-grey-light flex items-center justify-center text-charcoal shrink-0">
                <Mail className="w-4 h-4 text-charcoal-muted group-hover:text-charcoal" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-semibold text-charcoal block">
                  Help &amp; Feedback
                </span>
                <span className="text-[11px] text-charcoal-muted block">
                  Contact development and institutional moderation
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-charcoal-muted group-hover:text-charcoal transition-colors shrink-0" />
          </a>
        </div>
      </div>

      {/* App Identity & Support Footer */}
      <div className="text-center pt-2 pb-6 text-xs text-charcoal-muted space-y-2">
        <div className="font-serif italic text-charcoal-muted">
          College life. Without the editing.
        </div>
        <div className="font-mono text-[11px]">
          Campus Uncut v1.0 • Android
        </div>
        <div className="font-mono text-[11px]">
          <a
            href="mailto:mathew.maxwell2021@gmail.com"
            className="text-olive hover:underline inline-flex items-center gap-1"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>mathew.maxwell2021@gmail.com</span>
          </a>
        </div>
      </div>
    </div>
  );
};
