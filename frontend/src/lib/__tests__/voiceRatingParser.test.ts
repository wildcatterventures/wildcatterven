import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseSpokenRating, normalizeSpokenText } from "../voiceRatingParser.ts";

describe("voiceRatingParser", () => {
  describe("normalizeSpokenText", () => {
    it("lowercases and removes punctuation", () => {
      assert.equal(normalizeSpokenText("  Heard: 8!  "), "heard 8");
      assert.equal(normalizeSpokenText("No view..."), "no view");
    });
  });

  describe("direct numerical digits (1 to 10)", () => {
    for (let i = 1; i <= 10; i++) {
      it(`recognizes digit ${i}`, () => {
        const res = parseSpokenRating(`${i}`);
        assert.equal(res.valid, true);
        assert.equal(res.score, i);
        assert.equal(res.isNoView, false);
      });
    }

    it("rejects 0 with clear guidance", () => {
      const res = parseSpokenRating("0");
      assert.equal(res.valid, false);
      assert.equal(res.score, null);
      assert.match(res.clarification || "", /between 1 and 10/);
    });

    it("rejects numbers greater than 10 (e.g. 11, 25, 100)", () => {
      const res11 = parseSpokenRating("11");
      assert.equal(res11.valid, false);
      assert.match(res11.clarification || "", /between 1 and 10/);

      const res25 = parseSpokenRating("25");
      assert.equal(res25.valid, false);

      const res100 = parseSpokenRating("100");
      assert.equal(res100.valid, false);
    });
  });

  describe("English number words (one to ten)", () => {
    const words = [
      ["one", 1],
      ["two", 2],
      ["three", 3],
      ["four", 4],
      ["five", 5],
      ["six", 6],
      ["seven", 7],
      ["eight", 8],
      ["nine", 9],
      ["ten", 10],
    ] as const;

    for (const [word, val] of words) {
      it(`recognizes word '${word}' as ${val}`, () => {
        const res = parseSpokenRating(word);
        assert.equal(res.valid, true);
        assert.equal(res.score, val);
        assert.equal(res.isNoView, false);
      });
    }

    it("rejects word numbers out of range (zero, eleven, twelve, twenty)", () => {
      assert.equal(parseSpokenRating("zero").valid, false);
      assert.equal(parseSpokenRating("eleven").valid, false);
      assert.equal(parseSpokenRating("twelve").valid, false);
      assert.equal(parseSpokenRating("twenty").valid, false);
    });
  });

  describe("Natural phrases with scores", () => {
    it("handles 'I would say seven'", () => {
      const res = parseSpokenRating("I would say seven");
      assert.equal(res.valid, true);
      assert.equal(res.score, 7);
    });

    it("handles 'give it an eight'", () => {
      const res = parseSpokenRating("give it an eight");
      assert.equal(res.valid, true);
      assert.equal(res.score, 8);
    });

    it("handles 'my rating is 9'", () => {
      const res = parseSpokenRating("my rating is 9");
      assert.equal(res.valid, true);
      assert.equal(res.score, 9);
    });

    it("handles 'definitely a 10'", () => {
      const res = parseSpokenRating("definitely a 10");
      assert.equal(res.valid, true);
      assert.equal(res.score, 10);
    });

    it("handles '8 out of 10' without confusing numerator 8 with denominator 10", () => {
      const res = parseSpokenRating("8 out of 10");
      assert.equal(res.valid, true);
      assert.equal(res.score, 8);
    });

    it("handles 'four out of 10'", () => {
      const res = parseSpokenRating("four out of 10");
      assert.equal(res.valid, true);
      assert.equal(res.score, 4);
    });
  });

  describe("No View expressions", () => {
    const noViewPhrases = [
      "no view",
      "no-view",
      "noview",
      "no opinion",
      "not sure",
      "don't know",
      "dont know",
      "pass",
      "skip",
      "n/a",
      "not applicable",
      "haven't used",
    ];

    for (const phrase of noViewPhrases) {
      it(`recognizes '${phrase}' as No View`, () => {
        const res = parseSpokenRating(phrase);
        assert.equal(res.valid, true);
        assert.equal(res.isNoView, true);
        assert.equal(res.score, null);
      });
    }
  });

  describe("Navigation commands", () => {
    it("recognizes 'previous' command", () => {
      const res = parseSpokenRating("previous");
      assert.equal(res.valid, true);
      assert.equal(res.isNavigation, "previous");
    });

    it("recognizes 'go back' command", () => {
      const res = parseSpokenRating("go back");
      assert.equal(res.valid, true);
      assert.equal(res.isNavigation, "previous");
    });

    it("recognizes 'repeat' command", () => {
      const res = parseSpokenRating("repeat");
      assert.equal(res.valid, true);
      assert.equal(res.isNavigation, "repeat");
    });

    it("recognizes 'review' command", () => {
      const res = parseSpokenRating("review");
      assert.equal(res.valid, true);
      assert.equal(res.isNavigation, "review");
    });

    it("recognizes 'next' command", () => {
      const res = parseSpokenRating("next");
      assert.equal(res.valid, true);
      assert.equal(res.isNavigation, "next");
    });
  });

  describe("Rejection of substring false-positives", () => {
    it("does not match 'one' inside 'someone'", () => {
      const res = parseSpokenRating("someone");
      assert.equal(res.valid, false);
      assert.equal(res.score, null);
    });

    it("does not match 'one' inside 'stone'", () => {
      const res = parseSpokenRating("the library is made of stone");
      assert.equal(res.valid, false);
      assert.equal(res.score, null);
    });

    it("does not match 'ten' inside 'often'", () => {
      const res = parseSpokenRating("faculty often absent");
      assert.equal(res.valid, false);
      assert.equal(res.score, null);
    });
  });

  describe("Ambiguity handling", () => {
    it("detects conflicting numbers like 'between 6 and 8'", () => {
      const res = parseSpokenRating("between 6 and 8");
      assert.equal(res.valid, false);
      assert.equal(res.ambiguous, true);
      assert.match(res.clarification || "", /multiple numbers/);
    });
  });
});
