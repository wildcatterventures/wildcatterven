export type CollegeCategory = 'engineering' | 'medical' | 'mba' | 'arts';

export interface CollegeSummary {
  college_id: string;
  name: string;
  short_code: string;
  city: string;
  state: string;
  category?: CollegeCategory | string;
  is_demo: boolean;
  current_score: number;
  total_submitted_sessions: number;
  current_student_submissions: number;
  alumni_submissions: number;
  email_domains?: string | null;
  created_at?: string;
}

export interface CollegeDetail extends CollegeSummary {
  total_qualifying_low: number;
  total_qualifying_neutral: number;
  total_qualifying_high: number;
  last_event_at?: string | null;
}

export interface ParameterDistribution {
  rating_score: number;
  frequency: number;
}

export interface ParameterRating {
  parameter_id: string;
  parameter_key: string;
  parameter_name: string;
  parameter_category: string;
  display_order: number;
  numeric_response_count: number;
  no_view_count: number;
  average_score: number | null;
  distributions: ParameterDistribution[];
}

export interface CollegeRatingReport {
  college_id: string;
  name: string;
  short_code: string;
  is_demo: boolean;
  current_score: number;
  total_submitted_sessions: number;
  current_student_submissions: number;
  alumni_submissions: number;
  parameters: ParameterRating[];
}

export interface CreateCollegeRequest {
  name: string;
  city: string;
  state: string;
  short_code?: string;
  email_domains?: string;
}
