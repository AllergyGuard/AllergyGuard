import type { Metadata, Viewport } from "next";
import { SerwistProvider } from "@serwist/turbopack/react";
import { Nunito } from "next/font/google";
import { APP_NAME } from "@/lib/constants";
import "./globals.css";

// Self-hosted by next/font at build time (no request to Google at runtime).
// The woff2 is precached by the service worker so /emergency renders in it
// offline; see the globPatterns in app/serwist/[path]/route.ts.
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Check food products against your allergy profile.",
  // iPhone: open full-screen from the Home Screen, like the Android install.
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#6d3fe0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Off in dev (test offline with `npm run build && npm start`).
            cacheOnNavigation and reloadOnOnline are off: the first would cache
            signed-in pages, the second would reload and lose unsaved form input. */}
        <SerwistProvider
          swUrl="/serwist/sw.js"
          disable={process.env.NODE_ENV === "development"}
          cacheOnNavigation={false}
          reloadOnOnline={false}
        >
          {children}
        </SerwistProvider>
      </body>
    </html>
  );
}
