/**
 * `tel:` URI for a stored phone number: "+" and digits only, e.g.
 * "+91 98765 43210" → "tel:+919876543210". The stored and displayed number
 * keeps its spaces; spaces, dots and hyphens aren't valid in a tel: URI.
 * Every call link in the app (emergency card, profile) uses this.
 */
export function telHref(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/[^0-9]/g, "");
  return `tel:${trimmed.startsWith("+") ? "+" : ""}${digits}`;
}
