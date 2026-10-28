/**
 * CAMPUS UNCUT — DETERMINISTIC SCORING ENGINE SIMULATION
 * 
 * Implements the exact scoring algorithm from backend/app/services/scoring.py
 * and backend/app/core/constants.py for isolated, safe demonstration.
 * 
 * Strict invariants:
 * - BASE_SCORE = 100
 * - SCORE_BLOCK_SIZE = 20
 * - LOW_THRESHOLD = 4.0  (mean < 4.0 -> 'low')
 * - HIGH_THRESHOLD = 8.0 (mean >= 8.0 -> 'high')
 * - SCORE_DELTA_LOW = -1
 * - SCORE_DELTA_HIGH = +1
 * - Neutral contributions (4.0 <= mean < 8.0) never trigger block crossings.
 * - Score changes ONLY when: new_count // 20 > old_count // 20
 */

export const BASE_SCORE = 100;
export const SCORE_BLOCK_SIZE = 20;
export const LOW_THRESHOLD = 4.0;
export const HIGH_THRESHOLD = 8.0;
export const SCORE_DELTA_LOW = -1;
export const SCORE_DELTA_HIGH = 1;

export type ScoreCategory = "low" | "neutral" | "high";

export interface SimulatedContribution {
  index: number;
  respondentAlias: string;
  unroundedMean: number;
  category: ScoreCategory;
  oldCount: number;
  newCount: number;
  hasCrossed: boolean;
  blockNumber: number | null;
  scoreDelta: number | null;
  scoreBefore: number;
  scoreAfter: number;
  explanation: string;
}

export interface ScoreProgressionState {
  collegeName: string;
  shortCode: string;
  initialScore: number;
  currentScore: number;
  totalQualifyingLow: number;
  totalQualifyingNeutral: number;
  totalQualifyingHigh: number;
  contributions: SimulatedContribution[];
  lastEventDescription: string | null;
}

/**
 * Classifies an exact unrounded arithmetic mean into 'low', 'neutral', or 'high'.
 * Matching backend/app/services/scoring.py:classify_category
 */
export function classifyCategory(unroundedMean: number): ScoreCategory {
  if (unroundedMean < LOW_THRESHOLD) {
    return "low";
  }
  if (unroundedMean < HIGH_THRESHOLD) {
    return "neutral";
  }
  return "high";
}

/**
 * Checks if a contribution crosses a new block of 20.
 * Matching backend/app/services/scoring.py:check_threshold_crossing
 */
export function checkThresholdCrossing(
  category: ScoreCategory,
  oldCount: number,
  newCount: number
): { hasCrossed: boolean; blockNumber: number | null; scoreDelta: number | null } {
  if (category !== "low" && category !== "high") {
    return { hasCrossed: false, blockNumber: null, scoreDelta: null };
  }

  const oldBlock = Math.floor(oldCount / SCORE_BLOCK_SIZE);
  const newBlock = Math.floor(newCount / SCORE_BLOCK_SIZE);

  if (newBlock > oldBlock && newBlock > 0) {
    const scoreDelta = category === "low" ? SCORE_DELTA_LOW : SCORE_DELTA_HIGH;
    return { hasCrossed: true, blockNumber: newBlock, scoreDelta };
  }

  return { hasCrossed: false, blockNumber: null, scoreDelta: null };
}

/**
 * Initializes a clean simulated college score state at BASE_SCORE (100).
 */
export function createInitialSimulatedState(
  collegeName: string,
  shortCode: string
): ScoreProgressionState {
  return {
    collegeName,
    shortCode,
    initialScore: BASE_SCORE,
    currentScore: BASE_SCORE,
    totalQualifyingLow: 0,
    totalQualifyingNeutral: 0,
    totalQualifyingHigh: 0,
    contributions: [],
    lastEventDescription: "Initialized at baseline score 100 with 0 qualifying contributions.",
  };
}

/**
 * Appends a simulated contribution and deterministically updates score state.
 */
export function addSimulatedContribution(
  state: ScoreProgressionState,
  unroundedMean: number,
  respondentAlias?: string
): ScoreProgressionState {
  const category = classifyCategory(unroundedMean);
  const scoreBefore = state.currentScore;

  let oldCount = 0;
  let newTotalLow = state.totalQualifyingLow;
  let newTotalNeutral = state.totalQualifyingNeutral;
  let newTotalHigh = state.totalQualifyingHigh;

  if (category === "low") {
    oldCount = state.totalQualifyingLow;
    newTotalLow = oldCount + 1;
  } else if (category === "neutral") {
    oldCount = state.totalQualifyingNeutral;
    newTotalNeutral = oldCount + 1;
  } else {
    oldCount = state.totalQualifyingHigh;
    newTotalHigh = oldCount + 1;
  }

  const newCount = oldCount + 1;
  const { hasCrossed, blockNumber, scoreDelta } = checkThresholdCrossing(category, oldCount, newCount);

  const scoreAfter = hasCrossed && scoreDelta !== null ? scoreBefore + scoreDelta : scoreBefore;

  let explanation = "";
  if (hasCrossed && blockNumber !== null && scoreDelta !== null) {
    explanation = `Contribution #${newCount} completed Block #${blockNumber} (${oldCount} -> ${newCount}). Score adjusted ${scoreBefore} -> ${scoreAfter} (${scoreDelta > 0 ? "+" : ""}${scoreDelta}).`;
  } else if (category === "neutral") {
    explanation = `Neutral contribution (mean ${unroundedMean.toFixed(2)}) is tracked for analytics but does not trigger score progression.`;
  } else {
    const remaining = SCORE_BLOCK_SIZE - (newCount % SCORE_BLOCK_SIZE);
    explanation = `Contribution #${newCount} recorded in Category '${category}'. ${remaining} more qualifying submission(s) required to complete Block #${Math.floor(newCount / SCORE_BLOCK_SIZE) + 1}. Score remains ${scoreBefore}.`;
  }

  const contribution: SimulatedContribution = {
    index: state.contributions.length + 1,
    respondentAlias: respondentAlias || `Simulated Student #${state.contributions.length + 1} (Synthetic Demo)`,
    unroundedMean,
    category,
    oldCount,
    newCount,
    hasCrossed,
    blockNumber,
    scoreDelta,
    scoreBefore,
    scoreAfter,
    explanation,
  };

  return {
    ...state,
    currentScore: scoreAfter,
    totalQualifyingLow: newTotalLow,
    totalQualifyingNeutral: newTotalNeutral,
    totalQualifyingHigh: newTotalHigh,
    contributions: [...state.contributions, contribution],
    lastEventDescription: explanation,
  };
}

/**
 * Simulates a sequence of N contributions of a specific category ('high' or 'low').
 */
export function simulateBatchSequence(
  collegeName: string,
  shortCode: string,
  count: number,
  targetCategory: "high" | "low"
): ScoreProgressionState {
  let state = createInitialSimulatedState(collegeName, shortCode);

  // Realistic synthetic rating averages
  const sampleMeans =
    targetCategory === "high"
      ? [8.4, 8.8, 9.1, 8.2, 8.6, 9.0, 8.7, 8.3, 8.9, 9.2, 8.5, 8.7, 9.4, 8.6, 8.8, 8.2, 9.1, 8.9, 8.5, 9.0]
      : [3.2, 2.8, 3.6, 2.5, 3.1, 3.8, 2.9, 3.4, 2.7, 3.5, 3.0, 2.6, 3.7, 2.4, 3.3, 3.9, 2.8, 3.2, 3.5, 2.9];

  for (let i = 0; i < count; i++) {
    const mean = sampleMeans[i % sampleMeans.length];
    state = addSimulatedContribution(
      state,
      mean,
      `Simulated ${targetCategory === "high" ? "Advocate" : "Critical"} Respondent #${i + 1} (Synthetic Demo)`
    );
  }

  return state;
}
