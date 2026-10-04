// Text clean-up for allergen matching. Pure functions, no network.

export type NormalizedText = {
  /** Lowercased, accent-free text that the matcher searches. */
  text: string;
  /**
   * `map[i]` is the index in the original string of normalized character `i`;
   * `map[text.length]` is the original length. Used to show the user the exact
   * text that triggered a verdict.
   */
  map: number[];
};

// "cas-\nein": a hyphen at the end of an OCR line, then the rest of the word.
const LINE_BREAK_HYPHEN = /^-[ \t]*\r?\n[ \t]*/;

/**
 * Prepares ingredient text for matching:
 * - lowercase, accents removed, ligatures expanded ("Crème" → "creme", "ﬂ" → "fl");
 * - `_` becomes a space: Open Food Facts writes allergens as `_milk_`, and
 *   `_` counts as a word character, so it would hide the word from matching;
 * - words split across lines by a hyphen are joined again.
 */
export function normalizeIngredientText(raw: string): NormalizedText {
  let text = "";
  const map: number[] = [];
  let i = 0;
  while (i < raw.length) {
    const ch = raw[i];
    if (ch === "-") {
      const skip = LINE_BREAK_HYPHEN.exec(raw.slice(i, i + 64));
      if (skip && /\p{L}/u.test(raw[i - 1] ?? "") && /\p{L}/u.test(raw[i + skip[0].length] ?? "")) {
        i += skip[0].length;
        continue;
      }
    }
    const out =
      ch === "_"
        ? " "
        : ch.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
    for (const c of out) {
      text += c;
      map.push(i);
    }
    i += 1;
  }
  map.push(raw.length);
  return { text, map };
}

/** The original text behind normalized range [start, end). */
export function originalSlice(
  raw: string,
  normalized: NormalizedText,
  start: number,
  end: number,
): string {
  if (end <= start) return "";
  return raw.slice(normalized.map[start], normalized.map[end - 1] + 1);
}

/** True when there is at least one letter: anything else can't be an ingredient list. */
export function hasReadableText(value: string | null | undefined): value is string {
  return typeof value === "string" && /\p{L}/u.test(value);
}
