/** Normalize paths so `/` and duplicate slashes don't create separate analytics rows. */
export function normalizeAnalyticsPath(path: string): string {
  if (!path) return "/";

  let normalized = path.split("?")[0]?.split("#")[0] ?? "/";
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  if (normalized.length > 1) {
    normalized = normalized.replace(/\/+$/, "");
  }

  return normalized || "/";
}
