# Demo Script (DRAFT v1)

> Owner: Lisa. Target length: 3:00 or less (brief section 13).
> Draft written 2026-10-24 from the planned features. Before recording on Sunday, update every on-screen step to match the real app.
> Demo inputs: `content/demo/job-description.txt`, `content/demo/resume.txt`, repository `https://github.com/JunhaoLiXD/Biohub_Cell_Tracking` (Jerry's project, chosen by Jerry for the demo). "Try sample details" on the form fills in all three.
> Narration is about 240 words (about 1:45 at a normal speaking pace), which leaves about 1:15 for the live voice clip and on-screen actions.

---

## 0:00–0:30 The problem and our difference

**On screen:** MockMate landing page.

**Narration:**
"Technical interviews don't stop at 'what is a CNN.' They ask why *you* chose your model, how *you* debugged it, and what *you* would change in your own code. AI mock interview tools can already turn a job description into questions. But they don't look at your actual project. MockMate does. It studies your real code before it interviews you."

## 0:30–1:00 Upload and project evidence

**On screen:**
1. Paste the demo job description: Computer Vision Engineer at Quillmoor Biosciences.
2. Upload the demo resume.
3. Paste the GitHub link. Choose `Technical` and `General Tech`. Click "Build my practice plan".
4. Show the plan page: the inspected files and the focus areas, each with the code files behind it. The exact questions stay private until the interview.

**Narration:**
"Here's Jordan, a new graduate applying for a computer vision role. Jordan adds the job description, a resume, and a public GitHub project. MockMate reads the repository and shows exactly which files it inspected. Every focus area is tied to the job and to real code, like this one from Jordan's 3D cell-tracking project. The exact questions stay private until the interview starts, just like a real one."

## 1:00–2:10 Live voice interview

**On screen:** the interview room. Albert greets, asks about the project, and the candidate answers. Show **one real follow-up** and **one interruption**.

**Narration (short, over the start of the clip):**
"Meet Albert, our interviewer. He's warm for exactly one sentence."

*(Let the live audio play. Make sure the clip includes:)*
- Albert asking about the project.
- A follow-up built on the candidate's own words (for example, "You said it 'mostly worked.' How did you measure that?").
- The candidate interrupting Albert, and Albert stopping to listen.

**Narration (after the clip):**
"Notice he didn't just move to the next question. He followed up on what Jordan actually said."

## 2:10–2:40 Evidence-based report

**On screen:** End the interview, then show the report page. Show the practice score at the top, then highlight one dimension with a transcript quote and a file path.

**Narration:**
"When the interview ends, a separate AI writes the feedback. The practice score only appears when there is enough evidence, and it says what it's based on. Every comment quotes the candidate's own words and, for project facts, points to the exact file. If the evidence isn't there, the report says so instead of guessing. It ends with what to practice next."

## 2:40–3:00 How it's built, cost, privacy, limits

**On screen:** a simple architecture slide or the README.

**Narration:**
"Under the hood, MockMate uses OpenAI's real-time voice API over WebRTC. API keys stay on the server, and sessions are short to control cost. Nothing is stored on our servers, and audio is never saved. It's practice feedback, not a hiring prediction. MockMate: practice for the company, prove your skills."

---

## Recording checklist

- [ ] Quiet room; headphones on, so the AI's voice doesn't echo into the mic.
- [ ] Browser zoom so the text is readable in the video; close other tabs and notifications.
- [ ] Do one full rehearsal and time the narration (must be 3:00 or less).
- [ ] Record at least one backup take.
- [ ] Make sure no API key, `.env` file, or personal information appears on screen.
- [ ] Show the disclaimers: `Practice feedback only — not an employer evaluation or hiring prediction.`
