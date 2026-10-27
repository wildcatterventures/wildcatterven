import React, { useState } from "react";
import { AlertCircle, X } from "lucide-react";

export const NoticeBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <aside aria-label="Prototype verification notice" className="bg-warm-grey-light border-b border-warm-grey text-charcoal py-1.5 sm:py-2 px-3 sm:px-4 text-[11px] sm:text-xs font-medium">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <AlertCircle className="w-3.5 h-3.5 text-olive shrink-0" />
          <span className="leading-snug truncate sm:whitespace-normal">
            <strong className="font-semibold">Notice:</strong>{" "}
            <span className="sm:hidden">Student reviews self-declared. Baseline 100 with 20-rating blocks.</span>
            <span className="hidden sm:inline">Student and alumni affiliations are self-declared and unverified. All college scores begin at 100 and update via deterministic threshold blocks.</span>
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden lg:inline-block text-charcoal-muted uppercase tracking-wider text-[10px] font-mono">
            Phase 4 Verified
          </span>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 rounded text-charcoal-muted hover:text-charcoal hover:bg-warm-grey transition-colors"
            aria-label="Dismiss prototype notice"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

