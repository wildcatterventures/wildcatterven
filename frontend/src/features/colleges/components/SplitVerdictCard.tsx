import React from "react";
import { AlertCircle, HelpCircle, Users, CheckCircle2, AlertTriangle, Layers } from "lucide-react";
import { analyzeSplitVerdict, type SplitVerdictAnalysis } from "../../../lib/splitVerdict";
import type { ParameterDistribution } from "../../../types/college";

interface SplitVerdictCardProps {
  parameterName: string;
  categoryName: string;
  distributions?: ParameterDistribution[];
  averageScore?: number | null;
  numericCount?: number;
  noViewCount?: number;
  className?: string;
}

export const SplitVerdictCard: React.FC<SplitVerdictCardProps> = ({
  parameterName,
  categoryName,
  distributions = [],
  averageScore,
  numericCount = 0,
  noViewCount = 0,
  className = "",
}) => {
  const analysis: SplitVerdictAnalysis = analyzeSplitVerdict(
    distributions,
    averageScore,
    numericCount
  );

  const getVerdictIcon = (type: SplitVerdictAnalysis["verdictType"]) => {
    switch (type) {
      case "split_verdict":
        return <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />;
      case "agreement_high":
        return <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />;
      case "agreement_low":
        return <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />;
      case "agreement_neutral":
      case "mixed_feedback":
        return <Layers className="w-4 h-4 text-charcoal shrink-0" />;
      case "insufficient_evidence":
      default:
        return <HelpCircle className="w-4 h-4 text-charcoal-muted shrink-0" />;
    }
  };

  return (
    <div
      className={`rounded-lg border p-4 bg-paper/60 transition-all ${analysis.badgeBorderClass} ${className}`}
    >
      {/* Header: Title & Verdict Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-warm-grey/60 mb-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-olive font-bold">
            Split Verdict Telemetry • {categoryName}
          </span>
          <h4 className="font-serif text-sm sm:text-base font-bold text-charcoal">
            {parameterName}
          </h4>
        </div>

        {/* Verdict Badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold border self-start sm:self-auto ${analysis.badgeColorClass} ${analysis.badgeBorderClass} ${analysis.textColorClass}`}
        >
          {getVerdictIcon(analysis.verdictType)}
          <span>{analysis.verdictLabel}</span>
        </div>
      </div>

      {/* Rationale and Interpretation */}
      <p className="text-xs text-charcoal font-sans leading-relaxed mb-3">
        {analysis.rationale}
      </p>

      {/* 3-Band Polarity Breakdown */}
      {analysis.totalNumericVotes >= 5 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-charcoal-muted mb-1.5">
            <span>Score Polarity Split (1–10):</span>
            <span>{analysis.totalNumericVotes} eligible responses</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {/* Low Band */}
            <div className="p-2 rounded bg-rose-50 border border-rose-200">
              <span className="text-[10px] font-mono uppercase tracking-wider text-rose-800 font-bold block mb-0.5">
                Low (&lt;4.0)
              </span>
              <span className="font-serif text-base font-bold text-rose-900 block">
                {analysis.lowPct.toFixed(0)}%
              </span>
              <span className="text-[10px] text-rose-700 font-mono">
                {analysis.lowVotes} vote{analysis.lowVotes !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Neutral Band */}
            <div className="p-2 rounded bg-warm-grey-light/70 border border-warm-grey">
              <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-muted font-bold block mb-0.5">
                Neutral (4.0–7.9)
              </span>
              <span className="font-serif text-base font-bold text-charcoal block">
                {analysis.neutralPct.toFixed(0)}%
              </span>
              <span className="text-[10px] text-charcoal-muted font-mono">
                {analysis.neutralVotes} vote{analysis.neutralVotes !== 1 ? "s" : ""}
              </span>
            </div>

            {/* High Band */}
            <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold block mb-0.5">
                High (&ge;8.0)
              </span>
              <span className="font-serif text-base font-bold text-emerald-900 block">
                {analysis.highPct.toFixed(0)}%
              </span>
              <span className="text-[10px] text-emerald-700 font-mono">
                {analysis.highVotes} vote{analysis.highVotes !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 1 to 10 Frequency Histogram */}
      {distributions && distributions.length > 0 && analysis.totalNumericVotes > 0 && (
        <div className="p-3 bg-card rounded border border-warm-grey/70">
          <div className="flex items-center justify-between text-[10px] font-mono text-charcoal-muted uppercase mb-2">
            <span>Score Density Distribution</span>
            <span>Average: {analysis.meanScore ? analysis.meanScore.toFixed(1) : "—"} / 10</span>
          </div>

          <div className="grid grid-cols-10 gap-1 text-center items-end h-16 pt-1">
            {Array.from({ length: 10 }, (_, i) => {
              const sNum = i + 1;
              const found = distributions.find((d) => d.rating_score === sNum);
              const freq = found ? found.frequency : 0;
              const maxF = Math.max(...distributions.map((d) => d.frequency), 1);
              const bH = (freq / maxF) * 100;

              return (
                <div key={sNum} className="flex flex-col items-center h-full justify-end">
                  <span className="text-[9px] font-mono font-bold text-charcoal">
                    {freq > 0 ? freq : ""}
                  </span>
                  <div
                    className={`w-full rounded-t ${
                      freq > 0
                        ? sNum >= 8
                          ? "bg-emerald-700"
                          : sNum >= 4
                          ? "bg-olive"
                          : "bg-rose-700"
                        : "bg-warm-grey-light/50 h-1"
                    }`}
                    style={{ height: freq > 0 ? `${Math.max(bH, 16)}%` : "4px" }}
                    title={`Score ${sNum}: ${freq} votes`}
                  />
                  <span className="text-[9px] font-mono text-charcoal-muted mt-1 font-semibold">
                    {sNum}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Info & Evidence Level */}
      <div className="flex flex-col xs:flex-row xs:items-center justify-between pt-3 mt-3 border-t border-warm-grey/60 text-[10px] sm:text-[11px] font-mono text-charcoal-muted gap-1">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-olive shrink-0" />
          <span>Evidence level: <strong>{analysis.evidenceStrengthLabel}</strong></span>
        </div>
        {noViewCount > 0 && (
          <span className="text-charcoal-muted/80">
            {noViewCount} respondent{noViewCount !== 1 ? "s" : ""} selected "No view"
          </span>
        )}
      </div>
    </div>
  );
};
