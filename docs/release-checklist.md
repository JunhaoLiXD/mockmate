# MockMate Release Checklist

This checklist is **report-only**. Whoever runs it lists what passed, what failed and what needs a human. Jerry decides on fixes and is the only person who integrates into `main`. Commits and pushes still follow `AGENTS.md` section 3.

Live site: https://mockmate-tan.vercel.app/

## When to run what

| When | Run |
|---|---|
| Before every push to `main` | [A. Quick check](#a-quick-check) |
| After any change to voice, prompts, persona or interview flow | [C. Voice regression](#c-voice-regression) |
| Milestones (M2, M3, M4), Sun 09:00 freeze check, Sun 12:00 feature freeze, Sun 15:00 final check | [A](#a-quick-check) + [B. Full check](#b-full-check) + [C](#c-voice-regression) |
| Voice is broken | [D. Voice diagnosis](#d-voice-diagnosis), starting from the symptom |

Sunday checks need a human reminder; nothing runs automatically.

**Milestone gates.** Items tagged **[M2]** or **[M4]** apply only once that feature uses real data. Until then, mark them `NOT YET`, never `PASS`. Today only `/api/session` is live; analysis and planning use sample data, and the review page shows the transcript only.

## Record every run

Copy this block into the PR, team chat or your notes. A result without these fields does not count. **Never paste raw secret-scan output, keys, `.env` contents or transcript text into a record**; give the file name and line only.

```text
Check:        A / B / C / D
Commit:       <short sha>
Deployment:   <URL tested>
Time (ET):    <yyyy-mm-dd hh:mm>
Tester:       <name>  (a human is required for C and the Golden Path)
Result:       PASS / FAIL / NEEDS HUMAN / NOT YET, one line per item that is not PASS
```

## Safe secret scans

These commands print **file names or counts only**, never matching text, and skip env files. Never open `.env` or `.env.local` to check them. If a scan finds something, report the file name, then decide with Jerry how to inspect it safely.

Pattern used below: `sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}`

**Git Bash**

```bash
P='sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}'
# Staged changes: count of matching added lines (expect 0)
git diff --cached -U0 | grep -E '^\+' | grep -cE "$P"
# Tracked files now: file names only
git grep -lIE "$P" -- . ':(exclude).env*'
# Every commit in history, one revision at a time: file names only
for rev in $(git rev-list --all); do git grep -lIE "$P" "$rev" -- . ':(exclude).env*'; done
# Build output: file names only
grep -rlE "$P" .next/static
# Tracked env files (expect only .env.example)
git ls-files | grep -i '\.env'
```

**PowerShell**

```powershell
$P = 'sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}'
(git diff --cached -U0 | Where-Object { $_ -like '+*' } | Select-String -Pattern $P).Count
git grep -lIE $P -- . ':(exclude).env*'
git rev-list --all | ForEach-Object { git grep -lIE $P $_ -- . ':(exclude).env*' }
Get-ChildItem .next/static -Recurse -File | Select-String -Pattern $P -List | Select-Object -ExpandProperty Path
git ls-files | Select-String -Pattern '\.env'
```

---

## A. Quick check

Run locally on the branch you want to push.

- [ ] `npx tsc --noEmit` passes.
- [ ] `npm run lint` passes with no new warnings.
- [ ] `npm run build` passes.
- [ ] `git status` is clean except for files you intend to commit.
- [ ] Safe scans: the staged-diff count is 0, and only `.env.example` is tracked among env files.
- [ ] All new text in code, UI, comments and commit messages is English.
- [ ] The commit author is a real team member and there is no AI `Co-Authored-By` trailer.

## B. Full check

### B1. Secrets and configuration

- [ ] Safe scans over tracked files, full history and `.next/static` return no file names (run `npm run build` first).
- [ ] No secret uses a `NEXT_PUBLIC_*` name (`git grep -n "NEXT_PUBLIC_"` shows names only, no values).
- [ ] Vercel environment variables exist for Production and Preview: `OPENAI_API_KEY` (Sensitive), `REALTIME_MODEL`, `TRANSCRIBE_MODEL`, `PLANNER_MODEL`, `EVALUATOR_MODEL`, `AI_ENABLED`, `VOICE_ENABLED`, plus `GITHUB_TOKEN` (Sensitive) **[M2]**. Confirm in the Vercel dashboard, not from code.
- [ ] OpenAI project: auto recharge is off, the budget and alert threshold are set, and the model allowlist covers exactly the configured models.

### B2. Paid routes and abuse protection

Run these for `/api/session` now, and for `/api/analyze`, `/api/plan` **[M2]** and `/api/report` **[M4]** as they ship, using each route's own limits.

**Prerequisite:** both switches are `true` and the server configuration is complete. Otherwise every request returns the switch or configuration error first, and the tests below prove nothing. Confirm with one same-origin malformed-JSON request returning 400.

- [ ] **Switches:** `AI_ENABLED=false` returns 503 `AI_DISABLED`; `VOICE_ENABLED=false` returns 503 `VOICE_DISABLED` on `/api/session`. Test locally or on a preview deployment, then restore.
- [ ] **Origin:** no `Origin` header returns 403, and a mismatched `Origin` (for example `https://example.com`) returns 403.
- [ ] **Body:** malformed JSON returns 400; a body over 64 KiB returns 413; an SDP that does not start with `v=0` or exceeds 20,000 characters returns 400; an invalid plan returns 400. None of these calls OpenAI.
- [ ] **Input limits (brief 5.3):** JD ≤ 10,000 chars, pasted resume ≤ 10,000 chars, PDF ≤ 2 MB and 5 pages **[M2]**; repo ≤ 15 files, 50 KB each, 200 KB total **[M2]**; report ≤ 60 turns **[M4]**.
- [ ] **Rate limits:** `/api/session` allows 3 sessions per IP per 10 minutes, then returns 429 with `Retry-After`. Test it with requests that pass validation but whose upstream call is expected to fail, or accept 3 real sessions. The global cap (150 per rolling 24 hours) is verified by code review only; do not create 150 paid sessions. Known limit: counters are per server instance (accepted in brief 5.3).
- [ ] **Logs:** server logs may contain missing variable names, exception names and up to 500 characters of OpenAI's error text. Confirm they never contain API keys, request bodies, SDP, resumes, transcripts or audio, and redact anything sensitive before sharing logs.

### B3. Untrusted input and evidence

- [ ] **[M2]** Only `https://github.com/<owner>/<repo>` URLs (optionally with a trailing slash) are accepted. Other hosts, `http`, credentials, ports, query strings, fragments and extra path segments are rejected.
- [ ] **[M2]** Repository content is fetched through the GitHub API only, never executed; binary and weight files are skipped.
- [ ] **[M2]** Resume uploads are validated on the server: PDF MIME type and file signature, size and page count.
- [ ] **[M2]** A prompt-injection line in a JD, resume or README ("ignore previous instructions…") does not change interviewer or report behavior.
- [ ] **[M2]** Every repository citation in the plan has a `repoUrl`, `commitSha` and `path` that exist on GitHub. Spot-check at least two.
- [ ] **[M4]** Every report quote cites a transcript turn ID from that session, and the quoted words appear in that turn.
- [ ] **[M4]** Incomplete turns (`isFinal: false`) are not judged as full answers.

### B4. Live site (human)

- [ ] Vercel shows the expected commit as the current Production deployment (check the dashboard or ask for a screenshot).
- [ ] The site loads over HTTPS in a fresh incognito window, with no console errors.
- [ ] **Golden Path (brief 11.4)**, done by a person with a real microphone and headphones on the public URL. Steps 1–2 and 5 are **[M2]** / **[M4]** gates; sample data does not count.
  1. Submit a legal JD, resume and the demo repo.
  2. See at least one technical question with a file-path citation.
  3. Start the interview and get at least one answer-driven follow-up.
  4. End the interview.
  5. See the report with quoted evidence.
- [ ] Disclaimers are visible: "Practice feedback only — not an employer evaluation or hiring prediction." and "Unofficial company-style practice; not affiliated with or endorsed by the named companies."
- [ ] The privacy notice says that inputs and interview audio are sent to OpenAI, a third-party AI service, and describes what MockMate stores (nothing on its servers) accurately.
- [ ] The page works at phone width without horizontal scrolling.
- [ ] Debug pages (for example `/dev/voice`) are removed or deliberately kept before the final submission.

### B5. Submission (Sunday)

- [ ] README covers features, tech stack, setup, usage, known limitations, privacy and security.
- [ ] The demo video is 3 minutes or less (or meets the format confirmed on Discord), with at least one backup recording.
- [ ] Demo data is fictional or used with permission: the sample JD and resume contain no real personal data, and the demo repository owner agrees to show it.
- [ ] Devpost: title, tagline, story sections, repo link, demo link, video, team members and prize categories are complete.
- [ ] Every team member is individually registered for the event and listed on Devpost.
- [ ] AI-assisted development is disclosed honestly in "How we built it" and wherever the organizers require.
- [ ] Claims in README and Devpost match the live site; nothing is described as "first" or "official".
- [ ] Dependency licenses are compatible (`npx license-checker --summary`, or review `package.json` dependencies by hand).
- [ ] The repository is public, and the public URL has the B2 protections before it is posted anywhere.
- [ ] Submitted before Sun 2026-10-25 16:00 ET (hard deadline 17:00).

## C. Voice regression

Run with a real microphone and headphones, locally first, then on the deployed URL. `?mock=1` does **not** count. Record each failure; do not skip it.

- [ ] **Start:** the browser asks for the microphone (or uses an existing permission), and the status pill shows `LIVE`, not `MOCK`.
- [ ] **Permission denied:** blocking the microphone shows a clear message; after allowing it again, "Try again" starts the interview.
- [ ] **First question:** the interviewer greets in one sentence and asks the first planned question.
- [ ] **Follow-up:** after a 20–30 second answer, the next question builds on something you actually said, without praise or hints.
- [ ] **Interruption:** speaking over the interviewer stops it quickly, and its unfinished turn is marked `interrupted`. Known limit: the turn keeps the text already generated, which can include words you did not hear; a turn that had already finished is not marked.
- [ ] **Repeat:** "Could you repeat that?" gets a short repeat.
- [ ] **Long silence:** after about 20 seconds of silence the session stays connected and the interviewer waits or offers to repeat.
- [ ] **Mute:** with the mic off, the interviewer does not react to speech; turning it back on resumes.
- [ ] **Transcript:** turn IDs go `t-001`, `t-002`, … in order with correct speakers; nothing is duplicated or reordered.
- [ ] **End:** "End interview" stops audio and the browser's microphone indicator turns off.
- [ ] **Restart:** "Practice again" starts a new session with an empty transcript beginning at `t-001`.
- [ ] **Disconnect:** turning the network off mid-interview shows a connection error, and the microphone is released.
- [ ] **Leave mid-interview:** navigating away or reloading releases the microphone.
- [ ] **Time limit:** the session ends by itself at the plan's limit (use a short test plan if needed).

## D. Voice diagnosis

Start from the symptom. Check the OpenAI docs before changing code, change one thing at a time, and finish with section C.

| Symptom | Start at |
|---|---|
| No microphone prompt, or `mic-denied` | 1 |
| Error right after allowing the microphone | 2 |
| `connecting` forever, or `CONNECTION_FAILED` | 3 |
| Connected but the interviewer never speaks | 4 |
| Interviewer speaks but nothing appears in the transcript | 5 |
| Cannot hear audio although the transcript updates | 6 |
| Interruption, mute or ending misbehaves | 7 |

1. **Microphone** (`lib/voice/useInterviewSession.ts`, `start`). The microphone is requested *before* any server call, so a permission failure produces no `/api/session` request. Check browser site permissions, that the page is HTTPS or localhost, and the OS input device.
2. **Session route** (`app/api/session/route.ts`). Check the HTTP status and error code in the browser network tab. 503 `AI_DISABLED` / `VOICE_DISABLED`: a switch is off. 500 "not configured": a missing env var (the server log names it, never its value). 429: rate limit. 502: the OpenAI call failed, timed out or was rejected; the server log shows the exception name or OpenAI's status and error text (redact before sharing).
3. **WebRTC** (`start` in the hook). The `oai-events` data channel must be created before the offer, and the SDP answer must start with `v=0`. Watch `connectionState`; networks that block UDP fail here, so try a phone hotspot.
4. **Events** (`/dev/voice` lists server event types). Expect `session.created`, then a `response.*` stream after the kickoff `response.create`. An `error` event names the rejected field, usually in the session config.
5. **Transcript** (`lib/voice/transcript.ts`). User text needs `conversation.item.input_audio_transcription.*` (requires `TRANSCRIBE_MODEL` on the OpenAI allowlist); interviewer text needs `response.output_audio_transcript.*`. Turns are keyed by `item_id`.
6. **Audio playback.** The remote track must attach to the audio element; autoplay can be blocked if `start` did not come from a click. Check output device and volume.
7. **Interruption, mute, end.** Interruption is detected from `input_audio_buffer.speech_started` and `response.done` with status `cancelled`; transcript text is not trimmed to the playback position. Mute disables the outgoing track only. End and unmount must stop all mic tracks and close the peer connection.

Never log API keys, SDP, transcript text or audio while debugging, and remove temporary logging before committing.
