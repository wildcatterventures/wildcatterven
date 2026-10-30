import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("Privacy Policy & Data Protection Verification", async (t) => {
  const approvedContactEmail = "mathew.maxwell2021@gmail.com";
  const privacyComponentPath = path.resolve(
    __dirname,
    "../../features/privacy/PrivacyPolicy.tsx"
  );
  const footerComponentPath = path.resolve(
    __dirname,
    "../../components/Footer.tsx"
  );
  const appComponentPath = path.resolve(__dirname, "../../App.tsx");
  const respondentSetupPath = path.resolve(
    __dirname,
    "../../features/rating/RespondentSetup.tsx"
  );

  await t.test("approved contact email is valid and present in PrivacyPolicy.tsx", () => {
    assert.ok(fs.existsSync(privacyComponentPath), "PrivacyPolicy.tsx must exist");
    const content = fs.readFileSync(privacyComponentPath, "utf-8");

    // Email address must match approved address
    assert.ok(
      content.includes(approvedContactEmail),
      `PrivacyPolicy.tsx must contain approved contact email ${approvedContactEmail}`
    );

    // Must contain clickable mailto link
    assert.ok(
      content.includes(`mailto:${approvedContactEmail}`),
      `PrivacyPolicy.tsx must contain mailto link for ${approvedContactEmail}`
    );

    // Must mention privacy rights: access, correction, deletion
    assert.ok(content.includes("data access"), "Must explicitly mention data access");
    assert.ok(content.includes("data correction"), "Must explicitly mention data correction");
    assert.ok(content.includes("data deletion"), "Must explicitly mention data deletion");
  });

  await t.test("voice recognition architecture is accurately described without false claims", () => {
    const content = fs.readFileSync(privacyComponentPath, "utf-8");

    // Verifies zero raw audio storage
    assert.ok(
      content.includes("We Do Not Record or Store Audio Files") ||
      content.includes("Zero Audio Storage"),
      "Must clearly state audio is not stored or recorded"
    );

    // Explains Android SpeechRecognizer and Google Speech Services
    assert.ok(
      content.includes("android.speech.SpeechRecognizer") ||
      content.includes("@capgo/capacitor-speech-recognition"),
      "Must reference the Android speech recognition framework"
    );

    // Explains local vs cloud processing
    assert.ok(
      content.includes("Google Speech Services") ||
      content.includes("speech recognition servers"),
      "Must accurately explain that Android speech services may route to cloud servers"
    );
  });

  await t.test("AI assistant and Groq LLM processing is documented accurately", () => {
    const content = fs.readFileSync(privacyComponentPath, "utf-8");

    assert.ok(
      content.includes("Groq") || content.includes("groq.com"),
      "Must identify Groq as the LLM provider"
    );

    // Verifies replacement of overly broad "No Account Identity Shared" statement
    assert.equal(
      content.includes("No Account Identity Shared"),
      false,
      "Must not include the overly broad 'No Account Identity Shared' statement"
    );

    // Verifies precise disclosure of profile and identifier handling
    assert.ok(
      content.includes("does not intentionally attach separate respondent profile fields") ||
      content.includes("institutional email addresses, or client UUIDs"),
      "Must disclose that separate respondent profile fields, institutional emails, or client UUIDs are not attached"
    );

    // Verifies disclosure of transmitted message context
    assert.ok(
      content.includes("user messages and recent conversational context are transmitted to Groq"),
      "Must disclose that user messages and recent conversational context are transmitted to Groq"
    );

    // Verifies warning against sensitive personal information
    assert.ok(
      content.includes("passwords, sensitive personal information, or confidential information"),
      "Must warn users to avoid including passwords or sensitive personal information in prompts"
    );

    // Verifies disclosure that voluntarily provided info could be transmitted
    assert.ok(
      content.includes("voluntarily included in a prompt or conversation could consequently be transmitted to the LLM provider"),
      "Must explain that personal info voluntarily included in prompts could be transmitted to the LLM provider"
    );

    // Verifies transient backend processing disclosure
    assert.ok(
      content.includes("transient in our backend and is not intentionally stored in Campus Uncut's persistent chat database") ||
      content.includes("transient in our backend"),
      "Must specify that conversation processing is transient and not intentionally stored in persistent chat database"
    );

    // Verifies AI response reporting disclosures
    assert.ok(
      content.includes("When a user reports an AI assistant response, the following information is stored in the application's database") ||
      content.includes("AI Response Reporting Disclosures"),
      "Must disclose the stored reporting fields for AI responses"
    );
    assert.ok(
      content.includes("The reported AI response text"),
      "Must disclose reported AI response text storage"
    );
    assert.ok(
      content.includes("The selected report category"),
      "Must disclose selected report category storage"
    );
    assert.ok(
      content.includes("Optional user notes"),
      "Must disclose optional user notes storage"
    );
    assert.ok(
      content.includes("A pseudonymous client UUID, where available"),
      "Must disclose pseudonymous client UUID storage"
    );
    assert.ok(
      content.includes("The report submission timestamp"),
      "Must disclose report submission timestamp storage"
    );
    assert.ok(
      content.includes("separate from ordinary AI conversation history"),
      "Must clarify reporting records are separate from ordinary AI conversation history"
    );
  });

  await t.test("route /privacy-policy is configured in App.tsx", () => {
    const content = fs.readFileSync(appComponentPath, "utf-8");
    assert.ok(
      content.includes("/privacy-policy"),
      "App.tsx must support the /privacy-policy route"
    );
    assert.ok(
      content.includes("PrivacyPolicy"),
      "App.tsx must render the PrivacyPolicy component"
    );
  });

  await t.test("Footer and RespondentSetup display approved privacy contact email", () => {
    const footerContent = fs.readFileSync(footerComponentPath, "utf-8");
    assert.ok(
      footerContent.includes(approvedContactEmail),
      `Footer must display approved contact email ${approvedContactEmail}`
    );
    assert.ok(
      footerContent.includes("privacy_policy"),
      "Footer must provide a navigation trigger to privacy_policy"
    );

    const setupContent = fs.readFileSync(respondentSetupPath, "utf-8");
    assert.ok(
      setupContent.includes(approvedContactEmail),
      `RespondentSetup must reference approved contact email ${approvedContactEmail}`
    );
  });
});
