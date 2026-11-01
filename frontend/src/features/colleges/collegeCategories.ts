// ============================================================================
// CAMPUS UNCUT — COLLEGE CATEGORIES & MULTI-STREAM TAXONOMY
// ============================================================================
// Canonical mapping and helper functions for the 23 registered institutions
// across four distinct streams: Engineering, Medical, MBA, and Arts.
// ============================================================================

import type { CollegeCategory, CollegeSummary } from "../../types/college.ts";

export interface CategoryDefinition {
  id: CollegeCategory;
  label: string;
  badgeLabel: string;
  description: string;
}

export const COLLEGE_CATEGORIES: Record<CollegeCategory, CategoryDefinition> = {
  engineering: {
    id: "engineering",
    label: "Engineering",
    badgeLabel: "Engineering",
    description: "Technical, engineering & technology institutes",
  },
  medical: {
    id: "medical",
    label: "Medical",
    badgeLabel: "Medical",
    description: "Medical colleges, healthcare institutes & clinical sciences",
  },
  mba: {
    id: "mba",
    label: "MBA",
    badgeLabel: "MBA",
    description: "Premier business schools & management faculties",
  },
  arts: {
    id: "arts",
    label: "Arts",
    badgeLabel: "Arts & Science",
    description: "Liberal arts, humanities, media & pure sciences",
  },
};

/**
 * Deterministic mapping of all 23 verified institutional short codes
 * to their respective academic category.
 */
export const COLLEGE_SHORTCODE_CATEGORY_MAP: Record<string, CollegeCategory> = {
  // Engineering (8)
  IITB: "engineering",
  COEP: "engineering",
  VJTI: "engineering",
  SFIT: "engineering",
  SPIT: "engineering",
  PICT: "engineering",
  "VIT-MUM": "engineering",
  VIOT: "engineering", // Legacy shortcode variant
  WCE: "engineering",

  // Medical (5)
  "AIIMS-DEL": "medical",
  "CMC-VEL": "medical",
  "JIPMER-PDY": "medical",
  "KMC-MAN": "medical",
  "AFMC-PUN": "medical",

  // MBA (5)
  "IIMA-AHM": "mba",
  "IIMB-BLR": "mba",
  "IIMC-KOL": "mba",
  "XLRI-JAM": "mba",
  "FMS-DEL": "mba",

  // Arts (5)
  "HINDU-DEL": "arts",
  "FC-PUN": "arts",
  "SXC-MUM": "arts",
  "LOYOLA-CHE": "arts",
  "SXC-KOL": "arts",
};

/**
 * Resolves the category of a college using:
 * 1. The explicit `college.category` field if returned by the backend or database.
 * 2. Deterministic short code lookup against the 23 verified institutions.
 * 3. Intelligent heuristic fallback based on college name.
 */
export function getCollegeCategory(college?: {
  short_code?: string | null;
  category?: string | null;
  name?: string | null;
}): CollegeCategory {
  if (!college) return "engineering";

  // 1. Direct field match if present
  if (college.category) {
    const cat = college.category.toLowerCase().trim();
    if (cat === "engineering" || cat === "medical" || cat === "mba" || cat === "arts") {
      return cat as CollegeCategory;
    }
  }

  // 2. Shortcode dictionary lookup
  const code = (college.short_code || "").toUpperCase().trim();
  if (code && COLLEGE_SHORTCODE_CATEGORY_MAP[code]) {
    return COLLEGE_SHORTCODE_CATEGORY_MAP[code];
  }

  // 3. Name heuristic fallback
  const name = (college.name || "").toLowerCase();
  if (name.includes("medical") || name.includes("hospital") || name.includes("aiims") || name.includes("health")) {
    return "medical";
  }
  if (name.includes("management") || name.includes("iim") || name.includes("business") || name.includes("xlri") || name.includes("fms")) {
    return "mba";
  }
  if (name.includes("arts") || name.includes("xavier") || name.includes("loyola") || name.includes("fergusson") || name.includes("hindu")) {
    return "arts";
  }

  return "engineering";
}

/**
 * Returns a human-friendly display label for a category.
 */
export function getCategoryLabel(category?: string | null): string {
  if (!category) return "Engineering";
  const cat = category.toLowerCase().trim();
  switch (cat) {
    case "medical":
      return "Medical";
    case "mba":
      return "MBA";
    case "arts":
      return "Arts";
    case "engineering":
    default:
      return "Engineering";
  }
}

/**
 * Filter options for the discovery interface.
 */
export const CATEGORY_FILTER_OPTIONS: Array<{
  id: "all" | CollegeCategory;
  label: string;
  shortLabel: string;
}> = [
  { id: "all", label: "All Streams", shortLabel: "All" },
  { id: "engineering", label: "Engineering", shortLabel: "Engineering" },
  { id: "medical", label: "Medical", shortLabel: "Medical" },
  { id: "mba", label: "MBA", shortLabel: "MBA" },
  { id: "arts", label: "Arts", shortLabel: "Arts" },
];

// Verified institutional facts for registered campuses
export interface CollegeMetadata {
  description: string;
  type: string;
  categoryTag?: string;
  established?: number;
}

export const INSTITUTIONAL_FACTS: Record<string, CollegeMetadata> = {
  // Engineering (8)
  IITB: {
    description: "Premier national institute for technical education, innovation, and engineering research in Powai.",
    type: "National Importance",
    categoryTag: "Research",
    established: 1958,
  },
  COEP: {
    description: "Historic public technical university on the Mula river, one of India's oldest engineering schools.",
    type: "Autonomous",
    categoryTag: "Placements",
    established: 1854,
  },
  VJTI: {
    description: "Pioneering state-funded technical institute in central Mumbai with extensive engineering heritage.",
    type: "Govt-Aided",
    categoryTag: "Infrastructure",
    established: 1887,
  },
  SFIT: {
    description: "Private engineering institution in Borivali West affiliated with the University of Mumbai.",
    type: "Private",
    categoryTag: "Affiliated",
    established: 1999,
  },
  SPIT: {
    description: "Autonomous engineering institute situated on the Munshi Nagar educational campus in Andheri.",
    type: "Autonomous",
    categoryTag: "Campus Life",
    established: 1962,
  },
  PICT: {
    description: "Prominent engineering institution in Dhankawadi renowned for computer technology and software disciplines.",
    type: "Private",
    categoryTag: "Academics",
    established: 1983,
  },
  WCE: {
    description: "Pioneer government-aided engineering college in Vishrambag, Sangli with historic regional prominence.",
    type: "Govt-Aided",
    categoryTag: "Heritage",
    established: 1947,
  },
  "VIT-MUM": {
    description: "Autonomous engineering and management campus located in Wadala East.",
    type: "Autonomous",
    categoryTag: "Innovation",
    established: 1999,
  },

  // Medical (5)
  "AIIMS-DEL": {
    description: "Apex national medical sciences institute and quaternary healthcare center in Ansari Nagar, New Delhi.",
    type: "National Importance",
    categoryTag: "Clinical & Research",
    established: 1956,
  },
  "CMC-VEL": {
    description: "Renowned autonomous healthcare education network and quaternary teaching hospital in Vellore.",
    type: "Autonomous Trust",
    categoryTag: "Healthcare Heritage",
    established: 1900,
  },
  "JIPMER-PDY": {
    description: "Premier autonomous medical education and clinical research institute situated in Gorimedu, Puducherry.",
    type: "National Importance",
    categoryTag: "Medical Sciences",
    established: 1823,
  },
  "KMC-MAN": {
    description: "Constituent medical college of MAHE with extensive clinical training facilities in coastal Karnataka.",
    type: "Deemed Constituent",
    categoryTag: "Clinical Training",
    established: 1953,
  },
  "AFMC-PUN": {
    description: "Elite Armed Forces medical institution commissioning graduate doctors directly into India's military services.",
    type: "Armed Forces Medical",
    categoryTag: "Combat Medicine",
    established: 1948,
  },

  // MBA (5)
  "IIMA-AHM": {
    description: "India's premier business school celebrated for its Louis Kahn heritage architecture and case method pedagogy.",
    type: "National Importance",
    categoryTag: "Strategy & Leadership",
    established: 1961,
  },
  "IIMB-BLR": {
    description: "Leading management institute with iconic B.V. Doshi stone architecture situated in India's technology capital.",
    type: "National Importance",
    categoryTag: "Consulting & Tech",
    established: 1973,
  },
  "IIMC-KOL": {
    description: "Pioneering business school situated on a 135-acre 7-lakes campus, famed for quantitative finance and analytics.",
    type: "National Importance",
    categoryTag: "Finance & Analytics",
    established: 1961,
  },
  "XLRI-JAM": {
    description: "India's oldest business school founded in 1949, world-renowned for human resource management and ethical leadership.",
    type: "Autonomous Jesuit",
    categoryTag: "HRM & Management",
    established: 1949,
  },
  "FMS-DEL": {
    description: "Legendary business faculty under the University of Delhi delivering peerless placement return on investment.",
    type: "Central University",
    categoryTag: "ROI & Enterprise",
    established: 1954,
  },

  // Arts (5)
  "HINDU-DEL": {
    description: "Historic central university college in DU North Campus with nationalist heritage and premier humanities programs.",
    type: "DU Constituent",
    categoryTag: "Humanities & Sciences",
    established: 1899,
  },
  "FC-PUN": {
    description: "Gothic heritage institution in Shivajinagar founded by Lokmanya Tilak and Deccan Education Society leaders.",
    type: "Govt-Aided Autonomous",
    categoryTag: "Heritage & Arts",
    established: 1885,
  },
  "SXC-MUM": {
    description: "Autonomous Jesuit heritage college in South Mumbai renowned for mass media, psychology, and the Malhar festival.",
    type: "Autonomous Jesuit",
    categoryTag: "Media & Arts",
    established: 1869,
  },
  "LOYOLA-CHE": {
    description: "Jesuit college of excellence in Chennai famed for visual communication, commerce, and mandatory social outreach.",
    type: "Autonomous Jesuit",
    categoryTag: "VisCom & Commerce",
    established: 1925,
  },
  "SXC-KOL": {
    description: "Historic Park Street Jesuit institution where Nobel Laureate Tagore studied, renowned for arts, media, and commerce.",
    type: "Autonomous Jesuit",
    categoryTag: "Arts & Media",
    established: 1860,
  },
};

export function getCollegePhoto(college: { short_code?: string; name: string }): string {
  const code = (college.short_code || "").toUpperCase();
  const name = (college.name || "").toLowerCase();

  // Engineering (8)
  if (code.includes("SFIT") || name.includes("francis")) {
    return "/images/colleges/sfit.jpg";
  }
  if (code.includes("VJTI") || name.includes("jijabai") || name.includes("veermata")) {
    return "/images/colleges/vjti.jpg";
  }
  if (code.includes("COEP") || (name.includes("pune") && name.includes("engineering"))) {
    return "/images/colleges/coep.jpg";
  }
  if (code.includes("IITB") || code.includes("IIT-B") || (name.includes("bombay") && name.includes("technology"))) {
    return "/images/colleges/iitb.jpg";
  }
  if (code.includes("SPIT") || name.includes("sardar patel")) {
    return "/images/colleges/spit.jpg";
  }
  if (code.includes("VIOT") || code.includes("VIT-MUM") || name.includes("vidyalankar")) {
    return "/images/colleges/vidyalankar.jpg";
  }
  if (code.includes("PICT") || name.includes("computer technology")) {
    return "/images/colleges/pict.jpg";
  }
  if (code.includes("WCE") || name.includes("walchand")) {
    return "/images/colleges/wce.jpg";
  }

  // Medical (5)
  if (code.includes("AIIMS") || name.includes("all india institute of medical")) {
    return "/images/colleges/aiims-del.jpg";
  }
  if (code.includes("CMC") || name.includes("christian medical")) {
    return "/images/colleges/cmc-vel.jpg";
  }
  if (code.includes("JIPMER") || name.includes("jawaharlal institute of postgraduate")) {
    return "/images/colleges/jipmer-pdy.jpg";
  }
  if (code.includes("KMC") || name.includes("kasturba medical")) {
    return "/images/colleges/kmc-man.jpg";
  }
  if (code.includes("AFMC") || name.includes("armed forces medical")) {
    return "/images/colleges/afmc-pun.jpg";
  }

  // MBA (5)
  if (code.includes("IIMA") || (name.includes("management") && name.includes("ahmedabad"))) {
    return "/images/colleges/iima-ahm.jpg";
  }
  if (code.includes("IIMB") || (name.includes("management") && name.includes("bangalore"))) {
    return "/images/colleges/iimb-blr.jpg";
  }
  if (code.includes("IIMC") || (name.includes("management") && name.includes("calcutta"))) {
    return "/images/colleges/iimc-kol.jpg";
  }
  if (code.includes("XLRI") || name.includes("xavier school of management")) {
    return "/images/colleges/xlri-jam.jpg";
  }
  if (code.includes("FMS") || name.includes("faculty of management studies")) {
    return "/images/colleges/fms-del.jpg";
  }

  // Arts (5)
  if (code.includes("HINDU") || name.includes("hindu college")) {
    return "/images/colleges/hindu-del.jpg";
  }
  if (code.includes("FC-PUN") || (name.includes("fergusson") && name.includes("pune"))) {
    return "/images/colleges/fc-pun.jpg";
  }
  if (code.includes("SXC-MUM") || (name.includes("xavier") && name.includes("mumbai"))) {
    return "/images/colleges/sxc-mum.jpg";
  }
  if (code.includes("LOYOLA") || name.includes("loyola")) {
    return "/images/colleges/loyola-che.jpg";
  }
  if (code.includes("SXC-KOL") || (name.includes("xavier") && (name.includes("kolkata") || name.includes("calcutta")))) {
    return "/images/colleges/sxc-kol.jpg";
  }

  return "/images/colleges/default.jpg";
}

export function getCollegeCardTags(college: CollegeSummary): string[] {
  const code = (college.short_code || "").toUpperCase();
  const category = getCollegeCategory(college);
  const categoryLabel = getCategoryLabel(category);
  const fact = INSTITUTIONAL_FACTS[code];
  const list = [categoryLabel];
  if (fact?.type) list.push(fact.type);
  if (fact?.categoryTag) list.push(fact.categoryTag);
  return list;
}

export {
  BASE_INSTITUTIONAL_SCORE,
  THRESHOLD_BLOCK_SIZE,
  calculateStudentOverallRating,
  calculateCollegeStudentExperienceAverage,
  classifyRatingCategory,
  getStudentExperienceAverage,
  formatInstitutionalScore,
  formatStudentExperience,
  formatParameterRating,
} from "../../lib/scoring.ts";

export function formatCollegeScore(score: number): string {
  return `${Math.round(score)}/100`;
}
