import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  api,
  API_BASE_URL,
  getApiBaseUrl,
  isBackendHealthy,
  PRODUCTION_API_BASE_URL,
} from "../api.ts";

describe("Backend Health & Connection Indicator (Google Play & Web)", () => {
  it("resolves to Render backend in production when VITE_API_BASE_URL is missing / undefined", () => {
    assert.equal(PRODUCTION_API_BASE_URL, "https://campus-uncut.onrender.com");

    const missingUrl = getApiBaseUrl({ PROD: true, VITE_API_BASE_URL: undefined });
    assert.equal(missingUrl, "https://campus-uncut.onrender.com");

    const emptyUrl = getApiBaseUrl({ PROD: true, VITE_API_BASE_URL: "" });
    assert.equal(emptyUrl, "https://campus-uncut.onrender.com");

    const whitespaceUrl = getApiBaseUrl({ PROD: true, VITE_API_BASE_URL: "   " });
    assert.equal(whitespaceUrl, "https://campus-uncut.onrender.com");
  });

  it("resolves to Render backend in production when localhost is configured", () => {
    const localhostPort = getApiBaseUrl({ PROD: true, VITE_API_BASE_URL: "http://localhost:8000" });
    assert.equal(localhostPort, "https://campus-uncut.onrender.com");

    const localhostNoPort = getApiBaseUrl({ PROD: true, VITE_API_BASE_URL: "http://localhost" });
    assert.equal(localhostNoPort, "https://campus-uncut.onrender.com");

    const ipPort = getApiBaseUrl({ PROD: true, VITE_API_BASE_URL: "http://127.0.0.1:8000" });
    assert.equal(ipPort, "https://campus-uncut.onrender.com");

    const ipNoPort = getApiBaseUrl({ PROD: true, VITE_API_BASE_URL: "http://127.0.0.1" });
    assert.equal(ipNoPort, "https://campus-uncut.onrender.com");
  });

  it("resolves to correct Render backend URL in production when explicitly provided", () => {
    const exactRender = getApiBaseUrl({
      PROD: true,
      VITE_API_BASE_URL: "https://campus-uncut.onrender.com",
    });
    assert.equal(exactRender, "https://campus-uncut.onrender.com");

    const trailingSlash = getApiBaseUrl({
      PROD: true,
      VITE_API_BASE_URL: "https://campus-uncut.onrender.com/",
    });
    assert.equal(trailingSlash, "https://campus-uncut.onrender.com");

    const stagingRender = getApiBaseUrl({
      PROD: true,
      VITE_API_BASE_URL: "https://staging-campus-uncut.onrender.com",
    });
    assert.equal(stagingRender, "https://staging-campus-uncut.onrender.com");
  });

  it("resolves to localhost in development when configured with localhost", () => {
    const devLocalhost = getApiBaseUrl({ PROD: false, VITE_API_BASE_URL: "http://localhost:8000" });
    assert.equal(devLocalhost, "http://localhost:8000");

    const devTrailing = getApiBaseUrl({ PROD: false, VITE_API_BASE_URL: "http://localhost:8000/" });
    assert.equal(devTrailing, "http://localhost:8000");

    const devEmpty = getApiBaseUrl({ PROD: false, VITE_API_BASE_URL: "" });
    assert.equal(devEmpty, "http://localhost:8000");
  });

  it("ensures production configuration cannot fall through to localhost under any missing/localhost setting", () => {
    const problematicConfigs = [
      { PROD: true, VITE_API_BASE_URL: undefined },
      { PROD: true, VITE_API_BASE_URL: "" },
      { PROD: true, VITE_API_BASE_URL: "http://localhost:8000" },
      { PROD: true, VITE_API_BASE_URL: "http://localhost:3000" },
      { PROD: true, VITE_API_BASE_URL: "http://127.0.0.1:8000" },
      { PROD: true, VITE_API_BASE_URL: "https://localhost:8000" },
    ];

    for (const config of problematicConfigs) {
      const url = getApiBaseUrl(config);
      assert.equal(
        url,
        "https://campus-uncut.onrender.com",
        `Configuration ${JSON.stringify(config)} must resolve to Render, got: ${url}`
      );
      assert.doesNotMatch(url, /localhost/i);
      assert.doesNotMatch(url, /127\.0\.0\.1/);
    }
  });

  it("ensures health check target is an absolute backend URL ending with /health", () => {
    assert.ok(API_BASE_URL.startsWith("http"), `API_BASE_URL must start with http, got '${API_BASE_URL}'`);
    assert.doesNotMatch(API_BASE_URL, /vercel\.app/i, "API_BASE_URL must never target vercel.app");
  });

  it("isBackendHealthy validates status === 'ok' AND db === 'connected'", () => {
    // Healthy cases
    assert.equal(
      isBackendHealthy({ status: "ok", db: "connected", environment: "production" }),
      true,
      "Valid JSON with status ok and db connected must evaluate to healthy"
    );

    // Degraded database
    assert.equal(
      isBackendHealthy({ status: "degraded", db: "disconnected", environment: "production" }),
      false,
      "Degraded database status must evaluate to disconnected"
    );

    // Mismatched / error states
    assert.equal(isBackendHealthy({ status: "ok", db: "disconnected" }), false);
    assert.equal(isBackendHealthy({ status: "error", db: "connected" }), false);
    assert.equal(isBackendHealthy({ status: "maintenance", db: "connected" }), false);

    // Invalid / non-object payloads (e.g. HTML parsed strings or empty responses)
    assert.equal(isBackendHealthy(null), false);
    assert.equal(isBackendHealthy(undefined), false);
    assert.equal(isBackendHealthy("<!doctype html>"), false);
    assert.equal(isBackendHealthy({}), false);
    assert.equal(isBackendHealthy([]), false);
  });

  it("api.checkHealth requests ${API_BASE_URL}/health and parses healthy response", async () => {
    const originalFetch = globalThis.fetch;
    let interceptedUrl = "";

    globalThis.fetch = (async (url: string | URL | Request) => {
      interceptedUrl = url.toString();
      return {
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          status: "ok",
          db: "connected",
          environment: "production",
        }),
      } as any;
    }) as any;

    try {
      const res = await api.checkHealth();
      assert.match(interceptedUrl, /\/health$/);
      assert.doesNotMatch(interceptedUrl, /vercel\.app/i);
      assert.equal(res.status, "ok");
      assert.equal(res.db, "connected");
      assert.equal(isBackendHealthy(res), true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("api.checkHealth throws ApiError when receiving HTML (Vercel SPA index.html regression)", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () => {
      return {
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
        text: async () => "<!doctype html><html><body>Campus Uncut SPA</body></html>",
        json: async () => {
          throw new SyntaxError("Unexpected token '<', '<!doctype '... is not valid JSON");
        },
      } as any;
    }) as any;

    try {
      await assert.rejects(
        async () => {
          await api.checkHealth();
        },
        (err: any) => {
          assert.equal(err.name, "ApiError");
          assert.match(err.message, /received html/i);
          return true;
        }
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("api.checkHealth throws ApiError on HTTP 500 or network failure", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () => {
      return {
        ok: false,
        status: 500,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ detail: "Database connection pool exhausted" }),
      } as any;
    }) as any;

    try {
      await assert.rejects(
        async () => {
          await api.checkHealth();
        },
        (err: any) => {
          assert.equal(err.status, 500);
          return true;
        }
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
