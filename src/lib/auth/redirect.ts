export const DEFAULT_AFTER_CONFIRM_PATH = "/onboarding";

/**
 * Returns `next` only if it is a same-site relative path (a single leading
 * "/"). Anything else (full URLs, protocol-relative "//host", "/\host", which
 * browsers treat like "//host", control characters, or missing values) falls
 * back to `fallback` (default /onboarding). This stops redirect parameters
 * being used as an open redirect.
 */
export function safeNextPath(
  next: string | null | undefined,
  fallback: string = DEFAULT_AFTER_CONFIRM_PATH,
): string {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  if (next.includes("\\")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(next)) return fallback;
  return next;
}
