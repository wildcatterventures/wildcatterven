import React from "react";
import { FlaskConical } from "lucide-react";

interface DemoBadgeProps {
  className?: string;
  showFullExplanation?: boolean;
}

export const DemoBadge: React.FC<DemoBadgeProps> = ({
  className = "",
  showFullExplanation = false,
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] sm:text-[11px] font-mono tracking-wider uppercase font-bold text-amber-900 bg-amber-50 border border-dashed border-amber-300 rounded shadow-subtle ${className}`}
      title="Simulated demonstration institution. Seeded to test threshold score changes (100 -> 99 or 100 -> 101). Never mixed into real university aggregates."
    >
      <FlaskConical className="w-3 h-3 text-amber-700 flex-shrink-0" />
      <span>Simulated Demo</span>
      {showFullExplanation && (
        <span className="hidden md:inline font-normal text-amber-800 lowercase">
          (threshold test)
        </span>
      )}
    </span>
  );
};
