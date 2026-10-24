import React from "react";
import { FlaskConical } from "lucide-react";

interface DemoBadgeProps {
  className?: string;
}

export const DemoBadge: React.FC<DemoBadgeProps> = ({ className = "" }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono tracking-wider uppercase font-semibold text-charcoal-muted bg-warm-grey-light border border-dashed border-warm-grey-dark rounded-full ${className}`}
      title="Simulated demonstration institution. Seeded to test threshold score changes (100 -> 99 or 100 -> 101)."
    >
      <FlaskConical className="w-3 h-3 text-olive" />
      <span>Simulated Demo</span>
    </span>
  );
};
