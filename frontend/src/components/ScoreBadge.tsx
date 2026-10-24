import React from "react";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, size = "md" }) => {
  const delta = score - 100;
  const isPositive = delta > 0;
  const isNegative = delta < 0;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm font-semibold",
    lg: "px-3.5 py-1.5 text-base font-bold",
  };

  let deltaColorClass = "text-charcoal bg-warm-grey-light border-warm-grey";
  if (isPositive) {
    deltaColorClass = "text-[#1E513A] bg-[#EEF5F1] border-[#C2DDD0]";
  } else if (isNegative) {
    deltaColorClass = "text-[#872023] bg-[#FDF0F0] border-[#F2C4C5]";
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 font-mono border rounded-full ${sizeClasses[size]} ${deltaColorClass}`}
      title={`Official score: ${score} (Base 100)`}
    >
      <span>{score}</span>
      {delta !== 0 && (
        <span className="text-[10px] font-sans font-medium opacity-85">
          ({isPositive ? `+${delta}` : delta})
        </span>
      )}
    </div>
  );
};
