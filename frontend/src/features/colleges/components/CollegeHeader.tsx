import React from "react";
import { ArrowLeft, Bookmark, Share2 } from "lucide-react";
import type { CollegeDetail as CollegeDetailType, CollegeRatingReport } from "../../../types/college";
import { getCollegePhoto, getStudentExperienceAverage } from "../CollegeCard";
import type { InstitutionalDossier } from "../collegeDossierData";

interface CollegeHeaderProps {
  college: CollegeDetailType;
  dossier: InstitutionalDossier | null;
  report?: CollegeRatingReport | null;
  onBack: () => void;
  onRate?: (collegeId: string) => void;
  onCompare?: () => void;
}

export const CollegeHeader: React.FC<CollegeHeaderProps> = ({
  college,
  report,
  onBack,
}) => {
  const photoUrl = getCollegePhoto(college);
  const studentExp = getStudentExperienceAverage(college, report);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: college.name,
          text: `Check out authentic student reviews and ratings for ${college.name} on Campus Uncut.`,
          url: window.location.href,
        });
      } catch {
        // Ignore aborts
      }
    }
  };

  return (
    <header className="mb-4">
      {/* Edge-to-Edge Hero Photograph */}
      <div className="relative aspect-[16/11] sm:aspect-[16/9] w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-warm-grey bg-warm-grey-light shadow-card select-none">
        <img
          src={photoUrl}
          alt={`${college.name} campus architecture`}
          className="w-full h-full object-cover object-center"
        />

        {/* Gradient Overlay for Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30 pointer-events-none" />

        {/* Top Floating Controls: Back Circle & Action Circles */}
        <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between z-10">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-charcoal flex items-center justify-center shadow-md hover:bg-white transition-transform active:scale-90"
            aria-label="Back to colleges"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-charcoal flex items-center justify-center shadow-md hover:bg-white transition-transform active:scale-90"
              aria-label="Save college"
            >
              <Bookmark className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-charcoal flex items-center justify-center shadow-md hover:bg-white transition-transform active:scale-90"
              aria-label="Share college"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Overlaid Metadata: Name, Location & Dual Score Badges */}
        <div className="absolute bottom-4 inset-x-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3 z-10 text-white">
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight text-white drop-shadow-md">
              {college.name}
            </h1>
            <p className="text-xs sm:text-sm text-white/90 mt-1 font-sans drop-shadow-xs">
              {college.city}, {college.state}
            </p>
          </div>

          {/* Dual Score Badges on Hero */}
          <div className="shrink-0 flex items-center gap-2">
            <div className="flex flex-col items-start px-3 py-1.5 rounded-xl bg-charcoal/90 backdrop-blur-md text-paper border border-white/20 shadow-md">
              <span className="text-[9px] uppercase tracking-wider font-mono opacity-80 leading-none">
                Campus Uncut Score
              </span>
              <span className="font-mono font-bold text-sm leading-tight text-white mt-0.5">
                {college.current_score}/100
              </span>
            </div>
            <div className="flex flex-col items-start px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md text-charcoal border border-white/40 shadow-md">
              <span className="text-[9px] uppercase tracking-wider font-mono text-charcoal-muted leading-none">
                Student Experience
              </span>
              <span className={`font-mono font-bold text-sm leading-tight mt-0.5 ${studentExp !== null ? "text-olive-dark" : "text-charcoal-muted"}`}>
                {studentExp !== null ? `${studentExp.toFixed(1)}/10` : "No ratings yet"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
