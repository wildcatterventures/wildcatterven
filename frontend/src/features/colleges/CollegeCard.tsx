import React, { useState } from "react";
import { MapPin, ArrowRight, MessageSquareQuote } from "lucide-react";
import type { CollegeSummary } from "../../types/college";

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

// Verified institutional facts for registered campuses
interface CollegeMetadata {
  description: string;
  type: string;
  established?: number;
}

const INSTITUTIONAL_FACTS: Record<string, CollegeMetadata> = {
  IITB: {
    description: "Premier national institute for technical education, innovation, and engineering research in Powai.",
    type: "Institute of National Importance",
    established: 1958,
  },
  COEP: {
    description: "Historic public technical university on the Mula river, one of India's oldest engineering schools.",
    type: "Autonomous State University",
    established: 1854,
  },
  VJTI: {
    description: "Pioneering state-funded technical institute in central Mumbai with extensive engineering heritage.",
    type: "State-Funded Autonomous Institute",
    established: 1887,
  },
  SFIT: {
    description: "Private engineering institution in Borivali West affiliated with the University of Mumbai.",
    type: "Private Engineering College",
    established: 1999,
  },
  SPIT: {
    description: "Autonomous engineering institute situated on the Munshi Nagar educational campus in Andheri.",
    type: "Private Autonomous Institute",
    established: 1962,
  },
  PICT: {
    description: "Prominent engineering institution in Dhankawadi renowned for computer technology and software disciplines.",
    type: "Private Engineering Institute",
    established: 1983,
  },
  WCE: {
    description: "Pioneer government-aided engineering college in Vishrambag, Sangli with historic regional prominence.",
    type: "Government-Aided Autonomous Institute",
    established: 1947,
  },
  "VIT-MUM": {
    description: "Autonomous engineering and management campus located in Wadala East.",
    type: "Private Autonomous Institute",
    established: 1999,
  },
};

interface CollegeCardProps {
  college: CollegeSummary;
  onSelect: (collegeId: string) => void;
  onRate: (collegeId: string) => void;
}

export const CollegeCard: React.FC<CollegeCardProps> = ({ college, onSelect, onRate }) => {
  const [imgSrc, setImgSrc] = useState(getCollegePhoto(college));
  const hasRatings = college.total_submitted_sessions > 0;
  const isDemo = Boolean(college.is_demo || college.name.toLowerCase().includes("(demo)"));
  const facts = INSTITUTIONAL_FACTS[college.short_code?.toUpperCase() || ""];

  return (
    <article
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(college.college_id);
        }
      }}
      className={`editorial-card bg-card overflow-hidden rounded-md flex flex-col justify-between h-full transition-all duration-300 hover:shadow-card hover:-translate-y-0.5 group border ${
        isDemo ? "border-amber-300/80" : "border-warm-grey hover:border-charcoal/40"
      } focus:outline-none focus-visible:ring-2 focus-visible:ring-olive`}
    >
      <div className="flex flex-col flex-1">
        {/* Campus Photograph Header (~35–40% of the card) */}
        <div
          className="relative aspect-[16/10] w-full overflow-hidden bg-warm-grey-light cursor-pointer select-none"
          onClick={() => onSelect(college.college_id)}
          title={`Explore ${college.name}`}
        >
          <img
            src={imgSrc}
            alt={`${college.name} campus architecture`}
            onError={() => setImgSrc("/images/colleges/default.jpg")}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-104"
            loading="lazy"
          />

          {/* Subtle gradient only where needed for contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/65 via-transparent to-transparent pointer-events-none" />

          {/* Only ONE small abbreviation label over the image */}
          <div className="absolute top-3 left-3 pointer-events-none">
            <span className="px-2.5 py-0.5 rounded bg-charcoal/85 backdrop-blur-sm text-paper border border-white/20 font-mono text-[11px] font-bold tracking-wider uppercase shadow-xs">
              {college.short_code}
            </span>
          </div>

          {/* Bottom overlay: City & State */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-paper/95 text-xs font-sans font-medium pointer-events-none drop-shadow-sm">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-olive-light flex-shrink-0" />
              <span className="truncate">{college.city}, {college.state}</span>
            </div>
            {isDemo && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/90 text-charcoal font-bold uppercase tracking-wider">
                Demo
              </span>
            )}
          </div>
        </div>

        {/* College Identity & Institutional Context */}
        <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
          <div>
            {/* Title Container — min-height allows natural wrapping without clipping */}
            <div className="min-h-[3rem] sm:min-h-[3.5rem] flex flex-col justify-start">
              <h3
                onClick={() => onSelect(college.college_id)}
                className="font-serif text-base sm:text-lg lg:text-xl font-bold text-charcoal group-hover:text-olive cursor-pointer transition-colors leading-snug line-clamp-2"
                title={college.name}
              >
                {college.name}
              </h3>
            </div>

            {/* Factual Institutional Description */}
            <div className="min-h-[2.5rem] mt-1.5 sm:mt-2 flex flex-col justify-start">
              {facts?.description ? (
                <p className="text-xs text-charcoal-muted font-sans leading-relaxed line-clamp-2">
                  {facts.description}
                </p>
              ) : (
                <p className="text-xs text-charcoal-muted font-sans italic leading-relaxed line-clamp-2">
                  Registered institution in {college.city}, {college.state}. Explore ratings and campus perspectives.
                </p>
              )}
            </div>

            {/* Real Institutional Fact Tags */}
            <div className="min-h-[1.75rem] mt-2 flex items-center gap-1.5 text-[11px] font-sans text-charcoal-muted flex-wrap">
              {facts?.established && (
                <span className="px-2 py-0.5 rounded bg-warm-grey-light/70 border border-warm-grey/80 text-charcoal font-medium whitespace-nowrap shrink-0">
                  Est. {facts.established}
                </span>
              )}
              {facts?.type && (
                <span
                  className="px-2 py-0.5 rounded bg-warm-grey-light/70 border border-warm-grey/80 text-charcoal-muted truncate max-w-[210px]"
                  title={facts.type}
                >
                  {facts.type}
                </span>
              )}
              {!facts?.established && !facts?.type && (
                <span className="px-2 py-0.5 rounded bg-warm-grey-light/70 border border-warm-grey/80 text-charcoal-muted truncate">
                  {college.city}, {college.state}
                </span>
              )}
            </div>
          </div>

          {/* Student Perspective Summary */}
          <div className="pt-3 border-t border-warm-grey/70 mt-auto flex items-center justify-between text-xs font-sans">
            {hasRatings ? (
              <div className="flex items-center gap-1.5 text-charcoal font-medium">
                <MessageSquareQuote className="w-3.5 h-3.5 text-olive flex-shrink-0" />
                <span>
                  <strong>{college.total_submitted_sessions}</strong> student perspective{college.total_submitted_sessions !== 1 ? "s" : ""}
                </span>
              </div>
            ) : (
              <span className="text-charcoal-muted italic text-[11px]">
                No student ratings yet
              </span>
            )}

            {/* Score as secondary, subtle metadata */}
            <span
              className="text-[11px] font-mono text-charcoal-muted"
              title="Campus Uncut benchmark score (100 baseline)"
            >
              Score: {college.current_score}
            </span>
          </div>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="p-4 sm:p-5 pt-0 border-t border-warm-grey/50">
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 pt-3">
          <button
            onClick={() => onSelect(college.college_id)}
            className="flex-1 btn-primary min-h-[40px] text-xs py-2 px-3.5 font-medium flex items-center justify-center gap-1.5 group/btn"
            title={`Explore ${college.name}`}
          >
            <span>Explore college</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 text-paper" />
          </button>
          <button
            onClick={() => onRate(college.college_id)}
            className="btn-secondary min-h-[40px] text-xs py-2 px-3.5 font-medium flex items-center justify-center gap-1.5 whitespace-nowrap text-charcoal hover:border-charcoal hover:bg-card"
            title={`Rate ${college.name}`}
          >
            <span>Rate College</span>
          </button>
        </div>
      </div>
    </article>
  );
};
