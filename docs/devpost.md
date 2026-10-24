# Devpost Submission Text (DRAFT v1)

> Owner: Lisa. Draft written 2026-10-24 from the planned features.
> Before submitting (Sunday, by 16:00 ET):
> - Delete or reword anything that was not actually built.
> - Fill in the `[TODO]` items with real details from Jerry and Yuki.
> - Confirm the AI-assistance disclosure requirement with the organizers (brief section 8, P0-A).

---

**Project name:** MockMate AI

**Tagline:** Practice for the Company, Prove Your Skills. A voice AI mock interviewer that studies your real code before it asks you questions.

## Inspiration

As students preparing for technical interviews, we noticed that the hardest questions are never "what is X?" They are "why did *you* do it this way?" Real interviewers dig into your own projects: your model choice, your bugs, your trade-offs. Existing AI mock interview tools can generate questions from a job description, but they don't look at your actual work, so their feedback stays generic. We wanted a practice partner that reads your project first, the way a good interviewer would.

## What it does

- You paste a job description, upload your resume, and add a public GitHub repository.
- MockMate reads the repository's README and selected source files, and shows exactly which files it inspected.
- It prepares a structured interview plan that links each question to the job's requirements and to real details in your code. Before the interview you see the focus areas and the code files behind them; the exact questions stay private until you start.
- A voice AI interviewer, Albert, runs a real-time spoken interview. You can interrupt him, ask him to repeat, and he follows up on what you actually said.
- You can practice in **Technical** or **Behavioral** mode, with **General Tech** or **Amazon-style** focus (unofficial practice styles).
- After the interview, a separate AI produces an evidence-based report. Every comment quotes your words from the transcript and, for project facts, cites the repository file. Where there isn't enough evidence, the report says so instead of guessing. A provisional 0–100 practice score appears only when enough dimensions are backed by evidence, and it shows what it is based on.

## How we built it

- **Web app:** Next.js, React, TypeScript, and Tailwind, deployed on Vercel.
- **Voice:** OpenAI Realtime API over WebRTC, using its unified interface. The browser sends its connection offer to our server, which adds the interviewer instructions and forwards it to OpenAI, so the browser never receives an API key or any session credential.
- **Session timing:** the model has no clock, so the app sends timed system notes that tell the interviewer to wrap up and close before the 5-minute limit.
- **Analysis and feedback:** OpenAI text models with structured, schema-validated JSON outputs for the candidate profile, interview plan, and report.
- **Code evidence:** the GitHub REST API reads a limited set of files from public repositories, pinned to a specific commit, and every piece of evidence records the repository, commit, and file path.
- **Content:** we wrote the interviewer personas, scoring rubrics, and company-style guides ourselves. Company styles are based on official public company pages.
- **AI assistance:** we used AI coding assistants during development. [TODO: adjust wording to the organizers' disclosure requirement.]
- [TODO: Jerry adds any technical details that changed during the build.]

## Challenges we ran into

- [TODO: fill in real challenges.] Candidates:
  - Getting reliable real-time voice: microphone permissions, interruptions, and keeping the transcript in order.
  - Keeping the AI honest: it may only mention code it actually read.
  - Fitting repository analysis within time and size limits.
  - Making the interviewer feel human (follow-ups, tone) without letting it give hints.

## Accomplishments that we're proud of

- [TODO: confirm.] A full working loop: job description and code → interview plan → live voice interview → evidence-based report.
- Feedback that cites evidence, with a practice score shown only when there is enough evidence to support it.
- An interviewer with a consistent personality who asks real follow-up questions.

## What we learned

- [TODO: each teammate adds one real lesson.]
- Good feedback needs evidence. Showing *why* matters more than giving a number.
- Real-time voice brings its own engineering problems (latency, interruptions, cost).

## What's next for MockMate AI

- More company styles and a larger question bank with documented sources.
- Code snippets in the report, with links to the exact lines on GitHub.
- A second practice round focused on each candidate's weakest areas.
- Saved history and account-based data deletion.

## Disclaimers

- `Practice feedback only — not an employer evaluation or hiring prediction.`
- `Unofficial company-style practice; not affiliated with or endorsed by the named companies.`

## Links

- Live demo: [TODO]
- GitHub repository: [TODO]
- Demo video: [TODO]
