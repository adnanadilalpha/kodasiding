/** True when a media path, URL, or MIME type is SVG. */
export function isSvgMedia(
  pathOrUrl?: string | null,
  mimeType?: string | null,
) {
  if (mimeType === "image/svg+xml") return true;
  if (!pathOrUrl) return false;
  const lower = pathOrUrl.toLowerCase();
  return (
    lower.endsWith(".svg") ||
    lower.includes(".svg?") ||
    lower.includes("image/svg")
  );
}
