/**
 * Interview configuration shared by the intake form, planner, voice agent and report.
 */

export type InterviewMode = "technical" | "behavioral";

/** Generic company types. The site never names a real company; see content/company-styles.md. */
export type CompanyStyle = "tech" | "business" | "entertainment";

export const INTERVIEW_MODES: ReadonlyArray<{ value: InterviewMode; label: string }> = [
  { value: "technical", label: "Technical" },
  { value: "behavioral", label: "Behavioral / HR" },
];

export const COMPANY_STYLES: ReadonlyArray<{ value: CompanyStyle; label: string }> = [
  { value: "tech", label: "Tech company" },
  { value: "business", label: "Business company" },
  { value: "entertainment", label: "Entertainment company" },
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
  "Practice styles based on public information about each industry; not affiliated with or endorsed by any company.";
