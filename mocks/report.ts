import { PRACTICE_DISCLAIMER, type InterviewReport } from "@/types";
import { mockEvidence } from "./profile";

export const mockReport: InterviewReport = {
  mode: "technical",
  companyStyle: "tech",
  generatedAt: "2026-10-24T14:06:00.000Z",
  categoryFeedback: [
    {
      category: "implementation-understanding",
      assessment: "medium",
      score: 2,
      rubric: "Describes the overall design correctly, but is vague about specific parts until asked.",
      demonstrated: "After a follow-up, you explained that the curve leaves bright pixels mostly unchanged and lifts dark pixels, and that iteration widens the range.",
      unclear: "Your first answer focused on model size and did not mention pixel-wise curve estimation.",
      whyItMatters: "The role requires understanding PyTorch models well enough to debug and adapt them.",
      suggestedExplanation: "Lead with the mechanism: the network predicts per-pixel curve parameters, and applying the quadratic curve eight times gives a more flexible mapping while staying in [0, 1].",
      nextPracticeQuestion: "How would you change the network if enhanced images showed color shifts?",
      evidenceTurnIds: ["t-004", "t-006"],
      quotes: [
        { turnId: "t-004", quote: "I think it's because it makes the model smaller." },
        { turnId: "t-006", quote: "Doing it eight times gives a wider range than one curve." },
      ],
      repositoryEvidence: [mockEvidence.zeroDceCurves],
      uncertainty: "Based on two answers to one question.",
    },
    {
      category: "trade-off-reasoning",
      assessment: "insufficient-evidence",
      rubric: "Does the candidate weigh alternatives and costs?",
      demonstrated: "You named memory on the free server as the reason for resizing.",
      unclear: "The answer was cut off before you discussed quality loss or alternatives for large images.",
      whyItMatters: "The JD lists inference latency optimization as a preferred skill.",
      suggestedExplanation: "State the trade-off explicitly: resizing cuts memory and latency but loses fine detail; tiling or guided upsampling keeps detail at higher cost.",
      nextPracticeQuestion: "How would you measure whether resizing to 384 px hurts output quality?",
      evidenceTurnIds: ["t-008"],
      quotes: [{ turnId: "t-008", quote: "Mainly memory on the free server." }],
      repositoryEvidence: [mockEvidence.zeroDceResize],
      uncertainty: "The final answer (t-008) is an incomplete transcription and was not judged as a full answer.",
    },
    {
      category: "clarity",
      assessment: "strong",
      score: 3,
      rubric: "Organized and easy to follow: starts with the main point, then adds detail.",
      demonstrated: "Your project overview covered purpose, architecture and your favorite part in a few sentences.",
      unclear: "Nothing significant.",
      whyItMatters: "Clear explanations matter when presenting work to a team.",
      suggestedExplanation: "Add one sentence on the user problem before describing the stack.",
      nextPracticeQuestion: "Explain the plugin registry to a non-technical product manager in 30 seconds.",
      evidenceTurnIds: ["t-002"],
      quotes: [{ turnId: "t-002", quote: "adding a new algorithm is just registering a step." }],
      repositoryEvidence: [mockEvidence.pipelineLoop],
      uncertainty: "Short interview; one overview answer.",
    },
  ],
  strengths: [
    {
      summary: "Clear, structured project overview that highlighted the extensible plugin design.",
      evidenceTurnIds: ["t-002"],
      quotes: [{ turnId: "t-002", quote: "adding a new algorithm is just registering a step." }],
      repositoryEvidence: [mockEvidence.pipelineLoop],
    },
  ],
  improvements: [
    {
      summary: "Start technical answers with the mechanism, then the benefits.",
      evidenceTurnIds: ["t-004"],
      quotes: [{ turnId: "t-004", quote: "It just predicts parameters, so it's faster." }],
      repositoryEvidence: [mockEvidence.zeroDceCurves],
    },
  ],
  recommendedPractice: [
    "Explain the Zero-DCE curve in under 60 seconds without notes.",
    "Prepare one concrete latency measurement from your project.",
  ],
  questionCoverage: [
    { questionId: "q1", targetedSkill: "Communication", asked: true, followedUp: false },
    { questionId: "q2", targetedSkill: "PyTorch", asked: true, followedUp: true },
    { questionId: "q3", targetedSkill: "Performance optimization", asked: true, followedUp: false },
  ],
  limitations: [
    "Transcripts are machine-generated and may contain errors.",
    "Turn t-008 was cut off when the session ended.",
  ],
  disclaimer: PRACTICE_DISCLAIMER,
};
