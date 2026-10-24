import React from "react";
import { ArrowRight } from "lucide-react";
import type { CollegeSummary } from "../../types/college";
import { CollegeCard } from "../colleges/CollegeCard";

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
  onRateCollege,
}) => {
  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Masthead */}
      <div className="flex flex-col sm:flex-row items-baseline justify-between mb-8 border-b border-warm-grey pb-4 gap-2">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-olive font-semibold">
            Institutional Registry
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal mt-1">
            Featured Colleges
          </h2>
          <p className="text-xs text-charcoal-muted mt-1 font-sans">
            Live database entries with verified submission counts and official threshold scores.
          </p>
        </div>

        <button
          onClick={onExploreAll}
          className="text-xs font-semibold text-olive hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
        >
          <span>View all institutions ({colleges.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="editorial-card p-6 bg-card animate-pulse space-y-4">
              <div className="h-44 bg-warm-grey-light rounded w-full" />
              <div className="h-6 bg-warm-grey rounded w-3/4" />
              <div className="h-4 bg-warm-grey rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
          {colleges.slice(0, 6).map((college) => (
            <CollegeCard
              key={college.college_id}
              college={college}
              onSelect={onSelectCollege}
              onRate={onRateCollege}
            />
          ))}
        </div>
      )}

      {/* Editorial Photographic Inset Banner */}
      <div className="editorial-card overflow-hidden bg-card border-warm-grey grid grid-cols-1 md:grid-cols-12 items-center shadow-card">
        <div className="md:col-span-5 h-64 md:h-full relative overflow-hidden">
          <img
            src="/images/library_study.jpg"
            alt="Students reading and collaborating in an open university library hall"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-card/60 hidden md:block" />
        </div>
        <div className="md:col-span-7 p-6 sm:p-10">
          <span className="font-mono text-xs uppercase tracking-wider text-olive font-semibold">
            Institutional Accountability
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal mt-1 mb-3">
            Real Experiences Cannot Be Faked.
          </h3>
          <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed font-sans mb-6">
            Unlike commercial ranking lists influenced by advertising budgets, Campus Uncut ratings require comprehensive 25-parameter evaluation from authenticated student profiles.
          </p>
          <div className="flex items-center gap-3">
            <button onClick={onExploreAll} className="btn-primary text-xs py-2.5 px-6 font-semibold">
              Explore All Institutions
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
