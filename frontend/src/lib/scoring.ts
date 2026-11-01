import type { CollegeSummary, CollegeRatingReport } from "../types/college";

/**
 * Baseline institutional score constant (100).
 * Every college starts at 100/100 and only moves by +/- 1 for every 20 qualifying students.
 */
export const BASE_INSTITUTIONAL_SCORE = 100;

/**
 * Threshold block size (20 students).
 */
export const THRESHOLD_BLOCK_SIZE = 20;

/**
 * Calculate arithmetic mean of a student's numeric parameter ratings out of 10.
 * Rules:
 * - All parameters have equal weight.
 * - Excludes 'No View' answers.
 * - Never treats 'No View' or unanswered as zero.
 * - Returns null if no numeric answers exist.
 */
export function calculateStudentOverallRating(
  answers: Array<{ score: number | null | undefined; is_no_view?: boolean }>
): number | null {
  const numeric = answers
    .filter(
      (a) =>
        !a.is_no_view &&
        a.score !== null &&
        a.score !== undefined &&
        a.score >= 1 &&
        a.score <= 10
    )
    .map((a) => a.score as number);

  if (numeric.length === 0) return null;
  const sum = numeric.reduce((acc, val) => acc + val, 0);
  return sum / numeric.length;
}

/**
 * Calculate college-wide Student Experience Average from submitted rating sessions:
 * AVG(rating_sessions.calculated_overall_rating)
 * Rules:
 * - Grouped by college.
 * - Excludes NULL overall ratings.
 * - Returns null if no valid numeric overall ratings exist.
 */
export function calculateCollegeStudentExperienceAverage(
  sessionOverallRatings: Array<number | null | undefined>
): number | null {
  const valid = sessionOverallRatings.filter(
    (r): r is number => typeof r === "number" && !isNaN(r) && r >= 1 && r <= 10
  );
  if (valid.length === 0) return null;
  const sum = valid.reduce((acc, r) => acc + r, 0);
  return sum / valid.length;
}

/**
 * Classify a student overall rating into low, neutral, or high.
 * - < 4.0 -> low
 * - 4.0 <= rating < 8.0 -> neutral
 * - >= 8.0 -> high
 */
export function classifyRatingCategory(
  unroundedRating: number | null | undefined
): "low" | "neutral" | "high" | null {
  if (unroundedRating === null || unroundedRating === undefined || isNaN(unroundedRating)) {
    return null;
  }
  if (unroundedRating < 4.0) return "low";
  if (unroundedRating < 8.0) return "neutral";
  return "high";
}

/**
 * Resolve the dynamic Student Experience Average for a college.
 * Consumes the API dynamic aggregate field directly if available on college or report:
 * AVG(rating_sessions.calculated_overall_rating).
 * 
 * Strictly avoids:
 * - Hardcoded runtime fallbacks.
 * - Averaging the 25 parameter averages (which are separate statistics).
 * 
 * Returns null if no ratings exist or if the API does not expose the session aggregate.
 */
export function getStudentExperienceAverage(
  college: CollegeSummary,
  report?: CollegeRatingReport | null
): number | null {
  // 1. If college has explicit student_experience_average from API
  if (typeof college.student_experience_average === "number") {
    return college.student_experience_average;
  }

  // 2. If report has explicit student_experience_average from API
  if (report && typeof report.student_experience_average === "number") {
    return report.student_experience_average;
  }

  // No hardcoded fallbacks and no averaging of parameter averages
  return null;
}

/**
 * Format Institutional College Score out of 100.
 * NEVER divides by 10 or adds stars.
 * Example: "100/100", "99/100", "101/100".
 */
export function formatInstitutionalScore(score: number): string {
  return `${Math.round(score)}/100`;
}

/**
 * Format Student Experience Average out of 10.
 * Example: "7.6/10", "8.5/10", or "No ratings yet".
 */
export function formatStudentExperience(avg: number | null | undefined): string {
  if (avg === null || avg === undefined || isNaN(avg)) {
    return "No ratings yet";
  }
  return `${avg.toFixed(1)}/10`;
}

/**
 * Format individual parameter rating out of 10.
 * Example: "8.3/10" or "Not rated yet".
 */
export function formatParameterRating(score: number | null | undefined): string {
  if (score === null || score === undefined || isNaN(score)) {
    return "Not rated yet";
  }
  return `${score.toFixed(1)}/10`;
}
