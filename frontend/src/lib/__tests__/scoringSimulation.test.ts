import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  classifyCategory,
  checkThresholdCrossing,
  createInitialSimulatedState,
  addSimulatedContribution,
  simulateBatchSequence,
} from "../scoringSimulation.ts";

describe("College Score Progression Simulation (ISOLATED DEMO)", () => {
  describe("Classification of arithmetic means", () => {
    it("correctly classifies < 4.0 as low", () => {
      assert.equal(classifyCategory(1.0), "low");
      assert.equal(classifyCategory(3.999), "low");
    });

    it("correctly classifies 4.0 to 7.999 as neutral", () => {
      assert.equal(classifyCategory(4.0), "neutral");
      assert.equal(classifyCategory(6.5), "neutral");
      assert.equal(classifyCategory(7.999), "neutral");
    });

    it("correctly classifies >= 8.0 as high", () => {
      assert.equal(classifyCategory(8.0), "high");
      assert.equal(classifyCategory(9.5), "high");
      assert.equal(classifyCategory(10.0), "high");
    });
  });

  describe("Block threshold crossing (20-submission block)", () => {
    it("never triggers threshold crossing for neutral contributions", () => {
      const res = checkThresholdCrossing("neutral", 19, 20);
      assert.equal(res.hasCrossed, false);
      assert.equal(res.blockNumber, null);
      assert.equal(res.scoreDelta, null);
    });

    it("does not trigger threshold crossing for contributions 1 through 19", () => {
      for (let i = 1; i <= 19; i++) {
        const res = checkThresholdCrossing("high", i - 1, i);
        assert.equal(res.hasCrossed, false, `Failed at count ${i}`);
      }
    });

    it("triggers Block 1 and +1 delta on exactly the 20th high contribution", () => {
      const res = checkThresholdCrossing("high", 19, 20);
      assert.equal(res.hasCrossed, true);
      assert.equal(res.blockNumber, 1);
      assert.equal(res.scoreDelta, 1);
    });

    it("triggers Block 1 and -1 delta on exactly the 20th low contribution", () => {
      const res = checkThresholdCrossing("low", 19, 20);
      assert.equal(res.hasCrossed, true);
      assert.equal(res.blockNumber, 1);
      assert.equal(res.scoreDelta, -1);
    });

    it("does not trigger on contribution 21 through 39", () => {
      const res = checkThresholdCrossing("high", 20, 21);
      assert.equal(res.hasCrossed, false);
    });

    it("triggers Block 2 on the 40th contribution", () => {
      const res = checkThresholdCrossing("high", 39, 40);
      assert.equal(res.hasCrossed, true);
      assert.equal(res.blockNumber, 2);
      assert.equal(res.scoreDelta, 1);
    });
  });

  describe("Scenario A: PICT progression (100 -> 101)", () => {
    it("verifies PICT remains 100 across 19 eligible high contributions", () => {
      const state19 = simulateBatchSequence("Pune Institute of Computer Technology", "PICT", 19, "high");
      assert.equal(state19.initialScore, 100);
      assert.equal(state19.currentScore, 100);
      assert.equal(state19.totalQualifyingHigh, 19);
      assert.equal(state19.contributions.length, 19);
      assert.equal(state19.contributions[18].hasCrossed, false);
      assert.equal(state19.contributions[18].scoreAfter, 100);
    });

    it("verifies PICT increments from 100 to 101 on the 20th eligible high contribution", () => {
      const state20 = simulateBatchSequence("Pune Institute of Computer Technology", "PICT", 20, "high");
      assert.equal(state20.initialScore, 100);
      assert.equal(state20.currentScore, 101);
      assert.equal(state20.totalQualifyingHigh, 20);
      assert.equal(state20.contributions.length, 20);

      // Verify the 20th contribution specifically
      const c20 = state20.contributions[19];
      assert.equal(c20.newCount, 20);
      assert.equal(c20.hasCrossed, true);
      assert.equal(c20.blockNumber, 1);
      assert.equal(c20.scoreDelta, 1);
      assert.equal(c20.scoreBefore, 100);
      assert.equal(c20.scoreAfter, 101);
    });
  });

  describe("Scenario B: VJTI progression (100 -> 99)", () => {
    it("verifies VJTI remains 100 across 19 eligible low contributions", () => {
      const state19 = simulateBatchSequence("Veermata Jijabai Technological Institute", "VJTI", 19, "low");
      assert.equal(state19.initialScore, 100);
      assert.equal(state19.currentScore, 100);
      assert.equal(state19.totalQualifyingLow, 19);
      assert.equal(state19.contributions.length, 19);
      assert.equal(state19.contributions[18].hasCrossed, false);
      assert.equal(state19.contributions[18].scoreAfter, 100);
    });

    it("verifies VJTI decrements from 100 to 99 on the 20th eligible low contribution", () => {
      const state20 = simulateBatchSequence("Veermata Jijabai Technological Institute", "VJTI", 20, "low");
      assert.equal(state20.initialScore, 100);
      assert.equal(state20.currentScore, 99);
      assert.equal(state20.totalQualifyingLow, 20);
      assert.equal(state20.contributions.length, 20);

      // Verify the 20th contribution specifically
      const c20 = state20.contributions[19];
      assert.equal(c20.newCount, 20);
      assert.equal(c20.hasCrossed, true);
      assert.equal(c20.blockNumber, 1);
      assert.equal(c20.scoreDelta, -1);
      assert.equal(c20.scoreBefore, 100);
      assert.equal(c20.scoreAfter, 99);
    });
  });

  describe("Step-by-step state additions and reset", () => {
    it("allows step-by-step contribution addition and reset", () => {
      let state = createInitialSimulatedState("PICT", "PICT");
      assert.equal(state.currentScore, 100);

      // Add 1
      state = addSimulatedContribution(state, 8.5);
      assert.equal(state.currentScore, 100);
      assert.equal(state.totalQualifyingHigh, 1);

      // Reset
      state = createInitialSimulatedState("PICT", "PICT");
      assert.equal(state.currentScore, 100);
      assert.equal(state.totalQualifyingHigh, 0);
      assert.equal(state.contributions.length, 0);
    });
  });
});
