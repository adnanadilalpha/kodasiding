"use client";

import Image from "next/image";
import Link from "next/link";
import type { KodaVentHero } from "@/lib/cms/types";
import { safeHref } from "@/lib/cms/safe-href";
import { trackAnalyticsEvent } from "@/lib/analytics/track-client";
import { RichText } from "@/components/site/rich-text";
import { plainTextFromRich } from "@/lib/cms/sanitize-rich-text";

export function KodaVentHeroSection({
  hero,
  imageUrl,
  imageAlt,
}: {
  hero: KodaVentHero;
  imageUrl: string | null;
  imageAlt?: string;
}) {
  if (!hero.visible) return null;

  const primaryHref = safeHref(hero.primary_cta_href, "#order");
  const secondaryHref = safeHref(hero.secondary_cta_href, "#installation");

  return (
    <section id="hero" className="bg-bg-primary pt-28 lg:pt-36">
      <div className="grid items-center gap-10 px-page pb-16 lg:grid-cols-2 lg:gap-16 lg:pb-24">
        <div className="flex flex-col gap-6 text-brand-primary">
          {hero.eyebrow ? (
            <p className="inline-flex w-fit bg-accent-warm px-2.5 py-1 text-xs font-bold tracking-[0.08em] text-text-primary">
              <RichText html={hero.eyebrow} as="span" />
            </p>
          ) : null}
          <h1 className="font-display text-6xl leading-[0.95] font-bold tracking-tight sm:text-7xl lg:text-8xl">
            <RichText html={hero.heading} as="span" />
            {hero.supporting_headline ? (
              <span className="mt-3 block text-xl tracking-normal text-brand-primary/75 sm:text-2xl">
                <RichText html={hero.supporting_headline} as="span" />
              </span>
            ) : null}
          </h1>
          {hero.description ? (
            <p className="max-w-md font-display text-2xl leading-tight font-bold sm:text-3xl">
              <RichText html={hero.description} as="span" />
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {hero.primary_cta_label ? (
              <Link
                href={primaryHref}
                onClick={() =>
                  void trackAnalyticsEvent("cta_click", {
                    label: plainTextFromRich(hero.primary_cta_label),
                    metadata: { placement: "kodavent-hero-primary" },
                  })
                }
                className="inline-flex items-center justify-center rounded-md bg-brand-primary px-8 py-3 text-base text-text-inverse transition hover:bg-brand-primary-active"
              >
                <RichText html={hero.primary_cta_label} as="span" />
              </Link>
            ) : null}
            {hero.secondary_cta_label ? (
              <Link
                href={secondaryHref}
                className="inline-flex items-center justify-center rounded-md px-4 py-3 text-sm text-brand-primary underline-offset-4 transition hover:underline"
              >
                <RichText html={hero.secondary_cta_label} as="span" />
              </Link>
            ) : null}
          </div>
        </div>

        {imageUrl ? (
          <div className="relative order-first mx-auto aspect-square w-full max-w-md lg:order-last lg:max-w-xl">
            <div
              aria-hidden
              className="kodavent-float-shadow absolute bottom-[2%] left-1/2 h-[7%] w-[62%] -translate-x-1/2 rounded-[50%] bg-brand-primary/35 blur-xl"
            />
            <div className="kodavent-float absolute inset-x-[6%] top-[4%] bottom-[14%]">
              <Image
                src={imageUrl}
                alt={plainTextFromRich(
                  imageAlt || hero.image_alt || hero.heading,
                )}
                fill
                priority
                unoptimized
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain drop-shadow-[0_28px_32px_rgb(24_46_34/0.22)]"
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
