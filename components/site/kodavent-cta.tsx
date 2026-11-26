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

  return (
    <section
      id="order"
      className="scroll-mt-16 border-t border-brand-primary/10 bg-bg-primary py-16 lg:scroll-mt-24 lg:py-24"
    >
      <div className="grid items-start gap-12 px-page lg:grid-cols-12 lg:gap-16">
        {imageUrl ? (
          <figure className="min-w-0 lg:col-span-5">
            <div className="relative mx-auto aspect-square w-full max-w-md lg:mx-0 lg:max-w-none">
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
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-contain"
                />
              )}
            </div>
            {imageCaption ? (
              <figcaption className="mt-4 text-center text-xs tracking-[0.14em] text-text-secondary lg:text-left">
                <RichText html={imageCaption} as="span" />
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        <div
          className={`flex min-w-0 flex-col gap-8 ${imageUrl ? "lg:col-span-7" : "lg:col-span-12"}`}
        >
          <div>
            <p className="inline-flex w-fit bg-accent-warm px-2.5 py-1 text-xs font-bold tracking-[0.08em] text-text-primary">
              <RichText html={eyebrow} as="span" />
            </p>
            <h2 className="mt-4 max-w-xl font-display text-3xl leading-[1.08] font-bold tracking-tight text-balance text-brand-primary sm:text-4xl lg:text-5xl">
              <RichText html={cta.heading} as="span" />
            </h2>
            {cta.description ? (
              <p className="mt-4 max-w-xl text-base leading-relaxed text-text-primary/75">
                <RichText html={cta.description} as="span" />
              </p>
            ) : null}
          </div>

          {retailers.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {retailers.map((retailer) => (
                <RetailerButton
                  key={retailer.id}
                  retailer={retailer}
                  comingSoonLabel={comingSoonLabel}
                />
              ))}
            </ul>
          ) : null}

          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2">
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
                  className="text-sm text-text-secondary underline  decoration-from-font underline-offset-4 transition hover:text-brand-primary focus-visible:outline-none"
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
                  className="text-sm text-text-secondary underline decoration-from-font underline-offset-4 transition hover:text-brand-primary focus-visible:outline-none"
                >
                  <RichText html={cta.cta_label} as="span" />
                </Link>
              )
            ) : null}
            <Link
              href="#installation"
              className="text-sm text-text-secondary underline decoration-from-font underline-offset-4 transition hover:text-brand-primary focus-visible:outline-none"
            >
              <RichText html={guidesLabel} as="span" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function RetailerMark({
  retailer,
}: {
  retailer: KodaVentRetailerLink & { logoUrl?: string | null };
}) {
  const name = plainTextFromRich(retailer.label);
  if (retailer.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={retailer.logoUrl}
        alt=""
        className="h-8 w-auto max-w-36 object-contain"
      />
    );
  }
  return (
    <span className="font-display text-xl leading-none font-bold tracking-tight text-brand-primary">
      {name}
    </span>
  );
}

function RetailerButton({
  retailer,
  comingSoonLabel,
}: {
  retailer: KodaVentRetailerLink & { logoUrl?: string | null };
  comingSoonLabel: string;
}) {
  const ready = Boolean(retailer.href?.trim());
  const name = plainTextFromRich(retailer.label);
  const tile =
    "flex min-h-20 w-full flex-col items-center justify-center gap-1.5 rounded-md border border-brand-primary/12 bg-text-inverse px-5 py-4";

  if (!ready) {
    return (
      <li>
        <span className={`${tile} text-text-secondary`} aria-label={name}>
          <RetailerMark retailer={retailer} />
          <span className="text-xs tracking-[0.08em] text-text-secondary/70">
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
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        aria-label={`Buy on ${name}`}
        onClick={() =>
          void trackAnalyticsEvent("cta_click", {
            label: name,
            metadata: {
              placement: "kodavent-order-retailer",
              retailer: retailer.id,
            },
          })
        }
        className={`${tile} transition hover:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none`}
      >
        <RetailerMark retailer={retailer} />
      </Link>
    </li>
  );
}
