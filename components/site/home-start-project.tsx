"use client";

import Image from "next/image";
import Link from "next/link";
import type { HomeCtas } from "@/lib/cms/types";
import { safeHref } from "@/lib/cms/safe-href";
import { useQuote } from "@/components/site/quote-provider";

export function HomeStartProject({
  ctas,
  quoteImage,
  dealerImage,
}: {
  ctas: HomeCtas;
  quoteImage: string;
  dealerImage: string;
}) {
  const { openQuote } = useQuote();
  const showDealer = ctas.show_dealer === true;

  if (!showDealer) {
    return (
      <QuoteOnlyCinematic
        headline={ctas.quote.headline}
        body={ctas.quote.body}
        ctaLabel={ctas.quote.cta_label}
        image={quoteImage}
        onCta={openQuote}
      />
    );
  }

  return (
    <section
      id="contact"
      className="scroll-mt-16 bg-brand-primary py-12 sm:py-16 lg:scroll-mt-24 lg:py-24"
    >
      <div className="flex w-full flex-col gap-10 px-page sm:gap-12 lg:gap-16">
        <div className="flex flex-col items-center gap-4 text-center sm:gap-6">
          <h2 className="font-display text-[1.75rem] font-bold text-text-inverse uppercase sm:text-4xl lg:text-5xl">
            Ready to Get Started?
          </h2>
          <p className="max-w-85 text-lg leading-[1.4] text-[#ddddd7]">
            Choose the path that best matches your project.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
          <CtaCard
            image={quoteImage}
            headline={ctas.quote.headline}
            body={ctas.quote.body}
            ctaLabel={ctas.quote.cta_label}
            onCta={openQuote}
          />
          <div
            className="hidden flex-col items-center justify-center px-6 lg:flex"
            aria-hidden
          >
            <div className="w-px flex-1 bg-black/10" />
            <div className="flex flex-col items-center gap-1.5 py-5">
              <span className="size-1 rounded-full bg-black/14" />
              <span className="size-1 rounded-full bg-black/8" />
              <span className="size-1 rounded-full bg-black/5" />
            </div>
            <div className="w-px flex-1 bg-black/6" />
          </div>
          <CtaCard
            image={dealerImage}
            headline={ctas.dealer.headline}
            body={ctas.dealer.body}
            ctaLabel={ctas.dealer.cta_label}
            href={safeHref(ctas.dealer.cta_href, "/find-dealer")}
            tone="dark"
          />
        </div>
      </div>
    </section>
  );
}

/**
 * Quote-only layout when Find Dealer is hidden.
 * Editorial split: product image left + copy panel right.
 */
function QuoteOnlyCinematic({
  headline,
  body,
  ctaLabel,
  image,
  onCta,
}: {
  headline: string;
  body: string;
  ctaLabel: string;
  image: string;
  onCta: () => void;
}) {
  return (
    <section
      id="contact"
      className="scroll-mt-16 grid min-h-0 overflow-hidden bg-brand-primary lg:min-h-145 lg:scroll-mt-24 lg:grid-cols-[1fr_1fr] lg:gap-x-12"
    >
      <div className="relative order-1 min-h-72 overflow-hidden sm:min-h-80 lg:order-0 lg:min-h-full">
        <Image
          src={image}
          alt=""
          fill
          quality={95}
          sizes="(max-width: 1024px) 100vw, 45vw"
          className="object-cover object-[center_42%]"
        />
      </div>

      <div className="relative z-10 order-2 flex min-w-0 flex-col justify-center gap-6 px-page py-12 sm:gap-8 sm:py-16 lg:order-0 lg:py-24">
        <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
          <p className="font-display text-sm tracking-[0.2em] text-accent-warm uppercase">
            Start your project
          </p>
          <h2 className="font-display text-[1.75rem] leading-[1.15] font-bold text-text-inverse uppercase sm:text-4xl sm:whitespace-nowrap lg:text-[2.75rem] xl:text-5xl">
            {headline}
          </h2>
          <p className="max-w-md text-base leading-[1.45] text-[#ddddd7] lg:text-lg">
            {body}
          </p>
        </div>
        <button
          type="button"
          onClick={onCta}
          className="inline-flex w-fit items-center justify-center rounded-md bg-accent-warm px-8 py-3.5 text-base text-text-primary transition hover:opacity-90"
        >
          {ctaLabel} →
        </button>
      </div>
    </section>
  );
}

function CtaCard({
  image,
  headline,
  body,
  ctaLabel,
  href,
  onCta,
  tone = "brand",
}: {
  image: string;
  headline: string;
  body: string;
  ctaLabel: string;
  href?: string;
  onCta?: () => void;
  tone?: "brand" | "dark";
}) {
  const buttonClass =
    tone === "dark"
      ? "inline-flex items-center justify-center rounded-md bg-brand-primary-active px-6 py-3 text-base text-text-inverse"
      : "inline-flex items-center justify-center rounded-md bg-brand-primary px-6 py-3 text-base text-text-inverse";

  return (
    <article className="relative min-h-155 overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={image}
          alt=""
          fill
          quality={95}
          sizes="(max-width: 1024px) 100vw, 40vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[rgba(8,12,8,0.72)] via-[rgba(8,12,8,0.28)] to-transparent" />
      </div>
      <div className="relative flex h-full min-h-155 flex-col justify-end p-4 sm:p-6">
        <div className="flex flex-col gap-6 rounded-md border border-white/55 bg-[rgba(253,252,248,0.84)] p-7 shadow-md backdrop-blur-sm">
          <div className="flex flex-col gap-4">
            <h3 className="text-2xl font-bold text-[#1a1c18] uppercase sm:text-3xl">
              {headline}
            </h3>
            <p className="text-lg leading-[1.4] text-[#5a5848]">{body}</p>
          </div>
          {href ? (
            <Link href={href} className={buttonClass}>
              {ctaLabel} →
            </Link>
          ) : (
            <button type="button" onClick={onCta} className={buttonClass}>
              {ctaLabel} →
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
