import React from "react";
import { MapPin, Users, ArrowRight } from "lucide-react";
import type { CollegeSummary } from "../../types/college";
import { ScoreBadge } from "../../components/ScoreBadge";
import { DemoBadge } from "../../components/DemoBadge";

interface FeaturedCollegesProps {
  colleges: CollegeSummary[];
  loading: boolean;
  onSelectCollege: (collegeId: string) => void;
  onExploreAll: () => void;
}

export const FeaturedColleges: React.FC<FeaturedCollegesProps> = ({
  colleges,
  loading,
  onSelectCollege,
  onExploreAll,
}) => {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-baseline justify-between mb-8 border-b border-warm-grey pb-4 gap-2">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal">
            Campus Directory Preview
          </h2>
          <p className="text-xs text-charcoal-muted mt-1 font-sans">
            Official scores and response tallies updated live from PostgreSQL.
          </p>
        </div>

        <button
          onClick={onExploreAll}
          className="text-xs font-semibold text-olive hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
        >
          <span>View all institutions</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="editorial-card p-6 bg-card animate-pulse space-y-4">
              <div className="h-5 bg-warm-grey rounded w-3/4" />
              <div className="h-4 bg-warm-grey rounded w-1/2" />
              <div className="h-8 bg-warm-grey rounded w-1/4 mt-4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {colleges.slice(0, 6).map((college) => (
            <div
              key={college.college_id}
              onClick={() => onSelectCollege(college.college_id)}
              className="editorial-card p-6 bg-card flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="font-mono text-xs font-semibold text-charcoal-muted uppercase">
                    {college.short_code}
                  </span>
                  <ScoreBadge score={college.current_score} />
                </div>

                <h3 className="font-serif text-xl font-bold text-charcoal group-hover:text-olive transition-colors mb-2 leading-snug">
                  {college.name}
                </h3>

                <p className="text-xs text-charcoal-muted flex items-center gap-1.5 mb-4 font-sans">
                  <MapPin className="w-3.5 h-3.5 text-olive flex-shrink-0" />
                  <span>
                    {college.city}, {college.state}
                  </span>
                </p>
              </div>

              <div className="pt-4 border-t border-warm-grey flex items-center justify-between text-xs font-sans">
                <div className="flex items-center gap-1.5 text-charcoal-muted">
                  <Users className="w-3.5 h-3.5 text-charcoal-muted" />
                  <span>
                    {college.total_submitted_sessions}{" "}
                    {college.total_submitted_sessions === 1 ? "rating" : "ratings"}
                  </span>
                </div>

                {college.is_demo ? (
                  <DemoBadge />
                ) : (
                  <span className="text-[11px] font-mono text-olive font-medium">
                    Genuine Campus
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
