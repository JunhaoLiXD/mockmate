import type {
  CategoryFeedback,
  EvidenceAssessment,
  FeedbackItem,
  InterviewReport,
  QuestionCoverage,
  RepositoryEvidence,
  TurnQuote,
} from "@/types";
import { CATEGORIES_BY_MODE, PRACTICE_DISCLAIMER, RUBRIC_CATEGORY_LABELS, RUBRIC_LEVEL_SCORES } from "@/types";
import { countWords, locateQuote } from "./quotes";
import type { ValidReportRequest, ValidTurn } from "./requestSchema";
import type { DimensionRubric } from "./rubric";
import type { ReportOutput } from "./schema";

/**
 * Turns evaluator output into an InterviewReport and verifies every citation:
 * - a quote must be a candidate's complete turn and appear in it on word boundaries; the
 *   report keeps the transcript's own wording;
 * - Strong or Medium needs a verified quote of at least six words, Weak needs at least one
 *   verified quote; otherwise the dimension becomes "insufficient evidence";
 * - scores and rubric text come from the level and Lisa's rubric, never from the model;
 * - evidence and question IDs must exist; everything else is dropped.
 */

const MIN_SUPPORT_WORDS = 6;

export interface ReportSources {
  evidence: Array<{ id: string; evidence: RepositoryEvidence }>;
  requirements: Array<{ id: string; skill: string; source: string }>;
}

/** Numbers the code evidence (plan sources first, then profile evidence) and job requirements. */
export function collectReportSources(request: ValidReportRequest): ReportSources {
  const seen = new Set<string>();
  const evidence: ReportSources["evidence"] = [];
  const add = (ev: RepositoryEvidence) => {
    const key = `${ev.repoUrl}|${ev.commitSha}|${ev.path}|${ev.observation}`;
    if (seen.has(key)) return;
    seen.add(key);
    evidence.push({ id: `e${evidence.length + 1}`, evidence: ev });
  };
  for (const q of request.plan.questions) for (const ref of q.sourceRefs) if (ref.kind === "repository") add(ref.evidence);
  for (const project of request.candidateProfile.projects) for (const ev of project.repositoryEvidence) add(ev);
  return {
    evidence: evidence.slice(0, 20),
    requirements: request.jobProfile.requirements.map((r, i) => ({ id: `r${i + 1}`, skill: r.skill, source: r.source })),
  };
}

function clip(text: string, max = 600): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > max ? `${cleaned.slice(0, max - 1)}…` : cleaned;
}

/** Replaces leftover internal IDs (r#, e#) in model text with the requirement or file name. */
function readable(text: string, sources: ReportSources): string {
  return text
    .replace(/`?\b[rR](\d{1,2})\b`?/g, (match, n: string) => {
      const req = sources.requirements[Number(n) - 1];
      return req ? `"${req.skill}"` : match;
    })
    .replace(/`?\b[eE](\d{1,2})\b`?/g, (match, n: string) => {
      const ev = sources.evidence[Number(n) - 1];
      return ev ? ev.evidence.path.slice(ev.evidence.path.lastIndexOf("/") + 1) : match;
    });
}

interface VerifiedQuotes {
  quotes: TurnQuote[];
  dropped: number;
}

function verifyQuotes(raw: Array<{ turnId: string; quote: string }>, turns: Map<string, ValidTurn>): VerifiedQuotes {
  const quotes: TurnQuote[] = [];
  const seen = new Set<string>();
  let dropped = 0;
  for (const item of raw) {
    const turn = turns.get(item.turnId.trim());
    const match = turn && turn.speaker === "user" && turn.isFinal ? locateQuote(turn.text, item.quote) : null;
    if (!turn || !match) {
      dropped += 1;
      continue;
    }
    const key = `${turn.id}|${match.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    quotes.push({ turnId: turn.id, quote: match });
  }
  return { quotes, dropped };
}

function resolveEvidence(ids: string[], sources: ReportSources): RepositoryEvidence[] {
  const found: RepositoryEvidence[] = [];
  for (const id of ids) {
    const match = sources.evidence.find((e) => e.id === id.trim().toLowerCase());
    if (match && !found.includes(match.evidence)) found.push(match.evidence);
  }
  return found;
}

function supportsLevel(level: EvidenceAssessment, quotes: TurnQuote[]): boolean {
  if (level === "insufficient-evidence") return true;
  if (level === "weak") return quotes.length > 0;
  return quotes.some((q) => countWords(q.quote) >= MIN_SUPPORT_WORDS);
}

function uniqueTurnIds(quotes: TurnQuote[]): string[] {
  return [...new Set(quotes.map((q) => q.turnId))];
}

export function buildInterviewReport(args: {
  request: ValidReportRequest;
  output: ReportOutput;
  sources: ReportSources;
  rubrics: Map<CategoryFeedback["category"], DimensionRubric>;
  now?: Date;
}): InterviewReport {
  const { request, output, sources, rubrics } = args;
  const mode = request.plan.mode;
  /** Cleans and clips any text written by the model. */
  const text = (value: string, max = 600) => clip(readable(value, sources), max);
  const turns = new Map(request.transcript.map((t) => [t.id, t]));
  let droppedQuotes = 0;
  let downgraded = 0;

  const categoryFeedback: CategoryFeedback[] = CATEGORIES_BY_MODE[mode].map((category) => {
    const rubric = rubrics.get(category);
    const item = output.categories.find((c) => c.category === category);
    if (!item) {
      return {
        category,
        assessment: "insufficient-evidence",
        rubric: rubric?.question ?? RUBRIC_CATEGORY_LABELS[category],
        demonstrated: "This interview did not cover this dimension.",
        unclear: "No answer in this session addressed it.",
        whyItMatters: "Not covered in this short session.",
        suggestedExplanation: "Practice a question that targets this dimension in your next session.",
        nextPracticeQuestion: `Prepare one concrete example that shows ${RUBRIC_CATEGORY_LABELS[category].toLowerCase()}.`,
        evidenceTurnIds: [],
        quotes: [],
        repositoryEvidence: [],
        uncertainty: "Not assessed in this session.",
      };
    }

    const verified = verifyQuotes(item.quotes, turns);
    droppedQuotes += verified.dropped;
    let level: EvidenceAssessment = item.level;
    let quotes = verified.quotes;
    let demonstrated = text(item.demonstrated);
    let uncertainty = text(item.uncertainty, 400);
    let evidence = resolveEvidence(item.evidenceIds, sources);

    if (!supportsLevel(level, quotes)) {
      downgraded += 1;
      level = "insufficient-evidence";
      quotes = [];
      evidence = [];
      demonstrated = "There is not enough verified evidence in this interview to judge this dimension.";
      uncertainty = "The cited answers could not be matched to complete, substantive candidate turns, so no level is given.";
    }

    const score = RUBRIC_LEVEL_SCORES[level];
    const rubricText =
      level === "insufficient-evidence" ? rubric?.question : (rubric?.levels[level] ?? rubric?.question);

    return {
      category,
      assessment: level,
      ...(score !== null ? { score } : {}),
      rubric: rubricText ?? RUBRIC_CATEGORY_LABELS[category],
      demonstrated,
      unclear: text(item.unclear),
      whyItMatters: text(item.whyItMatters),
      suggestedExplanation: text(item.suggestedExplanation),
      nextPracticeQuestion: text(item.nextPracticeQuestion, 300),
      evidenceTurnIds: uniqueTurnIds(quotes),
      quotes,
      repositoryEvidence: evidence,
      uncertainty,
    };
  });

  const feedbackItems = (items: ReportOutput["strengths"]): FeedbackItem[] =>
    items.flatMap((item) => {
      const verified = verifyQuotes(item.quotes, turns);
      droppedQuotes += verified.dropped;
      if (verified.quotes.length === 0) return [];
      return [
        {
          summary: text(item.summary, 400),
          evidenceTurnIds: uniqueTurnIds(verified.quotes),
          quotes: verified.quotes,
          repositoryEvidence: resolveEvidence(item.evidenceIds, sources),
        },
      ];
    });

  const questionCoverage: QuestionCoverage[] = request.plan.questions.map((question) => {
    const item = output.questionCoverage.find((c) => c.questionId === question.id);
    const askedTurn = item?.askedInTurnId ? turns.get(item.askedInTurnId.trim()) : undefined;
    // Asked only if a real, uninterrupted interviewer turn is cited.
    const asked = Boolean(askedTurn && askedTurn.speaker === "interviewer" && !askedTurn.interrupted);
    return { questionId: question.id, targetedSkill: question.targetedSkill, asked, followedUp: asked && Boolean(item?.followedUp) };
  });

  const incompleteTurns = request.transcript.filter((t) => t.speaker === "user" && !t.isFinal).map((t) => t.id);
  const one = incompleteTurns.length === 1;
  const serverNotes = [
    incompleteTurns.length
      ? `${incompleteTurns.join(", ")} ${one ? "was" : "were"} still being transcribed when the session ended and ${one ? "was not judged as a complete answer" : "were not judged as complete answers"}.`
      : "",
    downgraded ? `${downgraded} dimension(s) were set to insufficient evidence because their cited answers could not be verified.` : "",
    droppedQuotes ? `${droppedQuotes} cited quote(s) could not be matched to the transcript and were removed.` : "",
  ].filter(Boolean);

  return {
    mode,
    companyStyle: request.plan.companyStyle,
    generatedAt: (args.now ?? new Date()).toISOString(),
    categoryFeedback,
    strengths: feedbackItems(output.strengths),
    improvements: feedbackItems(output.improvements),
    recommendedPractice: output.recommendedPractice.map((p) => text(p, 300)).filter(Boolean),
    questionCoverage,
    limitations: [
      ...serverNotes,
      // The page already shows the practice disclaimer; drop copies of it.
      ...output.limitations.map((l) => text(l, 300)).filter((l) => l && !/not an employer evaluation/i.test(l)),
    ].slice(0, 6),
    disclaimer: PRACTICE_DISCLAIMER,
  };
}
