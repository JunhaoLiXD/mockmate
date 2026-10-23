import type { TranscriptTurn } from "@/types";

const BASE_TIME = Date.parse("2026-10-24T14:00:00.000Z");
const at = (seconds: number) => new Date(BASE_TIME + seconds * 1000).toISOString();

/**
 * A short technical interview with one answer-driven follow-up, one interrupted
 * interviewer turn and one unfinished final turn.
 */
export const mockTranscript: TranscriptTurn[] = [
  {
    id: "t-001",
    speaker: "interviewer",
    text: "Hi, thanks for joining. Can you briefly walk me through the Vision Enhance Platform and the part you are most proud of?",
    timestamp: at(0),
    questionId: "q1",
    isFinal: true,
  },
  {
    id: "t-002",
    speaker: "user",
    text: "Sure. It's a full-stack app for enhancing images. The backend is FastAPI and it runs a pipeline of plugins, like CLAHE, Retinex and a Zero-DCE model. I'm most proud of the plugin system, because adding a new algorithm is just registering a step.",
    timestamp: at(9),
    questionId: "q1",
    isFinal: true,
    transcriptionConfidence: 0.94,
  },
  {
    id: "t-003",
    speaker: "interviewer",
    text: "In your Zero-DCE network, the model outputs eight curve maps that are applied one after another. Why apply the curve iteratively instead of predicting the enhanced image directly?",
    timestamp: at(31),
    questionId: "q2",
    isFinal: true,
  },
  {
    id: "t-004",
    speaker: "user",
    text: "I think it's because it makes the model smaller. It just predicts parameters, so it's faster.",
    timestamp: at(44),
    questionId: "q2",
    isFinal: true,
    transcriptionConfidence: 0.91,
  },
  {
    id: "t-005",
    speaker: "interviewer",
    text: "That's part of it. What happens to a pixel that is already bright when the curve is applied several",
    timestamp: at(52),
    questionId: "q2",
    isFinal: true,
    interrupted: true,
  },
  {
    id: "t-006",
    speaker: "user",
    text: "Oh, right. The curve keeps values between zero and one, so bright pixels barely change, while dark pixels get lifted more each iteration. Doing it eight times gives a wider range than one curve.",
    timestamp: at(57),
    questionId: "q2",
    isFinal: true,
    transcriptionConfidence: 0.89,
  },
  {
    id: "t-007",
    speaker: "interviewer",
    text: "Inference resizes the longest side to 384 pixels before running the model. What trade-off were you making there?",
    timestamp: at(78),
    questionId: "q3",
    isFinal: true,
  },
  {
    id: "t-008",
    speaker: "user",
    text: "Mainly memory on the free server. For a 4K image I would probably",
    timestamp: at(88),
    questionId: "q3",
    isFinal: false,
  },
];
