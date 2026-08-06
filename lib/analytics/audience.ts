import type { PageViewRow } from "@/lib/admin/analytics";

/** Reporting-layer filter: exclude internal/operator traffic from audience metrics. */
export function filterAudiencePageViews(views: PageViewRow[]): PageViewRow[] {
  return views.filter((view) => !view.is_internal);
}

export type AnalyticsMetricKind = "user" | "session" | "event";

export const METRIC_KIND_LABELS: Record<AnalyticsMetricKind, string> = {
  user: "Unique users",
  session: "Unique sessions",
  event: "Page loads",
};
