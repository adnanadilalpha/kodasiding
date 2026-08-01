/** Quote attachment constraints — keep in sync with storage bucket migration. */
export const QUOTE_ATTACHMENT_BUCKET = "quote-attachments";
export const QUOTE_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024; // 5MB

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
