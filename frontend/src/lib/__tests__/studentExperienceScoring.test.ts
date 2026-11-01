import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  BASE_INSTITUTIONAL_SCORE,
  THRESHOLD_BLOCK_SIZE,
  calculateStudentOverallRating,
  calculateCollegeStudentExperienceAverage,
  classifyRatingCategory,
  getStudentExperienceAverage,
  formatInstitutionalScore,
  formatStudentExperience,
  formatParameterRating,
} from "../scoring.ts";
import * as scoringModule from "../scoring.ts";
import { checkThresholdCrossing } from "../scoringSimulation.ts";
import type { CollegeSummary, CollegeRatingReport } from "../../types/college";

describe("Campus Uncut — Core Scoring System (100-Point Institutional & 10-Point Student Experience)", () => {
  // Isolated test fixture simulating raw submitted session overall ratings in the database
  const TEST_FIXTURE_HISTORICAL_SESSION_RATINGS: Record<string, number[]> = {
    IITB: [9.240, 7.208, 9.080], // 3 submitted sessions -> AVG = 8.50933... -> 8.51
    COEP: [7.217],               // 1 submitted session  -> AVG = 7.217    -> 7.22
    PICT: [7.680],               // 1 submitted session  -> AVG = 7.680    -> 7.68
    SPIT: [5.520],               // 1 submitted session  -> AVG = 5.520    -> 5.52
    SFIT: [10.000],              // 1 submitted session  -> AVG = 10.000   -> 10.00
  };

  describe("1. Student Experience Rating (/10 Scale) & Parameter Averages", () => {
    it("calculates arithmetic mean of numeric parameter ratings independently", () => {
      // Example: Food=8, Professors=7, Infrastructure=9, Hostel=6, Safety=8 -> 7.6/10
      const answers = [
        { score: 8, is_no_view: false },
        { score: 7, is_no_view: false },
        { score: 9, is_no_view: false },
        { score: 6, is_no_view: false },
        { score: 8, is_no_view: false },
      ];
      const mean = calculateStudentOverallRating(answers);
      assert.equal(mean, 7.6);
      assert.equal(formatStudentExperience(mean), "7.6/10");
    });

    it("strictly excludes 'No View' answers and does not treat No View as zero", () => {
      // 5 numeric answers (sum=38, mean=7.6) and 20 'No View' answers
      const answers = [
        { score: 8, is_no_view: false },
        { score: 7, is_no_view: false },
        { score: 9, is_no_view: false },
        { score: 6, is_no_view: false },
        { score: 8, is_no_view: false },
        ...Array.from({ length: 20 }, () => ({ score: null, is_no_view: true })),
      ];
      const mean = calculateStudentOverallRating(answers);
      assert.equal(mean, 7.6);
      assert.equal(formatStudentExperience(mean), "7.6/10");
    });

    it("returns null if all answers are 'No View' or no numeric answers exist", () => {
      const allNoView = Array.from({ length: 25 }, () => ({ score: null, is_no_view: true }));
      assert.equal(calculateStudentOverallRating(allNoView), null);
      assert.equal(formatStudentExperience(null), "No ratings yet");
      assert.equal(formatStudentExperience(undefined), "No ratings yet");
    });

    it("formats individual parameter ratings accurately without default 10", () => {
      assert.equal(formatParameterRating(8.33), "8.3/10");
      assert.equal(formatParameterRating(4.0), "4.0/10");
      assert.equal(formatParameterRating(null), "Not rated yet");
      assert.equal(formatParameterRating(undefined), "Not rated yet");
    });
  });

  describe("2. Rating Classification Boundaries", () => {
    it("classifies ratings < 4.0 as low", () => {
      assert.equal(classifyRatingCategory(3.99), "low");
      assert.equal(classifyRatingCategory(1.0), "low");
    });

    it("classifies ratings 4.0 to < 8.0 as neutral", () => {
      assert.equal(classifyRatingCategory(4.0), "neutral");
      assert.equal(classifyRatingCategory(7.6), "neutral");
      assert.equal(classifyRatingCategory(7.99), "neutral");
    });

    it("classifies ratings >= 8.0 as high", () => {
      assert.equal(classifyRatingCategory(8.0), "high");
      assert.equal(classifyRatingCategory(8.5), "high");
      assert.equal(classifyRatingCategory(10.0), "high");
    });

    it("returns null for non-numeric ratings", () => {
      assert.equal(classifyRatingCategory(null), null);
      assert.equal(classifyRatingCategory(undefined), null);
    });
  });

  describe("3. College-Wide Student Experience Average: AVG(rating_sessions.calculated_overall_rating)", () => {
    it("reproduces verified historical database values from isolated session ratings", () => {
      // IITB: (9.240 + 7.208 + 9.080) / 3 = 8.50933... -> rounded to 8.51
      const iitbAvg = calculateCollegeStudentExperienceAverage(TEST_FIXTURE_HISTORICAL_SESSION_RATINGS.IITB);
      assert.ok(iitbAvg !== null);
      assert.equal(Number(iitbAvg.toFixed(2)), 8.51);

      // COEP: 7.217 -> 7.22
      const coepAvg = calculateCollegeStudentExperienceAverage(TEST_FIXTURE_HISTORICAL_SESSION_RATINGS.COEP);
      assert.ok(coepAvg !== null);
      assert.equal(Number(coepAvg.toFixed(2)), 7.22);

      // PICT: 7.680 -> 7.68
      const pictAvg = calculateCollegeStudentExperienceAverage(TEST_FIXTURE_HISTORICAL_SESSION_RATINGS.PICT);
      assert.ok(pictAvg !== null);
      assert.equal(Number(pictAvg.toFixed(2)), 7.68);

      // SPIT: 5.520 -> 5.52
      const spitAvg = calculateCollegeStudentExperienceAverage(TEST_FIXTURE_HISTORICAL_SESSION_RATINGS.SPIT);
      assert.ok(spitAvg !== null);
      assert.equal(Number(spitAvg.toFixed(2)), 5.52);

      // SFIT: 10.000 -> 10.00
      const sfitAvg = calculateCollegeStudentExperienceAverage(TEST_FIXTURE_HISTORICAL_SESSION_RATINGS.SFIT);
      assert.ok(sfitAvg !== null);
      assert.equal(Number(sfitAvg.toFixed(2)), 10.00);
    });

    it("demonstrates that a new valid submission changes the college average", () => {
      const initialRatings = [...TEST_FIXTURE_HISTORICAL_SESSION_RATINGS.IITB];
      const initialAvg = calculateCollegeStudentExperienceAverage(initialRatings);
      assert.equal(Number(initialAvg!.toFixed(2)), 8.51);

      // New student submits overall rating of 6.000
      const updatedRatings = [...initialRatings, 6.000];
      const updatedAvg = calculateCollegeStudentExperienceAverage(updatedRatings);
      assert.ok(updatedAvg !== null);
      // (9.240 + 7.208 + 9.080 + 6.000) / 4 = 31.528 / 4 = 7.882
      assert.equal(Number(updatedAvg.toFixed(2)), 7.88);
      assert.notEqual(initialAvg, updatedAvg);
    });

    it("excludes NULL and invalid overall session ratings", () => {
      const ratingsWithNulls = [8.5, null, undefined, 7.5];
      const avg = calculateCollegeStudentExperienceAverage(ratingsWithNulls);
      assert.equal(avg, 8.0);
    });

    it("returns null if a college has zero submitted sessions", () => {
      assert.equal(calculateCollegeStudentExperienceAverage([]), null);
      assert.equal(calculateCollegeStudentExperienceAverage([null, undefined]), null);
    });
  });

  describe("4. Institutional College Score (/100 Scale)", () => {
    it("formats institutional scores as out of 100 without stars or division", () => {
      assert.equal(THRESHOLD_BLOCK_SIZE, 20);
      assert.equal(formatInstitutionalScore(100), "100/100");
      assert.equal(formatInstitutionalScore(99), "99/100");
      assert.equal(formatInstitutionalScore(101), "101/100");
      assert.equal(formatInstitutionalScore(98), "98/100");
    });

    it("verifies the full specification scoring scenarios table", () => {
      assert.equal(BASE_INSTITUTIONAL_SCORE, 100);

      const simulateSequence = (cat: "low" | "neutral" | "high", count: number, start = BASE_INSTITUTIONAL_SCORE) => {
        let score = start;
        for (let i = 1; i <= count; i++) {
          const res = checkThresholdCrossing(cat, i - 1, i);
          if (res.hasCrossed && res.scoreDelta !== null) {
            score += res.scoreDelta;
          }
        }
        return score;
      };

      // 1. New college -> 100
      assert.equal(simulateSequence("low", 0), 100);
      // 2. 19 low ratings -> 100
      assert.equal(simulateSequence("low", 19), 100);
      // 3. 20 low ratings -> 99
      assert.equal(simulateSequence("low", 20), 99);
      // 4. 39 low ratings -> 99
      assert.equal(simulateSequence("low", 39), 99);
      // 5. 40 low ratings -> 98
      assert.equal(simulateSequence("low", 40), 98);
      // 6. 19 high ratings -> 100
      assert.equal(simulateSequence("high", 19), 100);
      // 7. 20 high ratings -> 101
      assert.equal(simulateSequence("high", 20), 101);
      // 8. 40 high ratings -> 102
      assert.equal(simulateSequence("high", 40), 102);
      // 9. Neutral ratings only -> 100
      assert.equal(simulateSequence("neutral", 60), 100);
    });
  });

  describe("5. Production Code Cleanliness & Zero Hardcoded Fallbacks", () => {
    const mockCollege = (shortCode: string, totalSessions: number): CollegeSummary => ({
      college_id: "test-uuid",
      name: `College ${shortCode}`,
      short_code: shortCode,
      city: "Test City",
      state: "Test State",
      is_demo: false,
      current_score: 100,
      total_submitted_sessions: totalSessions,
      current_student_submissions: totalSessions,
      alumni_submissions: 0,
    });

    it("strictly confirms VERIFIED_HISTORICAL_STUDENT_EXPERIENCE is removed from production exports", () => {
      assert.equal(
        (scoringModule as any).VERIFIED_HISTORICAL_STUDENT_EXPERIENCE,
        undefined,
        "VERIFIED_HISTORICAL_STUDENT_EXPERIENCE must not exist in production scoring module"
      );
    });

    it("returns null ('No ratings yet') when API does not provide dynamic aggregate", () => {
      // Historical college with reviews in DB, but API response does not have student_experience_average
      const iitb = mockCollege("IITB", 3);
      assert.equal(
        getStudentExperienceAverage(iitb),
        null,
        "Must NOT fall back to hardcoded 8.51; must return null if not provided by API"
      );
      assert.equal(formatStudentExperience(getStudentExperienceAverage(iitb)), "No ratings yet");
    });

    it("consumes dynamic student_experience_average when provided by API", () => {
      const iitbWithApiData = {
        ...mockCollege("IITB", 3),
        student_experience_average: 8.51,
      };
      assert.equal(getStudentExperienceAverage(iitbWithApiData), 8.51);
      assert.equal(formatStudentExperience(getStudentExperienceAverage(iitbWithApiData)), "8.5/10");
    });

    it("verifies unrated colleges remain unrated ('No ratings yet')", () => {
      const unratedCodes = [
        "AIIMS-DEL", "CMC-VEL", "JIPMER-PDY", "KMC-MAN", "AFMC-PUN",
        "IIMA-AHM", "IIMB-BLR", "IIMC-KOL", "XLRI-JAM", "FMS-DEL",
        "HINDU-DEL", "FC-PUN", "SXC-MUM", "LOYOLA-CHE", "SXC-KOL",
        "VJTI", "VIT-MUM", "WCE"
      ];

      for (const code of unratedCodes) {
        const col = mockCollege(code, 0);
        assert.equal(col.current_score, 100);
        assert.equal(formatInstitutionalScore(col.current_score), "100/100");
        assert.equal(getStudentExperienceAverage(col), null);
        assert.equal(formatStudentExperience(getStudentExperienceAverage(col)), "No ratings yet");
      }
    });

    it("does NOT average the 25 parameter averages to compute college student experience", () => {
      const col = mockCollege("AIIMS-DEL", 1);
      const mockReport: CollegeRatingReport = {
        college_id: "test-uuid",
        name: "AIIMS New Delhi",
        short_code: "AIIMS-DEL",
        is_demo: false,
        current_score: 100,
        total_submitted_sessions: 1,
        current_student_submissions: 1,
        alumni_submissions: 0,
        parameters: [
          {
            parameter_id: "p1",
            parameter_key: "param_1",
            parameter_name: "Param 1",
            parameter_category: "academics",
            display_order: 1,
            numeric_response_count: 1,
            no_view_count: 0,
            average_score: 9.0,
            distributions: [],
          },
          {
            parameter_id: "p2",
            parameter_key: "param_2",
            parameter_name: "Param 2",
            parameter_category: "academics",
            display_order: 2,
            numeric_response_count: 1,
            no_view_count: 0,
            average_score: 7.0,
            distributions: [],
          },
        ],
      };

      // Must return null because parameter averages are separate statistics and report lacks session-based student_experience_average
      assert.equal(getStudentExperienceAverage(col, mockReport), null);
    });
  });
});
