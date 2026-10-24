import "server-only";

import { extractText, getDocumentProxy } from "unpdf";
import type { ApiErrorCode } from "@/types";
import { INPUT_LIMITS } from "@/types";

/**
 * Extracts text from an uploaded resume PDF (brief section 5.3: at most 2 MB and 5 pages).
 * The file is validated by size, declared type and file signature before parsing. Only the
 * extracted text is kept; the raw upload is never stored or logged.
 */

export class ResumeFileError extends Error {
  constructor(
    readonly code: Extract<ApiErrorCode, "UNSUPPORTED_FILE" | "INPUT_TOO_LARGE" | "INVALID_INPUT">,
    message: string,
  ) {
    super(message);
    this.name = "ResumeFileError";
  }
}

export interface ParsedResume {
  text: string;
  pageCount: number;
  /** True when the text was cut to the resume character limit. */
  truncated: boolean;
}

const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"

function hasPdfSignature(bytes: Uint8Array): boolean {
  return PDF_SIGNATURE.every((byte, i) => bytes[i] === byte);
}

export async function parseResumePdf(file: File): Promise<ParsedResume> {
  if (file.size > INPUT_LIMITS.resumePdfMaxBytes) {
    throw new ResumeFileError("INPUT_TOO_LARGE", "The resume PDF must be 2 MB or smaller.");
  }
  if (!(INPUT_LIMITS.resumeAcceptedMimeTypes as readonly string[]).includes(file.type)) {
    throw new ResumeFileError("UNSUPPORTED_FILE", "Upload the resume as a PDF, or paste it as text.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength === 0 || !hasPdfSignature(bytes)) {
    throw new ResumeFileError("UNSUPPORTED_FILE", "This file doesn't look like a valid PDF. Try exporting it again, or paste the text.");
  }

  let pdf: Awaited<ReturnType<typeof getDocumentProxy>>;
  try {
    pdf = await getDocumentProxy(bytes);
  } catch (error) {
    // Encrypted or corrupted files land here. Log the error type only.
    console.error("[resume] PDF could not be opened:", error instanceof Error ? error.name : "unknown");
    throw new ResumeFileError("UNSUPPORTED_FILE", "This PDF couldn't be read. It may be password-protected or damaged. Try pasting the text instead.");
  }

  try {
    if (pdf.numPages > INPUT_LIMITS.resumePdfMaxPages) {
      throw new ResumeFileError("INPUT_TOO_LARGE", "The resume PDF can have at most 5 pages.");
    }
    const { text } = await extractText(pdf, { mergePages: true });
    const cleaned = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    if (cleaned.length < 50) {
      throw new ResumeFileError("INVALID_INPUT", "No text was found in this PDF (it may be a scanned image). Please paste your resume as text.");
    }
    const truncated = cleaned.length > INPUT_LIMITS.resumeTextMaxChars;
    return {
      text: truncated ? cleaned.slice(0, INPUT_LIMITS.resumeTextMaxChars) : cleaned,
      pageCount: pdf.numPages,
      truncated,
    };
  } catch (error) {
    if (error instanceof ResumeFileError) throw error;
    console.error("[resume] PDF text extraction failed:", error instanceof Error ? error.name : "unknown");
    throw new ResumeFileError("UNSUPPORTED_FILE", "This PDF couldn't be read. Try pasting the text instead.");
  } finally {
    await pdf.loadingTask.destroy().catch(() => undefined);
  }
}
