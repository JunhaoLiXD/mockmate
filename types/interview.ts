/**
 * Interview configuration shared by the intake form, planner, voice agent and report.
 */

export type InterviewMode = "technical" | "behavioral";

export type CompanyStyle = "general-tech" | "amazon-style";

export const INTERVIEW_MODES: ReadonlyArray<{ value: InterviewMode; label: string }> = [
  { value: "technical", label: "Technical" },
  { value: "behavioral", label: "Behavioral / HR" },
];

export const COMPANY_STYLES: ReadonlyArray<{ value: CompanyStyle; label: string }> = [
  { value: "general-tech", label: "General Tech" },
  { value: "amazon-style", label: "Amazon-style" },
];

/** Rubric categories for technical interviews (brief section 7). */
export type TechnicalCategory =
  | "accuracy"
  | "depth"
  | "implementation-understanding"
  | "trade-off-reasoning"
  | "clarity";

/** Rubric categories for behavioral interviews (brief section 7). */
export type BehavioralCategory =
  | "relevance"
  | "specificity"
  | "ownership"
  | "actions-results"
  | "clarity";

export type RubricCategory = TechnicalCategory | BehavioralCategory;

export const RUBRIC_CATEGORY_LABELS: Record<RubricCategory, string> = {
  accuracy: "Accuracy",
  depth: "Depth",
  "implementation-understanding": "Implementation Understanding",
  "trade-off-reasoning": "Trade-off Reasoning",
  clarity: "Clarity",
  relevance: "Relevance",
  specificity: "Specificity",
  ownership: "Ownership",
  "actions-results": "Actions / Results",
};

export const CATEGORIES_BY_MODE: Record<InterviewMode, ReadonlyArray<RubricCategory>> = {
  technical: ["accuracy", "depth", "implementation-understanding", "trade-off-reasoning", "clarity"],
  behavioral: ["relevance", "specificity", "ownership", "actions-results", "clarity"],
};

/** Fixed disclaimers that must be shown in the UI (brief sections 6, 7, 17.2). */
export const PRACTICE_DISCLAIMER =
  "Practice feedback only — not an employer evaluation or hiring prediction.";

export const COMPANY_STYLE_DISCLAIMER =
  "Unofficial company-style practice; not affiliated with or endorsed by the named companies.";
