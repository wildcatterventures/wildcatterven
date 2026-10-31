import React from "react";

export interface BrandLogoProps {
  variant?: "full" | "compact" | "monogram-only";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showTagline?: boolean;
  onClick?: () => void;
}

/**
 * Campus Uncut CU Monogram SVG
 * Features interlocking Charcoal C and U letterforms with a signature Terracotta accent dot.
 */
export const CUMonogram: React.FC<{ sizeClass?: string; className?: string }> = ({
  sizeClass = "w-8 h-8",
  className = "",
}) => {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClass} shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      {/* Monogram 'C' letterform */}
      <path
        d="M 23 11 C 14 11 8 16.5 8 23 C 8 29.5 14 35 23 35 C 26 35 28.5 34 30.5 32.5"
        stroke="#252724"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Monogram 'U' letterform interlocking on right */}
      <path
        d="M 23 18 V 27.5 C 23 31.5 26 33.5 29.5 33.5 C 33 33.5 36 31.5 36 27.5 V 18"
        stroke="#252724"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Signature Terracotta accent dot */}
      <circle
        cx="36"
        cy="10.5"
        r="3.5"
        fill="#D9653B"
      />
    </svg>
  );
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = "full",
  size = "md",
  className = "",
  showTagline = false,
  onClick,
}) => {
  // Sizing mappings
  const monogramSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
    xl: "w-14 h-14",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl sm:text-2xl",
    lg: "text-2xl sm:text-3xl",
    xl: "text-3xl sm:text-4xl",
  };

  const content = (
    <div
      className={`inline-flex items-center gap-2.5 sm:gap-3 ${
        onClick ? "cursor-pointer group" : ""
      } ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {/* CU Monogram Symbol */}
      <CUMonogram sizeClass={monogramSizes[size]} />

      {/* Wordmark (when not monogram-only) */}
      {variant !== "monogram-only" && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-baseline gap-1.5 whitespace-nowrap">
            <span
              className={`font-serif font-bold tracking-tight text-charcoal transition-colors ${
                onClick ? "group-hover:text-terracotta" : ""
              } ${textSizes[size]}`}
            >
              Campus Uncut
            </span>
          </div>
          {showTagline && (
            <span className="font-serif italic text-xs text-charcoal-muted mt-0.5 tracking-normal">
              College life. Without the editing.
            </span>
          )}
        </div>
      )}
    </div>
  );

  return content;
};

