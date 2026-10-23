/**
 * Candidate, job and repository data produced by /api/analyze.
 */

import type { CompanyStyle } from "./interview";

export type Confidence = "high" | "medium" | "low";

/** One piece of code-level evidence. Always traceable to a real file at a pinned commit. */
export interface RepositoryEvidence {
  repoUrl: string;
  commitSha: string;
  path: string;
  /** 1-based inclusive line range, when known. */
  lineRange?: { start: number; end: number };
  excerpt?: string;
  observation: string;
  confidence: Confidence;
}

export interface InspectedFile {
  path: string;
  sizeBytes: number;
}

/**
 * How much of the repository was analyzed. The UI must show this so users know
 * what the AI actually read.
 */
export type RepositoryScope = "selected-files" | "readme-and-key-files" | "readme-only" | "none";

export interface RepositoryAnalysis {
  repoUrl: string;
  owner: string;
  name: string;
  defaultBranch: string;
  commitSha: string;
  scope: RepositoryScope;
  inspectedFiles: InspectedFile[];
  /** Files skipped because of type, size or limits (binaries, weights, vendor, etc.). */
  skippedFileCount: number;
  /** True when GitHub returned a truncated tree. */
  treeTruncated: boolean;
}

export interface CandidateProject {
  name: string;
  summary: string;
  /** Claims taken from the resume, in the candidate's own framing. */
  claims: string[];
  repositoryEvidence: RepositoryEvidence[];
}

export interface CandidateProfile {
  skills: string[];
  projects: CandidateProject[];
  /** What could not be determined, e.g. "Resume does not mention deployment experience". */
  limitations: string[];
}

export interface JobRequirement {
  skill: string;
  importance: "required" | "preferred";
  /** Short quote or paraphrase from the job description. */
  source: string;
}

export interface JobProfile {
  companyStyle: CompanyStyle;
  roleTitle: string;
  companyName?: string;
  requirements: JobRequirement[];
  prioritySkills: string[];
}
