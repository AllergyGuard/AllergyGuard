"use client";

import { useEffect, useState } from "react";
import { INSTALL_HINT_DISMISSED_KEY, shouldShowInstallHint } from "@/lib/offline/install-hint";

function readDismissed(): boolean {
  try {
    return localStorage.getItem(INSTALL_HINT_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

/** Small, dismissible "Add to Home Screen" tip, shown on iOS only. */
export function InstallHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    // Reading browser-only APIs has to wait until after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(
      shouldShowInstallHint({
        userAgent: nav.userAgent,
        platform: nav.platform,
        maxTouchPoints: nav.maxTouchPoints,
        installed:
          nav.standalone === true ||
          (typeof matchMedia === "function" && matchMedia("(display-mode: standalone)").matches),
        dismissed: readDismissed(),
      }),
    );
  }, []);

  if (!visible) return null;

  function dismiss() {
    try {
      localStorage.setItem(INSTALL_HINT_DISMISSED_KEY, "1");
    } catch {
      // Storage blocked: hide for this visit only.
    }
    setVisible(false);
  }

  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100"
    >
      <p className="flex-1">
        <span className="font-semibold">Add to Home Screen for offline access.</span> In Safari, tap
        Share, then &ldquo;Add to Home Screen&rdquo;. Otherwise iPhone may delete this saved card
        if you don&apos;t open AllergyGuard for about a week.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="-m-1 flex h-11 w-11 shrink-0 items-center justify-center text-lg"
      >
        ×
      </button>
    </div>
  );
}
