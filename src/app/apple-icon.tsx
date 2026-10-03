import { appIconResponse } from "@/lib/app-icon";

// iPhone Home Screen icon (Next adds the <link rel="apple-touch-icon">).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return appIconResponse(180);
}
