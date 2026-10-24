/**
 * Evidence-based report produced by /api/report (brief sections 4.3 and 7).
 * Levels and scores follow Lisa's rubrics (content/rubric-technical.md, content/rubric-behavioral.md).
 * Qualitative feedback is required; a score exists only for levels that are backed by evidence.
 */

import type { CompanyStyle, InterviewMode, RubricCategory } from "./interview";
import type { RepositoryEvidence } from "./profile";

/**
 * Rubric level for one dimension. "insufficient-evidence" means the interview never gave the
 * candidate a chance to show it: never treat silence as "weak".
 */
export type EvidenceAssessment = "strong" | "medium" | "weak" | "insufficient-evidence";

/** All levels, strongest first. */
export const RUBRIC_LEVELS: ReadonlyArray<EvidenceAssessment> = ["strong", "medium", "weak", "insufficient-evidence"];

export const RUBRIC_LEVEL_LABELS: Record<EvidenceAssessment, string> = {
  strong: "Strong",
  medium: "Medium",
  weak: "Weak",
  "insufficient-evidence": "Insufficient evidence",
};

/** Score for each level (rubric section 1, rule 7). No number for insufficient evidence. */
export const RUBRIC_LEVEL_SCORES: Record<EvidenceAssessment, 1 | 2 | 3 | null> = {
  strong: 3,
  medium: 2,
  weak: 1,
  "insufficient-evidence": null,
};

/** Highest rubric score. A practice score maps a score to 0–100 as (score − 1) × 50. */
export const RUBRIC_MAX_SCORE = 3;

export interface TurnQuote {
  turnId: string;
  /** Exact words from that transcript turn. */
  quote: string;
}

export interface CategoryFeedback {
  category: RubricCategory;
  assessment: EvidenceAssessment;
  /**
   * 1–3, always equal to RUBRIC_LEVEL_SCORES[assessment]; absent for "insufficient-evidence".
   * Set by the server from the level, never chosen separately by the model.
   */
  score?: 1 | 2 | 3;
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
