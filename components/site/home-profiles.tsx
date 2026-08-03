import Image from "next/image";
import Link from "next/link";
import type { HomeProfileJewel, HomeProfilesTeaser } from "@/lib/cms/types";
import { isSvgMedia } from "@/lib/cms/is-svg-media";
import { PROFILES_HREF, normalizeLinkHref } from "@/lib/cms/nav-slots";
import { safeHref } from "@/lib/cms/safe-href";

export function HomeProfilesSection({
  teaser,
  jewels,
  images,
}: {
  teaser: HomeProfilesTeaser;
  jewels: HomeProfileJewel[];
  images: Record<string, string>;
}) {
  const ctaHref = normalizeLinkHref(safeHref(teaser.cta_href, PROFILES_HREF));

  return (
    <section
      id="profiles"
      className="scroll-mt-16 bg-brand-primary py-12 lg:scroll-mt-24 lg:py-24"
    >
      <div className="flex w-full flex-col items-center gap-10 px-page lg:gap-12">
        <div className="mx-auto flex w-full flex-col items-center gap-4 text-center text-text-inverse">
          <h2 className="font-display text-[1.75rem] leading-tight font-bold uppercase sm:text-4xl lg:text-5xl">
            {teaser.headline.includes(". ") ? (
              <>
                {teaser.headline.slice(0, teaser.headline.indexOf(". ") + 1)}
                <br />
                {teaser.headline.slice(teaser.headline.indexOf(". ") + 2)}
              </>
            ) : (
              teaser.headline
            )}
          </h2>
          <p className="max-w-3xl text-base leading-[1.4] text-[#ddddd7] lg:text-lg">
            {teaser.body}
          </p>
        </div>

        <ul className="grid w-full grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-8">
          {jewels.map((jewel) => {
            const src =
              (jewel.image_media_id && images[jewel.image_media_id]) ||
              images[jewel.id] ||
              "/landing/jewel-h4.webp";
            return (
              <li
                key={jewel.id}
                className="flex flex-col items-center gap-4 text-center lg:gap-6"
              >
                <div className="relative h-36 w-full sm:h-44 lg:h-54.5 lg:max-w-76">
                  {isSvgMedia(src) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src}
                      alt={jewel.name}
                      className="absolute inset-0 size-full object-contain"
                    />
                  ) : (
                    <Image
                      src={src}
                      alt={jewel.name}
                      fill
                      quality={95}
                      sizes="(max-width: 1024px) 45vw, 304px"
                      className="object-contain"
                    />
                  )}
                </div>
                <div className="flex flex-col gap-1 text-text-inverse">
                  <p className="text-base font-bold lg:text-xl">{jewel.name}</p>
                  <p className="text-xs text-[#ddddd7] lg:text-sm">
                    {jewel.reveal}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <Link
          href={ctaHref}
          className="inline-flex items-center justify-center rounded-md bg-accent-warm px-8 py-3 text-base text-text-primary"
        >
          {teaser.cta_label}
        </Link>
      </div>
    </section>
  );
}
