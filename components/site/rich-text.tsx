import { sanitizeRichText, richTextHasContent } from "@/lib/cms/sanitize-rich-text";

export function RichText({
  html,
  className = "",
  as: Tag = "div",
}: {
  html: string | null | undefined;
  className?: string;
  as?: "div" | "p" | "span";
}) {
  const safe = sanitizeRichText(html);
  if (!richTextHasContent(safe)) return null;

  return (
    <Tag
      className={`[&_em]:italic [&_strong]:font-bold [&_u]:underline ${className}`}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}

export { richTextHasContent };
