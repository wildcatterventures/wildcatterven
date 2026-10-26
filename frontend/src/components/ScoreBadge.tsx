import React from "react";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  size = "md",
  showLabel = false,
}) => {
  const delta = score - 100;
  const isPositive = delta > 0;
  const isNegative = delta < 0;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-bold",
    md: "px-2.5 py-1 text-sm font-bold",
    lg: "px-3.5 py-1.5 text-base font-extrabold",
    xl: "px-4 py-2 text-2xl font-black",
  };

  let deltaColorClass = "text-paper bg-charcoal border-charcoal/80 shadow-xs";
  if (isPositive) {
    deltaColorClass = "text-emerald-950 bg-emerald-100 border-emerald-400 font-extrabold shadow-xs";
  } else if (isNegative) {
    deltaColorClass = "text-rose-950 bg-rose-100 border-rose-400 font-extrabold shadow-xs";
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 font-mono border rounded ${sizeClasses[size]} ${deltaColorClass}`}
      title={`Official score: ${score} (Base 100)`}
    >
      {showLabel && (
        <span className="text-[10px] uppercase tracking-wider opacity-80 font-sans">
          SCORE
        </span>
      )}
      <span>{score}</span>
      {delta !== 0 ? (
        <span
          className={`text-[10px] font-sans font-bold ${
            isPositive ? "text-emerald-700" : "text-rose-700"
          }`}
        >
          ({isPositive ? `+${delta}` : delta})
        </span>
      ) : (
        <span className="text-[9px] font-sans uppercase tracking-wider opacity-80 font-normal">
          Base
        </span>
      )}
    </div>
  );
};

