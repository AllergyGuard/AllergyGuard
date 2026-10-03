import { describe, expect, it } from "vitest";
import { shouldShowInstallHint, type InstallHintEnv } from "./install-hint";

const iphone: InstallHintEnv = {
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  platform: "iPhone",
  maxTouchPoints: 5,
  installed: false,
  dismissed: false,
};

describe("shouldShowInstallHint", () => {
  it("shows on iPhone Safari in a browser tab", () => {
    expect(shouldShowInstallHint(iphone)).toBe(true);
  });

  it("shows on iPadOS, which reports a Mac platform with touch", () => {
    expect(
      shouldShowInstallHint({
        ...iphone,
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15",
        platform: "MacIntel",
      }),
    ).toBe(true);
  });

  it("hides once installed to the Home Screen or dismissed", () => {
    expect(shouldShowInstallHint({ ...iphone, installed: true })).toBe(false);
    expect(shouldShowInstallHint({ ...iphone, dismissed: true })).toBe(false);
  });

  it("hides on desktop Mac and Android", () => {
    expect(
      shouldShowInstallHint({ ...iphone, userAgent: "Mozilla/5.0 (Macintosh)", platform: "MacIntel", maxTouchPoints: 0 }),
    ).toBe(false);
    expect(
      shouldShowInstallHint({ ...iphone, userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9)", platform: "Linux armv81" }),
    ).toBe(false);
  });
});
