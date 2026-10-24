import type { AnalyzeResponse, InterviewPlan } from "@/types";
import { INTERVIEW_MODES } from "@/types";

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
  const modeLabel = INTERVIEW_MODES.find((m) => m.value === plan.mode)?.label ?? plan.mode;

  return (
    <section className="stage" aria-labelledby="plan-title">
      <div className="stage-heading">
        <div>
          <span className="section-kicker">02 / FIND YOUR ANGLE</span>
          <h2 id="plan-title">Your practice plan.</h2>
          <p>See the focus areas and the materials behind them. Specific questions stay private until you begin.</p>
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
                {modeLabel} · {plan.durationMinutes} minutes
              </p>
            </div>
            <div className="duration">
              <strong>{plan.durationMinutes}</strong>
              <span>MINUTES</span>
            </div>
          </div>

          <div className="plan-focus" aria-label="Interview focus areas">
            <span className="mini-label">INTERVIEW FOCUS AREAS</span>
            <p>One focus area per planned question. The interviewer may adapt to your answers.</p>
            {plan.questions.map((question, index) => {
              const codeSources = question.sourceRefs.filter((ref) => ref.kind === "repository");
              return <article className="question-card" key={question.id}>
                <h3>Topic {index + 1} · {question.targetedSkill}</h3>
                <div className="focus-sources">
                  <span className="mini-label">REPOSITORY REFERENCES</span>
                  {codeSources.length ? <ul>{codeSources.map((ref, sourceIndex) => (
                    <li key={sourceIndex}><code>{ref.evidence.path}</code>{ref.evidence.lineRange ? ` · lines ${ref.evidence.lineRange.start}–${ref.evidence.lineRange.end}` : " · line range unavailable"}</li>
                  ))}</ul> : <p>No code reference for this focus area.</p>}
                </div>
              </article>;
            })}
            <p className="focus-note">Specific questions and follow-ups are revealed during the interview.</p>
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
          <p>These are the materials used to shape the plan.</p>
          <div className="inspection-row">
            <span className="inspection-glyph">⌘</span>
            <div>
              <strong>Repository</strong>
              <small>{repo ? `${repo.owner}/${repo.name} @ ${repo.commitSha.slice(0, 12)}` : "No repository analyzed"}</small>
              {repo && <ul className="inspection-list">{repo.inspectedFiles.map((file) => <li key={file.path}><code>{file.path}</code></li>)}</ul>}
            </div>
          </div>
          <div className="inspection-row">
            <span className="inspection-glyph">⌁</span>
            <div>
              <strong>Job priorities</strong>
              <small>{analysis.jobProfile.prioritySkills.length ? analysis.jobProfile.prioritySkills.join(" · ") : "No priority skills identified"}</small>
            </div>
          </div>
          <div className="inspection-row">
            <span className="inspection-glyph">▤</span>
            <div>
              <strong>Resume projects</strong>
              <small>{analysis.candidateProfile.projects.length ? analysis.candidateProfile.projects.map((project) => project.name).join(" · ") : "No projects identified"}</small>
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
