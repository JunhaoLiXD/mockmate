import type { CategoryFeedback, FeedbackItem, InterviewReport, RepositoryEvidence, TranscriptTurn, TurnQuote } from "@/types";
import { CATEGORIES_BY_MODE, COMPANY_STYLE_DISCLAIMER, PRACTICE_DISCLAIMER, RUBRIC_CATEGORY_LABELS } from "@/types";
import type { RoomResult } from "./LiveRoom";

export type ReportStatus = "loading" | "ready" | "error";

function Evidence({ quotes, files }: { quotes: TurnQuote[]; files: RepositoryEvidence[] }) {
  if (!quotes.length && !files.length) return null;
  return (
    <div className="report-evidence">
      {quotes.map((item, index) => (
        <blockquote key={item.turnId + index}>
          <span className="report-source">Transcript · {item.turnId}</span>
          <p>“{item.quote}”</p>
        </blockquote>
      ))}
      {files.map((file, index) => (
        <div className="report-file" key={file.repoUrl + file.commitSha + file.path + index}>
          <span className="report-source">Code evidence</span>
          <strong>{file.path}{file.lineRange && " · lines " + file.lineRange.start + "–" + file.lineRange.end}</strong>
          <small>{file.repoUrl} @ {file.commitSha.slice(0, 12)}</small>
          <p>{file.observation}</p>
        </div>
      ))}
    </div>
  );
}

function FeedbackList({ title, items }: { title: string; items: FeedbackItem[] }) {
  return (
    <section className="report-section">
      <h4>{title}</h4>
      {items.length ? items.map((item, index) => (
        <article className="report-list-item" key={title + index}>
          <p>{item.summary}</p>
          <Evidence quotes={item.quotes} files={item.repositoryEvidence} />
        </article>
      )) : <p className="report-empty">No items were identified from this interview.</p>}
    </section>
  );
}

function scoredValue(item: CategoryFeedback | undefined): number | null {
  if (!item || (item.assessment !== "demonstrated" && item.assessment !== "partially-demonstrated")) return null;
  if (!Number.isInteger(item.score) || item.score === undefined || item.score < 1 || item.score > 5) return null;
  if (!item.rubric.trim() || !item.uncertainty.trim()) return null;
  if (!item.quotes.some((quote) => quote.quote.trim() && item.evidenceTurnIds.includes(quote.turnId))) return null;
  return item.score;
}

function unscoredReason(item: CategoryFeedback | undefined): string {
  if (!item) return "No feedback for this category";
  if (item.assessment === "not-assessed") return "Not assessed";
  if (item.assessment === "insufficient-evidence") return "Insufficient evidence";
  return "No valid evidence-backed numeric score";
}

function ScoreSummary({ report, isSample }: { report: InterviewReport; isSample: boolean }) {
  const categories = CATEGORIES_BY_MODE[report.mode].map((category) => {
    const feedback = report.categoryFeedback.find((item) => item.category === category);
    return { category, feedback, score: scoredValue(feedback) };
  });
  const scored = categories.filter((item) => item.score !== null);
  const overall = scored.length >= 2
    ? Math.round(scored.reduce((sum, item) => sum + ((item.score ?? 1) - 1) * 25, 0) / scored.length)
    : null;
  const scoreTitle = overall === null ? "Practice score unavailable" : scored.length < categories.length ? "Provisional practice score" : "Overall practice score";

  return (
    <section className="score-summary" aria-labelledby="score-summary-title">
      <div className="score-hero">
        <div className="score-hero-top">
          <div><span className="score-kicker">{isSample ? "SAMPLE REPORT · SCRIPTED ANSWERS" : "RUBRIC-BASED PRACTICE SCORE"}</span><h3 id="score-summary-title">{scoreTitle}</h3></div>
        </div>
        <div className="score-reading">
          <strong>{overall ?? "—"}</strong><span>/ 100</span>
          <span className="score-coverage">Based on {scored.length} of {categories.length} categories</span>
        </div>
        <div className="score-track" role="img" aria-label={overall === null ? "Practice score unavailable" : `${scoreTitle} ${overall} out of 100, based on ${scored.length} of ${categories.length} categories`}>
          {overall !== null && <span style={{ width: `${overall}%` }} />}
        </div>
        <div className="score-scale" aria-hidden="true"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
        <p>{overall === null
          ? "Overall score unavailable: at least two categories need evidence-backed scores."
          : "Each scored category maps 1–5 to 0–100 as (score − 1) × 25. Equal average, rounded; unscored categories excluded."}</p>
      </div>
      <div className="score-factors">
        <div className="score-factors-heading"><h4>Category scores</h4><span>Scroll for the evidence and detailed feedback ↓</span></div>
        <div className="score-factor-list">
          {categories.map(({ category, feedback, score }) => (
            <div className="score-factor" key={category}>
              <div><strong>{RUBRIC_CATEGORY_LABELS[category]}</strong><span>{score !== null ? "Based on cited answers" : unscoredReason(feedback)}</span></div>
              <span className={score === null ? "score-factor-value is-unscored" : "score-factor-value"}>{score === null ? "Unscored" : `${(score - 1) * 25} / 100`}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="score-caveat">A practice snapshot with limited evidence. It is not an employer rating or hiring prediction.</p>
    </section>
  );
}

function Report({ report, isSample }: { report: InterviewReport; isSample: boolean }) {
  const demonstrated = report.categoryFeedback.filter((item) => item.assessment === "demonstrated").length;
  const needsWork = report.categoryFeedback.filter((item) => item.assessment === "partially-demonstrated").length;
  return (
    <div className="report-content">
      <ScoreSummary report={report} isSample={isSample} />
      <div className="report-heading">
        <span className="mini-label">{isSample ? "SAMPLE REPORT · SCRIPTED ANSWERS" : "EVIDENCE-BASED FEEDBACK"}</span>
        <h3>Your practice report</h3>
        <p>{isSample ? "This demo report uses sample answers and repository evidence. It is not an evaluation of your own interview." : "Scores appear only when your answers provide enough evidence. This report is based on a limited practice session."}</p>
      </div>

      <div className="report-overview" aria-label="Report overview">
        <div><strong>{demonstrated}</strong><span>Demonstrated</span></div>
        <div><strong>{needsWork}</strong><span>Partially demonstrated</span></div>
        <div><strong>{report.recommendedPractice.length}</strong><span>Practice steps</span></div>
      </div>

      <section className="report-section" aria-label="Rubric feedback">
        <h4>Skill feedback</h4>
        <div className="report-categories">
          {report.categoryFeedback.map((category) => (
            <article className="report-category" key={category.category}>
              <div className="report-category-top">
                <h5>{RUBRIC_CATEGORY_LABELS[category.category]}</h5>
                <div className="report-category-meta">
                  <span className={"assessment assessment-" + category.assessment}>
                    {category.assessment === "partially-demonstrated" ? "Partially demonstrated"
                      : category.assessment === "insufficient-evidence" ? "Insufficient evidence"
                        : category.assessment === "not-assessed" ? "Not assessed" : "Demonstrated"}
                  </span>
                  {scoredValue(category) !== null && <span className="report-score">{scoredValue(category)} / 5</span>}
                </div>
              </div>
              <p className="report-rubric">Rubric: {category.rubric}</p>
              <dl className="report-details">
                <div><dt>What you demonstrated</dt><dd>{category.demonstrated}</dd></div>
                <div><dt>What remains unclear</dt><dd>{category.unclear}</dd></div>
                <div><dt>Why it matters</dt><dd>{category.whyItMatters}</dd></div>
                <div><dt>Suggested stronger explanation</dt><dd>{category.suggestedExplanation}</dd></div>
                <div><dt>Next practice question</dt><dd>{category.nextPracticeQuestion}</dd></div>
              </dl>
              <Evidence quotes={category.quotes} files={category.repositoryEvidence} />
              <p className="report-uncertainty">Limit: {category.uncertainty}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="report-two-columns">
        <FeedbackList title="Strengths" items={report.strengths} />
        <FeedbackList title="Areas to improve" items={report.improvements} />
      </div>

      <section className="report-section">
        <h4>Recommended practice</h4>
        <ol className="report-practice">{report.recommendedPractice.map((item, index) => <li key={index}>{item}</li>)}</ol>
      </section>

      <section className="report-section">
        <h4>Question coverage</h4>
        <div className="report-coverage">
          {report.questionCoverage.map((item) => (
            <div className="report-coverage-row" key={item.questionId}>
              <strong>{item.questionId}</strong>
              <span>{item.targetedSkill}</span>
              <span>{item.asked ? "Asked" : "Not asked"}{item.followedUp && " · Followed up"}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="report-section">
        <h4>Report limitations</h4>
        <ul className="report-limitations">{report.limitations.map((item, index) => <li key={index}>{item}</li>)}</ul>
        {report.disclaimer !== PRACTICE_DISCLAIMER && <p className="report-uncertainty">{report.disclaimer}</p>}
      </section>
    </div>
  );
}

export function FeedbackStep({
  result, report, reportStatus, reportError, isSample, onPracticeAgain, onNewRole,
}: {
  result: RoomResult;
  report: InterviewReport | null;
  reportStatus: ReportStatus;
  reportError: string | null;
  isSample: boolean;
  onPracticeAgain: () => void;
  onNewRole: () => void;
}) {
  const answered = result.turns.filter((t: TranscriptTurn) => t.speaker === "user" && t.isFinal && t.text).length;

  return (
    <section className="stage" aria-labelledby="feedback-title">
      <div className="stage-heading">
        <div>
          <span className="section-kicker">04 / REVIEW</span>
          <h2 id="feedback-title">Your interview review.</h2>
          <p>Review the report when available, then revisit the full transcript below.</p>
        </div>
        <span className="heading-decoration" aria-hidden="true">✦</span>
      </div>

      <div className="feedback-grid">
        <div className="feedback-main">
          {reportStatus === "loading" && (
            <div className="report-state" role="status" aria-live="polite">
              <span className="report-spinner" aria-hidden="true" />
              <div><strong>Preparing your report…</strong><p>Reviewing the answers and evidence from this practice session.</p></div>
            </div>
          )}
          {reportStatus === "error" && (
            <div className="report-state report-state-error" role="alert">
              <strong>Report unavailable</strong>
              <p>{reportError ?? "We could not prepare feedback for this session. Your transcript is still available below."}</p>
            </div>
          )}
          {reportStatus === "ready" && report && <Report report={report} isSample={isSample} />}
          <div className="feedback-intro">
            <div className="feedback-orb">↗</div>
            <div>
              <span className="mini-label">PRACTICE RECAP</span>
              <h3>{result.endReason === "time-limit" ? "Time's up — nice work." : "Interview complete."}</h3>
              <p>{result.turns.length} turns captured · {answered} complete answers</p>
            </div>
          </div>
          <section className="report-transcript-section" aria-label="Full transcript">
            <div className="report-transcript-heading"><h3>Full transcript</h3><span>{result.turns.length} turns</span></div>
            <div className="transcript feedback-transcript">
              {!result.turns.length && <p className="report-empty">No transcript turns were captured.</p>}
              {result.turns.map((turn) => (
                <div key={turn.id} className={"turn " + (turn.speaker === "interviewer" ? "interviewer" : "candidate")}>
                  <div className="turn-label">
                    {turn.speaker === "interviewer" ? "Interviewer" : "You"} · {turn.id}
                    {(!turn.isFinal || turn.interrupted) && <span className="turn-flags">{turn.interrupted ? "interrupted" : "incomplete"}</span>}
                  </div>
                  <div className="bubble">{turn.text || "…"}</div>
                </div>
              ))}
            </div>
          </section>
          <div className="stage-actions">
            <button type="button" className="button button-primary" onClick={onPracticeAgain}>Practice again <span aria-hidden="true">→</span></button>
            <button type="button" className="text-button" onClick={onNewRole}>Practice another role</button>
          </div>
        </div>
        <aside className="feedback-side">
          <span className="mini-label">{isSample ? "SAMPLE EVALUATION" : "EVALUATION STATUS"}</span>
          <h3>Keep practicing.</h3>
          <p>{isSample ? "The example feedback reflects scripted answers and example code evidence." : "Evidence-based feedback for live sessions is not connected yet. Your transcript remains available for review."}</p>
          <div className="aside-rule" />
          <p className="disclaimer">{PRACTICE_DISCLAIMER}</p>
          <p className="disclaimer">{COMPANY_STYLE_DISCLAIMER}</p>
        </aside>
      </div>
    </section>
  );
}
