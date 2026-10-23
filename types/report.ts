/**
 * Evidence-based report produced by /api/report (brief sections 4.3 and 7).
 * Qualitative feedback is required; numeric scores are optional and only present with evidence.
 */

import type { CompanyStyle, InterviewMode, RubricCategory } from "./interview";
import type { RepositoryEvidence } from "./profile";

/** Distinguishes "not shown" from "wrong" — never conclude a skill is missing from silence. */
export type EvidenceAssessment =
  | "demonstrated"
  | "partially-demonstrated"
  | "insufficient-evidence"
  | "not-assessed";

export interface TurnQuote {
  turnId: string;
  /** Exact words from that transcript turn. */
  quote: string;
}

export interface CategoryFeedback {
  category: RubricCategory;
  assessment: EvidenceAssessment;
  /** 1–5, only when the transcript gives enough evidence. */
  score?: number;
  /** The rubric line this category was judged against. */
  rubric: string;
  demonstrated: string;
  unclear: string;
  whyItMatters: string;
  suggestedExplanation: string;
  nextPracticeQuestion: string;
  evidenceTurnIds: string[];
  quotes: TurnQuote[];
  repositoryEvidence: RepositoryEvidence[];
  uncertainty: string;
}

export interface FeedbackItem {
  summary: string;
  evidenceTurnIds: string[];
  quotes: TurnQuote[];
  repositoryEvidence: RepositoryEvidence[];
}

export interface QuestionCoverage {
  questionId: string;
  targetedSkill: string;
  asked: boolean;
  followedUp: boolean;
}

export interface InterviewReport {
  mode: InterviewMode;
  companyStyle: CompanyStyle;
  /** ISO 8601. */
  generatedAt: string;
  categoryFeedback: CategoryFeedback[];
  strengths: FeedbackItem[];
  improvements: FeedbackItem[];
  recommendedPractice: string[];
  questionCoverage: QuestionCoverage[];
  /** Known limits of this report, e.g. incomplete transcription. */
  limitations: string[];
  disclaimer: string;
}
