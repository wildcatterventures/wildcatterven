import React from "react";
import { ArrowLeft, Bookmark, Share2, Star } from "lucide-react";
import type { CollegeDetail as CollegeDetailType } from "../../../types/college";
import { getCollegePhoto } from "../CollegeCard";
import type { InstitutionalDossier } from "../collegeDossierData";

interface CollegeHeaderProps {
  college: CollegeDetailType;
  dossier: InstitutionalDossier | null;
  onBack: () => void;
  onRate?: (collegeId: string) => void;
  onCompare?: () => void;
}

export const CollegeHeader: React.FC<CollegeHeaderProps> = ({
  college,
  onBack,
}) => {
  const photoUrl = getCollegePhoto(college);

  const formatScore = (score: number) => {
    if (score >= 90) return (score / 10).toFixed(1);
    if (score >= 10) return (score / 10).toFixed(1);
    return score.toFixed(1);
  };

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
      {/* Edge-to-Edge Hero Photograph (Matches Reference Image 1 Screen 5 & Image 2 Screen 6) */}
      <div className="relative aspect-[16/11] sm:aspect-[16/9] w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-warm-grey bg-warm-grey-light shadow-card select-none">
        <img
          src={photoUrl}
          alt={`${college.name} campus architecture`}
          className="w-full h-full object-cover object-center"
        />

        {/* Gradient Overlay for Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/30 pointer-events-none" />

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

        {/* Bottom Overlaid Metadata: Name, Location & Floating Score Pill */}
        <div className="absolute bottom-4 inset-x-4 flex items-end justify-between gap-3 z-10 text-white">
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight text-white drop-shadow-md">
              {college.name}
            </h1>
            <p className="text-xs sm:text-sm text-white/90 mt-1 font-sans drop-shadow-xs">
              {college.city}, {college.state}
            </p>
          </div>

          {/* Floating Score Pill (Matches Reference Image 1 Screen 5) */}
          {college.total_submitted_sessions > 0 ? (
            <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-charcoal font-mono font-bold text-sm shadow-md border border-white/40">
              <span>{formatScore(college.current_score)}</span>
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
          ) : (
            <div className="shrink-0 flex items-center px-3 py-1.5 rounded-full bg-paper/95 backdrop-blur-md text-charcoal-muted font-mono font-semibold text-xs shadow-md border border-warm-grey">
              <span>Unrated</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
