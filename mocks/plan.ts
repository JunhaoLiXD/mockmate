import type { InterviewPlan } from "@/types";
import { mockEvidence } from "./profile";

export const mockPlan: InterviewPlan = {
  mode: "technical",
  companyStyle: "general-tech",
  roleTitle: "Computer Vision Engineer",
  durationMinutes: 5,
  coverageGoals: ["PyTorch model understanding", "Pipeline architecture", "Inference performance trade-offs"],
  questions: [
    {
      id: "q1",
      prompt: "Can you briefly walk me through the Vision Enhance Platform and the part you are most proud of?",
      targetedSkill: "Communication",
      difficulty: "warm-up",
      rationale: "Opens with the candidate's main project from the resume.",
      sourceRefs: [{ kind: "resume-claim", projectName: "Vision Enhance Platform", claim: "Built a plugin-based enhancement pipeline" }],
      rubric: [
        { category: "clarity", strongSignal: "Clear problem, approach and outcome in under a minute.", weakSignal: "Lists technologies without explaining what the system does." },
      ],
      followupHints: ["If they mention the pipeline, ask how a new algorithm is added."],
    },
    {
      id: "q2",
      prompt:
        "In your Zero-DCE network, the model outputs eight curve maps that are applied one after another. Why apply the curve iteratively instead of predicting the enhanced image directly?",
      targetedSkill: "PyTorch",
      difficulty: "deep-dive",
      rationale: "Tests understanding of the model actually used in the repository.",
      sourceRefs: [
        { kind: "repository", evidence: mockEvidence.zeroDceCurves },
        { kind: "job-requirement", skill: "PyTorch" },
      ],
      rubric: [
        { category: "implementation-understanding", strongSignal: "Explains pixel-wise curve estimation and why iteration widens the adjustable range.", weakSignal: "Describes it only as 'a neural network that brightens images'." },
        { category: "trade-off-reasoning", strongSignal: "Mentions zero-reference training or lightweight inference as benefits.", weakSignal: "No trade-off discussed." },
      ],
      followupHints: ["If the answer is vague, ask what happens to already-bright pixels under the curve."],
    },
    {
      id: "q3",
      prompt:
        "Inference resizes the longest side to 384 pixels before running Zero-DCE. What trade-off were you making there, and how would you handle a 4K image?",
      targetedSkill: "Performance optimization",
      difficulty: "standard",
      rationale: "Connects a concrete implementation choice to the JD's latency requirement.",
      sourceRefs: [
        { kind: "repository", evidence: mockEvidence.zeroDceResize },
        { kind: "job-requirement", skill: "Performance optimization" },
      ],
      rubric: [
        { category: "trade-off-reasoning", strongSignal: "Weighs latency and memory against loss of detail; proposes tiling or guided upsampling.", weakSignal: "Says it was 'just faster' without discussing quality impact." },
      ],
      followupHints: ["Ask how they measured the latency difference."],
    },
  ],
};
