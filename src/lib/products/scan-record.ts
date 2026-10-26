// Mapping between a barcode check and a row of public.scans. Pure.
import type { CheckResult, Verdict } from "@/lib/allergen/check";
import type { ProductLookup } from "./open-food-facts";

/** Must match the public.scan_verdict enum (a test checks this). */
export const SCAN_VERDICTS = ["safe", "caution", "unsafe"] as const satisfies readonly Verdict[];

export type ScanInput = "camera" | "manual";

export type ScanInsert = {
  profile_id: string;
  barcode: string;
  input: ScanInput;
  product_found: boolean;
  product_name: string | null;
  brands: string | null;
  ingredients_text: string | null;
  declared_allergens: string[];
  declared_traces: string[];
  data_notes: string[];
  verdict: Verdict;
  result: CheckResult;
  off_last_modified: string | null;
};

export type ScanRow = ScanInsert & { id: string; created_at: string };

const clip = (value: string | null, max: number) => (value === null ? null : value.slice(0, max));

export function toScanInsert(args: {
  profileId: string;
  barcode: string;
  input: ScanInput;
  lookup: ProductLookup;
  result: CheckResult;
}): ScanInsert {
  const { profileId, barcode, input, lookup, result } = args;
  const found = lookup.found ? lookup : null;
  return {
    profile_id: profileId,
    barcode,
    input,
    product_found: lookup.found,
    product_name: clip(found?.name ?? null, 500),
    brands: clip(found?.brands ?? null, 500),
    ingredients_text: clip(found?.ingredientsText ?? null, 20000),
    declared_allergens: found?.declared.contains ?? [],
    declared_traces: found?.declared.mayContain ?? [],
    data_notes: found?.notes ?? [],
    verdict: result.verdict,
    result,
    off_last_modified: found?.lastModified ?? null,
  };
}

/**
 * Reads the stored result back. Returns null if the JSON doesn't look like a
 * CheckResult (e.g. written by an older version), so the page can say so
 * instead of showing a wrong verdict.
 */
export function readStoredResult(value: unknown): CheckResult | null {
  if (typeof value !== "object" || value === null) return null;
  const r = value as Partial<CheckResult>;
  if (!SCAN_VERDICTS.includes(r.verdict as Verdict)) return null;
  if (typeof r.explanation !== "string" || typeof r.rawText !== "string") return null;
  if (!Array.isArray(r.matches) || !Array.isArray(r.warnings)) return null;
  return r as CheckResult;
}
