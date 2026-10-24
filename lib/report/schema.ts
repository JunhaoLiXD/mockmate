import { z } from "zod";
import type { InterviewMode, RubricCategory } from "@/types";
import { CATEGORIES_BY_MODE } from "@/types";

/**
 * Evaluator output for /api/report (strict Structured Outputs). The model gives a level and
 * written feedback per dimension and cites turns (t-###) and evidence (e#). It never gives a
 * score or rubric text: the server derives both, and verifies every citation.
 */

const quote = z.object({
  turnId: z.string().describe("A candidate turn ID such as t-004."),
  quote: z.string().describe("The candidate's exact words from that single turn, a few words to one sentence."),
});

export function reportOutputSchema(mode: InterviewMode, questionIds: string[]) {
  const categories = CATEGORIES_BY_MODE[mode] as unknown as [RubricCategory, ...RubricCategory[]];
  return z.object({
    categories: z
      .array(
        z.object({
          category: z.enum(categories),
          level: z.enum(["strong", "medium", "weak", "insufficient-evidence"]),
          demonstrated: z.string().describe("What the candidate showed, citing the quotes."),
          unclear: z.string().describe("What the interview could not confirm, or where the answer stopped short."),
          whyItMatters: z.string().describe("Link to a specific requirement in the job description (cite r#)."),
          suggestedExplanation: z.string().describe("Advice on explaining it better next time. Not a model answer in the candidate's voice."),
          nextPracticeQuestion: z.string(),
          quotes: z.array(quote).max(3),
          evidenceIds: z.array(z.string()).max(3).describe("Code evidence IDs such as e2, only when the judgment involves project facts."),
          uncertainty: z.string().describe("Limits of this judgment, e.g. one short answer or possible transcription errors."),
        }),
      )
      .max(5),
    strengths: z
      .array(z.object({ summary: z.string(), quotes: z.array(quote).max(2), evidenceIds: z.array(z.string()).max(2) }))
      .max(3),
    improvements: z
      .array(z.object({ summary: z.string(), quotes: z.array(quote).max(2), evidenceIds: z.array(z.string()).max(2) }))
      .max(3),
    recommendedPractice: z.array(z.string()).max(4),
    questionCoverage: z
      .array(
        z.object({
          questionId: z.enum(questionIds as [string, ...string[]]),
          askedInTurnId: z.string().nullable().describe("The interviewer turn ID where this planned question was asked, or null."),
          followedUp: z.boolean(),
        }),
      )
      .max(8),
    limitations: z.array(z.string()).max(4),
  });
}

export type ReportOutput = z.infer<ReturnType<typeof reportOutputSchema>>;
