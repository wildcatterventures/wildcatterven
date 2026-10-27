/**
 * Deterministic parser for spoken rating responses in Campus Uncut.
 *
 * Requirements:
 * - Digits 1 to 10 and number words ('one' to 'ten')
 * - Natural phrases ('I would say seven', 'give it an 8', 'score is 9 out of 10')
 * - 'No view' and safe synonyms ('no opinion', 'not sure', 'pass', 'skip', 'n/a')
 * - Navigation commands ('previous', 'go back', 'repeat', 'review')
 * - Rejection of out-of-range numbers (0, 11+, negative)
 * - Word-boundary enforcement to prevent accidental substring matches (e.g. 'stone' matching 'one')
 * - Ambiguity detection (e.g. 'between 6 and 8')
 * - Zero LLM dependencies: 100% deterministic, testable, and offline-capable.
 */

export interface ParsedVoiceRating {
  valid: boolean;
  score: number | null;
  isNoView: boolean;
  isNavigation?: "previous" | "next" | "repeat" | "review";
  rawText: string;
  ambiguous?: boolean;
  clarification?: string;
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  won: 1,
  two: 2,
  to: 2,
  too: 2,
  three: 3,
  tree: 3,
  four: 4,
  for: 4,
  fore: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  ate: 8,
  nine: 9,
  ten: 10,
};

const NO_VIEW_PHRASES = [
  "no view",
  "noview",
  "no-view",
  "no opinion",
  "noopinion",
  "not sure",
  "don't know",
  "dont know",
  "no idea",
  "pass",
  "skip",
  "n/a",
  "na",
  "n a",
  "not applicable",
  "haven't used",
  "havent used",
  "never used",
  "did not use",
  "didn't use",
  "day scholar",
];

const OUT_OF_RANGE_WORDS = [
  "zero",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "hundred",
];

/**
 * Normalizes input speech text by removing apostrophes (so "don't" -> "dont"),
 * stripping punctuation, normalizing spaces, and converting to lower case.
 */
export function normalizeSpokenText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/['’]/g, "") // "don't" -> "dont", "haven't" -> "havent"
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parses spoken response for college ratings.
 */
export function parseSpokenRating(rawText: string): ParsedVoiceRating {
  const clean = normalizeSpokenText(rawText);

  if (!clean) {
    return {
      valid: false,
      score: null,
      isNoView: false,
      rawText,
      clarification: "No speech heard. Please say a number from 1 to 10, or say 'No view'.",
    };
  }

  // 1. Navigation Commands
  if (
    clean === "previous" ||
    clean === "back" ||
    clean === "go back" ||
    clean.includes("previous question") ||
    clean.includes("last question")
  ) {
    return { valid: true, score: null, isNoView: false, isNavigation: "previous", rawText };
  }

  if (
    clean === "repeat" ||
    clean === "say again" ||
    clean === "repeat question" ||
    clean.includes("what is the question") ||
    clean.includes("repeat again")
  ) {
    return { valid: true, score: null, isNoView: false, isNavigation: "repeat", rawText };
  }

  if (
    clean === "review" ||
    clean === "review all" ||
    clean === "finish" ||
    clean.includes("go to review") ||
    clean.includes("see review")
  ) {
    return { valid: true, score: null, isNoView: false, isNavigation: "review", rawText };
  }

  if (
    clean === "next" ||
    clean === "next question" ||
    clean === "go forward" ||
    clean === "skip question"
  ) {
    return { valid: true, score: null, isNoView: false, isNavigation: "next", rawText };
  }

  // 2. No View / Skip Phrases
  for (const phrase of NO_VIEW_PHRASES) {
    const regex = new RegExp(`\\b${phrase.replace(/-/g, "[ -]?")}\\b`, "i");
    if (regex.test(clean)) {
      return { valid: true, score: null, isNoView: true, rawText };
    }
  }

  // 3. Out-of-Range Rejections (e.g. 0, 11-99, negative, or words like 'zero', 'eleven')
  const outOfRangeDigitMatch = clean.match(/\b(0|1[1-9]|[2-9]\d|\d{3,})\b/);
  if (outOfRangeDigitMatch) {
    return {
      valid: false,
      score: null,
      isNoView: false,
      rawText,
      clarification: `Heard "${outOfRangeDigitMatch[0]}". Scores must be between 1 and 10, or say 'No view'.`,
    };
  }

  for (const word of OUT_OF_RANGE_WORDS) {
    const wordRegex = new RegExp(`\\b${word}\\b`, "i");
    if (wordRegex.test(clean)) {
      return {
        valid: false,
        score: null,
        isNoView: false,
        rawText,
        clarification: `Heard "${word}". Scores must be between 1 and 10, or say 'No view'.`,
      };
    }
  }

  // 4. Handle "X out of 10" or "X / 10" specifically so denominator 10 is not confused with rating
  const outOfTenMatch = clean.match(/\b(10|[1-9]|one|two|three|four|five|six|seven|eight|nine)\s*(out of|\/)\s*10\b/i);
  if (outOfTenMatch) {
    const numeratorStr = outOfTenMatch[1].toLowerCase();
    const parsedNum = NUMBER_WORDS[numeratorStr] || parseInt(numeratorStr, 10);
    if (parsedNum >= 1 && parsedNum <= 10) {
      return { valid: true, score: parsedNum, isNoView: false, rawText };
    }
  }

  // 5. Detect Ambiguous Multi-Number Speech (e.g. "between 6 and 8", "either 7 or 9")
  const words = clean.split(" ");
  const foundNumbers: number[] = [];

  // Check numeric tokens
  for (const w of words) {
    if (/^\d+$/.test(w)) {
      const num = parseInt(w, 10);
      if (num >= 1 && num <= 10) {
        foundNumbers.push(num);
      }
    } else if (NUMBER_WORDS[w] !== undefined) {
      // Disallow homophones like "to", "for", "won", "ate" if they appear as prepositions rather than direct answers
      // e.g. "listen to question" -> "to" is a preposition, not number 2!
      const isHomophone = ["to", "too", "for", "fore", "won", "ate"].includes(w);
      if (isHomophone) {
        // Only accept if it's a direct isolated word or preceded by "rating", "score", "give", "give it", "number"
        const isIsolated = words.length <= 2;
        const hasNumberContext = /(rating|score|give|number|level|rated)\s+(to|too|for|won|ate)\b/i.test(clean);
        if (isIsolated || hasNumberContext) {
          foundNumbers.push(NUMBER_WORDS[w]);
        }
      } else {
        foundNumbers.push(NUMBER_WORDS[w]);
      }
    }
  }

  // If multiple distinct numbers were found in the same sentence (e.g. "6 or 7", "between 5 and 8")
  const uniqueNumbers = Array.from(new Set(foundNumbers));
  if (uniqueNumbers.length > 1) {
    return {
      valid: false,
      score: null,
      isNoView: false,
      ambiguous: true,
      rawText,
      clarification: `Heard multiple numbers (${uniqueNumbers.join(" and ")}). Please say a single rating from 1 to 10.`,
    };
  }

  if (uniqueNumbers.length === 1) {
    return { valid: true, score: uniqueNumbers[0], isNoView: false, rawText };
  }

  // 6. Direct Digit Match (1 to 10) with word boundary
  const digitMatch = clean.match(/\b(10|[1-9])\b/);
  if (digitMatch) {
    const val = parseInt(digitMatch[1], 10);
    return { valid: true, score: val, isNoView: false, rawText };
  }

  // 7. Direct Word Match
  for (const [w, num] of Object.entries(NUMBER_WORDS)) {
    if (["to", "too", "for", "fore", "won", "ate"].includes(w)) {
      // Skip homophones in general fallback to avoid false positives on ordinary English sentences
      continue;
    }
    const regex = new RegExp(`\\b${w}\\b`, "i");
    if (regex.test(clean)) {
      return { valid: true, score: num, isNoView: false, rawText };
    }
  }

  return {
    valid: false,
    score: null,
    isNoView: false,
    rawText,
    clarification: `Heard "${rawText}". Could not recognize a rating between 1 and 10, or 'No view'.`,
  };
}
