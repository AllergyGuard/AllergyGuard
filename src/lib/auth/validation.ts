// Pure sign-up helpers: no UI, no network. Each returns a user-facing message.

export const PASSWORD_MIN_LENGTH = 8;
// Supabase hashes passwords with bcrypt, which ignores bytes past 72.
export const PASSWORD_MAX_LENGTH = 72;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns an error message, or null if the email looks valid. */
export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (trimmed === "") return "Enter your email address.";
  if (!EMAIL_PATTERN.test(trimmed)) {
    return "That doesn't look like an email address. Check for typos, e.g. name@example.com.";
  }
  return null;
}

/** Returns an error message, or null if the password is acceptable. */
export function validatePassword(password: string): string | null {
  if (password === "") return "Choose a password.";
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Use at least ${PASSWORD_MIN_LENGTH} characters for your password.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Use at most ${PASSWORD_MAX_LENGTH} characters for your password.`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Sign-up errors from Supabase
// ---------------------------------------------------------------------------

/**
 * Supabase auth error codes the sign-up form may receive.
 * (Full list: node_modules/@supabase/auth-js/dist/module/lib/error-codes.d.ts)
 */
export const SIGN_UP_ERROR_CODES = [
  "weak_password", // Password fails the project's strength/length rules
  "email_address_invalid", // Supabase rejected the address format or domain
  "over_email_send_rate_limit", // Too many confirmation emails sent recently
  "over_request_rate_limit", // Too many sign-up requests from this client
  "signup_disabled", // New sign-ups are switched off for the project
] as const;

export type SignUpErrorCode = (typeof SIGN_UP_ERROR_CODES)[number];

/**
 * Codes Supabase returns for an existing email when email confirmation is OFF.
 * The form treats these as success so the UI never reveals which emails are
 * registered. They are deliberately NOT handled by signUpErrorMessage().
 */
export const ACCOUNT_EXISTS_CODES: readonly string[] = [
  "user_already_exists",
  "email_exists",
];

export function isAccountExistsError(code: string | undefined): boolean {
  return code !== undefined && ACCOUNT_EXISTS_CODES.includes(code);
}

/** Shape of the Supabase AuthError fields we use. */
export type SignUpErrorInput = {
  code?: string;
  /** 0 when the request never reached Supabase (offline, DNS, timeout). */
  status?: number;
};

export const GENERIC_SIGN_UP_ERROR =
  "Something went wrong creating your account. Please try again.";

/**
 * Turn a Supabase sign-up error into a calm, plain-language message.
 *
 * Rules:
 * - Never return Supabase's raw error text.
 * - Never reveal whether an email is already registered.
 * - status 0 means a network problem; tell the user to check their connection.
 * - Anything unrecognised falls back to GENERIC_SIGN_UP_ERROR.
 */
export function signUpErrorMessage(error: SignUpErrorInput): string {
  if (error.status === 0) {
    return "You seem to be offline. Check your internet connection and try again.";
  }

  switch (error.code) {
    case "weak_password":
      return `That password is too weak. Use at least ${PASSWORD_MIN_LENGTH} characters.`;
    case "email_address_invalid":
      return "That email address doesn't look right. Please check it and try again.";
    case "over_email_send_rate_limit":
      return "We can't send more confirmation emails right now. Please wait a few minutes and try again.";
    case "over_request_rate_limit":
      return "Too many attempts in a short time. Please wait a few minutes and try again.";
    case "signup_disabled":
      return "New sign ups are paused right now. Please try again later.";
    default:
      return GENERIC_SIGN_UP_ERROR;
  }
}

// ---------------------------------------------------------------------------
// Log in
// ---------------------------------------------------------------------------

/**
 * Login only checks the password is present: length rules belong to sign up,
 * and hinting at them here would help someone guessing passwords.
 */
export function validateLoginPassword(password: string): string | null {
  return password === "" ? "Enter your password." : null;
}

export const GENERIC_LOGIN_ERROR =
  "Something went wrong logging you in. Please try again.";

/**
 * Turn a Supabase sign-in error into a plain-language message.
 * "invalid_credentials" never says whether the email or the password was
 * wrong, so the form can't be used to discover which emails are registered.
 */
export function loginErrorMessage(error: SignUpErrorInput): string {
  if (error.status === 0) {
    return "You seem to be offline. Check your internet connection and try again.";
  }

  switch (error.code) {
    case "invalid_credentials":
      return "Email or password is incorrect.";
    case "email_not_confirmed":
      return "Please confirm your email first. Check your inbox for the link we sent when you signed up.";
    case "over_request_rate_limit":
      return "Too many attempts in a short time. Please wait a few minutes and try again.";
    default:
      return GENERIC_LOGIN_ERROR;
  }
}
