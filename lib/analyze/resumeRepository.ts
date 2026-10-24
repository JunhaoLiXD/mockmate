import { GITHUB_REPO_URL_PATTERN } from "@/types";

/**
 * Finds the first explicit repository link (github.com/<owner>/<repo>) in resume text.
 * Profile-only links (github.com/<owner>) are ignored: there is no project to pick.
 * The result is validated against GITHUB_REPO_URL_PATTERN, like a URL typed in the form.
 */
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
