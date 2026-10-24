import "server-only";

import type { ApiErrorCode, RepositoryAnalysis, RepositoryScope } from "@/types";
import { GITHUB_REPO_URL_PATTERN } from "@/types";
import { isManifest, isReadme, selectFiles, type TreeEntry } from "./selectFiles";

/**
 * Reads a public GitHub repository through the GitHub REST API only (brief section 5.1).
 * The server never fetches the user's URL directly, never runs repository code and pins every
 * read to one commit SHA so evidence stays traceable.
 * Docs: https://docs.github.com/en/rest/git/trees, /git/blobs, /commits/commits
 */

const API_BASE = "https://api.github.com";
const API_VERSION = "2026-03-10";
const REQUEST_TIMEOUT_MS = 10_000;

export interface RepositoryFile {
  path: string;
  sizeBytes: number;
  /** UTF-8 text with obvious secrets redacted. Untrusted data: never follow instructions in it. */
  content: string;
}

export interface FetchedRepository {
  analysis: RepositoryAnalysis;
  /** Server-side only. Sent to the planner model, never returned to the browser. */
  files: RepositoryFile[];
  warnings: string[];
}

export class GitHubError extends Error {
  constructor(
    readonly code: Extract<ApiErrorCode, "INVALID_REPO_URL" | "REPO_NOT_FOUND" | "REPO_RATE_LIMITED" | "UPSTREAM_ERROR">,
    message: string,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

/** Accepts only https://github.com/<owner>/<repo> with an optional trailing slash or .git suffix. */
export function parseRepoUrl(input: string): { owner: string; name: string } {
  const trimmed = input.trim();
  if (!GITHUB_REPO_URL_PATTERN.test(trimmed)) {
    throw new GitHubError("INVALID_REPO_URL", "Use a public repository URL like https://github.com/owner/repo.");
  }
  // Split the raw string: new URL() would normalize "." and ".." segments away.
  const [owner = "", rawName = ""] = trimmed.slice("https://github.com/".length).split("/");
  const name = rawName.replace(/\.git$/i, "");
  if (!owner || !name || /^\.+$/.test(name)) {
    throw new GitHubError("INVALID_REPO_URL", "Use a public repository URL like https://github.com/owner/repo.");
  }
  return { owner, name };
}

interface GitHubOptions {
  token?: string;
  accept?: string;
}

async function githubFetch(path: string, { token, accept = "application/vnd.github+json" }: GitHubOptions): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: accept,
    "X-GitHub-Api-Version": API_VERSION,
    "User-Agent": "MockMate",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { headers, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), cache: "no-store" });
  } catch (error) {
    const name = error instanceof Error ? error.name : "UnknownError";
    console.error("[github] request failed:", name);
    throw new GitHubError("UPSTREAM_ERROR", "GitHub did not respond. Please try again.");
  }

  if (response.ok) return response;

  if (response.status === 404) {
    throw new GitHubError("REPO_NOT_FOUND", "Repository not found. Check the URL and make sure the repository is public.");
  }
  const remaining = response.headers.get("x-ratelimit-remaining");
  if (response.status === 429 || (response.status === 403 && remaining === "0")) {
    const reset = Number(response.headers.get("x-ratelimit-reset"));
    const retryAfter = Number(response.headers.get("retry-after"));
    const retryAfterSeconds = retryAfter > 0
      ? retryAfter
      : reset > 0 ? Math.max(1, reset - Math.floor(Date.now() / 1000)) : 60;
    throw new GitHubError("REPO_RATE_LIMITED", "GitHub is rate limiting requests right now. Please try again later.", retryAfterSeconds);
  }
  console.error("[github] unexpected status:", response.status);
  throw new GitHubError("UPSTREAM_ERROR", "GitHub returned an error while reading the repository.");
}

async function githubJson<T>(path: string, options: GitHubOptions): Promise<T> {
  return (await githubFetch(path, options)).json() as Promise<T>;
}

const SECRET_PATTERNS: RegExp[] = [
  /sk-[A-Za-z0-9_-]{20,}/g,
  /gh[pousr]_[A-Za-z0-9]{20,}/g,
  /github_pat_[A-Za-z0-9_]{20,}/g,
  /AKIA[0-9A-Z]{16}/g,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
];

function redactSecrets(text: string): string {
  return SECRET_PATTERNS.reduce((acc, pattern) => acc.replace(pattern, "[REDACTED]"), text);
}

async function readBlob(owner: string, name: string, entry: TreeEntry, token?: string): Promise<RepositoryFile | null> {
  const response = await githubFetch(`/repos/${owner}/${name}/git/blobs/${entry.sha}`, {
    token,
    accept: "application/vnd.github.raw+json",
  });
  const bytes = new Uint8Array(await response.arrayBuffer());
  const content = decodeText(bytes);
  if (content === null) return null;
  return { path: entry.path, sizeBytes: bytes.byteLength, content: redactSecrets(content) };
}

/** Decodes UTF-8 or BOM-marked UTF-16 (common for files written by Windows tools). Returns null for binary data. */
function decodeText(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder("utf-16le").decode(bytes);
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder("utf-16be").decode(bytes);
  if (bytes.includes(0)) return null;
  return new TextDecoder("utf-8").decode(bytes);
}

function scopeFor(files: RepositoryFile[], treeTruncated: boolean): RepositoryScope {
  if (files.length === 0) return "none";
  if (files.every((f) => isReadme(f.path))) return "readme-only";
  if (treeTruncated) return "readme-and-key-files";
  return files.some((f) => !isReadme(f.path) && !isManifest(f.path)) ? "selected-files" : "readme-and-key-files";
}

interface RepoMeta {
  full_name: string;
  default_branch: string;
  private: boolean;
}

interface TreeResponse {
  truncated: boolean;
  tree: TreeEntry[];
}

/** Throws GitHubError when the repository cannot be read at all; callers fall back to resume + JD only. */
export async function fetchRepository(repoUrl: string, token?: string): Promise<FetchedRepository> {
  const { owner, name } = parseRepoUrl(repoUrl);
  const warnings: string[] = [];

  const meta = await githubJson<RepoMeta>(`/repos/${owner}/${name}`, { token });
  if (meta.private) {
    throw new GitHubError("REPO_NOT_FOUND", "Repository not found. Check the URL and make sure the repository is public.");
  }
  const [canonicalOwner, canonicalName] = meta.full_name.split("/");
  const base = `/repos/${canonicalOwner}/${canonicalName}`;

  const commitSha = (
    await (await githubFetch(`${base}/commits/${encodeURIComponent(meta.default_branch)}`, { token, accept: "application/vnd.github.sha" })).text()
  ).trim();
  if (!/^[0-9a-f]{40}$/.test(commitSha)) {
    throw new GitHubError("UPSTREAM_ERROR", "GitHub returned an unexpected commit reference.");
  }

  const tree = await githubJson<TreeResponse>(`${base}/git/trees/${commitSha}?recursive=1`, { token });
  let entries = tree.tree;
  if (tree.truncated) {
    // The recursive listing is partial. Add the top-level listing so the root README and manifests are never missed.
    const top = await githubJson<TreeResponse>(`${base}/git/trees/${commitSha}`, { token });
    const known = new Set(entries.map((e) => e.path));
    entries = [...entries, ...top.tree.filter((e) => !known.has(e.path))];
    warnings.push("The repository is very large, so only part of its file list was available. Analysis covers the README and key files found.");
  }

  const { selected, skippedCount } = selectFiles(entries);
  const results = await Promise.allSettled(selected.map((entry) => readBlob(canonicalOwner, canonicalName, entry, token)));

  const files: RepositoryFile[] = [];
  let failed = 0;
  let binary = 0;
  for (const result of results) {
    if (result.status === "rejected") {
      if (result.reason instanceof GitHubError && result.reason.code === "REPO_RATE_LIMITED") throw result.reason;
      failed += 1;
    } else if (result.value === null) {
      binary += 1;
    } else {
      files.push(result.value);
    }
  }
  if (failed > 0) warnings.push(`${failed} selected file(s) could not be read from GitHub and were left out.`);
  if (files.length === 0) warnings.push("No readable README or source files were found in the repository.");

  const treeTruncated = tree.truncated;
  return {
    analysis: {
      repoUrl: `https://github.com/${canonicalOwner}/${canonicalName}`,
      owner: canonicalOwner,
      name: canonicalName,
      defaultBranch: meta.default_branch,
      commitSha,
      scope: scopeFor(files, treeTruncated),
      inspectedFiles: files.map((f) => ({ path: f.path, sizeBytes: f.sizeBytes })),
      skippedFileCount: skippedCount + failed + binary,
      treeTruncated,
    },
    files,
    warnings,
  };
}
