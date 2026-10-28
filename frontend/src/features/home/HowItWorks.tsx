import React from "react";
import { ListFilter, ShieldCheck, Layers, EyeOff, ArrowRight } from "lucide-react";

interface HowItWorksProps {
  onExplore: () => void;
  onRate: () => void;
  onOpenScoringDemo?: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onExplore, onRate, onOpenScoringDemo }) => {
  return (
    <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-warm-grey">
      {/* Editorial Section Masthead */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 pb-4 border-b border-warm-grey gap-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-olive font-semibold">
            The Scoring Architecture
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal mt-1">
            How Campus Uncut Works
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-1 max-w-2xl font-sans">
            A deterministic, student-powered intelligence framework designed to prevent manipulation, fake reviews, and arbitrary ranking spikes.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <button onClick={onExplore} className="btn-secondary min-h-[40px] text-xs py-2 px-3.5 flex items-center justify-center">
            <span>Explore Directory</span>
          </button>
          <button onClick={onRate} className="btn-primary min-h-[40px] text-xs py-2 px-4 flex items-center justify-center gap-1.5">
            <span>Rate Your Campus</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4 Architectural Infographic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Step 1 */}
        <div className="editorial-card p-4 sm:p-6 bg-card flex flex-col justify-between border-t-2 border-t-charcoal">
          <div>
            <div className="w-10 h-10 rounded bg-warm-grey-light flex items-center justify-center text-charcoal mb-4">
              <ListFilter className="w-5 h-5 text-olive" />
            </div>
            <span className="font-mono text-[10px] text-olive uppercase font-bold tracking-wider">
              01 • Holistic Scope
            </span>
            <h3 className="font-serif text-xl font-bold text-charcoal mt-1 mb-2">
              25 Active Parameters
            </h3>
            <p className="text-xs text-charcoal-muted leading-relaxed font-sans">
              From mess hygiene and hostel maintenance to ragging prevention, library access, and placement transparency. Every aspect of student life is measured on an explicit 1–10 scale.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-warm-grey font-mono text-[11px] text-charcoal-muted">
            5 Core Categories
          </div>
        </div>

        {/* Step 2 */}
        <div className="editorial-card p-4 sm:p-6 bg-card flex flex-col justify-between border-t-2 border-t-olive">
          <div>
            <div className="w-10 h-10 rounded bg-olive-light flex items-center justify-center text-olive mb-4">
              <ShieldCheck className="w-5 h-5 text-olive" />
            </div>
            <span className="font-mono text-[10px] text-olive uppercase font-bold tracking-wider">
              02 • Universal Baseline
            </span>
            <h3 className="font-serif text-xl font-bold text-charcoal mt-1 mb-2">
              100 Base Score
            </h3>
            <p className="text-xs text-charcoal-muted leading-relaxed font-sans">
              Every institution begins at baseline 100 with zero ratings. No pre-seeded reputation bias or commercial sponsorship can inflate a college’s initial score.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-warm-grey font-mono text-[11px] text-charcoal-muted">
            Neutral Starting Point
          </div>
        </div>

        {/* Step 3 */}
        <div className="editorial-card p-4 sm:p-6 bg-card flex flex-col justify-between border-t-2 border-t-terracotta">
          <div>
            <div className="w-10 h-10 rounded bg-terracotta-light flex items-center justify-center text-terracotta mb-4">
              <Layers className="w-5 h-5 text-terracotta" />
            </div>
            <span className="font-mono text-[10px] text-terracotta uppercase font-bold tracking-wider">
              03 • Anti-Spam Thresholds
            </span>
            <h3 className="font-serif text-xl font-bold text-charcoal mt-1 mb-2">
              20-Rating Blocks
            </h3>
            <p className="text-xs text-charcoal-muted leading-relaxed font-sans">
              Individual ratings never move the score immediately. The official score adjusts by exactly +1 or -1 point only when a verified threshold block of 20 student submissions is completed.
            </p>
            {onOpenScoringDemo && (
              <button
                onClick={onOpenScoringDemo}
                className="mt-2 text-[11px] font-semibold text-terracotta hover:underline inline-flex items-center gap-1"
              >
                <span>Test in Scoring Demo (PICT &amp; VJTI) &rarr;</span>
              </button>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-warm-grey font-mono text-[11px] text-charcoal-muted">
            Deterministic Engine
          </div>
        </div>

        {/* Step 4 */}
        <div className="editorial-card p-4 sm:p-6 bg-card flex flex-col justify-between border-t-2 border-t-charcoal">
          <div>
            <div className="w-10 h-10 rounded bg-warm-grey-light flex items-center justify-center text-charcoal mb-4">
              <EyeOff className="w-5 h-5 text-charcoal-muted" />
            </div>
            <span className="font-mono text-[10px] text-olive uppercase font-bold tracking-wider">
              04 • Fair Evaluation
            </span>
            <h3 className="font-serif text-xl font-bold text-charcoal mt-1 mb-2">
              No-View Neutrality
            </h3>
            <p className="text-xs text-charcoal-muted leading-relaxed font-sans">
              Day scholars who don’t live in hostels or students unfamiliar with lab equipment can select "No view". These are excluded from numerical averages, preventing distortion.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-warm-grey font-mono text-[11px] text-charcoal-muted">
            Zero-Score Avoidance
          </div>
        </div>
      </div>
    </section>
  );
};
