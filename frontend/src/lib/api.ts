import type {
  CollegeDetail,
  CollegeRatingReport,
  CollegeSummary,
  CreateCollegeRequest,
} from "../types/college";
import type {
  CreateRespondentRequest,
  CreateSessionRequest,
  RatingAnswerResponse,
  RatingSessionDetail,
  RatingSessionResponse,
  RespondentResponse,
  SaveAnswerRequest,
  SubmitSessionResult,
} from "../types/rating";
import type {
  AssistantMessageRequest,
  AssistantMessageResponse,
  AssistantReportResponse,
  CreateAssistantReportRequest,
} from "../types/assistant";
import { getClientUUID } from "./storage.ts";

export interface HealthResponse {
  status: string;
  db: string;
  environment?: string;
}

export const PRODUCTION_API_BASE_URL = "https://campus-uncut.onrender.com";

const viteEnv = import.meta.env;

export function getApiBaseUrl(
  envOverride?: {
    PROD?: boolean;
    VITE_API_BASE_URL?: string;
  }
): string {
  const metaEnv = envOverride ?? viteEnv ?? {};
  const envUrl = (metaEnv.VITE_API_BASE_URL || "").trim();

  if (
    envUrl &&
    !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(envUrl)
  ) {
    return envUrl.replace(/\/+$/, "");
  }

  if (metaEnv.PROD) {
    return PRODUCTION_API_BASE_URL;
  }

  return envUrl
    ? envUrl.replace(/\/+$/, "")
    : "http://localhost:8000";
}

export const API_BASE_URL = getApiBaseUrl();

export function isBackendHealthy(res: any): boolean {
  return Boolean(
    res &&
      typeof res === "object" &&
      res.status === "ok" &&
      res.db === "connected"
  );
}

export class ApiError extends Error {
  status: number;
  detail: any;

  constructor(status: number, detail: any) {
    const message =
      typeof detail === "string"
        ? detail
        : detail?.message || (detail ? JSON.stringify(detail) : `HTTP Error ${status}`);
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const resolvedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${resolvedPath}`;

  if (viteEnv?.PROD && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(url)) {
    throw new ApiError(
      500,
      "Production build cannot call localhost. Ensure VITE_API_BASE_URL is configured with your production backend URL."
    );
  }

  let visitorId: string | undefined;
  try {
    if (typeof window !== "undefined") {
      visitorId = getClientUUID();
    }
  } catch {
    // ignore
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(visitorId ? { "X-Visitor-Session-ID": visitorId } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = (response.headers?.get?.("content-type") || "").toLowerCase();
  const isHtml = contentType.includes("text/html");

  if (!response.ok) {
    let errorDetail: any = `Request failed with status ${response.status}`;
    if (!isHtml) {
      try {
        const data = await response.json();
        errorDetail = data.detail || data;
      } catch {
        // response was not JSON
      }
    }
    throw new ApiError(response.status, errorDetail);
  }

  // Reject non-JSON responses (e.g. Vercel SPA index.html returned with HTTP 200)
  if (isHtml) {
    throw new ApiError(
      response.status,
      `Expected JSON response from backend but received HTML (${url}). Verify backend URL configuration.`
    );
  }

  try {
    return (await response.json()) as T;
  } catch (err: any) {
    throw new ApiError(
      response.status,
      `Failed to parse response as JSON from ${url}: ${err?.message || err}`
    );
  }
}

// ==========================================
// API CLIENT METHODS
// ==========================================

export const api = {
  // System Health
  async checkHealth(): Promise<HealthResponse> {
    return request<HealthResponse>("/health");
  },

  // Colleges
  async getColleges(query?: string, demo: boolean = true): Promise<CollegeSummary[]> {
    const params = new URLSearchParams();
    if (query?.trim()) {
      params.append("q", query.trim());
    }
    if (demo) {
      params.append("demo", "true");
    }
    const qs = params.toString();
    return request<CollegeSummary[]>(`/api/colleges${qs ? `?${qs}` : ""}`);
  },

  async getCollege(collegeId: string): Promise<CollegeDetail> {
    return request<CollegeDetail>(`/api/colleges/${collegeId}`);
  },

  async getCollegeRatings(collegeId: string): Promise<CollegeRatingReport> {
    return request<CollegeRatingReport>(`/api/colleges/${collegeId}/ratings`);
  },

  async createCollege(data: CreateCollegeRequest): Promise<CollegeDetail> {
    return request<CollegeDetail>("/api/colleges", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Respondents
  async createRespondent(data: CreateRespondentRequest): Promise<RespondentResponse> {
    return request<RespondentResponse>("/api/respondents", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Rating Sessions
  async createRatingSession(data: CreateSessionRequest): Promise<RatingSessionResponse> {
    return request<RatingSessionResponse>("/api/rating-sessions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getRatingSession(sessionId: string): Promise<RatingSessionDetail> {
    return request<RatingSessionDetail>(`/api/rating-sessions/${sessionId}`);
  },

  async saveAnswer(
    sessionId: string,
    parameterId: string,
    data: SaveAnswerRequest
  ): Promise<RatingAnswerResponse> {
    return request<RatingAnswerResponse>(
      `/api/rating-sessions/${sessionId}/answers/${parameterId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  },

  async submitRatingSession(sessionId: string): Promise<SubmitSessionResult> {
    return request<SubmitSessionResult>(`/api/rating-sessions/${sessionId}/submit`, {
      method: "POST",
    });
  },

  // Conversational Assistant
  async sendAssistantMessage(
    data: AssistantMessageRequest
  ): Promise<AssistantMessageResponse> {
    return request<AssistantMessageResponse>("/api/assistant/message", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async reportAssistantMessage(
    data: CreateAssistantReportRequest
  ): Promise<AssistantReportResponse> {
    return request<AssistantReportResponse>("/api/assistant/report", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
