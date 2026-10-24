import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";
import type { CompanyStyle, EvidenceAssessment, InterviewMode, RubricCategory } from "@/types";
import { CATEGORIES_BY_MODE, RUBRIC_CATEGORY_LABELS } from "@/types";

/**
 * Reads Lisa's rubrics (content/rubric-*.md) and the company styles' evaluation emphasis
 * (content/company-styles.md). Text is used as written. next.config.ts traces content/*.md
 * into /api/report so the files ship on Vercel.
 */

const cache = new Map<string, string>();

function read(fileName: string): string {
  const cached = cache.get(fileName);
  if (cached !== undefined) return cached;
  const text = readFileSync(path.join(process.cwd(), "content", fileName), "utf8");
  cache.set(fileName, text);
  return text;
}

const RUBRIC_FILES: Record<InterviewMode, string> = {
  technical: "rubric-technical.md",
  behavioral: "rubric-behavioral.md",
};

/** Drops the file's opening "> ..." notes, which are written for the team, not the model. */
function withoutTeamNotes(text: string): string {
  const lines = text.split("\n");
  const firstRule = lines.findIndex((line) => line.trim() === "---");
  if (firstRule === -1) return text;
  const header = lines.slice(0, firstRule).filter((line) => !line.startsWith(">"));
  return [...header, ...lines.slice(firstRule + 1)].join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** The rubric for the evaluator model, as written by Lisa. */
export function getRubricText(mode: InterviewMode): string {
  return withoutTeamNotes(read(RUBRIC_FILES[mode]));
}

export interface DimensionRubric {
  /** The dimension's question line, e.g. "Does the candidate weigh alternatives and costs?" */
  question: string;
  levels: Partial<Record<Exclude<EvidenceAssessment, "insufficient-evidence">, string>>;
}

const LEVEL_NAMES: Record<string, Exclude<EvidenceAssessment, "insufficient-evidence">> = {
  strong: "strong",
  medium: "medium",
  weak: "weak",
};

/** Parses "### 2.x <Dimension>" sections: the italic question line and the level table rows. */
export function getDimensionRubrics(mode: InterviewMode): Map<RubricCategory, DimensionRubric> {
  const result = new Map<RubricCategory, DimensionRubric>();
  const sections = read(RUBRIC_FILES[mode]).split(/^(?=### )/m);
  for (const category of CATEGORIES_BY_MODE[mode]) {
    const label = RUBRIC_CATEGORY_LABELS[category].toLowerCase();
    const section = sections.find((s) => {
      const heading = s.split("\n")[0].replace(/^###\s+[\d.]+\s*/, "").trim().toLowerCase();
      return heading === label;
    });
    if (!section) continue;
    const question = section.match(/^\*(.+)\*\s*$/m)?.[1].trim() ?? "";
    const levels: DimensionRubric["levels"] = {};
    for (const row of section.matchAll(/^\|\s*\*\*(Strong|Medium|Weak)\*\*\s*\|\s*(.+?)\s*\|\s*$/gm)) {
      // The report page shows plain text: drop Markdown emphasis markers, keep the wording.
      levels[LEVEL_NAMES[row[1].toLowerCase()]] = row[2].replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1");
    }
    result.set(category, { question, levels });
  }
  return result;
}

/** The "Evaluation emphasis" subsection of one company style, or "" when absent. */
export function getEvaluationEmphasis(style: CompanyStyle): string {
  const heading = style === "amazon-style" ? /^## \d+\. Amazon-style\b/ : /^## \d+\. General Tech\b/;
  const section = read("company-styles.md").split(/^(?=## )/m).find((s) => heading.test(s));
  if (!section) return "";
  const sub = section.split(/^(?=### )/m).find((s) => /^### [\d.]+ Evaluation emphasis\b/.test(s));
  return sub ? sub.replace(/^### [\d.]+ /, "").replace(/\n---\s*$/, "").trim() : "";
}
