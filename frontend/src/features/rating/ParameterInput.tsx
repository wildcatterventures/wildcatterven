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
    <div className="space-y-4">
      {/* 1-10 Discrete Numeric Score Selector */}
      <div>
        <div className="flex items-center justify-between text-xs text-charcoal-muted mb-2 font-mono">
          <span>1 = Very Poor</span>
          <span className="font-sans font-medium text-charcoal">Select 1 to 10:</span>
          <span>10 = Outstanding / Zero Harm</span>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
            const isSelected = !isNoView && score === num;
            return (
              <button
                key={num}
                type="button"
                disabled={disabled}
                onClick={() => onChange(num, false)}
                className={`py-3 rounded font-mono font-bold text-sm sm:text-base transition-all border ${
                  isSelected
                    ? "bg-charcoal text-paper border-charcoal shadow-sm scale-[1.02]"
                    : "bg-paper text-charcoal border-warm-grey hover:border-olive hover:bg-warm-grey-light"
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>
      </div>

      {/* Explicit No View Option */}
      <div className="pt-2 flex items-center justify-between border-t border-warm-grey/60">
        <span className="text-xs text-charcoal-muted font-sans">
          Haven't used or experienced this facility?
        </span>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(null, true)}
          className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all border ${
            isNoView
              ? "bg-olive text-paper border-olive shadow-sm"
              : "bg-paper text-charcoal-muted border-warm-grey hover:text-charcoal hover:border-charcoal/40"
          }`}
        >
          {isNoView ? <Check className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>Mark as "No view"</span>
        </button>
      </div>
    </div>
  );
};
