import type { AllergenMatch } from "@/lib/allergen/check";

export type Segment = { text: string; kind: AllergenMatch["kind"] | null };

/**
 * Splits the raw ingredient text into plain and highlighted segments, using the
 * match ranges from checkAllergens(). Overlapping matches are merged; where a
 * "contains" and a "may contain" overlap, "contains" wins (stronger warning).
 */
export function highlightSegments(raw: string, matches: readonly AllergenMatch[]): Segment[] {
  const marks: (AllergenMatch["kind"] | null)[] = new Array(raw.length).fill(null);
  for (const m of matches) {
    if (m.start === null || m.end === null) continue;
    for (let i = Math.max(0, m.start); i < Math.min(raw.length, m.end); i++) {
      if (marks[i] !== "contains") marks[i] = m.kind;
    }
  }
  const segments: Segment[] = [];
  for (let i = 0; i < raw.length; i++) {
    const last = segments[segments.length - 1];
    if (last && last.kind === marks[i]) last.text += raw[i];
    else segments.push({ text: raw[i], kind: marks[i] });
  }
  return segments;
}
