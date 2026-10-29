import { Capacitor } from "@capacitor/core";

export interface UrlValidationResult {
  isValid: boolean;
  sanitizedUrl: string;
  error?: string;
}

/**
 * Validates and normalizes an external URL.
 * Only HTTP and HTTPS protocols are permitted. Dangerous schemes (javascript:,
 * data:, vbscript:, file:) and invalid domains are rejected.
 */
export function sanitizeExternalUrl(rawUrl: string | null | undefined): UrlValidationResult {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { isValid: false, sanitizedUrl: "", error: "URL is empty or undefined" };
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { isValid: false, sanitizedUrl: "", error: "URL contains only whitespace" };
  }

  // Reject explicitly dangerous pseudo-protocols
  const lowercase = trimmed.toLowerCase();
  if (
    lowercase.startsWith("javascript:") ||
    lowercase.startsWith("data:") ||
    lowercase.startsWith("vbscript:") ||
    lowercase.startsWith("file:")
  ) {
    return { isValid: false, sanitizedUrl: "", error: "Unsafe URL scheme detected" };
  }

  // Prepend https:// if no scheme is provided
  let normalized = trimmed;
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { isValid: false, sanitizedUrl: "", error: `Unsupported protocol: ${parsed.protocol}` };
    }

    if (!parsed.hostname || !parsed.hostname.includes(".")) {
      return { isValid: false, sanitizedUrl: "", error: "Invalid hostname" };
    }

    return { isValid: true, sanitizedUrl: parsed.toString() };
  } catch {
    return { isValid: false, sanitizedUrl: "", error: "Malformed URL syntax" };
  }
}

/**
 * Determines whether the app is executing inside a native Capacitor shell
 * (e.g. Android WebView).
 */
export function isNativePlatform(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Opens an external URL safely across both Desktop Web and Android Capacitor.
 *
 * In Capacitor Android WebView:
 *   Standard <a target="_blank"> links fail because Android WebView multi-window
 *   support is disabled by default. By navigating top-frame via window.location.href,
 *   Capacitor's BridgeWebViewClient.shouldOverrideUrlLoading catches the request,
 *   evaluates bridge.launchIntent(), and dispatches an Intent(Intent.ACTION_VIEW, url)
 *   to the Android system browser (Chrome) while keeping Campus Uncut alive in the
 *   background.
 *
 * In Desktop / Web Browsers:
 *   Opens in a secure new tab via window.open(url, "_blank", "noopener,noreferrer")
 *   so the user never loses their Campus Uncut tab or application state.
 */
export function openExternalUrl(
  rawUrl: string,
  event?: React.MouseEvent | React.UIEvent | { preventDefault?: () => void; stopPropagation?: () => void }
): boolean {
  if (event && typeof event.preventDefault === "function") {
    event.preventDefault();
  }
  if (event && typeof event.stopPropagation === "function") {
    event.stopPropagation();
  }

  const { isValid, sanitizedUrl, error } = sanitizeExternalUrl(rawUrl);
  if (!isValid || !sanitizedUrl) {
    console.warn(`[Campus Uncut] Refusing to open invalid external link: "${rawUrl}". Reason: ${error}`);
    return false;
  }

  if (isNativePlatform()) {
    // Android / Native Capacitor: Top-frame navigation intercepted by BridgeWebViewClient -> Intent.ACTION_VIEW
    window.location.href = sanitizedUrl;
    return true;
  } else {
    // Desktop Web: Open in a secure new tab
    const win = window.open(sanitizedUrl, "_blank", "noopener,noreferrer");
    if (!win) {
      // Fallback in case popup was blocked
      window.location.assign(sanitizedUrl);
    }
    return true;
  }
}

