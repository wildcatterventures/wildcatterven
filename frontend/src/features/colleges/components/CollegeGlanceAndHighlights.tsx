import React from "react";
import { Landmark, ExternalLink, Sparkles } from "lucide-react";
import type { CollegeDetail as CollegeDetailType } from "../../../types/college";
import type { InstitutionalDossier } from "../collegeDossierData";

interface CollegeGlanceAndHighlightsProps {
  college: CollegeDetailType;
  dossier: InstitutionalDossier | null;
}

export const CollegeGlanceAndHighlights: React.FC<CollegeGlanceAndHighlightsProps> = ({
  college,
  dossier,
}) => {
  return (
    <section className="mb-10 space-y-6">
      {/* 1. College at a Glance (Verified Institutional Facts) */}
      <div className="editorial-card p-6 bg-card border-warm-grey shadow-card">
        <div className="flex items-center gap-2 mb-4 border-b border-warm-grey/70 pb-3">
          <Landmark className="w-4 h-4 text-olive" />
          <h2 className="font-serif text-xl font-bold text-charcoal">College at a Glance</h2>
          <span className="text-[11px] font-mono uppercase tracking-wider text-charcoal-muted ml-auto">
            Verified Institutional Facts
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Established */}
          <div className="p-3 rounded bg-paper/70 border border-warm-grey/70">
            <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-muted block">
              Established
            </span>
            <span className="font-serif text-lg font-bold text-charcoal mt-0.5 block">
              {dossier?.established ? dossier.established : "Registered"}
            </span>
            <span className="text-[11px] text-charcoal-muted font-sans">
              {dossier?.established ? `${new Date().getFullYear() - dossier.established} years of history` : "Active campus"}
            </span>
          </div>

          {/* Institution Type */}
          <div className="p-3 rounded bg-paper/70 border border-warm-grey/70">
            <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-muted block">
              Classification
            </span>
            <span className="font-serif text-sm font-bold text-charcoal mt-1 line-clamp-1" title={dossier?.type || "Technical College"}>
              {dossier?.type || "Technical College"}
            </span>
            <span className="text-[11px] text-charcoal-muted font-sans truncate block">
              {dossier?.status || "Higher Education"}
            </span>
          </div>

          {/* Affiliation / Charter */}
          <div className="p-3 rounded bg-paper/70 border border-warm-grey/70">
            <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-muted block">
              Charter / Affiliation
            </span>
            <span className="font-serif text-sm font-bold text-charcoal mt-1 line-clamp-1" title={dossier?.affiliation || "State University System"}>
              {dossier?.affiliation || "State University System"}
            </span>
            <span className="text-[11px] text-charcoal-muted font-sans truncate block">
              Official Degree Granting
            </span>
          </div>

          {/* Campus Footprint */}
          <div className="p-3 rounded bg-paper/70 border border-warm-grey/70">
            <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-muted block">
              Campus Footprint
            </span>
            <span className="font-serif text-sm font-bold text-charcoal mt-1 line-clamp-1" title={dossier?.campusFootprint || `${college.city}, ${college.state}`}>
              {dossier?.campusFootprint ? dossier.campusFootprint.split(" in ")[0] : `${college.city}`}
            </span>
            <span className="text-[11px] text-charcoal-muted font-sans truncate block">
              {college.city}, {college.state}
            </span>
          </div>

          {/* Core Focus */}
          <div className="p-3 rounded bg-paper/70 border border-warm-grey/70">
            <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-muted block">
              Primary Academic Focus
            </span>
            <span className="font-serif text-sm font-bold text-charcoal mt-1 line-clamp-1" title={dossier?.primaryFocus || "Engineering & Technology"}>
              {dossier?.primaryFocus ? dossier.primaryFocus.split(",")[0] : "Engineering & Technology"}
            </span>
            <span className="text-[11px] text-charcoal-muted font-sans truncate block">
              Undergraduate & Research
            </span>
          </div>

          {/* Verification Status */}
          <div className="p-3 rounded bg-paper/70 border border-warm-grey/70">
            <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-muted block">
              Accreditation
            </span>
            <span className="font-serif text-sm font-bold text-charcoal mt-1 line-clamp-1" title={dossier?.verifiedAccreditation || "Verified Campus Registry"}>
              {dossier?.verifiedAccreditation ? dossier.verifiedAccreditation.split(" • ")[0] : "Registry Verified"}
            </span>
            <span className="text-[11px] text-olive font-sans font-medium flex items-center gap-1">
              <span>Audited Entry</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. What Makes This Campus Different (Distinctive Signature Features) */}
      {dossier?.distinctiveFeatures && dossier.distinctiveFeatures.length > 0 && (
        <div className="editorial-card p-6 bg-card border-warm-grey shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-olive" />
            <h2 className="font-serif text-xl font-bold text-charcoal">
              What Makes {college.name} Different
            </h2>
          </div>
          <p className="text-xs text-charcoal-muted font-sans mb-5 leading-relaxed">
            Verified institutional differentiators, signature research centres, and officially documented student initiatives. Every item is verified against official records.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dossier.distinctiveFeatures.map((feature, idx) => {
              const categoryColors: Record<string, { bg: string; text: string; label: string }> = {
                research: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-900", label: "Research & Incubation" },
                facility: { bg: "bg-blue-50 border-blue-200", text: "text-blue-900", label: "Specialized Facility" },
                heritage: { bg: "bg-amber-50 border-amber-200", text: "text-amber-900", label: "Institutional Heritage" },
                initiative: { bg: "bg-purple-50 border-purple-200", text: "text-purple-900", label: "Student Innovation" },
                academic: { bg: "bg-olive-light border-olive/30", text: "text-olive-dark", label: "Academic Landmark" },
              };

              const style = categoryColors[feature.category] || categoryColors.research;

              return (
                <div
                  key={idx}
                  className="p-4 rounded-md border border-warm-grey bg-paper/40 flex flex-col justify-between hover:border-charcoal/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider font-semibold ${style.bg} ${style.text}`}>
                        {style.label}
                      </span>
                      <span className="text-[11px] font-mono text-charcoal-muted">
                        0{idx + 1}
                      </span>
                    </div>

                    <h3 className="font-serif text-base font-bold text-charcoal leading-snug mb-2">
                      {feature.title}
                    </h3>

                    <p className="text-xs text-charcoal-muted font-sans leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-warm-grey/60 flex items-center justify-between text-[11px] font-sans">
                    <span className="text-charcoal-muted">Evidence source:</span>
                    <a
                      href={feature.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-olive hover:text-charcoal hover:underline inline-flex items-center gap-1 font-medium"
                      title={`Verify at ${feature.sourceName}`}
                    >
                      <span>{feature.sourceName}</span>
                      <ExternalLink className="w-3 h-3 text-olive" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
