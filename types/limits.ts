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
  reportMaxTurns: 60,
} as const;

export const SESSION_LIMITS = {
  defaultDurationMinutes: 5,
} as const;

export const RATE_LIMITS = {
  windowMinutes: 10,
  voiceSessionsPerWindow: 3,
  analyzeOrPlanPerWindow: 5,
  reportsPerWindow: 5,
  globalVoiceSessionsPerDay: 150,
} as const;

/** Accepted GitHub repository URL shape: https://github.com/<owner>/<repo> */
export const GITHUB_REPO_URL_PATTERN = /^https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9._-]+\/?$/;
