/**
 * Input and usage limits (brief section 5.3). The server enforces these; the UI may use
 * them for early validation and helpful messages.
 */

export const INPUT_LIMITS = {
  jobDescriptionMaxChars: 10_000,
  resumeTextMaxChars: 10_000,
  resumePdfMaxBytes: 2 * 1024 * 1024,
  resumePdfMaxPages: 5,
  resumeAcceptedMimeTypes: ["application/pdf"] as const,
  repoMaxFiles: 15,
  repoMaxFileBytes: 50 * 1024,
  repoMaxTotalBytes: 200 * 1024,
  /** Fits a 15-minute interview with many short turns; total text is capped separately. */
  reportMaxTurns: 150,
} as const;

/** Interview lengths a candidate can choose, in minutes. The personas cover exactly these options. */
export const INTERVIEW_DURATIONS = [5, 15] as const;
export type InterviewDuration = (typeof INTERVIEW_DURATIONS)[number];

export function isInterviewDuration(value: unknown): value is InterviewDuration {
  return INTERVIEW_DURATIONS.some((minutes) => minutes === value);
}

export const SESSION_LIMITS = {
  defaultDurationMinutes: 5,
  maxDurationMinutes: 15,
} as const;

/**
 * Voice limits count interview minutes, not sessions, so a 15-minute interview uses three times
 * the budget of a 5-minute one. Per IP: 15 minutes per window (three 5-minute interviews or one
 * 15-minute interview). Globally: 750 minutes per day, the same cost ceiling as 150 five-minute sessions.
 */
export const RATE_LIMITS = {
  windowMinutes: 10,
  voiceMinutesPerWindow: 15,
  analyzeOrPlanPerWindow: 5,
  reportsPerWindow: 5,
  globalVoiceMinutesPerDay: 750,
} as const;

/** Accepted GitHub repository URL shape: https://github.com/<owner>/<repo> */
export const GITHUB_REPO_URL_PATTERN = /^https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9._-]+\/?$/;
