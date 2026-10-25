import { z } from "zod";
import type { InterviewDuration, InterviewMode, RubricCategory } from "@/types";
import { CATEGORIES_BY_MODE } from "@/types";

/**
 * Planner output for /api/plan (strict Structured Outputs). Sources are referenced by the IDs the
 * server gave in the input (r1, c1, e1); the server maps them back to real data, so the model
 * cannot invent file paths or commits. Question IDs are assigned by the server.
 */

/**
 * Planned questions per interview length, asked after the self-introduction (which the
 * interviewer asks on its own and is not planned). The 15-minute counts follow the personas'
 * length options: 5 technical questions, or 3 behavioral ones because stories need more follow-ups.
 */
const QUESTION_COUNTS: Record<InterviewDuration, Record<InterviewMode, number>> = {
  5: { technical: 2, behavioral: 2 },
  15: { technical: 5, behavioral: 3 },
};

export function questionCountFor(durationMinutes: InterviewDuration, mode: InterviewMode): number {
  return QUESTION_COUNTS[durationMinutes][mode];
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
