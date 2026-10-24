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
          <p>Questions grounded in your role, your resume, and the code we inspected.</p>
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
              <strong>{plan.questions.length}</strong>
              <span>QUESTIONS</span>
            </div>
          </div>

          {plan.questions.map((q, i) => {
            const paths = q.sourceRefs.flatMap((ref) => (ref.kind === "repository" ? [ref.evidence] : []));
            return (
              <article key={q.id} className="question-card">
                <div className="question-top">
                  <span className="question-number">QUESTION 0{i + 1}</span>
                  <span className="question-tag">{q.targetedSkill}</span>
                </div>
                <h3>{q.prompt}</h3>
                <p>{q.rationale}</p>
                {paths.length > 0 && (
                  <div className="path-preview">
                    <span>Based on inspected code</span>
                    {paths.map((ev) => (
                      <code key={`${ev.path}-${ev.lineRange?.start ?? 0}`}>
                        {ev.path}
                        {ev.lineRange ? `:${ev.lineRange.start}-${ev.lineRange.end}` : ""}
                      </code>
                    ))}
                  </div>
                )}
              </article>
            );
          })}

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
          <span className="mini-label">INSPECTION SCOPE</span>
          <h3>What we inspected</h3>
          <p>Every code-based question links back to a real file at a pinned commit.</p>
          <div className="inspection-row">
            <span className="inspection-glyph">⌘</span>
            <div>
              <strong>Repository</strong>
              <small>
                {repo
                  ? `${repo.owner}/${repo.name} @ ${repo.commitSha.slice(0, 7)} · ${repo.inspectedFiles.length} files read, ${repo.skippedFileCount} skipped`
                  : "No repository analyzed"}
              </small>
            </div>
          </div>
          {repo && (
            <div className="path-preview">
              {repo.inspectedFiles.map((f) => (
                <code key={f.path}>{f.path}</code>
              ))}
            </div>
          )}
          <div className="inspection-row">
            <span className="inspection-glyph">⌁</span>
            <div>
              <strong>Job description</strong>
              <small>{analysis.jobProfile.prioritySkills.join(" · ")}</small>
            </div>
          </div>
          <div className="inspection-row">
            <span className="inspection-glyph">▤</span>
            <div>
              <strong>Resume</strong>
              <small>{analysis.candidateProfile.projects.map((p) => p.name).join(" · ") || "No projects found"}</small>
            </div>
          </div>
          {analysis.candidateProfile.limitations.length > 0 && (
            <div className="inspection-foot">Not found: {analysis.candidateProfile.limitations.join(" ")}</div>
          )}
        </aside>
      </div>
    </section>
  );
}
