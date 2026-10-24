<!--
DRAFT v1 (Lisa, 2026-10-24). Product sections for README.md.
Jerry merges these into README.md and adds the technical sections (architecture, setup, security).
Before submission (Sunday 09:00-12:00): check every feature below against the deployed app and delete anything that was not built.
-->

# MockMate AI

**Practice for the Company, Prove Your Skills.**
*A project-aware, company-style AI mock interviewer that studies your work before asking you questions.*

## The Problem

Technical interviews rarely stop at definitions. Interviewers ask *why* you chose a model, how you debugged a failure, and what you would change in your own code. Many AI mock-interview tools can already generate questions from a job description and run a voice conversation. But they rarely look at the candidate's actual projects, so the questions and feedback stay generic.

## What MockMate Does

1. **Reads your materials:** paste a job description, upload your resume (PDF or text), and add a public GitHub repository.
2. **Studies your project:** MockMate reads the repository's README, file structure, and a few key source files, and records exactly which files it inspected.
3. **Plans the interview:** it prepares questions linked to the job's requirements and to real details in your code. You can preview the plan before you start.
4. **Interviews you by voice:** a realistic AI interviewer talks with you in real time. You can interrupt, ask it to repeat, and it follows up on what you actually said.
5. **Gives evidence-based feedback:** after the interview, you get a report. Each point quotes your own words from the transcript and, for project facts, points to the file it came from.

## Features

- Two interview modes: **Technical** and **Behavioral**, with different questions and different scoring dimensions.
- Company styles: **General Tech** and **Amazon-style** practice. *(Unofficial; not affiliated with or endorsed by the named companies.)*
- Real-time voice conversation in the browser, with no app to install.
- A full transcript with clear speaker labels.
- Feedback by dimension: what you demonstrated, what remains unclear, why it matters for the job, how to explain it better, and a next practice question.
- Transparent analysis: you can see which repository files the AI inspected.

## How It Works (non-technical)

1. **Prepare:** MockMate pulls the key skills from the job description and the projects from your resume, then reads selected files from your repository.
2. **Plan:** an AI model writes a short, structured interview plan from those materials.
3. **Talk:** a voice AI runs the interview using the plan, choosing follow-ups based on your answers.
4. **Review:** a separate AI model grades the transcript against a written rubric and cites the evidence for every comment.

## Limitations

- **Practice only:** feedback is not an employer evaluation or a hiring prediction.
- **Limited code reading:** MockMate reads only a limited number of files from public repositories. If something isn't found in the inspected files, that doesn't mean you didn't build it.
- **Imperfect transcription:** speech-to-text can make mistakes, especially with technical terms or accents, and this can affect feedback.
- **Company styles are approximations:** they are based on public, official company pages, not on any real company's internal process or question bank.
- **Session length:** sessions are short (about 5 minutes) to control cost.
- **Supported inputs:** English only. Resumes in PDF or plain text, public GitHub repositories only.

## Privacy

- Your resume, job description, repository content, and voice are sent to third-party AI services (OpenAI) to run the interview and create the report.
- MockMate does not store your data on a server. Your materials, transcript, and report live only in your browser tab and are cleared when you close it.
- Audio and video are not recorded or saved.
- Please don't upload documents that contain sensitive personal information you don't want processed.
- MockMate never runs code from your repository; it only reads text files.

## Team

Built at UF Gator Hack V (October 2026) by Jerry, Yuki, and Lisa.
