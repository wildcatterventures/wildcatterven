import React, { useState, useEffect, useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { api } from "../../lib/api";
import type {
  CollegeDetail as CollegeDetailType,
  CollegeRatingReport,
  CollegeSummary,
} from "../../types/college";
import { getCollegeDossier, getCollegeRecruiters } from "./collegeDossierData";
import { CollegeHeader } from "./components/CollegeHeader";
import { CollegeGlanceAndHighlights } from "./components/CollegeGlanceAndHighlights";
import { StudentPulse } from "./components/StudentPulse";
import { HonestVerdict } from "./components/HonestVerdict";
import { RecruiterLandscape } from "./components/RecruiterLandscape";
import { CampusDNA } from "./components/CampusDNA";
import { CollegeActionFooter } from "./components/CollegeActionFooter";
import { CollegeComparison } from "./components/CollegeComparison";

interface CollegeDetailProps {
  collegeId: string;
  onBack: () => void;
  onRate: (collegeId: string) => void;
  onAskAssistant?: (query?: string) => void;
}

import { THEMATIC_CATEGORIES, type ThematicCategory } from "../../lib/thematicCategories";
export { THEMATIC_CATEGORIES, type ThematicCategory };

export const CollegeDetail: React.FC<CollegeDetailProps> = ({
  collegeId,
  onBack,
  onRate,
  onAskAssistant,
}) => {
  const [college, setCollege] = useState<CollegeDetailType | null>(null);
  const [report, setReport] = useState<CollegeRatingReport | null>(null);
  const [allColleges, setAllColleges] = useState<CollegeSummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedParameterKey, setSelectedParameterKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      api.getCollege(collegeId),
      api.getCollegeRatings(collegeId),
      api.getColleges("", true),
    ])
      .then(([colData, repData, colsData]) => {
        if (mounted) {
          setCollege(colData);
          setReport(repData);
          setAllColleges(colsData);
        }
      })
      .catch((err: any) => {
        if (mounted) {
          setError(err.message || "Failed to load college details.");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [collegeId]);

  // Resolve verified institutional facts and recruiters
  const dossier = useMemo(() => {
    if (!college) return null;
    return getCollegeDossier(college);
  }, [college]);

  const recruiters = useMemo(() => {
    if (!college) return [];
    return getCollegeRecruiters(college);
  }, [college]);

  // Compute category averages safely (excluding No-view)
  const categoryStats = useMemo(() => {
    if (!report) return {};
    const stats: Record<
      string,
      { avg: number | null; count: number; scoredCount: number }
    > = {};

    THEMATIC_CATEGORIES.forEach((cat) => {
      const catParams = report.parameters.filter((p) =>
        cat.parameterKeys.includes(p.parameter_key)
      );
      const scored = catParams.filter((p) => p.average_score !== null);
      const avg =
        scored.length > 0
          ? scored.reduce((sum, p) => sum + (p.average_score || 0), 0) / scored.length
          : null;

      stats[cat.id] = {
        avg,
        count: catParams.length,
        scoredCount: scored.length,
      };
    });

    return stats;
  }, [report]);

  // Navigational jump handler
  const handleScrollToSection = (sectionId: string) => {
    if (sectionId === "academics") {
      setSelectedCategory("academics");
      const el = document.getElementById("parameter-explorer");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else if (sectionId === "infrastructure") {
      setSelectedCategory("infrastructure");
      const el = document.getElementById("parameter-explorer");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else if (sectionId === "recruiters") {
      const el = document.getElementById("recruiter-landscape");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSelectParameter = (paramKey: string) => {
    setSelectedParameterKey(paramKey);
    // Find category for this parameter
    const cat = THEMATIC_CATEGORIES.find((c) => c.parameterKeys.includes(paramKey));
    if (cat) {
      setSelectedCategory(cat.id);
    }
    const el = document.getElementById(`param-${paramKey}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (loading) {
    return (
      <div className="py-28 px-4 max-w-5xl mx-auto text-center font-sans">
        <div className="inline-block w-8 h-8 border-2 border-olive border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-charcoal-muted font-medium">
          Retrieving verified institutional dossier from PostgreSQL...
        </p>
      </div>
    );
  }

  if (error || !college || !report) {
    return (
      <div className="py-20 px-4 max-w-xl mx-auto text-center font-sans">
        <div className="p-5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-sm mb-6">
          <AlertCircle className="w-5 h-5 mx-auto mb-2 text-rose-600" />
          <span>{error || "College record not found in the registry."}</span>
        </div>
        <button onClick={onBack} className="btn-secondary text-xs">
          ← Back to Registry
        </button>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto font-sans">
      {/* SECTION A — Cinematic Editorial Campus Header */}
      <CollegeHeader
        college={college}
        dossier={dossier}
        onBack={onBack}
        onRate={onRate}
      />

      {/* SECTION B — College at a Glance & What Makes This Campus Different */}
      <CollegeGlanceAndHighlights
        college={college}
        dossier={dossier}
      />

      {/* SECTION C — The Student Pulse: Visualizations & Parameter Explorer */}
      <StudentPulse
        college={college}
        report={report}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedParameterKey={selectedParameterKey}
        onRate={onRate}
      />

      {/* SECTION C.2 — Head-to-Head College Comparison */}
      <CollegeComparison
        currentCollege={college}
        currentReport={report}
        allColleges={allColleges}
      />

      {/* SECTION D — The Honest Verdict: Evidence-Based Pros & Cons */}
      <HonestVerdict
        totalSessions={college.total_submitted_sessions}
        parameters={report.parameters}
        onSelectParameter={handleSelectParameter}
      />

      {/* SECTION E & G — Recruiter Landscape & Placement Claims */}
      <div id="recruiter-landscape">
        <RecruiterLandscape
          college={college}
          dossier={dossier}
          recruiters={recruiters}
        />
      </div>

      {/* SECTION F — Campus DNA: A Memorable Visual Signature */}
      <CampusDNA
        college={college}
        dossier={dossier}
        categoryStats={categoryStats}
      />

      {/* SECTION H — Take Action */}
      <CollegeActionFooter
        college={college}
        onRate={onRate}
        onScrollToSection={handleScrollToSection}
        onAskAssistant={onAskAssistant}
      />
    </div>
  );
};
