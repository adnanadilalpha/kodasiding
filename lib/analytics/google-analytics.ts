export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";

export function isGoogleAnalyticsEnabled(): boolean {
  return GA_MEASUREMENT_ID.length > 0;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackGoogleAnalyticsPageView(pagePath: string): void {
  if (!isGoogleAnalyticsEnabled() || typeof window === "undefined") return;

  window.gtag?.("config", GA_MEASUREMENT_ID, {
    page_path: pagePath,
  });
}
