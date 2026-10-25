const CLIENT_UUID_KEY = "campus_uncut_client_uuid";
const DECLARED_COLLEGE_KEY = "campus_uncut_declared_college_id";
const RESPONDENT_ID_KEY = "campus_uncut_respondent_id";
const ACTIVE_SESSION_KEY = "campus_uncut_active_session_id";

/**
 * Get or generate persistent client UUID for prototype respondent identification.
 */
export function getClientUUID(): string {
  let uuid = localStorage.getItem(CLIENT_UUID_KEY);
  if (!uuid) {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      uuid = crypto.randomUUID();
    } else {
      // Fallback RFC4122 v4 generator
      uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }
    localStorage.setItem(CLIENT_UUID_KEY, uuid);
  }
  return uuid;
}

export function getDeclaredCollegeId(): string | null {
  return localStorage.getItem(DECLARED_COLLEGE_KEY);
}

export function setDeclaredCollegeId(id: string): void {
  localStorage.setItem(DECLARED_COLLEGE_KEY, id);
}

export function getRespondentId(): string | null {
  return localStorage.getItem(RESPONDENT_ID_KEY);
}

export function setRespondentId(id: string): void {
  localStorage.setItem(RESPONDENT_ID_KEY, id);
}

export function getActiveSessionId(): string | null {
  return localStorage.getItem(ACTIVE_SESSION_KEY);
}

export function setActiveSessionId(id: string | null): void {
  if (id) {
    localStorage.setItem(ACTIVE_SESSION_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  }
}
