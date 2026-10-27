import React from "react";
import { ArrowLeft, MapPin, ExternalLink, ShieldCheck, MessageSquareQuote, Info } from "lucide-react";
import type { CollegeDetail as CollegeDetailType } from "../../../types/college";
import { DemoBadge } from "../../../components/DemoBadge";
import { getCollegePhoto } from "../CollegeCard";
import type { InstitutionalDossier } from "../collegeDossierData";

interface CollegeHeaderProps {
  college: CollegeDetailType;
  dossier: InstitutionalDossier | null;
  onBack: () => void;
  onRate: (collegeId: string) => void;
}

export const CollegeHeader: React.FC<CollegeHeaderProps> = ({
  college,
  dossier,
  onBack,
  onRate,
}) => {
  const hasRatings = college.total_submitted_sessions > 0;
  const photoUrl = getCollegePhoto(college);

  return (
    <header className="mb-8">
      {/* Top Editorial Breadcrumb & Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-charcoal-muted hover:text-charcoal transition-colors py-1 px-1.5 -ml-1.5 rounded focus-visible:ring-1 focus-visible:ring-olive"
          title="Return to college directory"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Explore Colleges</span>
        </button>

        <div className="flex items-center gap-2 text-[11px] font-mono text-charcoal-muted">
          <span className="uppercase tracking-wider">Institutional Dossier</span>
          <span>•</span>
          <span className="font-bold text-charcoal">{college.short_code}</span>
        </div>
      </div>

      {/* Cinematic Hero Frame */}
      <div className="relative rounded-lg overflow-hidden border border-warm-grey bg-card shadow-card select-none">
        {/* Campus Photograph Frame */}
        <div className="relative min-h-[220px] sm:min-h-[260px] w-full overflow-hidden bg-warm-grey-light flex flex-col justify-between p-3.5 sm:p-6">
          <img
            src={photoUrl}
            alt={`${college.name} campus architecture`}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />

          {/* Editorial Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/95 via-charcoal/55 to-charcoal/30 pointer-events-none" />

          {/* Top Edge Badges: Monogram and Official Website */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <span className="px-2.5 py-1 rounded bg-charcoal/85 backdrop-blur-md text-paper border border-white/20 font-mono text-xs font-bold tracking-wider uppercase shadow-xs">
              {college.short_code}
            </span>

            {dossier?.officialWebsite && (
              <a
                href={dossier.officialWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-paper/90 hover:bg-paper text-charcoal text-[11px] sm:text-xs font-sans font-medium backdrop-blur-sm border border-white/40 shadow-xs transition-colors group min-h-[32px]"
                title={`Visit official ${college.name} website`}
              >
                <span>Official Website</span>
                <ExternalLink className="w-3 h-3 text-charcoal-muted group-hover:text-charcoal transition-transform group-hover:translate-x-0.5" />
              </a>
            )}
          </div>

          {/* Bottom Overlay Content */}
          <div className="relative z-10 text-paper flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-3 mt-6 sm:mt-8">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 text-[11px] sm:text-xs font-sans text-paper/90 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-olive-light flex-shrink-0" />
                  <span>{college.city}, {college.state}</span>
                </span>
                {dossier?.type && (
                  <>
                    <span>•</span>
                    <span className="text-paper/80 font-medium truncate max-w-[200px]">{dossier.type}</span>
                  </>
                )}
              </div>

              <h1 className="font-serif text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight drop-shadow-sm">
                {college.name}
              </h1>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
              {college.is_demo ? (
                <DemoBadge className="shadow-md" />
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-olive/90 backdrop-blur-sm border border-white/20 text-white font-mono text-[10px] sm:text-[11px] font-semibold tracking-wide uppercase shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-olive-light" />
                  <span>Verified Campus</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quiet Editorial Sub-header Bar (Context, Benchmark Score, and Primary CTA) */}
        <div className="p-3.5 sm:px-6 sm:py-3.5 bg-paper/90 border-t border-warm-grey flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-sans">
          {/* Institutional Descriptor */}
          <div className="flex items-center gap-3 text-charcoal-muted flex-1">
            <span className="leading-relaxed">
              {dossier?.campusFootprint
                ? `${dossier.campusFootprint}. Established in ${dossier.established}.`
                : `Registered institution in ${college.city}, ${college.state}.`}
            </span>
          </div>

          {/* Secondary Score & Action Group */}
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between md:justify-end gap-2.5 sm:gap-4 border-t md:border-t-0 border-warm-grey/60 pt-2.5 md:pt-0">
            {/* Campus Uncut Starting Baseline */}
            <div
              className="flex items-center justify-between xs:justify-start gap-2 px-3 py-1.5 rounded bg-card border border-warm-grey/80"
              title="Campus Uncut benchmark score. Starts at an unblemished 100-point neutral baseline, adjusting strictly +/-1 point per 20 qualifying student evaluations."
            >
              <div className="flex flex-col">
                <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-muted">
                  Platform Score
                </span>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="font-bold text-charcoal text-sm">{college.current_score}</span>
                  <span className="text-[10px] text-charcoal-muted">/ 100 baseline</span>
                </div>
              </div>
              <Info className="w-3.5 h-3.5 text-charcoal-muted/70 hover:text-olive transition-colors cursor-help" />
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => onRate(college.college_id)}
              className="btn-primary min-h-[44px] text-xs py-2 px-4 font-medium flex items-center justify-center gap-2 whitespace-nowrap shadow-xs"
              title={`Submit rating for ${college.name}`}
            >
              <MessageSquareQuote className="w-3.5 h-3.5 text-paper" />
              <span>{hasRatings ? "Rate this college" : "Be first to rate"}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
