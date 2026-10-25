import React, { useState, useEffect } from "react";
import { School, GraduationCap, AlertCircle, ArrowRight, Building2, Mail, ShieldCheck } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { getClientUUID, setDeclaredCollegeId, setRespondentId } from "../../lib/storage";
import { validateCollegeEmail } from "../../lib/emailValidation";
import type { CollegeSummary } from "../../types/college";
import type { Affiliation, RatingSessionResponse } from "../../types/rating";

interface RespondentSetupProps {
  initialCollegeId?: string;
  onSessionStarted: (session: RatingSessionResponse, college: CollegeSummary) => void;
  onCancel: () => void;
}

export const RespondentSetup: React.FC<RespondentSetupProps> = ({
  initialCollegeId,
  onSessionStarted,
  onCancel,
}) => {
  const [colleges, setColleges] = useState<CollegeSummary[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>(initialCollegeId || "");
  const [affiliation, setAffiliation] = useState<Affiliation>("current_student");
  const [displayName, setDisplayName] = useState("");
  const [collegeEmail, setCollegeEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .getColleges("", true) // include demo colleges for testing
      .then((data) => {
        if (mounted) {
          setColleges(data);
          if (!selectedCollegeId && data.length > 0) {
            setSelectedCollegeId(data[0].college_id);
          }
        }
      })
      .catch((err) => {
        if (mounted) setError(err.message || "Failed to load colleges list.");
      })
      .finally(() => {
        if (mounted) setLoadingColleges(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const selectedCollege = colleges.find((c) => c.college_id === selectedCollegeId);
  const emailValidation = validateCollegeEmail(collegeEmail, selectedCollege, colleges);
  const canSubmit = Boolean(
    selectedCollegeId &&
    collegeEmail.trim() &&
    emailValidation.isValid &&
    !submitting &&
    !loadingColleges
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollegeId) {
      setError("Please select a college to rate.");
      return;
    }

    if (!collegeEmail.trim() || !emailValidation.isValid) {
      setEmailTouched(true);
      setError(emailValidation.error || "Please enter a valid official college email ID.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const clientUuid = getClientUUID();

    try {
      // 1. Create / update respondent with verified college email
      const respondent = await api.createRespondent({
        client_uuid: clientUuid,
        declared_college_id: selectedCollegeId,
        affiliation: affiliation,
        display_name: displayName.trim() || undefined,
        college_email: collegeEmail.trim().toLowerCase(),
      });

      setDeclaredCollegeId(selectedCollegeId);
      setRespondentId(respondent.id);

      // 2. Start / resume rating session
      const session = await api.createRatingSession({
        college_id: selectedCollegeId,
        respondent_id: respondent.id,
      });

      const matchedCollege = colleges.find((c) => c.college_id === selectedCollegeId);
      if (matchedCollege) {
        onSessionStarted(session, matchedCollege);
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) {
        setError(
          err.detail ||
            "You have already submitted an official rating for this college. Each respondent profile can submit only once."
        );
      } else if (err instanceof ApiError && (err.status === 400 || err.status === 403)) {
        setError(err.detail || err.message);
      } else {
        setError(err.message || "Unable to start rating session. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="py-12 px-4 max-w-2xl mx-auto font-sans">
      <div className="editorial-card p-6 sm:p-10 bg-card">
        <div className="mb-8">
          <span className="font-mono text-xs uppercase tracking-wider text-olive font-semibold">
            Rating Flow • Step 1 of 3
          </span>
          <h1 className="font-serif text-3xl font-bold text-charcoal mt-1">
            Declare Your Affiliation
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-2 leading-relaxed">
            Campus Uncut lets current students and alumni share their authentic experiences across 25 campus realities.
          </p>
        </div>

        {/* Persistent Unverified Notice */}
        <div className="mb-6 p-3.5 rounded bg-warm-grey-light border border-warm-grey text-xs text-charcoal flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-olive flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Self-Declared Affiliation:</strong> Affiliation is unverified in this prototype. You will rate your declared college; each respondent profile may contribute at most once toward official score thresholds.
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* College Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-2">
              Select Your College *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-charcoal-muted absolute left-3 top-3 pointer-events-none" />
              <select
                required
                value={selectedCollegeId}
                onChange={(e) => setSelectedCollegeId(e.target.value)}
                disabled={loadingColleges || submitting}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-paper border border-warm-grey rounded focus:outline-none focus:border-olive font-sans text-charcoal cursor-pointer"
              >
                {loadingColleges ? (
                  <option>Loading institutions...</option>
                ) : (
                  colleges.map((c) => (
                    <option key={c.college_id} value={c.college_id}>
                      {c.name} ({c.city}, {c.state}) {c.is_demo ? "— [DEMO]" : ""}
                    </option>
                  ))
                )}
              </select>
            </div>
            {selectedCollegeId && (
              <p className="text-[11px] text-charcoal-muted mt-1.5 font-sans">
                Notice: Seeded demo institutions (St. Jude Demo and Apex Demo) allow testing real-time score shifts (100 → 99 or 100 → 101) without altering real colleges.
              </p>
            )}
          </div>

          {/* Official College Email Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal">
                Official College Email Address *
              </label>
              {selectedCollege?.email_domains && (
                <span className="text-[11px] font-mono text-olive bg-warm-grey-light px-2 py-0.5 rounded border border-warm-grey">
                  Domain: {selectedCollege.email_domains.split(",").map((d) => `@${d.trim()}`).join(", ")}
                </span>
              )}
            </div>

            <div className="relative">
              <Mail className="w-4 h-4 text-charcoal-muted absolute left-3 top-3 pointer-events-none" />
              <input
                type="email"
                required
                value={collegeEmail}
                onChange={(e) => {
                  setCollegeEmail(e.target.value);
                  if (error) setError(null);
                }}
                onBlur={() => setEmailTouched(true)}
                placeholder={
                  selectedCollege?.email_domains
                    ? `e.g. yourname@${selectedCollege.email_domains.split(",")[0].trim()}`
                    : "e.g. yourname@college.ac.in"
                }
                className={`w-full pl-9 pr-4 py-2.5 text-sm bg-paper border rounded focus:outline-none font-sans text-charcoal transition-all ${
                  emailTouched && !emailValidation.isValid
                    ? "border-rose-400 focus:border-rose-500 bg-rose-50/20"
                    : emailValidation.isVerifiedMatch
                    ? "border-emerald-600 focus:border-emerald-700 bg-emerald-50/15"
                    : "border-warm-grey focus:border-olive"
                }`}
              />
            </div>

            {/* Live Inline Error / Verification Feedback */}
            {emailTouched && !emailValidation.isValid && (
              <div className="mt-2 p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{emailValidation.error}</span>
              </div>
            )}

            {emailValidation.isVerifiedMatch && (
              <div className="mt-2 p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="leading-snug">
                  Verified institutional domain for <strong>{selectedCollege?.name}</strong>.
                </span>
              </div>
            )}

            <p className="text-[11px] text-charcoal-muted mt-1.5 leading-relaxed font-sans">
              Generic webmail (@gmail.com, @yahoo.com) and cross-college voting are strictly disallowed. You can only rate the institution matching your official email.
            </p>
          </div>

          {/* Affiliation Radios */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-2">
              Your Current Status *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-4 rounded border cursor-pointer transition-all flex items-start gap-3 ${
                  affiliation === "current_student"
                    ? "border-charcoal bg-warm-grey-light text-charcoal shadow-subtle"
                    : "border-warm-grey bg-card text-charcoal-muted hover:border-warm-grey-dark"
                }`}
              >
                <input
                  type="radio"
                  name="affiliation"
                  value="current_student"
                  checked={affiliation === "current_student"}
                  onChange={() => setAffiliation("current_student")}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-bold text-charcoal flex items-center gap-1.5">
                    <School className="w-4 h-4 text-olive" />
                    <span>Current Student</span>
                  </div>
                  <div className="text-xs text-charcoal-muted mt-0.5">
                    Presently enrolled in an undergraduate or postgraduate program.
                  </div>
                </div>
              </label>

              <label
                className={`p-4 rounded border cursor-pointer transition-all flex items-start gap-3 ${
                  affiliation === "alumnus"
                    ? "border-charcoal bg-warm-grey-light text-charcoal shadow-subtle"
                    : "border-warm-grey bg-card text-charcoal-muted hover:border-warm-grey-dark"
                }`}
              >
                <input
                  type="radio"
                  name="affiliation"
                  value="alumnus"
                  checked={affiliation === "alumnus"}
                  onChange={() => setAffiliation("alumnus")}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-bold text-charcoal flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-charcoal-muted" />
                    <span>Alumnus / Former Student</span>
                  </div>
                  <div className="text-xs text-charcoal-muted mt-0.5">
                    Graduated or previously attended this institution.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Display Name (Optional) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
              Public Display Name (Optional)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Maya S. (Leave blank to remain anonymous)"
              className="w-full px-3 py-2 text-sm bg-paper border border-warm-grey rounded focus:outline-none focus:border-olive font-sans"
            />
            <p className="text-[11px] text-charcoal-muted mt-1">
              Never share sensitive passwords or personal phone numbers.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-warm-grey flex items-center justify-between">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              title={
                !collegeEmail.trim()
                  ? "Please enter your college email address"
                  : !emailValidation.isValid
                  ? emailValidation.error
                  : undefined
              }
              className={`btn-primary text-xs py-2.5 px-6 transition-opacity ${
                !canSubmit ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {submitting ? (
                <span>Starting Session...</span>
              ) : (
                <>
                  <span>Begin 25-Question Rating</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
