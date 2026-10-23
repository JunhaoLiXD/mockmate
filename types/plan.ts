/**
 * Structured interview plan produced by /api/plan and passed to the voice session.
 */

import type { CompanyStyle, InterviewMode, RubricCategory } from "./interview";
import type { RepositoryEvidence } from "./profile";

export type Difficulty = "warm-up" | "standard" | "deep-dive";

/** What a question is based on. Lets the UI show why it was asked. */
export type SourceRef =
  | { kind: "job-requirement"; skill: string }
  | { kind: "resume-claim"; projectName: string; claim: string }
  | { kind: "repository"; evidence: RepositoryEvidence }
  | { kind: "company-style"; note: string };

export interface RubricCriterion {
  category: RubricCategory;
  /** What a strong answer covers for this specific question. */
  strongSignal: string;
  /** What a weak or incomplete answer looks like. */
  weakSignal: string;
}

export interface InterviewQuestion {
  /** Stable within a plan, e.g. "q1". */
  id: string;
  prompt: string;
  targetedSkill: string;
  difficulty: Difficulty;
  rationale: string;
  sourceRefs: SourceRef[];
  rubric: RubricCriterion[];
  /** Hints for the voice agent on when and how to follow up. */
  followupHints: string[];
}

export interface InterviewPlan {
  mode: InterviewMode;
  companyStyle: CompanyStyle;
  durationMinutes: number;
  questions: InterviewQuestion[];
  coverageGoals: string[];
}
