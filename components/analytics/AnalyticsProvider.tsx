"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { GoogleAnalyticsPageView } from "@/components/analytics/GoogleAnalyticsPageView";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";

/** Mounts automatic first-party and Google Analytics page tracking. */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <PageViewTracker />
      <Suspense fallback={null}>
        <GoogleAnalyticsPageView />
      </Suspense>
    </>
  );
}
