/**
 * Chooses which repository files to read (brief section 5.1). Pure logic, no network calls.
 * Priority: README, dependency manifests, core model/train/eval files, then other source code.
 */

import { INPUT_LIMITS } from "@/types";

export interface TreeEntry {
  path: string;
  type: string;
  sha: string;
  size?: number;
}

export interface FileSelection {
  selected: TreeEntry[];
  /** Blob entries not selected: wrong type, too large, excluded, or over the limits. */
  skippedCount: number;
}

const EXCLUDED_DIRS = new Set([
  "node_modules", "vendor", "vendors", "third_party", "third-party", "external", "dist", "build", "out",
  "target", "coverage", "__pycache__", "venv", "env", "site-packages", "data", "dataset", "datasets",
  "weights", "checkpoints", "models_cache", "logs", "runs", "wandb", "mlruns", "outputs",
]);

/** Text and source extensions worth reading. Anything else (images, weights, archives, binaries) is skipped. */
const TEXT_EXTENSIONS = new Set([
  "md", "rst", "txt", "py", "pyi", "js", "jsx", "mjs", "cjs", "ts", "tsx", "java", "kt", "kts", "go", "rs",
  "c", "cc", "cpp", "cxx", "h", "hpp", "cs", "rb", "php", "swift", "scala", "r", "jl", "lua", "dart", "m",
  "sh", "yml", "yaml", "toml", "cfg", "ini", "sql", "html", "css", "scss", "vue", "svelte", "cu", "proto",
  "gradle", "json",
]);

/** Files that look like text but are noise or may hold secrets. */
const EXCLUDED_FILE_PATTERNS: RegExp[] = [
  /(^|\/)\.[^/]+$/, // dotfiles, including .env*
  /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|poetry\.lock|Pipfile\.lock|Cargo\.lock|composer\.lock)$/i,
  /\.min\.(js|css)$/i,
  /(^|\/)(secrets?|credentials?)(\.[a-z]+)?$/i,
  /\.(pem|key|p12|pfx|crt)$/i,
];

const MANIFEST_NAMES = new Set([
  "requirements.txt", "pyproject.toml", "setup.py", "setup.cfg", "environment.yml", "environment.yaml",
  "package.json", "cargo.toml", "go.mod", "pom.xml", "build.gradle", "build.gradle.kts", "gemfile",
  "dockerfile", "makefile",
]);

/** Filename hints, strongest first, for the files that usually show how a project really works. */
const ML_HINTS = /(model|train|eval|infer|predict|loss|network|dataset|preprocess)/i;
const CORE_HINTS = /(pipeline|engine|service|manager|routes?|router|api|server|registry|main|app)/i;
const SOURCE_DIRS = /^(src|lib|app|backend|server|core|models?|scripts)\//i;
const TEST_HINTS = /(^|\/)(tests?|__tests__|spec)\/|(_test|\.test|\.spec)\.[a-z]+$/i;
/** Tooling config that rarely says anything about the candidate's own work. */
const TOOLING_CONFIG = /(^|\/)(eslint|prettier|vite|vitest|jest|babel|webpack|rollup|tailwind|postcss|tsconfig|next|nuxt|svelte)[^/]*\.[a-z]+$/i;
const MARKUP_AND_STYLE = new Set(["css", "scss", "html"]);
const CODE_EXTENSIONS = new Set([
  "py", "js", "jsx", "mjs", "ts", "tsx", "java", "kt", "go", "rs", "c", "cc", "cpp", "h", "hpp", "cs", "rb",
  "php", "swift", "scala", "r", "jl", "cu", "dart", "vue", "svelte",
]);

function basename(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1);
}

function extension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

function isExcluded(path: string): boolean {
  const dirs = path.split("/").slice(0, -1);
  if (dirs.some((d) => d.startsWith(".") || EXCLUDED_DIRS.has(d.toLowerCase()))) return true;
  return EXCLUDED_FILE_PATTERNS.some((p) => p.test(path));
}

export function isReadme(path: string): boolean {
  return /^readme(\.(md|rst|txt))?$/i.test(path);
}

export function isManifest(path: string): boolean {
  return MANIFEST_NAMES.has(basename(path).toLowerCase());
}

function isReadable(path: string): boolean {
  const name = basename(path).toLowerCase();
  if (MANIFEST_NAMES.has(name)) return true;
  const ext = extension(name);
  // JSON is usually data or config noise; only manifests (handled above) are worth reading.
  if (ext === "json") return false;
  return TEXT_EXTENSIONS.has(ext);
}

function score(path: string): number {
  const depth = path.split("/").length - 1;
  const name = basename(path);
  const ext = extension(name);
  let value: number;
  if (isReadme(path)) value = 1000;
  else if (isManifest(path)) value = depth === 0 ? 500 : 200;
  else if (TOOLING_CONFIG.test(path) || MARKUP_AND_STYLE.has(ext)) value = 5;
  else if (TEST_HINTS.test(path)) value = 8;
  else if (!CODE_EXTENSIONS.has(ext)) value = 15; // docs, YAML, shell scripts
  else if (ML_HINTS.test(name)) value = 150;
  else if (CORE_HINTS.test(name)) value = 110;
  else if (SOURCE_DIRS.test(path)) value = 60;
  else value = 40;
  // A small depth penalty keeps deeply nested core code ahead of shallow boilerplate.
  return value - depth * 2;
}

export function selectFiles(entries: TreeEntry[]): FileSelection {
  const blobs = entries.filter((e) => e.type === "blob");
  const candidates = blobs.filter(
    (e) => !isExcluded(e.path) && isReadable(e.path) && (e.size ?? 0) > 0 && (e.size ?? 0) <= INPUT_LIMITS.repoMaxFileBytes,
  );
  candidates.sort((a, b) => score(b.path) - score(a.path) || a.path.localeCompare(b.path));

  const selected: TreeEntry[] = [];
  let total = 0;
  for (const entry of candidates) {
    if (selected.length >= INPUT_LIMITS.repoMaxFiles) break;
    const size = entry.size ?? 0;
    if (total + size > INPUT_LIMITS.repoMaxTotalBytes) continue;
    selected.push(entry);
    total += size;
  }
  return { selected, skippedCount: blobs.length - selected.length };
}
