import { z } from "zod";
import type { InterviewMode, RubricCategory } from "@/types";
import { CATEGORIES_BY_MODE } from "@/types";

/**
 * Planner output for /api/plan (strict Structured Outputs). Sources are referenced by the IDs the
 * server gave in the input (r1, c1, e1); the server maps them back to real data, so the model
 * cannot invent file paths or commits. Question IDs are assigned by the server.
 */

/** Questions that fit the interview length, leaving time for a greeting and follow-ups. */
export function questionCountFor(durationMinutes: number): number {
  return Math.min(5, Math.max(2, Math.round(durationMinutes * 0.6)));
}

export function planOutputSchema(mode: InterviewMode, questionCount: number) {
  const categories = CATEGORIES_BY_MODE[mode] as unknown as [RubricCategory, ...RubricCategory[]];
  return z.object({
    coverageGoals: z.array(z.string()).max(5).describe("Skills or themes this interview should cover, in order."),
    questions: z
      .array(
        z.object({
          prompt: z.string().describe("The question exactly as the interviewer will say it. One question, at most two sentences."),
          targetedSkill: z.string(),
          difficulty: z.enum(["warm-up", "standard", "deep-dive"]),
          rationale: z.string().describe("One sentence: why this question fits this candidate and role."),
          sources: z
            .array(
              z.object({
                kind: z.enum(["job-requirement", "resume-claim", "repository", "company-style"]),
                refId: z.string().nullable().describe("ID from the input such as r2, c1 or e3. Null only for company-style."),
                note: z.string().nullable().describe("For company-style only: which style focus this follows. Otherwise null."),
              }),
            )
            .min(1)
            .max(4),
          rubric: z
            .array(
              z.object({
                category: z.enum(categories),
                strongSignal: z.string().describe("What a strong answer to this specific question covers."),
                weakSignal: z.string().describe("What a weak or incomplete answer looks like."),
              }),
            )
            .min(1)
            .max(3),
          followupHints: z.array(z.string()).min(1).max(3).describe("When and how to follow up, based on likely answers."),
        }),
      )
      .min(2)
      .max(questionCount),
  });
}

export type PlanOutput = z.infer<ReturnType<typeof planOutputSchema>>;
