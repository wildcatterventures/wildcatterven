import React, { useState, useEffect } from "react";
import { Search, PlusCircle, AlertCircle, RefreshCw } from "lucide-react";

import { api } from "../../lib/api";
import type { CollegeSummary } from "../../types/college";
import { CollegeCard } from "./CollegeCard";

interface CollegeListProps {
  initialQuery?: string;
  onSelectCollege: (collegeId: string) => void;
  onRateCollege: (collegeId: string) => void;
  onOpenUnknownModal: () => void;
}

export const CollegeList: React.FC<CollegeListProps> = ({
  initialQuery = "",
  onSelectCollege,
  onRateCollege,
  onOpenUnknownModal,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [includeDemo, setIncludeDemo] = useState(true);
  const [colleges, setColleges] = useState<CollegeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchColleges = async (searchQuery: string, demo: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getColleges(searchQuery, demo);
      setColleges(data);
    } catch (err: any) {
      setError(err.message || "Unable to load colleges from backend database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchColleges(query, includeDemo);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, includeDemo]);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      {/* Page Header */}
      <div className="mb-8 border-b border-warm-grey pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-olive font-semibold">
            Institutional Registry
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal mt-1">
            Explore Colleges
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-1 max-w-2xl font-sans">
            Search institutions across India. Verified base scores begin at 100 and update automatically when 20 qualifying student or alumni ratings are submitted.
          </p>
        </div>

        <button
          onClick={onOpenUnknownModal}
          className="btn-primary text-xs self-start md:self-auto py-2.5 px-4 font-semibold"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Unlisted College</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-3 rounded border border-warm-grey shadow-subtle">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-charcoal-muted absolute left-3 top-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by college name, city, state, or short code..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-paper border border-warm-grey rounded focus:outline-none focus:border-olive font-sans"
          />
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <label className="flex items-center gap-2 text-xs text-charcoal cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeDemo}
              onChange={(e) => setIncludeDemo(e.target.checked)}
              className="rounded border-warm-grey text-olive focus:ring-olive w-4 h-4"
            />
            <span className="text-xs font-sans text-charcoal-muted">Include Simulated Demo Campuses</span>
          </label>

          <button
            onClick={() => fetchColleges(query, includeDemo)}
            title="Refresh records from PostgreSQL"
            className="p-2 text-charcoal-muted hover:text-charcoal rounded hover:bg-warm-grey-light border border-warm-grey transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 mb-8 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchColleges(query, includeDemo)}
            className="underline font-semibold ml-4 hover:text-rose-950"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="editorial-card p-6 bg-card animate-pulse space-y-4">
              <div className="h-6 bg-warm-grey rounded w-3/4" />
              <div className="h-4 bg-warm-grey rounded w-1/2" />
              <div className="h-20 bg-warm-grey-light rounded w-full mt-4" />
            </div>
          ))}
        </div>
      ) : colleges.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {colleges.map((college) => (
            <CollegeCard
              key={college.college_id}
              college={college}
              onSelect={onSelectCollege}
              onRate={onRateCollege}
            />
          ))}
        </div>
      ) : (
        /* Illustrated Empty State */
        <div className="editorial-card p-8 sm:p-12 text-center bg-card max-w-xl mx-auto my-12 border-warm-grey shadow-card">
          <div className="w-48 h-32 mx-auto mb-6">
            <img
              src="/images/empty_search.svg"
              alt="No colleges found illustration"
              className="w-full h-full object-contain"
            />
          </div>
          <h3 className="font-serif text-2xl font-bold text-charcoal mb-2">
            No Colleges Found
          </h3>
          <p className="text-xs sm:text-sm text-charcoal-muted max-w-md mx-auto mb-6 leading-relaxed">
            {query
              ? `No registered institutions match '${query}'. You can add your college to the registry with a starting score of 100.`
              : "No institutions found matching your filter criteria."}
          </p>
          <button
            onClick={onOpenUnknownModal}
            className="btn-primary text-xs py-2.5 px-6 font-semibold"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add This College to Directory</span>
          </button>
        </div>
      )}
    </div>
  );
};
