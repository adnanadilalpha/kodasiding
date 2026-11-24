import Image from "next/image";
import type { KodaVentInstalled } from "@/lib/cms/types";
import { DEFAULT_KODAVENT_INSTALLED } from "@/lib/cms/kodavent-defaults";
import { isSvgMedia } from "@/lib/cms/is-svg-media";
import { RichText } from "@/components/site/rich-text";
import { plainTextFromRich } from "@/lib/cms/sanitize-rich-text";

export function KodaVentInstalledSection({
  section,
  imageUrl,
}: {
  section: KodaVentInstalled;
  imageUrl: string | null;
}) {
  if (!section.visible || !imageUrl) return null;

  const eyebrow =
    section.eyebrow?.trim() || DEFAULT_KODAVENT_INSTALLED.eyebrow;
  const caption =
    section.caption?.trim() || DEFAULT_KODAVENT_INSTALLED.caption;
  const badgeLabel =
    section.badge_label?.trim() || DEFAULT_KODAVENT_INSTALLED.badge_label;
  const figureTitle =
    section.figure_title?.trim() || DEFAULT_KODAVENT_INSTALLED.figure_title;
  const traits = (
    section.traits?.length
      ? section.traits
      : DEFAULT_KODAVENT_INSTALLED.traits ?? []
  )
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <section
      id="installed"
      className="scroll-mt-16 overflow-hidden bg-bg-primary py-20 lg:scroll-mt-24 lg:py-28"
    >
      <div className="grid items-center gap-14 px-page lg:grid-cols-12 lg:gap-10">
        <header className="lg:col-span-5">
          {eyebrow ? (
            <p className="text-xs tracking-[0.16em] text-text-secondary">
              <RichText html={eyebrow} as="span" />
            </p>
          ) : null}
          <h2 className="mt-4 font-display text-[1.85rem] leading-[1.08] font-bold tracking-tight text-brand-primary sm:text-4xl lg:text-5xl">
            <RichText html={section.heading} as="span" />
          </h2>
          {section.description ? (
            <p className="mt-4 max-w-md text-base leading-normal text-text-primary/75 lg:text-lg">
              <RichText html={section.description} as="span" />
            </p>
          ) : null}

          {traits.length ? (
            <ul className="mt-10 flex flex-col border-t border-brand-primary/15">
              {traits.map((trait, i) => (
                <li
                  key={`${trait}-${i}`}
                  className="flex items-baseline gap-5 border-b border-brand-primary/15 py-4"
                >
                  <span className="text-xs tracking-[0.14em] text-text-secondary tabular-nums">
                    {`0${i + 1}`}
                  </span>
                  <span className="font-display text-xl font-bold tracking-tight text-brand-primary lg:text-2xl">
                    {trait}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </header>

        <figure className="relative mx-auto w-full max-w-md sm:max-w-lg lg:col-span-6 lg:col-start-7 lg:mr-0">
          <div
            aria-hidden
            className="absolute inset-0 translate-x-4 translate-y-4 bg-brand-primary sm:translate-x-6 sm:translate-y-6"
          />
          <div className="relative aspect-square overflow-hidden bg-bg-secondary shadow-2xl shadow-brand-primary/20">
            {isSvgMedia(imageUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={plainTextFromRich(section.image_alt || section.heading)}
                className="absolute inset-0 size-full object-cover object-center"
              />
            ) : (
              <Image
                src={imageUrl}
                alt={plainTextFromRich(section.image_alt || section.heading)}
                fill
                unoptimized
                sizes="(max-width: 1024px) 90vw, 40vw"
                className="object-cover object-center"
              />
            )}
            {badgeLabel ? (
              <span className="absolute top-4 right-4 bg-accent-warm px-2.5 py-1 text-xs font-bold tracking-[0.08em] text-text-primary">
                <RichText html={badgeLabel} as="span" />
              </span>
            ) : null}
          </div>
          <figcaption className="absolute -bottom-6 -left-3 bg-bg-primary px-5 py-4 shadow-xl shadow-brand-primary/15 sm:-left-8">
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
        </figure>
      </div>
    </section>
  );
}
