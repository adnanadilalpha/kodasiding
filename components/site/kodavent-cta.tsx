"use client";

import Link from "next/link";
import type { KodaVentCta, KodaVentRetailerLink } from "@/lib/cms/types";
import { useQuote } from "@/components/site/quote-provider";
import { safeHref } from "@/lib/cms/safe-href";
import { trackAnalyticsEvent } from "@/lib/analytics/track-client";

function isQuoteHref(href: string) {
  const value = href.trim().toLowerCase();
  return !value || value === "#quote" || value === "quote";
}

function isExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

export function KodaVentCtaSection({ cta }: { cta: KodaVentCta }) {
  const { openQuote } = useQuote();
  if (!cta.visible) return null;

  const retailers = (cta.retailers ?? []).filter((r) => r.visible);
  const hasRetailers = retailers.length > 0;
  const href = safeHref(cta.cta_href, "#quote");
  const opensQuote = isQuoteHref(cta.cta_href || "#quote");
  const secondaryClass = hasRetailers
    ? "inline-flex w-full items-center justify-center rounded-md border border-brand-primary/25 px-6 py-3 text-sm text-brand-primary transition hover:border-brand-primary hover:bg-brand-primary/5 sm:max-w-sm"
    : "inline-flex items-center justify-center rounded-md bg-brand-primary px-8 py-3.5 text-base text-text-inverse transition hover:bg-brand-primary-active";

  return (
    <section
      id="order"
      className="scroll-mt-16 bg-bg-secondary py-20 lg:scroll-mt-24 lg:py-28"
    >
      <div className="grid items-center gap-10 px-page lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <p className="inline-flex w-fit bg-accent-warm px-2.5 py-1 text-xs font-bold tracking-[0.08em] text-text-primary uppercase">
            Order now
          </p>
          <h2 className="mt-4 font-display text-[1.85rem] leading-[1.08] font-bold tracking-tight text-brand-primary sm:text-4xl lg:text-5xl">
            {cta.heading}
          </h2>
          {cta.description ? (
            <p className="mt-5 max-w-xl text-base leading-normal text-text-primary/75 lg:text-lg">
              {cta.description}
            </p>
          ) : null}
          <p className="mt-4 text-sm text-text-secondary">
            <Link
              href="#installation"
              className="underline decoration-from-font underline-offset-4 transition hover:text-brand-primary"
            >
              Review installation guides
            </Link>
          </p>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-5 lg:items-end">
          {hasRetailers ? (
            <ul className="flex w-full flex-col gap-3 sm:max-w-sm">
              {retailers.map((retailer) => (
                <RetailerButton key={retailer.id} retailer={retailer} />
              ))}
            </ul>
          ) : null}
          {cta.cta_label ? (
            opensQuote ? (
              <button
                type="button"
                onClick={() => {
                  void trackAnalyticsEvent("cta_click", {
                    label: cta.cta_label,
                    metadata: { placement: "kodavent-final-cta" },
                  });
                  openQuote();
                }}
                className={`${secondaryClass} focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none`}
              >
                {cta.cta_label}
              </button>
            ) : (
              <Link
                href={href}
                {...(isExternal(href)
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                onClick={() =>
                  void trackAnalyticsEvent("cta_click", {
                    label: cta.cta_label,
                    metadata: { placement: "kodavent-final-cta" },
                  })
                }
                className={secondaryClass}
              >
                {cta.cta_label}
              </Link>
            )
          ) : null}
        </div>
      </div>
    </section>
  );
}

function RetailerButton({ retailer }: { retailer: KodaVentRetailerLink }) {
  const ready = Boolean(retailer.href?.trim());

  if (!ready) {
    return (
      <li>
        <span className="flex w-full items-center justify-between gap-4 rounded-md border border-brand-primary/15 bg-bg-primary px-6 py-3.5 text-base text-text-secondary">
          <span>{retailer.label}</span>
          <span className="text-xs tracking-[0.12em] uppercase">Link coming soon</span>
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
            label: retailer.label,
            metadata: {
              placement: "kodavent-order-retailer",
              retailer: retailer.id,
            },
          })
        }
        className="flex w-full items-center justify-between gap-4 rounded-md bg-brand-primary px-6 py-3.5 text-base text-text-inverse transition hover:bg-brand-primary-active focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
      >
        <span>{retailer.label}</span>
        <span aria-hidden className="text-accent-warm">
          →
        </span>
      </Link>
    </li>
  );
}
