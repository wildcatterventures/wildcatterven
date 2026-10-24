import React from "react";
import { MapPin, GraduationCap, School } from "lucide-react";
import type { CollegeSummary } from "../../types/college";
import { ScoreBadge } from "../../components/ScoreBadge";
import { DemoBadge } from "../../components/DemoBadge";

interface CollegeCardProps {
  college: CollegeSummary;
  onSelect: (collegeId: string) => void;
  onRate: (collegeId: string) => void;
}

export const CollegeCard: React.FC<CollegeCardProps> = ({ college, onSelect, onRate }) => {
  return (
    <div className="editorial-card p-6 bg-card flex flex-col justify-between hover:border-charcoal/40 transition-colors">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-charcoal-muted uppercase">
              {college.short_code}
            </span>
            {college.is_demo && <DemoBadge />}
          </div>
          <ScoreBadge score={college.current_score} />
        </div>

        <h3
          onClick={() => onSelect(college.college_id)}
          className="font-serif text-xl font-bold text-charcoal hover:text-olive cursor-pointer transition-colors mb-2 leading-snug"
        >
          {college.name}
        </h3>

        <p className="text-xs text-charcoal-muted flex items-center gap-1.5 mb-4 font-sans">
          <MapPin className="w-3.5 h-3.5 text-olive flex-shrink-0" />
          <span>
            {college.city}, {college.state}
          </span>
        </p>
      </div>

      <div className="space-y-4">
        {/* Participation counts */}
        <div className="pt-3 border-t border-warm-grey grid grid-cols-3 gap-2 text-center text-xs font-sans">
          <div className="p-1.5 rounded bg-warm-grey-light">
            <div className="font-bold text-charcoal">{college.total_submitted_sessions}</div>
            <div className="text-[10px] text-charcoal-muted uppercase tracking-wider font-mono">
              Total
            </div>
          </div>
          <div className="p-1.5 rounded bg-warm-grey-light" title="Self-declared current students">
            <div className="font-bold text-charcoal flex items-center justify-center gap-1">
              <School className="w-3 h-3 text-olive" />
              <span>{college.current_student_submissions}</span>
            </div>
            <div className="text-[10px] text-charcoal-muted uppercase tracking-wider font-mono">
              Students
            </div>
          </div>
          <div className="p-1.5 rounded bg-warm-grey-light" title="Self-declared alumni">
            <div className="font-bold text-charcoal flex items-center justify-center gap-1">
              <GraduationCap className="w-3 h-3 text-charcoal-muted" />
              <span>{college.alumni_submissions}</span>
            </div>
            <div className="text-[10px] text-charcoal-muted uppercase tracking-wider font-mono">
              Alumni
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onSelect(college.college_id)}
            className="flex-1 btn-secondary text-xs py-2"
          >
            View Ratings
          </button>
          <button
            onClick={() => onRate(college.college_id)}
            className="flex-1 btn-primary text-xs py-2"
          >
            Rate Campus
          </button>
        </div>
      </div>
    </div>
  );
};
