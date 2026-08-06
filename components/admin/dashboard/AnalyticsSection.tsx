"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { IconActivity, IconTrendingUp } from "@tabler/icons-react";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { PopularPagesChart } from "@/components/admin/dashboard/PopularPagesChart";
import { TopEventsChart } from "@/components/admin/dashboard/TopEventsChart";
import { VisitorLocationsChart } from "@/components/admin/dashboard/VisitorLocationsChart";
import { VisitorsChart } from "@/components/admin/dashboard/VisitorsChart";
import type {
  AnalyticsDashboardData,
  AnalyticsMetric,
  AnalyticsRange,
} from "@/lib/admin/types";
import { createClient } from "@/lib/supabase/client";

const RANGE_OPTIONS: Array<{ value: AnalyticsRange; label: string }> = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "6m", label: "6 months" },
];

const METRIC_OPTIONS: Array<{ value: AnalyticsMetric; label: string }> = [
  { value: "users", label: "Users" },
  { value: "sessions", label: "Sessions" },
  { value: "views", label: "Page loads" },
];

const PANEL_CARD_CLASS =
  "flex h-full flex-col rounded-[14px] border border-black/8 bg-white p-5 shadow-[0_1px_3px_rgba(16,22,19,0.06)] sm:p-6";

function DashboardPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <article className={PANEL_CARD_CLASS}>
      <header className="shrink-0">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <p className="mt-1 min-h-8 text-xs text-text-secondary">
          {description ?? ""}
        </p>
      </header>
      <div className="mt-5 flex min-h-70 flex-1 flex-col">{children}</div>
    </article>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-brand-primary text-text-inverse"
          : "bg-bg-secondary text-text-secondary hover:bg-black/6 hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}

export function AnalyticsSection({
  initialAnalytics,
}: {
  initialAnalytics: AnalyticsDashboardData;
}) {
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [range, setRange] = useState<AnalyticsRange>(initialAnalytics.range);
  const [metric, setMetric] = useState<AnalyticsMetric>(
    initialAnalytics.metric,
  );
  const [isLoading, setIsLoading] = useState(false);

  const loadAnalytics = useCallback(
    async (nextRange: AnalyticsRange, nextMetric: AnalyticsMetric) => {
      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          range: nextRange,
          metric: nextMetric,
        });
        const response = await fetch(
          `/api/admin/analytics?${params.toString()}`,
          { cache: "no-store" },
        );

        if (!response.ok) return;

        const data = (await response.json()) as AnalyticsDashboardData;
        setAnalytics(data);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadAnalytics(range, metric);
  }, [range, metric, loadAnalytics]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("admin-analytics")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "page_views" },
        () => {
          void loadAnalytics(range, metric);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "analytics_events" },
        () => {
          void loadAnalytics(range, metric);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [range, metric, loadAnalytics]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">
            Site analytics
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Audience metrics are deduplicated by user and session. Page loads are
            tracked separately and no longer inflate on refresh.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-black/8 bg-white p-1.5">
            {RANGE_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                active={range === option.value}
                onClick={() => setRange(option.value)}
              >
                {option.label}
              </FilterChip>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-black/8 bg-white p-1.5">
            {METRIC_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                active={metric === option.value}
                onClick={() => setMetric(option.value)}
              >
                {option.label}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`grid items-stretch gap-4 transition-opacity duration-200 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 ${
          isLoading ? "opacity-60" : ""
        }`}
      >
        <AdminStatCard
          label={analytics.activeUsers.label}
          value={analytics.activeUsers.value}
          trend={analytics.activeUsers.trend}
          showTrendIcon={false}
          trendPositive={false}
          icon={<IconActivity className="size-3.5" stroke={1.75} />}
        />
        <AdminStatCard
          label={analytics.totalVisitors.label}
          value={analytics.totalVisitors.value}
          trend={analytics.totalVisitors.trend}
          trendPositive={analytics.totalVisitors.trendPositive}
          icon={<IconTrendingUp className="size-3.5" stroke={1.75} />}
        />
        <AdminStatCard
          label={analytics.uniqueSessions.label}
          value={analytics.uniqueSessions.value}
          trend={analytics.uniqueSessions.trend}
          trendPositive={analytics.uniqueSessions.trendPositive}
        />
        <AdminStatCard
          label={analytics.pageViews.label}
          value={analytics.pageViews.value}
          trend={analytics.pageViews.trend}
          trendPositive={analytics.pageViews.trendPositive}
        />
        <AdminStatCard
          label={analytics.avgTimeOnSite.label}
          value={analytics.avgTimeOnSite.value}
        />
        <AdminStatCard
          label={analytics.bounceRate.label}
          value={analytics.bounceRate.value}
        />
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <DashboardPanel
          title="Audience over time"
          description="Deduped audience metrics. Refreshing the site does not add users or sessions."
        >
          <VisitorsChart data={analytics.visitorsOverTime} metric={metric} />
        </DashboardPanel>

        <DashboardPanel
          title="Top pages"
          description="Ranked by unique users. Loads are shown separately."
        >
          <PopularPagesChart pages={analytics.popularPages} />
        </DashboardPanel>

        <DashboardPanel
          title="CTA & action events"
          description="Tracked actions from navigation, quotes, and dealer flows."
        >
          <TopEventsChart events={analytics.topEvents} />
        </DashboardPanel>

        <DashboardPanel
          title="Visitor locations"
          description="Click a city to zoom the map. Ranked by unique visitors."
        >
          <VisitorLocationsChart locations={analytics.visitorLocations} />
        </DashboardPanel>
      </div>
    </section>
  );
}
