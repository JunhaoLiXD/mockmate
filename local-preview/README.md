# MockMate local preview

A buildless, dependency-free interactive prototype of the four-step MockMate experience.

## Run

From this directory:

```sh
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000). Camera and microphone access requires browser permission and a secure context such as localhost or HTTPS. The optional web font requires internet access; system fonts are the fallback.

## Demo scope

Prepare accepts a job description, pasted resume or PDF filename, public GitHub URL, company style, interview focus, and difficulty. Plan shows three skill areas without revealing the prompts. Select **Enter Interview Meeting** to open a Zoom-like room. After camera and microphone permission, a visible 3–2–1 countdown automatically starts one continuous local recording of the candidate's camera and microphone. The room has microphone and camera toggles, a timer, three scripted questions, and an End meeting button. Feedback replays the local recording. There is no video upload step.

The recording contains the candidate's camera and microphone, not the illustrated interviewer or full meeting screen. It is held as a Blob in this tab's memory and disappears on reload. Camera and microphone tracks stop when the meeting ends or the page is left. No recording is sent to a server or saved to browser storage.

Form inputs are not analyzed. PDF content is not parsed, and GitHub is not fetched. Questions remain in client-side demo code; hiding them in Plan does not provide backend-only delivery. The illustrated coach does not speak. Live interviewer voice, transcription, AI scoring, and answer suggestions are pending integration. Form details stay in this browser tab via `sessionStorage`. The meeting room uses an original generated alligator illustration at `assets/coach-gator-v2.png`; it is not an official university mascot or logo.
