"use client";

import type { ReactNode } from "react";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";

/** Mounts automatic first-party analytics (GA-style, no consent gate). */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <PageViewTracker />
    </>
  );
}
