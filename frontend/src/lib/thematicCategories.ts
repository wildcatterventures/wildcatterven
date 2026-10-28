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
