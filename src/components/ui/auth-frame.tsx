import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/constants";
import { AppIconTile } from "./icons";

/** Login and signup layout: brand band, then the page heading and form. */
export function AuthFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col bg-page pb-10">
      <div className="flex flex-col items-center gap-2 rounded-b-[32px] bg-band px-4 pb-6 pt-6">
        <AppIconTile size="md" />
        <p className="text-sm font-black uppercase tracking-[0.14em] text-primary-ink">{APP_NAME}</p>
      </div>
      <div className="mx-auto mt-8 w-full max-w-sm px-4">
        <h1 className="text-[28px] font-black leading-tight tracking-tight text-ink">{title}</h1>
        <p className="mt-1 text-base font-semibold text-muted">{subtitle}</p>
        {children}
      </div>
    </main>
  );
}

/** "OR" divider between the main action and the alternative. */
export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-3" aria-hidden="true">
      <span className="h-px flex-1 bg-line" />
      <span className="text-xs font-extrabold text-muted">OR</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
