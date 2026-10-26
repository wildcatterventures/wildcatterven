import React, { useState, useEffect, useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { api } from "../../lib/api";
import type {
  CollegeDetail as CollegeDetailType,
  CollegeRatingReport,
} from "../../types/college";
import { getCollegeDossier, getCollegeRecruiters } from "./collegeDossierData";
import { CollegeHeader } from "./components/CollegeHeader";
import { CollegeGlanceAndHighlights } from "./components/CollegeGlanceAndHighlights";
import { StudentPulse } from "./components/StudentPulse";
import { HonestVerdict } from "./components/HonestVerdict";
import { RecruiterLandscape } from "./components/RecruiterLandscape";
import { CampusDNA } from "./components/CampusDNA";
import { CollegeActionFooter } from "./components/CollegeActionFooter";

interface CollegeDetailProps {
  collegeId: string;
  onBack: () => void;
  onRate: (collegeId: string) => void;
  onAskAssistant?: (query?: string) => void;
}

// 6 Thematic Groups mapping all 25 official parameters deterministically
export interface ThematicCategory {
  id: string;
  name: string;
  shortName: string;
  description: string;
  parameterKeys: string[];
}

export const THEMATIC_CATEGORIES: ThematicCategory[] = [
  {
    id: "academics",
    name: "Academics & Faculty",
    shortName: "Academics",
    description: "Faculty quality, teaching rigor, lab equipment, and academic freedom.",
    parameterKeys: ["professor_quality", "classroom_quality", "academic_freedom"],
  },
  {
    id: "safety",
    name: "Campus Safety & Student Support",
    shortName: "Campus Safety",
    description: "Women's safety, anti-ragging measures, peer security, and anti-harassment safeguards.",
    parameterKeys: ["womens_safety", "ragging", "student_bullying", "professor_harassment"],
  },
  {
    id: "infrastructure",
    name: "Infrastructure & Connectivity",
    shortName: "Infrastructure",
    description: "Campus facilities, high-speed Wi-Fi, electricity backup, drinking water, and transit access.",
    parameterKeys: [
      "infrastructure",
      "internet",
      "electricity",
      "drinking_water",
      "transportation",
      "hospital_access",
    ],
  },
  {
    id: "living",
    name: "Hostel & Residential Living",
    shortName: "Hostels & Living",
    description: "Mess food quality, washroom cleanliness, curfew rules, and hostel hygiene.",
    parameterKeys: ["food", "hostel_quality", "hostel_conditions", "toilet_quality"],
  },
  {
    id: "culture",
    name: "Campus Culture & Student Life",
    shortName: "Student Culture",
    description: "Student community atmosphere, campus events, peer dynamics, and social culture.",
    parameterKeys: ["student_culture", "party_scene", "alcohol_culture"],
  },
  {
    id: "career_governance",
    name: "Career, Placements & Governance",
    shortName: "Career & Governance",
    description: "Campus placements, alumni networking, administration responsiveness, and student voice.",
    parameterKeys: [
      "campus_placements",
      "alumni_interaction",
      "college_management",
      "freedom_of_expression",
      "complaint_handling",
    ],
  },
];

export const CollegeDetail: React.FC<CollegeDetailProps> = ({
  collegeId,
  onBack,
  onRate,
  onAskAssistant,
}) => {
  const [college, setCollege] = useState<CollegeDetailType | null>(null);
  const [report, setReport] = useState<CollegeRatingReport | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedParameterKey, setSelectedParameterKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    Promise.all([api.getCollege(collegeId), api.getCollegeRatings(collegeId)])
      .then(([colData, repData]) => {
        if (mounted) {
          setCollege(colData);
          setReport(repData);
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
