import React from "react";
import { AlertCircle } from "lucide-react";

export const NoticeBanner: React.FC = () => {
  return (
    <aside aria-label="Prototype verification notice" className="bg-warm-grey-light border-b border-warm-grey text-charcoal py-2 px-3 sm:px-4 text-[11px] sm:text-xs font-medium">
      <div className="max-w-7xl mx-auto flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-olive flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            <strong className="font-semibold">Prototype Notice:</strong> Student and alumni affiliations are self-declared and unverified. All college scores begin at 100 and update via deterministic threshold blocks.
          </span>
        </div>
        <span className="hidden lg:inline-block text-charcoal-muted uppercase tracking-wider text-[10px] font-mono shrink-0">
          Phase 4 Verified
        </span>
      </div>
    </aside>
  );
};
