# Company Interview Styles (v1)

> Owner: Lisa (content). Used by: Jerry, to adjust the interviewer and the Interview Plan when the user picks a company style.
> Applies to both interviewer personas (`content/interviewer-technical.md`, `content/interviewer-behavioral.md`). A style changes **focus areas, follow-up strategy, and evaluation emphasis**, not the interviewer's personality or voice.
> **Product disclaimer (show on the page):** `Unofficial company-style practice; not affiliated with or endorsed by the named companies.`
> All questions below are original practice questions written for MockMate. They are not copied from any company or from candidate reports.

---

## Styles in this file

| Style | Status | Best fit |
|---|---|---|
| **General Tech** | P0 (default) | Any software, ML, or data role |
| **Amazon-style** | P0 | Roles where ownership, customer focus, and measurable results matter; strong behavioral emphasis |
| **Google-style** | Optional (only if time allows, brief 9.2) | Problem-solving and reasoning focus; notes in `research/google-style-research.md` |

---

## 1. General Tech (default)

### 1.1 Sources

| # | Source | Type | URL | Accessed |
|---|---|---|---|---|
| G1 | Google re:Work — A guide to structured interviewing | Official hiring-practice guide | https://rework.withgoogle.com/intl/en/guides/a-guide-to-structured-interviewing-for-better-hiring-practices | 2026-10-23 |
| G2 | Google Careers — Interviewing at Google: Best practices, advice, and tips | Official candidate guide | https://www.google.com/about/careers/applications/interview-tips/ | 2026-10-23 |

General Tech is not tied to one company. It follows widely used structured-interview practice: the same core questions for everyone, predetermined follow-ups, and a clear rubric (G1). It also follows the common expectation that candidates explain their thinking and back claims with data (G2).

### 1.2 Focus areas

1. The candidate's real project: what they built and why.
2. Core technical knowledge from the job description.
3. How they measured results and handled failures.
4. Trade-offs and clear communication.

### 1.3 Follow-up strategy

- Ask "why" after every technical choice.
- Ask "how do you know?" after every claimed result.
- Ask for one concrete example when an answer is general.
- Balanced: roughly 70% technical, 30% collaboration in `Technical` mode.

### 1.4 Evaluation emphasis

All five dimensions in the rubric are weighted equally (`content/rubric-technical.md`, `content/rubric-behavioral.md`).

### 1.5 Original practice questions

| # | Mode | Question | Targets |
|---|---|---|---|
| GT1 | Technical | "Walk me through the project on your resume you know best, from the problem to the result." | Implementation Understanding, Clarity |
| GT2 | Technical | "Which part of that project would you redesign today, and why?" | Trade-off Reasoning, Depth |
| GT3 | Technical | "How did you test that your project works correctly?" | Depth, Accuracy |
| GT4 | Technical | "Explain one concept from this job description that you've used in practice, as if I were a new teammate." | Accuracy, Clarity |
| GT5 | Behavioral | "Tell me about a time you had to learn a new tool or skill quickly to finish something." | Specificity, Actions/Results |
| GT6 | Behavioral | "Tell me about a time you received feedback you disagreed with." | Ownership, Clarity |

---

## 2. Amazon-style

### 2.1 Sources

| # | Source | Type | URL | Accessed |
|---|---|---|---|---|
| A1 | Amazon Jobs — Leadership Principles | Official | https://www.amazon.jobs/content/en/our-workplace/leadership-principles | 2026-10-24 |
| A2 | Amazon Jobs — Interviewing at Amazon (hub page) | Official | https://www.amazon.jobs/content/en/how-we-hire/interviewing-at-amazon | 2026-10-24 |
| A3 | Amazon Jobs — Interview prep for technical roles (university) | Official | https://amazon.jobs/content/en/how-we-hire/university/additional-tech | 2026-10-24 |

### 2.2 What Amazon's official pages say (summary, in our words)

- **Behavioral focus:** Amazon's interviews focus heavily on how candidates have shown the Leadership Principles in past work, because past behavior is treated as a predictor of future performance. (A3)
- **No brain teasers:** interviewers probe what you did, how, and why you made your decisions. (A3)
- **STAR:** Amazon recommends structuring answers as Situation, Task, Action, Result. (A3)
- **Depth over breadth:** each interviewer typically asks two or three questions about a success or a challenge. (A3)
- **Early-career format:** for full-time university roles, one 45–60 minute interview first, then three or four more. Technical roles mix verbal and coding exercises. (A3)
- **Leadership Principles:** a published list of 16 principles. (A1) The ones most relevant to an early-career engineer:

| Principle (A1) | What it means for our interviewer (our paraphrase) |
|---|---|
| Customer Obsession | Start from the user's needs; earn their trust. |
| Ownership | Act like an owner; take responsibility beyond your own task. |
| Dive Deep | Know the details; question metrics and anecdotes. |
| Deliver Results | Deliver the important things, on time and well. |
| Bias for Action | Move quickly on reversible decisions; take calculated risks. |
| Learn and Be Curious | Keep learning and exploring. |
| Have Backbone; Disagree and Commit | Challenge decisions respectfully, then fully commit. |
| Insist on the Highest Standards | Keep the quality bar high; fix problems for good. |

### 2.3 Focus areas

1. Past behavior mapped to principles (Ownership, Customer Obsession, Deliver Results, Dive Deep first).
2. Measurable results: numbers, deadlines, and impact on users.
3. The candidate's own decisions and the reasons behind them.

### 2.4 Follow-up strategy

- **Go deep on fewer stories:** 2–3 follow-ups per story, instead of covering many topics.
- Always ask for the **customer or user** in the story: "Who was this for?"
- Always ask for **data**: "What was the measurable result?"
- Probe **"I" vs. "we"**: "What did you decide, personally?"
- Probe **trade-offs under time pressure**: "What did you choose not to do?"
- In `Technical` mode, add a short behavioral question tied to the project ("Tell me about a deadline you nearly missed on this project").
- The interviewer still **does not teach STAR** during the interview (persona rule). STAR advice goes in the report only.

### 2.5 Evaluation emphasis

- **Behavioral mode:** extra weight on `Ownership` and `Actions / Results`. In the report, name the most relevant principle (for example "This story shows Ownership"), and never claim it is Amazon's official assessment.
- **Technical mode:** extra weight on `Depth` (Dive Deep) and `Trade-off Reasoning`.

### 2.6 Original practice questions

| # | Mode | Question | Principle (A1) |
|---|---|---|---|
| AZ1 | Behavioral | "Tell me about a time you changed your plan because of what a user actually needed." | Customer Obsession |
| AZ2 | Behavioral | "Tell me about a time you fixed a problem that wasn't assigned to you." | Ownership |
| AZ3 | Behavioral | "Tell me about a time you had to make a decision quickly without all the information." | Bias for Action |
| AZ4 | Behavioral | "Tell me about a time you disagreed with a decision, but still had to support it." | Have Backbone; Disagree and Commit |
| AZ5 | Technical | "Tell me about a number in your project that turned out to be misleading. How did you find out?" | Dive Deep |
| AZ6 | Technical | "Tell me about a time you shipped something on a tight deadline. What did you leave out, and why?" | Deliver Results |

---

## 3. Google-style (optional)

Only build this if time allows (brief 9.2). Summary from `research/google-style-research.md` (official Google sources, accessed 2026-10-23):

- **Focus:** problem solving and reasoning, role-related knowledge, and emergent leadership (leading without a title).
- **Follow-up strategy:**
  - Open with slightly ambiguous prompts and reward clarifying questions.
  - Probe assumptions, alternatives, scale ("what changes at 100x?"), and how success is measured.
- **Question formats:** behavioral ("Tell me about a time...") and hypothetical ("How would you approach...").
- **Evaluation emphasis:** `Depth`, `Trade-off Reasoning`, and `Clarity` (thinking out loud).
- **Original questions:** see section 4 of `research/google-style-research.md`.

---

## 4. How styles change the interview (summary for Jerry)

| | General Tech | Amazon-style | Google-style (optional) |
|---|---|---|---|
| Main focus | Project + core skills | Past behavior + principles + results | Problem solving + reasoning |
| Follow-ups per question | 1–2 | 2–3 (deeper, fewer stories) | 1–2, focused on assumptions and scale |
| Signature follow-up | "Why?" / "How do you know?" | "What was the measurable result?" / "What did *you* decide?" | "What are you assuming?" / "What changes at 100x?" |
| Report emphasis | All dimensions equal | Ownership, Actions/Results, Depth | Depth, Trade-offs, Clarity |
