/**
 * Chooses which repository files to read (brief section 5.1). Pure logic, no network calls.
 * Priority: README, dependency manifests, core model/train/eval files, then other source code.
 * Within each tier, larger files and files the README mentions come first, scaffolding (types, mocks,
 * fixtures, generated code) comes last, and each extra file from the same directory or with the same name ranks lower.
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
/** Scaffolding: shared type declarations, mocks, fixtures, migrations, generated code, docs and content. */
const SCAFFOLD_DIRS = new Set([
  "types", "typings", "@types", "mocks", "__mocks__", "fixtures", "__fixtures__", "migrations", "generated",
  "__generated__", "stories", "storybook", "docs", "doc", "content",
]);
/** Only at the top level: Java packages such as com/example/ or org/springframework/samples/ hold real code. */
const SCAFFOLD_TOP_DIRS = new Set(["examples", "samples"]);
const SCAFFOLD_FILES = /(\.d\.ts|\.stories\.[a-z]+|_pb2(_grpc)?\.py|\.pb(\.gw)?\.go|\.generated\.[a-z]+)$/i;
/** Files under this size are usually re-exports, entry shells or layout boilerplate. */
const SMALL_FILE_BYTES = 1024;
/** Spreads the slots across the project: each file already chosen from the same directory or with the same name costs this much. */
const SAME_DIR_PENALTY = 15;
const SAME_NAME_PENALTY = 25;
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

function dirname(path: string): string {
  const slash = path.lastIndexOf("/");
  return slash === -1 ? "" : path.slice(0, slash);
}

function isScaffold(path: string): boolean {
  const dirs = path.split("/").slice(0, -1);
  return (
    dirs.some((d) => SCAFFOLD_DIRS.has(d.toLowerCase())) ||
    (dirs.length > 0 && SCAFFOLD_TOP_DIRS.has(dirs[0].toLowerCase())) ||
    SCAFFOLD_FILES.test(path)
  );
}

interface ReadmeMentions {
  files: Set<string>;
  dirs: Set<string>;
}

/** Collects path-like tokens ("src/engine/", "train.py") from README text. The README is untrusted, but this only reorders the repository's own files. */
function readmeMentions(readme: string | undefined): ReadmeMentions {
  const files = new Set<string>();
  const dirs = new Set<string>();
  for (const raw of readme?.match(/[A-Za-z0-9_@./-]+/g) ?? []) {
    const isDir = raw.endsWith("/");
    const token = raw.replace(/^(\.?\/)+/, "").replace(/\/+$/, "").toLowerCase();
    if (!token || token.includes("..")) continue;
    if (isDir) dirs.add(token);
    else if (/\.[a-z0-9]+$/.test(token) && (token.includes("/") || CODE_EXTENSIONS.has(extension(token)))) files.add(token);
  }
  return { files, dirs };
}

function mentionBonus(path: string, mentions: ReadmeMentions): number {
  const lower = path.toLowerCase();
  for (const file of mentions.files) {
    if (lower === file || lower.endsWith(`/${file}`)) return 40;
  }
  for (const dir of mentions.dirs) {
    if (lower.startsWith(`${dir}/`)) return 15;
  }
  return 0;
}

/** Larger source files usually hold the real logic: -30 under 1 KB, then +10 per doubling from 1 KB, up to +40 at 16 KB. */
function sizeBonus(size: number): number {
  if (size < SMALL_FILE_BYTES) return -30;
  return Math.min(40, Math.round(10 * Math.log2(size / SMALL_FILE_BYTES)));
}

function score(entry: TreeEntry, mentions: ReadmeMentions): number {
  const path = entry.path;
  const depth = path.split("/").length - 1;
  const name = basename(path);
  const ext = extension(name);
  let value: number;
  let isCore = false;
  if (isReadme(path)) return 1000;
  if (isManifest(path)) value = depth === 0 ? 500 : 200;
  else if (TOOLING_CONFIG.test(path) || MARKUP_AND_STYLE.has(ext)) value = 5;
  else if (TEST_HINTS.test(path)) value = 8;
  else if (isScaffold(path)) value = 10;
  else if (!CODE_EXTENSIONS.has(ext)) value = 15; // docs, YAML, shell scripts
  else {
    isCore = true;
    if (ML_HINTS.test(name)) value = 150;
    else if (CORE_HINTS.test(name)) value = 110;
    else if (SOURCE_DIRS.test(path)) value = 60;
    else value = 40;
  }
  if (isCore) value += sizeBonus(entry.size ?? 0);
  value += mentionBonus(path, mentions);
  // A small depth penalty keeps deeply nested core code ahead of shallow boilerplate.
  return value - depth * 2;
}

/**
 * @param readme Text of the root README, if it was read first. Paths it mentions rank higher.
 */
export function selectFiles(entries: TreeEntry[], readme?: string): FileSelection {
  const blobs = entries.filter((e) => e.type === "blob");
  const candidates = blobs.filter(
    (e) => !isExcluded(e.path) && isReadable(e.path) && (e.size ?? 0) > 0 && (e.size ?? 0) <= INPUT_LIMITS.repoMaxFileBytes,
  );
  const mentions = readmeMentions(readme);
  const remaining = candidates.map((entry) => ({
    entry,
    score: score(entry, mentions),
    dir: dirname(entry.path),
    name: basename(entry.path).toLowerCase(),
    // README and manifests never crowd out code, so they do not count toward the spread penalties.
    counted: !isReadme(entry.path) && !isManifest(entry.path),
  }));
  const perDir = new Map<string, number>();
  const perName = new Map<string, number>();
  const adjusted = (c: (typeof remaining)[number]) =>
    c.score - (perDir.get(c.dir) ?? 0) * SAME_DIR_PENALTY - (perName.get(c.name) ?? 0) * SAME_NAME_PENALTY;

  // Greedy: pick the best file after the spread penalties, then update the penalties.
  const selected: TreeEntry[] = [];
  let total = 0;
  while (selected.length < INPUT_LIMITS.repoMaxFiles) {
    let best = -1;
    for (let i = 0; i < remaining.length; i++) {
      const c = remaining[i];
      if (total + (c.entry.size ?? 0) > INPUT_LIMITS.repoMaxTotalBytes) continue;
      const b = best === -1 ? undefined : remaining[best];
      if (!b || adjusted(c) > adjusted(b) || (adjusted(c) === adjusted(b) && c.entry.path < b.entry.path)) best = i;
    }
    if (best === -1) break;
    const [chosen] = remaining.splice(best, 1);
    selected.push(chosen.entry);
    total += chosen.entry.size ?? 0;
    if (chosen.counted) {
      perDir.set(chosen.dir, (perDir.get(chosen.dir) ?? 0) + 1);
      perName.set(chosen.name, (perName.get(chosen.name) ?? 0) + 1);
    }
  }
  return { selected, skippedCount: blobs.length - selected.length };
}
