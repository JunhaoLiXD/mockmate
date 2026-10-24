# Technical Interview Rubric (v1)

> Owner: Lisa (content). Used by: Jerry, as the evaluator model's grading guide for `Technical` mode reports.
> Based on brief section 7 (Technical Interview) and section 4.3 (`InterviewReport`).
> This is practice feedback only, not an employer evaluation or hiring prediction.

---

## 1. How to use this rubric

1. **Judge only what was said.** Use the transcript, plus repository evidence that was actually inspected. Never assume knowledge the candidate did not show.
2. **Every judgment needs evidence.**
   - Cite at least one transcript turn ID (for example `t-007`) with a short quote of the candidate's words.
   - When the judgment involves project facts, also cite the repository evidence (`repoUrl`, `commitSha`, `path`).
3. **Use one of four levels per dimension:** `Strong`, `Medium`, `Weak`, or `Insufficient evidence`.
4. **"Not mentioned" is not "doesn't know".** If the interview never gave the candidate a chance to show a dimension, mark it `Insufficient evidence`. Do not mark it `Weak`.
5. **Ignore unfinished turns.** Turns marked `isFinal = false` (cut off or incomplete) are not complete answers. Do not grade them as if they were.
6. **Transcription can be imperfect.** Do not penalize odd words that look like speech-to-text errors; mention uncertainty instead.
7. **Numeric scores are optional.** If used, map Strong = 3, Medium = 2, Weak = 1, and never give a number for `Insufficient evidence`. Never produce an overall "hire / no hire" verdict.

## 2. Dimensions

### 2.1 Accuracy

*Are the candidate's technical statements correct?*

| Level | What it looks like |
|---|---|
| **Strong** | Technical statements are correct and precise. Terms are used correctly. When unsure, the candidate says so instead of guessing. |
| **Medium** | Mostly correct, with minor imprecision or one small error that doesn't change the main point. |
| **Weak** | Contains a clear factual error about a core concept, or confidently states something false. |

### 2.2 Depth

*Does the candidate go beyond surface-level description?*

| Level | What it looks like |
|---|---|
| **Strong** | Explains *why*, not just *what*. Discusses edge cases, failure modes, limitations, or how results were measured, without being pushed. |
| **Medium** | Explains the main idea and some reasoning, but needs follow-up questions to reach details. |
| **Weak** | Stays at buzzword or summary level, even after follow-up questions. |

### 2.3 Implementation Understanding

*Does the candidate understand how their own project actually works?*

| Level | What it looks like |
|---|---|
| **Strong** | Describes their own code and design accurately, and it matches the inspected repository evidence. Clearly separates their own work from libraries or teammates' work. Can explain specific choices in the code. |
| **Medium** | Describes the overall design correctly, but is vague about specific parts, or is unsure which parts they personally built. |
| **Weak** | Description conflicts with the inspected code, or they cannot explain parts of the project they claim to have built. |

> If the candidate describes something not found in the inspected files, record it as "not found in the inspected files", not as a contradiction. The analysis only covers some files.

### 2.4 Trade-off Reasoning

*Does the candidate weigh alternatives and costs?*

| Level | What it looks like |
|---|---|
| **Strong** | Names realistic alternatives and explains why they chose one, including what they gave up (speed vs. quality, simplicity vs. flexibility, cost vs. accuracy). Can say what would change their decision. |
| **Medium** | Mentions an alternative or a downside, but the reasoning is incomplete or only appears after prompting. |
| **Weak** | Presents choices as the only option ("I just used it because everyone does"), with no awareness of costs. |

### 2.5 Clarity

*Can a listener follow the explanation?*

| Level | What it looks like |
|---|---|
| **Strong** | Organized and easy to follow: starts with the main point, then adds detail. Explains jargon when needed. Answers the question that was asked. |
| **Medium** | Understandable, but wanders, repeats, or takes a while to reach the point. |
| **Weak** | Hard to follow, answers a different question, or relies on jargon without explanation. |

## 3. What to write for each dimension

Use this structure (it matches the report page):

- **What you demonstrated:** the specific strength, with a turn ID and a short quote.
- **What remains unclear:** what the interview could not confirm, or where the answer stopped short.
- **Why it matters for this job:** link to a requirement in the job description.
- **Suggested stronger explanation:** how the candidate could explain it better next time. This is advice, not a model answer written in the candidate's voice.
- **Next practice question:** one specific question to practice.

## 4. Example (illustrative only)

> **Trade-off Reasoning: Medium**
> - **What you demonstrated:** In `t-009` you said "I picked Zero-DCE because it doesn't need paired training data," which shows you considered data availability.
> - **What remains unclear:** You didn't say what you gave up compared with the classical methods (for example speed or control over the output).
> - **Why it matters for this job:** The job description asks for "choosing methods that work on real lab data under time limits."
> - **Suggested stronger explanation:** Name one alternative, one cost of your choice, and what result would make you switch.
> - **Next practice question:** "When would a classical method like CLAHE be a better choice than a neural network?"
> - **Evidence:** `t-009`; `vision-enhance-platform` @ `<commitSha>` `src/backend/engine/plugins/` (Zero-DCE plugin).

## 5. Required disclaimer in every report

`Practice feedback only — not an employer evaluation or hiring prediction.`
