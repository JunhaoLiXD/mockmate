import { z } from "zod";

/**
 * What the planner model returns for /api/analyze. Strict Structured Outputs: every field is
 * required, optional values are nullable. repoUrl and commitSha are NOT asked from the model;
 * the server attaches them from the GitHub fetch so they cannot be invented.
 */

const confidence = z.enum(["high", "medium", "low"]);

export const analysisOutputSchema = z.object({
  job: z.object({
    roleTitle: z.string().describe("Job title as written in the job description."),
    companyName: z.string().nullable().describe("Company name if the job description states it, otherwise null."),
    requirements: z
      .array(
        z.object({
          skill: z.string().describe("Short skill name, e.g. 'PyTorch' or 'Model deployment'."),
          importance: z.enum(["required", "preferred"]),
          source: z.string().describe("Short quote or close paraphrase from the job description."),
        }),
      )
      .max(12),
    prioritySkills: z.array(z.string()).max(6).describe("The skills this interview should focus on, most important first."),
  }),
  candidate: z.object({
    skills: z.array(z.string()).max(20).describe("Skills the resume claims."),
    projects: z
      .array(
        z.object({
          name: z.string(),
          summary: z.string().describe("One or two sentences, based only on the resume and inspected files."),
          claims: z.array(z.string()).max(6).describe("Specific claims from the resume, in the candidate's framing."),
        }),
      )
      .max(4),
    limitations: z
      .array(z.string())
      .max(6)
      .describe("What could not be determined from the inputs. Never state that the candidate lacks a skill."),
  }),
  repositoryEvidence: z
    .array(
      z.object({
        projectName: z.string().nullable().describe("Name of the candidate project this file belongs to, or null."),
        path: z.string().describe("Exact path of one inspected file, copied from the file list."),
        excerpt: z.string().nullable().describe("A short verbatim quote (one to six lines) from that file, or null."),
        observation: z.string().describe("What this file shows about the implementation, useful for interview questions."),
        confidence,
      }),
    )
    .max(12),
});

export type AnalysisOutput = z.infer<typeof analysisOutputSchema>;
