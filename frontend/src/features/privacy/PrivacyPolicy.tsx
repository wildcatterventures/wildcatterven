import React, { useEffect } from "react";
import {
  ShieldCheck,
  Mail,
  Mic,
  Sparkles,
  UserCheck,
  ArrowLeft,
  ExternalLink,
  FileText,
  CheckCircle2,
} from "lucide-react";

interface PrivacyPolicyProps {
  onBack?: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const approvedContactEmail = "mathew.maxwell2021@gmail.com";

  return (
    <div className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto font-sans text-charcoal pb-28 md:pb-16">
      {/* Navigation Header */}
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-charcoal-muted hover:text-charcoal transition-colors px-3 py-1.5 rounded-md hover:bg-warm-grey-light border border-transparent hover:border-warm-grey"
        >
          <ArrowLeft className="w-4 h-4 text-olive" />
          <span>Back to Application</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-charcoal-muted">
          <span className="w-2 h-2 rounded-full bg-olive inline-block" />
          <span>Effective: October 2026</span>
        </div>
      </div>

      {/* Hero Headline */}
      <header className="border-b border-warm-grey pb-8 mb-10">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-olive-light border border-olive/30 text-olive-dark text-xs font-mono font-medium mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-olive" />
          <span>Legal &amp; Data Protection</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-charcoal">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm sm:text-base text-charcoal-muted leading-relaxed max-w-3xl">
          Campus Uncut is an open, student-powered intelligence platform dedicated to surfacing lived college realities without editorial censorship. This Privacy Policy outlines precisely what information we collect, how it is processed across our web and mobile applications, our technical data protection practices, and your rights regarding your personal and pseudonymous data.
        </p>
      </header>

      {/* Summary Box */}
      <div className="editorial-card p-5 sm:p-6 mb-12 bg-white border border-warm-grey">
        <h2 className="text-xs font-mono uppercase tracking-wider text-olive font-semibold mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-olive" />
          <span>Quick Summary of Privacy Commitments</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-charcoal-muted leading-relaxed">
          <div className="p-3 rounded bg-warm-grey-light/50 border border-warm-grey">
            <strong className="text-charcoal block mb-1">Zero Audio Storage</strong>
            Microphone audio is processed entirely through system speech services. Campus Uncut never records, streams, or saves raw voice recordings to our servers or databases.
          </div>
          <div className="p-3 rounded bg-warm-grey-light/50 border border-warm-grey">
            <strong className="text-charcoal block mb-1">No Third-Party Ad Trackers</strong>
            We do not sell, rent, or monetize your data. We use no behavioral advertising networks, fingerprinting pixels, or commercial tracking cookies.
          </div>
          <div className="p-3 rounded bg-warm-grey-light/50 border border-warm-grey">
            <strong className="text-charcoal block mb-1">In-Memory AI Assistant</strong>
            Prompts sent to the AI assistant are processed in transient memory to generate answers and execute read-only tools. Chat histories are not persisted in our database.
          </div>
          <div className="p-3 rounded bg-warm-grey-light/50 border border-warm-grey">
            <strong className="text-charcoal block mb-1">Accessible User Rights</strong>
            You may request a copy of your data, correct errors, or request permanent deletion of your profile by emailing{" "}
            <a
              href="mailto:mathew.maxwell2021@gmail.com"
              className="text-olive hover:underline font-medium text-charcoal"
            >
              {approvedContactEmail}
            </a>.
          </div>
        </div>
      </div>

      {/* Main Sections */}
      <div className="space-y-12">
        {/* Section 1: Entity & Governance */}
        <section className="scroll-mt-20" id="entity">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-xs text-olive font-semibold">01</span>
            <h2 className="font-serif text-2xl font-bold text-charcoal">
              Operating Entity &amp; Scope
            </h2>
          </div>
          <div className="prose text-xs sm:text-sm text-charcoal-muted leading-relaxed space-y-3">
            <p>
              Campus Uncut (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the Platform&rdquo;) is developed and operated under <strong>WildCatter Ventures</strong>. This Privacy Policy applies to all services offered through the Campus Uncut web application (hosted at <code className="text-[12px] bg-warm-grey-light px-1.5 py-0.5 rounded font-mono">https://campus-uncut.vercel.app</code>), the backend API (<code className="text-[12px] bg-warm-grey-light px-1.5 py-0.5 rounded font-mono">https://campus-uncut.onrender.com</code>), and the Android mobile application package (<code className="text-[12px] bg-warm-grey-light px-1.5 py-0.5 rounded font-mono">com.wildcatterventures.campusuncut</code>).
            </p>
          </div>
        </section>

        {/* Section 2: Information Collected */}
        <section className="scroll-mt-20" id="data-collected">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-xs text-olive font-semibold">02</span>
            <h2 className="font-serif text-2xl font-bold text-charcoal">
              Information We Collect &amp; How It Is Collected
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-charcoal-muted leading-relaxed space-y-4">
            <p>
              We collect information in two primary contexts: when you browse and discover colleges, and when you declare an affiliation to submit an authentic campus rating.
            </p>

            <div className="editorial-card p-4 sm:p-5 bg-card border border-warm-grey">
              <h3 className="font-sans font-semibold text-charcoal text-sm mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-olive" />
                <span>A. College Discovery &amp; Search Events</span>
              </h3>
              <p className="mb-2">
                When you search for colleges by typing or speaking in the search bar, we collect:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Search Query:</strong> The text string of your query, truncated to a maximum of 200 characters to prevent accidental database bloat or sensitive data ingestion.
                </li>
                <li>
                  <strong>Input Mode:</strong> An indicator specifying whether the search was performed via text (<code className="font-mono text-[11px]">&apos;text&apos;</code>) or speech (<code className="font-mono text-[11px]">&apos;voice&apos;</code>).
                </li>
                <li>
                  <strong>Matched Institution &amp; Parameter Keys:</strong> The internal UUID of any college matching your query and any specific rating parameter categories requested.
                </li>
                <li>
                  <strong>Visitor Session ID:</strong> A randomly generated UUID used strictly to deduplicate queries within a 5-second window so that real-time typing does not create duplicate database records.
                </li>
              </ul>
              <p className="mt-2 text-[11px] text-charcoal-muted font-mono">
                * We do not collect or log IP addresses, GPS coordinates, or device fingerprint hashes in search event records.
              </p>
            </div>

            <div className="editorial-card p-4 sm:p-5 bg-card border border-warm-grey">
              <h3 className="font-sans font-semibold text-charcoal text-sm mb-2 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-olive" />
                <span>B. College Rating Submissions &amp; Respondent Profile</span>
              </h3>
              <p className="mb-2">
                When you contribute an evaluation of an institution, you participate in a structured evaluation workflow. We collect:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Display Name / Alias:</strong> A self-selected display name (minimum 1 character) used on public feedback summaries. You are free to provide a pseudonym to protect your personal identity.
                </li>
                <li>
                  <strong>Declared Affiliation:</strong> Your self-declared role at the college (<code className="font-mono text-[11px]">&apos;current_student&apos;</code> or <code className="font-mono text-[11px]">&apos;alumnus&apos;</code>). All affiliations are explicitly unverified.
                </li>
                <li>
                  <strong>Official College Email Address:</strong> Your institutional email (e.g., <code className="font-mono text-[11px]">student@sfit.ac.in</code>). This email is validated strictly to verify domain affinity with the declared college and enforce our one-submission-per-respondent rule. It is stored securely in our database and is never displayed publicly on college cards.
                </li>
                <li>
                  <strong>Structured Parameter Ratings:</strong> For each of the 25 standardized criteria across academics, hostel life, safety, placements, and infrastructure, you provide an integer rating between 1 and 10 or an explicit &ldquo;No view&rdquo; flag.
                </li>
                <li>
                  <strong>No Freeform Comments:</strong> The official rating wizard does not collect freeform written commentary, preventing inadvertent disclosure of sensitive personal experiences.
                </li>
                <li>
                  <strong>Mathematical Score Impact:</strong> Your ratings contribute to an unrounded arithmetic mean. Once submitted, each completed block of 20 low contributions drops the institutional score by 1; each completed block of 20 high contributions raises it by 1.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3: Identifiers & Local Storage */}
        <section className="scroll-mt-20" id="identifiers">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-xs text-olive font-semibold">03</span>
            <h2 className="font-serif text-2xl font-bold text-charcoal">
              Pseudonymous Identifiers &amp; Local Storage
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-charcoal-muted leading-relaxed space-y-3">
            <p>
              Campus Uncut does not use traditional tracking cookies, session profiling cookies, or third-party advertising cookies. Instead, we use your browser&apos;s standard <code className="font-mono text-[12px] bg-warm-grey-light px-1.5 py-0.5 rounded">localStorage</code> to maintain your session state locally on your device:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-warm-grey text-xs">
                <thead>
                  <tr className="bg-warm-grey-light text-charcoal font-semibold">
                    <th className="p-2.5 border border-warm-grey font-mono">Storage Key</th>
                    <th className="p-2.5 border border-warm-grey">Purpose &amp; Description</th>
                    <th className="p-2.5 border border-warm-grey font-mono">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-grey">
                  <tr>
                    <td className="p-2.5 border border-warm-grey font-mono font-medium text-charcoal">campus_uncut_client_uuid</td>
                    <td className="p-2.5 border border-warm-grey">A randomly generated UUIDv4 created in the browser to identify your device for rating flows and session continuity without requiring password accounts.</td>
                    <td className="p-2.5 border border-warm-grey font-mono">Persistent until cleared</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border border-warm-grey font-mono font-medium text-charcoal">campus_uncut_declared_college_id</td>
                    <td className="p-2.5 border border-warm-grey">Stores the ID of the college you have declared affiliation with.</td>
                    <td className="p-2.5 border border-warm-grey font-mono">Persistent until cleared</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border border-warm-grey font-mono font-medium text-charcoal">campus_uncut_respondent_id</td>
                    <td className="p-2.5 border border-warm-grey">Stores your respondent record UUID returned from the backend after setup.</td>
                    <td className="p-2.5 border border-warm-grey font-mono">Persistent until cleared</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border border-warm-grey font-mono font-medium text-charcoal">campus_uncut_active_session_id</td>
                    <td className="p-2.5 border border-warm-grey">Tracks the UUID of an in-progress rating wizard so you can resume answering if interrupted. Cleared automatically upon submission or cancellation.</td>
                    <td className="p-2.5 border border-warm-grey font-mono">Session / Cleared on finish</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[12px]">
              You can clear these identifiers at any time by clearing your browser cache or resetting app data in your Android settings.
            </p>
          </div>
        </section>

        {/* Section 4: Microphone & Speech Recognition */}
        <section className="scroll-mt-20" id="microphone">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-xs text-olive font-semibold">04</span>
            <h2 className="font-serif text-2xl font-bold text-charcoal">
              Microphone Permissions &amp; Speech Recognition Processing
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-charcoal-muted leading-relaxed space-y-4">
            <p>
              Campus Uncut offers hands-free voice search on the homepage and a voice-guided rating wizard. Understanding how speech recognition operates is vital to your privacy:
            </p>

            <div className="p-4 rounded bg-olive-light/40 border border-olive/30 flex items-start gap-3">
              <Mic className="w-5 h-5 text-olive shrink-0 mt-0.5" />
              <div>
                <strong className="text-charcoal block mb-1">We Do Not Record or Store Audio Files</strong>
                <p>
                  Campus Uncut does not capture, store, or transmit raw audio recordings or sound waveforms to our backend servers or our database. At no point is a recording of your voice saved to our storage.
                </p>
              </div>
            </div>

            <h3 className="font-sans font-semibold text-charcoal text-sm pt-2">
              How Speech Recognition Is Handled on Android &amp; Web:
            </h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Android Application (<code className="font-mono text-[11px]">@capgo/capacitor-speech-recognition</code>):</strong> On Android, the app requests the standard <code className="font-mono text-[11px]">android.permission.RECORD_AUDIO</code> runtime permission. When you tap the microphone, audio is routed directly to the Android operating system&apos;s default Speech Recognition service (such as Google Speech Services or your device manufacturer&apos;s recognition engine).
              </li>
              <li>
                <strong>Local vs. Cloud Speech Processing:</strong> Depending on your Android OS version, device capabilities, installed offline language packs, and device settings, speech recognition may be processed locally on-device or streamed securely to Google&apos;s speech recognition servers. As a result, network connectivity errors (<code className="font-mono text-[11px]">NETWORK</code> or <code className="font-mono text-[11px]">SERVER_DISCONNECTED</code>) may occasionally occur if device-level speech services rely on a network connection.
              </li>
              <li>
                <strong>Web Browsers:</strong> On desktop or mobile browsers, voice queries utilize the browser&apos;s native Web Speech API (<code className="font-mono text-[11px]">SpeechRecognition</code> or <code className="font-mono text-[11px]">webkitSpeechRecognition</code>), which communicates with your browser vendor&apos;s speech engine (e.g. Google Chrome or Apple Safari).
              </li>
              <li>
                <strong>Text Hypotheses Only:</strong> Campus Uncut receives only the resulting text transcript strings (interim hypotheses and final sentences) returned by the operating system speech recognizer.
              </li>
              <li>
                <strong>Voluntary &amp; Optional:</strong> Microphone usage is entirely voluntary. Every feature in Campus Uncut—including search and rating evaluation—can be performed entirely through standard keyboard typing and button taps.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 5: AI Assistant & Third-Party LLM */}
        <section className="scroll-mt-20" id="assistant">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-xs text-olive font-semibold">05</span>
            <h2 className="font-serif text-2xl font-bold text-charcoal">
              Conversational AI Assistant &amp; Third-Party LLM Processing
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-charcoal-muted leading-relaxed space-y-3">
            <p>
              Campus Uncut features an interactive Campus Intelligence Assistant designed to answer prospective student queries about college placement statistics, curriculum quality, hostel conditions, and campus governance.
            </p>
            <div className="editorial-card p-4 sm:p-5 bg-card border border-warm-grey space-y-3">
              <div className="flex items-center gap-2 text-charcoal font-semibold text-sm">
                <Sparkles className="w-4 h-4 text-olive" />
                <span>Third-Party LLM Inference (Groq Cloud API)</span>
              </div>
              <p>
                When you interact with the assistant, user messages and recent conversational context (up to the last 6 message turns) are transmitted from our backend to <strong>Groq Inc.</strong> (<code className="font-mono text-[11px]">https://api.groq.com</code>) when the cloud AI provider is used to generate natural language replies using models such as LLaMA 3.3 70B Versatile.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li>
                  <strong>Transmitted Context &amp; Profile Separation:</strong> Campus Uncut does not intentionally attach separate respondent profile fields, institutional email addresses, or client UUIDs to Groq API requests. However, user messages and recent conversational context are transmitted to Groq when the cloud AI provider is used, and any personal information voluntarily included in a prompt or conversation could consequently be transmitted to the LLM provider.
                </li>
                <li>
                  <strong>User Prompt Guidance:</strong> Users should avoid including passwords, sensitive personal information, or confidential information in their AI prompts.
                </li>
                <li>
                  <strong>Transient Backend Processing:</strong> Conversation processing is transient in our backend and is not intentionally stored in Campus Uncut&apos;s persistent chat database, according to the current implementation.
                </li>
                <li>
                  <strong>AI Response Reporting Disclosures:</strong> When a user reports an AI assistant response, the following information is stored in the application&apos;s database:
                  <ul className="list-disc pl-5 mt-1.5 space-y-1 text-[11px]">
                    <li>The reported AI response text.</li>
                    <li>The selected report category.</li>
                    <li>Optional user notes.</li>
                    <li>A pseudonymous client UUID, where available.</li>
                    <li>The report submission timestamp.</li>
                  </ul>
                  This is separate from ordinary AI conversation history, which is not stored in our persistent database.
                </li>
                <li>
                  <strong>Approved Tool Specifications:</strong> The assistant accesses college information through read-only backend domain functions to query verified metrics. It cannot execute raw SQL queries or modify database records.
                </li>
                <li>
                  <strong>Deterministic Offline Fallback:</strong> If the cloud LLM provider is unavailable or unconfigured, the backend automatically activates an internal deterministic mock engine that generates answers locally without external network transmission.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 6: Database & Storage */}
        <section className="scroll-mt-20" id="database">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-xs text-olive font-semibold">06</span>
            <h2 className="font-serif text-2xl font-bold text-charcoal">
              Database Infrastructure &amp; Backend Storage
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-charcoal-muted leading-relaxed space-y-3">
            <p>
              Our persistent data storage is hosted on a managed PostgreSQL relational database provided by <strong>Supabase Inc.</strong>. All client data access is mediated through our hardened FastAPI backend.
            </p>
            <p>
              The following database tables store application state:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <code className="font-mono text-[11px] bg-warm-grey-light px-1 py-0.5 rounded text-charcoal">colleges</code>: Public directory of institutions, short codes, cities, states, and demo flags.
              </li>
              <li>
                <code className="font-mono text-[11px] bg-warm-grey-light px-1 py-0.5 rounded text-charcoal">people</code>: Respondent profiles containing <code className="font-mono text-[11px]">client_uuid</code>, chosen display name, declared college ID, affiliation, verified institutional email, and timestamps.
              </li>
              <li>
                <code className="font-mono text-[11px] bg-warm-grey-light px-1 py-0.5 rounded text-charcoal">parameters</code> &amp; <code className="font-mono text-[11px] bg-warm-grey-light px-1 py-0.5 rounded text-charcoal">question_bank</code>: Standardized evaluation metrics and guidance prompts.
              </li>
              <li>
                <code className="font-mono text-[11px] bg-warm-grey-light px-1 py-0.5 rounded text-charcoal">rating_sessions</code> &amp; <code className="font-mono text-[11px] bg-warm-grey-light px-1 py-0.5 rounded text-charcoal">rating_answers</code>: Numeric scores (1-10) and No-view flags for submitted evaluations.
              </li>
              <li>
                <code className="font-mono text-[11px] bg-warm-grey-light px-1 py-0.5 rounded text-charcoal">college_score_state</code>, <code className="font-mono text-[11px] bg-warm-grey-light px-1 py-0.5 rounded text-charcoal">score_contributions</code> &amp; <code className="font-mono text-[11px] bg-warm-grey-light px-1 py-0.5 rounded text-charcoal">score_events</code>: Transparent mathematical tracking of institutional score changes.
              </li>
              <li>
                <code className="font-mono text-[11px] bg-warm-grey-light px-1 py-0.5 rounded text-charcoal">search_events</code>: Truncated query strings, input modes, and visitor session IDs for platform search telemetry.
              </li>
              <li>
                <code className="font-mono text-[11px] bg-warm-grey-light px-1 py-0.5 rounded text-charcoal">ai_response_reports</code>: User-submitted reports flagging objectionable AI assistant responses, storing the reported response text, selected report category, optional user notes, pseudonymous client UUID (where available), and submission timestamp.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 7: Third-Party Services & Links */}
        <section className="scroll-mt-20" id="third-party">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-xs text-olive font-semibold">07</span>
            <h2 className="font-serif text-2xl font-bold text-charcoal">
              Third-Party Service Providers &amp; External Links
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-charcoal-muted leading-relaxed space-y-3">
            <p>
              We engage reputable cloud infrastructure vendors strictly to host and deliver our application. Each provider adheres to rigorous data security standards:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Supabase Inc.:</strong> Managed PostgreSQL database hosting in secure cloud data centers.
              </li>
              <li>
                <strong>Render Services Inc.:</strong> Cloud hosting infrastructure for our FastAPI application server.
              </li>
              <li>
                <strong>Vercel Inc.:</strong> Global CDN and edge hosting for our React/Vite web application.
              </li>
              <li>
                <strong>Groq Inc.:</strong> Cloud inference provider for natural language assistant queries.
              </li>
              <li>
                <strong>Google LLC:</strong> Provider of Google Speech Services (for Android voice recognition) and Google Fonts CDN for editorial typography.
              </li>
            </ul>
            <div className="editorial-card p-4 bg-card border border-warm-grey mt-3">
              <h4 className="font-semibold text-charcoal text-xs sm:text-sm mb-1.5 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-olive" />
                <span>External College Portals &amp; Official Links</span>
              </h4>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Campus Uncut provides links to official university websites, admissions portals, and verified third-party placement reports. When you click an external link, it opens in your native system browser (e.g., Google Chrome) with <code className="font-mono text-[11px]">rel=&quot;noopener noreferrer&quot;</code> on web, or via Android&apos;s system browser intent. Campus Uncut does not share your session, identity, or rating status with external college websites.
              </p>
            </div>
          </div>
        </section>

        {/* Section 8: Retention & Security */}
        <section className="scroll-mt-20" id="security">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-xs text-olive font-semibold">08</span>
            <h2 className="font-serif text-2xl font-bold text-charcoal">
              Data Retention &amp; Security Protections
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-charcoal-muted leading-relaxed space-y-3">
            <p>
              <strong>Data Retention:</strong> Submitted numerical ratings, associated institutional score contributions, and score audit logs are retained indefinitely. This is necessary to preserve the historical integrity, transparency, and statistical validity of institutional scores. Uncompleted or abandoned draft sessions may be periodically purged.
            </p>
            <p>
              <strong>Security Protections:</strong> We implement multi-layered safeguards to secure your data:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>TLS/HTTPS Transport Security:</strong> All communications between the mobile app, web frontend, and backend API require encrypted HTTPS. Cleartext traffic is strictly forbidden on Android (<code className="font-mono text-[11px]">android:usesCleartextTraffic=&quot;false&quot;</code>).
              </li>
              <li>
                <strong>Backup Extraction Protection:</strong> Android ADB data backup is explicitly disabled (<code className="font-mono text-[11px]">android:allowBackup=&quot;false&quot;</code>) to prevent unauthorized extraction of local storage identifiers from physical devices.
              </li>
              <li>
                <strong>Content Security Policy (CSP):</strong> A strict Content Security Policy is enforced in the web shell, restricting authorized script and network connection endpoints.
              </li>
              <li>
                <strong>SQL Injection Prevention:</strong> 100% of database interactions utilize parameterized query bindings (<code className="font-mono text-[11px]">$1, $2, ...</code>) with zero raw SQL string concatenation.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 9: Privacy Rights & Deletion */}
        <section className="scroll-mt-20" id="rights">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-xs text-olive font-semibold">09</span>
            <h2 className="font-serif text-2xl font-bold text-charcoal">
              Your Privacy Rights, Data Access &amp; Deletion
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-charcoal-muted leading-relaxed space-y-3">
            <p>
              We believe every contributor retains sovereignty over their information. You have the following rights:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Right to Access:</strong> You may request a summary of the respondent record and submitted ratings associated with your official college email or client UUID.
              </li>
              <li>
                <strong>Right to Correction:</strong> If your affiliation status or display alias is inaccurate, you may submit a request to correct this information.
              </li>
              <li>
                <strong>Right to Deletion:</strong> You may request the permanent deletion of your respondent profile and associated rating submissions. Upon verified request, we will remove your personal identifiers and recalculate the relevant college score state.
              </li>
              <li>
                <strong>Local Identifier Purge:</strong> You can independently delete your stored client UUID, active session, and declared college from your device at any time by clearing your browser&apos;s site data or resetting application storage in your Android settings.
              </li>
            </ul>
            <p>
              To exercise any of these rights, contact our Data Protection Contact at{" "}
              <a
                href="mailto:mathew.maxwell2021@gmail.com"
                className="text-olive hover:underline font-semibold text-charcoal"
              >
                {approvedContactEmail}
              </a>.
            </p>
          </div>
        </section>

        {/* Section 10: Children's Privacy */}
        <section className="scroll-mt-20" id="children">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-xs text-olive font-semibold">10</span>
            <h2 className="font-serif text-2xl font-bold text-charcoal">
              Children&apos;s Privacy
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-charcoal-muted leading-relaxed space-y-2">
            <p>
              Campus Uncut is an intelligence and rating platform intended for higher education applicants, undergraduate/postgraduate university students, and college alumni (typically ages 17 and older).
            </p>
            <p>
              We do not knowingly collect or solicit personal information from children under the age of 13 (or under 16 where applicable by regional law). If we become aware that a child under this age threshold has submitted personal information, we will take prompt steps to permanently delete such data from our records.
            </p>
          </div>
        </section>

        {/* Section 11: Official Contact */}
        <section className="scroll-mt-20" id="contact">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-xs text-olive font-semibold">11</span>
            <h2 className="font-serif text-2xl font-bold text-charcoal">
              Privacy and Data Protection Contact
            </h2>
          </div>
          <div className="editorial-card p-6 bg-card border border-warm-grey">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-olive-light border border-olive/30 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-olive" />
              </div>
              <div className="space-y-2">
                <h3 className="font-sans font-bold text-charcoal text-base">
                  Official Privacy &amp; Data Rights Channel
                </h3>
                <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                  For any questions regarding this Privacy Policy, our data handling practices, or to submit a formal request for <strong>data access</strong>, <strong>data correction</strong>, or <strong>data deletion</strong>, please contact:
                </p>
                <div className="pt-2">
                  <a
                    href="mailto:mathew.maxwell2021@gmail.com"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-warm-grey-light hover:bg-warm-grey border border-warm-grey-dark/40 font-mono text-xs sm:text-sm font-semibold text-charcoal transition-colors group"
                  >
                    <Mail className="w-4 h-4 text-olive group-hover:scale-105 transition-transform" />
                    <span>{approvedContactEmail}</span>
                  </a>
                </div>
                <p className="text-[11px] text-charcoal-muted pt-1">
                  We strive to respond to all legitimate privacy inquiries and verification requests within 30 business days.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 12: Changes to this Policy */}
        <section className="scroll-mt-20" id="updates">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-xs text-olive font-semibold">12</span>
            <h2 className="font-serif text-2xl font-bold text-charcoal">
              Policy Revisions &amp; Notifications
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-charcoal-muted leading-relaxed space-y-2">
            <p>
              As Campus Uncut evolves with additional campus intelligence capabilities, we may periodically update this Privacy Policy. Any material modifications will be reflected with an updated effective date at the top of this document. We encourage users to review this page periodically. Continued use of Campus Uncut after any revision constitutes acknowledgment of the updated terms.
            </p>
          </div>
        </section>
      </div>

      {/* Footer Back Button */}
      <div className="mt-14 pt-8 border-t border-warm-grey flex items-center justify-between">
        <button
          onClick={onBack}
          className="btn-primary flex items-center gap-2 text-xs sm:text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Campus Uncut</span>
        </button>

        <span className="text-xs font-mono text-charcoal-muted">
          WildCatter Ventures • Campus Uncut
        </span>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
