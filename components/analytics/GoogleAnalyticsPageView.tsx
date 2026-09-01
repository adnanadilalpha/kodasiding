"use client";

import { trackGoogleAnalyticsPageView } from "@/lib/analytics/google-analytics";
import { canTrackAnalytics } from "@/lib/analytics/track-client";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function GoogleAnalyticsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || !canTrackAnalytics()) return;

    const query = searchParams?.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    trackGoogleAnalyticsPageView(pagePath);
  }, [pathname, searchParams]);

  return null;
}
