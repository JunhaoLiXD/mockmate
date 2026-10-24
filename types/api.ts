/**
 * HTTP contract for app/api/* route handlers.
 *
 * The API is stateless (brief section 9.2): the server stores nothing between requests.
 * The browser keeps all interview data and sends what each step needs in the request body.
 * Every route returns either its success body (HTTP 200) or ApiErrorBody (HTTP 4xx/5xx).
 */

import type { CompanyStyle, InterviewMode } from "./interview";
import type { InterviewPlan } from "./plan";
import type { CandidateProfile, JobProfile, RepositoryAnalysis } from "./profile";
import type { InterviewReport } from "./report";
import type { TranscriptTurn } from "./transcript";

export const API_ROUTES = {
  analyze: "/api/analyze",
  plan: "/api/plan",
  session: "/api/session",
  report: "/api/report",
} as const;

/* ---------- Errors ---------- */

export type ApiErrorCode =
  | "INVALID_INPUT"
  | "INPUT_TOO_LARGE"
  | "UNSUPPORTED_FILE"
  | "INVALID_REPO_URL"
  | "REPO_NOT_FOUND"
  | "REPO_RATE_LIMITED"
  | "RATE_LIMITED"
  | "AI_DISABLED"
  | "VOICE_DISABLED"
  | "UPSTREAM_ERROR"
  | "INTERNAL_ERROR";

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    /** User-facing English message, safe to show as is. */
    message: string;
    /** Form field the error refers to, for inline validation messages. */
    field?: keyof AnalyzeFormFields | string;
    /** Present with RATE_LIMITED / REPO_RATE_LIMITED. */
    retryAfterSeconds?: number;
  };
}

/* ---------- POST /api/analyze ---------- */

/**
 * Sent as multipart/form-data so a resume PDF can be uploaded.
 * Provide exactly one of resumeText or resumeFile. repoUrl is optional; without it the
 * analysis falls back to resume + job description only.
 */
export interface AnalyzeFormFields {
  jobDescription: string;
  resumeText?: string;
  resumeFile?: File;
  repoUrl?: string;
  companyStyle: CompanyStyle;
  mode: InterviewMode;
}

export interface AnalyzeResponse {
  jobProfile: JobProfile;
  candidateProfile: CandidateProfile;
  /** null when no repoUrl was given or the repository could not be read. */
  repository: RepositoryAnalysis | null;
  /** Non-fatal issues to show the user, e.g. "README only: repository too large". */
  warnings: string[];
}

/* ---------- POST /api/plan ---------- */

export interface PlanRequest {
  mode: InterviewMode;
  companyStyle: CompanyStyle;
  durationMinutes: number;
  jobProfile: JobProfile;
  candidateProfile: CandidateProfile;
  repository: RepositoryAnalysis | null;
}

export interface PlanResponse {
  plan: InterviewPlan;
}

/* ---------- POST /api/session ---------- */

/**
 * Uses the Realtime "unified interface": the browser sends its WebRTC SDP offer here, the server
 * adds the interviewer instructions and session config, and returns OpenAI's SDP answer.
 * The browser never receives any OpenAI credential, not even a short-lived one.
 */
export interface SessionRequest {
  plan: InterviewPlan;
  /** WebRTC SDP offer from RTCPeerConnection.createOffer(). */
  sdp: string;
}

export interface SessionResponse {
  /** SDP answer to pass to RTCPeerConnection.setRemoteDescription(). */
  answerSdp: string;
  /** Hard limit the client must enforce by ending the call. */
  maxDurationSeconds: number;
}

/* ---------- POST /api/report ---------- */

export interface ReportRequest {
  plan: InterviewPlan;
  transcript: TranscriptTurn[];
  jobProfile: JobProfile;
  candidateProfile: CandidateProfile;
}

export interface ReportResponse {
  report: InterviewReport;
}
