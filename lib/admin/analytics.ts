import { getPageLabel } from "@/lib/admin/page-labels";
import { filterAudiencePageViews } from "@/lib/analytics/audience";
import {
  getVisitorDedupKey,
  countActiveUsers,
  countUniqueSessions,
  countUniqueVisitors,
} from "@/lib/analytics/identity";
import {
  averageStoredCoordinates,
  geocodeCityLocation,
} from "@/lib/analytics/geocode-city";
import {
  ANALYTICS_EVENT_LABELS,
  type AnalyticsEventName,
} from "@/lib/analytics/event-types";
import type {
  AnalyticsEventRow,
  AnalyticsMetric,
  AnalyticsRange,
  AnalyticsStatCard,
  AnalyticsTimePoint,
  CountryRow,
  DeviceRow,
  PopularPageRow,
  TrafficSourceRow,
  VisitorLocationRow,
} from "@/lib/admin/types";
import { formatCount, formatDuration, formatPercentChange } from "@/lib/admin/format";
import { classifyTrafficSource } from "@/lib/analytics/traffic-source";

export type PageViewRow = {
  session_id: string;
  visitor_id?: string | null;
  visitor_key?: string | null;
  path: string;
  referrer?: string | null;
  duration_seconds: number | null;
  is_bounce: boolean;
  is_internal?: boolean;
  view_count?: number;
  last_seen_at?: string | null;
  country_code?: string | null;
  region?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  device_type?: string | null;
  created_at: string;
};

export type AnalyticsEventRecord = {
  event_name: string;
  event_label?: string | null;
  visitor_id?: string | null;
  visitor_key?: string | null;
  session_id: string;
  is_internal?: boolean;
  country_code?: string | null;
  region?: string | null;
  city?: string | null;
  created_at: string;
};

const RANGE_DAYS: Record<AnalyticsRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "6m": 183,
};

export function getRangeDays(range: AnalyticsRange): number {
  return RANGE_DAYS[range];
}

export function getRangeStart(range: AnalyticsRange, from = new Date()): Date {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);

  if (range === "6m") {
    start.setMonth(start.getMonth() - 5);
    start.setDate(1);
    return start;
  }

  start.setDate(start.getDate() - (RANGE_DAYS[range] - 1));
  return start;
}

export function getPreviousRangeStart(range: AnalyticsRange, from = new Date()): Date {
  const currentStart = getRangeStart(range, from);

  if (range === "6m") {
    const previous = new Date(currentStart);
    previous.setMonth(previous.getMonth() - 6);
    return previous;
  }

  const previous = new Date(currentStart);
  previous.setDate(previous.getDate() - RANGE_DAYS[range]);
  return previous;
}

function filterViewsByRange(
  views: PageViewRow[],
  range: AnalyticsRange,
  reference = new Date(),
): PageViewRow[] {
  const start = getRangeStart(range, reference);
  return views.filter((view) => new Date(view.created_at) >= start);
}

function filterViewsBetween(
  views: PageViewRow[],
  start: Date,
  end: Date,
): PageViewRow[] {
  return views.filter((view) => {
    const created = new Date(view.created_at);
    return created >= start && created < end;
  });
}

function formatLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function bucketKey(date: Date, range: AnalyticsRange): string {
  if (range === "6m") {
    return `${date.getFullYear()}-${date.getMonth()}`;
  }

  if (range === "90d") {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return formatLocalDateKey(weekStart);
  }

  return formatLocalDateKey(date);
}

function bucketLabel(key: string, range: AnalyticsRange): string {
  if (range === "6m") {
    const [year, month] = key.split("-").map(Number);
    return new Date(year, month, 1).toLocaleDateString("en-US", {
      month: "short",
    });
  }

  const date = new Date(`${key}T00:00:00`);

  if (range === "90d") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  if (range === "30d") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function createBucketKeys(range: AnalyticsRange, reference = new Date()): string[] {
  const keys: string[] = [];
  const start = getRangeStart(range, reference);

  if (range === "6m") {
    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date(reference.getFullYear(), reference.getMonth() - index, 1);
      keys.push(`${date.getFullYear()}-${date.getMonth()}`);
    }
    return keys;
  }

  if (range === "90d") {
    const cursor = new Date(start);
    cursor.setDate(cursor.getDate() - cursor.getDay());
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(reference);
    end.setHours(23, 59, 59, 999);

    while (cursor <= end) {
      keys.push(formatLocalDateKey(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }
    return keys;
  }

  const cursor = new Date(start);
  const end = new Date(reference);
  end.setHours(23, 59, 59, 999);

  while (cursor <= end) {
    keys.push(formatLocalDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return keys;
}

function metricValue(
  views: PageViewRow[],
  metric: AnalyticsMetric,
): number {
  if (metric === "users") {
    return countUniqueVisitors(views);
  }

  if (metric === "sessions") {
    return countUniqueSessions(views);
  }

  return views.reduce((sum, view) => sum + (view.view_count ?? 1), 0);
}

function filterAudienceEvents(events: AnalyticsEventRecord[]): AnalyticsEventRecord[] {
  return events.filter((event) => !event.is_internal);
}

function computeAvgSessionDuration(views: PageViewRow[]): number {
  const sessionTotals = new Map<string, number>();

  for (const view of views) {
    if (typeof view.duration_seconds !== "number" || view.duration_seconds <= 0) {
      continue;
    }

    sessionTotals.set(
      view.session_id,
      (sessionTotals.get(view.session_id) ?? 0) + view.duration_seconds,
    );
  }

  const totals = [...sessionTotals.values()];
  if (totals.length === 0) return 0;

  return totals.reduce((sum, value) => sum + value, 0) / totals.length;
}

export function buildVisitorsOverTime(
  views: PageViewRow[],
  range: AnalyticsRange,
  metric: AnalyticsMetric,
): AnalyticsTimePoint[] {
  const keys = createBucketKeys(range);
  const grouped = new Map<string, PageViewRow[]>();

  for (const key of keys) {
    grouped.set(key, []);
  }

  for (const view of views) {
    const key = bucketKey(new Date(view.created_at), range);
    if (!grouped.has(key)) continue;
    grouped.get(key)?.push(view);
  }

  return keys.map((key) => ({
    key,
    label: bucketLabel(key, range),
    value: metricValue(grouped.get(key) ?? [], metric),
  }));
}

export function buildPopularPages(
  views: PageViewRow[],
  limit = 5,
): PopularPageRow[] {
  const grouped = new Map<
    string,
    { visitors: Set<string>; pageLoads: number }
  >();

  for (const view of views) {
    const entry = grouped.get(view.path) ?? {
      visitors: new Set<string>(),
      pageLoads: 0,
    };
    entry.visitors.add(getVisitorDedupKey(view));
    entry.pageLoads += view.view_count ?? 1;
    grouped.set(view.path, entry);
  }

  return [...grouped.entries()]
    .sort(
      ([, a], [, b]) =>
        b.visitors.size - a.visitors.size || b.pageLoads - a.pageLoads,
    )
    .slice(0, limit)
    .map(([path, entry]) => ({
      path,
      label: getPageLabel(path),
      visitors: entry.visitors.size,
      pageLoads: entry.pageLoads,
    }));
}

function formatCountryLabel(countryCode: string | null | undefined): string {
  if (!countryCode || countryCode === "ZZ") return "Unknown";
  if (countryCode === "LOCAL") return "Local testing";

  try {
    return (
      new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) ??
      countryCode
    );
  } catch {
    return countryCode;
  }
}

function formatRegionLabel(
  countryCode: string,
  region: string | null | undefined,
): string | null {
  const value = region?.trim();
  if (!value) return null;

  if (countryCode === "US" && value.length === 2) {
    try {
      return (
        new Intl.DisplayNames(["en"], { type: "region" }).of(`US-${value}`) ??
        value
      );
    } catch {
      return value;
    }
  }

  return value;
}

function buildLocationKey(view: PageViewRow): string | null {
  const countryCode = view.country_code?.trim().toUpperCase();
  if (!countryCode || countryCode === "ZZ") return null;

  const region = view.region?.trim() ?? "";
  const city = view.city?.trim() ?? "";

  return [countryCode, region, city].join("|");
}

function formatLocationLabel(input: {
  countryCode: string;
  region?: string | null;
  city?: string | null;
}): { label: string; detail?: string } {
  const countryLabel = formatCountryLabel(input.countryCode);
  const regionLabel = formatRegionLabel(input.countryCode, input.region);
  const city = input.city?.trim();

  if (city && regionLabel) {
    return {
      label: `${city}, ${regionLabel}`,
      detail: countryLabel,
    };
  }

  if (city) {
    return {
      label: city,
      detail: countryLabel,
    };
  }

  if (regionLabel) {
    return {
      label: regionLabel,
      detail: countryLabel,
    };
  }

  return { label: countryLabel };
}

export async function buildVisitorLocations(
  views: PageViewRow[],
  limit = 12,
): Promise<VisitorLocationRow[]> {
  const grouped = new Map<
    string,
    {
      countryCode: string;
      region: string | null;
      city: string | null;
      visitors: Set<string>;
      views: number;
      coordinates: Array<{ latitude?: number | null; longitude?: number | null }>;
    }
  >();

  for (const view of views) {
    const key = buildLocationKey(view);
    if (!key) continue;

    const countryCode = view.country_code!.trim().toUpperCase();
    const region = view.region?.trim() ?? null;
    const city = view.city?.trim() ?? null;
    const entry =
      grouped.get(key) ??
      {
        countryCode,
        region,
        city,
        visitors: new Set<string>(),
        views: 0,
        coordinates: [],
      };

    entry.visitors.add(getVisitorDedupKey(view));
    entry.views += 1;
    entry.coordinates.push({
      latitude: view.latitude,
      longitude: view.longitude,
    });
    grouped.set(key, entry);
  }

  const ranked = [...grouped.entries()]
    .map(([key, entry]) => ({
      key,
      entry,
      visitors: entry.visitors.size,
      views: entry.views,
    }))
    .sort((a, b) => b.visitors - a.visitors || b.views - a.views)
    .slice(0, limit);

  const rows = await Promise.all(
    ranked.map(async ({ key, entry, visitors, views }) => {
      const { label, detail } = formatLocationLabel({
        countryCode: entry.countryCode,
        region: entry.region,
        city: entry.city,
      });

      let coordinates = averageStoredCoordinates(entry.coordinates);
      if (!coordinates) {
        coordinates = await geocodeCityLocation({
          countryCode: entry.countryCode,
          region: entry.region,
          city: entry.city,
        });
      }

      return {
        key,
        label,
        detail,
        visitors,
        views,
        countryCode: entry.countryCode,
        region: entry.region,
        city: entry.city,
        latitude: coordinates?.latitude ?? null,
        longitude: coordinates?.longitude ?? null,
      };
    }),
  );

  return rows;
}

export function buildTopEvents(
  events: AnalyticsEventRecord[],
  limit = 6,
): AnalyticsEventRow[] {
  const grouped = new Map<
    string,
    { count: number; visitors: Set<string>; label?: string | null }
  >();

  for (const event of events) {
    const existing = grouped.get(event.event_name) ?? {
      count: 0,
      visitors: new Set<string>(),
      label: event.event_label,
    };

    existing.count += 1;
    existing.visitors.add(getVisitorDedupKey(event));
    if (event.event_label) {
      existing.label = event.event_label;
    }

    grouped.set(event.event_name, existing);
  }

  return [...grouped.entries()]
    .map(([eventName, entry]) => ({
      eventName,
      label:
        ANALYTICS_EVENT_LABELS[eventName as AnalyticsEventName] ?? eventName,
      count: entry.count,
      uniqueVisitors: entry.visitors.size,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function computeBounceRate(views: PageViewRow[]): number {
  const sessions = new Map<string, { count: number; bounced: boolean }>();

  for (const view of views) {
    const existing = sessions.get(view.session_id) ?? { count: 0, bounced: true };
    existing.count += 1;
    if (!view.is_bounce) {
      existing.bounced = false;
    }
    sessions.set(view.session_id, existing);
  }

  if (sessions.size === 0) return 0;

  let bounces = 0;
  for (const session of sessions.values()) {
    if (session.count === 1 && session.bounced) {
      bounces += 1;
    }
  }

  return Math.round((bounces / sessions.size) * 100);
}

/** GA4-style engagement rate: non-bounce sessions / sessions. */
export function computeEngagementRate(views: PageViewRow[]): number {
  return Math.max(0, 100 - computeBounceRate(views));
}

export function buildTrafficSources(
  views: PageViewRow[],
  limit = 8,
): TrafficSourceRow[] {
  const grouped = new Map<
    string,
    { label: string; channel: string; visitors: Set<string>; sessions: Set<string> }
  >();

  for (const view of views) {
    const source = classifyTrafficSource(view.referrer);
    const entry =
      grouped.get(source.key) ??
      {
        label: source.label,
        channel: source.channel,
        visitors: new Set<string>(),
        sessions: new Set<string>(),
      };
    entry.visitors.add(getVisitorDedupKey(view));
    entry.sessions.add(view.session_id);
    grouped.set(source.key, entry);
  }

  return [...grouped.entries()]
    .map(([key, entry]) => ({
      key,
      label: entry.label,
      channel: entry.channel,
      visitors: entry.visitors.size,
      sessions: entry.sessions.size,
    }))
    .sort((a, b) => b.sessions - a.sessions || b.visitors - a.visitors)
    .slice(0, limit);
}

export function buildCountries(views: PageViewRow[], limit = 8): CountryRow[] {
  const grouped = new Map<
    string,
    { visitors: Set<string>; views: number }
  >();

  for (const view of views) {
    const code = view.country_code?.trim().toUpperCase();
    if (!code || code === "ZZ") continue;
    const entry =
      grouped.get(code) ?? { visitors: new Set<string>(), views: 0 };
    entry.visitors.add(getVisitorDedupKey(view));
    entry.views += view.view_count ?? 1;
    grouped.set(code, entry);
  }

  return [...grouped.entries()]
    .map(([code, entry]) => ({
      code,
      label: formatCountryLabel(code),
      visitors: entry.visitors.size,
      views: entry.views,
    }))
    .sort((a, b) => b.visitors - a.visitors || b.views - a.views)
    .slice(0, limit);
}

export function buildDevices(views: PageViewRow[]): DeviceRow[] {
  const grouped = new Map<
    string,
    { visitors: Set<string>; sessions: Set<string> }
  >();

  for (const view of views) {
    const device = (view.device_type || "desktop").toLowerCase();
    const entry =
      grouped.get(device) ??
      { visitors: new Set<string>(), sessions: new Set<string>() };
    entry.visitors.add(getVisitorDedupKey(view));
    entry.sessions.add(view.session_id);
    grouped.set(device, entry);
  }

  const labels: Record<string, string> = {
    desktop: "Desktop",
    mobile: "Mobile",
    tablet: "Tablet",
  };

  return [...grouped.entries()]
    .map(([device, entry]) => ({
      device,
      label: labels[device] ?? device,
      visitors: entry.visitors.size,
      sessions: entry.sessions.size,
    }))
    .sort((a, b) => b.sessions - a.sessions);
}

function trendCopy(
  change: string | null,
): { trend?: string; trendPositive?: boolean } {
  if (!change) return {};
  return {
    trend: `${change} vs prior period`,
    trendPositive: !change.startsWith("-"),
  };
}

export async function buildAnalyticsSummary(
  allViews: PageViewRow[],
  range: AnalyticsRange,
  allEvents: AnalyticsEventRecord[] = [],
  reference = new Date(),
): Promise<{
  activeUsers: AnalyticsStatCard;
  totalVisitors: AnalyticsStatCard;
  uniqueSessions: AnalyticsStatCard;
  pageViews: AnalyticsStatCard;
  avgTimeOnSite: AnalyticsStatCard;
  bounceRate: AnalyticsStatCard;
  engagementRate: AnalyticsStatCard;
  visitorsOverTime: AnalyticsTimePoint[];
  popularPages: PopularPageRow[];
  visitorLocations: VisitorLocationRow[];
  topEvents: AnalyticsEventRow[];
  trafficSources: TrafficSourceRow[];
  countries: CountryRow[];
  devices: DeviceRow[];
  hasData: boolean;
}> {
  const audienceViews = filterAudiencePageViews(allViews);
  const audienceEvents = filterAudienceEvents(allEvents);
  const currentViews = filterViewsByRange(audienceViews, range, reference);
  const currentEvents = filterEventsByRange(audienceEvents, range, reference);
  const currentStart = getRangeStart(range, reference);
  const previousStart = getPreviousRangeStart(range, reference);
  const previousViews = filterViewsBetween(
    audienceViews,
    previousStart,
    currentStart,
  );

  const activeUsers = countActiveUsers(audienceViews, reference.getTime());
  const totalVisitors = countUniqueVisitors(currentViews);
  const previousVisitors = countUniqueVisitors(previousViews);
  const uniqueSessions = countUniqueSessions(currentViews);
  const previousSessions = countUniqueSessions(previousViews);
  const totalPageViews = currentViews.reduce(
    (sum, view) => sum + (view.view_count ?? 1),
    0,
  );
  const previousPageViews = previousViews.reduce(
    (sum, view) => sum + (view.view_count ?? 1),
    0,
  );
  const visitorTrend = trendCopy(
    formatPercentChange(totalVisitors, previousVisitors),
  );
  const sessionTrend = trendCopy(
    formatPercentChange(uniqueSessions, previousSessions),
  );
  const pageViewTrend = trendCopy(
    formatPercentChange(totalPageViews, previousPageViews),
  );
  const avgDuration = computeAvgSessionDuration(currentViews);
  const bounce = computeBounceRate(currentViews);
  const engagement = computeEngagementRate(currentViews);
  const visitorLocations = await buildVisitorLocations(currentViews);

  return {
    activeUsers: {
      label: "Active users",
      value: formatCount(activeUsers),
      trend: "Last 30 minutes",
    },
    totalVisitors: {
      label: "Users",
      value: formatCount(totalVisitors),
      ...visitorTrend,
    },
    uniqueSessions: {
      label: "Sessions",
      value: formatCount(uniqueSessions),
      ...sessionTrend,
    },
    pageViews: {
      label: "Views",
      value: formatCount(totalPageViews),
      ...pageViewTrend,
    },
    avgTimeOnSite: {
      label: "Avg. engagement time",
      value: formatDuration(avgDuration),
    },
    bounceRate: {
      label: "Bounce rate",
      value: `${bounce}%`,
    },
    engagementRate: {
      label: "Engagement rate",
      value: `${engagement}%`,
    },
    visitorsOverTime: buildVisitorsOverTime(currentViews, range, "users"),
    popularPages: buildPopularPages(currentViews),
    visitorLocations,
    topEvents: buildTopEvents(currentEvents),
    trafficSources: buildTrafficSources(currentViews),
    countries: buildCountries(currentViews),
    devices: buildDevices(currentViews),
    hasData: currentViews.length > 0,
  };
}

function filterEventsByRange(
  events: AnalyticsEventRecord[],
  range: AnalyticsRange,
  reference = new Date(),
): AnalyticsEventRecord[] {
  const start = getRangeStart(range, reference);
  return events.filter((event) => new Date(event.created_at) >= start);
}

export async function buildAnalyticsForFilters(
  allViews: PageViewRow[],
  range: AnalyticsRange,
  metric: AnalyticsMetric,
  allEvents: AnalyticsEventRecord[] = [],
  reference = new Date(),
) {
  const summary = await buildAnalyticsSummary(
    allViews,
    range,
    allEvents,
    reference,
  );
  const audienceViews = filterAudiencePageViews(allViews);

  return {
    ...summary,
    visitorsOverTime: buildVisitorsOverTime(
      filterViewsByRange(audienceViews, range, reference),
      range,
      metric,
    ),
  };
}
