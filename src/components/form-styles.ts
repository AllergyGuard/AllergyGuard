// Shared Tailwind classes for forms and buttons, built on the design tokens in
// app/globals.css (light and dark come from the tokens, so no `dark:` here).
// Buttons are uppercase through CSS only, so accessible names stay as written.

export const inputClass =
  "mt-1 block h-[52px] w-full rounded-field border border-field-line bg-card px-4 text-base text-ink " +
  "placeholder:text-placeholder outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 " +
  "aria-[invalid=true]:border-unsafe-ink";

export const labelClass = "block text-xs font-extrabold uppercase tracking-wider text-muted";

export const fieldErrorClass = "mt-1 text-sm font-semibold text-unsafe-ink";

const buttonBase =
  "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-button px-4 text-center text-base " +
  "font-extrabold uppercase tracking-wide disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-primary";

export const primaryButtonClass = `${buttonBase} bg-primary text-white shadow-button`;

export const secondaryButtonClass = `${buttonBase} border-2 border-primary bg-card text-primary-ink`;

/** Low-emphasis actions such as Back. */
export const tertiaryButtonClass = `${buttonBase} border border-line bg-card text-muted`;

/** Final "you're done" actions (Finish, Save profile). */
export const successButtonClass = `${buttonBase} bg-safe text-white`;

export const emergencyButtonClass = `${buttonBase} bg-emergency text-white`;

export const formAlertClass =
  "rounded-field border border-unsafe-ink/30 bg-unsafe-band p-3 text-sm font-semibold text-unsafe-ink";

export const formSuccessClass =
  "rounded-field border border-safe-ink/30 bg-safe-band p-3 text-sm font-semibold text-safe-ink";

export const linkClass = "font-bold text-primary-ink underline underline-offset-2";
