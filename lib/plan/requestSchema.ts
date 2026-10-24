import { z } from "zod";
import { COMPANY_STYLES, INTERVIEW_MODES } from "@/types";
import type { PlanRequest } from "@/types";

/**
 * Validates the PlanRequest body. The browser sends back what /api/analyze returned, but it is
 * still untrusted: every field is type-checked and length-capped here.
 */

const short = z.string().trim().min(1).max(200);
const medium = z.string().trim().min(1).max(600);
const SHA = /^[0-9a-f]{40}$/;

export const evidenceSchema = z.object({
  repoUrl: z.string().regex(/^https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/),
  commitSha: z.string().regex(SHA),
  path: z.string().trim().min(1).max(300),
  lineRange: z.object({ start: z.number().int().positive(), end: z.number().int().positive() }).optional(),
  excerpt: z.string().max(800).optional(),
  observation: medium,
  confidence: z.enum(["high", "medium", "low"]),
});

export const modeValues = INTERVIEW_MODES.map((m) => m.value) as [PlanRequest["mode"], ...PlanRequest["mode"][]];
export const styleValues = COMPANY_STYLES.map((c) => c.value) as [PlanRequest["companyStyle"], ...PlanRequest["companyStyle"][]];

export const jobProfileSchema = z.object({
  companyStyle: z.enum(styleValues),
  roleTitle: short,
  companyName: short.optional(),
  requirements: z.array(z.object({ skill: short, importance: z.enum(["required", "preferred"]), source: medium })).max(20),
  prioritySkills: z.array(short).max(10),
});

export const candidateProfileSchema = z.object({
  skills: z.array(short).max(30),
  projects: z
    .array(
      z.object({
        name: short,
        summary: medium,
        claims: z.array(medium).max(10),
        repositoryEvidence: z.array(evidenceSchema).max(15),
      }),
    )
    .max(6),
  limitations: z.array(medium).max(10),
});

export const planRequestSchema = z.object({
  mode: z.enum(modeValues),
  companyStyle: z.enum(styleValues),
  durationMinutes: z.number().int().min(1).max(60),
  jobProfile: jobProfileSchema,
  candidateProfile: candidateProfileSchema,
  repository: z
    .object({
      repoUrl: z.string(),
      owner: short,
      name: short,
      defaultBranch: short,
      commitSha: z.string().regex(SHA),
      scope: z.enum(["selected-files", "readme-and-key-files", "readme-only", "none"]),
      inspectedFiles: z.array(z.object({ path: z.string().max(300), sizeBytes: z.number().int().nonnegative() })).max(20),
      skippedFileCount: z.number().int().nonnegative(),
      treeTruncated: z.boolean(),
    })
    .nullable(),
});

export type ValidPlanRequest = z.infer<typeof planRequestSchema>;
