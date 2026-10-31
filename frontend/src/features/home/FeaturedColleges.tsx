import React from "react";
import { ArrowRight, Star, Bookmark } from "lucide-react";
import type { CollegeSummary } from "../../types/college";
import { getCollegePhoto, getCollegeCardTags } from "../colleges/CollegeCard";

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
  const getScoreDisplay = (score: number) => {
    if (score >= 90) return (score / 10).toFixed(1);
    if (score >= 10) return (score / 10).toFixed(1);
    return score.toFixed(1);
  };

  return (
    <section className="py-4 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto font-sans">
      {/* Section Header (Matches Reference Image 1 Screen 3) */}
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
        /* Vertical Stack of Large Landscape College Cards (Matches Reference Image 1 Screen 3) */
        <div className="space-y-5 mb-8">
          {colleges.slice(0, 4).map((college) => {
            const photoUrl = getCollegePhoto(college);
            const tags = getCollegeCardTags(college);
            const hasRatings = college.total_submitted_sessions > 0;
            const scoreFormatted = getScoreDisplay(college.current_score);

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

                  {/* Top-Left Floating Score Pill (Matches Reference Image 1 Screen 3) */}
                  {hasRatings ? (
                    <div className="absolute top-3.5 left-3.5 flex items-center gap-1 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md shadow-md text-xs font-mono font-bold text-charcoal border border-white/40">
                      <span>{scoreFormatted}</span>
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    </div>
                  ) : (
                    <div className="absolute top-3.5 left-3.5 flex items-center px-2.5 py-1 rounded-full bg-paper/95 backdrop-blur-md shadow-md text-xs font-mono font-semibold text-charcoal-muted border border-warm-grey">
                      <span>Unrated</span>
                    </div>
                  )}

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
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-charcoal leading-snug group-hover:text-olive transition-colors">
                    {college.name}
                  </h3>
                  <p className="text-xs text-charcoal-muted mt-1 font-sans">
                    {college.city}, {college.state}
                  </p>

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
                    {college.total_submitted_sessions > 0 && (
                      <span className="text-[10px] font-mono text-charcoal-muted ml-auto hidden xs:inline">
                        {college.total_submitted_sessions} reviews
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
