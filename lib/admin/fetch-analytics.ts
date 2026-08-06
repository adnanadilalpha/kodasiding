import "server-only";

import {
  buildAnalyticsForFilters,
  type AnalyticsEventRecord,
  type PageViewRow,
} from "@/lib/admin/analytics";
import type {
  AnalyticsDashboardData,
  AnalyticsMetric,
  AnalyticsRange,
} from "@/lib/admin/types";
import { createServiceClient } from "@/lib/supabase/admin";

const DEFAULT_RANGE: AnalyticsRange = "30d";
const DEFAULT_METRIC: AnalyticsMetric = "users";

export function parseRange(value: string | null | undefined): AnalyticsRange {
  if (value === "7d" || value === "30d" || value === "90d" || value === "6m") {
    return value;
  }
  return DEFAULT_RANGE;
}

export function parseMetric(value: string | null | undefined): AnalyticsMetric {
  if (value === "users" || value === "views" || value === "sessions") {
    return value;
  }
  return DEFAULT_METRIC;
}

export async function fetchAnalyticsDashboard(options: {
  range?: AnalyticsRange;
  metric?: AnalyticsMetric;
} = {}): Promise<AnalyticsDashboardData> {
  const range = options.range ?? DEFAULT_RANGE;
  const metric = options.metric ?? DEFAULT_METRIC;
  const supabase = createServiceClient();

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [pageViewsRes, analyticsEventsRes] = await Promise.all([
    supabase
      .from("page_views")
      .select(
        "session_id, visitor_id, visitor_key, path, referrer, duration_seconds, is_bounce, is_internal, view_count, last_seen_at, country_code, region, city, latitude, longitude, device_type, created_at",
      )
      .gte("created_at", sixMonthsAgo.toISOString()),
    supabase
      .from("analytics_events")
      .select(
        "session_id, visitor_id, visitor_key, event_name, event_label, is_internal, country_code, region, city, created_at",
      )
      .gte("created_at", sixMonthsAgo.toISOString()),
  ]);

  if (pageViewsRes.error) throw new Error(pageViewsRes.error.message);
  if (analyticsEventsRes.error) {
    throw new Error(analyticsEventsRes.error.message);
  }

  const pageViews = (pageViewsRes.data ?? []) as PageViewRow[];
  const analyticsEvents = (analyticsEventsRes.data ??
    []) as AnalyticsEventRecord[];
  const analytics = await buildAnalyticsForFilters(
    pageViews,
    range,
    metric,
    analyticsEvents,
  );

  return {
    ...analytics,
    range,
    metric,
  };
}
