import type { AnalyzeResponse, InterviewPlan } from "@/types";
import { COMPANY_STYLE_DISCLAIMER, COMPANY_STYLES, INTERVIEW_MODES } from "@/types";

export function PlanStep({
  analysis,
  plan,
  isSample,
  onStart,
  onEdit,
}: {
  analysis: AnalyzeResponse;
  plan: InterviewPlan;
  isSample: boolean;
  onStart: () => void;
  onEdit: () => void;
}) {
  const repo = analysis.repository;
  const styleLabel = COMPANY_STYLES.find((s) => s.value === plan.companyStyle)?.label ?? plan.companyStyle;
  const modeLabel = INTERVIEW_MODES.find((m) => m.value === plan.mode)?.label ?? plan.mode;

  return (
    <section className="stage" aria-labelledby="plan-title">
      <div className="stage-heading">
        <div>
          <span className="section-kicker">02 / FIND YOUR ANGLE</span>
          <h2 id="plan-title">Your practice plan.</h2>
          <p>A brief look at the session ahead. The interview questions stay private until you begin.</p>
        </div>
        <span className="heading-decoration" aria-hidden="true">
          ↗
        </span>
      </div>

      {isSample && (
        <div className="notice">
          <span>✳</span>
          <p>
            <strong>Sample analysis.</strong> Live repository analysis is being connected. This plan uses the demo
            repository and a sample technical plan, whatever you entered.
          </p>
        </div>
      )}
      {analysis.warnings.length > 0 && (
        <div className="notice">
          <span>✳</span>
          <p>{analysis.warnings.join(" ")}</p>
        </div>
      )}

      <div className="plan-grid">
        <div className="plan-main">
          <div className="plan-summary">
            <div>
              <span className="mini-label">YOUR SESSION</span>
              <h3>{analysis.jobProfile.roleTitle}</h3>
              <p>
                {styleLabel} · {modeLabel} · {plan.durationMinutes} minutes
              </p>
              <p className="company-angle">{COMPANY_STYLE_DISCLAIMER}</p>
            </div>
            <div className="duration">
              <strong>{plan.durationMinutes}</strong>
              <span>MINUTES</span>
            </div>
          </div>

          <div className="plan-teaser" aria-label="Preparation directions">
            <span className="mini-label">A FEW DIRECTIONS</span>
            <h3>Come ready to talk through your work.</h3>
            <p>The interviewer will choose questions based on your materials and your answers. You can prepare in broad strokes:</p>
            <ul>
              <li>Recall a project you can explain clearly from start to finish.</li>
              <li>Think about decisions you made and what you learned.</li>
              <li>Be ready to clarify your thinking when asked to go deeper.</li>
            </ul>
            <p className="plan-teaser-note">Specific questions and follow-ups are revealed during the interview.</p>
          </div>

          <div className="stage-actions">
            <button type="button" className="button button-primary" onClick={onStart}>
              Enter interview room <span aria-hidden="true">→</span>
            </button>
            <button type="button" className="text-button" onClick={onEdit}>
              Edit details
            </button>
          </div>
        </div>

        <aside className="inspection-card">
          <span className="mini-label">SESSION INPUTS</span>
          <h3>What shaped this session</h3>
          <p>Your materials help the interviewer choose a direction. The report may cite evidence after the session.</p>
          <div className="inspection-row">
            <span className="inspection-glyph">⌘</span>
            <div>
              <strong>Repository</strong>
              <small>
                {repo ? `${repo.inspectedFiles.length} files inspected` : "No repository analyzed"}
              </small>
            </div>
          </div>
          <div className="inspection-row">
            <span className="inspection-glyph">⌁</span>
            <div>
              <strong>Job description</strong>
              <small>Role context included</small>
            </div>
          </div>
          <div className="inspection-row">
            <span className="inspection-glyph">▤</span>
            <div>
              <strong>Resume</strong>
              <small>Experience context included</small>
            </div>
          </div>
          {analysis.candidateProfile.limitations.length > 0 && (
            <div className="inspection-foot">Some details may be missing from the materials provided.</div>
          )}
        </aside>
      </div>
    </section>
  );
}
