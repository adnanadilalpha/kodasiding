import type { PopularPageRow } from "@/lib/admin/types";
import { formatCount } from "@/lib/admin/format";

type PopularPagesChartProps = {
  pages: PopularPageRow[];
};

export function PopularPagesChart({ pages }: PopularPagesChartProps) {
  const maxVisitors = Math.max(...pages.map((page) => page.visitors), 1);
  const totalVisitors = pages.reduce((sum, page) => sum + page.visitors, 0);

  if (pages.length === 0) {
    return (
      <div className="flex h-full min-h-55 flex-1 items-center justify-center rounded-xl border border-dashed border-black/10 bg-bg-secondary/70 px-6 text-center text-sm text-text-secondary">
        No audience page data in this period yet.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between text-xs text-text-secondary">
        <span className="font-medium tracking-[0.08em] uppercase">
          Top pages by users
        </span>
        <span>{formatCount(totalVisitors)} users</span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-x-6">
        {pages.map((page) => {
          const widthPercent = Math.max((page.visitors / maxVisitors) * 100, 6);
          const share = Math.round((page.visitors / totalVisitors) * 100);

          return (
            <div key={page.path} className="min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {page.label}
                  </p>
                  <p className="truncate text-xs text-text-secondary">
                    {page.path}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-xs text-text-primary">
                    {formatCount(page.visitors)}
                  </p>
                  <p className="text-[11px] text-text-secondary">
                    {share}% users · {formatCount(page.pageLoads)} loads
                  </p>
                </div>
              </div>
              <div className="mt-2 h-2 shrink-0 rounded-full bg-bg-secondary">
                <div
                  className="h-2 rounded-full bg-accent-warm transition-all duration-500"
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
