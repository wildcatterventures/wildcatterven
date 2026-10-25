import type { CollegeSummary } from "../types/college";

export const DISALLOWED_FREE_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.in", "yahoo.co.uk",
  "ymail.com", "hotmail.com", "outlook.com", "live.com", "msn.com",
  "icloud.com", "me.com", "mac.com", "aol.com", "zoho.com", "zohomail.com",
  "proton.me", "protonmail.com", "mail.com", "gmx.com", "gmx.net",
  "yandex.com", "rediffmail.com", "fastmail.com", "tutanota.com", "inbox.com",
]);

export const DISALLOWED_DISPOSABLE_DOMAINS = new Set([
  "tempmail.com", "10minutemail.com", "mailinator.com", "guerrillamail.com",
  "yopmail.com", "trashmail.com", "sharklasers.com", "dispostable.com",
  "fakeinbox.com", "getairmail.com", "throwawaymail.com", "maildrop.cc",
  "test.com", "example.com", "domain.com", "xyz.com", "asdf.com", "foo.com",
  "temp-mail.org", "burnermail.io", "nada.ltd", "mohmal.com",
]);

export const VALID_ACADEMIC_TLD_SUFFIXES = [
  ".ac.in", ".edu.in", ".res.in", ".ernet.in", ".edu",
  ".ac.uk", ".edu.au", ".edu.sg", ".ac.nz", ".ac.za",
];

const BOGUS_USERNAMES = new Set([
  "test", "fake", "admin", "dummy", "placeholder", "none", "null", "asdf",
]);

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  domain?: string;
  isVerifiedMatch?: boolean;
}

/**
 * Validate college email structure, provider legitimacy, and cross-college domain match.
 */
export function validateCollegeEmail(
  rawEmail: string,
  selectedCollege?: CollegeSummary,
  allColleges: CollegeSummary[] = []
): EmailValidationResult {
  const email = rawEmail.trim().toLowerCase();

  if (!email) {
    return {
      isValid: false,
      error: "Official college email address is required.",
    };
  }

  // RFC basic pattern
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: "Please enter a valid, well-formed email address (e.g. name@college.ac.in).",
    };
  }

  const [username, domain] = email.split("@");

  // 1. Check for free public webmail providers
  if (
    DISALLOWED_FREE_DOMAINS.has(domain) ||
    Array.from(DISALLOWED_FREE_DOMAINS).some((freeDom) => domain.endsWith("." + freeDom))
  ) {
    return {
      isValid: false,
      domain,
      error: "Personal and public email providers (@gmail.com, @yahoo.com, @outlook.com, etc.) are strictly disallowed. Please use your official college-issued email ID.",
    };
  }

  // 2. Check for temporary / disposable email providers
  if (
    DISALLOWED_DISPOSABLE_DOMAINS.has(domain) ||
    Array.from(DISALLOWED_DISPOSABLE_DOMAINS).some((dispDom) => domain.endsWith("." + dispDom))
  ) {
    return {
      isValid: false,
      domain,
      error: "Temporary or disposable email addresses are strictly prohibited. Please provide your legitimate college email.",
    };
  }

  // 3. Check username
  if (username.length < 2 || BOGUS_USERNAMES.has(username)) {
    return {
      isValid: false,
      domain,
      error: "Please provide your legitimate personal college email ID, not a placeholder username.",
    };
  }

  if (!selectedCollege) {
    return { isValid: true, domain };
  }

  const declaredDomains = (selectedCollege.email_domains || "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  // If selected college has registered domains
  if (declaredDomains.length > 0) {
    const isMatch = declaredDomains.some(
      (d) => domain === d || domain.endsWith("." + d)
    );

    if (isMatch) {
      return {
        isValid: true,
        domain,
        isVerifiedMatch: true,
      };
    }

    // Check if entered email domain belongs to another known college
    for (const other of allColleges) {
      if (other.college_id === selectedCollege.college_id) continue;
      const otherDomains = (other.email_domains || "")
        .split(",")
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);

      if (otherDomains.some((d) => domain === d || domain.endsWith("." + d))) {
        return {
          isValid: false,
          domain,
          error: `College domain mismatch: Email address '@${domain}' belongs to ${other.name} (${other.short_code}). You cannot rate ${selectedCollege.name} using an email from ${other.name}.`,
        };
      }
    }

    const expectedHint = declaredDomains.map((d) => `@${d}`).join(" or ");
    return {
      isValid: false,
      domain,
      error: `College domain mismatch: Email domain '@${domain}' is not authorized for ${selectedCollege.name}. Please use your official college email (expected: ${expectedHint}).`,
    };
  }

  // If selected college does NOT have registered email_domains
  // Check if domain belongs to ANY other registered college
  for (const other of allColleges) {
    const otherDomains = (other.email_domains || "")
      .split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);

    if (otherDomains.some((d) => domain === d || domain.endsWith("." + d))) {
      return {
        isValid: false,
        domain,
        error: `College domain mismatch: Email address '@${domain}' belongs to ${other.name} (${other.short_code}). You cannot rate ${selectedCollege.name} using an email from ${other.name}.`,
      };
    }
  }

  // Must have an academic TLD
  const hasAcademicTld = VALID_ACADEMIC_TLD_SUFFIXES.some((suffix) => domain.endsWith(suffix));
  if (!hasAcademicTld) {
    return {
      isValid: false,
      domain,
      error: `Vague or non-institutional domain '@${domain}'. A valid college email must end with an academic extension (such as .ac.in, .edu, .edu.in) or match your college's official domain.`,
    };
  }

  return {
    isValid: true,
    domain,
    isVerifiedMatch: true,
  };
}
