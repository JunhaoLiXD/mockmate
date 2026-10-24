"use client";

/**
 * Four-step MockMate flow: Prepare -> Plan -> Interview -> Review.
 * All interview data stays in this tab (stateless API design, brief section 9.2).
 *
 * TODO(M2): replace the sample analysis/plan with POST /api/analyze and /api/plan.
 * TODO(M4): replace the transcript-only review with POST /api/report.
 */

import { useState } from "react";
import type { AnalyzeResponse, InterviewPlan } from "@/types";
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
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
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
    setBusy(true);
    setSubmitError(null);
    try {
      // Sample data until /api/analyze and /api/plan are live.
      const [nextAnalysis, nextPlan] = await Promise.all([mockDelay(mockAnalyzeResponse, 900), mockDelay(mockPlan, 900)]);
      setAnalysis(nextAnalysis);
      setPlan(nextPlan);
      setResult(null);
      go("plan");
    } catch {
      setSubmitError("We couldn't build your plan. Please try again.");
    } finally {
      setBusy(false);
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
            <PrepareStep values={intake} onChange={setIntake} onSubmit={analyze} busy={busy} submitError={submitError} />
          )}
          {step === "plan" && analysis && plan && (
            <PlanStep analysis={analysis} plan={plan} isSample onStart={enterRoom} onEdit={() => go("prepare")} />
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
