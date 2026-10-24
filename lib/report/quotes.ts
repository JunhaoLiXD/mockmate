/**
 * Verifies that a quote the model attributes to a turn really appears in it, and returns the
 * transcript's own wording. Matching is deliberately narrow:
 * - case-insensitive; runs of whitespace count as one space;
 * - typographic quotes, apostrophes and dashes match their plain forms;
 * - technical symbols such as + # . / are kept, so "C++" never matches "C";
 * - only the quote's leading and trailing sentence punctuation is ignored;
 * - matches must start and end on word boundaries.
 * Transcription noise is never "corrected" into a match.
 */

const TYPOGRAPHIC: Record<string, string> = {
  "‘": "'",
  "’": "'",
  "“": '"',
  "”": '"',
  "–": "-",
  "—": "-",
};

/** Lowercases, maps typographic characters and collapses whitespace, keeping an index map. */
function normalizeWithMap(text: string): { normalized: string; map: number[] } {
  let normalized = "";
  const map: number[] = [];
  let lastWasSpace = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      if (!lastWasSpace && normalized.length > 0) {
        normalized += " ";
        map.push(i);
      }
      lastWasSpace = true;
      continue;
    }
    lastWasSpace = false;
    normalized += (TYPOGRAPHIC[ch] ?? ch).toLowerCase();
    map.push(i);
  }
  if (normalized.endsWith(" ")) {
    normalized = normalized.slice(0, -1);
    map.pop();
  }
  return { normalized, map };
}

const EDGE_PUNCTUATION = /^[\s"'.,;:!?()…-]+|[\s"'.,;:!?()…-]+$/g;
/** Characters that belong to a token, so "in C" cannot match inside "in C++" or "C#". */
const WORD_CHAR = /[a-z0-9+#_]/;

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Returns the matching substring of `turnText` (original casing and punctuation), or null when
 * the quote is empty or not found on word boundaries.
 */
export function locateQuote(turnText: string, quote: string): string | null {
  const needle = normalizeWithMap(quote.replace(EDGE_PUNCTUATION, "")).normalized;
  if (needle.length < 2 || !/[a-z0-9]/.test(needle)) return null;
  const { normalized, map } = normalizeWithMap(turnText);

  let from = 0;
  while (from <= normalized.length - needle.length) {
    const start = normalized.indexOf(needle, from);
    if (start === -1) return null;
    const end = start + needle.length;
    const startsOnBoundary = start === 0 || !WORD_CHAR.test(normalized[start - 1]) || !WORD_CHAR.test(needle[0]);
    const endsOnBoundary = end === normalized.length || !WORD_CHAR.test(normalized[end]) || !WORD_CHAR.test(needle[needle.length - 1]);
    if (startsOnBoundary && endsOnBoundary) {
      return turnText.slice(map[start], map[end - 1] + 1);
    }
    from = start + 1;
  }
  return null;
}
