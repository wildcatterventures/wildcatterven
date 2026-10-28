/**
 * ============================================================================
 * CAMPUS UNCUT — UNCUT MATCH ENGINE LOGIC
 * ============================================================================
 * Calculates evidence-backed personalized fit scores based on student priorities.
 * 
 * Rules:
 *   1. Normalizes user weights: Changing weights directly shifts college ranks.
 *   2. Missing data is never treated as zero: Missing categories are omitted
 *      from the score calculation and tracked explicitly under missingEvidence.
 *   3. Evidence coverage: Tracks what fraction of user-selected priorities have data.
 *   4. Trade-off detection: Identifies genuine weaker areas backed by student ratings.
 *   5. Discloses that fit score is personalized, not an official college ranking.
 * ============================================================================
 */

import type { CollegeRatingReport, CollegeSummary } from "../types/college";
import { THEMATIC_CATEGORIES, type ThematicCategory } from "./thematicCategories.ts";

export interface CategoryPriority {
  categoryId: string;
  weight: number; // 0 to 5 (0 = ignored, 1 = low, 3 = medium, 5 = critical)
}

export interface CollegeMatchResult {
  collegeId: string;
  collegeName: string;
  city: string;
  state: string;
  shortCode: string;
  isDemo: boolean;
  officialScore: number;
  totalSubmissions: number;
  totalNumericVotes: number;
  personalizedFitScore: number; // 0 to 100
  evidenceCoveragePct: number; // 0 to 100
  totalPrioritiesSelected: number;
  prioritiesWithData: number;
  matchHighlight: string;
  strongestCategory: {
    categoryName: string;
    averageScore: number;
    responseCount: number;
  } | null;
  tradeOffCategory: {
    categoryName: string;
    averageScore: number;
    responseCount: number;
  } | null;
  categoryScores: Record<
    string,
    {
      categoryName: string;
      averageScore: number | null;
      responseCount: number;
      weight: number;
      hasData: boolean;
    }
  >;
  missingCategories: string[];
  evidenceStrength: "insufficient" | "early_signal" | "limited_evidence" | "broader_feedback";
  evidenceStrengthLabel: string;
}

export interface MatchEngineInput {
  colleges: CollegeSummary[];
  reports: Record<string, CollegeRatingReport>;
  priorities: Record<string, number>; // categoryId -> weight (1-5)
  minCoveragePct?: number; // default 0
}

/**
 * Computes category-level average and response counts from a college rating report.
 */
export function getCollegeCategoryMetrics(
  report: CollegeRatingReport,
  category: ThematicCategory
): { avg: number | null; responseCount: number; scoredCount: number } {
  const catParams = report.parameters.filter((p) =>
    category.parameterKeys.includes(p.parameter_key)
  );

  const scoredParams = catParams.filter((p) => p.average_score !== null && p.average_score !== undefined);
  const totalVotes = catParams.reduce((sum, p) => sum + (p.numeric_response_count || 0), 0);

  if (scoredParams.length === 0 || totalVotes === 0) {
    return { avg: null, responseCount: 0, scoredCount: 0 };
  }

  const avg =
    scoredParams.reduce((sum, p) => sum + (p.average_score || 0), 0) / scoredParams.length;

  return {
    avg,
    responseCount: totalVotes,
    scoredCount: scoredParams.length,
  };
}

/**
 * Calculates match recommendations for all colleges based on active user priorities.
 */
export function calculateMatches({
  colleges,
  reports,
  priorities,
  minCoveragePct = 0,
}: MatchEngineInput): CollegeMatchResult[] {
  // Extract active priorities (weight > 0)
  const activePriorities = Object.entries(priorities).filter(([_, w]) => w > 0);

  if (activePriorities.length === 0) {
    return [];
  }

  const results: CollegeMatchResult[] = [];

  for (const college of colleges) {
    const report = reports[college.college_id];

    let weightedSum = 0;
    let sumNormalizedWeights = 0;
    let prioritiesWithData = 0;
    let totalNumericVotes = 0;

    const categoryScores: CollegeMatchResult["categoryScores"] = {};
    const missingCategories: string[] = [];

    const scoredCategoriesList: {
      categoryId: string;
      categoryName: string;
      avg: number;
      responseCount: number;
      weightedContribution: number;
    }[] = [];

    for (const [catId, userWeight] of activePriorities) {
      const catObj = THEMATIC_CATEGORIES.find((c) => c.id === catId);
      const catName = catObj?.name || catId;

      if (!report) {
        categoryScores[catId] = {
          categoryName: catName,
          averageScore: null,
          responseCount: 0,
          weight: userWeight,
          hasData: false,
        };
        missingCategories.push(catName);
        continue;
      }

      const metrics = catObj
        ? getCollegeCategoryMetrics(report, catObj)
        : { avg: null, responseCount: 0, scoredCount: 0 };

      if (metrics.avg !== null && metrics.responseCount > 0) {
        prioritiesWithData += 1;
        totalNumericVotes += metrics.responseCount;
        weightedSum += metrics.avg * userWeight;
        sumNormalizedWeights += userWeight;

        categoryScores[catId] = {
          categoryName: catName,
          averageScore: metrics.avg,
          responseCount: metrics.responseCount,
          weight: userWeight,
          hasData: true,
        };

        scoredCategoriesList.push({
          categoryId: catId,
          categoryName: catName,
          avg: metrics.avg,
          responseCount: metrics.responseCount,
          weightedContribution: metrics.avg * userWeight,
        });
      } else {
        categoryScores[catId] = {
          categoryName: catName,
          averageScore: null,
          responseCount: 0,
          weight: userWeight,
          hasData: false,
        };
        missingCategories.push(catName);
      }
    }

    const coveragePct = Math.round((prioritiesWithData / activePriorities.length) * 100);

    // If no evidence is present for any user priority, fit score is 0 with 0% coverage
    const rawFitScore =
      sumNormalizedWeights > 0 ? (weightedSum / sumNormalizedWeights) * 10 : 0;
    const personalizedFitScore = Math.round(rawFitScore);

    // Evidence strength label
    let evidenceStrength: CollegeMatchResult["evidenceStrength"];
    let evidenceStrengthLabel: string;

    if (totalNumericVotes < 5) {
      evidenceStrength = totalNumericVotes === 0 ? "insufficient" : "early_signal";
      evidenceStrengthLabel =
        totalNumericVotes === 0
          ? "No student data"
          : `Early Signal (${totalNumericVotes} votes)`;
    } else if (totalNumericVotes < 20) {
      evidenceStrength = "limited_evidence";
      evidenceStrengthLabel = `Limited Evidence (${totalNumericVotes} votes)`;
    } else {
      evidenceStrength = "broader_feedback";
      evidenceStrengthLabel = `Broader Feedback (${totalNumericVotes} votes)`;
    }

    // Strongest Category (highest weighted average among rated priorities)
    scoredCategoriesList.sort((a, b) => b.avg - a.avg);
    const strongestCategory =
      scoredCategoriesList.length > 0
        ? {
            categoryName: scoredCategoriesList[0].categoryName,
            averageScore: scoredCategoriesList[0].avg,
            responseCount: scoredCategoriesList[0].responseCount,
          }
        : null;

    // Trade-off Category: lowest score among user priorities with data (only if <= 5.5)
    let tradeOffCategory: CollegeMatchResult["tradeOffCategory"] = null;
    if (scoredCategoriesList.length > 1) {
      const lowestScored = scoredCategoriesList[scoredCategoriesList.length - 1];
      if (lowestScored.avg <= 6.0) {
        tradeOffCategory = {
          categoryName: lowestScored.categoryName,
          averageScore: lowestScored.avg,
          responseCount: lowestScored.responseCount,
        };
      }
    }

    // Why it matches highlight
    let matchHighlight: string;
    if (prioritiesWithData === 0) {
      matchHighlight = "Awaiting student evaluations for your selected priorities.";
    } else if (strongestCategory && strongestCategory.averageScore >= 7.5) {
      matchHighlight = `High match for your priority in ${strongestCategory.categoryName} (${strongestCategory.averageScore.toFixed(1)}/10).`;
    } else if (strongestCategory) {
      matchHighlight = `Highest alignment in ${strongestCategory.categoryName} (${strongestCategory.averageScore.toFixed(1)}/10).`;
    } else {
      matchHighlight = "Balanced student feedback across selected criteria.";
    }

    if (coveragePct >= minCoveragePct) {
      results.push({
        collegeId: college.college_id,
        collegeName: college.name,
        city: college.city,
        state: college.state,
        shortCode: college.short_code,
        isDemo: college.is_demo,
        officialScore: college.current_score,
        totalSubmissions: college.total_submitted_sessions,
        totalNumericVotes,
        personalizedFitScore,
        evidenceCoveragePct: coveragePct,
        totalPrioritiesSelected: activePriorities.length,
        prioritiesWithData,
        matchHighlight,
        strongestCategory,
        tradeOffCategory,
        categoryScores,
        missingCategories,
        evidenceStrength,
        evidenceStrengthLabel,
      });
    }
  }

  // Sort by fit score descending, then coverage descending, then votes descending
  results.sort((a, b) => {
    if (b.personalizedFitScore !== a.personalizedFitScore) {
      return b.personalizedFitScore - a.personalizedFitScore;
    }
    if (b.evidenceCoveragePct !== a.evidenceCoveragePct) {
      return b.evidenceCoveragePct - a.evidenceCoveragePct;
    }
    return b.totalNumericVotes - a.totalNumericVotes;
  });

  return results;
}
