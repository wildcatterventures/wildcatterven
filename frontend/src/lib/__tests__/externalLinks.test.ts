import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { Capacitor } from "@capacitor/core";
import { sanitizeExternalUrl, openExternalUrl } from "../externalLinks.ts";
import { INSTITUTIONAL_DOSSIERS, COLLEGE_RECRUITERS } from "../../features/colleges/collegeDossierData.ts";

describe("External Link Sanitation & Safety (sanitizeExternalUrl)", () => {
  it("rejects null, undefined, empty strings, and whitespace", () => {
    assert.equal(sanitizeExternalUrl(null as any).isValid, false);
    assert.equal(sanitizeExternalUrl(undefined as any).isValid, false);
    assert.equal(sanitizeExternalUrl("").isValid, false);
    assert.equal(sanitizeExternalUrl("   ").isValid, false);
    assert.equal(sanitizeExternalUrl("\t\n  ").isValid, false);
  });

  it("strictly rejects dangerous schemes like javascript:, data:, file:, vbscript:", () => {
    assert.equal(sanitizeExternalUrl("javascript:alert(1)").isValid, false);
    assert.equal(sanitizeExternalUrl("JAVASCRIPT:alert(document.cookie)").isValid, false);
    assert.equal(sanitizeExternalUrl("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==").isValid, false);
    assert.equal(sanitizeExternalUrl("file:///C:/Windows/System32").isValid, false);
    assert.equal(sanitizeExternalUrl("vbscript:MsgBox('x')").isValid, false);
  });

  it("normalizes URLs missing schemes by prepending https://", () => {
    const res = sanitizeExternalUrl("www.coeptech.ac.in/placement/");
    assert.equal(res.isValid, true);
    assert.equal(res.sanitizedUrl, "https://www.coeptech.ac.in/placement/");

    const res2 = sanitizeExternalUrl("pict.edu/placement/");
    assert.equal(res2.isValid, true);
    assert.equal(res2.sanitizedUrl, "https://pict.edu/placement/");
  });

  it("validates and preserves valid https and http URLs", () => {
    const resHttps = sanitizeExternalUrl("https://www.iitb.ac.in");
    assert.equal(resHttps.isValid, true);
    assert.equal(resHttps.sanitizedUrl, "https://www.iitb.ac.in/");

    const resHttp = sanitizeExternalUrl("http://example.com/test");
    assert.equal(resHttp.isValid, true);
    assert.equal(resHttp.sanitizedUrl, "http://example.com/test");
  });

  it("rejects malformed domains and incomplete hostnames", () => {
    assert.equal(sanitizeExternalUrl("https://").isValid, false);
    assert.equal(sanitizeExternalUrl("https://localhost").isValid, false);
    assert.equal(sanitizeExternalUrl("https://nodots").isValid, false);
  });
});

describe("Cross-Platform Navigation Dispatch (openExternalUrl)", () => {
  let originalWindow: any;
  let mockLocation: { href: string; assign: (url: string) => void };
  let openCalls: Array<{ url: string; target: string; features?: string }>;
  let origIsNative: () => boolean;

  beforeEach(() => {
    origIsNative = Capacitor.isNativePlatform;
    mockLocation = {
      href: "http://localhost:5173/",
      assign(url: string) {
        this.href = url;
      },
    };
    openCalls = [];

    originalWindow = globalThis.window;
    // Provide a mocked window environment
    (globalThis as any).window = {
      location: mockLocation,
      open: (url: string, target: string, features?: string) => {
        openCalls.push({ url, target, features });
        return { closed: false };
      },
    };
  });

  afterEach(() => {
    Capacitor.isNativePlatform = origIsNative;
    if (originalWindow !== undefined) {
      (globalThis as any).window = originalWindow;
    } else {
      delete (globalThis as any).window;
    }
  });

  it("opens in a new secure tab on Desktop Web", () => {
    Capacitor.isNativePlatform = () => false;

    let prevented = false;
    const fakeEvent = {
      preventDefault: () => {
        prevented = true;
      },
      stopPropagation: () => {},
    };

    const success = openExternalUrl("https://www.coeptech.ac.in", fakeEvent as any);
    assert.equal(success, true);
    assert.equal(prevented, true);
    assert.equal(openCalls.length, 1);
    assert.equal(openCalls[0].url, "https://www.coeptech.ac.in/");
    assert.equal(openCalls[0].target, "_blank");
    assert.equal(openCalls[0].features, "noopener,noreferrer");
  });

  it("navigates top-frame on Android Capacitor so BridgeWebViewClient intercepts it", () => {
    Capacitor.isNativePlatform = () => true;

    let prevented = false;
    let stopped = false;
    const fakeEvent = {
      preventDefault: () => {
        prevented = true;
      },
      stopPropagation: () => {
        stopped = true;
      },
    };

    const success = openExternalUrl("https://vit.edu.in/placement/", fakeEvent as any);
    assert.equal(success, true);
    assert.equal(prevented, true);
    assert.equal(stopped, true);
    // Crucial: window.open must NOT be called in native mode
    assert.equal(openCalls.length, 0);
    // window.location.href must be updated for shouldOverrideUrlLoading to trigger
    assert.equal(mockLocation.href, "https://vit.edu.in/placement/");
  });

  it("refuses to navigate or open invalid URLs", () => {
    const success = openExternalUrl("javascript:alert(1)");
    assert.equal(success, false);
    assert.equal(openCalls.length, 0);
    assert.equal(mockLocation.href, "http://localhost:5173/");
  });
});

describe("Institutional Dossier External URL Integrity", () => {
  it("verifies every registered college has valid, HTTPS external links", () => {
    const collegeCodes = Object.keys(INSTITUTIONAL_DOSSIERS);
    assert.ok(collegeCodes.length >= 8, "Expected at least 8 registered colleges");

    for (const code of collegeCodes) {
      const dossier = INSTITUTIONAL_DOSSIERS[code];
      assert.ok(dossier, `Dossier missing for ${code}`);

      // Official Website
      const siteRes = sanitizeExternalUrl(dossier.officialWebsite);
      assert.ok(
        siteRes.isValid,
        `Official website invalid for ${code}: ${dossier.officialWebsite} (${siteRes.error})`
      );
      assert.ok(
        siteRes.sanitizedUrl.startsWith("https://"),
        `Official website must use HTTPS for ${code}: ${dossier.officialWebsite}`
      );

      // Placement Summary Report URL
      const reportRes = sanitizeExternalUrl(dossier.placementSummary.reportUrl);
      assert.ok(
        reportRes.isValid,
        `Placement report URL invalid for ${code}: ${dossier.placementSummary.reportUrl} (${reportRes.error})`
      );
      assert.ok(
        reportRes.sanitizedUrl.startsWith("https://"),
        `Placement report must use HTTPS for ${code}: ${dossier.placementSummary.reportUrl}`
      );

      // Distinctive Features
      for (const feat of dossier.distinctiveFeatures) {
        const featRes = sanitizeExternalUrl(feat.sourceUrl);
        assert.ok(
          featRes.isValid,
          `Distinctive feature '${feat.title}' URL invalid for ${code}: ${feat.sourceUrl} (${featRes.error})`
        );
        assert.ok(
          featRes.sanitizedUrl.startsWith("https://"),
          `Distinctive feature URL must use HTTPS for ${code}: ${feat.sourceUrl}`
        );
      }
    }
  });

  it("verifies all verified recruiters have valid HTTPS source report URLs", () => {
    const collegeCodes = Object.keys(COLLEGE_RECRUITERS);
    assert.ok(collegeCodes.length >= 8, "Expected recruiters for at least 8 colleges");

    for (const code of collegeCodes) {
      const recruiters = COLLEGE_RECRUITERS[code];
      for (const recruiter of recruiters) {
        const recRes = sanitizeExternalUrl(recruiter.sourceUrl);
        assert.ok(
          recRes.isValid,
          `Recruiter '${recruiter.name}' (${code}) has invalid sourceUrl: ${recruiter.sourceUrl} (${recRes.error})`
        );
        assert.ok(
          recRes.sanitizedUrl.startsWith("https://"),
          `Recruiter sourceUrl must use HTTPS for ${recruiter.name} (${code}): ${recruiter.sourceUrl}`
        );
      }
    }
  });
});
