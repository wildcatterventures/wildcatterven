import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { UnknownCollegeModal } from "./components/UnknownCollegeModal";
import { AssistantDrawer } from "./components/AssistantDrawer";
import { ConversationalHero } from "./features/home/ConversationalHero";
import { HowItWorks } from "./features/home/HowItWorks";
import { FeaturedColleges } from "./features/home/FeaturedColleges";

import { CollegeList } from "./features/colleges/CollegeList";
import { CollegeDetail } from "./features/colleges/CollegeDetail";
import { RespondentSetup } from "./features/rating/RespondentSetup";
import { RatingWizard } from "./features/rating/RatingWizard";
import { MatchEngine } from "./features/match/MatchEngine";
import { EvidenceLeaderboard } from "./features/leaderboard/EvidenceLeaderboard";
import { CampusCircle } from "./features/community/CampusCircle";
import { api } from "./lib/api";
import { setActiveSessionId } from "./lib/storage";
import type { CollegeSummary, CollegeDetail as ICollegeDetail } from "./types/college";
import type { RatingSessionResponse } from "./types/rating";

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>("home");
  const [selectedCollegeId, setSelectedCollegeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [previewColleges, setPreviewColleges] = useState<CollegeSummary[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(true);

  // Active rating session state
  const [activeSession, setActiveSession] = useState<{
    session: RatingSessionResponse;
    college: CollegeSummary;
  } | null>(null);

  // Modals and Assistant state
  const [isUnknownModalOpen, setIsUnknownModalOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantInitialQuery, setAssistantInitialQuery] = useState<string | undefined>(undefined);

  // Fetch initial preview colleges for homepage
  const fetchPreview = () => {
    setLoadingPreview(true);
    api
      .getColleges("", true)
      .then((data) => setPreviewColleges(data))
      .catch(() => {})
      .finally(() => setLoadingPreview(false));
  };

  useEffect(() => {
    fetchPreview();
  }, []);

  // Sync with browser URL pathname on mount and popstate
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path.startsWith("/colleges/") && path.length > 10) {
        const id = path.replace("/colleges/", "").trim();
        if (id) {
          setSelectedCollegeId(id);
          setCurrentView("college_detail");
        }
      } else if (path === "/colleges") {
        setCurrentView("colleges");
      } else if (path === "/match") {
        setCurrentView("match");
      } else if (path === "/leaderboard") {
        setCurrentView("leaderboard");
      } else if (path === "/community" || path === "/circle") {
        setCurrentView("community");
      } else if (path === "/rate") {
        setCurrentView("rate");
        window.scrollTo({ top: 0, behavior: "auto" });
      } else if (path === "/" || path === "") {
        setCurrentView("home");
      }
    };

    handleLocationChange();
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  const handleNavigate = (view: string, data?: any) => {
    if (view === "home") {
      window.history.pushState({}, "", "/");
      setCurrentView("home");
    } else if (view === "colleges") {
      setSearchQuery(data?.query || "");
      window.history.pushState({}, "", "/colleges");
      setCurrentView("colleges");
    } else if (view === "match") {
      window.history.pushState({}, "", "/match");
      setCurrentView("match");
    } else if (view === "leaderboard") {
      window.history.pushState({}, "", "/leaderboard");
      setCurrentView("leaderboard");
    } else if (view === "community" || view === "circle") {
      window.history.pushState({}, "", "/community");
      setCurrentView("community");
    } else if (view === "college_detail" && data?.collegeId) {
      setSelectedCollegeId(data.collegeId);
      window.history.pushState({}, "", `/colleges/${data.collegeId}`);
      setCurrentView("college_detail");
    } else if (view === "rate") {
      const targetCollegeId = data?.collegeId || selectedCollegeId;
      if (targetCollegeId) {
        setSelectedCollegeId(targetCollegeId);
        window.history.pushState({}, "", "/rate");
        setCurrentView("rate");
      } else {
        // Generic rate action without a selected college -> Navigate to /colleges
        setSearchQuery("");
        window.history.pushState({}, "", "/colleges");
        setCurrentView("colleges");
      }
    } else {
      setCurrentView(view);
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const handleHeroSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentView("colleges");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenAssistantWithQuery = (sampleQuery?: string) => {
    setAssistantInitialQuery(sampleQuery);
    setIsAssistantOpen(true);
  };

  const handleCollegeCreated = (created: ICollegeDetail) => {
    setIsUnknownModalOpen(false);
    fetchPreview();
    handleNavigate("college_detail", { collegeId: created.college_id });
  };

  const handleSessionStarted = (
    session: RatingSessionResponse,
    college: CollegeSummary
  ) => {
    setActiveSessionId(session.id);
    setActiveSession({ session, college });
  };

  const handleExitRatingSession = () => {
    setActiveSession(null);
    setActiveSessionId(null);
    setCurrentView("colleges");
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-charcoal font-sans">
      {/* 1. Editorial Header */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenUnknownModal={() => setIsUnknownModalOpen(true)}
        onToggleAssistant={() => setIsAssistantOpen((prev) => !prev)}
        isAssistantOpen={isAssistantOpen}
      />

      {/* 3. Main Views */}
      <main className="flex-1 min-w-0">
        {/* HOMEPAGE VIEW */}
        {currentView === "home" && (
          <>
            <ConversationalHero
              onSearch={handleHeroSearch}
              onOpenAssistantWithQuery={handleOpenAssistantWithQuery}
              onExplore={() => handleNavigate("colleges")}
              onRate={() => handleNavigate("colleges")}
              onMatch={() => handleNavigate("match")}
            />
            <HowItWorks
              onExplore={() => handleNavigate("colleges")}
              onRate={() => handleNavigate("colleges")}
            />
            <FeaturedColleges
              colleges={previewColleges}
              loading={loadingPreview}
              onSelectCollege={(id) => handleNavigate("college_detail", { collegeId: id })}
              onExploreAll={() => handleNavigate("colleges")}
              onRateCollege={(id) => handleNavigate("rate", { collegeId: id })}
            />

          </>
        )}

        {/* UNCUT MATCH ENGINE VIEW */}
        {currentView === "match" && (
          <MatchEngine
            onSelectCollege={(id) => handleNavigate("college_detail", { collegeId: id })}
            onRateCollege={(id) => handleNavigate("rate", { collegeId: id })}
          />
        )}

        {/* EVIDENCE-BACKED LEADERBOARD VIEW */}
        {currentView === "leaderboard" && (
          <EvidenceLeaderboard
            onSelectCollege={(id) => handleNavigate("college_detail", { collegeId: id })}
            onNavigateToMatch={() => handleNavigate("match")}
            onBackToHome={() => handleNavigate("home")}
          />
        )}

        {/* UNCUT CAMPUS CIRCLE PROTOTYPE VIEW */}
        {currentView === "community" && (
          <CampusCircle
            onBackToHome={() => handleNavigate("colleges")}
            onNavigateToMatch={() => handleNavigate("match")}
          />
        )}

        {/* COLLEGES DIRECTORY VIEW */}
        {currentView === "colleges" && (
          <CollegeList
            initialQuery={searchQuery}
            onSelectCollege={(id) => handleNavigate("college_detail", { collegeId: id })}
            onRateCollege={(id) => handleNavigate("rate", { collegeId: id })}
            onOpenUnknownModal={() => setIsUnknownModalOpen(true)}
          />
        )}

        {/* COLLEGE DETAIL VIEW */}
        {currentView === "college_detail" && selectedCollegeId && (
          <CollegeDetail
            collegeId={selectedCollegeId}
            onBack={() => handleNavigate("colleges")}
            onRate={(id) => handleNavigate("rate", { collegeId: id })}
            onAskAssistant={handleOpenAssistantWithQuery}
          />
        )}

        {/* RATING JOURNEY VIEW */}
        {currentView === "rate" && (
          <>
            {!activeSession ? (
              <RespondentSetup
                initialCollegeId={selectedCollegeId || undefined}
                onSessionStarted={handleSessionStarted}
                onCancel={() => handleNavigate("home")}
              />
            ) : (
              <RatingWizard
                session={activeSession.session}
                college={activeSession.college}
                onExit={handleExitRatingSession}
                onViewCollege={(id) => handleNavigate("college_detail", { collegeId: id })}
              />
            )}
          </>
        )}
      </main>

      {/* 4. Footer */}
      <Footer />

      {/* 5. Unknown College Creation Modal */}
      <UnknownCollegeModal
        isOpen={isUnknownModalOpen}
        onClose={() => setIsUnknownModalOpen(false)}
        onCollegeCreated={handleCollegeCreated}
      />

      {/* 6. Conversational AI Assistant Drawer */}
      <AssistantDrawer
        isOpen={isAssistantOpen}
        initialQuery={assistantInitialQuery}
        onClearInitialQuery={() => setAssistantInitialQuery(undefined)}
        onClose={() => {
          setIsAssistantOpen(false);
          setAssistantInitialQuery(undefined);
        }}
        onSelectCollege={(id) => handleNavigate("college_detail", { collegeId: id })}
      />
    </div>
  );
};
export default App;
