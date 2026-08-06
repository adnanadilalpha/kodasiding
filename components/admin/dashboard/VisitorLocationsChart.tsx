"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { VisitorLocationRow } from "@/lib/admin/types";
import { formatCount } from "@/lib/admin/format";

const VisitorLocationsMap = dynamic(
  () =>
    import("@/components/admin/dashboard/VisitorLocationsMap").then(
      (module) => module.VisitorLocationsMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-55 items-center justify-center rounded-lg border border-black/8 bg-bg-secondary text-xs text-text-secondary">
        Loading map…
      </div>
    ),
  },
);

type VisitorLocationsChartProps = {
  locations: VisitorLocationRow[];
};

export function VisitorLocationsChart({
  locations,
}: VisitorLocationsChartProps) {
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const totalVisitors = locations.reduce((sum, row) => sum + row.visitors, 0);

  if (locations.length === 0) {
    return (
      <div className="flex h-full min-h-55 flex-1 items-center justify-center rounded-lg border border-dashed border-black/10 bg-bg-secondary/70 px-4 text-center text-xs text-text-secondary">
        Location data appears when visits have a resolved city or country.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {focusKey ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setFocusKey(null)}
            className="shrink-0 text-xs font-medium text-brand-primary underline-offset-2 hover:underline"
          >
            Reset view
          </button>
        </div>
      ) : (
        <div className="h-5" aria-hidden />
      )}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <VisitorLocationsMap
          locations={locations}
          focusKey={focusKey}
          onFocusKey={setFocusKey}
        />

        <div className="flex max-h-55 flex-col overflow-hidden rounded-lg border border-black/8">
          <div className="flex items-center justify-between border-b border-black/8 bg-bg-secondary px-3 py-2 text-[11px] font-medium tracking-[0.08em] text-text-secondary uppercase">
            <span>Top cities</span>
            <span>{formatCount(totalVisitors)} visitors</span>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto bg-white">
            {locations.map((location) => {
              const isActive = focusKey === location.key;
              const share = Math.round(
                (location.visitors / totalVisitors) * 100,
              );

              return (
                <li key={location.key}>
                  <button
                    type="button"
                    onClick={() =>
                      setFocusKey(isActive ? null : location.key)
                    }
                    className={`flex w-full items-start justify-between gap-3 border-b border-black/5 px-3 py-2.5 text-left transition-colors last:border-b-0 ${
                      isActive
                        ? "bg-accent-warm/25"
                        : "bg-white hover:bg-bg-secondary/80"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-text-primary">
                        {location.label}
                      </span>
                      {location.detail ? (
                        <span className="block truncate text-xs text-text-secondary">
                          {location.detail}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-mono text-xs text-text-primary">
                        {formatCount(location.visitors)}
                      </span>
                      <span className="block text-[11px] text-text-secondary">
                        {share}%
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
