"use client";

import Image from "next/image";
import Link from "next/link";
import type { KodaVentCta, KodaVentRetailerLink } from "@/lib/cms/types";
import { isSvgMedia } from "@/lib/cms/is-svg-media";
import { useQuote } from "@/components/site/quote-provider";
import { safeHref } from "@/lib/cms/safe-href";
import { trackAnalyticsEvent } from "@/lib/analytics/track-client";
import { DEFAULT_PAGE_KODAVENT } from "@/lib/cms/kodavent-defaults";
import { RichText } from "@/components/site/rich-text";
import { plainTextFromRich } from "@/lib/cms/sanitize-rich-text";

function isQuoteHref(href: string) {
  const value = href.trim().toLowerCase();
  return !value || value === "#quote" || value === "quote";
}

function isExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

export function KodaVentCtaSection({
  cta,
  imageUrl,
  imageAlt,
  imageCaption,
}: {
  cta: KodaVentCta;
  imageUrl?: string | null;
  imageAlt?: string;
  imageCaption?: string;
}) {
  const { openQuote } = useQuote();
  if (!cta.visible) return null;

  const eyebrow = cta.eyebrow?.trim() || DEFAULT_PAGE_KODAVENT.cta.eyebrow;
  const guidesLabel =
    cta.guides_link_label?.trim() || DEFAULT_PAGE_KODAVENT.cta.guides_link_label;
  const comingSoonLabel =
    cta.coming_soon_label?.trim() || DEFAULT_PAGE_KODAVENT.cta.coming_soon_label;

  const retailers = (cta.retailers ?? []).filter((r) => r.visible);
  const href = safeHref(cta.cta_href, "#quote");
  const opensQuote = isQuoteHref(cta.cta_href || "#quote");
  const quoteClass =
    "inline-flex items-center rounded-md bg-brand-primary px-8 py-3 font-display text-sm tracking-wide text-text-inverse uppercase transition hover:bg-brand-primary-active focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none";

  return (
    <section
      id="order"
      className="scroll-mt-16 border-t border-brand-primary/10 bg-bg-primary py-16 lg:scroll-mt-24 lg:py-24"
    >
      <div className="grid items-center gap-10 px-page lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        {imageUrl ? (
          <figure className="min-w-0">
            <div className="relative aspect-square w-full">
              {isSvgMedia(imageUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={imageAlt || "KodaVent retail packaging"}
                  className="absolute inset-0 size-full object-contain"
                />
              ) : (
                <Image
                  src={imageUrl}
                  alt={imageAlt || "KodaVent retail packaging"}
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-contain"
                />
              )}
            </div>
            {imageCaption ? (
              <figcaption className="mt-3 text-center text-xs tracking-[0.14em] text-text-secondary lg:text-left">
                <RichText html={imageCaption} as="span" />
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        <div className="flex min-w-0 flex-col">
          <p className="inline-flex w-fit bg-accent-warm px-2.5 py-1 text-xs font-bold tracking-[0.08em] text-text-primary">
            <RichText html={eyebrow} as="span" />
          </p>
          <h2 className="mt-4 font-display text-4xl leading-none font-bold tracking-tight text-brand-primary lg:text-5xl">
            <RichText html={cta.heading} as="span" />
          </h2>
          {cta.description ? (
            <p className="mt-4 max-w-xl text-base leading-relaxed text-text-primary/75">
              <RichText html={cta.description} as="span" />
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            {cta.cta_label ? (
              opensQuote ? (
                <button
                  type="button"
                  onClick={() => {
                    void trackAnalyticsEvent("cta_click", {
                      label: plainTextFromRich(cta.cta_label),
                      metadata: { placement: "kodavent-final-cta" },
                    });
                    openQuote();
                  }}
                  className={quoteClass}
                >
                  <RichText html={cta.cta_label} as="span" />
                </button>
              ) : (
                <Link
                  href={href}
                  {...(isExternal(href)
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  onClick={() =>
                    void trackAnalyticsEvent("cta_click", {
                      label: plainTextFromRich(cta.cta_label),
                      metadata: { placement: "kodavent-final-cta" },
                    })
                  }
                  className={quoteClass}
                >
                  <RichText html={cta.cta_label} as="span" />
                </Link>
              )
            ) : null}
            {retailers.length > 0 ? (
              <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {retailers.map((retailer) => (
                  <RetailerButton
                    key={retailer.id}
                    retailer={retailer}
                    comingSoonLabel={comingSoonLabel}
                  />
                ))}
              </ul>
            ) : null}
            <Link
              href="#installation"
              className="text-sm text-text-secondary underline decoration-from-font underline-offset-4 transition hover:text-brand-primary"
            >
              <RichText html={guidesLabel} as="span" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function RetailerButton({
  retailer,
  comingSoonLabel,
}: {
  retailer: KodaVentRetailerLink;
  comingSoonLabel: string;
}) {
  const ready = Boolean(retailer.href?.trim());

  if (!ready) {
    return (
      <li>
        <span className="inline-flex items-baseline gap-2 text-sm text-text-secondary">
          <RichText html={retailer.label} as="span" />
          <span className="text-xs tracking-[0.08em] text-text-secondary/60">
            <RichText html={comingSoonLabel} as="span" />
          </span>
        </span>
      </li>
    );
  }

  const href = safeHref(retailer.href, "#");
  const external = isExternal(href);

  return (
    <li>
      <Link
        href={href}
        {...(external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
        onClick={() =>
          void trackAnalyticsEvent("cta_click", {
            label: plainTextFromRich(retailer.label),
            metadata: {
              placement: "kodavent-order-retailer",
              retailer: retailer.id,
            },
          })
        }
        className="inline-flex items-center gap-1.5 text-sm text-brand-primary underline decoration-from-font underline-offset-4 transition hover:text-brand-primary-active focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
      >
        <span>
          <RichText html={retailer.label} as="span" />
        </span>
        <span aria-hidden className="text-accent-warm">
          →
        </span>
      </Link>
    </li>
  );
}
