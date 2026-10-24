import type { AnalyzeResponse, CompanyStyle, InterviewMode } from "@/types";
import { COMPANY_STYLES, GITHUB_REPO_URL_PATTERN, INPUT_LIMITS, INTERVIEW_MODES, RATE_LIMITS } from "@/types";
import { buildAnalyzeResponse } from "@/lib/analyze/buildResponse";
import { ANALYZE_INSTRUCTIONS, buildAnalyzeInput } from "@/lib/analyze/prompt";
import { analysisOutputSchema } from "@/lib/analyze/schema";
import { AiError, generateStructured } from "@/lib/ai/structured";
import { fetchRepository, GitHubError, type FetchedRepository } from "@/lib/github/repository";
import { parseResumePdf, ResumeFileError } from "@/lib/resume/parsePdf";
import { getServerEnv } from "@/lib/server/env";
import { apiError, getClientIp, hashIdentifier, isSameOrigin } from "@/lib/server/http";
import { checkRateLimit, releaseRateLimit } from "@/lib/server/rateLimit";

/**
 * POST /api/analyze — multipart form (AnalyzeFormFields) → AnalyzeResponse.
 * Reads the job description, the resume (PDF or pasted text) and an optional public GitHub
 * repository, then asks PLANNER_MODEL for structured profiles with traceable evidence.
 * Stateless: nothing is stored, and request content is never logged.
 */

export const maxDuration = 60;

/** PDF limit plus room for the text fields and multipart overhead. */
const MAX_BODY_BYTES = INPUT_LIMITS.resumePdfMaxBytes + 128 * 1024;
const WINDOW_MS = RATE_LIMITS.windowMinutes * 60 * 1000;
const AI_TIMEOUT_MS = 45_000;

function text(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request): Promise<Response> {
  const env = getServerEnv();
  if (!env.aiEnabled) return apiError(503, "AI_DISABLED", "The demo is temporarily paused. Please try again later.");
  if (!env.openaiApiKey || !env.plannerModel) {
    const missing = [!env.openaiApiKey && "OPENAI_API_KEY", !env.plannerModel && "PLANNER_MODEL"].filter(Boolean);
    console.error("[api/analyze] missing server configuration:", missing.join(", "));
    return apiError(500, "INTERNAL_ERROR", "Analysis is not configured on the server.");
  }
  if (!isSameOrigin(request)) return apiError(403, "INVALID_INPUT", "Requests must come from the MockMate site.");

  /* ---------- Read and validate the form (no paid calls yet) ---------- */

  if (!(request.headers.get("content-type") ?? "").startsWith("multipart/form-data")) {
    return apiError(400, "INVALID_INPUT", "Send the form as multipart/form-data.");
  }
  const declared = Number(request.headers.get("content-length") ?? "");
  if (!Number.isFinite(declared) || declared <= 0) {
    return apiError(400, "INVALID_INPUT", "The request is missing its size.");
  }
  if (declared > MAX_BODY_BYTES) return apiError(413, "INPUT_TOO_LARGE", "The upload is too large. The resume PDF must be 2 MB or smaller.");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return apiError(400, "INVALID_INPUT", "The form could not be read.");
  }

  const jobDescription = text(form, "jobDescription");
  if (!jobDescription) return apiError(400, "INVALID_INPUT", "Paste the job description.", { field: "jobDescription" });
  if (jobDescription.length > INPUT_LIMITS.jobDescriptionMaxChars) {
    return apiError(413, "INPUT_TOO_LARGE", "The job description can be at most 10,000 characters.", { field: "jobDescription" });
  }

  const mode = INTERVIEW_MODES.find((m) => m.value === text(form, "mode"))?.value as InterviewMode | undefined;
  if (!mode) return apiError(400, "INVALID_INPUT", "Choose an interview mode.", { field: "mode" });
  const companyStyle = COMPANY_STYLES.find((c) => c.value === text(form, "companyStyle"))?.value as CompanyStyle | undefined;
  if (!companyStyle) return apiError(400, "INVALID_INPUT", "Choose a company style.", { field: "companyStyle" });

  const repoUrl = text(form, "repoUrl");
  if (repoUrl && !GITHUB_REPO_URL_PATTERN.test(repoUrl)) {
    return apiError(400, "INVALID_REPO_URL", "Use a public repository URL like https://github.com/owner/repo.", { field: "repoUrl" });
  }

  const resumeTextField = text(form, "resumeText");
  const resumeFileField = form.get("resumeFile");
  const resumeFile = resumeFileField instanceof File && resumeFileField.size > 0 ? resumeFileField : null;
  if (resumeTextField && resumeFile) {
    return apiError(400, "INVALID_INPUT", "Upload a resume PDF or paste the text, not both.", { field: "resumeText" });
  }

  const warnings: string[] = [];
  let resumeText: string;
  if (resumeFile) {
    try {
      const parsed = await parseResumePdf(resumeFile);
      resumeText = parsed.text;
      if (parsed.truncated) warnings.push("Only the first 10,000 characters of the resume were used.");
    } catch (error) {
      if (error instanceof ResumeFileError) {
        const status = error.code === "INPUT_TOO_LARGE" ? 413 : error.code === "UNSUPPORTED_FILE" ? 415 : 400;
        return apiError(status, error.code, error.message, { field: "resumeFile" });
      }
      throw error;
    }
  } else if (resumeTextField) {
    if (resumeTextField.length > INPUT_LIMITS.resumeTextMaxChars) {
      return apiError(413, "INPUT_TOO_LARGE", "The pasted resume can be at most 10,000 characters.", { field: "resumeText" });
    }
    resumeText = resumeTextField;
  } else {
    return apiError(400, "INVALID_INPUT", "Upload a resume PDF or paste your resume.", { field: "resumeText" });
  }

  /* ---------- Rate limit, then the costly steps ---------- */

  const ip = getClientIp(request);
  const ipKey = `analyze:${ip}`;
  const limit = checkRateLimit(ipKey, RATE_LIMITS.analyzeOrPlanPerWindow, WINDOW_MS);
  if (!limit.allowed) {
    return apiError(429, "RATE_LIMITED", "You've run several analyses recently. Please wait a few minutes and try again.", {
      retryAfterSeconds: limit.retryAfterSeconds,
    });
  }

  let repository: FetchedRepository | null = null;
  if (repoUrl) {
    try {
      repository = await fetchRepository(repoUrl, env.githubToken);
      warnings.push(...repository.warnings);
    } catch (error) {
      if (!(error instanceof GitHubError)) throw error;
      // Fall back to resume + job description only (brief section 5.1, step 5).
      warnings.push(`${error.message} Questions will be based on your resume and the job description only.`);
    }
  }

  try {
    const output = await generateStructured({
      apiKey: env.openaiApiKey,
      model: env.plannerModel,
      name: "candidate_analysis",
      schema: analysisOutputSchema,
      instructions: ANALYZE_INSTRUCTIONS,
      input: buildAnalyzeInput({
        mode,
        companyStyle,
        jobDescription,
        resumeText,
        repository: repository
          ? { repoUrl: repository.analysis.repoUrl, commitSha: repository.analysis.commitSha, files: repository.files }
          : null,
      }),
      maxOutputTokens: 12_000,
      reasoningEffort: "low",
      safetyIdentifier: hashIdentifier(ip),
      timeoutMs: AI_TIMEOUT_MS,
    });

    const response: AnalyzeResponse = buildAnalyzeResponse({ output, companyStyle, repository, warnings });
    return Response.json(response);
  } catch (error) {
    releaseRateLimit(ipKey);
    if (error instanceof AiError) {
      if (error.kind === "timeout") return apiError(504, "UPSTREAM_ERROR", "The analysis took too long. Please try again.");
      if (error.kind === "refusal") return apiError(422, "INVALID_INPUT", "This input couldn't be analyzed. Please check the job description and resume.");
      return apiError(502, "UPSTREAM_ERROR", "The analysis service had a problem. Please try again.");
    }
    console.error("[api/analyze] unexpected error:", error instanceof Error ? error.name : "unknown");
    return apiError(500, "INTERNAL_ERROR", "Something went wrong. Please try again.");
  }
}
