// Safari on iOS can delete a website's storage (our Dexie card included) if
// the site isn't used for about a week. Apps added to the Home Screen are
// exempt, so on iOS we suggest that until the user installs or dismisses.

export const INSTALL_HINT_DISMISSED_KEY = "allergyguard:install-hint-dismissed";

export type InstallHintEnv = {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
  /** navigator.standalone (iOS) or display-mode: standalone. */
  installed: boolean;
  dismissed: boolean;
};

/** iPhone/iPod/iPad, including iPadOS, which reports itself as a Mac with touch. */
export function isIos({ userAgent, platform, maxTouchPoints }: InstallHintEnv): boolean {
  return /iPhone|iPad|iPod/.test(userAgent) || (platform === "MacIntel" && maxTouchPoints > 1);
}

export function shouldShowInstallHint(env: InstallHintEnv): boolean {
  return isIos(env) && !env.installed && !env.dismissed;
}
