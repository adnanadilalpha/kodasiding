import Image from "next/image";
import type { KodaVentInstalled } from "@/lib/cms/types";
import { isSvgMedia } from "@/lib/cms/is-svg-media";

export function KodaVentInstalledSection({
  section,
  imageUrl,
}: {
  section: KodaVentInstalled;
  imageUrl: string | null;
}) {
  if (!section.visible || !imageUrl) return null;

  const caption =
    section.caption?.trim() || "KODAVENT / INSTALLED APPLICATION";

  return (
    <section
      id="installed"
      className="scroll-mt-16 bg-bg-secondary py-20 lg:scroll-mt-24 lg:py-32"
    >
      <div className="grid gap-10 px-page lg:grid-cols-12 lg:items-end lg:gap-10">
        <div className="lg:col-span-4 lg:pb-2">
          <p className="text-xs tracking-[0.16em] text-text-secondary uppercase">
            03 / The Wall
          </p>
          <h2 className="mt-4 font-display text-[1.85rem] leading-[1.08] font-bold tracking-tight text-brand-primary uppercase sm:text-4xl lg:text-5xl">
            {section.heading}
          </h2>
          {section.description ? (
            <p className="mt-5 max-w-sm text-base leading-normal text-text-primary/75 lg:text-lg">
              {section.description}
            </p>
          ) : null}
        </div>

        <figure className="lg:col-span-8">
          <div className="relative aspect-4/3 w-full overflow-hidden bg-bg-primary sm:aspect-16/10 lg:min-h-125 lg:aspect-auto">
            {isSvgMedia(imageUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={section.image_alt || section.heading}
                className="absolute inset-0 size-full object-cover object-center"
              />
            ) : (
              <Image
                src={imageUrl}
                alt={section.image_alt || section.heading}
                fill
                quality={95}
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover object-center"
              />
            )}
          </div>
          <figcaption className="mt-4 text-xs tracking-[0.14em] text-text-secondary uppercase">
            {caption}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
