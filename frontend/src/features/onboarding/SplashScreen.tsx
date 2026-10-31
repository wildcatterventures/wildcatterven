import React, { useEffect, useCallback } from "react";
import { ArrowRight } from "lucide-react";
import { BrandLogo } from "../../components/BrandLogo";

interface SplashScreenProps {
  onEnter: () => void;
  onExploreOnboarding?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter, onExploreOnboarding }) => {
  const proceed = useCallback(() => {
    if (onExploreOnboarding) {
      onExploreOnboarding();
    } else {
      onEnter();
    }
  }, [onEnter, onExploreOnboarding]);

  // Automatic transition after 2.2 seconds to Onboarding
  useEffect(() => {
    const timer = setTimeout(() => {
      proceed();
    }, 2200);
    return () => clearTimeout(timer);
  }, [proceed]);

  return (
    <div
      onClick={proceed}
      className="fixed inset-0 z-50 bg-[#F5F2EB] flex flex-col justify-between overflow-hidden select-none font-sans cursor-pointer"
    >
      {/* Top Section: Typography (Matches Reference Image 1 Screen 1) */}
      <div className="pt-12 sm:pt-16 px-6 sm:px-10 max-w-md mx-auto w-full animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="mb-4">
          <BrandLogo variant="monogram-only" size="md" />
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#252724] tracking-tight leading-[1.08]">
          Campus<br />Uncut
        </h1>
        <p className="text-sm sm:text-base text-[#5C6450] mt-3 font-sans leading-snug">
          College life.<br />Without the editing.
        </p>
      </div>

      {/* Middle/Lower Section: Architectural Campus Imagery */}
      <div className="relative flex-1 w-full max-w-md mx-auto px-6 py-4 flex flex-col justify-end">
        <div className="relative w-full h-[360px] sm:h-[420px] rounded-3xl overflow-hidden shadow-card border border-[#E5E1D8]">
          <img
            src="/images/hero_quad.jpg"
            alt="Historic campus quad and architectural tower"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#252724]/90 via-[#252724]/30 to-transparent" />

          {/* Bottom Overlay Text */}
          <div className="absolute bottom-6 inset-x-6 flex items-center justify-between text-[#F5F2EB]">
            <p className="text-xs sm:text-sm font-sans italic opacity-90">
              Real stories. Real students. Real insights.
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                proceed();
              }}
              className="w-11 h-11 rounded-full bg-[#727D60] text-white flex items-center justify-center hover:bg-[#5C6450] transition-transform active:scale-95 shadow-md shrink-0 ml-2"
              aria-label="Enter Onboarding"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Enter Direct Action */}
        <div className="text-center pt-4 pb-6">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              proceed();
            }}
            className="text-xs font-semibold uppercase tracking-wider text-[#727D60] hover:text-[#252724] transition-colors py-2 px-4"
          >
            Explore Onboarding &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
