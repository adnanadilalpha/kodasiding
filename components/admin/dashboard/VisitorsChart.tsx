"use client";

import type { AnalyticsMetric, AnalyticsTimePoint } from "@/lib/admin/types";
import { formatCount } from "@/lib/admin/format";

type VisitorsChartProps = {
  data: AnalyticsTimePoint[];
  metric: AnalyticsMetric;
};

const METRIC_LABELS: Record<AnalyticsMetric, string> = {
  users: "users",
  sessions: "sessions",
  views: "views",
};

const METRIC_HEADINGS: Record<AnalyticsMetric, string> = {
  users: "Users",
  sessions: "Sessions",
  views: "Views",
};

export function VisitorsChart({ data, metric }: VisitorsChartProps) {
  const maxValue = Math.max(...data.map((point) => point.value), 1);
  const hasData = data.some((point) => point.value > 0);
  const metricLabel = METRIC_LABELS[metric];

  if (!hasData) {
    return (
      <div className="flex h-full min-h-55 flex-1 items-center justify-center rounded-xl border border-dashed border-black/10 bg-bg-secondary/70 px-6 text-center text-sm text-text-secondary">
        No {metricLabel} in this period. Data appears only after real visits.
      </div>
    );
  }

  const labelInterval = data.length > 14 ? Math.ceil(data.length / 7) : 1;

  return (
    <div className="flex h-full min-h-55 flex-col">
      <div className="mb-3 flex items-center justify-between text-xs text-text-secondary">
        <span className="font-medium tracking-[0.08em] uppercase">
          {METRIC_HEADINGS[metric]}
        </span>
        <span>Peak: {formatCount(maxValue)}</span>
      </div>

      <div className="flex flex-1 items-end gap-1 sm:gap-1.5">
        {data.map((point, index) => {
          const heightPercent = Math.max(
            (point.value / maxValue) * 100,
            point.value > 0 ? 8 : 0,
          );
          const showLabel =
            index % labelInterval === 0 || index === data.length - 1;

          return (
            <div
              key={point.key}
              className="group flex min-w-0 flex-1 flex-col items-center justify-end"
            >
              <div className="mb-1 hidden font-mono text-[10px] text-text-primary/70 sm:block">
                {point.value > 0 ? formatCount(point.value) : ""}
              </div>
              <div className="flex h-40 w-full items-end">
                <div
                  title={`${point.label}: ${formatCount(point.value)} ${metricLabel}`}
                  className={`w-full rounded-t-md transition-all duration-300 ${
                    point.value === 0
                      ? "bg-bg-secondary"
                      : "bg-linear-to-t from-brand-primary to-accent-warm group-hover:opacity-90"
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>
              {showLabel ? (
                <span className="mt-2 truncate text-center text-[10px] text-text-secondary sm:text-[11px]">
                  {point.label}
                </span>
              ) : (
                <span className="mt-2 h-3.5" aria-hidden />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
