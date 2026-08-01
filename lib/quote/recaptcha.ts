const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

export type RecaptchaResult =
  | { ok: true; score?: number; mode: "verified" | "dev_skip" }
  | {
      ok: false;
      reason: string;
      /** Only `unavailable` may use rate-limited fallback. */
      code:
        | "missing_config"
        | "missing_token"
        | "unavailable"
        | "verify_failed"
        | "low_score";
    };

/**
 * Verify Google reCAPTCHA v3 token.
 * Production always requires a valid token when keys are configured.
 * Development may skip only when keys are absent.
 */
export async function verifyRecaptcha(
  token: string | null | undefined,
  remoteip?: string | null,
): Promise<RecaptchaResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY?.trim();
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim();
  const isProd = process.env.NODE_ENV === "production";

  if (!secret || !siteKey) {
    if (isProd) {
      return {
        ok: false,
        reason: "Spam protection is not configured. Please try again later.",
        code: "missing_config",
      };
    }
    return { ok: true, mode: "dev_skip" };
  }

  if (!token) {
    return {
      ok: false,
      reason: "Please wait for spam protection to finish, then try again.",
      code: "missing_token",
    };
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (remoteip) body.set("remoteip", remoteip);

  let data: {
    success?: boolean;
    score?: number;
    action?: string;
    "error-codes"?: string[];
  };

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      return {
        ok: false,
        reason: "Spam check failed. Please try again.",
        code: "unavailable",
      };
    }
    data = (await res.json()) as typeof data;
  } catch {
    return {
      ok: false,
      reason: "Spam check failed. Please try again.",
      code: "unavailable",
    };
  }

  if (!data.success) {
    return {
      ok: false,
      reason: "Spam check failed. Please try again.",
      code: "verify_failed",
    };
  }

  if (typeof data.score === "number" && data.score < 0.5) {
    return {
      ok: false,
      reason: "Unable to verify this request. Please try again shortly.",
      code: "low_score",
    };
  }

  if (data.action && data.action !== "quote_submit") {
    return {
      ok: false,
      reason: "Spam check failed. Please try again.",
      code: "verify_failed",
    };
  }

  return { ok: true, score: data.score, mode: "verified" };
}

/** Max fallback submissions per IP per hour when captcha infrastructure fails. */
export const CAPTCHA_FALLBACK_LIMIT = 3;

/** Max quote submissions per IP per hour (all paths). */
export const QUOTE_RATE_LIMIT_IP = 5;

/** Max quote submissions per email per hour. */
export const QUOTE_RATE_LIMIT_EMAIL = 3;
