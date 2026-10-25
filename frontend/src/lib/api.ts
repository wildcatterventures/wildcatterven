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
} from "../types/assistant";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

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
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail: any = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      errorDetail = data.detail || data;
    } catch {
      // response was not JSON
    }
    throw new ApiError(response.status, errorDetail);
  }

  return response.json() as Promise<T>;
}

// ==========================================
// API CLIENT METHODS
// ==========================================

export const api = {
  // System Health
  async checkHealth(): Promise<{ status: string; db: string; environment: string }> {
    return request<{ status: string; db: string; environment: string }>("/health");
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
};
