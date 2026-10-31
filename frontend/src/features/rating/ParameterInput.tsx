import React from "react";
import { EyeOff, Check } from "lucide-react";

interface ParameterInputProps {
  score: number | null;
  isNoView: boolean;
  onChange: (score: number | null, isNoView: boolean) => void;
  disabled?: boolean;
}

export const ParameterInput: React.FC<ParameterInputProps> = ({
  score,
  isNoView,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-6">
      {/* Editorial Large Score Indicator (Matches Reference Image 1 Screen 8) */}
      <div className="flex flex-col items-center justify-center py-3 my-1">
        {isNoView ? (
          <div className="text-center animate-in fade-in duration-150">
            <span className="inline-block px-3.5 py-1 rounded-full bg-olive-light text-olive font-mono text-sm font-bold uppercase tracking-wider mb-1 border border-olive/30">
              No View
            </span>
            <p className="text-xs text-charcoal-muted">Excluded from averages</p>
          </div>
        ) : score !== null ? (
          <div className="text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="font-serif text-5xl sm:text-6xl font-bold text-charcoal tracking-tight leading-none">
              {score}
            </div>
            <div className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-widest text-charcoal-muted mt-2">
              Out of 10
            </div>
          </div>
        ) : (
          <div className="text-center py-2 text-charcoal-muted/60">
            <div className="font-serif text-4xl sm:text-5xl font-bold tracking-tight leading-none text-warm-grey">
              —
            </div>
            <div className="text-[11px] sm:text-xs font-mono uppercase tracking-widest text-charcoal-muted mt-2">
              Tap a number to rate
            </div>
          </div>
        )}
      </div>

      {/* 1-10 Discrete Numeric Score Selector */}
      <div>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-2.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
            const isSelected = !isNoView && score === num;

            return (
              <button
                key={num}
                type="button"
                disabled={disabled}
                onClick={() => onChange(num, false)}
                className={`min-h-[48px] py-3 sm:py-3.5 rounded-xl font-mono font-bold text-base sm:text-lg transition-all border outline-none focus-visible:ring-2 focus-visible:ring-olive focus-visible:ring-offset-2 flex items-center justify-center touch-manipulation ${
                  isSelected
                    ? "bg-charcoal text-paper border-charcoal shadow-md scale-[1.04] ring-2 ring-charcoal/20"
                    : "bg-paper text-charcoal border-warm-grey hover:border-charcoal hover:bg-white active:scale-95"
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>

        {/* Endpoint Labels */}
        <div className="flex items-center justify-between text-[11px] text-charcoal-muted px-1 mt-2.5 font-medium">
          <span className="text-rose-800 font-semibold">1 (Poor)</span>
          <span className="hidden xs:inline text-[10px] uppercase tracking-wider font-mono text-charcoal-muted">
            1 to 10 Scale
          </span>
          <span className="text-emerald-800 font-semibold">10 (Excellent)</span>
        </div>
      </div>

      {/* Visually Distinct No View Option */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-warm-grey bg-warm-grey-light/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-charcoal flex items-center gap-1.5">
            <EyeOff className="w-3.5 h-3.5 text-charcoal-muted flex-shrink-0" />
            <span>Not Applicable to Your Experience?</span>
          </div>
          <p className="text-[11px] text-charcoal-muted mt-0.5 leading-relaxed">
            If you never lived in hostels, used specialized labs, or had placement interactions, select "No view". It is mathematically excluded from institutional averages.
          </p>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(null, true)}
          className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all border self-stretch sm:self-auto whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-olive ${
            isNoView
              ? "bg-olive text-paper border-olive shadow-sm ring-1 ring-olive font-bold"
              : "bg-card text-charcoal border-warm-grey hover:border-charcoal/40"
          }`}
        >
          {isNoView ? <Check className="w-4 h-4 text-white" /> : <EyeOff className="w-4 h-4" />}
          <span>{isNoView ? 'Marked as "No view"' : 'Mark as "No view"'}</span>
        </button>
      </div>
    </div>
  );
};
