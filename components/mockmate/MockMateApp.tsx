"use client";

/**
 * Four-step MockMate flow: Prepare -> Plan -> Interview -> Review.
 * All interview data stays in this tab (stateless API design, brief section 9.2).
 *
 * Analysis and planning call POST /api/analyze, then POST /api/plan. With ?mock=1 the sample
 * analysis and plan are used instead, so the UI can be worked on without paid API calls.
 * TODO(M4): replace the transcript-only review with POST /api/report.
 */

import { useEffect, useRef, useState } from "react";
import type { AnalyzeResponse, InterviewPlan } from "@/types";
import { SESSION_LIMITS } from "@/types";
import { analyzeProfile, createPlan, describeApiError } from "@/lib/api/client";
import { mockAnalyzeResponse, mockDelay } from "@/mocks/api";
import { mockPlan } from "@/mocks/plan";
import { FeedbackStep } from "./FeedbackStep";
import { LiveRoom, type RoomResult } from "./LiveRoom";
import { PlanStep } from "./PlanStep";
import { EMPTY_INTAKE, PrepareStep, type IntakeValues } from "./PrepareStep";
import { Hero, HowItWorks, SiteFooter, SiteHeader } from "./SiteChrome";

type Step = "prepare" | "plan" | "practice" | "feedback";

const STEPS: Array<{ id: Step; label: string }> = [
  { id: "prepare", label: "Prepare" },
  { id: "plan", label: "Plan" },
  { id: "practice", label: "Interview" },
  { id: "feedback", label: "Review" },
];

export function MockMateApp() {
  const [step, setStep] = useState<Step>("prepare");
  const [intake, setIntake] = useState<IntakeValues>(EMPTY_INTAKE);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [plan, setPlan] = useState<InterviewPlan | null>(null);
  const [result, setResult] = useState<RoomResult | null>(null);
  const [phase, setPhase] = useState<"idle" | "analyzing" | "planning">("idle");
  const [isSample, setIsSample] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const busy = phase !== "idle";

  // Cancel an in-flight analysis if the page goes away.
  useEffect(() => () => requestRef.current?.abort(), []);
  const [useMockVoice, setUseMockVoice] = useState(false);
  const [roomKey, setRoomKey] = useState(0);

  const reached: Record<Step, boolean> = {
    prepare: true,
    plan: plan !== null,
    practice: plan !== null,
    feedback: result !== null,
  };

  const go = (next: Step) => {
    setStep(next);
    document.getElementById("workflow")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const analyze = async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setSubmitError(null);
    setPhase("analyzing");

    try {
      const sample = new URLSearchParams(window.location.search).has("mock");
      let nextAnalysis: AnalyzeResponse;
      let nextPlan: InterviewPlan;

      if (sample) {
        nextAnalysis = await mockDelay(mockAnalyzeResponse, 900);
        setPhase("planning");
        nextPlan = await mockDelay(mockPlan, 900);
      } else {
        nextAnalysis = await analyzeProfile(
          {
            jobDescription: intake.jobDescription.trim(),
            ...(intake.resumeMode === "pdf" && intake.resumeFile
              ? { resumeFile: intake.resumeFile }
              : { resumeText: intake.resumeText.trim() }),
            repoUrl: intake.repoUrl.trim() || undefined,
            companyStyle: intake.companyStyle,
            mode: intake.mode,
          },
          controller.signal,
        );
        setPhase("planning");
        const response = await createPlan(
          {
            mode: intake.mode,
            companyStyle: intake.companyStyle,
            durationMinutes: SESSION_LIMITS.defaultDurationMinutes,
            jobProfile: nextAnalysis.jobProfile,
            candidateProfile: nextAnalysis.candidateProfile,
            repository: nextAnalysis.repository,
          },
          controller.signal,
        );
        nextPlan = response.plan;
      }

      if (controller.signal.aborted) return;
      setIsSample(sample);
      setAnalysis(nextAnalysis);
      setPlan(nextPlan);
      setResult(null);
      go("plan");
    } catch (error) {
      if (controller.signal.aborted) return;
      setSubmitError(describeApiError(error));
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setPhase("idle");
      }
    }
  };

  const enterRoom = () => {
    setUseMockVoice(new URLSearchParams(window.location.search).has("mock"));
    setRoomKey((k) => k + 1);
    go("practice");
  };

  return (
    <div className="site-shell">
      <SiteHeader onHome={() => go("prepare")} />
      <main>
        <Hero />
        <section className="workflow" id="workflow" aria-label="Interview workflow">
          <nav className="stepper" aria-label="Steps">
            {STEPS.map((s, i) => {
              const index = STEPS.findIndex((x) => x.id === step);
              return (
                <span key={s.id} style={{ display: "contents" }}>
                  {i > 0 && <span className="step-connector"></span>}
                  <button
                    type="button"
                    className={`step${s.id === step ? " active" : ""}${i < index ? " complete" : ""}`}
                    aria-current={s.id === step ? "step" : undefined}
                    disabled={!reached[s.id] || (s.id === "practice" && step === "practice")}
                    onClick={() => (s.id === "practice" ? enterRoom() : go(s.id))}
                  >
                    <span className="step-index">0{i + 1}</span>
                    <span>{s.label}</span>
                  </button>
                </span>
              );
            })}
          </nav>

          {step === "prepare" && (
            <PrepareStep
              values={intake}
              onChange={setIntake}
              onSubmit={analyze}
              busy={busy}
              busyLabel={phase === "planning" ? "Writing your questions…" : "Reading your materials…"}
              busyHint={
                phase === "planning"
                  ? "Step 2 of 2: drafting questions from what we found. This usually takes about 20 seconds."
                  : "Step 1 of 2: reading the job description, your resume and your repository. This usually takes about 20 seconds."
              }
              submitError={submitError}
            />
          )}
          {step === "plan" && analysis && plan && (
            <PlanStep analysis={analysis} plan={plan} isSample={isSample} onStart={enterRoom} onEdit={() => go("prepare")} />
          )}
          {step === "practice" && plan && (
            <LiveRoom
              key={roomKey}
              plan={plan}
              useMock={useMockVoice}
              onFinished={(r) => {
                setResult(r);
                go("feedback");
              }}
            />
          )}
          {step === "feedback" && result && (
            <FeedbackStep result={result} onPracticeAgain={enterRoom} onNewRole={() => go("prepare")} />
          )}
        </section>
        <HowItWorks />
      </main>
      <SiteFooter />
    </div>
  );
}
