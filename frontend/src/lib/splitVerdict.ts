/**
 * ============================================================================
 * CAMPUS UNCUT — SPLIT VERDICT CLASSIFICATION ENGINE
 * ============================================================================
 * Evidence-aware dispersion and consensus assessment across student ratings.
 * 
 * Rating scale interpretation:
 *   - Low:     score < 4.0  (ratings 1, 2, 3)
 *   - Neutral: 4.0 <= score < 8.0 (ratings 4, 5, 6, 7)
 *   - High:    score >= 8.0 (ratings 8, 9, 10)
 * 
 * Evidence strength rules:
 *   - < 5 responses:   Early signal (insufficient for consensus)
 *   - 5–19 responses:  Limited evidence
 *   - 20+ responses:   Broader feedback
 * 
 * Disagreement is strictly distinguished from a low average:
 *   - Unified low ratings represent consensus/agreement on a shortcoming.
 *   - Disagreement represents a polarized or bimodal distribution across Low & High.
 * ============================================================================
 */

import type { ParameterDistribution } from "../types/college";

export type VerdictType =
  | "insufficient_evidence"
  | "split_verdict"
  | "agreement_high"
  | "agreement_low"
  | "agreement_neutral"
  | "mixed_feedback";

export interface SplitVerdictAnalysis {
  verdictType: VerdictType;
  verdictLabel: string;
  badgeColorClass: string;
  badgeBorderClass: string;
  textColorClass: string;
  summary: string;
  rationale: string;
  totalNumericVotes: number;
  lowVotes: number;
  neutralVotes: number;
  highVotes: number;
  lowPct: number;
  neutralPct: number;
  highPct: number;
  meanScore: number | null;
  standardDeviation: number | null;
  evidenceStrength: "insufficient" | "early_signal" | "limited_evidence" | "broader_feedback";
  evidenceStrengthLabel: string;
  isPolarized: boolean;
}

/**
 * Calculates full Split Verdict analysis from a set of distributions or score counts.
 */
export function analyzeSplitVerdict(
  distributions: ParameterDistribution[] = [],
  knownAverage?: number | null,
  knownTotalCount?: number
): SplitVerdictAnalysis {
  const freqByScore: Record<number, number> = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0,
  };

  let totalNumericVotes = 0;
  let sumScores = 0;

  distributions.forEach((d) => {
    if (d.rating_score >= 1 && d.rating_score <= 10 && d.frequency > 0) {
      freqByScore[d.rating_score] = (freqByScore[d.rating_score] || 0) + d.frequency;
      totalNumericVotes += d.frequency;
      sumScores += d.rating_score * d.frequency;
    }
  });

  // Fallback to knownTotalCount if distributions were empty
  if (totalNumericVotes === 0 && knownTotalCount && knownTotalCount > 0) {
    totalNumericVotes = knownTotalCount;
  }

  const lowVotes = freqByScore[1] + freqByScore[2] + freqByScore[3];
  const neutralVotes = freqByScore[4] + freqByScore[5] + freqByScore[6] + freqByScore[7];
  const highVotes = freqByScore[8] + freqByScore[9] + freqByScore[10];

  const lowPct = totalNumericVotes > 0 ? (lowVotes / totalNumericVotes) * 100 : 0;
  const neutralPct = totalNumericVotes > 0 ? (neutralVotes / totalNumericVotes) * 100 : 0;
  const highPct = totalNumericVotes > 0 ? (highVotes / totalNumericVotes) * 100 : 0;

  const meanScore =
    knownAverage !== undefined && knownAverage !== null
      ? knownAverage
      : totalNumericVotes > 0
      ? sumScores / totalNumericVotes
      : null;

  // Calculate standard deviation if we have raw distributions
  let standardDeviation: number | null = null;
  if (totalNumericVotes > 1 && meanScore !== null) {
    let varianceSum = 0;
    for (let s = 1; s <= 10; s++) {
      const f = freqByScore[s] || 0;
      if (f > 0) {
        varianceSum += f * Math.pow(s - meanScore, 2);
      }
    }
    standardDeviation = Math.sqrt(varianceSum / totalNumericVotes);
  }

  // Evidence Strength Classification
  let evidenceStrength: "insufficient" | "early_signal" | "limited_evidence" | "broader_feedback";
  let evidenceStrengthLabel: string;

  if (totalNumericVotes < 5) {
    evidenceStrength = totalNumericVotes === 0 ? "insufficient" : "early_signal";
    evidenceStrengthLabel =
      totalNumericVotes === 0
        ? "No feedback yet"
        : `Early Signal (${totalNumericVotes} response${totalNumericVotes !== 1 ? "s" : ""})`;
  } else if (totalNumericVotes < 20) {
    evidenceStrength = "limited_evidence";
    evidenceStrengthLabel = `Limited Evidence (${totalNumericVotes} responses)`;
  } else {
    evidenceStrength = "broader_feedback";
    evidenceStrengthLabel = `Broader Feedback (${totalNumericVotes} responses)`;
  }

  // Insufficient Evidence Case
  if (totalNumericVotes < 5) {
    return {
      verdictType: "insufficient_evidence",
      verdictLabel: "Awaiting Student Data",
      badgeColorClass: "bg-warm-grey-light/70",
      badgeBorderClass: "border-warm-grey",
      textColorClass: "text-charcoal-muted",
      summary: "Not enough student feedback yet.",
      rationale:
        totalNumericVotes === 0
          ? "No authenticated ratings have been submitted for this parameter yet."
          : `Only ${totalNumericVotes} response${totalNumericVotes !== 1 ? "s" : ""} recorded. A minimum of 5 responses is required to assess consensus or disagreement reliably.`,
      totalNumericVotes,
      lowVotes,
      neutralVotes,
      highVotes,
      lowPct,
      neutralPct,
      highPct,
      meanScore,
      standardDeviation,
      evidenceStrength,
      evidenceStrengthLabel,
      isPolarized: false,
    };
  }

  // Polarization test: both Low (1-3) and High (8-10) have substantial representation (>= 20% each)
  const isPolarized = lowPct >= 20 && highPct >= 20;

  // Dispersion test: standard deviation > 2.2 with neither pole dominating >= 60%
  const isWidelyDispersed =
    standardDeviation !== null && standardDeviation >= 2.2 && lowPct < 60 && highPct < 60;

  // Verdict Assignment
  if (isPolarized || isWidelyDispersed) {
    return {
      verdictType: "split_verdict",
      verdictLabel: "Split Verdict (Divided Opinions)",
      badgeColorClass: "bg-amber-100",
      badgeBorderClass: "border-amber-300",
      textColorClass: "text-amber-900",
      summary: "Students report substantially different experiences.",
      rationale: `Feedback is meaningfully polarized: ${lowPct.toFixed(0)}% low ratings (<4.0) vs. ${highPct.toFixed(0)}% high ratings (≥8.0). Student satisfaction varies widely by department, year, or cohort.`,
      totalNumericVotes,
      lowVotes,
      neutralVotes,
      highVotes,
      lowPct,
      neutralPct,
      highPct,
      meanScore,
      standardDeviation,
      evidenceStrength,
      evidenceStrengthLabel,
      isPolarized: true,
    };
  }

  if (highPct >= 60 || (meanScore !== null && meanScore >= 7.5 && lowPct < 15)) {
    return {
      verdictType: "agreement_high",
      verdictLabel: "Broad Consensus — High",
      badgeColorClass: "bg-emerald-100",
      badgeBorderClass: "border-emerald-300",
      textColorClass: "text-emerald-900",
      summary: "Strong student agreement on positive experience.",
      rationale: `${highPct.toFixed(0)}% of responses rated 8–10 (average: ${meanScore?.toFixed(1) || "—"}/10). Lived feedback shows consistent satisfaction.`,
      totalNumericVotes,
      lowVotes,
      neutralVotes,
      highVotes,
      lowPct,
      neutralPct,
      highPct,
      meanScore,
      standardDeviation,
      evidenceStrength,
      evidenceStrengthLabel,
      isPolarized: false,
    };
  }

  if (lowPct >= 60 || (meanScore !== null && meanScore < 4.0 && highPct < 15)) {
    return {
      verdictType: "agreement_low",
      verdictLabel: "Broad Consensus — Critical",
      badgeColorClass: "bg-rose-100",
      badgeBorderClass: "border-rose-300",
      textColorClass: "text-rose-900",
      summary: "Strong student agreement on shortcomings.",
      rationale: `${lowPct.toFixed(0)}% of responses rated below 4.0 (average: ${meanScore?.toFixed(1) || "—"}/10). Students consistently report issues here (unified critical agreement, not a split opinion).`,
      totalNumericVotes,
      lowVotes,
      neutralVotes,
      highVotes,
      lowPct,
      neutralPct,
      highPct,
      meanScore,
      standardDeviation,
      evidenceStrength,
      evidenceStrengthLabel,
      isPolarized: false,
    };
  }

  if (neutralPct >= 50) {
    return {
      verdictType: "agreement_neutral",
      verdictLabel: "Consensus — Moderate / Balanced",
      badgeColorClass: "bg-warm-grey",
      badgeBorderClass: "border-warm-grey-dark",
      textColorClass: "text-charcoal",
      summary: "Clustered around mid-tier expectations.",
      rationale: `${neutralPct.toFixed(0)}% of responses fell in the 4.0–7.9 neutral band. Students describe conditions as typical or acceptable without extreme sentiment.`,
      totalNumericVotes,
      lowVotes,
      neutralVotes,
      highVotes,
      lowPct,
      neutralPct,
      highPct,
      meanScore,
      standardDeviation,
      evidenceStrength,
      evidenceStrengthLabel,
      isPolarized: false,
    };
  }

  return {
    verdictType: "mixed_feedback",
    verdictLabel: "Moderate Spread",
    badgeColorClass: "bg-warm-grey-light",
    badgeBorderClass: "border-warm-grey",
    textColorClass: "text-charcoal",
    summary: "Balanced distribution across rating levels.",
    rationale: `Ratings span across score bands without extreme clustering or sharp polarization (${lowPct.toFixed(0)}% low, ${neutralPct.toFixed(0)}% neutral, ${highPct.toFixed(0)}% high).`,
    totalNumericVotes,
    lowVotes,
    neutralVotes,
    highVotes,
    lowPct,
    neutralPct,
    highPct,
    meanScore,
    standardDeviation,
    evidenceStrength,
    evidenceStrengthLabel,
    isPolarized: false,
  };
}
