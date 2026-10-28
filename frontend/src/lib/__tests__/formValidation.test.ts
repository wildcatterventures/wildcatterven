import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Respondent Name Validation (FIX 6)", () => {
  const validateRespondentName = (name: string): { isValid: boolean; trimmedName: string; error?: string } => {
    const trimmed = name.trim();
    if (!trimmed) {
      return { isValid: false, trimmedName: "", error: "Please enter your name." };
    }
    return { isValid: true, trimmedName: trimmed };
  };

  it("rejects empty name", () => {
    const res = validateRespondentName("");
    assert.equal(res.isValid, false);
    assert.equal(res.error, "Please enter your name.");
  });

  it("rejects name containing only whitespace or tabs", () => {
    const resSpaces = validateRespondentName("   ");
    assert.equal(resSpaces.isValid, false);
    assert.equal(resSpaces.error, "Please enter your name.");

    const resTabs = validateRespondentName("\t  \n  ");
    assert.equal(resTabs.isValid, false);
    assert.equal(resTabs.error, "Please enter your name.");
  });

  it("accepts valid names and trims leading/trailing spaces", () => {
    const res1 = validateRespondentName("Maya S.");
    assert.equal(res1.isValid, true);
    assert.equal(res1.trimmedName, "Maya S.");

    const res2 = validateRespondentName("   Alex Chen   ");
    assert.equal(res2.isValid, true);
    assert.equal(res2.trimmedName, "Alex Chen");
  });
});
