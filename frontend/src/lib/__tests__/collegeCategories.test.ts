import { describe, it } from "node:test";
import assert from "node:assert";
import {
  getCollegeCategory,
  getCategoryLabel,
  INSTITUTIONAL_FACTS,
  getCollegeCardTags,
  getCollegePhoto,
} from "../../features/colleges/collegeCategories.ts";
import { INSTITUTIONAL_DOSSIERS } from "../../features/colleges/collegeDossierData.ts";

describe("College Categories & Multi-Stream Expansion Verification", () => {
  const verifiedColleges = [
    // Engineering (8)
    { code: "IITB", name: "Indian Institute of Technology Bombay", category: "engineering" },
    { code: "COEP", name: "COEP Technological University", category: "engineering" },
    { code: "VJTI", name: "Veermata Jijabai Technological Institute", category: "engineering" },
    { code: "SFIT", name: "St. Francis Institute of Technology", category: "engineering" },
    { code: "SPIT", name: "Sardar Patel Institute of Technology", category: "engineering" },
    { code: "PICT", name: "Pune Institute of Computer Technology", category: "engineering" },
    { code: "VIT-MUM", name: "Vidyalankar Institute of Technology", category: "engineering" },
    { code: "WCE", name: "Walchand College of Engineering", category: "engineering" },

    // Medical (5)
    { code: "AIIMS-DEL", name: "All India Institute of Medical Sciences, New Delhi", category: "medical" },
    { code: "CMC-VEL", name: "Christian Medical College, Vellore", category: "medical" },
    { code: "JIPMER-PDY", name: "Jawaharlal Institute of Postgraduate Medical Education & Research", category: "medical" },
    { code: "KMC-MAN", name: "Kasturba Medical College, Manipal", category: "medical" },
    { code: "AFMC-PUN", name: "Armed Forces Medical College, Pune", category: "medical" },

    // MBA (5)
    { code: "IIMA-AHM", name: "Indian Institute of Management Ahmedabad", category: "mba" },
    { code: "IIMB-BLR", name: "Indian Institute of Management Bangalore", category: "mba" },
    { code: "IIMC-KOL", name: "Indian Institute of Management Calcutta", category: "mba" },
    { code: "XLRI-JAM", name: "XLRI – Xavier School of Management", category: "mba" },
    { code: "FMS-DEL", name: "Faculty of Management Studies, University of Delhi", category: "mba" },

    // Arts (5)
    { code: "HINDU-DEL", name: "Hindu College, University of Delhi", category: "arts" },
    { code: "FC-PUN", name: "Fergusson College, Pune", category: "arts" },
    { code: "SXC-MUM", name: "St. Xavier's College, Mumbai", category: "arts" },
    { code: "LOYOLA-CHE", name: "Loyola College, Chennai", category: "arts" },
    { code: "SXC-KOL", name: "St. Xavier's College, Kolkata", category: "arts" },
  ];

  it("verifies exactly 23 colleges across 4 categories in catalog", () => {
    assert.strictEqual(verifiedColleges.length, 23);

    const eng = verifiedColleges.filter((c) => c.category === "engineering");
    const med = verifiedColleges.filter((c) => c.category === "medical");
    const mba = verifiedColleges.filter((c) => c.category === "mba");
    const arts = verifiedColleges.filter((c) => c.category === "arts");

    assert.strictEqual(eng.length, 8, "Must have exactly 8 Engineering colleges");
    assert.strictEqual(med.length, 5, "Must have exactly 5 Medical colleges");
    assert.strictEqual(mba.length, 5, "Must have exactly 5 MBA institutions");
    assert.strictEqual(arts.length, 5, "Must have exactly 5 Arts institutions");
  });

  it("resolves the correct category for every verified short code", () => {
    for (const c of verifiedColleges) {
      const resolved = getCollegeCategory({ short_code: c.code, name: c.name });
      assert.strictEqual(
        resolved,
        c.category,
        `Expected ${c.code} to resolve to category ${c.category}, got ${resolved}`
      );
    }
  });

  it("prioritizes explicit college.category if returned from backend", () => {
    const custom = getCollegeCategory({
      short_code: "UNKNOWN",
      name: "Custom School",
      category: "medical",
    });
    assert.strictEqual(custom, "medical");
  });

  it("maps categories to human-friendly display labels", () => {
    assert.strictEqual(getCategoryLabel("engineering"), "Engineering");
    assert.strictEqual(getCategoryLabel("medical"), "Medical");
    assert.strictEqual(getCategoryLabel("mba"), "MBA");
    assert.strictEqual(getCategoryLabel("arts"), "Arts");
    assert.strictEqual(getCategoryLabel(null), "Engineering");
  });

  it("provides institutional facts and dynamic category tags for all 23 colleges", () => {
    for (const c of verifiedColleges) {
      const fact = INSTITUTIONAL_FACTS[c.code];
      assert.ok(fact, `INSTITUTIONAL_FACTS missing entry for ${c.code}`);
      assert.ok(fact.description.length > 10, `Description too short for ${c.code}`);
      assert.ok(fact.type.length > 0, `Type missing for ${c.code}`);

      const tags = getCollegeCardTags({
        college_id: "test",
        name: c.name,
        short_code: c.code,
        city: "City",
        state: "State",
        is_demo: false,
        current_score: 100,
        total_submitted_sessions: 0,
        current_student_submissions: 0,
        alumni_submissions: 0,
      });

      const expectedLabel = getCategoryLabel(c.category);
      assert.strictEqual(
        tags[0],
        expectedLabel,
        `Expected first tag for ${c.code} to be ${expectedLabel}, got ${tags[0]}`
      );
    }
  });

  it("resolves specific authentic campus images for all 23 colleges", () => {
    for (const c of verifiedColleges) {
      const photo = getCollegePhoto({ short_code: c.code, name: c.name });
      assert.ok(
        photo.startsWith("/images/colleges/"),
        `Expected photo to be under /images/colleges/, got ${photo}`
      );
      assert.notStrictEqual(
        photo,
        "/images/colleges/default.jpg",
        `Expected verified photo for ${c.code}, got default.jpg fallback`
      );
    }
  });

  it("contains full institutional dossiers with HTTPS URLs for all 23 colleges", () => {
    for (const c of verifiedColleges) {
      const dossier = INSTITUTIONAL_DOSSIERS[c.code];
      assert.ok(dossier, `INSTITUTIONAL_DOSSIERS missing entry for ${c.code}`);
      assert.strictEqual(dossier.shortCode, c.code);
      assert.ok(
        dossier.officialWebsite.startsWith("https://"),
        `Official website for ${c.code} must use HTTPS: ${dossier.officialWebsite}`
      );
      assert.ok(
        dossier.distinctiveFeatures.length >= 2,
        `Expected at least 2 distinctive features for ${c.code}`
      );
      assert.ok(
        dossier.placementSummary.reportUrl.startsWith("https://"),
        `Placement report URL for ${c.code} must use HTTPS`
      );
    }
  });
});
