import type { InterviewPlan, InterviewQuestion, SourceRef } from "@/types";
import type { PlanSources } from "./prompt";
import type { ValidPlanRequest } from "./requestSchema";
import type { PlanOutput } from "./schema";

/**
 * Turns planner output into an InterviewPlan. Source IDs are resolved against the lists the
 * server built from the request; unknown IDs are dropped. A question left with no real source
 * (company-style notes alone do not count) is removed, so every question stays traceable.
 */

function clip(text: string, max: number): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > max ? `${cleaned.slice(0, max - 1)}…` : cleaned;
}

function resolveSources(raw: PlanOutput["questions"][number]["sources"], sources: PlanSources): SourceRef[] {
  const refs: SourceRef[] = [];
  const seen = new Set<string>();
  for (const s of raw) {
    const key = `${s.kind}:${s.refId ?? s.note ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const id = s.refId?.trim().toLowerCase();
    if (s.kind === "job-requirement") {
      const r = sources.requirements.find((x) => x.id === id);
      if (r) refs.push({ kind: "job-requirement", skill: r.skill });
    } else if (s.kind === "resume-claim") {
      const c = sources.claims.find((x) => x.id === id);
      if (c) refs.push({ kind: "resume-claim", projectName: c.projectName, claim: c.claim });
    } else if (s.kind === "repository") {
      const e = sources.evidence.find((x) => x.id === id);
      if (e) refs.push({ kind: "repository", evidence: e.evidence });
    } else if (s.note) {
      refs.push({ kind: "company-style", note: clip(s.note, 200) });
    }
  }
  return refs;
}

export function buildInterviewPlan(
  request: ValidPlanRequest,
  output: PlanOutput,
  sources: PlanSources,
): { plan: InterviewPlan; droppedQuestions: number } {
  const questions: InterviewQuestion[] = [];
  let droppedQuestions = 0;

  for (const q of output.questions) {
    const sourceRefs = resolveSources(q.sources, sources);
    if (!sourceRefs.some((ref) => ref.kind !== "company-style")) {
      droppedQuestions += 1;
      continue;
    }
    questions.push({
      id: `q${questions.length + 1}`,
      prompt: clip(q.prompt, 400),
      targetedSkill: clip(q.targetedSkill, 80),
      difficulty: q.difficulty,
      rationale: clip(q.rationale, 300),
      sourceRefs,
      rubric: q.rubric.map((r) => ({ category: r.category, strongSignal: clip(r.strongSignal, 300), weakSignal: clip(r.weakSignal, 300) })),
      followupHints: q.followupHints.map((h) => clip(h, 200)).filter(Boolean),
    });
  }

  return {
    plan: {
      mode: request.mode,
      companyStyle: request.companyStyle,
      durationMinutes: request.durationMinutes,
      questions,
      coverageGoals: output.coverageGoals.map((g) => clip(g, 120)).filter(Boolean),
    },
    droppedQuestions,
  };
}
