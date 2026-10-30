import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { ReportReason, CreateAssistantReportRequest } from "../../types/assistant.ts";
import { api } from "../api.ts";

describe("AI Assistant In-App Reporting (Google Play Compliance)", () => {
  const VALID_REASONS: ReportReason[] = [
    "sexually_explicit",
    "hate_or_harassment",
    "violence_or_harm",
    "inappropriate",
    "other",
  ];

  it("defines all required reporting reason categories", () => {
    assert.equal(VALID_REASONS.length, 5);
    assert.ok(VALID_REASONS.includes("sexually_explicit"));
    assert.ok(VALID_REASONS.includes("hate_or_harassment"));
    assert.ok(VALID_REASONS.includes("violence_or_harm"));
    assert.ok(VALID_REASONS.includes("inappropriate"));
    assert.ok(VALID_REASONS.includes("other"));
  });

  it("validates report payload parameters correctly", () => {
    const validateReportPayload = (
      req: Partial<CreateAssistantReportRequest>
    ): { isValid: boolean; error?: string } => {
      if (!req.message_content || !req.message_content.trim()) {
        return { isValid: false, error: "Reported message content cannot be empty." };
      }
      if (req.message_content.length > 5000) {
        return { isValid: false, error: "Message content exceeds maximum allowed length of 5000 characters." };
      }
      if (!req.reason || !VALID_REASONS.includes(req.reason)) {
        return { isValid: false, error: "A valid reporting reason must be selected." };
      }
      if (req.user_notes && req.user_notes.length > 500) {
        return { isValid: false, error: "User notes cannot exceed 500 characters." };
      }
      return { isValid: true };
    };

    // Valid report
    const valid = validateReportPayload({
      message_content: "Some inappropriate AI output",
      reason: "sexually_explicit",
      user_notes: "This contains mature content.",
    });
    assert.equal(valid.isValid, true);

    // Empty message
    const emptyMsg = validateReportPayload({
      message_content: "   ",
      reason: "inappropriate",
    });
    assert.equal(emptyMsg.isValid, false);
    assert.match(emptyMsg.error!, /empty/i);

    // Invalid reason
    const badReason = validateReportPayload({
      message_content: "Some output",
      reason: "invalid_reason" as any,
    });
    assert.equal(badReason.isValid, false);
    assert.match(badReason.error!, /valid reporting reason/i);

    // Overly long notes
    const longNotes = validateReportPayload({
      message_content: "Some output",
      reason: "other",
      user_notes: "a".repeat(501),
    });
    assert.equal(longNotes.isValid, false);
    assert.match(longNotes.error!, /500 characters/i);
  });

  it("verifies api.reportAssistantMessage method exists and constructs request", async () => {
    assert.equal(typeof api.reportAssistantMessage, "function");

    // Mock global fetch to verify endpoint path and payload
    const originalFetch = globalThis.fetch;
    let interceptedUrl = "";
    let interceptedBody: any = null;

    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      interceptedUrl = url.toString();
      interceptedBody = init?.body ? JSON.parse(init.body as string) : null;
      return {
        ok: true,
        json: async () => ({
          id: "00000000-0000-0000-0000-000000000001",
          status: "received",
          message: "Report submitted successfully.",
        }),
      } as any;
    }) as any;

    try {
      const response = await api.reportAssistantMessage({
        message_content: "Assistant message flagging test",
        reason: "hate_or_harassment",
        user_notes: "Unacceptable campus harassment discussion",
        client_uuid: "11111111-1111-1111-1111-111111111111",
      });

      assert.match(interceptedUrl, /\/api\/assistant\/report$/);
      assert.equal(interceptedBody.reason, "hate_or_harassment");
      assert.equal(interceptedBody.message_content, "Assistant message flagging test");
      assert.equal(response.status, "received");
      assert.equal(response.id, "00000000-0000-0000-0000-000000000001");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
