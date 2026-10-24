/** Server-only configuration. Never import this from client components. */
export interface ServerEnv {
  openaiApiKey: string | undefined;
  realtimeModel: string | undefined;
  transcribeModel: string | undefined;
  realtimeVoice: string;
  plannerModel: string | undefined;
  evaluatorModel: string | undefined;
  /** Fine-grained, read-only token for public repositories. Optional: without it GitHub allows 60 requests/hour. */
  githubToken: string | undefined;
  aiEnabled: boolean;
  voiceEnabled: boolean;
}

/** Kill switches default to off unless explicitly set to "true". */
function flag(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

function optional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function getServerEnv(): ServerEnv {
  return {
    openaiApiKey: optional(process.env.OPENAI_API_KEY),
    realtimeModel: optional(process.env.REALTIME_MODEL),
    transcribeModel: optional(process.env.TRANSCRIBE_MODEL),
    realtimeVoice: optional(process.env.REALTIME_VOICE) ?? "marin",
    plannerModel: optional(process.env.PLANNER_MODEL),
    evaluatorModel: optional(process.env.EVALUATOR_MODEL),
    githubToken: optional(process.env.GITHUB_TOKEN),
    aiEnabled: flag(process.env.AI_ENABLED),
    voiceEnabled: flag(process.env.VOICE_ENABLED),
  };
}
