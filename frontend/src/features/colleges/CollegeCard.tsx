import React, { useState } from "react";
import { MapPin, ArrowRight, ChevronRight } from "lucide-react";
import type { CollegeSummary } from "../../types/college";
import {
  getCollegePhoto,
  INSTITUTIONAL_FACTS,
  getCollegeCardTags,
  formatCollegeScore,
  getCollegeCategory,
  getCategoryLabel,
  getStudentExperienceAverage,
  formatInstitutionalScore,
  formatStudentExperience,
  formatParameterRating,
} from "./collegeCategories";
import type { CollegeMetadata } from "./collegeCategories";

export {
  getCollegePhoto,
  INSTITUTIONAL_FACTS,
  getCollegeCardTags,
  formatCollegeScore,
  getCollegeCategory,
  getCategoryLabel,
  getStudentExperienceAverage,
  formatInstitutionalScore,
  formatStudentExperience,
  formatParameterRating,
};
export type { CollegeMetadata };

export interface CollegeCardProps {
  college: CollegeSummary;
  onSelect: (collegeId: string) => void;
  onRate?: (collegeId: string) => void;
}

export const CollegeCard: React.FC<CollegeCardProps> = ({ college, onSelect, onRate }) => {
  const [imgSrc, setImgSrc] = useState(getCollegePhoto(college));
  const hasRatings = college.total_submitted_sessions > 0;
  const isDemo = Boolean(college.is_demo || college.name.toLowerCase().includes("(demo)"));
  const facts = INSTITUTIONAL_FACTS[college.short_code?.toUpperCase() || ""];
  const tags = getCollegeCardTags(college);
  const studentExp = getStudentExperienceAverage(college);

  return (
    <article
      tabIndex={0}
      onClick={() => onSelect(college.college_id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(college.college_id);
        }
      }}
      className={`group cursor-pointer bg-card border rounded-2xl transition-all duration-200 hover:shadow-card hover:border-charcoal/40 select-none overflow-hidden flex flex-row md:flex-col items-center md:items-stretch p-3 sm:p-3.5 md:p-0 gap-3 sm:gap-3.5 md:gap-0 min-h-[135px] max-h-[175px] md:min-h-0 md:max-h-none ${
        isDemo ? "border-amber-300/80" : "border-warm-grey"
      } focus:outline-none focus-visible:ring-2 focus-visible:ring-olive`}
    >
      {/* 1. Left Thumbnail on Mobile (100–116px width) / Top Landscape Hero on Desktop */}
      <div className="relative w-[104px] sm:w-[114px] min-w-[104px] sm:min-w-[114px] max-w-[104px] sm:max-w-[114px] h-[104px] sm:h-[114px] md:w-full md:min-w-full md:max-w-none md:h-44 md:aspect-[16/9] rounded-xl md:rounded-none md:rounded-t-2xl overflow-hidden shrink-0 border border-warm-grey/60 md:border-none md:border-b md:border-warm-grey bg-warm-grey-light">
        <img
          src={imgSrc}
          alt={`${college.name} campus architecture`}
          onError={() => setImgSrc("/images/colleges/default.jpg")}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Desktop Landscape Gradient Overlay & Floating Top Badges */}
        <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent pointer-events-none" />

        <div className="hidden md:flex absolute top-3 left-3 right-3 items-center justify-between pointer-events-none">
          <span className="px-2.5 py-0.5 rounded-md bg-charcoal/85 backdrop-blur-md text-paper border border-white/20 font-mono text-[11px] font-bold tracking-wider uppercase shadow-xs">
            {college.short_code}
          </span>

          <div className="flex items-center gap-1.5">
            {isDemo && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/90 text-charcoal font-bold uppercase tracking-wider shadow-xs">
                Demo
              </span>
            )}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-charcoal font-mono text-xs font-bold border border-white/40 shadow-xs">
              Score {college.current_score}/100
            </span>
          </div>
        </div>
      </div>

      {/* 2. Right Content on Mobile / Bottom Body on Desktop */}
      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5 md:p-5">
        <div>
          {/* Top Line: College Name */}
          <div className="flex items-start justify-between gap-2">
            <h3
              className="font-serif text-sm sm:text-base md:text-lg font-bold text-charcoal leading-snug group-hover:text-olive transition-colors line-clamp-2 break-words"
              title={college.name}
            >
              {college.name}
            </h3>
          </div>

          {/* Location Line */}
          <div className="flex items-center gap-1 text-xs text-charcoal-muted mt-1 font-sans">
            <MapPin className="w-3.5 h-3.5 text-olive shrink-0" />
            <span className="truncate">{college.city}, {college.state}</span>
          </div>

          {/* Dual Score Presentation (Campus Uncut Score /100 & Student Experience /10) */}
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-warm-grey/60 text-xs font-sans">
            <div className="p-1.5 rounded-lg bg-warm-grey-light/50 border border-warm-grey/40">
              <div className="text-[9px] uppercase tracking-wider text-charcoal-muted font-mono font-medium truncate">
                Score
              </div>
              <div className="font-mono font-bold text-charcoal text-xs sm:text-sm">
                {college.current_score}/100
              </div>
            </div>
            <div className="p-1.5 rounded-lg bg-warm-grey-light/50 border border-warm-grey/40">
              <div className="text-[9px] uppercase tracking-wider text-charcoal-muted font-mono font-medium truncate">
                Student Exp.
              </div>
              <div className={`font-mono font-bold text-xs sm:text-sm truncate ${studentExp !== null ? "text-olive-dark" : "text-charcoal-muted"}`}>
                {studentExp !== null ? `${studentExp.toFixed(1)}/10` : "No ratings yet"}
              </div>
            </div>
          </div>

          {/* Desktop Description */}
          {facts?.description && (
            <p className="hidden md:block text-xs text-charcoal-muted font-sans leading-relaxed mt-2 line-clamp-2">
              {facts.description}
            </p>
          )}

          {/* Category / Affiliation / Fact Tag Chips */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md bg-warm-grey-light text-charcoal-muted text-[10px] sm:text-[11px] font-medium"
              >
                {tag}
              </span>
            ))}
            {facts?.established && (
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-warm-grey-light text-charcoal-muted text-[10px] sm:text-[11px] font-medium">
                Est. {facts.established}
              </span>
            )}
          </div>
        </div>

        {/* Bottom Line / Action */}
        <div className="flex items-center justify-between mt-2 pt-1 border-t border-warm-grey/50 text-[11px] text-charcoal-muted font-sans">
          <span>
            {hasRatings ? (
              <span>
                <strong>{college.total_submitted_sessions}</strong> review{college.total_submitted_sessions !== 1 ? "s" : ""}
              </span>
            ) : (
              <span className="italic">Awaiting reviews</span>
            )}
          </span>

          {/* Subtle mobile chevron indicating card can be opened */}
          <div className="flex items-center gap-1 text-charcoal-muted group-hover:text-charcoal transition-colors ml-auto">
            <span className="hidden sm:inline md:hidden text-[11px] font-medium">View</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* Desktop Explore Action Button */}
          {onRate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRate(college.college_id);
              }}
              className="hidden md:inline-flex items-center gap-1 text-xs font-semibold text-olive hover:underline"
            >
              <span>Rate</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
