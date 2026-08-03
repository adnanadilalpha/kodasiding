/** Static landing assets used when CMS media ids are empty. */
export const LANDING_FALLBACKS = {
  hero: "/landing/hero.webp",
  whyKoda: "/landing/why-koda.webp",
  ctaQuote: "/landing/cta-quote.webp",
  ctaDealer: "/landing/cta-dealer.webp",
  jewels: [
    "/landing/jewel-h4.webp",
    "/landing/jewel-h6.webp",
    "/landing/jewel-h8.webp",
    "/landing/jewel-v4.webp",
  ],
} as const;

export function jewelFallback(index: number) {
  const list = LANDING_FALLBACKS.jewels;
  return list[index % list.length];
}
