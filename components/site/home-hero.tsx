"use client";

import Image from "next/image";
import Link from "next/link";
import type { HomeHero } from "@/lib/cms/types";
import { PROFILES_HREF, normalizeLinkHref } from "@/lib/cms/nav-slots";
import { safeHref } from "@/lib/cms/safe-href";
import { trackAnalyticsEvent } from "@/lib/analytics/track-client";
import { RichText } from "@/components/site/rich-text";
import { plainTextFromRich } from "@/lib/cms/sanitize-rich-text";

export function HomeHeroSection({
  hero,
  imageUrl,
}: {
  hero: HomeHero;
  imageUrl: string;
}) {
  const ctaHref = normalizeLinkHref(safeHref(hero.cta_href, PROFILES_HREF));

  return (
    <section
      id="hero"
      className="relative min-h-138 overflow-hidden bg-brand-primary-active sm:min-h-154 lg:min-h-dvh"
    >
      {/* Mobile Figma 390×553: image 390×270 at bottom (~49%).
          Tablet: full width × ~74%. Desktop: full bleed cutout. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[49%] sm:h-[74%] lg:inset-0 lg:h-full"
        aria-hidden
      >
        <Image
          src={imageUrl}
          alt={plainTextFromRich(hero.headline) || "Koda Siding"}
          fill
          loading="eager"
          fetchPriority="high"
          quality={95}
          sizes="100vw"
          className="object-cover object-bottom-right lg:object-contain lg:object-bottom-right"
        />
      </div>

      <div className="relative z-10 flex min-h-138 items-start px-page pt-16 pb-12 sm:min-h-154 sm:items-center sm:pt-24 lg:min-h-dvh lg:pb-16">
        <div className="flex w-full max-w-md flex-col gap-8 pt-12 sm:max-w-84 sm:pt-0 lg:max-w-2xl">
          <div className="flex flex-col gap-4 text-text-inverse">
            <h1 className="font-display text-[2rem] leading-[1.3] font-bold sm:text-4xl lg:text-6xl lg:leading-[1.3]">
              <RichText html={hero.headline} as="span" />
            </h1>
            <p className="text-lg leading-[1.4] lg:text-xl">
              <RichText html={hero.subheadline} as="span" />
            </p>
          </div>
          <Link
            href={ctaHref}
            onClick={() =>
              void trackAnalyticsEvent("cta_click", {
                label: plainTextFromRich(hero.cta_label) || "Hero CTA",
                metadata: { placement: "hero" },
              })
            }
            className="inline-flex w-fit items-center justify-center rounded-md bg-black px-8 py-3 text-base text-white"
          >
            <RichText html={hero.cta_label} as="span" />
          </Link>
        </div>
      </div>
    </section>
  );
}
