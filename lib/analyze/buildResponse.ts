import type {
  AnalyzeResponse,
  CandidateProject,
  CompanyStyle,
  RepositoryAnalysis,
  RepositoryEvidence,
} from "@/types";
import type { RepositoryFile } from "@/lib/github/repository";
import type { AnalysisOutput } from "./schema";

/**
 * Turns the planner output into the AnalyzeResponse contract and verifies every repository
 * citation against the files the server actually fetched (brief sections 4.3 and 5.1):
 * - unknown paths are dropped,
 * - excerpts that are not verbatim in the file are removed,
 * - line ranges come from where the excerpt really is, never from the model,
 * - repoUrl and commitSha always come from the GitHub fetch.
 */

const MAX_TEXT = 400;
const MAX_EXCERPT = 600;

function clip(text: string, max = MAX_TEXT): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > max ? `${cleaned.slice(0, max - 1)}…` : cleaned;
}

function clipList(items: string[], max = MAX_TEXT): string[] {
  return items.map((item) => clip(item, max)).filter(Boolean);
}

const normalize = (text: string) => text.replace(/\s+/g, " ").trim();

/** Finds the 1-based line range of a verbatim excerpt, or null if it is not in the file. */
export function locateExcerpt(content: string, excerpt: string): { start: number; end: number } | null {
  const excerptLines = excerpt.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (excerptLines.length === 0) return null;
  if (!normalize(content).includes(normalize(excerpt))) return null;

  const fileLines = content.split(/\r?\n/).map((l) => l.trim());
  for (let i = 0; i < fileLines.length; i += 1) {
    if (!fileLines[i].includes(excerptLines[0])) continue;
    let line = i;
    let matched = true;
    for (let j = 1; j < excerptLines.length; j += 1) {
      line += 1;
      while (line < fileLines.length && fileLines[line] === "") line += 1;
      if (line >= fileLines.length || !fileLines[line].includes(excerptLines[j])) {
        matched = false;
        break;
      }
    }
    if (matched) return { start: i + 1, end: line + 1 };
  }
  return null;
}

export function buildAnalyzeResponse(args: {
  output: AnalysisOutput;
  companyStyle: CompanyStyle;
  repository: { analysis: RepositoryAnalysis; files: RepositoryFile[] } | null;
  warnings: string[];
}): AnalyzeResponse {
  const { output, companyStyle, repository } = args;
  const warnings = [...args.warnings];

  const projects: CandidateProject[] = output.candidate.projects.map((p) => ({
    name: clip(p.name, 120),
    summary: clip(p.summary),
    claims: clipList(p.claims),
    repositoryEvidence: [],
  }));

  if (repository) {
    const filesByPath = new Map(repository.files.map((f) => [f.path, f]));
    let dropped = 0;
    const seen = new Set<string>();

    for (const item of output.repositoryEvidence) {
      const file = filesByPath.get(item.path.trim());
      if (!file) {
        dropped += 1;
        continue;
      }
      const evidence: RepositoryEvidence = {
        repoUrl: repository.analysis.repoUrl,
        commitSha: repository.analysis.commitSha,
        path: file.path,
        observation: clip(item.observation),
        confidence: item.confidence,
      };
      if (item.excerpt) {
        const range = locateExcerpt(file.content, item.excerpt);
        if (range) {
          evidence.lineRange = range;
          evidence.excerpt = item.excerpt.trim().slice(0, MAX_EXCERPT);
        } else if (evidence.confidence === "high") {
          evidence.confidence = "medium";
        }
      }
      const key = `${evidence.path}|${evidence.observation}`;
      if (seen.has(key)) continue;
      seen.add(key);

      // Attach to the named project; otherwise to the project that best matches the repository name.
      const byName = projects.find((p) => item.projectName && p.name.toLowerCase() === item.projectName.trim().toLowerCase());
      let target = byName ?? projects.find((p) => p.name.toLowerCase().includes(repository.analysis.name.toLowerCase())) ?? projects[0];
      if (!target) {
        target = { name: repository.analysis.name, summary: "Public GitHub repository provided by the candidate.", claims: [], repositoryEvidence: [] };
        projects.push(target);
      }
      target.repositoryEvidence.push(evidence);
    }

    if (dropped > 0) warnings.push(`${dropped} repository citation(s) referred to files that were not inspected and were removed.`);
  }

  return {
    jobProfile: {
      companyStyle,
      roleTitle: clip(output.job.roleTitle, 120) || "Unknown role",
      ...(output.job.companyName ? { companyName: clip(output.job.companyName, 120) } : {}),
      requirements: output.job.requirements.map((r) => ({
        skill: clip(r.skill, 80),
        importance: r.importance,
        source: clip(r.source),
      })),
      prioritySkills: clipList(output.job.prioritySkills, 80),
    },
    candidateProfile: {
      skills: clipList(output.candidate.skills, 80),
      projects,
      limitations: clipList(output.candidate.limitations),
    },
    repository: repository?.analysis ?? null,
    warnings,
  };
}
