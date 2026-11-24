import Image from "next/image";
import type { KodaVentProductDesign } from "@/lib/cms/types";
import { isSvgMedia } from "@/lib/cms/is-svg-media";
import { DEFAULT_PAGE_KODAVENT } from "@/lib/cms/kodavent-defaults";
import { RichText } from "@/components/site/rich-text";

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
}: {
  section: KodaVentProductDesign;
  imageUrl: string | null;
  imageAlt: string;
  badgeLabel?: string;
  caption?: string;
  figureTitle?: string;
}) {
  if (!section.visible) return null;

  const eyebrow =
    section.eyebrow?.trim() || DEFAULT_PAGE_KODAVENT.product_design.eyebrow;

  const benefits = (section.annotations ?? []).filter(
    (item) => item.visible !== false && (item.title?.trim() || item.description?.trim()),
  );

  return (
    <section
      id="why-kodavent"
      className="scroll-mt-16 bg-brand-primary-active py-20 lg:scroll-mt-24 lg:py-28"
    >
      <div className="flex flex-col gap-14 px-page lg:gap-20">
        <header className="grid gap-6 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <p className="text-xs tracking-[0.16em] text-text-inverse/55">
              <RichText html={eyebrow} as="span" />
            </p>
            <h2 className="mt-4 font-display text-3xl leading-[1.08] font-bold tracking-tight text-text-inverse sm:text-4xl lg:text-5xl">
              <RichText html={section.heading} as="span" />
            </h2>
          </div>
          {section.description ? (
            <p className="max-w-md self-end text-base leading-normal text-text-inverse/75 lg:col-span-5 lg:text-lg">
              <RichText html={section.description} as="span" />
            </p>
          ) : null}
        </header>

        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-12">
          <figure className="relative mb-8 lg:col-span-5 lg:sticky lg:top-28">
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

          <ol className="flex flex-col gap-10 lg:col-span-7 lg:gap-12">
            {benefits.map((benefit, index) => (
              <li
                key={benefit.id}
                className="border-t border-text-inverse/15 pt-8 first:border-t-0 first:pt-0"
              >
                <p className="font-display text-xs tracking-[0.16em] text-accent-warm uppercase">
                  {String(index + 1).padStart(2, "0")}
                </p>
                {benefit.title ? (
                  <h3 className="mt-3 font-display text-xl font-bold tracking-tight text-text-inverse sm:text-2xl">
                    <RichText html={benefit.title} as="span" />
                  </h3>
                ) : null}
                {benefit.description ? (
                  <p className="mt-4 max-w-xl text-base leading-normal text-text-inverse/75">
                    <RichText html={benefit.description} as="span" />
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
