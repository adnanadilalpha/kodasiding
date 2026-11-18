"use client";

import Link from "next/link";
import type { KodaVentCta } from "@/lib/cms/types";
import { useQuote } from "@/components/site/quote-provider";
import { safeHref } from "@/lib/cms/safe-href";
import { trackAnalyticsEvent } from "@/lib/analytics/track-client";

function isQuoteHref(href: string) {
  const value = href.trim().toLowerCase();
  return !value || value === "#quote" || value === "quote";
}

export function KodaVentCtaSection({ cta }: { cta: KodaVentCta }) {
  const { openQuote } = useQuote();
  if (!cta.visible) return null;

  const href = safeHref(cta.cta_href, "#quote");
  const opensQuote = isQuoteHref(cta.cta_href || "#quote");

  return (
    <section
      id="kodavent-cta"
      className="scroll-mt-16 bg-bg-primary py-20 lg:scroll-mt-24 lg:py-28"
    >
      <div className="grid items-center gap-10 px-page lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-8">
          <p className="text-xs tracking-[0.16em] text-text-secondary uppercase">
            05 / Next Step
          </p>
          <h2 className="mt-4 font-display text-[1.85rem] leading-[1.08] font-bold tracking-tight text-brand-primary uppercase sm:text-4xl lg:text-5xl">
            {cta.heading}
          </h2>
          {cta.description ? (
            <p className="mt-5 max-w-xl text-base leading-normal text-text-primary/75 lg:text-lg">
              {cta.description}
            </p>
          ) : null}
        </div>

        <div className="lg:col-span-4 lg:justify-self-end">
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
                className="inline-flex items-center justify-center rounded-md bg-brand-primary px-8 py-3.5 text-base text-text-inverse transition hover:bg-brand-primary-active focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
              >
                {cta.cta_label}
              </button>
            ) : (
              <Link
                href={href}
                onClick={() =>
                  void trackAnalyticsEvent("cta_click", {
                    label: cta.cta_label,
                    metadata: { placement: "kodavent-final-cta" },
                  })
                }
                className="inline-flex items-center justify-center rounded-md bg-brand-primary px-8 py-3.5 text-base text-text-inverse transition hover:bg-brand-primary-active"
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
