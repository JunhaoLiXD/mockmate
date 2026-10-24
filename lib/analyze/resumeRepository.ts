import { GITHUB_REPO_URL_PATTERN } from "../../types/limits";

/** Finds the first explicit public repository link in extracted resume text. */
export function findResumeRepositoryUrl(resumeText: string): string | null {
  const links = /(?:^|[^\w@./-])(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)/gi;
  for (const match of resumeText.matchAll(links)) {
    const owner = match[1];
    const repo = match[2]?.replace(/[.,;:!?]+$/, "");
    if (!owner || !repo || /^\.+$/.test(repo)) continue;
    const url = `https://github.com/${owner}/${repo}`;
    if (GITHUB_REPO_URL_PATTERN.test(url)) return url;
  }
  return null;
}
