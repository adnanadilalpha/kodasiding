/** Classify device from User-Agent — same buckets GA uses. */

export type DeviceType = "desktop" | "mobile" | "tablet";

export function deviceTypeFromUserAgent(
  userAgent: string | null | undefined,
): DeviceType {
  const ua = (userAgent ?? "").toLowerCase();
  if (!ua) return "desktop";

  if (
    /ipad|tablet|playbook|silk|(android(?!.*mobile))|kindle|nook|sfm/.test(ua)
  ) {
    return "tablet";
  }

  if (
    /mobi|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini|opera mobi|iemobile/.test(
      ua,
    )
  ) {
    return "mobile";
  }

  return "desktop";
}
