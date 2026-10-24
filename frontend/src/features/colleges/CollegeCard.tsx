import React, { useState } from "react";
import { MapPin, School, GraduationCap, ShieldCheck, ArrowRight, MessageSquareQuote } from "lucide-react";
import type { CollegeSummary } from "../../types/college";
import { ScoreBadge } from "../../components/ScoreBadge";
import { DemoBadge } from "../../components/DemoBadge";

export function getCollegePhoto(college: { short_code?: string; name: string }): string {
  const code = (college.short_code || "").toUpperCase();
  const name = (college.name || "").toLowerCase();

  if (code.includes("SFIT") || name.includes("francis")) {
    return "/images/colleges/sfit.jpg";
  }
  if (code.includes("VJTI") || name.includes("jijabai") || name.includes("veermata")) {
    return "/images/colleges/vjti.jpg";
  }
  if (code.includes("COEP") || (name.includes("pune") && name.includes("engineering"))) {
    return "/images/colleges/coep.jpg";
  }
  if (code.includes("IITB") || code.includes("IIT-B") || name.includes("bombay") || name.includes("iit")) {
    return "/images/colleges/iitb.jpg";
  }
  if (code.includes("SPIT") || name.includes("sardar patel")) {
    return "/images/colleges/spit.jpg";
  }
  if (code.includes("VIOT") || code.includes("VIT-MUM") || name.includes("vidyalankar")) {
    return "/images/colleges/vidyalankar.jpg";
  }
  if (code.includes("PICT") || name.includes("computer technology")) {
    return "/images/colleges/pict.jpg";
  }
  if (code.includes("WCE") || name.includes("walchand")) {
    return "/images/colleges/wce.jpg";
  }
  return "/images/colleges/default.jpg";
}

interface CollegeCardProps {
  college: CollegeSummary;
  onSelect: (collegeId: string) => void;
  onRate: (collegeId: string) => void;
}

export const CollegeCard: React.FC<CollegeCardProps> = ({ college, onSelect, onRate }) => {
  const [imgSrc, setImgSrc] = useState(getCollegePhoto(college));
  const isUnrated = college.total_submitted_sessions === 0;
  const isDemo = Boolean(college.is_demo || college.name.toLowerCase().includes("(demo)"));

  return (
    <div className={`editorial-card bg-card overflow-hidden rounded-lg flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group border ${
      isDemo ? "border-amber-300/80 hover:border-amber-400" : "border-warm-grey hover:border-charcoal/50"
    }`}>
      <div className="flex flex-col flex-1">
        {/* Featured Campus Photograph Header */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-warm-grey-light cursor-pointer" onClick={() => onSelect(college.college_id)}>
          <img
            src={imgSrc}
            alt={`${college.name} campus architecture and student grounds`}
            onError={() => setImgSrc("/images/colleges/default.jpg")}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
            loading="lazy"
          />

          {/* Dark Scrim Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/20 to-black/30 pointer-events-none" />

          {/* Top Row Badges (Floating on Photo) */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none">
            {/* Monogram Badge */}
            <div className="px-2.5 py-1 rounded bg-charcoal/90 backdrop-blur-md text-paper border border-white/20 font-mono text-[11px] font-bold tracking-wider uppercase shadow-md">
              {college.short_code}
            </div>

            {/* Score Badge */}
            <div className="shadow-lg">
              <ScoreBadge score={college.current_score} size="md" />
            </div>
          </div>

          {/* Bottom Row on Photo (Location & Verification) */}
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 pointer-events-none">
            <div className="text-white drop-shadow-md">
              <div className="flex items-center gap-1.5 text-xs font-sans text-paper/95 font-medium">
                <MapPin className="w-3.5 h-3.5 text-olive-light flex-shrink-0" />
                <span>{college.city}, {college.state}</span>
              </div>
            </div>

            {/* Demo or Verified Tag */}
            {isDemo ? (
              <DemoBadge className="shadow-md" />
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase font-bold text-white bg-olive/90 backdrop-blur-md border border-white/20 shadow-md">
                <ShieldCheck className="w-3 h-3 text-white" />
                Official Campus
              </span>
            )}
          </div>
        </div>

        {/* Card Body Content */}
        <div className="p-5 sm:p-6 flex flex-col justify-between flex-1">
          <div>
            <h3
              onClick={() => onSelect(college.college_id)}
              className="font-serif text-xl sm:text-2xl font-bold text-charcoal group-hover:text-olive cursor-pointer transition-colors leading-snug line-clamp-2 h-[3.75rem] sm:h-[4.25rem] flex items-start mb-4"
              title={college.name}
            >
              {college.name}
            </h3>

            {/* Simulation Notice if Demo */}
            {isDemo && (
              <div className="mb-4 p-2.5 rounded bg-amber-50/90 border border-amber-200 text-[11px] text-amber-900 font-sans leading-relaxed">
                <strong>Simulated Test Campus:</strong> Populated with 19 qualifying submissions to demonstrate threshold transitions (100 → 99 or 100 → 101).
              </div>
            )}
          </div>

          {/* Metrics / Participation Snapshot */}
          <div className="mt-auto">
            {isUnrated ? (
              <div className="p-3.5 rounded bg-paper border border-warm-grey flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-olive animate-pulse" />
                  <span className="text-xs font-semibold text-charcoal">Clean Baseline 100</span>
                </div>
                <span className="text-[11px] font-mono text-olive font-semibold">Awaiting First Rating</span>
              </div>
            ) : (
              <div className="p-3 rounded bg-paper border border-warm-grey grid grid-cols-3 gap-2 text-center text-xs font-sans">
                <div>
                  <div className="font-bold text-charcoal text-base font-serif">
                    {college.total_submitted_sessions}
                  </div>
                  <div className="text-[10px] text-charcoal-muted uppercase font-mono tracking-wider">
                    Total Reviews
                  </div>
                </div>
                <div title="Current student respondents">
                  <div className="font-bold text-charcoal text-base font-serif flex items-center justify-center gap-1">
                    <School className="w-3.5 h-3.5 text-olive" />
                    <span>{college.current_student_submissions}</span>
                  </div>
                  <div className="text-[10px] text-charcoal-muted uppercase font-mono tracking-wider">
                    Students
                  </div>
                </div>
                <div title="Alumni respondents">
                  <div className="font-bold text-charcoal text-base font-serif flex items-center justify-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-charcoal-muted" />
                    <span>{college.alumni_submissions}</span>
                  </div>
                  <div className="text-[10px] text-charcoal-muted uppercase font-mono tracking-wider">
                    Alumni
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="p-5 sm:p-6 pt-0 border-t border-warm-grey/60 mt-auto">
        <div className="flex items-center gap-2 pt-4">
          <button
            onClick={() => onSelect(college.college_id)}
            className="flex-1 btn-secondary text-xs py-2.5 px-3 font-semibold flex items-center justify-center gap-1.5 group/btn"
          >
            <span>View Ratings</span>
            <ArrowRight className="w-3.5 h-3.5 text-olive transition-transform group-hover/btn:translate-x-0.5" />
          </button>
          <button
            onClick={() => onRate(college.college_id)}
            className="flex-1 btn-primary text-xs py-2.5 px-3 font-semibold flex items-center justify-center gap-1.5"
          >
            <MessageSquareQuote className="w-3.5 h-3.5 text-olive-light" />
            <span>Rate Campus</span>
          </button>
        </div>
      </div>
    </div>
  );
};
