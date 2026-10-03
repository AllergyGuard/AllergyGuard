import { describe, expect, it } from "vitest";
import { telHref } from "./phone";

describe("telHref", () => {
  it.each([
    ["+91 98765 43210", "tel:+919876543210"],
    ["+44 20-7946-0958", "tel:+442079460958"],
    ["  +1.415.555.0100 ", "tel:+14155550100"],
    ["+919876543210", "tel:+919876543210"],
  ])("%s → %s", (phone, href) => {
    expect(telHref(phone)).toBe(href);
  });

  it("only ever contains + and digits after tel:, whatever separators are stored", () => {
    for (const phone of ["+91 98765 43210", "+44 20-7946-0958", "+1.415.555.0100", "+683 4002"]) {
      expect(telHref(phone)).toMatch(/^tel:\+[0-9]+$/);
    }
  });

  it("keeps an old-format number without a country code as local digits", () => {
    expect(telHref("09876 543210")).toBe("tel:09876543210");
  });
});
