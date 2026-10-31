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
  const [nameTouched, setNameTouched] = useState(false);
  const [collegeEmail, setCollegeEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  // Sync initialCollegeId if it changes
  useEffect(() => {
    if (initialCollegeId) {
      setSelectedCollegeId(initialCollegeId);
    }
  }, [initialCollegeId]);

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
  const isNameValid = displayName.trim().length > 0;
  const canSubmit = Boolean(
    selectedCollegeId &&
    isNameValid &&
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

    if (!isNameValid) {
      setNameTouched(true);
      setError("Please enter your name.");
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
        display_name: displayName.trim(),
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
    <div className="py-6 sm:py-12 px-3 sm:px-4 max-w-2xl mx-auto font-sans pb-28 md:pb-12">
      <div className="editorial-card p-5 sm:p-8 md:p-10 bg-card rounded-2xl border border-warm-grey shadow-card">
        <div className="mb-6 sm:mb-8">
          <span className="font-mono text-xs uppercase tracking-wider text-olive font-semibold">
            Rating Flow • Step 1 of 3
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal mt-1">
            Declare Your Affiliation
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-2 leading-relaxed">
            Campus Uncut lets current students and alumni share their authentic experiences across 25 campus realities.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <p className="font-semibold">{error}</p>
              {error.includes("Cannot change declared college") && (
                <p className="mt-1 text-[11px] text-rose-700 leading-relaxed">
                  Campus Uncut locks reviewer profiles to their declared institution once an official rating is submitted to prevent cross-campus score brigading. If you are testing as a different student, click the reset button to generate a new reviewer profile.
                </p>
              )}
            </div>
            {error.includes("Cannot change declared college") && (
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("campus_uncut_client_uuid");
                  localStorage.removeItem("campus_uncut_declared_college_id");
                  localStorage.removeItem("campus_uncut_respondent_id");
                  localStorage.removeItem("campus_uncut_active_session_id");
                  window.location.reload();
                }}
                className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded font-medium text-xs whitespace-nowrap transition-colors shadow-sm self-start sm:self-auto"
              >
                Reset Reviewer Profile
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selected College Display (or fallback selector if missing) */}
          {selectedCollege ? (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-2">
                Selected College
              </label>
              <div className="p-3.5 sm:p-4 rounded-lg bg-warm-grey-light/70 border border-warm-grey flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-md bg-paper border border-warm-grey flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-olive" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-serif text-base sm:text-lg font-bold text-charcoal truncate">
                      {selectedCollege.name}
                    </h3>
                    <p className="text-xs text-charcoal-muted truncate">
                      {selectedCollege.city}, {selectedCollege.state}
                      {selectedCollege.is_demo ? " • [DEMO]" : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
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
                    <>
                      <option value="">Choose a college to rate...</option>
                      {colleges.map((c) => (
                        <option key={c.college_id} value={c.college_id}>
                          {c.name} ({c.city}, {c.state}) {c.is_demo ? "— [DEMO]" : ""}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            </div>
          )}

          {/* Official College Email Input */}
          <div>
            <div className="flex flex-col xs:flex-row xs:items-center justify-between mb-2 gap-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal">
                Official College Email Address *
              </label>
              {selectedCollege?.email_domains && (
                <span className="text-[10px] sm:text-[11px] font-mono text-olive bg-warm-grey-light px-2 py-0.5 rounded border border-warm-grey self-start xs:self-auto break-all">
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
              Generic webmail (@gmail.com, @yahoo.com) and cross-college voting are strictly disallowed. You can only rate the institution matching your official email. Your institutional email is used strictly for domain affinity and is never shared publicly. For data privacy inquiries or deletion requests, contact{" "}
              <a href="mailto:mathew.maxwell2021@gmail.com" className="text-olive hover:underline font-medium">
                mathew.maxwell2021@gmail.com
              </a>.
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

          {/* Respondent Name (Required) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="respondent-name"
                className="block text-xs font-semibold uppercase tracking-wider text-charcoal"
              >
                Your Name <span className="text-rose-600">*</span>
              </label>
            </div>
            <input
              id="respondent-name"
              type="text"
              required
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (error && e.target.value.trim().length > 0) setError(null);
              }}
              onBlur={() => setNameTouched(true)}
              placeholder="e.g. Maya S."
              className={`w-full px-3.5 py-2.5 text-sm bg-paper border rounded focus:outline-none font-sans text-charcoal transition-all ${
                nameTouched && !isNameValid
                  ? "border-rose-400 focus:border-rose-500 bg-rose-50/20"
                  : "border-warm-grey focus:border-olive"
              }`}
            />
            {nameTouched && !isNameValid && (
              <p className="mt-1.5 text-xs text-rose-700 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Please enter your name.</span>
              </p>
            )}
            <p className="text-[11px] text-charcoal-muted mt-1 leading-relaxed">
              Your name is displayed alongside your feedback. Never share sensitive passwords or personal phone numbers.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-warm-grey flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-between gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary min-h-[44px] text-xs flex items-center justify-center"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              title={
                !isNameValid
                  ? "Please enter your name"
                  : !collegeEmail.trim()
                  ? "Please enter your college email address"
                  : !emailValidation.isValid
                  ? emailValidation.error
                  : undefined
              }
              className={`btn-primary min-h-[44px] text-xs py-2.5 px-6 transition-opacity flex items-center justify-center gap-2 ${
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
