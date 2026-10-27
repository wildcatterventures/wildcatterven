import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getSpeechRecognitionErrorMessage,
  startSpeechSession,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
} from "../voice.ts";

describe("voiceSession & SpeechRecognition helpers", () => {
  describe("getSpeechRecognitionErrorMessage", () => {
    it("handles permission denial gracefully", () => {
      const msg = getSpeechRecognitionErrorMessage("not-allowed");
      assert.ok(msg.includes("Microphone access was denied"));
    });

    it("handles missing microphone hardware", () => {
      const msg = getSpeechRecognitionErrorMessage("audio-capture");
      assert.ok(msg.includes("No microphone was detected"));
    });

    it("handles no speech detected", () => {
      const msg = getSpeechRecognitionErrorMessage("no-speech");
      assert.ok(msg.includes("No speech detected"));
    });

    it("handles network failure", () => {
      const msg = getSpeechRecognitionErrorMessage("network");
      assert.ok(msg.includes("network"));
    });

    it("handles browser service restrictions", () => {
      const msg = getSpeechRecognitionErrorMessage("service-not-allowed");
      assert.ok(msg.includes("not permitted by your browser"));
    });

    it("handles error objects with error property", () => {
      const msg = getSpeechRecognitionErrorMessage({ error: "not-allowed" });
      assert.ok(msg.includes("Microphone access was denied"));
    });
  });

  describe("Feature detection in headless environment", () => {
    it("reports supported status boolean without throwing", () => {
      const recognitionSupported = isSpeechRecognitionSupported();
      const synthesisSupported = isSpeechSynthesisSupported();
      assert.strictEqual(typeof recognitionSupported, "boolean");
      assert.strictEqual(typeof synthesisSupported, "boolean");
    });
  });

  describe("startSpeechSession error handling in unsupported environment", () => {
    it("notifies onError and returns controller without crashing when SpeechRecognition is absent", () => {
      let reportedError: string | null = null;
      let stateChanged: string | null = null;

      const controller = startSpeechSession({
        onError: (msg) => {
          reportedError = msg;
        },
        onStateChange: (state) => {
          stateChanged = state;
        },
      });

      assert.ok(controller);
      assert.strictEqual(typeof controller.sessionId, "number");
      assert.strictEqual(typeof controller.stop, "function");
      assert.strictEqual(typeof controller.abort, "function");
      assert.strictEqual(controller.getState(), "error");
      assert.strictEqual(stateChanged, "error");
      assert.ok(reportedError && (reportedError as string).includes("not supported"));
    });
  });

  describe("startSpeechSession Mock SpeechRecognition Simulation", () => {
    it("manages session lifecycle, interim results, silence timer, and clean abort", (t, done) => {
      let activeMock: any = null;

      class MockSpeechRecognition {
        continuous = false;
        interimResults = false;
        lang = "";
        maxAlternatives = 1;
        onstart: any = null;
        onspeechstart: any = null;
        onresult: any = null;
        onerror: any = null;
        onend: any = null;

        constructor() {
          activeMock = this;
        }

        start() {
          setTimeout(() => {
            this.onstart?.();
            // Dispatch speech result event
            if (this.onresult) {
              const event = {
                resultIndex: 0,
                results: [
                  Object.assign([{ transcript: "engineering colleges" }], { isFinal: true }),
                ],
              };
              this.onresult(event);
            }
          }, 5);
        }
        stop() {
          setTimeout(() => this.onend?.(), 5);
        }
        abort() {
          setTimeout(() => this.onend?.(), 5);
        }
      }

      const originalWindow = (globalThis as any).window;
      (globalThis as any).window = {
        SpeechRecognition: MockSpeechRecognition,
      };

      const interimEvents: string[] = [];

      const controller = startSpeechSession({
        silenceTimeoutMs: 50,
        autoStopOnSilence: true,
        onInterimTranscript: (text) => {
          interimEvents.push(text);
        },
        onSilenceTimeout: (transcript) => {
          assert.strictEqual(transcript, "engineering colleges");
          assert.ok(interimEvents.includes("engineering colleges"));
          controller.abort();
          (globalThis as any).window = originalWindow;
          done();
        },
      });

      assert.strictEqual(controller.getState(), "starting");
    });

    it("prevents competing sessions by terminating previous session cleanly", () => {
      let abortedPrevious = false;

      class MockSpeechRecognition {
        continuous = false;
        interimResults = false;
        lang = "";
        onstart: any = null;
        onresult: any = null;
        onend: any = null;
        start() {}
        stop() {}
        abort() {
          abortedPrevious = true;
        }
      }

      const originalWindow = (globalThis as any).window;
      (globalThis as any).window = {
        SpeechRecognition: MockSpeechRecognition,
      };

      const session1 = startSpeechSession({
        silenceTimeoutMs: 1000,
      });

      const session2 = startSpeechSession({
        silenceTimeoutMs: 1000,
      });

      assert.ok(session2.sessionId > session1.sessionId);
      assert.strictEqual(abortedPrevious, true);

      (globalThis as any).window = originalWindow;
    });
  });
});
