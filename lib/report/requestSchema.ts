import { z } from "zod";
import { candidateProfileSchema, evidenceSchema, jobProfileSchema, modeValues, styleValues } from "@/lib/plan/requestSchema";

/**
 * Validates the ReportRequest body. Everything here comes from the browser and is untrusted:
 * types, lengths and enums are checked, and unknown keys are dropped.
 * Turn count and total transcript size are checked by the route first, to return 413.
 */

export const REPORT_LIMITS = {
  maxTurnChars: 4_000,
  maxTranscriptChars: 30_000,
  maxQuestions: 8,
} as const;

const short = z.string().trim().min(1).max(200);

const sourceRefSchema = z.union([
  z.object({ kind: z.literal("repository"), evidence: evidenceSchema }),
  z.object({ kind: z.literal("job-requirement"), skill: short }),
  z.object({ kind: z.literal("resume-claim"), projectName: short, claim: z.string().trim().min(1).max(600) }),
  z.object({ kind: z.literal("company-style"), note: z.string().trim().min(1).max(600) }),
]);

const planSchema = z.object({
  mode: z.enum(modeValues),
  companyStyle: z.enum(styleValues),
  durationMinutes: z.number().int().min(1).max(60),
  questions: z
    .array(
      z.object({
        id: z.string().regex(/^q\d{1,2}$/),
        prompt: z.string().trim().min(1).max(600),
        targetedSkill: short,
        sourceRefs: z.array(sourceRefSchema).max(6),
      }),
    )
    .min(1)
    .max(REPORT_LIMITS.maxQuestions),
});

const turnSchema = z.object({
  id: z.string().regex(/^t-\d{3}$/),
  speaker: z.enum(["user", "interviewer"]),
  text: z.string().max(REPORT_LIMITS.maxTurnChars),
  timestamp: z.string().max(40),
  questionId: z.string().max(20).optional(),
  isFinal: z.boolean(),
  interrupted: z.boolean().optional(),
  transcriptionConfidence: z.number().min(0).max(1).optional(),
});

export const reportRequestSchema = z.object({
  plan: planSchema,
  transcript: z.array(turnSchema).min(1),
  jobProfile: jobProfileSchema,
  candidateProfile: candidateProfileSchema,
});

export type ValidReportRequest = z.infer<typeof reportRequestSchema>;
export type ValidTurn = ValidReportRequest["transcript"][number];

/** Turn ids must be unique and strictly increasing (t-001, t-002, ...). */
export function turnsInOrder(turns: ValidTurn[]): boolean {
  let previous = 0;
  for (const turn of turns) {
    const n = Number(turn.id.slice(2));
    if (n <= previous) return false;
    previous = n;
  }
  return true;
}

/** A complete candidate answer: final, and at least three words ("I don't know" counts, "hi" does not). */
export function isCompleteAnswer(turn: ValidTurn): boolean {
  return turn.speaker === "user" && turn.isFinal && turn.text.trim().split(/\s+/).filter(Boolean).length >= 3;
}
