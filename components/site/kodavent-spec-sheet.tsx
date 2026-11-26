import { RichText } from "@/components/site/rich-text";

export function KodaVentSpecSheet({
  title,
  viewLabel,
  downloadLabel,
  href,
}: {
  title: string;
  viewLabel: string;
  downloadLabel: string;
  href: string;
}) {
  return (
    <div className="flex flex-col border border-text-inverse/15 bg-brand-primary">
      <div className="flex items-baseline justify-between gap-4 px-5 py-5 sm:px-6">
        <h3 className="font-display text-xl font-bold tracking-tight text-text-inverse sm:text-2xl">
          <RichText html={title} as="span" />
        </h3>
        <p className="text-xs tracking-[0.16em] text-text-inverse/55">PDF</p>
      </div>
      <div className="flex flex-col gap-3 border-t border-text-inverse/15 p-5 sm:flex-row sm:p-6">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center rounded-md bg-text-inverse px-6 py-3 text-sm text-text-primary transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-text-inverse focus-visible:outline-none"
        >
          <RichText html={viewLabel} as="span" />
        </a>
        <a
          href={href}
          download="KodaVent-specification.pdf"
          className="inline-flex flex-1 items-center justify-center rounded-md bg-text-primary px-6 py-3 text-sm text-text-inverse transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-text-inverse focus-visible:outline-none"
        >
          <RichText html={downloadLabel} as="span" />
        </a>
      </div>
    </div>
  );
}
