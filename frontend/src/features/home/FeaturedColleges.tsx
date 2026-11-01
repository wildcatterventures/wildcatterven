import React from "react";
import { ArrowRight, Bookmark } from "lucide-react";
import type { CollegeSummary } from "../../types/college";
import {
  getCollegePhoto,
  getCollegeCardTags,
  getStudentExperienceAverage,
} from "../colleges/CollegeCard";

interface FeaturedCollegesProps {
  colleges: CollegeSummary[];
  loading: boolean;
  onSelectCollege: (collegeId: string) => void;
  onExploreAll: () => void;
  onRateCollege: (collegeId: string) => void;
}

export const FeaturedColleges: React.FC<FeaturedCollegesProps> = ({
  colleges,
  loading,
  onSelectCollege,
  onExploreAll,
}) => {
  return (
    <section className="py-4 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto font-sans">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-charcoal tracking-tight">
          Featured Colleges
        </h2>
        <button
          onClick={onExploreAll}
          className="text-xs font-semibold text-charcoal hover:text-olive inline-flex items-center gap-1 py-1"
        >
          <span>See all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="editorial-card p-4 bg-card rounded-2xl animate-pulse space-y-3">
              <div className="aspect-[16/10] bg-warm-grey-light rounded-2xl w-full" />
              <div className="h-5 bg-warm-grey rounded w-1/2" />
              <div className="h-4 bg-warm-grey rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        /* Vertical Stack of Large Landscape College Cards */
        <div className="space-y-5 mb-8">
          {colleges.slice(0, 4).map((college) => {
            const photoUrl = getCollegePhoto(college);
            const tags = getCollegeCardTags(college);
            const studentExp = getStudentExperienceAverage(college);

            return (
              <div
                key={college.college_id}
                onClick={() => onSelectCollege(college.college_id)}
                className="group cursor-pointer bg-card rounded-2xl overflow-hidden border border-warm-grey shadow-subtle hover:shadow-card transition-all duration-300"
              >
                {/* Large Campus Image Frame */}
                <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-warm-grey-light select-none">
                  <img
                    src={photoUrl}
                    alt={`${college.name} campus architecture`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent pointer-events-none" />

                  {/* Top-Left Floating Score Pill */}
                  <div className="absolute top-3.5 left-3.5 flex items-center px-3 py-1 rounded-full bg-white/95 backdrop-blur-md shadow-md text-xs font-mono font-bold text-charcoal border border-white/40">
                    <span>Score {college.current_score}/100</span>
                  </div>

                  {/* Top-Right Floating Bookmark / Save Button */}
                  <div className="absolute top-3.5 right-3.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md text-charcoal/80 hover:text-charcoal flex items-center justify-center shadow-md transition-transform active:scale-90"
                      aria-label="Save college"
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* College Info & Tags Bar */}
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-charcoal leading-snug group-hover:text-olive transition-colors">
                        {college.name}
                      </h3>
                      <p className="text-xs text-charcoal-muted mt-1 font-sans">
                        {college.city}, {college.state}
                      </p>
                    </div>
                  </div>

                  {/* Dual Score Presentation */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-warm-grey/60 text-xs font-sans">
                    <div className="p-2 rounded-xl bg-warm-grey-light/50 border border-warm-grey/40">
                      <div className="text-[10px] uppercase tracking-wider text-charcoal-muted font-mono font-medium">
                        Campus Uncut Score
                      </div>
                      <div className="font-mono font-bold text-charcoal text-sm sm:text-base mt-0.5">
                        {college.current_score}/100
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-warm-grey-light/50 border border-warm-grey/40">
                      <div className="text-[10px] uppercase tracking-wider text-charcoal-muted font-mono font-medium">
                        Student Experience
                      </div>
                      <div className={`font-mono font-bold text-sm sm:text-base mt-0.5 ${studentExp !== null ? "text-olive-dark" : "text-charcoal-muted"}`}>
                        {studentExp !== null ? `${studentExp.toFixed(1)}/10` : "No ratings yet"}
                      </div>
                    </div>
                  </div>

                  {/* Category / Dimension Chips */}
                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 rounded-full bg-warm-grey-light text-charcoal-muted text-[11px] font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                    {college.total_submitted_sessions > 0 ? (
                      <span className="text-[10px] font-mono text-charcoal-muted ml-auto">
                        {college.total_submitted_sessions} review{college.total_submitted_sessions !== 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-charcoal-muted ml-auto italic">
                        Awaiting reviews
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
