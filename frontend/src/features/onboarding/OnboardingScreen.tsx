import React, { useState } from "react";
import { ArrowRight, Star, Building2, Utensils, Award } from "lucide-react";

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState<0 | 1>(0);

  const handleNext = () => {
    if (step === 0) {
      setStep(1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F5F2EB] flex flex-col justify-between overflow-hidden font-sans select-none">
      {/* Top Bar: Skip button */}
      <div className="pt-8 sm:pt-12 px-6 flex justify-end max-w-md mx-auto w-full">
        <button
          onClick={onComplete}
          className="text-xs font-semibold uppercase tracking-wider text-[#727D60] hover:text-[#252724] py-2 px-3 transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-md mx-auto px-6 w-full flex flex-col justify-center">
        {step === 0 ? (
          /* Step 1: Photographic Collage (Matches Reference Image 1 Screen 2 & Image 2 Screen 2) */
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Collage Container */}
            <div className="relative h-64 sm:h-72 w-full flex items-center justify-center">
              <div className="absolute -left-2 top-4 w-28 h-36 rounded-2xl overflow-hidden shadow-subtle border border-[#E5E1D8] rotate-[-6deg] opacity-80">
                <img
                  src="/images/colleges/coep.jpg"
                  alt="Historic college entrance"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="relative z-10 w-44 sm:w-48 h-56 sm:h-60 rounded-3xl overflow-hidden shadow-card border-2 border-white">
                <img
                  src="/images/colleges/iitb.jpg"
                  alt="Premier campus building"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="absolute -right-2 bottom-4 w-28 h-36 rounded-2xl overflow-hidden shadow-subtle border border-[#E5E1D8] rotate-[6deg] opacity-80">
                <img
                  src="/images/library_study.jpg"
                  alt="Students studying in library"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Typography */}
            <div className="pt-2">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#252724] tracking-tight leading-tight">
                Discover<br />Real Insights
              </h2>
              <p className="text-xs sm:text-sm text-[#5C6450] mt-3 leading-relaxed">
                Explore honest reviews, ratings and experiences from students across India. Unedited feedback on academics, hostels, placements, and campus culture.
              </p>
            </div>
          </div>
        ) : (
          /* Step 2: Feature Tags Over Campus Architecture (Matches Reference Image 2 Screen 3) */
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Campus Photo with Floating Tags */}
            <div className="relative h-64 sm:h-72 w-full rounded-3xl overflow-hidden shadow-card border border-[#E5E1D8]">
              <img
                src="/images/hero_quad.jpg"
                alt="University quadrangle"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[#252724]/20" />

              {/* Floating Pill Tags */}
              <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-md text-xs font-semibold text-[#252724]">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Campus Life</span>
              </div>

              <div className="absolute top-16 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-md text-xs font-semibold text-[#252724]">
                <Award className="w-3.5 h-3.5 text-[#D9653B]" />
                <span>Placements</span>
              </div>

              <div className="absolute bottom-16 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-md text-xs font-semibold text-[#252724]">
                <Utensils className="w-3.5 h-3.5 text-[#727D60]" />
                <span>Hostel & Mess</span>
              </div>

              <div className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-md text-xs font-semibold text-[#252724]">
                <Building2 className="w-3.5 h-3.5 text-[#252724]" />
                <span>Infrastructure</span>
              </div>
            </div>

            {/* Typography */}
            <div className="pt-2">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#252724] tracking-tight leading-tight">
                Compare what<br />really matters
              </h2>
              <p className="text-xs sm:text-sm text-[#5C6450] mt-3 leading-relaxed">
                Explore 25+ parameters, compare colleges side-by-side and make informed academic decisions backed by verified student submissions.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls: Pagination Dots & Olive Circular Button */}
      <div className="pb-10 px-8 max-w-md mx-auto w-full flex items-center justify-between">
        {/* Pagination Dots */}
        <div className="flex items-center gap-2">
          <span
            className={`h-2 rounded-full transition-all ${
              step === 0 ? "w-6 bg-[#252724]" : "w-2 bg-[#E5E1D8]"
            }`}
          />
          <span
            className={`h-2 rounded-full transition-all ${
              step === 1 ? "w-6 bg-[#252724]" : "w-2 bg-[#E5E1D8]"
            }`}
          />
        </div>

        {/* Circular Olive Next Action */}
        <button
          onClick={handleNext}
          className="w-13 h-13 rounded-full bg-[#727D60] text-white flex items-center justify-center hover:bg-[#5C6450] shadow-md transition-all active:scale-95"
          aria-label={step === 0 ? "Next slide" : "Get started"}
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
