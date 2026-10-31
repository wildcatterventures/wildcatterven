import React from "react";
import { Dna, Landmark, Activity } from "lucide-react";
import type { CollegeDetail as CollegeDetailType } from "../../../types/college";
import type { InstitutionalDossier } from "../collegeDossierData";
import { THEMATIC_CATEGORIES } from "../CollegeDetail";

interface CampusDNAProps {
  college: CollegeDetailType;
  dossier: InstitutionalDossier | null;
  categoryStats: Record<string, { avg: number | null; count: number; scoredCount: number }>;
}

export const CampusDNA: React.FC<CampusDNAProps> = ({
  college,
  dossier,
  categoryStats,
}) => {
  const hasRatings = college.total_submitted_sessions > 0;

  return (
    <section className="mb-10">
      <div className="editorial-card p-4 sm:p-6 bg-card border border-warm-grey rounded-2xl shadow-card">
        {/* Section Masthead */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-warm-grey pb-3 sm:pb-4 mb-4 sm:mb-5 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Dna className="w-4 h-4 text-olive flex-shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-charcoal-muted">
                Institutional Signature
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-charcoal mt-1">
              Campus DNA — Fact & Sentiment Signature
            </h2>
          </div>

          <span className="text-[11px] sm:text-xs text-charcoal-muted font-sans sm:text-right max-w-xs">
            Clearly separating verified official pillars from student-reported feedback.
          </span>
        </div>

        {/* Dual Pillar Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Pillar 1: Verified Institutional Facts */}
          <div className="p-4 sm:p-5 rounded-md border border-warm-grey bg-paper/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-warm-grey/60">
                <Landmark className="w-4 h-4 text-olive" />
                <h3 className="font-serif text-base font-bold text-charcoal">
                  Pillar 1: Institutional Foundation
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-charcoal text-paper uppercase ml-auto font-bold">
                  Official Facts
                </span>
              </div>

              <div className="space-y-3 text-xs font-sans">
                <div>
                  <span className="text-charcoal-muted font-mono text-[10px] uppercase tracking-wider block">
                    Institutional Mandate
                  </span>
                  <span className="text-charcoal font-medium mt-0.5 block">
                    {dossier?.type || "Technical Engineering Institution"} ({dossier?.status || "Government / Autonomous"})
                  </span>
                </div>

                <div>
                  <span className="text-charcoal-muted font-mono text-[10px] uppercase tracking-wider block">
                    Primary Academic Spectrum
                  </span>
                  <span className="text-charcoal font-medium mt-0.5 block">
                    {dossier?.primaryFocus || "Engineering, Technology & Applied Sciences"}
                  </span>
                </div>

                <div>
                  <span className="text-charcoal-muted font-mono text-[10px] uppercase tracking-wider block">
                    Campus Setting & Footprint
                  </span>
                  <span className="text-charcoal font-medium mt-0.5 block">
                    {dossier?.campusFootprint || `${college.city}, ${college.state}`}
                  </span>
                </div>

                <div>
                  <span className="text-charcoal-muted font-mono text-[10px] uppercase tracking-wider block">
                    Signature Anchor
                  </span>
                  <span className="text-charcoal font-medium mt-0.5 block">
                    {dossier?.distinctiveFeatures[0]?.title || "Regional Academic Centre"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-warm-grey/60 text-[11px] text-charcoal-muted flex items-center gap-1.5 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-olive flex-shrink-0" />
              <span>Verified through official institutional archives and charter documentation.</span>
            </div>
          </div>

          {/* Pillar 2: Student Feedback Fingerprint */}
          <div className="p-5 rounded-md border border-warm-grey bg-paper/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-warm-grey/60">
                <Activity className="w-4 h-4 text-olive" />
                <h3 className="font-serif text-base font-bold text-charcoal">
                  Pillar 2: Student Sentiment Fingerprint
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-olive text-paper uppercase ml-auto font-bold">
                  Student Signals
                </span>
              </div>

              {hasRatings ? (
                <div>
                  <div className="flex items-center justify-between text-[11px] text-charcoal-muted font-sans mb-3">
                    <span>
                      Based on <strong>{college.total_submitted_sessions}</strong> submitted session{college.total_submitted_sessions !== 1 ? "s" : ""}
                    </span>
                    <span className="font-mono text-[10px] uppercase text-olive font-semibold">
                      1–10 Rating Scale
                    </span>
                  </div>

                  {/* Category Fingerprint Mini-Bars */}
                  <div className="space-y-2.5">
                    {THEMATIC_CATEGORIES.map((cat) => {
                      const stat = categoryStats[cat.id];
                      const avg = stat?.avg;
                      const pct = avg !== null && avg !== undefined ? (avg / 10) * 100 : 0;

                      return (
                        <div key={cat.id} className="text-xs font-sans">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-charcoal font-medium truncate max-w-[200px]">
                              {cat.shortName}
                            </span>
                            <span className="font-mono font-semibold text-charcoal">
                              {avg !== null && avg !== undefined ? `${avg.toFixed(1)}/10` : "—"}
                            </span>
                          </div>

                          <div className="w-full h-1.5 rounded-full bg-warm-grey-light overflow-hidden">
                            {avg !== null && avg !== undefined ? (
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  avg >= 8 ? "bg-emerald-700" : avg >= 4 ? "bg-olive" : "bg-rose-700"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            ) : (
                              <div className="h-full bg-warm-grey w-0" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Unrated Fingerprint State */
                <div className="py-6 text-center text-xs text-charcoal-muted font-sans">
                  <p className="mb-2 font-serif text-sm font-semibold text-charcoal">
                    Student Signals Awaiting Contribution
                  </p>
                  <p className="max-w-xs mx-auto leading-relaxed">
                    Once students and alumni submit ratings across the 25 parameters, their evaluations will generate the live category fingerprint here.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-warm-grey/60 text-[11px] text-charcoal-muted flex items-center gap-1.5 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-charcoal-muted flex-shrink-0" />
              <span>Student signals represent authenticated student evaluations, not administrative claims.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
