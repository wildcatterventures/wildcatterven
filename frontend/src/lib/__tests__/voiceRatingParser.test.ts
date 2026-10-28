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

  describe("Single number 2 and homophone variations", () => {
    it("recognizes single digit '2'", () => {
      const res = parseSpokenRating("2");
      assert.equal(res.valid, true);
      assert.equal(res.score, 2);
    });

    it("recognizes word 'two'", () => {
      const res = parseSpokenRating("two");
      assert.equal(res.valid, true);
      assert.equal(res.score, 2);
    });

    it("recognizes isolated homophones 'to', 'too', 'tu' as 2", () => {
      assert.equal(parseSpokenRating("to").valid, true);
      assert.equal(parseSpokenRating("to").score, 2);

      assert.equal(parseSpokenRating("too").valid, true);
      assert.equal(parseSpokenRating("too").score, 2);

      assert.equal(parseSpokenRating("tu").valid, true);
      assert.equal(parseSpokenRating("tu").score, 2);
    });

    it("recognizes conversational phrases for 2", () => {
      assert.equal(parseSpokenRating("score is 2").score, 2);
      assert.equal(parseSpokenRating("rating 2").score, 2);
      assert.equal(parseSpokenRating("give it 2").score, 2);
      assert.equal(parseSpokenRating("give it to").score, 2);
      assert.equal(parseSpokenRating("give it a two").score, 2);
    });

    it("recognizes ordinal 'second' as 2", () => {
      const res = parseSpokenRating("second");
      assert.equal(res.valid, true);
      assert.equal(res.score, 2);
    });

    it("recognizes fractional notation '2/10'", () => {
      const res = parseSpokenRating("2/10");
      assert.equal(res.valid, true);
      assert.equal(res.score, 2);
    });
  });

  describe("Multi-digit numbers (123, 245) rejection with guidance", () => {
    it("rejects '123' with clear guidance", () => {
      const res = parseSpokenRating("123");
      assert.equal(res.valid, false);
      assert.equal(res.score, null);
      assert.match(res.clarification || "", /between 1 and 10/);
    });

    it("rejects '245' with clear guidance", () => {
      const res = parseSpokenRating("245");
      assert.equal(res.valid, false);
      assert.equal(res.score, null);
      assert.match(res.clarification || "", /between 1 and 10/);
    });

    it("rejects multi-word sequence 'one two three' as ambiguous multiple numbers", () => {
      const res = parseSpokenRating("one two three");
      assert.equal(res.valid, false);
      assert.equal(res.ambiguous, true);
      assert.match(res.clarification || "", /multiple numbers/);
    });
  });

  describe("Additional homophones and ordinals", () => {
    it("recognizes 'won' as 1 and 'first' as 1", () => {
      assert.equal(parseSpokenRating("won").score, 1);
      assert.equal(parseSpokenRating("first").score, 1);
    });

    it("recognizes 'tree' or 'tri' as 3, 'third' as 3", () => {
      assert.equal(parseSpokenRating("tree").score, 3);
      assert.equal(parseSpokenRating("tri").score, 3);
      assert.equal(parseSpokenRating("third").score, 3);
    });

    it("recognizes 'for', 'fore' as 4, 'fourth' as 4", () => {
      assert.equal(parseSpokenRating("for").score, 4);
      assert.equal(parseSpokenRating("fore").score, 4);
      assert.equal(parseSpokenRating("fourth").score, 4);
    });

    it("recognizes 'ate', 'ait' as 8, 'eighth' as 8", () => {
      assert.equal(parseSpokenRating("ate").score, 8);
      assert.equal(parseSpokenRating("ait").score, 8);
      assert.equal(parseSpokenRating("eighth").score, 8);
    });
  });

  describe("Explicit 'Rating N' voice command format (FIX 1)", () => {
    it("recognizes 'Rating 10', 'Rating 8', 'Rating 5'", () => {
      const r10 = parseSpokenRating("Rating 10");
      assert.equal(r10.valid, true);
      assert.equal(r10.score, 10);

      const r8 = parseSpokenRating("Rating 8");
      assert.equal(r8.valid, true);
      assert.equal(r8.score, 8);

      const r5 = parseSpokenRating("Rating 5");
      assert.equal(r5.valid, true);
      assert.equal(r5.score, 5);
    });

    it("recognizes word numbers after Rating (e.g. 'Rating ten', 'Rating two')", () => {
      assert.equal(parseSpokenRating("Rating ten").score, 10);
      assert.equal(parseSpokenRating("Rating eight").score, 8);
      assert.equal(parseSpokenRating("Rating two").score, 2);
      assert.equal(parseSpokenRating("Rating to").score, 2);
    });

    it("extracts the rating associated with the word 'Rating' and ignores unrelated numbers in the sentence", () => {
      // e.g. "Question 3 rating 8" -> 8, NOT 3
      const res1 = parseSpokenRating("Question 3 rating 8");
      assert.equal(res1.valid, true);
      assert.equal(res1.score, 8);

      // e.g. "For criterion 4 my rating is 10" -> 10, NOT 4
      const res2 = parseSpokenRating("For criterion 4 my rating is 10");
      assert.equal(res2.valid, true);
      assert.equal(res2.score, 10);
    });

    it("rejects out of range ratings in 'Rating N' commands", () => {
      const res0 = parseSpokenRating("Rating 0");
      assert.equal(res0.valid, false);
      assert.match(res0.clarification || "", /between 1 and 10/);

      const res15 = parseSpokenRating("Rating 15");
      assert.equal(res15.valid, false);
      assert.match(res15.clarification || "", /between 1 and 10/);
    });
  });
});

