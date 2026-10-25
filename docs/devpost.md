# Devpost Submission Text (DRAFT v2)

> Owner: Jerry (taken over from Lisa's draft v1). v2 updated 2026-10-24 against the deployed app.
> Before submitting (Sunday, by 16:00 ET):
> - Fill in the remaining `[TODO]` items: the demo video link and one lesson per teammate.
> - Make the GitHub repository public before posting its link.
> - Check the AI-assistance wording against any format the organizers require.

---

**Project name:** MockMate AI

**Tagline:** Practice for the Company, Prove Your Skills. A voice AI mock interviewer that studies your real code before it asks you questions.

## Inspiration

As students preparing for technical interviews, we noticed that the hardest questions are never "what is X?" They are "why did *you* do it this way?" Real interviewers dig into your own projects: your model choice, your bugs, your trade-offs. Existing AI mock interview tools can generate questions from a job description, but they don't look at your actual work, so their feedback stays generic. We wanted a practice partner that reads your project first, the way a good interviewer would.

## What it does

- You paste a job description, upload your resume, and optionally add a public GitHub repository. If you leave it blank, MockMate uses the first repository link in your resume.
- MockMate reads the repository's README and selected source files, and shows exactly which files it inspected.
- It prepares a structured interview plan that links each question to the job's requirements and to real details in your code. Before the interview you see the focus areas and the code files behind them; the exact questions stay private until you start.
- A voice AI interviewer, Albert, runs a real-time spoken interview. He starts by asking you to introduce yourself, then works through the plan. You can interrupt him, ask him to repeat, and he follows up on what you actually said.
- You can practice in **Technical** or **Behavioral** mode, with **General Tech** or **Amazon-style** focus (unofficial practice styles), in a quick 5-minute session or a fuller 15-minute interview.
- After the interview, a separate AI produces an evidence-based report. Every comment quotes your words from the transcript and, for project facts, cites the repository file. Where there isn't enough evidence, the report says so instead of guessing. A provisional 0–100 practice score appears only when enough dimensions are backed by evidence, and it shows what it is based on.

## How we built it

- **Web app:** Next.js, React, TypeScript, and Tailwind, deployed on Vercel.
- **Voice:** OpenAI Realtime API over WebRTC, using its unified interface. The browser sends its connection offer to our server, which adds the interviewer instructions and forwards it to OpenAI, so the browser never receives an API key or any session credential.
- **Session timing:** the model has no clock, so the app sends timed system notes that tell the interviewer to wrap up and close before the time limit. If the candidate stays silent for about 10 seconds, another note tells the interviewer to check in, then move on.
- **Analysis and feedback:** OpenAI text models with structured, schema-validated JSON outputs for the candidate profile, interview plan, and report.
- **Code evidence:** the GitHub REST API reads a limited set of files from public repositories, pinned to a specific commit, and every piece of evidence records the repository, commit, and file path.
- **Verified quotes:** the server gives every piece of evidence an ID and checks every quote in the report against the candidate's own transcript turns. A dimension whose quotes can't be verified is marked "insufficient evidence" instead of being scored.
- **Resumes:** PDF text is extracted on the server; the file type, size and page count are checked first.
- **Content:** we wrote the interviewer personas, scoring rubrics, and company-style guides ourselves. Company styles are based on official public company pages.
- **Abuse and cost protection:** API keys stay on the server, every paid route has input limits and per-IP rate limits, and kill switches can pause AI calls and voice sessions.
- **AI assistance:** we used AI coding assistants (Claude Code and OpenAI Codex) to help write, review and debug code during the hackathon. We reviewed AI-assisted changes before committing them, and all project code was written during the official coding window.

## Challenges we ran into

- **Keeping the AI honest.** Models like to sound confident. We made the server issue every evidence ID and verify every quote, so the plan and report can only cite code the app actually read and words the candidate actually said.
- **An interviewer that sounds human.** Early versions read file paths aloud. We now give the voice model plain-English descriptions of the code instead, and it asks about decisions and trade-offs rather than file names.
- **Time awareness.** The voice model can't see a clock, so it had no way to pace an interview, or to tell a thinking pause from a candidate who froze. Timed system notes now tell it when to wrap up and when to close, silence notes tell it when to check in or move on, and the app ends the call after its last sentence.
- **Real-time voice details.** Interruptions, keeping both sides of the transcript in order, and releasing the microphone on every exit path took several rounds of testing.
- **Reading real repositories.** Large trees, binary files, UTF-16 text files and GitHub rate limits all needed handling, within strict size limits so analysis stays fast and cheap.
- **Making the repository optional.** Not every candidate has a public project ready. MockMate now falls back to a link in the resume, or to the resume and job description alone, and tells the user which one it used.

## Accomplishments that we're proud of

- A full working loop on the live site: job description and code → interview plan → live voice interview → evidence-based report.
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

- Live demo: https://mockmate-tan.vercel.app/
- GitHub repository: https://github.com/JunhaoLiXD/mockmate
- Demo video: [TODO]
