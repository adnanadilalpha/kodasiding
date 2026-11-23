"use client";

import Link from "next/link";
import type { HomeInstallServices } from "@/lib/cms/types";
import { useQuote } from "@/components/site/quote-provider";
import { trackAnalyticsEvent } from "@/lib/analytics/track-client";

export function HomeInstallServicesSection({
  services,
}: {
  services: HomeInstallServices;
}) {
  const { openQuote } = useQuote();

  return (
    <section
      id="installation"
      className="scroll-mt-16 bg-bg-secondary py-16 lg:scroll-mt-24 lg:py-24"
    >
      <div className="grid items-center gap-10 px-page lg:grid-cols-12 lg:gap-12">
        <div className="flex flex-col gap-5 text-brand-primary lg:col-span-7">
          {services.service_area ? (
            <p className="inline-flex w-fit bg-accent-warm px-2.5 py-1 text-xs font-bold tracking-[0.08em] text-text-primary uppercase">
              Available in {services.service_area}
            </p>
          ) : null}
          <h2 className="font-display text-[1.85rem] leading-[1.08] font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {services.headline}
          </h2>
          {services.body ? (
            <p className="max-w-xl text-base leading-normal text-text-primary/75 lg:text-lg">
              {services.body}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 lg:col-span-5 lg:items-end">
          <button
            type="button"
            onClick={() => {
              void trackAnalyticsEvent("cta_click", {
                label: services.primary_cta_label,
                metadata: { placement: "home-install-services" },
              });
              openQuote();
            }}
            className="inline-flex w-full items-center justify-center rounded-md bg-brand-primary px-8 py-3.5 text-base text-text-inverse transition hover:bg-brand-primary-active sm:max-w-sm"
          >
            {services.primary_cta_label}
          </button>
          <Link
            href={services.diy_cta_href}
            onClick={() =>
              void trackAnalyticsEvent("cta_click", {
                label: services.diy_cta_label,
                metadata: { placement: "home-install-diy" },
              })
            }
            className="inline-flex w-full items-center justify-center rounded-md border border-brand-primary/25 px-6 py-3 text-sm text-brand-primary transition hover:border-brand-primary hover:bg-brand-primary/5 sm:max-w-sm"
          >
            {services.diy_cta_label}
          </Link>
        </div>
      </div>
    </section>
  );
}
