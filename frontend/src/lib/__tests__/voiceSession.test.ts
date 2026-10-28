import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getSpeechRecognitionErrorMessage,
  startSpeechSession,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  TranscriptAssembler,
  assembleSpeechResults,
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
    it("manages session lifecycle, interim results, silence timer, and clean abort", (_, done) => {
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

    it("does not invoke onFinalTranscript on onend if silence timeout already fired (prevents duplicate submission)", (_, done) => {
      let finalTranscriptCalls = 0;
      let silenceTimeoutCalls = 0;

      class MockSpeechRecognition {
        continuous = false;
        interimResults = false;
        lang = "";
        onstart: any = null;
        onresult: any = null;
        onend: any = null;

        start() {
          setTimeout(() => {
            this.onstart?.();
            if (this.onresult) {
              this.onresult({
                resultIndex: 0,
                results: [Object.assign([{ transcript: "mumbai colleges" }], { isFinal: true })],
              });
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

      startSpeechSession({
        silenceTimeoutMs: 25,
        autoStopOnSilence: true,
        onSilenceTimeout: (transcript) => {
          silenceTimeoutCalls++;
          assert.strictEqual(transcript, "mumbai colleges");
        },
        onFinalTranscript: () => {
          finalTranscriptCalls++;
        },
        onEnd: () => {
          setTimeout(() => {
            assert.strictEqual(silenceTimeoutCalls, 1);
            assert.strictEqual(finalTranscriptCalls, 0, "onFinalTranscript should not fire when silence already handled final transcript");
            (globalThis as any).window = originalWindow;
            done();
          }, 15);
        },
      });
    });

    it("user abort cancels timers and prevents onFinalTranscript or onSilenceTimeout", (_, done) => {
      let callbacksFired = 0;

      class MockSpeechRecognition {
        continuous = false;
        interimResults = false;
        lang = "";
        onstart: any = null;
        onresult: any = null;
        onend: any = null;

        start() {
          setTimeout(() => {
            this.onstart?.();
            if (this.onresult) {
              this.onresult({
                resultIndex: 0,
                results: [Object.assign([{ transcript: "cancelled query" }], { isFinal: true })],
              });
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

      const controller = startSpeechSession({
        silenceTimeoutMs: 30,
        autoStopOnSilence: true,
        onSilenceTimeout: () => {
          callbacksFired++;
        },
        onFinalTranscript: () => {
          callbacksFired++;
        },
      });

      // Abort session midway
      setTimeout(() => {
        controller.abort();
      }, 10);

      // Verify that after silence timeout would have elapsed, 0 callbacks fired
      setTimeout(() => {
        assert.strictEqual(callbacksFired, 0, "No callbacks should fire on aborted session");
        (globalThis as any).window = originalWindow;
        done();
      }, 50);
    });
  });

  describe("TranscriptAssembler Unit Tests (Section 5 Regression Sequence)", () => {
    it("Event 1 -> Event 4 sequence matches expected transcripts without duplicating any segment", () => {
      const assembler = new TranscriptAssembler();

      // Event 1: Final result: "Show me"
      const event1 = {
        resultIndex: 0,
        results: [Object.assign([{ transcript: "Show me" }], { isFinal: true })],
      };
      const snap1 = assembler.processEvent(event1);
      assert.strictEqual(snap1.finalTranscript, "Show me");
      assert.strictEqual(snap1.interimTranscript, "");
      assert.strictEqual(snap1.combinedTranscript, "Show me");
      assert.strictEqual(snap1.isComplete, true);

      // Event 2: Existing final: "Show me", New interim: "engineering"
      const event2 = {
        resultIndex: 1,
        results: [
          Object.assign([{ transcript: "Show me" }], { isFinal: true }),
          Object.assign([{ transcript: "engineering" }], { isFinal: false }),
        ],
      };
      const snap2 = assembler.processEvent(event2);
      assert.strictEqual(snap2.finalTranscript, "Show me");
      assert.strictEqual(snap2.interimTranscript, "engineering");
      assert.strictEqual(snap2.combinedTranscript, "Show me engineering");
      assert.strictEqual(snap2.isComplete, false);
      assert.ok(!snap2.combinedTranscript.includes("Show me Show me"), "Must not duplicate earlier final segment");

      // Event 3: Existing final: "Show me", Final: "engineering", New interim: "colleges"
      const event3 = {
        resultIndex: 1,
        results: [
          Object.assign([{ transcript: "Show me" }], { isFinal: true }),
          Object.assign([{ transcript: "engineering" }], { isFinal: true }),
          Object.assign([{ transcript: "colleges" }], { isFinal: false }),
        ],
      };
      const snap3 = assembler.processEvent(event3);
      assert.strictEqual(snap3.finalTranscript, "Show me engineering");
      assert.strictEqual(snap3.interimTranscript, "colleges");
      assert.strictEqual(snap3.combinedTranscript, "Show me engineering colleges");
      assert.strictEqual(snap3.isComplete, false);
      assert.ok(!snap3.combinedTranscript.includes("Show me Show me"), "Must not duplicate earlier final segment");
      assert.ok(!snap3.combinedTranscript.includes("engineering engineering"), "Must not duplicate finalized interim segment");

      // Event 4: Final results: "Show me", "engineering", "colleges", New interim: "in Mumbai"
      const event4 = {
        resultIndex: 2,
        results: [
          Object.assign([{ transcript: "Show me" }], { isFinal: true }),
          Object.assign([{ transcript: "engineering" }], { isFinal: true }),
          Object.assign([{ transcript: "colleges" }], { isFinal: true }),
          Object.assign([{ transcript: "in Mumbai" }], { isFinal: false }),
        ],
      };
      const snap4 = assembler.processEvent(event4);
      assert.strictEqual(snap4.finalTranscript, "Show me engineering colleges");
      assert.strictEqual(snap4.interimTranscript, "in Mumbai");
      assert.strictEqual(snap4.combinedTranscript, "Show me engineering colleges in Mumbai");
      assert.strictEqual(snap4.isComplete, false);
      assert.ok(!snap4.combinedTranscript.includes("colleges colleges"), "Must not duplicate segment");
      assert.ok(!snap4.combinedTranscript.includes("Show me Show me"), "Must not duplicate initial segment");
    });

    it("handles an interim segment changing into a final segment without duplication", () => {
      const assembler = new TranscriptAssembler();

      // Step 1: Initial interim hypothesis
      const ev1 = {
        resultIndex: 0,
        results: [Object.assign([{ transcript: "engineering" }], { isFinal: false })],
      };
      const snap1 = assembler.processEvent(ev1);
      assert.strictEqual(snap1.combinedTranscript, "engineering");
      assert.strictEqual(snap1.isComplete, false);

      // Step 2: Recognition engine finalizes segment at index 0
      const ev2 = {
        resultIndex: 0,
        results: [Object.assign([{ transcript: "engineering" }], { isFinal: true })],
      };
      const snap2 = assembler.processEvent(ev2);
      assert.strictEqual(snap2.combinedTranscript, "engineering");
      assert.strictEqual(snap2.finalTranscript, "engineering");
      assert.strictEqual(snap2.interimTranscript, "");
      assert.strictEqual(snap2.isComplete, true);
      assert.notStrictEqual(snap2.combinedTranscript, "engineering engineering");
    });

    it("preserves legitimate repetition when the same word is spoken twice", () => {
      const assembler = new TranscriptAssembler();

      const ev = {
        resultIndex: 0,
        results: [
          Object.assign([{ transcript: "very" }], { isFinal: true }),
          Object.assign([{ transcript: "very" }], { isFinal: true }),
          Object.assign([{ transcript: "good" }], { isFinal: false }),
        ],
      };
      const snap = assembler.processEvent(ev);
      assert.strictEqual(snap.combinedTranscript, "very very good");
      assert.strictEqual(snap.finalTranscript, "very very");
      assert.strictEqual(snap.interimTranscript, "good");
    });

    it("handles incremental slice events where results array starts at index 0 corresponding to resultIndex", () => {
      const assembler = new TranscriptAssembler();

      // Event 1 at index 0
      assembler.processEvent({
        resultIndex: 0,
        results: [Object.assign([{ transcript: "first phrase" }], { isFinal: true })],
      });

      // Event 2 slice containing only segment 1
      const snap = assembler.processEvent({
        resultIndex: 1,
        results: [Object.assign([{ transcript: "second phrase" }], { isFinal: false })],
      });

      assert.strictEqual(snap.combinedTranscript, "first phrase second phrase");
      assert.strictEqual(snap.finalTranscript, "first phrase");
      assert.strictEqual(snap.interimTranscript, "second phrase");
    });

    it("assembleSpeechResults functional helper works accurately", () => {
      const event = {
        resultIndex: 0,
        results: [
          Object.assign([{ transcript: "test helper" }], { isFinal: true }),
        ],
      };
      const snap = assembleSpeechResults(event);
      assert.strictEqual(snap.combinedTranscript, "test helper");
      assert.strictEqual(snap.isComplete, true);
    });

    it("reset() clears previous final and interim segments completely", () => {
      const assembler = new TranscriptAssembler();
      assembler.processEvent({
        resultIndex: 0,
        results: [Object.assign([{ transcript: "prior session" }], { isFinal: true })],
      });
      assert.strictEqual(assembler.getCombinedTranscript(), "prior session");

      assembler.reset();
      assert.strictEqual(assembler.getCombinedTranscript(), "");
      assert.strictEqual(assembler.getFinalTranscript(), "");
    });
  });

  describe("startSpeechSession Multi-Event Integration Regression Tests", () => {
    it("dispatches multi-event sequence through MockSpeechRecognition and verifies transcript stream", (_, done) => {
      const emissions: string[] = [];

      class MockMultiEventRecognition {
        continuous = true;
        interimResults = true;
        lang = "";
        maxAlternatives = 1;
        onstart: any = null;
        onspeechstart: any = null;
        onresult: any = null;
        onerror: any = null;
        onend: any = null;

        start() {
          setTimeout(() => {
            this.onstart?.();

            // Event 1
            setTimeout(() => {
              this.onresult?.({
                resultIndex: 0,
                results: [Object.assign([{ transcript: "Show me" }], { isFinal: true })],
              });
            }, 5);

            // Event 2
            setTimeout(() => {
              this.onresult?.({
                resultIndex: 1,
                results: [
                  Object.assign([{ transcript: "Show me" }], { isFinal: true }),
                  Object.assign([{ transcript: "engineering" }], { isFinal: false }),
                ],
              });
            }, 15);

            // Event 3
            setTimeout(() => {
              this.onresult?.({
                resultIndex: 1,
                results: [
                  Object.assign([{ transcript: "Show me" }], { isFinal: true }),
                  Object.assign([{ transcript: "engineering" }], { isFinal: true }),
                  Object.assign([{ transcript: "colleges" }], { isFinal: false }),
                ],
              });
            }, 25);

            // Event 4
            setTimeout(() => {
              this.onresult?.({
                resultIndex: 2,
                results: [
                  Object.assign([{ transcript: "Show me" }], { isFinal: true }),
                  Object.assign([{ transcript: "engineering" }], { isFinal: true }),
                  Object.assign([{ transcript: "colleges" }], { isFinal: true }),
                  Object.assign([{ transcript: "in Mumbai" }], { isFinal: false }),
                ],
              });
            }, 35);
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
        SpeechRecognition: MockMultiEventRecognition,
      };

      const controller = startSpeechSession({
        silenceTimeoutMs: 60,
        autoStopOnSilence: true,
        onInterimTranscript: (combined) => {
          emissions.push(combined);
        },
        onSilenceTimeout: (finalTranscript) => {
          assert.strictEqual(finalTranscript, "Show me engineering colleges in Mumbai");

          // Verify sequence of emissions
          assert.ok(emissions.includes("Show me"));
          assert.ok(emissions.includes("Show me engineering"));
          assert.ok(emissions.includes("Show me engineering colleges"));
          assert.ok(emissions.includes("Show me engineering colleges in Mumbai"));

          // Crucial regression check: NO emission must ever contain duplicated phrases
          for (const em of emissions) {
            assert.ok(!em.includes("Show me Show me"), `Emission duplicated segment: "${em}"`);
            assert.ok(!em.includes("engineering engineering"), `Emission duplicated segment: "${em}"`);
          }

          controller.abort();
          (globalThis as any).window = originalWindow;
          done();
        },
      });
    });

    it("new microphone session starts fresh and does not retain previous session transcript", () => {
      class MockSpeechRecognition {
        continuous = true;
        interimResults = true;
        lang = "";
        onstart: any = null;
        onresult: any = null;
        onend: any = null;
        start() {}
        stop() {}
        abort() {}
      }

      const originalWindow = (globalThis as any).window;
      (globalThis as any).window = {
        SpeechRecognition: MockSpeechRecognition,
      };

      const session1 = startSpeechSession({ silenceTimeoutMs: 1000 });
      assert.strictEqual(session1.getTranscript?.(), "");

      const session2 = startSpeechSession({ silenceTimeoutMs: 1000 });
      assert.strictEqual(session2.getTranscript?.(), "");
      assert.notStrictEqual(session1.sessionId, session2.sessionId);

      (globalThis as any).window = originalWindow;
    });

    it("stale event from an aborted earlier session does not affect active session", () => {
      let activeTranscript = "";

      class MockSpeechRecognition {
        continuous = true;
        interimResults = true;
        lang = "";
        onstart: any = null;
        onresult: any = null;
        onend: any = null;
        start() {}
        stop() {}
        abort() {}
      }

      const originalWindow = (globalThis as any).window;
      (globalThis as any).window = {
        SpeechRecognition: MockSpeechRecognition,
      };

      let session1OnResult: any = null;
      const session1 = startSpeechSession({
        onInterimTranscript: (t) => {
          activeTranscript = t;
        },
      });
      session1OnResult = (session1 as any).onresult;

      // Start session 2 (which cleanly aborts session 1)
      const session2 = startSpeechSession({
        onInterimTranscript: (t) => {
          activeTranscript = t;
        },
      });

      // Dispatch event to session 1 handler if it was somehow retained
      if (session1OnResult) {
        session1OnResult({
          resultIndex: 0,
          results: [Object.assign([{ transcript: "stale text" }], { isFinal: true })],
        });
      }

      // activeTranscript must not be contaminated by stale session
      assert.strictEqual(activeTranscript, "");
      session2.abort();

      (globalThis as any).window = originalWindow;
    });

    it("natural onend fires onFinalTranscript exactly once with complete transcript when silence timeout did not fire", (_, done) => {
      let finalTranscriptCalls = 0;
      let finalTranscriptReceived = "";

      class MockNaturalEndRecognition {
        continuous = true;
        interimResults = true;
        lang = "";
        onstart: any = null;
        onresult: any = null;
        onend: any = null;

        start() {
          setTimeout(() => {
            this.onstart?.();
            // Emit speech results
            this.onresult?.({
              resultIndex: 0,
              results: [
                Object.assign([{ transcript: "Show me engineering" }], { isFinal: true }),
              ],
            });

            // Browser engine stops naturally before the 3.5s silence timeout
            setTimeout(() => {
              this.onend?.();
            }, 10);
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
        SpeechRecognition: MockNaturalEndRecognition,
      };

      startSpeechSession({
        silenceTimeoutMs: 1000,
        autoStopOnSilence: true,
        onFinalTranscript: (text) => {
          finalTranscriptCalls++;
          finalTranscriptReceived = text;
        },
        onEnd: () => {
          setTimeout(() => {
            assert.strictEqual(finalTranscriptCalls, 1, "onFinalTranscript should be called exactly once");
            assert.strictEqual(finalTranscriptReceived, "Show me engineering");
            (globalThis as any).window = originalWindow;
            done();
          }, 20);
        },
      });
    });

    it("startSpeechSession preserves legitimate adjacent repeated words without deduplicating", (_, done) => {
      class MockRepetitionRecognition {
        continuous = true;
        interimResults = true;
        lang = "";
        onstart: any = null;
        onresult: any = null;
        onend: any = null;

        start() {
          setTimeout(() => {
            this.onstart?.();
            this.onresult?.({
              resultIndex: 0,
              results: [
                Object.assign([{ transcript: "very" }], { isFinal: true }),
                Object.assign([{ transcript: "very" }], { isFinal: true }),
                Object.assign([{ transcript: "good" }], { isFinal: true }),
              ],
            });
            setTimeout(() => this.onend?.(), 10);
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
        SpeechRecognition: MockRepetitionRecognition,
      };

      startSpeechSession({
        silenceTimeoutMs: 1000,
        onFinalTranscript: (text) => {
          assert.strictEqual(text, "very very good");
          (globalThis as any).window = originalWindow;
          done();
        },
      });
    });
  });
});
