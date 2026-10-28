import React from "react";
import { Mic } from "lucide-react";

export const VoiceRatingInstruction: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div
      role="note"
      aria-label="Voice command instruction"
      className={`p-3 sm:p-3.5 rounded-lg bg-rose-50 border border-rose-200/90 text-[#B42318] flex items-start sm:items-center gap-2.5 font-sans leading-relaxed shadow-xs ${className}`}
    >
      <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
        <Mic className="w-3.5 h-3.5 text-[#B42318]" />
      </div>
      <div className="text-xs sm:text-[13px] break-words">
        <span className="font-bold text-[#B42318]">Voice command: </span>
        <span className="font-semibold text-[#B42318]">
          Say &ldquo;Rating&rdquo; followed by your score from 1 to 10. Example: &ldquo;Rating 10&rdquo;.
        </span>
      </div>
    </div>
  );
};
