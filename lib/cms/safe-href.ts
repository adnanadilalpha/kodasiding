/**
 * Allow only relative site paths and http(s) URLs.
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
