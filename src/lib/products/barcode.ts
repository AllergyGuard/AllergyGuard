// Barcode (GTIN) checks, run before any lookup so a camera misread or a typo
// never reaches Open Food Facts. Pure functions.

const LENGTHS = [8, 12, 13, 14];

/** Strip the spaces and hyphens people type or paste. */
export function normalizeBarcode(input: string): string {
  return input.replace(/[\s-]+/g, "");
}

/** GTIN check digit: weights 3,1,3,1… from the digit left of the check digit. */
function checkDigitOk(code: string): boolean {
  const digits = [...code].map(Number);
  const check = digits.pop()!;
  const sum = digits.reverse().reduce((total, d, i) => total + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

/** Returns an error message, or null when the barcode is valid (EAN-8, UPC-A, EAN-13, GTIN-14). */
export function validateBarcode(input: string): string | null {
  const code = normalizeBarcode(input);
  if (code === "") return "Enter the barcode number.";
  if (!/^\d+$/.test(code)) return "A barcode has only digits.";
  if (!LENGTHS.includes(code.length)) return "A barcode has 8, 12, 13 or 14 digits.";
  // All zeros passes the checksum but is never a real product.
  if (/^0+$/.test(code) || !checkDigitOk(code)) {
    return "That barcode doesn't add up. Check the digits and try again.";
  }
  return null;
}
