import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";
import type { CompanyStyle, InterviewMode } from "@/types";

/**
 * Reads Lisa's content files (content/*.md) on the server. The text is used as written; only
 * placeholders are filled in by callers. next.config.ts lists content/*.md in
 * outputFileTracingIncludes so the files ship with the API routes on Vercel.
 */

const cache = new Map<string, string>();

function read(fileName: string): string {
  const cached = cache.get(fileName);
  if (cached !== undefined) return cached;
  const text = readFileSync(path.join(process.cwd(), "content", fileName), "utf8");
  cache.set(fileName, text);
  return text;
}

const PERSONA_FILES: Record<InterviewMode, string> = {
  technical: "interviewer-technical.md",
  behavioral: "interviewer-behavioral.md",
};

/**
 * Returns the persona text for the voice model. The file's opening "> ..." notes are written
 * for the team (owner, placeholders, naming) and are left out; the rest is used as written.
 */
export function getPersona(mode: InterviewMode): string {
  const text = read(PERSONA_FILES[mode]);
  const lines = text.split("\n");
  const firstRule = lines.findIndex((line) => line.trim() === "---");
  if (firstRule === -1) return text;
  const header = lines.slice(0, firstRule).filter((line) => !line.startsWith(">"));
  return [...header, ...lines.slice(firstRule + 1)].join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Top-level section headings in content/company-styles.md, one per style. */
export const STYLE_HEADINGS: Record<CompanyStyle, RegExp> = {
  tech: /^## \d+\. Tech Company\b/,
  business: /^## \d+\. Business Company\b/,
  entertainment: /^## \d+\. Entertainment Company\b/,
};

/**
 * Returns one style's section from content/company-styles.md, without its sources table
 * (URLs are for the team, not for the model).
 */
export function getCompanyStyleGuide(style: CompanyStyle): string {
  const sections = read("company-styles.md").split(/^(?=## )/m);
  const section = sections.find((s) => STYLE_HEADINGS[style].test(s));
  if (!section) throw new Error(`Company style section not found: ${style}`);
  return section
    .split(/^(?=### )/m)
    .filter((sub) => !/^### [\d.]+ Sources\b/.test(sub))
    .join("")
    .replace(/\n---\s*$/, "")
    .trim();
}

/** Demo repository for the sample details; content/demo/resume.txt features the same project. */
const DEMO_REPO_URL = "https://github.com/JunhaoLiXD/Biohub_Cell_Tracking";

export interface DemoSample {
  jobDescription: string;
  resumeText: string;
  repoUrl: string;
}

/**
 * Lisa's fictional demo inputs (content/demo/), used by "Try sample details" on the form.
 * Read with readFileSync, so the home page includes them in its prerendered HTML at build time.
 */
export function getDemoSample(): DemoSample {
  return {
    jobDescription: read("demo/job-description.txt").trim(),
    resumeText: read("demo/resume.txt").trim(),
    repoUrl: DEMO_REPO_URL,
  };
}
