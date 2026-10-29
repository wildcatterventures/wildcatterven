import React from "react";
import { Briefcase, Building, ExternalLink, FileText, Info } from "lucide-react";
import type { CollegeDetail as CollegeDetailType } from "../../../types/college";
import type { InstitutionalDossier, RecruiterCompany } from "../collegeDossierData";
import { openExternalUrl, isNativePlatform } from "../../../lib/externalLinks";

interface RecruiterLandscapeProps {
  college: CollegeDetailType;
  dossier: InstitutionalDossier | null;
  recruiters: RecruiterCompany[];
}

export const RecruiterLandscape: React.FC<RecruiterLandscapeProps> = ({
  college,
  dossier,
  recruiters,
}) => {
  const hasRecruiters = recruiters.length > 0;

  return (
    <section className="mb-10 space-y-6">
      {/* 1. Recruiter Landscape Strip */}
      <div className="editorial-card p-4 sm:p-6 bg-card border-warm-grey shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-warm-grey pb-3 sm:pb-4 mb-4 sm:mb-5 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-olive flex-shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-charcoal-muted">
                Career Pathways • Institutional Placement
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-charcoal mt-1">
              Where Graduates Go — Verified Recruitment Landscape
            </h2>
          </div>

          <div className="text-xs text-charcoal-muted font-sans sm:text-right">
            <span>Reporting Season: <strong>2023–24</strong></span>
            <span className="hidden sm:inline"> • </span>
            <span className="block sm:inline">Official Placement Documentation</span>
          </div>
        </div>

        {hasRecruiters ? (
          <div>
            <p className="text-xs text-charcoal-muted font-sans mb-5 sm:mb-6 max-w-3xl leading-relaxed">
              Companies demonstrably visiting or recruiting from <strong>{college.name}</strong> as documented in published placement cell records. We report verified corporate presence rather than unverified commercial ranking metrics.
            </p>

            {/* Grid of Verified Recruiters */}
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-3.5">
              {recruiters.map((recruiter, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-md border border-warm-grey bg-paper/50 hover:bg-card hover:border-charcoal/50 hover:shadow-subtle transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Clean Typographic & Symbolic Brand Mark */}
                    <div className="h-9 w-full flex items-center justify-start border-b border-warm-grey/60 pb-2 mb-2">
                      <div className="w-6 h-6 rounded bg-charcoal text-paper font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 mr-2 group-hover:bg-olive transition-colors">
                        {recruiter.name.charAt(0)}
                      </div>
                      <span className="font-serif text-sm font-bold text-charcoal truncate" title={recruiter.name}>
                        {recruiter.name}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-olive uppercase tracking-wider block truncate" title={recruiter.sector}>
                      {recruiter.sector}
                    </span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-warm-grey/50 flex items-center justify-between text-[10px] text-charcoal-muted font-sans">
                    <span className="font-mono">{recruiter.season}</span>
                    <a
                      href={recruiter.sourceUrl}
                      target={isNativePlatform() ? "_self" : "_blank"}
                      rel={isNativePlatform() ? undefined : "noopener noreferrer"}
                      onClick={(e) => openExternalUrl(recruiter.sourceUrl, e)}
                      className="text-olive hover:text-charcoal inline-flex items-center gap-0.5 group/link"
                      title={`Verify via ${recruiter.sourceLabel}`}
                    >
                      <span>Report</span>
                      <ExternalLink className="w-2.5 h-2.5 group-hover/link:translate-x-0.5 transition-transform" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Unverified Recruiter Fallback State */
          <div className="p-8 text-center bg-paper/40 rounded border border-warm-grey">
            <Building className="w-8 h-8 mx-auto mb-2 text-charcoal-muted/60" />
            <h3 className="font-serif text-lg font-bold text-charcoal mb-1">
              Recruiter Information Not Verified Yet
            </h3>
            <p className="text-xs text-charcoal-muted font-sans max-w-md mx-auto leading-relaxed">
              Campus Uncut strictly forbids fabricating placement companies. Verified recruiter records for <strong>{college.name}</strong> will be published once verified against official institutional placement reports.
            </p>
          </div>
        )}
      </div>

      {/* 2. Career Context & Placement Documentation Claims (Section G) */}
      <div className="editorial-card p-5 sm:p-6 bg-card border-warm-grey shadow-subtle">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-olive" />
          <h3 className="font-serif text-base font-bold text-charcoal">
            Career Context & Audit Methodology
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-charcoal-muted font-sans leading-relaxed">
          <div>
            <p className="mb-2">
              <strong className="text-charcoal font-semibold">Placement Cell Source:</strong>{" "}
              {dossier?.placementSummary ? (
                <span>
                  Records sourced from the official{" "}
                  <strong>{dossier.placementSummary.placementCellName}</strong> (
                  <a
                    href={dossier.placementSummary.reportUrl}
                    target={isNativePlatform() ? "_self" : "_blank"}
                    rel={isNativePlatform() ? undefined : "noopener noreferrer"}
                    onClick={(e) => openExternalUrl(dossier.placementSummary.reportUrl, e)}
                    className="text-olive underline hover:text-charcoal inline-flex items-center gap-0.5"
                  >
                    view official report portal
                    <ExternalLink className="w-3 h-3 inline" />
                  </a>
                  ).
                </span>
              ) : (
                <span>Awaiting official institutional placement office submission.</span>
              )}
            </p>
            <p>
              {dossier?.placementSummary?.overview ||
                "Campus recruitment figures vary across engineering departments. Prospective candidates are encouraged to inspect official branch-wise placement reports."}
            </p>
          </div>

          <div className="p-3.5 rounded bg-warm-grey-light/40 border border-warm-grey/70">
            <div className="flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-olive flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-charcoal font-semibold">Reporting Transparency:</strong>
                <p className="mt-1">
                  Campus Uncut records verified corporate presence during the 2023–24 placement season. Recruiter participation indicates on-campus or pooled hiring processes and does not constitute a guaranteed placement or salary claim.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
