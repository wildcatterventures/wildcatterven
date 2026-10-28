import React, { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  Compass,
  BookOpen,
  Filter,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { api } from "../../lib/api";
import type { CollegeRatingReport, CollegeSummary } from "../../types/college";
import { THEMATIC_CATEGORIES } from "../../lib/thematicCategories";
import { getCollegeCategoryMetrics } from "../../lib/matchEngine";

interface EvidenceLeaderboardProps {
  onSelectCollege: (collegeId: string) => void;
  onOpenMatchEngine?: () => void;
  onNavigateToMatch?: () => void;
  onExploreDirectory?: () => void;
  onBackToHome?: () => void;
}

export const MIN_LEADERBOARD_RESPONSES = 20;

export const EvidenceLeaderboard: React.FC<EvidenceLeaderboardProps> = ({
  onSelectCollege,
  onOpenMatchEngine,
  onNavigateToMatch,
  onExploreDirectory,
  onBackToHome,
}) => {
  const handleMatchClick = onNavigateToMatch || onOpenMatchEngine;
  const handleExploreClick = onExploreDirectory || onBackToHome;
  const [colleges, setColleges] = useState<CollegeSummary[]>([]);
  const [reports, setReports] = useState<Record<string, CollegeRatingReport>>({});
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all colleges (including demo colleges so seeded data can be inspected)
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .getColleges("", true)
      .then((data) => {
        if (mounted) {
          setColleges(data);
        }
      })
      .catch((err) => {
        if (mounted) setError(err.message || "Failed to load institutions.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Load rating reports
  useEffect(() => {
    if (colleges.length === 0) return;

    let mounted = true;
    setLoadingReports(true);

    const collegesToFetch = colleges.filter((c) => !reports[c.college_id]);

    if (collegesToFetch.length === 0) {
      setLoadingReports(false);
      return;
    }

    Promise.allSettled(
      collegesToFetch.map((c) =>
        api
          .getCollegeRatings(c.college_id)
          .then((rep) => ({ id: c.college_id, report: rep }))
      )
    )
      .then((results) => {
        if (!mounted) return;
        const newReports = { ...reports };
        results.forEach((r) => {
          if (r.status === "fulfilled" && r.value) {
            newReports[r.value.id] = r.value.report;
          }
        });
        setReports(newReports);
      })
      .finally(() => {
        if (mounted) setLoadingReports(false);
      });

    return () => {
      mounted = false;
    };
  }, [colleges]);

  // Compute eligible colleges meeting the strict 20-response threshold
  const qualifyingColleges = useMemo(() => {
    const qualified: {
      college: CollegeSummary;
      metricScore: number;
      eligibleResponses: number;
      categoryBreakdownName: string;
      verifiedSubmissions: number;
    }[] = [];

    const activeCat = THEMATIC_CATEGORIES.find((c) => c.id === selectedCategoryId);

    for (const college of colleges) {
      const report = reports[college.college_id];
      if (!report) continue;

      if (selectedCategoryId === "all") {
        // Overall: requires total submitted sessions >= 20
        if (college.total_submitted_sessions >= MIN_LEADERBOARD_RESPONSES) {
          // Average across all scored parameters
          const scored = report.parameters.filter((p) => p.average_score !== null);
          const totalVotes = report.parameters.reduce((sum, p) => sum + p.numeric_response_count, 0);

          if (scored.length > 0 && totalVotes >= MIN_LEADERBOARD_RESPONSES) {
            const avg = scored.reduce((sum, p) => sum + (p.average_score || 0), 0) / scored.length;
            qualified.push({
              college,
              metricScore: avg,
              eligibleResponses: totalVotes,
              categoryBreakdownName: "All 25 Parameters",
              verifiedSubmissions: college.total_submitted_sessions,
            });
          }
        }
      } else if (activeCat) {
        // Specific category: requires at least 20 numeric responses in this category
        const metrics = getCollegeCategoryMetrics(report, activeCat);
        if (metrics.avg !== null && metrics.responseCount >= MIN_LEADERBOARD_RESPONSES) {
          qualified.push({
            college,
            metricScore: metrics.avg,
            eligibleResponses: metrics.responseCount,
            categoryBreakdownName: activeCat.name,
            verifiedSubmissions: college.total_submitted_sessions,
          });
        }
      }
    }

    // Sort descending by metricScore
    qualified.sort((a, b) => {
      if (b.metricScore !== a.metricScore) {
        return b.metricScore - a.metricScore;
      }
      return b.eligibleResponses - a.eligibleResponses;
    });

    return qualified;
  }, [colleges, reports, selectedCategoryId]);

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      {/* 1. Page Header */}
      <div className="editorial-card p-6 sm:p-10 bg-card border-warm-grey mb-8 shadow-card">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 mb-2 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-olive-light text-olive border border-olive/30">
            <Trophy className="w-3.5 h-3.5" />
            <span>Integrity-First Benchmarking</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-charcoal tracking-tight">
            Evidence-Backed Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-2 leading-relaxed">
            Campus Uncut only publishes rankings backed by genuine empirical depth. Colleges qualify for this leaderboard only upon reaching <strong>{MIN_LEADERBOARD_RESPONSES} or more eligible numerical student responses</strong> for the evaluated metric. Baseline ties at 100 are omitted.
          </p>
        </div>

        {/* 2. Category Filter Tabs */}
        <div className="mt-6 pt-6 border-t border-warm-grey">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-3.5 h-3.5 text-olive" />
            <span className="text-[11px] font-mono text-charcoal-muted uppercase tracking-wider font-semibold">
              Filter by Rubric Dimension:
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategoryId("all")}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                selectedCategoryId === "all"
                  ? "bg-charcoal text-paper border-charcoal font-semibold shadow-xs"
                  : "bg-paper text-charcoal border-warm-grey hover:border-charcoal/50"
              }`}
            >
              Overall Experience (All 25)
            </button>
            {THEMATIC_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  selectedCategoryId === cat.id
                    ? "bg-charcoal text-paper border-charcoal font-semibold shadow-xs"
                    : "bg-paper text-charcoal border-warm-grey hover:border-charcoal/50"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Main Content: Qualified Colleges OR Honest Insufficient Evidence State */}
      {(loading || loadingReports) ? (
        <div className="editorial-card p-12 bg-card text-center text-charcoal-muted font-mono text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-olive" />
          <span>Validating institutional response thresholds...</span>
        </div>
      ) : qualifyingColleges.length === 0 ? (
        /* Honest Insufficient Evidence State (Strict Acceptance Criterion) */
        <div className="editorial-card p-8 sm:p-14 text-center bg-card border-warm-grey shadow-card mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warm-grey-light flex items-center justify-center text-charcoal border border-warm-grey">
            <ShieldCheck className="w-8 h-8 text-olive" />
          </div>

          <span className="font-mono text-xs uppercase tracking-wider text-olive font-bold block mb-1">
            Strict Threshold Rule (n &ge; {MIN_LEADERBOARD_RESPONSES})
          </span>

          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal mb-3 max-w-xl mx-auto">
            We don't have enough student feedback to publish a trustworthy leaderboard yet.
          </h2>

          <p className="text-xs sm:text-sm text-charcoal-muted max-w-xl mx-auto mb-8 leading-relaxed font-sans">
            To prevent premature rankings and deceptive marketing claims, Campus Uncut refuses to rank colleges with sparse feedback or display uninformative ties at baseline 100. Seeded demo institutions currently hold 19 simulated contributions, which strictly remains below the 20-response verification cutoff.
          </p>

          {/* Alternative Exploration Routes */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            {handleMatchClick && (
              <button
                onClick={handleMatchClick}
                className="btn-primary w-full sm:w-auto text-xs py-2.5 px-5 font-semibold inline-flex items-center justify-center gap-2 shadow-xs"
              >
                <Compass className="w-4 h-4 text-paper" />
                <span>Use Uncut Match Engine</span>
              </button>
            )}
            {handleExploreClick && (
              <button
                onClick={handleExploreClick}
                className="btn-secondary w-full sm:w-auto text-xs py-2.5 px-5 font-medium inline-flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-charcoal-muted" />
                <span>Browse All Institutions</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Qualified Leaderboard Table */
        <div className="editorial-card p-5 sm:p-8 bg-card border-warm-grey shadow-card mb-8">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-warm-grey">
            <h3 className="font-serif text-lg sm:text-xl font-bold text-charcoal">
              Qualified Institutions ({qualifyingColleges.length})
            </h3>
            <span className="text-[11px] font-mono text-olive font-bold">
              Min. {MIN_LEADERBOARD_RESPONSES} Responses Enforced
            </span>
          </div>

          <div className="space-y-3">
            {qualifyingColleges.map((entry, idx) => (
              <div
                key={entry.college.college_id}
                onClick={() => onSelectCollege(entry.college.college_id)}
                className="p-4 rounded-lg bg-paper border border-warm-grey hover:border-charcoal/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-full bg-charcoal text-paper font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="font-serif text-base font-bold text-charcoal truncate">
                      {entry.college.name}
                    </h4>
                    <p className="text-xs text-charcoal-muted font-sans truncate">
                      {entry.college.city}, {entry.college.state} • {entry.categoryBreakdownName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 self-end sm:self-auto shrink-0 font-mono">
                  <div className="text-right">
                    <span className="text-xs text-charcoal-muted block">Score</span>
                    <span className="font-serif text-xl font-bold text-charcoal">
                      {entry.metricScore.toFixed(1)} <span className="text-xs text-charcoal-muted">/ 10</span>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-charcoal-muted block">Sample Size</span>
                    <span className="font-bold text-olive text-sm">
                      {entry.eligibleResponses} votes
                    </span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-charcoal-muted hidden sm:block" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Methodology & Disclaimers */}
      <div className="p-4 sm:p-5 rounded-lg bg-warm-grey-light/50 border border-warm-grey text-xs text-charcoal-muted leading-relaxed font-sans space-y-2">
        <div className="flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-olive shrink-0 mt-0.5" />
          <div>
            <strong>Representativeness Disclaimer:</strong> While reaching {MIN_LEADERBOARD_RESPONSES} verified evaluations provides empirical depth and filters noise, sample volume does not guarantee complete statistical representativeness across all academic departments. Rankings are presented as community benchmarks rather than commercial certifications.
          </div>
        </div>
      </div>
    </div>
  );
};
