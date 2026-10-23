/**
 * Mock analysis data for UI development. Repository evidence points at real files in the
 * public demo repository at a pinned commit, so paths and line ranges can be checked.
 * The candidate and job details are fictional.
 */

import type { CandidateProfile, JobProfile, RepositoryAnalysis, RepositoryEvidence } from "@/types";

export const MOCK_REPO_URL = "https://github.com/JunhaoLiXD/vision-enhance-platform";
export const MOCK_COMMIT_SHA = "837ba9dca98529fd5c356587023867f986b86085";

export const mockEvidence = {
  zeroDceCurves: {
    repoUrl: MOCK_REPO_URL,
    commitSha: MOCK_COMMIT_SHA,
    path: "src/backend/engine/plugins/enhance_ml/zero_dce/network.py",
    lineRange: { start: 42, end: 52 },
    excerpt:
      "r1, r2, r3, r4, r5, r6, r7, r8 = torch.split(x_r, 3, dim=1)\n\nx = x + r1 * (torch.pow(x, 2) - x)",
    observation:
      "Zero-DCE network predicts eight curve-parameter maps and applies the quadratic light-enhancement curve iteratively.",
    confidence: "high",
  },
  zeroDceResize: {
    repoUrl: MOCK_REPO_URL,
    commitSha: MOCK_COMMIT_SHA,
    path: "src/backend/engine/plugins/enhance_ml/zero_dce/inference.py",
    lineRange: { start: 17, end: 39 },
    excerpt: "MAX_ZERO_DCE_SIDE = 384",
    observation:
      "Inference resizes the longest image side to 384 px before running the model, then restores the original size.",
    confidence: "high",
  },
  pipelineLoop: {
    repoUrl: MOCK_REPO_URL,
    commitSha: MOCK_COMMIT_SHA,
    path: "src/backend/engine/core/pipeline.py",
    lineRange: { start: 28, end: 38 },
    excerpt: "for item in spec:\n    ...\n    cur = step.run(cur, params)",
    observation:
      "Pipeline runs plugin steps sequentially from a registry and records per-step timing.",
    confidence: "high",
  },
  modelCache: {
    repoUrl: MOCK_REPO_URL,
    commitSha: MOCK_COMMIT_SHA,
    path: "src/backend/app/services/model_manager.py",
    lineRange: { start: 58, end: 82 },
    observation: "Loaded Zero-DCE models are cached per device to avoid reloading weights on every job.",
    confidence: "medium",
  },
} satisfies Record<string, RepositoryEvidence>;

export const mockRepositoryAnalysis: RepositoryAnalysis = {
  repoUrl: MOCK_REPO_URL,
  owner: "JunhaoLiXD",
  name: "vision-enhance-platform",
  defaultBranch: "main",
  commitSha: MOCK_COMMIT_SHA,
  scope: "selected-files",
  inspectedFiles: [
    { path: "README.md", sizeBytes: 10383 },
    { path: "requirements.txt", sizeBytes: 256 },
    { path: "src/backend/engine/core/pipeline.py", sizeBytes: 1415 },
    { path: "src/backend/engine/plugins/registry.py", sizeBytes: 2224 },
    { path: "src/backend/engine/plugins/enhance_ml/zero_dce/network.py", sizeBytes: 2212 },
    { path: "src/backend/engine/plugins/enhance_ml/zero_dce/inference.py", sizeBytes: 1707 },
    { path: "src/backend/engine/plugins/enhance_classical/retinex.py", sizeBytes: 6241 },
    { path: "src/backend/app/services/model_manager.py", sizeBytes: 2811 },
    { path: "src/backend/app/services/job_service.py", sizeBytes: 6841 },
  ],
  skippedFileCount: 52,
  treeTruncated: false,
};

export const mockJobProfile: JobProfile = {
  companyStyle: "general-tech",
  roleTitle: "Computer Vision Engineer",
  companyName: "Example Vision Labs",
  requirements: [
    { skill: "Image processing fundamentals", importance: "required", source: "Strong grasp of classical image processing" },
    { skill: "PyTorch", importance: "required", source: "Experience training and deploying models in PyTorch" },
    { skill: "Model deployment", importance: "required", source: "Ship models behind production APIs" },
    { skill: "Performance optimization", importance: "preferred", source: "Profile and optimize inference latency" },
  ],
  prioritySkills: ["PyTorch", "Image processing fundamentals", "Model deployment"],
};

export const mockCandidateProfile: CandidateProfile = {
  skills: ["Python", "PyTorch", "OpenCV", "FastAPI", "React", "TypeScript"],
  projects: [
    {
      name: "Vision Enhance Platform",
      summary:
        "Full-stack image enhancement app with a plugin-based pipeline of classical filters and a Zero-DCE low-light model.",
      claims: [
        "Built a plugin-based enhancement pipeline",
        "Integrated a Zero-DCE model for low-light enhancement",
        "Deployed a FastAPI backend with async job processing",
      ],
      repositoryEvidence: [mockEvidence.pipelineLoop, mockEvidence.zeroDceCurves, mockEvidence.zeroDceResize],
    },
  ],
  limitations: [
    "Resume does not say whether the Zero-DCE weights were trained by the candidate or reused.",
    "No quantitative evaluation (metrics or benchmarks) found in the inspected files.",
  ],
};
