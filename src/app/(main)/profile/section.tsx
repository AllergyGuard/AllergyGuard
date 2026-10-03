import type { ReactNode } from "react";
import { formAlertClass } from "@/components/form-styles";

type Props = {
  id: string;
  title: string;
  description?: string;
  /** Success message, announced politely. */
  status?: string | null;
  /** Save error, announced as an alert. */
  error?: string | null;
  children: ReactNode;
};

/** A card on the /profile page. Each section saves independently. */
export function Section({ id, title, description, status, error, children }: Props) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-20 space-y-5 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div>
        <h2 id={`${id}-heading`} className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
        )}
      </div>
      {children}
      <p role="status" className="text-sm font-medium text-emerald-800 empty:hidden dark:text-emerald-300">
        {status ?? ""}
      </p>
      {error && (
        <p role="alert" className={formAlertClass}>
          {error}
        </p>
      )}
    </section>
  );
}
