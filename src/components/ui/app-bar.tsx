import Link from "next/link";
import { EmergencyCardSync } from "@/components/emergency-card-sync";
import { APP_NAME } from "@/lib/constants";
import { AppIconTile } from "./icons";

/**
 * The Emergency button on every screen. A plain <a>, not <Link>: <Link>
 * fetches the RSC payload over the network, which fails offline. A full
 * document load is answered from the service worker's precache instead.
 */
export function EmergencyButton() {
  return (
    <a
      href="/emergency"
      className="flex h-11 items-center gap-1.5 rounded-full bg-emergency px-4 text-sm font-extrabold uppercase tracking-wide text-white shadow-card"
    >
      <span aria-hidden="true">🚨</span>
      Emergency
    </a>
  );
}

/** Sticky top bar on every page except /emergency itself. */
export function AppBar({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-sm items-center justify-between gap-2 px-4">
        <Link href="/" className="flex min-h-11 items-center gap-2 text-base font-black text-primary-ink">
          <AppIconTile size="sm" />
          {APP_NAME}
        </Link>
        <div className="flex items-center gap-1">
          {signedIn ? (
            <EmergencyCardSync />
          ) : (
            <Link href="/login" className="flex h-11 items-center px-2 text-sm font-extrabold text-primary-ink">
              Log in
            </Link>
          )}
          <EmergencyButton />
        </div>
      </div>
    </header>
  );
}
