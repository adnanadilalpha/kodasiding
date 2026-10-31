const ALLOWED_TAGS = new Set([
  "b",
  "strong",
  "i",
  "em",
  "u",
  "br",
  "p",
  "div",
  "span",
]);

/** True when the string has visible text after stripping tags. */
export function richTextHasContent(html: string | null | undefined) {
  return Boolean(
    String(html ?? "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

/**
 * Allow only bold / italic / underline markup (plus basic line breaks).
 * Strips attributes and unknown tags. Safe for CMS → public HTML.
 */
export function sanitizeRichText(html: string | null | undefined): string {
  const raw = String(html ?? "").trim();
  if (!raw) return "";

  // Plain text (legacy CMS content) — escape and keep.
  if (!/<[a-z][\s\S]*>/i.test(raw)) {
    return escapeText(raw);
  }

  // Server / edge-safe path without DOM.
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return sanitizeRichTextString(raw);
  }

  const doc = new DOMParser().parseFromString(`<div>${raw}</div>`, "text/html");
  const root = doc.body.firstElementChild;
  if (!root) return sanitizeRichTextString(raw);
  return cleanNode(root).trim();
}

function escapeText(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cleanNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeText(node.textContent ?? "");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as Element;
  const tag = el.tagName.toLowerCase();

  if (tag === "br") return "<br>";

  const inner = Array.from(el.childNodes).map(cleanNode).join("");

  if (tag === "b" || tag === "strong") return `<strong>${inner}</strong>`;
  if (tag === "i" || tag === "em") return `<em>${inner}</em>`;
  if (tag === "u") return `<u>${inner}</u>`;
  if (tag === "p" || tag === "div") {
    // Keep paragraph breaks as line breaks for compact Why Koda bodies.
    return inner ? `${inner}<br>` : "";
  }
  if (tag === "span" || !ALLOWED_TAGS.has(tag)) {
    return inner;
  }
  return inner;
}

/** Regex fallback when DOMParser is unavailable (server actions). */
function sanitizeRichTextString(html: string): string {
  let out = html
    .replace(/<\/?(script|style|iframe|object|embed)[^>]*>/gi, "")
    .replace(/ on\w+="[^"]*"/gi, "")
    .replace(/ on\w+='[^']*'/gi, "")
    .replace(/ javascript:/gi, "");

  // Normalize formatting tags.
  out = out
    .replace(/<\s*b\b[^>]*>/gi, "<strong>")
    .replace(/<\s*\/\s*b\s*>/gi, "</strong>")
    .replace(/<\s*strong\b[^>]*>/gi, "<strong>")
    .replace(/<\s*\/\s*strong\s*>/gi, "</strong>")
    .replace(/<\s*i\b[^>]*>/gi, "<em>")
    .replace(/<\s*\/\s*i\s*>/gi, "</em>")
    .replace(/<\s*em\b[^>]*>/gi, "<em>")
    .replace(/<\s*\/\s*em\s*>/gi, "</em>")
    .replace(/<\s*u\b[^>]*>/gi, "<u>")
    .replace(/<\s*\/\s*u\s*>/gi, "</u>")
    .replace(/<\s*br\s*\/?\s*>/gi, "<br>")
    .replace(/<\s*\/?\s*p\b[^>]*>/gi, "<br>")
    .replace(/<\s*\/?\s*div\b[^>]*>/gi, "<br>");

  // Drop any remaining tags.
  out = out.replace(/<(?!\/?(?:strong|em|u|br)\b)[^>]+>/gi, "");

  // Collapse noisy break runs from pasted HTML.
  out = out.replace(/(?:<br>\s*){3,}/gi, "<br><br>");
  out = out.replace(/^(?:<br>\s*)+|(?:<br>\s*)+$/gi, "");

  return out.trim();
}
