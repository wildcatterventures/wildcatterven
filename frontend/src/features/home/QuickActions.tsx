import React from "react";
import { BookOpen, MessageSquareQuote, PlusCircle, Sparkles } from "lucide-react";

interface QuickActionsProps {
  onNavigate: (view: string, data?: any) => void;
  onOpenUnknownModal: () => void;
  onToggleAssistant: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onNavigate,
  onOpenUnknownModal,
  onToggleAssistant,
}) => {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Explore Colleges Action */}
        <div
          onClick={() => onNavigate("colleges")}
          className="editorial-card p-5 cursor-pointer bg-card hover:-translate-y-0.5 transition-transform"
        >
          <div className="w-9 h-9 rounded bg-warm-grey-light flex items-center justify-center text-charcoal mb-4">
            <BookOpen className="w-5 h-5 text-olive" />
          </div>
          <h3 className="font-serif text-lg font-bold text-charcoal mb-1">
            Explore Colleges
          </h3>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            Browse public scores, response counts, and detailed parameter breakdowns.
          </p>
        </div>

        {/* Rate Your College Action */}
        <div
          onClick={() => onNavigate("rate")}
          className="editorial-card p-5 cursor-pointer bg-card hover:-translate-y-0.5 transition-transform border-olive/30"
        >
          <div className="w-9 h-9 rounded bg-olive-light flex items-center justify-center text-charcoal mb-4">
            <MessageSquareQuote className="w-5 h-5 text-olive" />
          </div>
          <h3 className="font-serif text-lg font-bold text-charcoal mb-1">
            Rate Your College
          </h3>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            Current student or alumnus? Share your unedited feedback across 25 parameters.
          </p>
        </div>

        {/* Add Unlisted College Action */}
        <div
          onClick={onOpenUnknownModal}
          className="editorial-card p-5 cursor-pointer bg-card hover:-translate-y-0.5 transition-transform"
        >
          <div className="w-9 h-9 rounded bg-warm-grey-light flex items-center justify-center text-charcoal mb-4">
            <PlusCircle className="w-5 h-5 text-charcoal-muted" />
          </div>
          <h3 className="font-serif text-lg font-bold text-charcoal mb-1">
            Add Unlisted College
          </h3>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            Missing from the directory? Register your campus with a verified starting score of 100.
          </p>
        </div>

        {/* Conversational Assistant Action */}
        <div
          onClick={onToggleAssistant}
          className="editorial-card p-5 cursor-pointer bg-card hover:-translate-y-0.5 transition-transform"
        >
          <div className="w-9 h-9 rounded bg-warm-grey-light flex items-center justify-center text-charcoal mb-4">
            <Sparkles className="w-5 h-5 text-olive" />
          </div>
          <h3 className="font-serif text-lg font-bold text-charcoal mb-1">
            Ask AI Assistant
          </h3>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            Use voice or natural language text to query database scores and parameter trends.
          </p>
        </div>
      </div>
    </section>
  );
};
