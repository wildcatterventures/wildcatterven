import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateMatches, getCollegeCategoryMetrics } from "../matchEngine.ts";
import type { CollegeRatingReport, CollegeSummary } from "../../types/college.ts";

describe("Uncut Match Engine (SECTION 2)", () => {
  const dummyColleges: CollegeSummary[] = [
    {
      college_id: "c1",
      name: "Apex Tech",
      short_code: "APEX",
      city: "Mumbai",
      state: "Maharashtra",
      is_demo: false,
      current_score: 100,
      total_submitted_sessions: 19,
      current_student_submissions: 10,
      alumni_submissions: 9,
    },
    {
      college_id: "c2",
      name: "St. Jude",
      short_code: "JUDE",
      city: "Goa",
      state: "Goa",
      is_demo: false,
      current_score: 100,
      total_submitted_sessions: 19,
      current_student_submissions: 9,
      alumni_submissions: 10,
    },
    {
      college_id: "c3",
      name: "Unrated Institute",
      short_code: "UNR",
      city: "Delhi",
      state: "Delhi",
      is_demo: false,
      current_score: 100,
      total_submitted_sessions: 0,
      current_student_submissions: 0,
      alumni_submissions: 0,
    },
  ];

  const dummyReports: Record<string, CollegeRatingReport> = {
    c1: {
      college_id: "c1",
      name: "Apex Tech",
      short_code: "APEX",
      is_demo: false,
      current_score: 100,
      total_submitted_sessions: 19,
      current_student_submissions: 10,
      alumni_submissions: 9,
      parameters: [
        // Academics parameters
        {
          parameter_id: "p1",
          parameter_key: "professor_quality",
          parameter_name: "Prof Quality",
          parameter_category: "Academics",
          display_order: 1,
          numeric_response_count: 19,
          no_view_count: 0,
          average_score: 9.0,
          distributions: [],
        },
        {
          parameter_id: "p2",
          parameter_key: "classroom_quality",
          parameter_name: "Classrooms",
          parameter_category: "Academics",
          display_order: 2,
          numeric_response_count: 19,
          no_view_count: 0,
          average_score: 8.0,
          distributions: [],
        },
        // Living parameters (weaker)
        {
          parameter_id: "p3",
          parameter_key: "food",
          parameter_name: "Food",
          parameter_category: "Campus Living",
          display_order: 3,
          numeric_response_count: 19,
          no_view_count: 0,
          average_score: 4.0,
          distributions: [],
        },
      ],
    },
    c2: {
      college_id: "c2",
      name: "St. Jude",
      short_code: "JUDE",
      is_demo: false,
      current_score: 100,
      total_submitted_sessions: 19,
      current_student_submissions: 9,
      alumni_submissions: 10,
      parameters: [
        {
          parameter_id: "p1",
          parameter_key: "professor_quality",
          parameter_name: "Prof Quality",
          parameter_category: "Academics",
          display_order: 1,
          numeric_response_count: 19,
          no_view_count: 0,
          average_score: 3.5,
          distributions: [],
        },
        {
          parameter_id: "p3",
          parameter_key: "food",
          parameter_name: "Food",
          parameter_category: "Campus Living",
          display_order: 3,
          numeric_response_count: 19,
          no_view_count: 0,
          average_score: 8.5,
          distributions: [],
        },
      ],
    },
  };

  it("calculates personalized fit score and ranks higher based on user priority", () => {
    // When user prioritizes Academics (weight 5) over Living (weight 1)
    const matchesAcademics = calculateMatches({
      colleges: dummyColleges,
      reports: dummyReports,
      priorities: {
        academics: 5,
        living: 1,
      },
    });

    assert.equal(matchesAcademics[0].collegeName, "Apex Tech");
    // Apex Academics is 8.5, Living is 4.0 -> weighted: (8.5*5 + 4.0*1)/6 = (42.5 + 4)/6 = 7.75 -> 78%
    assert.equal(matchesAcademics[0].personalizedFitScore, 78);
    assert.equal(matchesAcademics[0].evidenceCoveragePct, 100);
    assert.ok(matchesAcademics[0].tradeOffCategory !== null); // food is 4.0, so trade-off detected!

    // When user switches priorities to Living (weight 5) over Academics (weight 1)
    const matchesLiving = calculateMatches({
      colleges: dummyColleges,
      reports: dummyReports,
      priorities: {
        academics: 1,
        living: 5,
      },
    });

    // St. Jude should now be top ranked
    assert.equal(matchesLiving[0].collegeName, "St. Jude");
  });

  it("never treats missing data as zero, tracks missing categories, and computes coverage", () => {
    // When user selects a category that c3 has no data for
    const matches = calculateMatches({
      colleges: dummyColleges,
      reports: dummyReports,
      priorities: {
        academics: 5,
        safety: 3, // neither has safety data
      },
    });

    const unrated = matches.find((m) => m.collegeName === "Unrated Institute");
    assert.ok(unrated);
    assert.equal(unrated.evidenceCoveragePct, 0);
    assert.equal(unrated.personalizedFitScore, 0);
    assert.equal(unrated.missingCategories.length, 2);

    const apex = matches.find((m) => m.collegeName === "Apex Tech");
    assert.ok(apex);
    assert.equal(apex.evidenceCoveragePct, 50); // 1 of 2 priorities has data
    assert.equal(apex.missingCategories.includes("Campus Safety & Student Support"), true);
    // Apex fit score is calculated only from Academics (8.5), NOT pulling down by 0 for missing safety!
    assert.equal(apex.personalizedFitScore, 85);
  });

  it("extracts category metrics correctly using getCollegeCategoryMetrics", () => {
    const academicsCat = {
      id: "academics",
      name: "Academics",
      shortName: "Academics",
      description: "Academics",
      parameterKeys: ["professor_quality", "classroom_quality"],
    };
    const metrics = getCollegeCategoryMetrics(dummyReports["c1"], academicsCat);
    assert.equal(metrics.avg, 8.5);
    assert.equal(metrics.responseCount, 38);
    assert.equal(metrics.scoredCount, 2);
  });
});
