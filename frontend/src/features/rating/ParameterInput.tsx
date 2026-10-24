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
      {/* 1-10 Discrete Numeric Score Selector */}
      <div>
        <div className="flex items-center justify-between text-xs text-charcoal-muted mb-3 font-mono">
          <span className="text-rose-800 font-semibold">1 = Severe Deficit</span>
          <span className="font-sans font-medium text-charcoal uppercase tracking-wider text-[11px]">
            Rate from 1 to 10
          </span>
          <span className="text-emerald-800 font-semibold">10 = Exemplary</span>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
            const isSelected = !isNoView && score === num;

            // Visual accent based on score tier
            let selectedColorClasses = "bg-charcoal text-paper border-charcoal shadow-md scale-[1.04]";
            if (num <= 3) {
              selectedColorClasses = "bg-rose-900 text-white border-rose-950 shadow-md scale-[1.04]";
            } else if (num >= 8) {
              selectedColorClasses = "bg-emerald-900 text-white border-emerald-950 shadow-md scale-[1.04]";
            }

            return (
              <button
                key={num}
                type="button"
                disabled={disabled}
                onClick={() => onChange(num, false)}
                className={`py-3.5 sm:py-4 rounded font-mono font-bold text-base transition-all border outline-none focus-visible:ring-2 focus-visible:ring-olive focus-visible:ring-offset-2 ${
                  isSelected
                    ? selectedColorClasses
                    : "bg-paper text-charcoal border-warm-grey hover:border-charcoal hover:bg-white"
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>
      </div>

      {/* Visually Distinct No View Option */}
      <div className="p-4 rounded border border-warm-grey bg-warm-grey-light/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-charcoal flex items-center gap-1.5">
            <EyeOff className="w-3.5 h-3.5 text-charcoal-muted" />
            <span>Not Applicable to Your Experience?</span>
          </div>
          <p className="text-[11px] text-charcoal-muted mt-0.5">
            If you never lived in hostels, used laboratory facilities, or had placement interactions, select "No view". It is mathematically excluded from institutional averages.
          </p>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(null, true)}
          className={`px-4 py-2 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-all border self-start sm:self-auto whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-olive ${
            isNoView
              ? "bg-olive text-paper border-olive shadow-sm ring-1 ring-olive"
              : "bg-card text-charcoal-muted border-warm-grey hover:text-charcoal hover:border-charcoal/40"
          }`}
        >
          {isNoView ? <Check className="w-4 h-4 text-white" /> : <EyeOff className="w-4 h-4" />}
          <span>{isNoView ? 'Marked as "No view"' : 'Mark as "No view"'}</span>
        </button>
      </div>
    </div>
  );
};
