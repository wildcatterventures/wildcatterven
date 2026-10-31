import React, { useState } from "react";
import { THEMATIC_CATEGORIES } from "../../lib/thematicCategories";
import { MessageSquare, ThumbsUp, Flag, Plus, ShieldAlert, Sparkles, Filter, CheckCircle2, AlertCircle } from "lucide-react";

interface Answer {
  id: string;
  authorAffiliation: "Self-Reported Student (Unverified)" | "Self-Reported Alumnus (Unverified)";
  authorBatch: string;
  body: string;
  helpfulCount: number;
  hasUpvoted?: boolean;
  date: string;
}

interface Question {
  id: string;
  title: string;
  body: string;
  categoryId: string;
  collegeName?: string;
  authorAffiliation: "Self-Reported Student (Unverified)" | "Self-Reported Alumnus (Unverified)" | "Prospective Student (Unverified)";
  date: string;
  helpfulCount: number;
  hasUpvoted?: boolean;
  isReported?: boolean;
  answers: Answer[];
}

// Strictly illustrative sample discussions with explicit disclaimer markers
const INITIAL_DEMO_QUESTIONS: Question[] = [
  {
    id: "q-demo-1",
    title: "How rigorous is the 75% attendance policy for engineering labs?",
    body: "I am deciding between institutes and wanted to know whether attendance mandates are enforced strictly across semesters or if there is leeway for hackathon participation.",
    categoryId: "academics",
    collegeName: "Apex Institute of Technology",
    authorAffiliation: "Prospective Student (Unverified)",
    date: "Prototype Demo Entry",
    helpfulCount: 8,
    answers: [
      {
        id: "a-demo-1-1",
        authorAffiliation: "Self-Reported Student (Unverified)",
        authorBatch: "Class of 2025",
        body: "Lab attendance is tracked with biometric or physical signature rolls every session. For college-approved hackathons, OD (on-duty) leaves are sanctioned if submitted 3 days prior.",
        helpfulCount: 14,
        date: "Prototype Demo Entry",
      },
    ],
  },
  {
    id: "q-demo-2",
    title: "How is the off-campus transit and late-evening security around hostels?",
    body: "Wanted honest feedback on safety protocols, street lighting, and shuttle accessibility when returning from library hours after 8:30 PM.",
    categoryId: "safety",
    collegeName: "St. Jude College of Engineering",
    authorAffiliation: "Prospective Student (Unverified)",
    date: "Prototype Demo Entry",
    helpfulCount: 12,
    answers: [
      {
        id: "a-demo-2-1",
        authorAffiliation: "Self-Reported Student (Unverified)",
        authorBatch: "Class of 2024",
        body: "The main campus gate has round-the-clock guards and student entry logs. Outer perimeter lighting was updated recently, though public auto-rickshaws get sparse after 9:30 PM.",
        helpfulCount: 19,
        date: "Prototype Demo Entry",
      },
    ],
  },
  {
    id: "q-demo-3",
    title: "What are realistic on-campus placement opportunities for non-CS branches?",
    body: "Do core companies (mechanical/electrical) visit regularly, or do most students prepare for software development / IT consultancy roles?",
    categoryId: "career_governance",
    collegeName: "Apex Institute of Technology",
    authorAffiliation: "Prospective Student (Unverified)",
    date: "Prototype Demo Entry",
    helpfulCount: 15,
    answers: [
      {
        id: "a-demo-3-1",
        authorAffiliation: "Self-Reported Alumnus (Unverified)",
        authorBatch: "Batch of 2023",
        body: "A mix: about 30% of core branch students received core design and operations offers, while roughly 50% pivoted to analytics and full-stack software roles through open eligibility drives.",
        helpfulCount: 22,
        date: "Prototype Demo Entry",
      },
    ],
  },
  {
    id: "q-demo-4",
    title: "Hostel Wi-Fi bandwidth and mess food variety over weekends?",
    body: "Looking to understand real living conditions — is personal dongle needed for research/coding, and how is the weekend vegetarian menu?",
    categoryId: "living",
    collegeName: "St. Jude College of Engineering",
    authorAffiliation: "Prospective Student (Unverified)",
    date: "Prototype Demo Entry",
    helpfulCount: 6,
    answers: [
      {
        id: "a-demo-4-1",
        authorAffiliation: "Self-Reported Student (Unverified)",
        authorBatch: "Class of 2026",
        body: "Wi-Fi speeds average 35–50 Mbps in academic blocks; hostel wings can drop during peak hours (9–11 PM). The mess serves North and South Indian items with special dinners on Sundays.",
        helpfulCount: 11,
        date: "Prototype Demo Entry",
      },
    ],
  },
];

interface CampusCircleProps {
  onBackToHome: () => void;
  onNavigateToMatch?: () => void;
}

export const CampusCircle: React.FC<CampusCircleProps> = ({ onBackToHome, onNavigateToMatch }) => {
  const [questions, setQuestions] = useState<Question[]>(INITIAL_DEMO_QUESTIONS);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportNotification, setReportNotification] = useState<string | null>(null);

  // New question form state
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formCategory, setFormCategory] = useState(THEMATIC_CATEGORIES[0].id);
  const [formCollege, setFormCollege] = useState("General Campus Discussion");
  const [formAffiliation, setFormAffiliation] = useState<
    "Prospective Student (Unverified)" | "Self-Reported Student (Unverified)" | "Self-Reported Alumnus (Unverified)"
  >("Prospective Student (Unverified)");
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    if (selectedCategory !== "all" && q.categoryId !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const qText = `${q.title} ${q.body} ${q.collegeName || ""}`.toLowerCase();
      if (!qText.includes(searchQuery.toLowerCase().trim())) return false;
    }
    return true;
  });

  const handleToggleUpvoteQuestion = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qId) {
          const nextUpvoted = !q.hasUpvoted;
          return {
            ...q,
            hasUpvoted: nextUpvoted,
            helpfulCount: nextUpvoted ? q.helpfulCount + 1 : q.helpfulCount - 1,
          };
        }
        return q;
      })
    );
  };

  const handleToggleUpvoteAnswer = (qId: string, aId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qId) {
          return {
            ...q,
            answers: q.answers.map((a) => {
              if (a.id === aId) {
                const nextUpvoted = !a.hasUpvoted;
                return {
                  ...a,
                  hasUpvoted: nextUpvoted,
                  helpfulCount: nextUpvoted ? a.helpfulCount + 1 : a.helpfulCount - 1,
                };
              }
              return a;
            }),
          };
        }
        return q;
      })
    );
  };

  const handleReportQuestion = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, isReported: true } : q))
    );
    setReportNotification("Post flagged for moderation review. (Prototype safety trigger)");
    setTimeout(() => setReportNotification(null), 4500);
  };

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const newQ: Question = {
      id: `q-user-${Date.now()}`,
      title: formTitle.trim(),
      body: formBody.trim(),
      categoryId: formCategory,
      collegeName: formCollege,
      authorAffiliation: formAffiliation,
      date: "Just now (browser state)",
      helpfulCount: 0,
      answers: [],
    };

    setQuestions([newQ, ...questions]);
    setFormTitle("");
    setFormBody("");
    setIsModalOpen(false);
  };

  const handleAddReply = (qId: string) => {
    const text = replyInputs[qId]?.trim();
    if (!text) return;

    const newA: Answer = {
      id: `a-user-${Date.now()}`,
      authorAffiliation: "Self-Reported Student (Unverified)",
      authorBatch: "Current Cohort (Unverified)",
      body: text,
      helpfulCount: 0,
      date: "Just now (browser state)",
    };

    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, answers: [...q.answers, newA] } : q))
    );

    setReplyInputs((prev) => ({ ...prev, [qId]: "" }));
    setActiveReplyId(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-[#252724] pb-28 md:pb-16">
      {/* Top Banner & Header */}
      <div className="bg-[#252724] text-[#F5F2EB] border-b border-[#3A3D38] py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <button
              onClick={onBackToHome}
              className="text-xs uppercase tracking-wider font-semibold text-[#A8B298] hover:text-[#F5F2EB] transition-colors"
            >
              &larr; Back to Directory
            </button>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#727D60]/30 text-[#D4DEC3] border border-[#727D60]/40">
              <Sparkles className="w-3.5 h-3.5 text-[#D4DEC3]" />
              Interactive Community Prototype
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#F5F2EB] font-bold tracking-tight">
                Campus Circle
              </h1>
              <p className="text-sm sm:text-base text-[#DCD7CD] mt-2 max-w-2xl font-sans">
                A prototype student-to-student Q&A space organized around authentic campus categories.
                Ask candid questions, share nuances, and read peer observations.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#727D60] hover:bg-[#5E684E] text-[#F5F2EB] font-sans font-semibold text-sm transition-all shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              Ask a Question
            </button>
          </div>
        </div>
      </div>

      {/* Strict Prototype Separation Warning */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/80 text-amber-900 text-xs sm:text-sm flex items-start gap-3 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider text-[11px] text-amber-800">
              Strict Demo-Data Separation Notice
            </span>
            <p className="text-amber-900/90 leading-relaxed font-sans">
              <strong>Illustrative demo content — not real student posts.</strong> Campus Circle is an
              experimental peer interaction design. Campus Uncut has not enabled public user accounts or institutional verification yet. All affiliations shown are strictly <em>unverified self-reports</em>.
              Interactions in this prototype are preserved only in local browser state and are not saved to live production databases.
            </p>
          </div>
        </div>

        {reportNotification && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-sans flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{reportNotification}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Content + Moderation/Guidelines sidebar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Feed Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Category Filter Bar */}
            <div className="space-y-3 bg-[#E5E1D8]/40 p-4 rounded-xl border border-[#D5D0C5]">
              <div className="flex items-center justify-between text-xs font-semibold text-[#5A5D56] uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5" /> Filter by Thematic Category
                </span>
                <span>{filteredQuestions.length} discussions</span>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics (e.g. attendance, placements, mess food)..."
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#D5D0C5] bg-white focus:outline-none focus:ring-1 focus:ring-[#727D60]"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedCategory === "all"
                      ? "bg-[#252724] text-[#F5F2EB]"
                      : "bg-[#F5F2EB] text-[#5A5D56] hover:bg-[#DCD7CD] border border-[#D5D0C5]"
                  }`}
                >
                  All Topics
                </button>
                {THEMATIC_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedCategory === cat.id
                        ? "bg-[#252724] text-[#F5F2EB]"
                        : "bg-[#F5F2EB] text-[#5A5D56] hover:bg-[#DCD7CD] border border-[#D5D0C5]"
                    }`}
                  >
                    {cat.shortName}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions Feed */}
            {filteredQuestions.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-[#E5E1D8] space-y-3">
                <AlertCircle className="w-8 h-8 text-[#727D60] mx-auto" />
                <h3 className="font-serif text-lg font-bold text-[#252724]">No questions in this category yet</h3>
                <p className="text-sm text-[#5A5D56] max-w-sm mx-auto">
                  Be the first to open a constructive inquiry about this campus aspect.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#727D60] text-white text-xs font-semibold hover:bg-[#5E684E]"
                >
                  <Plus className="w-3.5 h-3.5" /> Start Discussion
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((q) => {
                  const cat = THEMATIC_CATEGORIES.find((c) => c.id === q.categoryId);
                  return (
                    <article
                      key={q.id}
                      className="bg-white rounded-xl border border-[#E5E1D8] p-5 sm:p-6 shadow-sm hover:border-[#D5D0C5] transition-all"
                    >
                      {/* Demo Marker watermark banner */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-100/90 text-amber-900 border border-amber-300 mb-3">
                        Illustrative demo content — not real student posts.
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#727D60] mb-2 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-[#F5F2EB] text-[#5A5D56] border border-[#E5E1D8]">
                            {cat?.name || "General"}
                          </span>
                          {q.collegeName && (
                            <span className="text-[#252724] font-semibold">
                              {q.collegeName}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#8C9088]">{q.date}</span>
                      </div>

                      <h2 className="font-serif text-lg sm:text-xl font-bold text-[#252724] leading-snug">
                        {q.title}
                      </h2>
                      {q.body && (
                        <p className="text-sm text-[#5A5D56] mt-2 font-sans leading-relaxed">
                          {q.body}
                        </p>
                      )}

                      {/* Author Tag */}
                      <div className="mt-3 flex items-center gap-2 text-xs text-[#8C9088]">
                        <span>Asked by:</span>
                        <span className="inline-block px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[11px] font-medium border border-zinc-200">
                          {q.authorAffiliation}
                        </span>
                      </div>

                      {/* Answers Preview */}
                      {q.answers.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-[#F5F2EB] space-y-3">
                          <div className="text-xs uppercase tracking-wider font-semibold text-[#5A5D56] flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5" />
                            Answers ({q.answers.length})
                          </div>
                          {q.answers.map((ans) => (
                            <div
                              key={ans.id}
                              className="bg-[#F5F2EB]/60 p-3.5 rounded-lg border border-[#E5E1D8] space-y-2 text-xs"
                            >
                              <div className="flex items-center justify-between text-[11px] text-[#727D60]">
                                <span className="font-medium text-zinc-700 bg-white px-2 py-0.5 rounded border border-[#E5E1D8]">
                                  {ans.authorAffiliation} &bull; {ans.authorBatch}
                                </span>
                                <span>{ans.date}</span>
                              </div>
                              <p className="text-sm text-[#252724] leading-relaxed">
                                {ans.body}
                              </p>
                              <div className="flex items-center justify-between pt-1">
                                <button
                                  onClick={() => handleToggleUpvoteAnswer(q.id, ans.id)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                                    ans.hasUpvoted
                                      ? "bg-[#727D60] text-white"
                                      : "bg-white hover:bg-zinc-100 text-[#5A5D56] border border-[#E5E1D8]"
                                  }`}
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                  <span>Helpful ({ans.helpfulCount})</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Reply Area (Interactive) */}
                      {activeReplyId === q.id ? (
                        <div className="mt-4 pt-3 border-t border-[#F5F2EB] space-y-2">
                          <textarea
                            value={replyInputs[q.id] || ""}
                            onChange={(e) =>
                              setReplyInputs({ ...replyInputs, [q.id]: e.target.value })
                            }
                            placeholder="Add your respectful, constructive observation (saved in local browser state)..."
                            rows={3}
                            className="w-full p-2.5 text-xs rounded-lg border border-[#D5D0C5] bg-[#F5F2EB]/30 focus:outline-none focus:ring-1 focus:ring-[#727D60]"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setActiveReplyId(null)}
                              className="px-3 py-1 text-xs text-[#5A5D56] hover:text-[#252724]"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleAddReply(q.id)}
                              className="px-3 py-1.5 rounded bg-[#727D60] text-white text-xs font-semibold hover:bg-[#5E684E]"
                            >
                              Post Answer (Demo)
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {/* Card Action footer */}
                      <div className="mt-4 pt-3 border-t border-[#F5F2EB] flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleUpvoteQuestion(q.id)}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                              q.hasUpvoted
                                ? "bg-[#727D60] text-white"
                                : "bg-[#F5F2EB] hover:bg-[#E5E1D8] text-[#5A5D56]"
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>Helpful ({q.helpfulCount})</span>
                          </button>

                          {activeReplyId !== q.id && (
                            <button
                              onClick={() => setActiveReplyId(q.id)}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-[#F5F2EB] hover:bg-[#E5E1D8] text-[#5A5D56]"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Answer</span>
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => handleReportQuestion(q.id)}
                          disabled={q.isReported}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] ${
                            q.isReported
                              ? "text-amber-700 font-semibold cursor-not-allowed"
                              : "text-[#8C9088] hover:text-red-700 transition-colors"
                          }`}
                        >
                          <Flag className="w-3 h-3" />
                          <span>{q.isReported ? "Reported to Review" : "Report"}</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar: Guidelines, Future Architecture, Match Engine CTA */}
          <div className="lg:col-span-4 space-y-6">
            {/* Moderation Guidance Card */}
            <div className="bg-white rounded-xl border border-[#E5E1D8] p-5 shadow-sm space-y-3">
              <h3 className="font-serif text-base font-bold text-[#252724] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#727D60]" />
                Community Standards & Moderation
              </h3>
              <p className="text-xs text-[#5A5D56] leading-relaxed">
                Campus Circle is designed for authentic institutional insights without toxicity:
              </p>
              <ul className="text-xs text-[#5A5D56] space-y-2 list-disc pl-4 leading-relaxed">
                <li>
                  <strong>Evidence-focused:</strong> Ask about tangible policies, labs, mess hygiene, placements, and campus culture.
                </li>
                <li>
                  <strong>No Personal Slander:</strong> Individual faculty names or student identities are strictly disallowed.
                </li>
                <li>
                  <strong>Anti-Ragging Zero Tolerance:</strong> Any harassment or retaliatory threats trigger immediate administrative referral.
                </li>
                <li>
                  <strong>Self-Reported Transparency:</strong> Community posts are never blended with audited numerical ratings.
                </li>
              </ul>
            </div>

            {/* Production Architecture Roadmap Card */}
            <div className="bg-[#E5E1D8]/50 rounded-xl border border-[#D5D0C5] p-5 space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#727D60]">
                Technical Roadmap
              </span>
              <h4 className="font-serif text-sm font-bold text-[#252724]">
                Future Production Community Scope
              </h4>
              <p className="text-xs text-[#5A5D56] leading-relaxed">
                To move Campus Circle from prototype into live production, the following infrastructure will be required:
              </p>
              <div className="space-y-1.5 text-[11px] text-[#252724] font-mono">
                <div className="p-1.5 rounded bg-white/70 border border-[#D5D0C5]">
                  &bull; Supabase schema: <code>community_questions</code> &amp; <code>community_answers</code>
                </div>
                <div className="p-1.5 rounded bg-white/70 border border-[#D5D0C5]">
                  &bull; Institutional email verification (.edu / .ac.in OTP flow)
                </div>
                <div className="p-1.5 rounded bg-white/70 border border-[#D5D0C5]">
                  &bull; Automated profanity &amp; PII filtering microservice
                </div>
                <div className="p-1.5 rounded bg-white/70 border border-[#D5D0C5]">
                  &bull; Moderation queue with role-based access control
                </div>
              </div>
            </div>

            {/* Find My Fit Promo */}
            {onNavigateToMatch && (
              <div className="bg-[#252724] text-[#F5F2EB] rounded-xl p-5 space-y-3">
                <h4 className="font-serif text-sm font-bold text-[#F5F2EB]">
                  Prefer data-driven matching?
                </h4>
                <p className="text-xs text-[#DCD7CD] leading-relaxed">
                  Use the Uncut Match Engine to find campuses based on your own personalized priorities and weighted evidence.
                </p>
                <button
                  onClick={onNavigateToMatch}
                  className="w-full py-2 rounded-lg bg-[#727D60] hover:bg-[#5E684E] text-white text-xs font-semibold transition-colors"
                >
                  Launch Match Engine &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ask Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#D5D0C5] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#252724]">
                  Ask a Campus Question
                </h3>
                <p className="text-xs text-[#727D60] mt-0.5">
                  Held in browser state for demonstration purposes
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8C9088] hover:text-[#252724] text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#252724] mb-1">
                  Question Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. How responsive is the placement cell for summer internships?"
                  className="w-full p-2.5 text-xs rounded-lg border border-[#D5D0C5] bg-[#F5F2EB]/30 focus:outline-none focus:ring-1 focus:ring-[#727D60]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#252724] mb-1">
                    Thematic Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-[#D5D0C5] bg-white focus:outline-none focus:ring-1 focus:ring-[#727D60]"
                  >
                    {THEMATIC_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252724] mb-1">
                    Related College
                  </label>
                  <input
                    type="text"
                    value={formCollege}
                    onChange={(e) => setFormCollege(e.target.value)}
                    placeholder="e.g. Apex Institute or General"
                    className="w-full p-2 text-xs rounded-lg border border-[#D5D0C5] bg-white focus:outline-none focus:ring-1 focus:ring-[#727D60]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252724] mb-1">
                  Your Affiliation (Self-Reported)
                </label>
                <select
                  value={formAffiliation}
                  onChange={(e) =>
                    setFormAffiliation(
                      e.target.value as "Prospective Student (Unverified)" | "Self-Reported Student (Unverified)" | "Self-Reported Alumnus (Unverified)"
                    )
                  }
                  className="w-full p-2 text-xs rounded-lg border border-[#D5D0C5] bg-white focus:outline-none focus:ring-1 focus:ring-[#727D60]"
                >
                  <option value="Prospective Student (Unverified)">
                    Prospective Student (Unverified)
                  </option>
                  <option value="Self-Reported Student (Unverified)">
                    Current Student (Unverified Self-Report)
                  </option>
                  <option value="Self-Reported Alumnus (Unverified)">
                    Alumnus (Unverified Self-Report)
                  </option>
                </select>
                <p className="text-[10px] text-[#727D60] mt-1">
                  Campus Uncut does not yet offer institutional email verification.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252724] mb-1">
                  Details / Context
                </label>
                <textarea
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="Provide brief context to help respondents share accurate experiences..."
                  rows={3}
                  className="w-full p-2.5 text-xs rounded-lg border border-[#D5D0C5] bg-[#F5F2EB]/30 focus:outline-none focus:ring-1 focus:ring-[#727D60]"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 leading-snug">
                <strong>Illustrative demo content — not real student posts.</strong> This post will appear in your current browser session only. No data is sent or saved to the production database.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#5A5D56] hover:text-[#252724]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#727D60] hover:bg-[#5E684E] text-white text-xs font-semibold transition-colors"
                >
                  Post to Demo Feed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
