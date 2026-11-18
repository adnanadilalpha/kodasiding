"use client";

import Image from "next/image";
import Link from "next/link";
import type { KodaVentHero } from "@/lib/cms/types";
import { isSvgMedia } from "@/lib/cms/is-svg-media";
import { safeHref } from "@/lib/cms/safe-href";
import { trackAnalyticsEvent } from "@/lib/analytics/track-client";

export function KodaVentHeroSection({
  hero,
  imageUrl,
}: {
  hero: KodaVentHero;
  imageUrl: string | null;
}) {
  if (!hero.visible) return null;

  const primaryHref = safeHref(hero.primary_cta_href, "#installation");
  const secondaryHref = safeHref(hero.secondary_cta_href, "#product-design");

  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-brand-primary-active pt-28 lg:pt-32"
    >
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-brand-primary-active via-brand-primary to-brand-primary-active opacity-90" />

      <div className="relative z-10 grid items-center gap-10 px-page pb-16 lg:grid-cols-12 lg:gap-8 lg:pb-24">
        <div className="flex flex-col gap-6 text-text-inverse lg:col-span-5 lg:py-8">
          {hero.eyebrow ? (
            <p className="text-xs tracking-[0.16em] text-[#ddddd7] uppercase">
              {hero.eyebrow}
            </p>
          ) : null}
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-[2.5rem] leading-[1.05] font-bold tracking-tight uppercase sm:text-5xl lg:text-6xl">
              {hero.heading}
            </h1>
            {hero.supporting_headline ? (
              <p className="max-w-md text-xl leading-[1.3] text-text-inverse sm:text-2xl">
                {hero.supporting_headline}
              </p>
            ) : null}
          </div>
          {hero.description ? (
            <p className="max-w-md text-base leading-normal text-[#ddddd7]">
              {hero.description}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {hero.primary_cta_label ? (
              <Link
                href={primaryHref}
                onClick={() =>
                  void trackAnalyticsEvent("cta_click", {
                    label: hero.primary_cta_label,
                    metadata: { placement: "kodavent-hero-primary" },
                  })
                }
                className="inline-flex items-center justify-center rounded-md bg-accent-warm px-8 py-3 text-base text-text-primary transition hover:opacity-95"
              >
                {hero.primary_cta_label}
              </Link>
            ) : null}
            {hero.secondary_cta_label ? (
              <Link
                href={secondaryHref}
                className="inline-flex items-center justify-center rounded-md px-4 py-3 text-sm text-text-inverse underline-offset-4 transition hover:underline"
              >
                {hero.secondary_cta_label}
              </Link>
            ) : null}
          </div>

          <dl className="mt-4 hidden max-w-sm grid-cols-2 gap-x-6 gap-y-3 border-t border-white/15 pt-6 text-xs tracking-wide text-[#ddddd7] uppercase lg:grid">
            <div>
              <dt className="text-white/40">Opening</dt>
              <dd className="mt-1 text-text-inverse">4¼ inch</dd>
            </div>
            <div>
              <dt className="text-white/40">Duct</dt>
              <dd className="mt-1 text-text-inverse">4 inch</dd>
            </div>
          </dl>
        </div>

        <div className="relative lg:col-span-7">
          <div className="relative mx-auto aspect-square w-full max-w-xl lg:max-w-none">
            <div
              className="pointer-events-none absolute inset-10 rounded-full border border-white/10 lg:inset-14"
              aria-hidden
            />
            {imageUrl ? (
              isSvgMedia(imageUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={hero.image_alt || hero.heading}
                  className="relative z-1 size-full object-contain p-6 sm:p-10"
                />
              ) : (
                <Image
                  src={imageUrl}
                  alt={hero.image_alt || hero.heading}
                  fill
                  priority
                  loading="eager"
                  fetchPriority="high"
                  quality={95}
                  sizes="(max-width: 1024px) 90vw, 55vw"
                  className="object-contain p-4 sm:p-8"
                />
              )
            ) : (
              <div className="flex size-full items-center justify-center text-sm text-white/40">
                Product image
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
