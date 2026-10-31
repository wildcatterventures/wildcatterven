import React from "react";
import { Home, Compass, SlidersHorizontal, Sparkles, User } from "lucide-react";

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: string, data?: any) => void;
  onToggleAssistant: () => void;
  isAssistantOpen: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onNavigate,
  onToggleAssistant,
  isAssistantOpen,
}) => {
  const navItems = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      isActive: currentView === "home" && !isAssistantOpen,
      action: () => onNavigate("home"),
    },
    {
      id: "explore",
      label: "Explore",
      icon: Compass,
      isActive: (currentView === "colleges" || currentView === "college_detail") && !isAssistantOpen,
      action: () => onNavigate("colleges"),
    },
    {
      id: "match",
      label: "Find My Fit",
      icon: SlidersHorizontal,
      isActive: currentView === "match" && !isAssistantOpen,
      action: () => onNavigate("match"),
    },
    {
      id: "assistant",
      label: "AI Assistant",
      icon: Sparkles,
      isActive: isAssistantOpen,
      action: onToggleAssistant,
      highlight: true,
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
      isActive: currentView === "profile" && !isAssistantOpen,
      action: () => onNavigate("profile"),
    },
  ];

  const handleItemClick = (item: (typeof navItems)[0]) => {
    if (item.id === "assistant") {
      onToggleAssistant();
    } else {
      if (isAssistantOpen) {
        onToggleAssistant();
      }
      item.action();
    }
  };

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-50 bg-paper/95 backdrop-blur-md border-t border-warm-grey flex md:hidden pb-safe shadow-[0_-2px_10px_rgba(37,39,36,0.04)]"
    >
      <div className="w-full max-w-md mx-auto grid grid-cols-5 items-center px-1 pt-2.5 pb-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`flex flex-col items-center justify-center pt-1.5 pb-0.5 px-1 rounded-lg transition-colors touch-manipulation min-h-[48px] relative ${
                active
                  ? "text-charcoal font-semibold"
                  : "text-charcoal-muted hover:text-charcoal"
              }`}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    active ? "scale-110 text-charcoal" : "text-charcoal-muted"
                  } ${item.highlight && !active ? "text-terracotta" : ""}`}
                />
                {/* Terracotta indicator for AI Assistant */}
                {item.highlight && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-terracotta" />
                )}
              </div>
              <span
                className={`text-[10px] mt-1 font-sans tracking-tight truncate max-w-full ${
                  active ? "font-bold text-charcoal" : "font-medium"
                }`}
              >
                {item.label}
              </span>

              {/* Active Tab Underline Pill */}
              {active && (
                <span className="absolute bottom-0 w-4 h-0.5 rounded-full bg-terracotta" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
