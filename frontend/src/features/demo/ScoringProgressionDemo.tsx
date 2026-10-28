import React, { useState } from "react";
import {
  BASE_SCORE,
  SCORE_BLOCK_SIZE,
  createInitialSimulatedState,
  addSimulatedContribution,
  simulateBatchSequence,
  type ScoreProgressionState,
} from "../../lib/scoringSimulation";
import {
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  FastForward,
  Plus,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Calculator,
  Layers,
  Sparkles,
} from "lucide-react";

interface ScoringProgressionDemoProps {
  onBackToHome: () => void;
}

export const ScoringProgressionDemo: React.FC<ScoringProgressionDemoProps> = ({ onBackToHome }) => {
  // Two distinct isolated scenarios:
  // Scenario A: PICT (High contributions -> 100 to 101)
  // Scenario B: VJTI (Low contributions -> 100 to 99)
  const [activeScenario, setActiveScenario] = useState<"PICT" | "VJTI">("PICT");

  const [pictState, setPictState] = useState<ScoreProgressionState>(() =>
    createInitialSimulatedState("Pune Institute of Computer Technology", "PICT")
  );

  const [vjtiState, setVjtiState] = useState<ScoreProgressionState>(() =>
    createInitialSimulatedState("Veermata Jijabai Technological Institute", "VJTI")
  );

  const currentState = activeScenario === "PICT" ? pictState : vjtiState;
  const setCurrentState = activeScenario === "PICT" ? setPictState : setVjtiState;
  const isHighScenario = activeScenario === "PICT";

  // Actions
  const handleAddOne = () => {
    // Generate a realistic synthetic mean
    const mean = isHighScenario
      ? Number((8.2 + Math.random() * 1.5).toFixed(2)) // 8.2 - 9.7
      : Number((2.1 + Math.random() * 1.7).toFixed(2)); // 2.1 - 3.8

    setCurrentState((prev) =>
      addSimulatedContribution(
        prev,
        mean,
        `Simulated Student #${prev.contributions.length + 1} (${isHighScenario ? "High Advocate" : "Critical Assessment"})`
      )
    );
  };

  const handleJumpTo19 = () => {
    const newState = simulateBatchSequence(
      currentState.collegeName,
      currentState.shortCode,
      19,
      isHighScenario ? "high" : "low"
    );
    setCurrentState(newState);
  };

  const handleTrigger20th = () => {
    // If fewer than 19, fast forward to 19 then add the 20th
    if (currentState.contributions.length < 19) {
      const state19 = simulateBatchSequence(
        currentState.collegeName,
        currentState.shortCode,
        19,
        isHighScenario ? "high" : "low"
      );
      const mean = isHighScenario ? 9.15 : 2.85;
      const state20 = addSimulatedContribution(
        state19,
        mean,
        `Simulated Student #20 (Threshold Triggering Contribution)`
      );
      setCurrentState(state20);
    } else if (currentState.contributions.length === 19) {
      const mean = isHighScenario ? 9.15 : 2.85;
      setCurrentState((prev) =>
        addSimulatedContribution(
          prev,
          mean,
          `Simulated Student #20 (Threshold Triggering Contribution)`
        )
      );
    }
  };

  const handleReset = () => {
    setCurrentState(
      createInitialSimulatedState(currentState.collegeName, currentState.shortCode)
    );
  };

  // Metrics for visualization
  const currentCount = isHighScenario
    ? currentState.totalQualifyingHigh
    : currentState.totalQualifyingLow;

  const hasCrossedBlock1 = currentCount >= SCORE_BLOCK_SIZE;

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-[#252724] pb-24 font-sans">
      {/* 1. Header Banner with Mandated Prominent Watermark */}
      <header className="bg-[#252724] text-[#F5F2EB] border-b border-[#3A3D38] py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <button
              onClick={onBackToHome}
              className="text-xs uppercase tracking-wider font-semibold text-[#A8B298] hover:text-[#F5F2EB] transition-colors"
            >
              &larr; Return to Application
            </button>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-400 text-amber-950 border border-amber-300 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Isolated Scoring Sandbox
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-3xl sm:text-4xl text-[#F5F2EB] font-bold tracking-tight">
              College Score Progression Engine
            </h1>
            <p className="text-sm sm:text-base text-[#DCD7CD] max-w-3xl leading-relaxed">
              Mathematical demonstration of the deterministic 20-submission block threshold rule.
              Demonstrates why 19 contributions leave institutional scores unchanged, while the 20th contribution triggers the exact ±1 point progression.
            </p>
          </div>
        </div>
      </header>

      {/* Strict Safety Watermark Banner */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/90 text-amber-950 text-xs sm:text-sm flex items-start gap-3 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider text-[11px] text-amber-900 font-mono">
              SCORING DEMO — SIMULATED DATA, NOT REAL STUDENT REVIEWS
            </span>
            <p className="text-amber-900/90 leading-relaxed">
              This interactive demonstration runs exclusively in local browser memory using isolated mathematical fixtures.
              No fake reviews, rating sessions, or scores are written to the live Supabase database or production college records.
              Live production scores and ratings remain completely untouched.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Scenario Switcher Tabs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        <div className="bg-white p-2 rounded-xl border border-[#D5D0C5] flex flex-col sm:flex-row gap-2 shadow-sm">
          <button
            onClick={() => setActiveScenario("PICT")}
            className={`flex-1 py-3 px-4 rounded-lg text-left transition-all flex items-center justify-between ${
              activeScenario === "PICT"
                ? "bg-[#252724] text-[#F5F2EB] shadow-xs"
                : "bg-transparent text-[#5A5D56] hover:bg-[#F5F2EB]"
            }`}
          >
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider opacity-80">
                Scenario A: Positive Progression
              </div>
              <div className="font-serif font-bold text-base sm:text-lg">
                PICT: 100 &rarr; 101
              </div>
              <div className="text-xs opacity-75 mt-0.5">
                Eligible High Contributions (&ge; 8.0/10)
              </div>
            </div>
            <TrendingUp
              className={`w-5 h-5 ${activeScenario === "PICT" ? "text-emerald-400" : "text-[#727D60]"}`}
            />
          </button>

          <button
            onClick={() => setActiveScenario("VJTI")}
            className={`flex-1 py-3 px-4 rounded-lg text-left transition-all flex items-center justify-between ${
              activeScenario === "VJTI"
                ? "bg-[#252724] text-[#F5F2EB] shadow-xs"
                : "bg-transparent text-[#5A5D56] hover:bg-[#F5F2EB]"
            }`}
          >
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider opacity-80">
                Scenario B: Critical Progression
              </div>
              <div className="font-serif font-bold text-base sm:text-lg">
                VJTI: 100 &rarr; 99
              </div>
              <div className="text-xs opacity-75 mt-0.5">
                Eligible Low Contributions (&lt; 4.0/10)
              </div>
            </div>
            <TrendingDown
              className={`w-5 h-5 ${activeScenario === "VJTI" ? "text-rose-400" : "text-[#727D60]"}`}
            />
          </button>
        </div>
      </div>

      {/* 3. Main Dashboard Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
        {/* Core State Display Card */}
        <div className="bg-white rounded-2xl border border-[#D5D0C5] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#F0ECE1]">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F5F2EB] text-[#5A5D56] border border-[#D5D0C5] mb-2">
                Simulated Institution: {currentState.shortCode}
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#252724]">
                {currentState.collegeName}
              </h2>
              <p className="text-xs sm:text-sm text-[#727D60] mt-1">
                Testing {isHighScenario ? "High consensus (mean >= 8.0)" : "Critical consensus (mean < 4.0)"} contribution blocks.
              </p>
            </div>

            {/* Before-and-After Score Transformation */}
            <div className="flex items-center gap-4 bg-[#F5F2EB] p-4 rounded-xl border border-[#E5E1D8]">
              <div className="text-center">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-[#8C9088]">
                  Baseline Score
                </span>
                <span className="font-serif text-2xl sm:text-3xl font-bold text-zinc-500">
                  {BASE_SCORE}
                </span>
              </div>

              <ArrowRight className="w-5 h-5 text-[#727D60] shrink-0" />

              <div className="text-center">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-[#8C9088]">
                  Simulated Score
                </span>
                <span
                  className={`font-serif text-2xl sm:text-3xl font-bold ${
                    currentState.currentScore > BASE_SCORE
                      ? "text-emerald-700"
                      : currentState.currentScore < BASE_SCORE
                      ? "text-rose-700"
                      : "text-zinc-800"
                  }`}
                >
                  {currentState.currentScore}
                </span>
              </div>

              <div className="pl-3 border-l border-[#D5D0C5] text-left">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-[#8C9088]">
                  Score Delta
                </span>
                <span
                  className={`font-mono font-bold text-sm ${
                    currentState.currentScore > BASE_SCORE
                      ? "text-emerald-700"
                      : currentState.currentScore < BASE_SCORE
                      ? "text-rose-700"
                      : "text-zinc-500"
                  }`}
                >
                  {currentState.currentScore > BASE_SCORE
                    ? `+${currentState.currentScore - BASE_SCORE}`
                    : currentState.currentScore < BASE_SCORE
                    ? `${currentState.currentScore - BASE_SCORE}`
                    : "0 (No Change)"}
                </span>
              </div>
            </div>
          </div>

          {/* 20-Contribution Block Gauge */}
          <div className="mt-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-mono font-bold uppercase tracking-wider text-[#5A5D56] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#727D60]" />
                Block #1 Threshold Progress: {currentCount} / {SCORE_BLOCK_SIZE} qualifying contributions
              </span>
              <span
                className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                  hasCrossedBlock1
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : currentCount === 19
                    ? "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
                    : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                }`}
              >
                {hasCrossedBlock1
                  ? "✓ Block #1 Triggered (Score Changed)"
                  : currentCount === 19
                  ? "⚠ 19/20 Reached — 1 more required for trigger!"
                  : `Block Progress: ${Math.round((currentCount / SCORE_BLOCK_SIZE) * 100)}%`}
              </span>
            </div>

            {/* 20 discrete visual segments */}
            <div className="grid grid-cols-10 sm:grid-cols-20 gap-1.5 pt-1">
              {Array.from({ length: SCORE_BLOCK_SIZE }, (_, idx) => {
                const slotNum = idx + 1;
                const isFilled = slotNum <= currentCount;
                const is20th = slotNum === SCORE_BLOCK_SIZE;

                let segmentColor = "bg-[#E5E1D8] text-[#8C9088]";
                if (isFilled) {
                  if (is20th) {
                    segmentColor = isHighScenario
                      ? "bg-emerald-600 text-white shadow-xs font-bold ring-2 ring-emerald-300"
                      : "bg-rose-600 text-white shadow-xs font-bold ring-2 ring-rose-300";
                  } else {
                    segmentColor = "bg-[#727D60] text-[#F5F2EB]";
                  }
                } else if (is20th && currentCount === 19) {
                  segmentColor = "bg-amber-100 text-amber-900 border-2 border-dashed border-amber-400 font-bold animate-pulse";
                }

                return (
                  <div
                    key={slotNum}
                    className={`h-11 rounded flex flex-col items-center justify-center text-[10px] font-mono transition-all ${segmentColor}`}
                    title={`Slot #${slotNum} ${isFilled ? "(Filled)" : "(Pending)"}`}
                  >
                    <span>#{slotNum}</span>
                    {is20th && (
                      <span className="text-[9px] font-bold uppercase tracking-tight">
                        {isFilled ? "TRIGGER" : "GATE"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#727D60] font-mono pt-1">
              <span>Slot 1: First contribution</span>
              <span className="font-semibold text-amber-800">
                Slot 19: Maximum count with ZERO score delta
              </span>
              <span className="font-semibold text-emerald-800">
                Slot 20: Mathematical trigger point (±1 point)
              </span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="mt-8 pt-6 border-t border-[#F0ECE1] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleAddOne}
                disabled={currentCount >= 25}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#252724] text-[#F5F2EB] text-xs font-semibold hover:bg-[#3A3D38] transition-colors disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Single Contribution
              </button>

              <button
                onClick={handleJumpTo19}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E5E1D8] text-[#252724] text-xs font-semibold hover:bg-[#D5D0C5] transition-colors border border-[#D5D0C5]"
              >
                <FastForward className="w-3.5 h-3.5 text-[#727D60]" />
                Fast-Forward to 19 (Score Stays 100)
              </button>

              <button
                onClick={handleTrigger20th}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs ${
                  isHighScenario
                    ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                    : "bg-rose-700 hover:bg-rose-800 text-white"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Execute 20th Contribution (Crosses Threshold)
              </button>
            </div>

            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#727D60] hover:text-[#252724] hover:bg-[#F5F2EB] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Simulation
            </button>
          </div>
        </div>

        {/* 4. Side-by-Side Comparison Matrix */}
        <div className="bg-white rounded-2xl border border-[#D5D0C5] p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#727D60]" />
            <h3 className="font-serif text-lg font-bold text-[#252724]">
              Before &amp; After Comparison Matrix
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="border-b border-[#D5D0C5] bg-[#F5F2EB] text-[#5A5D56] font-mono">
                  <th className="py-2.5 px-3">State Dimension</th>
                  <th className="py-2.5 px-3">Initial State (0)</th>
                  <th className="py-2.5 px-3 bg-amber-50/70 border-x border-amber-200 text-amber-900 font-bold">
                    Pre-Threshold State (19)
                  </th>
                  <th className="py-2.5 px-3 bg-emerald-50/70 text-emerald-900 font-bold">
                    Post-Threshold State (20)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE1]">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-[#252724]">
                    Eligible Contributions Count
                  </td>
                  <td className="py-2.5 px-3 font-mono">0</td>
                  <td className="py-2.5 px-3 font-mono bg-amber-50/40 border-x border-amber-100 font-bold">
                    19
                  </td>
                  <td className="py-2.5 px-3 font-mono bg-emerald-50/40 font-bold text-emerald-800">
                    20
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-3 font-semibold text-[#252724]">
                    Block Calculation (count // 20)
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[#727D60]">
                    0 // 20 = <strong>0</strong>
                  </td>
                  <td className="py-2.5 px-3 font-mono bg-amber-50/40 border-x border-amber-100 text-amber-900">
                    19 // 20 = <strong>0</strong>
                  </td>
                  <td className="py-2.5 px-3 font-mono bg-emerald-50/40 text-emerald-900 font-bold">
                    20 // 20 = <strong>1</strong>
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-3 font-semibold text-[#252724]">
                    Block Completed?
                  </td>
                  <td className="py-2.5 px-3 font-mono text-zinc-500">None</td>
                  <td className="py-2.5 px-3 font-mono bg-amber-50/40 border-x border-amber-100 text-amber-800">
                    No (0 &gt; 0 is False)
                  </td>
                  <td className="py-2.5 px-3 font-mono bg-emerald-50/40 text-emerald-700 font-bold">
                    Yes (Block #1 Completed)
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-3 font-semibold text-[#252724]">
                    Score Adjustment Delta
                  </td>
                  <td className="py-2.5 px-3 font-mono text-zinc-500">0</td>
                  <td className="py-2.5 px-3 font-mono bg-amber-50/40 border-x border-amber-100 text-amber-900 font-bold">
                    0 (No Delta)
                  </td>
                  <td className="py-2.5 px-3 font-mono bg-emerald-50/40 font-bold text-emerald-800">
                    {isHighScenario ? "+1 point" : "-1 point"}
                  </td>
                </tr>

                <tr className="font-bold text-sm bg-[#F5F2EB]/50">
                  <td className="py-3 px-3 text-[#252724]">
                    Resulting Institutional Score
                  </td>
                  <td className="py-3 px-3 font-mono text-zinc-600">
                    100
                  </td>
                  <td className="py-3 px-3 font-mono bg-amber-100/60 border-x border-amber-200 text-amber-950 font-bold">
                    100 (Unchanged!)
                  </td>
                  <td
                    className={`py-3 px-3 font-mono font-bold ${
                      isHighScenario
                        ? "bg-emerald-100/70 text-emerald-900"
                        : "bg-rose-100/70 text-rose-900"
                    }`}
                  >
                    {isHighScenario ? "101 (+1)" : "99 (-1)"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Mathematical Explanation Card */}
        <div className="bg-[#E5E1D8]/40 rounded-2xl border border-[#D5D0C5] p-6 space-y-4">
          <h3 className="font-serif text-base font-bold text-[#252724] flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#727D60]" />
            Why 19 Contributions Do Not Trigger a Change &amp; Why the 20th Does
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#5A5D56] leading-relaxed">
            <div className="p-4 rounded-xl bg-white border border-[#D5D0C5] space-y-2">
              <span className="font-bold text-amber-900 uppercase font-mono block">
                Rule 1: Volatility Resistance (At Count = 19)
              </span>
              <p>
                In Campus Uncut, institutional scores are resilient against volatility. Score changes do not occur on a continuous decimal curve.
                Instead, changes occur exclusively in deterministic 20-submission blocks:
              </p>
              <code className="block p-2 rounded bg-[#F5F2EB] font-mono text-[#252724] text-[11px]">
                old_block = Math.floor(18 / 20) = 0<br />
                new_block = Math.floor(19 / 20) = 0<br />
                has_crossed = (new_block &gt; old_block) &rarr; False
              </code>
              <p>
                Because <code>new_block == old_block == 0</code>, no threshold has been crossed. The score remains exactly <strong>100</strong>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#D5D0C5] space-y-2">
              <span className="font-bold text-emerald-900 uppercase font-mono block">
                Rule 2: Threshold Crossing (At Count = 20)
              </span>
              <p>
                When the 20th eligible contribution is submitted, the integer division quotient transitions to a new non-zero block:
              </p>
              <code className="block p-2 rounded bg-[#F5F2EB] font-mono text-[#252724] text-[11px]">
                old_block = Math.floor(19 / 20) = 0<br />
                new_block = Math.floor(20 / 20) = 1<br />
                has_crossed = (1 &gt; 0) &rarr; True (Delta = {isHighScenario ? "+1" : "-1"})
              </code>
              <p>
                The database issues an atomic <code>score_event</code> for Block #1, applying the delta. The score advances from <strong>100 &rarr; {isHighScenario ? "101" : "99"}</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* 6. Chronological Simulated Contribution Ledger */}
        <div className="bg-white rounded-2xl border border-[#D5D0C5] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-[#252724]">
              Simulated Submission Log ({currentState.contributions.length} Contributions)
            </h3>
            <span className="text-[11px] font-mono text-[#8C9088]">
              Local Browser State Only
            </span>
          </div>

          {currentState.contributions.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8C9088] bg-[#F5F2EB]/50 rounded-xl border border-dashed border-[#D5D0C5]">
              No simulated contributions added yet. Use the controls above to advance the counter.
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto border border-[#E5E1D8] rounded-xl">
              <table className="w-full text-left text-xs font-sans border-collapse">
                <thead className="sticky top-0 bg-[#F5F2EB] border-b border-[#D5D0C5] text-[#5A5D56] font-mono">
                  <tr>
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Respondent Alias</th>
                    <th className="py-2 px-3">Unrounded Mean</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Block Action</th>
                    <th className="py-2 px-3">Score After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0ECE1]">
                  {currentState.contributions.map((c) => (
                    <tr
                      key={c.index}
                      className={
                        c.hasCrossed
                          ? isHighScenario
                            ? "bg-emerald-50/80 font-semibold"
                            : "bg-rose-50/80 font-semibold"
                          : c.newCount === 19
                          ? "bg-amber-50/40"
                          : "hover:bg-[#F5F2EB]/40"
                      }
                    >
                      <td className="py-2 px-3 font-mono text-[#727D60]">
                        #{c.index}
                      </td>
                      <td className="py-2 px-3 text-[#252724]">
                        {c.respondentAlias}
                      </td>
                      <td className="py-2 px-3 font-mono">
                        {c.unroundedMean.toFixed(2)} / 10
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            c.category === "high"
                              ? "bg-emerald-100 text-emerald-800"
                              : c.category === "low"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {c.category}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono">
                        {c.hasCrossed ? (
                          <span className={isHighScenario ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}>
                            ★ Block #{c.blockNumber} Crossed ({c.scoreDelta! > 0 ? "+" : ""}{c.scoreDelta})
                          </span>
                        ) : (
                          <span className="text-[#8C9088]">
                            Block 0 ({c.oldCount} &rarr; {c.newCount})
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold">
                        {c.scoreAfter}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
