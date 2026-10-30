export interface ChatMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  name?: string;
}

export interface ToolCallRecord {
  tool_name: string;
  arguments: Record<string, any>;
  result: Record<string, any>;
}

export interface AssistantMessageRequest {
  message: string;
  conversation_id?: string;
  client_uuid?: string;
  session_id?: string;
  history?: ChatMessage[];
}

export interface AssistantMessageResponse {
  reply: string;
  tool_calls: ToolCallRecord[];
  structured_payload?: {
    type: string;
    data: any;
  } | null;
  provider_used: string;
}

export type ReportReason =
  | "sexually_explicit"
  | "hate_or_harassment"
  | "violence_or_harm"
  | "inappropriate"
  | "other";

export interface CreateAssistantReportRequest {
  message_content: string;
  reason: ReportReason;
  user_notes?: string;
  client_uuid?: string;
}

export interface AssistantReportResponse {
  id: string;
  status: string;
  message: string;
}
