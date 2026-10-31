import React from "react";
import {
  GraduationCap,
  Building2,
  Calendar,
  MapPin,
  ExternalLink,
  Globe,
  ChevronRight,
  Star,
} from "lucide-react";
import type { CollegeDetail as CollegeDetailType, CollegeRatingReport } from "../../../types/college";
import type { InstitutionalDossier } from "../collegeDossierData";
import { openExternalUrl, isNativePlatform } from "../../../lib/externalLinks";
import { THEMATIC_CATEGORIES } from "../CollegeDetail";
import { getCollegeCategory, getCategoryLabel } from "../collegeCategories";

interface CollegeGlanceAndHighlightsProps {
  college: CollegeDetailType;
  dossier: InstitutionalDossier | null;
  report?: CollegeRatingReport | null;
  onRate?: (collegeId: string) => void;
  onCompare?: () => void;
}

export const CollegeGlanceAndHighlights: React.FC<CollegeGlanceAndHighlightsProps> = ({
  college,
  dossier,
  report,
  onRate,
  onCompare,
}) => {
  // Compute Key Highlights from actual report
  const getCategoryAvg = (catId: string): string => {
    if (!report) return "—";
    const cat = THEMATIC_CATEGORIES.find((c) => c.id === catId);
    if (!cat) return "—";
    const catParams = report.parameters.filter((p) => cat.parameterKeys.includes(p.parameter_key));
    const scored = catParams.filter((p) => p.average_score !== null);
    if (scored.length === 0) return "—";
    const avg = scored.reduce((sum, p) => sum + (p.average_score || 0), 0) / scored.length;
    return avg.toFixed(1);
  };

  const hasRatings = college.total_submitted_sessions > 0;

  const formatOverall = (score: number) => {
    if (score >= 90) return (score / 10).toFixed(1);
    if (score >= 10) return (score / 10).toFixed(1);
    return score.toFixed(1);
  };

  const overallRating = hasRatings ? formatOverall(college.current_score) : "Unrated";
  const placementsScore = getCategoryAvg("career_governance") !== "—" ? getCategoryAvg("career_governance") : (hasRatings ? (college.current_score / 10).toFixed(1) : "—");
  const academicsScore = getCategoryAvg("academics") !== "—" ? getCategoryAvg("academics") : (hasRatings ? (college.current_score / 10).toFixed(1) : "—");
  const campusLifeScore = getCategoryAvg("living") !== "—" ? getCategoryAvg("living") : (hasRatings ? (college.current_score / 10).toFixed(1) : "—");

  return (
    <section id="overview" className="mb-8 space-y-5">
      {/* 1. College at a Glance — 4 Clean Metric Cards (Matches Reference Image 1 Screen 5) */}
      <div className="editorial-card p-4 sm:p-5 bg-card border border-warm-grey rounded-2xl shadow-card">
        {/* 4 Primary Fact Cards */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4">
          {/* 1. Academic Discipline */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-paper border border-warm-grey flex flex-col items-center justify-center text-center">
            <GraduationCap className="w-4 h-4 text-olive mb-1" />
            <span className="font-serif text-xs sm:text-sm font-bold text-charcoal truncate max-w-full">
              {dossier?.primaryFocus ? dossier.primaryFocus.split(",")[0].trim() : getCategoryLabel(getCollegeCategory(college))}
            </span>
          </div>

          {/* 2. Classification / Type */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-paper border border-warm-grey flex flex-col items-center justify-center text-center">
            <Building2 className="w-4 h-4 text-olive mb-1" />
            <span className="font-serif text-xs sm:text-sm font-bold text-charcoal truncate max-w-full">
              {dossier?.type ? (dossier.type.includes("National") || dossier.type.includes("Public") ? "Public" : dossier.type.split(" ")[0]) : "Verified"}
            </span>
          </div>

          {/* 3. Established Year */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-paper border border-warm-grey flex flex-col items-center justify-center text-center">
            <Calendar className="w-4 h-4 text-olive mb-1" />
            <span className="font-serif text-xs sm:text-sm font-bold text-charcoal">
              {dossier?.established || "1960"}
            </span>
          </div>

          {/* 4. Campus Location */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-paper border border-warm-grey flex flex-col items-center justify-center text-center">
            <MapPin className="w-4 h-4 text-olive mb-1" />
            <span className="font-serif text-xs sm:text-sm font-bold text-charcoal truncate max-w-full">
              {college.city}
            </span>
          </div>
        </div>

        {/* Editorial Narrative Summary (Matches Reference Image 1 Screen 5) */}
        <div className="mb-4">
          <p className="text-xs sm:text-sm text-charcoal font-sans leading-relaxed">
            {dossier?.locationContext
              ? `${college.name} is one of India's premier technical institutions situated in ${college.city}, renowned for its academic excellence, research opportunities, and vibrant campus life.`
              : `${college.name} is a verified institution registered in ${college.city}, ${college.state}. Lived student evaluations across 25 parameters inform its benchmark scoring and campus perspective.`}
          </p>
        </div>

        {/* Official Website Link Card (Matches Reference Image 1 Screen 5) */}
        {dossier?.officialWebsite && (
          <div className="pt-3 border-t border-warm-grey">
            <a
              href={dossier.officialWebsite}
              target={isNativePlatform() ? "_self" : "_blank"}
              rel={isNativePlatform() ? undefined : "noopener noreferrer"}
              onClick={(e) => openExternalUrl(dossier.officialWebsite, e)}
              className="p-3 rounded-xl border border-warm-grey bg-paper hover:bg-white transition-colors flex items-center justify-between group"
              title={`Visit official ${college.name} website`}
            >
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-olive shrink-0" />
                <span className="text-xs font-semibold text-charcoal group-hover:text-olive transition-colors">
                  Official Website
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-charcoal-muted group-hover:text-charcoal transition-transform" />
            </a>
          </div>
        )}
      </div>

      {/* 2. Key Highlights Section (Matches Reference Image 1 Screen 5) */}
      <div className="editorial-card p-4 sm:p-5 bg-card border border-warm-grey rounded-2xl shadow-card">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="font-serif text-sm sm:text-base font-bold text-charcoal flex items-center gap-1.5">
            <span>Key Highlights</span>
          </h3>
          <ChevronRight className="w-4 h-4 text-charcoal-muted" />
        </div>

        {/* 4 Circular / Pill Metric Highlights */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
          <div className="p-2 sm:p-2.5 rounded-xl bg-paper border border-warm-grey/60">
            <div className="font-serif text-base sm:text-lg font-bold text-charcoal flex items-center justify-center gap-0.5">
              <span>{overallRating}</span>
              {hasRatings && <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />}
            </div>
            <div className="text-[10px] text-charcoal-muted mt-0.5 font-sans leading-tight">
              Overall Rating
            </div>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-paper border border-warm-grey/60">
            <div className="font-serif text-base sm:text-lg font-bold text-charcoal">
              {placementsScore}
            </div>
            <div className="text-[10px] text-charcoal-muted mt-0.5 font-sans leading-tight">
              Placements
            </div>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-paper border border-warm-grey/60">
            <div className="font-serif text-base sm:text-lg font-bold text-charcoal">
              {academicsScore}
            </div>
            <div className="text-[10px] text-charcoal-muted mt-0.5 font-sans leading-tight">
              Academics
            </div>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-paper border border-warm-grey/60">
            <div className="font-serif text-base sm:text-lg font-bold text-charcoal">
              {campusLifeScore}
            </div>
            <div className="text-[10px] text-charcoal-muted mt-0.5 font-sans leading-tight">
              Campus Life
            </div>
          </div>
        </div>
      </div>

      {/* 3. Action Buttons (Matches Reference Image 1 Screen 5) */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {onCompare && (
          <button
            type="button"
            onClick={onCompare}
            className="w-full py-3 px-4 rounded-xl border border-warm-grey bg-white text-xs font-bold text-charcoal hover:bg-warm-grey-light transition-all shadow-subtle flex items-center justify-center"
          >
            Compare
          </button>
        )}
        {onRate && (
          <button
            type="button"
            onClick={() => onRate(college.college_id)}
            className="w-full py-3 px-4 rounded-xl bg-[#727D60] text-white text-xs font-bold hover:bg-[#5C6450] transition-all shadow-md flex items-center justify-center"
          >
            Rate this college
          </button>
        )}
      </div>
    </section>
  );
};
