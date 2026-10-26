import React from "react";
import { MessageSquareQuote, Bot, ArrowUpRight, GraduationCap, Building2, Briefcase } from "lucide-react";
import type { CollegeDetail as CollegeDetailType } from "../../../types/college";

interface CollegeActionFooterProps {
  college: CollegeDetailType;
  onRate: (collegeId: string) => void;
  onScrollToSection: (sectionId: string) => void;
  onAskAssistant?: (query?: string) => void;
}

export const CollegeActionFooter: React.FC<CollegeActionFooterProps> = ({
  college,
  onRate,
  onScrollToSection,
  onAskAssistant,
}) => {
  return (
    <section className="mb-14">
      <div className="editorial-card p-6 sm:p-8 bg-card border-warm-grey shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-warm-grey pb-5 mb-6 gap-4">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-olive font-semibold">
              Decision Support & Next Steps
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal mt-1">
              Take Action on {college.name}
            </h2>
            <p className="text-xs text-charcoal-muted mt-1 font-sans">
              Navigate verified sections, contribute student experience, or interrogate our assistant with specific questions.
            </p>
          </div>

          <button
            onClick={() => onRate(college.college_id)}
            className="btn-primary text-xs py-2.5 px-6 font-semibold flex items-center justify-center gap-2 self-start md:self-auto shadow-xs whitespace-nowrap"
          >
            <MessageSquareQuote className="w-4 h-4 text-paper" />
            <span>Rate This College</span>
          </button>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Action 1: Academics */}
          <button
            onClick={() => onScrollToSection("academics")}
            className="p-4 rounded-md border border-warm-grey bg-paper/50 hover:bg-card hover:border-charcoal/50 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <GraduationCap className="w-4 h-4 text-olive" />
              <ArrowUpRight className="w-3.5 h-3.5 text-charcoal-muted group-hover:text-charcoal group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <h3 className="font-serif text-sm font-bold text-charcoal">
              Explore Academics
            </h3>
            <p className="text-[11px] text-charcoal-muted font-sans mt-1">
              Review faculty quality, laboratory facilities, and curriculum freedom.
            </p>
          </button>

          {/* Action 2: Infrastructure */}
          <button
            onClick={() => onScrollToSection("infrastructure")}
            className="p-4 rounded-md border border-warm-grey bg-paper/50 hover:bg-card hover:border-charcoal/50 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-4 h-4 text-olive" />
              <ArrowUpRight className="w-3.5 h-3.5 text-charcoal-muted group-hover:text-charcoal group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <h3 className="font-serif text-sm font-bold text-charcoal">
              Explore Campus Life & Hostels
            </h3>
            <p className="text-[11px] text-charcoal-muted font-sans mt-1">
              Check hostel conditions, Wi-Fi connectivity, mess food, and safety.
            </p>
          </button>

          {/* Action 3: Recruiters */}
          <button
            onClick={() => onScrollToSection("recruiters")}
            className="p-4 rounded-md border border-warm-grey bg-paper/50 hover:bg-card hover:border-charcoal/50 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <Briefcase className="w-4 h-4 text-olive" />
              <ArrowUpRight className="w-3.5 h-3.5 text-charcoal-muted group-hover:text-charcoal group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <h3 className="font-serif text-sm font-bold text-charcoal">
              Explore Placements & Recruiters
            </h3>
            <p className="text-[11px] text-charcoal-muted font-sans mt-1">
              Inspect confirmed recruiter records and verified seasonal reporting.
            </p>
          </button>

          {/* Action 4: Assistant */}
          {onAskAssistant && (
            <button
              onClick={() => onAskAssistant(`Tell me what makes ${college.name} distinctive and how its student feedback compares to other colleges in ${college.state}.`)}
              className="p-4 rounded-md border border-warm-grey bg-paper/50 hover:bg-card hover:border-charcoal/50 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <Bot className="w-4 h-4 text-olive" />
                <ArrowUpRight className="w-3.5 h-3.5 text-charcoal-muted group-hover:text-charcoal group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <h3 className="font-serif text-sm font-bold text-charcoal">
                Ask Campus Uncut AI
              </h3>
              <p className="text-[11px] text-charcoal-muted font-sans mt-1">
                Interrogate our agent regarding {college.name}'s verified rubric.
              </p>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
