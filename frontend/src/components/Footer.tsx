import React from "react";
import { ShieldCheck, HeartHandshake, Database } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-warm-grey bg-paper text-charcoal py-12 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div>
          <h4 className="font-serif text-lg font-bold mb-2">Campus Uncut</h4>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            A public, zero-cost intelligence platform dedicated to surfacing lived experiences behind the official college brochure.
          </p>
        </div>

        <div>
          <h4 className="font-sans text-xs uppercase tracking-wider font-semibold text-charcoal mb-3">
            Core Principles
          </h4>
          <ul className="text-xs text-charcoal-muted space-y-2">
            <li className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-olive flex-shrink-0" />
              <span>Affiliations are explicitly self-declared and unverified.</span>
            </li>
            <li className="flex items-center gap-2">
              <HeartHandshake className="w-3.5 h-3.5 text-olive flex-shrink-0" />
              <span>Official college scores start at 100 with zero reviews.</span>
            </li>
            <li className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-olive flex-shrink-0" />
              <span>AI assists intent; backend code validates every calculation.</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-sans text-xs uppercase tracking-wider font-semibold text-charcoal mb-3">
            Scoring Transparency
          </h4>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            A college score begins at 100. Each qualifying respondent contributes once. Each completed block of 20 low contributions drops the score by 1; each completed block of 20 high contributions raises it by 1.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-warm-grey flex flex-col sm:flex-row items-center justify-between text-[11px] text-charcoal-muted gap-2 font-mono">
        <div>Campus Uncut © 2026. Built on an uncompromised ₹0 development budget.</div>
        <div>FastAPI • Supabase PostgreSQL • React Vite</div>
      </div>
    </footer>
  );
};
