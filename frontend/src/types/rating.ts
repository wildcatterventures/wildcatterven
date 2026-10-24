export type Affiliation = "current_student" | "alumnus";
export type SessionStatus = "in_progress" | "submitted" | "abandoned";
export type ScoreCategory = "low" | "neutral" | "high";

export interface CreateRespondentRequest {
  client_uuid: string;
  declared_college_id: string;
  affiliation: Affiliation;
  display_name?: string;
}

export interface RespondentResponse {
  id: string;
  client_uuid: string;
  declared_college_id: string;
  affiliation: Affiliation;
  display_name?: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface CreateSessionRequest {
  college_id: string;
  respondent_id: string;
}

export interface RatingAnswerResponse {
  id: string;
  session_id: string;
  parameter_id: string;
  score: number | null;
  is_no_view: boolean;
  updated_at: string;
}

export interface SaveAnswerRequest {
  score?: number | null;
  is_no_view: boolean;
}

export interface RatingSessionResponse {
  id: string;
  college_id: string;
  respondent_id: string;
  respondent_role: Affiliation;
  status: SessionStatus;
  is_demo: boolean;
  calculated_overall_rating: number | null;
  started_at: string;
  submitted_at?: string | null;
}

export interface RatingSessionDetail extends RatingSessionResponse {
  answers: RatingAnswerResponse[];
  total_active_parameters: number;
  answered_count: number;
  missing_parameter_ids: string[];
  is_complete: boolean;
}

export interface SubmitSessionResult {
  session_id: string;
  college_id: string;
  status: string;
  unrounded_overall_rating: number | null;
  category: ScoreCategory | null;
  score_contribution_inserted: boolean;
  threshold_block_triggered: number | null;
  score_delta: number | null;
  score_before: number;
  score_after: number;
  submitted_at: string;
  message: string;
}
