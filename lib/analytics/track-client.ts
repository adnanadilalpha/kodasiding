import { getOrRefreshSession } from "@/lib/analytics/client-session";
import type { AnalyticsEventName } from "@/lib/analytics/event-types";
import { normalizeAnalyticsPath } from "@/lib/analytics/normalize-path";

/** Always send hits; the API decides whether to store them (GA-style). */
export function canTrackAnalytics(): boolean {
  if (typeof window === "undefined") return false;
  return !window.location.pathname.startsWith("/admin");
}

export async function trackAnalyticsEvent(
  eventName: AnalyticsEventName,
  options: {
    label?: string;
    path?: string;
    metadata?: Record<string, string>;
  } = {},
) {
  if (!canTrackAnalytics()) return;

  const session = getOrRefreshSession();

  const path = normalizeAnalyticsPath(
    options.path ?? window.location.pathname,
  );

  await fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: session.id,
      visitorId: session.visitorId,
      eventName,
      eventLabel: options.label ?? null,
      path,
      metadata: options.metadata ?? {},
    }),
    keepalive: true,
  }).catch(() => {
    // analytics should never block UX
  });
}
