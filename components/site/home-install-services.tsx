"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { HomeVideosSection } from "@/lib/cms/types";
import { resolveInstallTownPoints } from "@/lib/cms/install-service-geo";
import { DEFAULT_INSTALLATION_PAGE } from "@/lib/cms/installation-defaults";
import { useQuote } from "@/components/site/quote-provider";
import { trackAnalyticsEvent } from "@/lib/analytics/track-client";
import { RichText } from "@/components/site/rich-text";
import { sanitizeRichText, plainTextFromRich } from "@/lib/cms/sanitize-rich-text";

const InstallServiceAreaMap = dynamic(
  () =>
    import("@/components/site/install-service-area-map").then(
      (m) => m.InstallServiceAreaMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 w-full items-center justify-center bg-[#c8dff0] text-xs font-medium tracking-wide text-brand-primary/50 uppercase sm:h-72 lg:h-80">
        Loading map…
      </div>
    ),
  },
);

/** Split sanitized HTML (legacy newlines already became <br>) into paragraphs. */
function splitParagraphs(body: string) {
  return sanitizeRichText(body)
    .split(/(?:<br>\s*){2,}/i)
    .map((part) => part.replace(/^(?:<br>\s*)+|(?:<br>\s*)+$/gi, "").trim())
    .filter(Boolean);
}

function splitCities(cities: string) {
  return String(cities ?? "")
    .split(/\s*[·•|]\s*|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function HomeInstallServicesSection({
  section,
  heroImageUrl,
  diyHref = "/installation",
}: {
  section: HomeVideosSection;
  heroImageUrl: string;
  diyHref?: string;
}) {
  const { openQuote } = useQuote();
  const paragraphs = splitParagraphs(section.body);
  const cities = splitCities(section.cities ?? "");
  const townPoints = resolveInstallTownPoints(cities);
  const serviceArea =
    section.hero_service_label?.trim() || "Omaha & surrounding areas";
  const radiusMiles =
    typeof section.install_radius_miles === "number" &&
    section.install_radius_miles > 0
      ? section.install_radius_miles
      : 60;
  const coverageIntro =
    section.cities_intro?.trim() ||
    "Green circle = where Koda crews install. Tap a pin or type your town.";
  const diyLabel = section.diy_link_label?.trim() || "Install it yourself";
  const eyebrowPrefix =
    section.eyebrow_prefix?.trim() || DEFAULT_INSTALLATION_PAGE.eyebrow_prefix;
  const coverageHeading =
    section.coverage_heading?.trim() ||
    DEFAULT_INSTALLATION_PAGE.coverage_heading;
  const townSearchPlaceholder =
    section.town_search_placeholder?.trim() ||
    DEFAULT_INSTALLATION_PAGE.town_search_placeholder;
  const servicesCtaLabel =
    section.services_cta_label?.trim() ||
    DEFAULT_INSTALLATION_PAGE.services_cta_label;
  const heroImageAlt =
    section.hero_image_alt?.trim() || DEFAULT_INSTALLATION_PAGE.hero_image_alt;
  const [townQuery, setTownQuery] = useState("");
  const townMatches = (() => {
    const q = townQuery.trim().toLowerCase();
    if (!q) return [];
    return cities.filter((city) => city.toLowerCase().includes(q));
  })();
  const exactTownMatch =
    townMatches.find(
      (city) => city.toLowerCase() === townQuery.trim().toLowerCase(),
    ) ?? (townMatches.length === 1 ? townMatches[0] : null);

  return (
    <section
      id="installation"
      className="relative isolate flex min-h-140 scroll-mt-16 flex-col overflow-x-hidden sm:min-h-160 lg:min-h-dvh lg:scroll-mt-24"
    >
      <Image
        src={heroImageUrl}
        alt={plainTextFromRich(heroImageAlt)}
        fill
        quality={90}
        sizes="100vw"
        className="object-cover object-[68%_center] sm:object-[60%_center] lg:object-[55%_center]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-r from-brand-primary-active/50 via-brand-primary-active/10 to-transparent lg:via-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-t from-brand-primary-active/45 via-transparent to-brand-primary-active/20"
      />

      <div className="relative z-1 flex flex-1 flex-col justify-end px-page pb-8 pt-16 sm:pb-12 lg:justify-center lg:py-16">
        <div className="install-hero-rise w-full max-w-md bg-brand-primary-active/72 p-7 text-text-inverse backdrop-blur-lg sm:max-w-xl sm:p-9 lg:max-w-150 lg:p-11">
          <header className="flex flex-col gap-3.5">
            {serviceArea ? (
              <p className="text-xs font-bold tracking-[0.16em] text-accent-warm">
                <RichText html={eyebrowPrefix} as="span" /> ·{" "}
                <RichText html={serviceArea} as="span" />
              </p>
            ) : null}
            <h2 className="font-display text-[1.85rem] leading-[1.08] font-bold tracking-tight text-balance sm:text-4xl lg:text-[2.65rem] lg:leading-[1.05]">
              <RichText html={section.headline} as="span" />
            </h2>
          </header>

          {paragraphs[0] ? (
            <p className="mt-5 text-sm leading-relaxed text-text-inverse/80 sm:text-base lg:text-lg">
              <RichText html={paragraphs[0]} as="span" />
            </p>
          ) : null}

          <div className="mt-6 sm:mt-7">
            <Link
              href={diyHref}
              onClick={() =>
                void trackAnalyticsEvent("cta_click", {
                  label: plainTextFromRich(diyLabel),
                  metadata: { placement: "home-install-diy" },
                })
              }
              className="inline-flex items-center justify-center rounded-md bg-text-inverse px-6 py-3 text-sm text-brand-primary transition hover:bg-accent-warm sm:px-7 sm:py-3.5 sm:text-base"
            >
              <RichText html={diyLabel} as="span" />
            </Link>
          </div>
        </div>

        {cities.length > 0 ? (
          <aside className="install-hero-rise install-hero-rise-delay-2 mt-8 w-full max-w-md self-end overflow-hidden bg-bg-primary/95 backdrop-blur-md lg:absolute lg:right-page lg:bottom-8 lg:mt-0 lg:max-w-105">
            {townPoints.length > 0 ? (
              <InstallServiceAreaMap
                points={townPoints}
                selectedName={exactTownMatch}
                onSelectTown={setTownQuery}
                radiusMiles={radiusMiles}
              />
            ) : null}

            <div className="border-l-4 border-accent-warm p-3.5 text-brand-primary sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[0.65rem] font-bold tracking-[0.14em] text-brand-primary/50">
                    {radiusMiles} mi · <RichText html={serviceArea} as="span" />
                  </p>
                  <p className="mt-0.5 font-display text-base leading-tight font-bold tracking-tight sm:text-lg">
                    <RichText html={coverageHeading} as="span" />
                  </p>
                </div>
              </div>

              <label className="mt-2.5 block">
                <span className="sr-only">Your town</span>
                <input
                  type="search"
                  value={townQuery}
                  onChange={(e) => setTownQuery(e.target.value)}
                  placeholder={plainTextFromRich(townSearchPlaceholder)}
                  autoComplete="address-level2"
                  className="w-full rounded-md border border-brand-primary/15 bg-bg-secondary px-3 py-2 text-sm text-brand-primary outline-none placeholder:text-brand-primary/35 focus:border-brand-primary/45"
                />
              </label>

              {townQuery.trim() ? (
                <div
                  className={`mt-2 rounded-md px-2.5 py-1.5 text-xs leading-snug sm:text-sm ${
                    exactTownMatch
                      ? "bg-accent-warm/35 text-brand-primary"
                      : "bg-bg-secondary text-brand-primary/75"
                  }`}
                  role="status"
                >
                  {exactTownMatch ? (
                    <p>
                      <span className="font-bold">Yes.</span> We install in{" "}
                      {exactTownMatch}.
                    </p>
                  ) : townMatches.length > 0 ? (
                    <p>
                      Did you mean{" "}
                      {townMatches.slice(0, 3).map((city, i) => (
                        <span key={city}>
                          {i > 0 ? ", " : ""}
                          <button
                            type="button"
                            onClick={() => setTownQuery(city)}
                            className="font-medium underline underline-offset-2"
                          >
                            {city}
                          </button>
                        </span>
                      ))}
                      ?
                    </p>
                  ) : (
                    <p>
                      Not listed — still ask. We cover towns inside the{" "}
                      {radiusMiles}-mile radius.
                    </p>
                  )}
                </div>
              ) : coverageIntro ? (
                <p className="mt-2 text-xs leading-relaxed text-brand-primary/55">
                  <RichText html={coverageIntro} as="span" />
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  void trackAnalyticsEvent("cta_click", {
                    label: exactTownMatch
                      ? `Request quote for ${exactTownMatch}`
                      : plainTextFromRich(servicesCtaLabel),
                    metadata: {
                      placement: "home-install-coverage",
                      town: exactTownMatch || townQuery.trim() || "",
                    },
                  });
                  openQuote();
                }}
                className="mt-2.5 inline-flex w-full items-center justify-center rounded-md bg-brand-primary px-4 py-2.5 text-sm text-text-inverse transition hover:bg-brand-primary-active"
              >
                {exactTownMatch ? (
                  `Request quote · ${exactTownMatch}`
                ) : (
                  <RichText html={servicesCtaLabel} as="span" />
                )}
              </button>
            </div>
          </aside>
        ) : null}
      </div>

      {paragraphs.length > 1 ? (
        <div className="relative z-1 border-t border-brand-primary/10 bg-bg-primary">
          <div className="mx-auto max-w-7xl px-page py-10 sm:py-12 lg:py-14 xl:max-w-8xl">
            <div className="flex max-w-3xl flex-col gap-3.5">
              {paragraphs.slice(1).map((paragraph) => (
                <p
                  key={paragraph.slice(0, 48)}
                  className="text-base leading-relaxed text-text-primary/75"
                >
                  <RichText html={paragraph} as="span" />
                </p>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
