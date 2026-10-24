"use client";

import { useState, type FormEvent } from "react";
import type { CompanyStyle, InterviewMode } from "@/types";
import { COMPANY_STYLES, GITHUB_REPO_URL_PATTERN, INPUT_LIMITS, INTERVIEW_MODES } from "@/types";

export interface IntakeValues {
  jobDescription: string;
  resumeMode: "paste" | "pdf";
  resumeText: string;
  resumeFile: File | null;
  repoUrl: string;
  companyStyle: CompanyStyle;
  mode: InterviewMode;
}

export const EMPTY_INTAKE: IntakeValues = {
  jobDescription: "",
  resumeMode: "paste",
  resumeText: "",
  resumeFile: null,
  repoUrl: "",
  companyStyle: "general-tech",
  mode: "technical",
};

/** Fictional sample inputs. TODO: replace with Lisa's content/demo files once delivered. */
const SAMPLE: Pick<IntakeValues, "jobDescription" | "resumeText" | "repoUrl"> = {
  jobDescription:
    "Computer Vision Engineer — Build and ship image enhancement models in PyTorch, deploy them behind production APIs, and profile inference latency. Strong grasp of classical image processing required.",
  resumeText:
    "Sam Rivera (sam@example.com) — CS student. Built Vision Enhance Platform: a FastAPI + React app with a plugin-based pipeline of classical filters (CLAHE, Retinex) and a Zero-DCE low-light model.",
  repoUrl: "https://github.com/JunhaoLiXD/vision-enhance-platform",
};

type Errors = Partial<Record<"jobDescription" | "resume" | "repoUrl", string>>;

function validate(values: IntakeValues): Errors {
  const errors: Errors = {};
  const jd = values.jobDescription.trim();
  if (!jd) errors.jobDescription = "Add a job description to continue.";
  else if (jd.length > INPUT_LIMITS.jobDescriptionMaxChars) errors.jobDescription = "Keep the job description under 10,000 characters.";

  if (values.resumeMode === "paste") {
    const resume = values.resumeText.trim();
    if (!resume) errors.resume = "Paste your resume or a short background summary.";
    else if (resume.length > INPUT_LIMITS.resumeTextMaxChars) errors.resume = "Keep the resume under 10,000 characters.";
  } else {
    const file = values.resumeFile;
    if (!file) errors.resume = "Choose a PDF file to continue.";
    else if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) errors.resume = "Choose a PDF file.";
    else if (file.size > INPUT_LIMITS.resumePdfMaxBytes) errors.resume = "Choose a PDF under 2 MB.";
  }

  if (!GITHUB_REPO_URL_PATTERN.test(values.repoUrl.trim())) {
    errors.repoUrl = "Use one public repository URL: https://github.com/owner/repo.";
  }
  return errors;
}

export function PrepareStep({
  values,
  onChange,
  onSubmit,
  busy,
  busyLabel = "Analyzing…",
  busyHint,
  submitError,
}: {
  values: IntakeValues;
  onChange: (values: IntakeValues) => void;
  onSubmit: () => void;
  busy: boolean;
  /** Button text while busy, e.g. the current step of the analysis. */
  busyLabel?: string;
  /** One line under the button explaining what is happening while busy. */
  busyHint?: string;
  submitError: string | null;
}) {
  const [errors, setErrors] = useState<Errors>({});
  const set = <K extends keyof IntakeValues>(key: K, value: IntakeValues[K]) => onChange({ ...values, [key]: value });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next = validate(values);
    setErrors(next);
    if (Object.keys(next).length === 0) onSubmit();
  };

  return (
    <section className="stage" aria-labelledby="prepare-title">
      <div className="stage-heading">
        <div>
          <span className="section-kicker">01 / SET THE SCENE</span>
          <h2 id="prepare-title">Start with your story.</h2>
          <p>A few details help shape a more relevant practice session.</p>
        </div>
        <span className="heading-decoration" aria-hidden="true">
          ✳
        </span>
      </div>

      <div className="prepare-layout">
        <form className="form-card" noValidate onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="job-description">
              Job description <span className="required">*</span>
            </label>
            <p className="field-hint">What role are you preparing for?</p>
            <textarea
              id="job-description"
              maxLength={INPUT_LIMITS.jobDescriptionMaxChars}
              placeholder="Paste the role, responsibilities, and qualifications here..."
              value={values.jobDescription}
              onChange={(e) => set("jobDescription", e.target.value)}
            />
            <small className="error" role="alert">
              {errors.jobDescription}
            </small>
          </div>

          <div className="field">
            <div className="label-row">
              <label htmlFor={values.resumeMode === "paste" ? "resume-text" : "resume-file"}>
                Your resume <span className="required">*</span>
              </label>
              <div className="segmented" role="group" aria-label="Resume input">
                {(["paste", "pdf"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`segment${values.resumeMode === mode ? " active" : ""}`}
                    aria-pressed={values.resumeMode === mode}
                    onClick={() => set("resumeMode", mode)}
                  >
                    {mode === "paste" ? "Paste text" : "Upload PDF"}
                  </button>
                ))}
              </div>
            </div>
            <p className="field-hint">The experience and skills you want to discuss.</p>
            {values.resumeMode === "paste" ? (
              <textarea
                id="resume-text"
                maxLength={INPUT_LIMITS.resumeTextMaxChars}
                placeholder="Paste your resume or a short summary of your background..."
                value={values.resumeText}
                onChange={(e) => set("resumeText", e.target.value)}
              />
            ) : (
              <>
                <label className="upload-zone" htmlFor="resume-file">
                  <span className="upload-icon">↥</span>
                  <strong>{values.resumeFile?.name ?? "Choose a PDF file"}</strong>
                  <span>Up to 2 MB · 5 pages</span>
                </label>
                <input
                  id="resume-file"
                  className="sr-only"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => set("resumeFile", e.target.files?.[0] ?? null)}
                />
              </>
            )}
            <small className="error" role="alert">
              {errors.resume}
            </small>
          </div>

          <div className="field">
            <label htmlFor="github-url">
              Public GitHub repository <span className="required">*</span>
            </label>
            <p className="field-hint">One project you would like to talk through.</p>
            <div className="input-prefix">
              <span aria-hidden="true">↗</span>
              <input
                id="github-url"
                type="url"
                placeholder="https://github.com/you/your-project"
                autoComplete="url"
                value={values.repoUrl}
                onChange={(e) => set("repoUrl", e.target.value)}
              />
            </div>
            <small className="error" role="alert">
              {errors.repoUrl}
            </small>
          </div>

          <div className="two-fields">
            <fieldset className="field">
              <legend>Company style</legend>
              <div className="choice-list">
                {COMPANY_STYLES.map((style) => (
                  <label key={style.value} className="choice">
                    <input
                      type="radio"
                      name="company"
                      value={style.value}
                      checked={values.companyStyle === style.value}
                      onChange={() => set("companyStyle", style.value)}
                    />
                    <span>
                      {style.label} {style.value === "amazon-style" && <small>unofficial</small>}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="field">
              <legend>Interview focus</legend>
              <div className="choice-list">
                {INTERVIEW_MODES.map((mode) => (
                  <label key={mode.value} className="choice">
                    <input
                      type="radio"
                      name="focus"
                      value={mode.value}
                      checked={values.mode === mode.value}
                      onChange={() => set("mode", mode.value)}
                    />
                    <span>{mode.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {submitError && (
            <p className="meeting-error" role="alert" style={{ margin: "8px 0 0" }}>
              {submitError}
            </p>
          )}

          <div className="form-actions">
            <button type="submit" className="button button-primary" disabled={busy}>
              {busy ? busyLabel : "Build my practice plan"} <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => {
                onChange({ ...values, ...SAMPLE, resumeMode: "paste" });
                setErrors({});
              }}
            >
              Try sample details
            </button>
          </div>
          <p className="field-hint" aria-live="polite" style={{ margin: "8px 0 0" }}>
            {busy ? busyHint : ""}
          </p>
        </form>

        <aside className="aside-card">
          <div className="aside-icon">✦</div>
          <span className="aside-kicker">A LITTLE CONTEXT GOES A LONG WAY</span>
          <h3>Practice with purpose.</h3>
          <p>Bring a real role, a resume, and one project. MockMate turns them into interview angles worth rehearsing.</p>
          <div className="aside-rule"></div>
          <div className="aside-detail">
            <span>01</span>Role expectations
          </div>
          <div className="aside-detail">
            <span>02</span>Your experience
          </div>
          <div className="aside-detail">
            <span>03</span>Project decisions
          </div>
          <div className="aside-note">
            Your inputs and interview audio are processed by OpenAI to run the practice session. MockMate does not store
            them.
          </div>
        </aside>
      </div>
    </section>
  );
}
