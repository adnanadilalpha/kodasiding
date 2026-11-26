import Image from "next/image";
import type { DocumentRow, KodaVentProductDesign } from "@/lib/cms/types";
import { isSvgMedia } from "@/lib/cms/is-svg-media";
import {
  DEFAULT_PAGE_KODAVENT,
  KODAVENT_SPEC_DOCUMENT_KEY,
  KODAVENT_SPEC_PDF_PATH,
} from "@/lib/cms/kodavent-defaults";
import { publicMediaUrl } from "@/lib/cms/urls";
import { RichText } from "@/components/site/rich-text";
import { KodaVentSpecSheet } from "@/components/site/kodavent-spec-sheet";

function specificationHref(documents: DocumentRow[]) {
  const uploaded = documents.find(
    (doc) => doc.key === KODAVENT_SPEC_DOCUMENT_KEY && doc.storage_path,
  );
  if (!uploaded) return KODAVENT_SPEC_PDF_PATH;
  return (
    publicMediaUrl(uploaded.storage_path, uploaded.bucket) ??
    KODAVENT_SPEC_PDF_PATH
  );
}

function Media({
  src,
  alt,
  className,
  sizes,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
}) {
  if (isSvgMedia(src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} />;
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      sizes={sizes}
      className={className}
    />
  );
}

export function KodaVentProductDesignSection({
  section,
  imageUrl,
  imageAlt,
  badgeLabel,
  caption,
  figureTitle,
  documents = [],
}: {
  section: KodaVentProductDesign;
  imageUrl: string | null;
  imageAlt: string;
  badgeLabel?: string;
  caption?: string;
  figureTitle?: string;
  documents?: DocumentRow[];
}) {
  if (!section.visible) return null;

  const eyebrow =
    section.eyebrow?.trim() || DEFAULT_PAGE_KODAVENT.product_design.eyebrow;
  const spec = DEFAULT_PAGE_KODAVENT.product_design;
  const specTitle = section.spec_title?.trim() || spec.spec_title;
  const viewLabel = section.spec_link_label?.trim() || spec.spec_link_label;
  const downloadLabel =
    section.spec_download_label?.trim() || spec.spec_download_label;
  const specHref = specificationHref(documents);

  return (
    <section
      id="product-details"
      className="scroll-mt-16 bg-brand-primary-active py-20 lg:scroll-mt-24 lg:py-28"
    >
      <span id="product-design" className="sr-only scroll-mt-16 lg:scroll-mt-24" />
      <div className="flex flex-col gap-14 px-page lg:gap-20">
        <header className="max-w-3xl">
          <p className="text-xs tracking-[0.16em] text-text-inverse/55">
            <RichText html={eyebrow} as="span" />
          </p>
          <h2 className="mt-4 font-display text-3xl leading-[1.08] font-bold tracking-tight text-text-inverse sm:text-4xl lg:text-5xl">
            <RichText html={section.heading} as="span" />
          </h2>
        </header>

        <div className="grid items-stretch gap-12 lg:grid-cols-12 lg:gap-12">
          <figure className="relative mb-8 self-start lg:col-span-5 lg:sticky lg:top-28">
            <div
              aria-hidden
              className="absolute inset-0 translate-x-4 translate-y-4 bg-brand-primary sm:translate-x-6 sm:translate-y-6"
            />
            <div className="relative aspect-square overflow-hidden bg-bg-secondary">
              {imageUrl ? (
                <Media
                  src={imageUrl}
                  alt={imageAlt}
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover object-center"
                />
              ) : null}
              {badgeLabel ? (
                <span className="absolute top-4 right-4 bg-accent-warm px-2.5 py-1 text-xs font-bold tracking-[0.08em] text-text-primary">
                  <RichText html={badgeLabel} as="span" />
                </span>
              ) : null}
            </div>
            {caption || figureTitle ? (
              <figcaption className="absolute -bottom-6 -left-3 bg-bg-primary px-5 py-4 shadow-xl shadow-brand-primary/20 sm:-left-6">
                {caption ? (
                  <span className="block text-xs tracking-[0.14em] text-text-secondary">
                    <RichText html={caption} as="span" />
                  </span>
                ) : null}
                {figureTitle ? (
                  <span className="mt-1 block font-display text-lg font-bold tracking-tight text-brand-primary">
                    <RichText html={figureTitle} as="span" />
                  </span>
                ) : null}
              </figcaption>
            ) : null}
          </figure>

          <div className="flex flex-col gap-8 lg:col-span-7">
            {section.description ? (
              <p className="max-w-xl text-base leading-normal text-text-inverse/75 lg:text-lg">
                <RichText html={section.description} as="span" />
              </p>
            ) : null}
            {section.parts?.length ? (
              <ul className="flex flex-col border-t border-text-inverse/15">
                {section.parts.map((part) => (
                  <li
                    key={part.id}
                    className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-text-inverse/15 py-4"
                  >
                    <span className="font-display text-xs tracking-[0.16em] text-accent-warm">
                      {part.mark}
                    </span>
                    <span className="font-display text-xl font-bold tracking-tight text-text-inverse sm:text-2xl">
                      {part.name}
                    </span>
                    {part.qty ? (
                      <span className="text-sm text-text-inverse/55 tabular-nums">
                        × {part.qty}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="lg:mt-auto">
              <KodaVentSpecSheet
                title={specTitle}
                viewLabel={viewLabel}
                downloadLabel={downloadLabel}
                href={specHref}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
