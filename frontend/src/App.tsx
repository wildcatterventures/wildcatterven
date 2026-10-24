import React, { useState, useEffect } from "react";
import { NoticeBanner } from "./components/NoticeBanner";
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

  const handleNavigate = (view: string, data?: any) => {
    if (view === "colleges") {
      setSearchQuery(data?.query || "");
    }
    if (view === "college_detail" && data?.collegeId) {
      setSelectedCollegeId(data.collegeId);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleHeroSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentView("colleges");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenAssistantWithQuery = (sampleQuery: string) => {
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
      {/* 1. Persistent Unverified Affiliation Notice */}
      <NoticeBanner />

      {/* 2. Editorial Header */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenUnknownModal={() => setIsUnknownModalOpen(true)}
        onToggleAssistant={() => setIsAssistantOpen((prev) => !prev)}
        isAssistantOpen={isAssistantOpen}
      />

      {/* 3. Main Views */}
      <main className="flex-1">
        {/* HOMEPAGE VIEW */}
        {currentView === "home" && (
          <>
            <ConversationalHero
              onSearch={handleHeroSearch}
              onOpenAssistantWithQuery={handleOpenAssistantWithQuery}
              onExplore={() => handleNavigate("colleges")}
              onRate={() => handleNavigate("rate")}
            />
            <HowItWorks
              onExplore={() => handleNavigate("colleges")}
              onRate={() => handleNavigate("rate")}
            />
            <FeaturedColleges
              colleges={previewColleges}
              loading={loadingPreview}
              onSelectCollege={(id) => handleNavigate("college_detail", { collegeId: id })}
              onExploreAll={() => handleNavigate("colleges")}
              onRateCollege={(id) => {
                setSelectedCollegeId(id);
                setCurrentView("rate");
              }}
            />

          </>
        )}

        {/* COLLEGES DIRECTORY VIEW */}
        {currentView === "colleges" && (
          <CollegeList
            initialQuery={searchQuery}
            onSelectCollege={(id) => handleNavigate("college_detail", { collegeId: id })}
            onRateCollege={(id) => {
              setSelectedCollegeId(id);
              setCurrentView("rate");
            }}
            onOpenUnknownModal={() => setIsUnknownModalOpen(true)}
          />
        )}

        {/* COLLEGE DETAIL VIEW */}
        {currentView === "college_detail" && selectedCollegeId && (
          <CollegeDetail
            collegeId={selectedCollegeId}
            onBack={() => handleNavigate("colleges")}
            onRate={(id) => {
              setSelectedCollegeId(id);
              setCurrentView("rate");
            }}
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
