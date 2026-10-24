# MockMate

**Practice for the company, prove your skills.**
A project-aware, company-style AI mock interviewer that studies your work before asking you questions.

> Work in progress for UF Gator Hack V 2026. A full README (features, how it works, limitations, privacy) is coming before submission.

## Status

| Part | State |
|---|---|
| Live voice interview (OpenAI Realtime over WebRTC) | Working |
| Four-step web flow: Prepare, Plan, Interview, Review | Working |
| Repository and resume analysis, interview plan | Working |
| Evidence-based feedback report | API in progress; the review page shows a sample report with `?mock=1` |

## Known limitations

- **Evidence in reports comes from the browser.** The API is stateless, so `/api/report` receives the plan and code evidence from the browser and cannot re-check them against GitHub. Quotes are verified against the transcript, but a user who edits the request can change the code evidence in their own report.
- Rate limits are per server instance and reset on cold starts, so they are best effort.
- Transcripts are machine-generated; reports flag possible transcription errors instead of penalizing them.

## Run locally

Requires Node.js 24 and npm.

```bash
npm install
cp .env.example .env.local   # then fill in values; never commit .env.local
npm run dev
```

Open http://localhost:3000. Add `?mock=1` to the URL to use a scripted interview with no microphone or API calls.

## Repository layout

| Path | Contents |
|---|---|
| `app/` | Pages and API routes (`app/api/`) |
| `components/mockmate/` | UI for the four interview steps |
| `lib/` | Server logic and the browser voice client (`lib/voice/`) |
| `types/` | Shared data contracts |
| `mocks/` | Sample data and a mock voice session for UI work |
| `content/` | Interviewer personas, rubrics, company styles and demo materials |
| `docs/` | Requirements brief, release checklist and submission drafts |

Contributor and agent rules are in [`AGENTS.md`](AGENTS.md).

## Team

Jerry (backend, voice, integration), Yuki (frontend design and QA), Lisa (product, content, pitch).
