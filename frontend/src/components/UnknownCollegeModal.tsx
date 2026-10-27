import React, { useState } from "react";
import { X, Building2, MapPin, CheckCircle, AlertTriangle } from "lucide-react";
import { api, ApiError } from "../lib/api";
import type { CollegeDetail } from "../types/college";

interface UnknownCollegeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCollegeCreated: (college: CollegeDetail) => void;
}

export const UnknownCollegeModal: React.FC<UnknownCollegeModalProps> = ({
  isOpen,
  onClose,
  onCollegeCreated,
}) => {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [emailDomain, setEmailDomain] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "creating">("form");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city.trim() || !stateName.trim()) {
      setError("Please provide college name, city, and state.");
      return;
    }
    setError(null);
    setStep("confirm");
  };

  const handleConfirmCreation = async () => {
    setStep("creating");
    setError(null);
    try {
      const created = await api.createCollege({
        name: name.trim(),
        city: city.trim(),
        state: stateName.trim(),
        email_domains: emailDomain.trim() || undefined,
      });
      // Reset form
      setName("");
      setCity("");
      setStateName("");
      setEmailDomain("");
      setStep("form");
      onCollegeCreated(created);
    } catch (err: any) {
      setStep("form");
      if (err instanceof ApiError && err.status === 409) {
        setError(
          err.detail ||
            "A college with this name, city, and state already exists in the platform directory."
        );
      } else {
        setError(err.message || "Failed to create college. Please check your inputs.");
      }
    }
  };

  const handleClose = () => {
    setError(null);
    setStep("form");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal/50 backdrop-blur-sm overflow-y-auto">
      <div className="editorial-card w-full max-w-lg p-5 sm:p-8 bg-paper relative shadow-dropdown my-auto max-h-[92vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 min-w-[44px] min-h-[44px] flex items-center justify-center text-charcoal-muted hover:text-charcoal p-2 rounded hover:bg-warm-grey-light"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <span className="font-mono text-xs uppercase tracking-wider text-olive font-semibold">
            Community Onboarding
          </span>
          <h3 className="font-serif text-2xl font-bold text-charcoal mt-1">
            Add an Unlisted College
          </h3>
          <p className="text-xs text-charcoal-muted mt-1">
            Can't find your campus? Add it to Campus Uncut. All newly created institutions start with an official score of 100 and zero reviews.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {step === "form" && (
          <form onSubmit={handleInitialSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">
                Official College Name *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-charcoal-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. National Institute of Design"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-warm-grey rounded focus:outline-none focus:border-olive focus:ring-1 focus:ring-olive font-sans"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">
                  City / Campus Location *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-charcoal-muted absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Ahmedabad"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-warm-grey rounded focus:outline-none focus:border-olive focus:ring-1 focus:ring-olive font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">
                  State / Territory *
                </label>
                <input
                  type="text"
                  required
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="e.g. Gujarat"
                  className="w-full px-3 py-2 text-sm bg-card border border-warm-grey rounded focus:outline-none focus:border-olive focus:ring-1 focus:ring-olive font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">
                  Official Email Domain (Optional)
                </label>
                <input
                  type="text"
                  value={emailDomain}
                  onChange={(e) => setEmailDomain(e.target.value.toLowerCase().trim())}
                  placeholder="e.g. bits-pilani.ac.in"
                  className="w-full px-3 py-2 text-sm bg-card border border-warm-grey rounded focus:outline-none focus:border-olive focus:ring-1 focus:ring-olive font-sans"
                />
                <p className="text-[10px] text-charcoal-muted mt-1">
                  Enables domain validation for students voting for this institution.
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-end gap-2.5 sm:gap-3 border-t border-warm-grey mt-6">
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary min-h-[44px] flex items-center justify-center text-xs"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary min-h-[44px] flex items-center justify-center text-xs">
                Continue to Confirmation
              </button>
            </div>
          </form>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            <div className="p-4 rounded border border-warm-grey bg-card">
              <h4 className="font-serif text-lg font-bold text-charcoal">{name}</h4>
              <p className="text-xs text-charcoal-muted flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-olive" />
                {city}, {stateName}
              </p>

              <div className="mt-4 pt-3 border-t border-warm-grey text-xs space-y-1.5 text-charcoal-muted">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-olive" />
                  <span>Initial score will be set to <strong>100</strong>.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-olive" />
                  <span>Will be visible to all visitors with zero initial ratings.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-olive" />
                  <span>Reviews and ratings are never fabricated.</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-end gap-2.5 sm:gap-3 border-t border-warm-grey mt-6">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="btn-secondary min-h-[44px] flex items-center justify-center text-xs"
              >
                Back & Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmCreation}
                className="btn-primary min-h-[44px] flex items-center justify-center text-xs"
              >
                Confirm & Add College
              </button>
            </div>
          </div>
        )}

        {step === "creating" && (
          <div className="py-12 text-center">
            <div className="inline-block w-6 h-6 border-2 border-olive border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-medium text-charcoal">
              Creating college record in platform database...
            </p>
            <p className="text-xs text-charcoal-muted mt-1">
              Initializing score state and database constraints.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
