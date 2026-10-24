import type { TranscriptTurn } from "@/types";
import { COMPANY_STYLE_DISCLAIMER, PRACTICE_DISCLAIMER } from "@/types";
import type { RoomResult } from "./LiveRoom";

/**
 * Review step. Shows the captured transcript now; the evidence-based report (M4) plugs in here.
 */
export function FeedbackStep({
  result,
  onPracticeAgain,
  onNewRole,
}: {
  result: RoomResult;
  onPracticeAgain: () => void;
  onNewRole: () => void;
}) {
  const answered = result.turns.filter((t: TranscriptTurn) => t.speaker === "user" && t.isFinal && t.text).length;

  return (
    <section className="stage" aria-labelledby="feedback-title">
      <div className="stage-heading">
        <div>
          <span className="section-kicker">04 / REVIEW</span>
          <h2 id="feedback-title">Review your interview.</h2>
          <p>Your full transcript, with every turn labeled.</p>
        </div>
        <span className="heading-decoration" aria-hidden="true">
          ✦
        </span>
      </div>

      <div className="notice">
        <span>✳</span>
        <p>
          <strong>Feedback report coming next.</strong> Evidence-based feedback that quotes your answers and the code we
          inspected is being connected. Below is your transcript from this session.
        </p>
      </div>

      <div className="feedback-grid">
        <div className="feedback-main">
          <div className="feedback-intro">
            <div className="feedback-orb">↗</div>
            <div>
              <span className="mini-label">PRACTICE RECAP</span>
              <h3>
                {result.endReason === "time-limit" ? "Time's up — nice work." : "Interview complete."}
              </h3>
              <p>
                {result.turns.length} turns captured · {answered} complete answers
              </p>
            </div>
          </div>
          <div className="transcript feedback-transcript">
            {result.turns.map((turn) => (
              <div key={turn.id} className={`turn ${turn.speaker === "interviewer" ? "interviewer" : "candidate"}`}>
                <div className="turn-label">
                  {turn.speaker === "interviewer" ? "Interviewer" : "You"} · {turn.id}
                  {(!turn.isFinal || turn.interrupted) && (
                    <span className="turn-flags">{turn.interrupted ? "interrupted" : "incomplete"}</span>
                  )}
                </div>
                <div className="bubble">{turn.text || "…"}</div>
              </div>
            ))}
          </div>
          <div className="stage-actions">
            <button type="button" className="button button-primary" onClick={onPracticeAgain}>
              Practice again <span aria-hidden="true">→</span>
            </button>
            <button type="button" className="text-button" onClick={onNewRole}>
              Practice another role
            </button>
          </div>
        </div>
        <aside className="feedback-side">
          <span className="mini-label">EVALUATION STATUS</span>
          <h3>Keep practicing.</h3>
          <p>The AI report will rate each skill only where your answers give enough evidence, and say what is unclear.</p>
          <div className="aside-rule"></div>
          <p className="disclaimer">{PRACTICE_DISCLAIMER}</p>
          <p className="disclaimer">{COMPANY_STYLE_DISCLAIMER}</p>
        </aside>
      </div>
    </section>
  );
}
