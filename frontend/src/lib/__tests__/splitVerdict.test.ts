import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyzeSplitVerdict } from "../splitVerdict.ts";

describe("Split Verdict Classification (SECTION 3)", () => {
  it("flags insufficient evidence when total numeric responses < 5", () => {
    const empty = analyzeSplitVerdict([]);
    assert.equal(empty.verdictType, "insufficient_evidence");
    assert.equal(empty.totalNumericVotes, 0);

    const few = analyzeSplitVerdict([
      { rating_score: 9, frequency: 2 },
      { rating_score: 8, frequency: 1 },
    ]);
    assert.equal(few.verdictType, "insufficient_evidence");
    assert.equal(few.totalNumericVotes, 3);
    assert.equal(few.evidenceStrength, "early_signal");
  });

  it("identifies a Split Verdict when opinions are meaningfully divided between Low (<4) and High (>=8)", () => {
    // 10 low votes, 2 neutral votes, 8 high votes out of 20
    const polarized = analyzeSplitVerdict([
      { rating_score: 1, frequency: 4 },
      { rating_score: 2, frequency: 6 },
      { rating_score: 5, frequency: 2 },
      { rating_score: 8, frequency: 3 },
      { rating_score: 10, frequency: 5 },
    ]);
    assert.equal(polarized.verdictType, "split_verdict");
    assert.equal(polarized.isPolarized, true);
    assert.equal(polarized.totalNumericVotes, 20);
    assert.equal(polarized.evidenceStrength, "broader_feedback");
    assert.ok(polarized.lowPct >= 20);
    assert.ok(polarized.highPct >= 20);
  });

  it("identifies Broad Consensus — High when ratings are clustered in 8-10 band", () => {
    const highConsensus = analyzeSplitVerdict([
      { rating_score: 8, frequency: 5 },
      { rating_score: 9, frequency: 8 },
      { rating_score: 10, frequency: 6 },
    ]);
    assert.equal(highConsensus.verdictType, "agreement_high");
    assert.equal(highConsensus.isPolarized, false);
    assert.ok(highConsensus.highPct >= 60);
  });

  it("identifies Broad Consensus — Critical when ratings are clustered in <4 band (distinguishes low average from disagreement)", () => {
    // Everyone agrees it's bad: score is low, but consensus is HIGH (not a split verdict)
    const criticalConsensus = analyzeSplitVerdict([
      { rating_score: 1, frequency: 8 },
      { rating_score: 2, frequency: 9 },
      { rating_score: 3, frequency: 2 },
    ]);
    assert.equal(criticalConsensus.verdictType, "agreement_low");
    assert.equal(criticalConsensus.isPolarized, false);
    assert.ok(criticalConsensus.lowPct >= 60);
  });

  it("identifies Moderate Consensus when ratings are clustered in 4.0-7.9 band", () => {
    const neutralConsensus = analyzeSplitVerdict([
      { rating_score: 5, frequency: 8 },
      { rating_score: 6, frequency: 7 },
      { rating_score: 7, frequency: 4 },
    ]);
    assert.equal(neutralConsensus.verdictType, "agreement_neutral");
    assert.ok(neutralConsensus.neutralPct >= 50);
  });
});
