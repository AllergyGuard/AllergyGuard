import { describe, expect, it } from "vitest";
import {
  GENERIC_LOGIN_ERROR,
  GENERIC_SIGN_UP_ERROR,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  SIGN_UP_ERROR_CODES,
  isAccountExistsError,
  loginErrorMessage,
  signUpErrorMessage,
  validateEmail,
  validateLoginPassword,
  validatePassword,
} from "./validation";

describe("validateLoginPassword", () => {
  it("requires a password", () => {
    expect(validateLoginPassword("")).toEqual(expect.any(String));
  });

  it("does not apply sign-up length rules", () => {
    expect(validateLoginPassword("short")).toBeNull();
  });
});

describe("loginErrorMessage", () => {
  it("does not say whether the email or the password was wrong", () => {
    const message = loginErrorMessage({ code: "invalid_credentials", status: 400 });
    expect(message).not.toBe(GENERIC_LOGIN_ERROR);
    expect(message.toLowerCase()).toContain("email or password");
    expect(message.toLowerCase()).not.toMatch(/no account|not registered|not found/);
  });

  it("asks unconfirmed users to confirm their email", () => {
    expect(
      loginErrorMessage({ code: "email_not_confirmed", status: 400 }).toLowerCase(),
    ).toContain("confirm");
  });

  it("tells the user to wait when rate limited", () => {
    expect(
      loginErrorMessage({ code: "over_request_rate_limit", status: 429 }).toLowerCase(),
    ).toContain("wait");
  });

  it("tells the user to check their connection on a network failure", () => {
    expect(loginErrorMessage({ status: 0 }).toLowerCase()).toMatch(
      /connection|internet|offline|network/,
    );
  });

  it("falls back to the generic message for unknown or missing codes", () => {
    expect(loginErrorMessage({ code: "something_new", status: 500 })).toBe(
      GENERIC_LOGIN_ERROR,
    );
    expect(loginErrorMessage({})).toBe(GENERIC_LOGIN_ERROR);
  });
});

describe("validateEmail", () => {
  it.each(["name@example.com", "  a.b+tag@mail.co.uk  "])(
    "accepts %s",
    (email) => {
      expect(validateEmail(email)).toBeNull();
    },
  );

  it.each(["", "   ", "name", "name@", "@example.com", "name@example", "a b@example.com"])(
    "rejects %j",
    (email) => {
      expect(validateEmail(email)).toEqual(expect.any(String));
    },
  );
});

describe("validatePassword", () => {
  it("rejects an empty password", () => {
    expect(validatePassword("")).toEqual(expect.any(String));
  });

  it("rejects a password one character too short", () => {
    expect(validatePassword("a".repeat(PASSWORD_MIN_LENGTH - 1))).toMatch(
      String(PASSWORD_MIN_LENGTH),
    );
  });

  it("accepts a password at the minimum and maximum length", () => {
    expect(validatePassword("a".repeat(PASSWORD_MIN_LENGTH))).toBeNull();
    expect(validatePassword("a".repeat(PASSWORD_MAX_LENGTH))).toBeNull();
  });

  it("rejects a password over the bcrypt limit", () => {
    expect(validatePassword("a".repeat(PASSWORD_MAX_LENGTH + 1))).toEqual(
      expect.any(String),
    );
  });
});

describe("isAccountExistsError", () => {
  it("recognises the codes Supabase uses for an existing account", () => {
    expect(isAccountExistsError("user_already_exists")).toBe(true);
    expect(isAccountExistsError("email_exists")).toBe(true);
  });

  it("is false for other codes and missing codes", () => {
    expect(isAccountExistsError("weak_password")).toBe(false);
    expect(isAccountExistsError(undefined)).toBe(false);
  });
});

describe("signUpErrorMessage", () => {
  it.each(SIGN_UP_ERROR_CODES)("gives %s its own specific message", (code) => {
    const message = signUpErrorMessage({ code, status: 400 });
    expect(message.trim()).not.toBe("");
    expect(message).not.toBe(GENERIC_SIGN_UP_ERROR);
  });

  it("gives every known code a different message", () => {
    const messages = SIGN_UP_ERROR_CODES.map((code) =>
      signUpErrorMessage({ code, status: 400 }),
    );
    expect(new Set(messages).size).toBe(messages.length);
  });

  it("tells the user to check their connection on a network failure", () => {
    const message = signUpErrorMessage({ status: 0 });
    expect(message).not.toBe(GENERIC_SIGN_UP_ERROR);
    expect(message.toLowerCase()).toMatch(/connection|internet|offline|network/);
  });

  it("mentions the minimum length for a weak password", () => {
    expect(signUpErrorMessage({ code: "weak_password", status: 422 })).toMatch(
      String(PASSWORD_MIN_LENGTH),
    );
  });

  it("falls back to the generic message for unknown or missing codes", () => {
    expect(signUpErrorMessage({ code: "something_new", status: 500 })).toBe(
      GENERIC_SIGN_UP_ERROR,
    );
    expect(signUpErrorMessage({})).toBe(GENERIC_SIGN_UP_ERROR);
  });

  it("never reveals whether an email is registered", () => {
    const all = [
      ...SIGN_UP_ERROR_CODES.map((code) => signUpErrorMessage({ code })),
      signUpErrorMessage({ status: 0 }),
      signUpErrorMessage({}),
    ];
    for (const message of all) {
      expect(message.toLowerCase()).not.toMatch(
        /already (registered|exists|in use)|account exists/,
      );
    }
  });
});
