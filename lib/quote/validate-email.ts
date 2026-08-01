const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.org",
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "trashmail.com",
  "yopmail.com",
  "sharklasers.com",
  "getnada.com",
  "maildrop.cc",
  "discard.email",
  "mailnesia.com",
  "throwaway.email",
  "fakeinbox.com",
]);

const BLOCKED_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "test.org",
  "localhost",
  "invalid",
  "email.com",
]);

const BLOCKED_LOCAL_PARTS = new Set([
  "test",
  "testing",
  "tester",
  "asdf",
  "qwerty",
  "abc",
  "abcd",
  "spam",
  "noreply",
  "no-reply",
  "donotreply",
  "fake",
  "null",
  "user",
  "admin",
  "sample",
  "demo",
]);

const EMAIL_RE =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export type EmailCheckResult =
  | { ok: true; email: string }
  | { ok: false; reason: string };

export function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

/** Reject disposable, placeholder, and obvious test/spam addresses. */
export function validateQuoteEmail(raw: string): EmailCheckResult {
  const email = normalizeEmail(raw);
  if (!email) return { ok: false, reason: "Email is required." };
  if (email.length > 254) return { ok: false, reason: "Email is too long." };
  if (!EMAIL_RE.test(email)) {
    return { ok: false, reason: "Enter a valid email address." };
  }

  const [localRaw, domain] = email.split("@");
  const local = localRaw.split("+")[0] ?? localRaw;

  if (!domain || domain.includes("..")) {
    return { ok: false, reason: "Enter a valid email address." };
  }

  if (BLOCKED_DOMAINS.has(domain) || DISPOSABLE_DOMAINS.has(domain)) {
    return {
      ok: false,
      reason: "Please use a permanent personal or work email address.",
    };
  }

  if (
    BLOCKED_LOCAL_PARTS.has(local) ||
    /^(test|spam|fake|asdf|qwerty)\d*$/i.test(local)
  ) {
    return {
      ok: false,
      reason: "Please use a real email address — test addresses are not accepted.",
    };
  }

  if (local.length < 2) {
    return { ok: false, reason: "Enter a valid email address." };
  }

  return { ok: true, email };
}
