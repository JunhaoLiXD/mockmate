/**
 * Mock API responses matching types/api.ts, plus a helper to simulate network latency.
 * Swap these for real fetch calls once /api routes are live (handoff H4).
 */

import type {
  AnalyzeResponse,
  ApiErrorBody,
  PlanResponse,
  ReportResponse,
  SessionResponse,
} from "@/types";
import { mockCandidateProfile, mockJobProfile, mockRepositoryAnalysis } from "./profile";
import { mockPlan } from "./plan";
import { mockReport } from "./report";

export const mockAnalyzeResponse: AnalyzeResponse = {
  jobProfile: mockJobProfile,
  candidateProfile: mockCandidateProfile,
  repository: mockRepositoryAnalysis,
  warnings: ["Skipped 1 model weight file (models/zero_dce/Epoch99.pth) and 4 images."],
};

export const mockPlanResponse: PlanResponse = { plan: mockPlan };

export const mockSessionResponse: SessionResponse = {
  answerSdp: "v=0\r\n(mock SDP answer)",
  maxDurationSeconds: 300,
};

export const mockReportResponse: ReportResponse = { report: mockReport };

/** Example errors for building error states. */
export const mockErrors = {
  repoNotFound: {
    error: { code: "REPO_NOT_FOUND", message: "We couldn't find that public GitHub repository. Check the URL and try again.", field: "repoUrl" },
  },
  jobDescriptionTooLong: {
    error: { code: "INPUT_TOO_LARGE", message: "The job description is longer than 10,000 characters.", field: "jobDescription" },
  },
  rateLimited: {
    error: { code: "RATE_LIMITED", message: "Too many requests. Please wait a few minutes and try again.", retryAfterSeconds: 300 },
  },
  aiDisabled: {
    error: { code: "AI_DISABLED", message: "The demo is temporarily paused. Please try again later." },
  },
} satisfies Record<string, ApiErrorBody>;

/** Resolves with `value` after `ms` milliseconds, to mimic a network call. */
export function mockDelay<T>(value: T, ms = 800): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
