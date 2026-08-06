import type { AnalyticsEventRow } from "@/lib/admin/types";
import { formatCount } from "@/lib/admin/format";

type TopEventsChartProps = {
  events: AnalyticsEventRow[];
};

export function TopEventsChart({ events }: TopEventsChartProps) {
  const maxCount = Math.max(...events.map((row) => row.count), 1);
  const totalCount = events.reduce((sum, row) => sum + row.count, 0);

  if (events.length === 0) {
    return (
      <div className="flex h-full min-h-55 flex-1 items-center justify-center rounded-xl border border-dashed border-black/10 bg-bg-secondary/70 px-6 text-center text-sm text-text-secondary">
        Action events will appear here after visitors interact with CTAs.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between text-xs text-text-secondary">
        <span className="font-medium tracking-[0.08em] uppercase">
          Top actions
        </span>
        <span>{formatCount(totalCount)} events</span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {events.map((event) => {
          const widthPercent = Math.max((event.count / maxCount) * 100, 6);
          const share = Math.round((event.count / totalCount) * 100);

          return (
            <div key={event.eventName} className="min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {event.label}
                  </p>
                  <p className="truncate text-xs text-text-secondary">
                    {formatCount(event.uniqueVisitors)} unique visitors
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-xs text-text-primary">
                    {formatCount(event.count)}
                  </p>
                  <p className="text-[11px] text-text-secondary">{share}%</p>
                </div>
              </div>
              <div className="mt-2 h-2 shrink-0 rounded-full bg-bg-secondary">
                <div
                  className="h-2 rounded-full bg-brand-primary transition-all duration-500"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
