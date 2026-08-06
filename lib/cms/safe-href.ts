/**
 * Allow relative site paths and http(s) URLs for rendering links from CMS/DB.
 * Blocks javascript:, data:, and other dangerous schemes.
 */
export function safeHref(raw: string | null | undefined, fallback = "#"): string {
  const value = String(raw ?? "").trim();
  if (!value) return fallback;

  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  if (value.startsWith("#")) {
    return value;
  }

  return externalHref(value, fallback);
}

/**
 * Admin-editable URLs only — http(s) absolute links.
 * Rejects internal paths like /profiles, protocol-relative //…, and other schemes.
 */
export function externalHref(
  raw: string | null | undefined,
  fallback = "",
): string {
  const value = String(raw ?? "").trim();
  if (!value) return fallback;

  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    // not an absolute URL
  }

  return fallback;
}

export function isExternalHref(raw: string | null | undefined): boolean {
  const value = String(raw ?? "").trim();
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
