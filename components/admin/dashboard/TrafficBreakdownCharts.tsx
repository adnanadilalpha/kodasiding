import { formatCount } from "@/lib/admin/format";
import type { TrafficSourceRow } from "@/lib/admin/types";

export function TrafficSourcesChart({
  sources,
}: {
  sources: TrafficSourceRow[];
}) {
  const maxSessions = Math.max(...sources.map((row) => row.sessions), 1);
  const totalSessions = sources.reduce((sum, row) => sum + row.sessions, 0);

  if (sources.length === 0) {
    return (
      <EmptyReport message="Traffic sources appear when visitors arrive with a referrer or as Direct." />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between text-xs text-text-secondary">
        <span className="font-medium tracking-[0.08em] uppercase">
          By channel
        </span>
        <span>{formatCount(totalSessions)} sessions</span>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {sources.map((source) => {
          const widthPercent = Math.max(
            (source.sessions / maxSessions) * 100,
            6,
          );
          const share = Math.round((source.sessions / totalSessions) * 100);
          return (
            <div key={source.key} className="min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {source.label}
                  </p>
                  <p className="truncate text-xs text-text-secondary">
                    {source.channel}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-xs text-text-primary">
                    {formatCount(source.sessions)}
                  </p>
                  <p className="text-[11px] text-text-secondary">
                    {share}% · {formatCount(source.visitors)} users
                  </p>
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

export function CountriesChart({
  countries,
}: {
  countries: Array<{
    code: string;
    label: string;
    visitors: number;
    views: number;
  }>;
}) {
  const maxVisitors = Math.max(...countries.map((row) => row.visitors), 1);
  const totalVisitors = countries.reduce((sum, row) => sum + row.visitors, 0);

  if (countries.length === 0) {
    return (
      <EmptyReport message="Countries appear once visits include a resolved country code." />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between text-xs text-text-secondary">
        <span className="font-medium tracking-[0.08em] uppercase">
          Top countries
        </span>
        <span>{formatCount(totalVisitors)} users</span>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {countries.map((country) => {
          const widthPercent = Math.max(
            (country.visitors / maxVisitors) * 100,
            6,
          );
          const share = Math.round((country.visitors / totalVisitors) * 100);
          return (
            <div key={country.code} className="min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {country.label}
                  </p>
                  <p className="truncate text-xs text-text-secondary">
                    {country.code}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-xs text-text-primary">
                    {formatCount(country.visitors)}
                  </p>
                  <p className="text-[11px] text-text-secondary">
                    {share}% · {formatCount(country.views)} views
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

export function DevicesChart({
  devices,
}: {
  devices: Array<{
    device: string;
    label: string;
    visitors: number;
    sessions: number;
  }>;
}) {
  const maxSessions = Math.max(...devices.map((row) => row.sessions), 1);
  const totalSessions = devices.reduce((sum, row) => sum + row.sessions, 0);

  if (devices.length === 0) {
    return (
      <EmptyReport message="Device split appears after page views are recorded." />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between text-xs text-text-secondary">
        <span className="font-medium tracking-[0.08em] uppercase">
          By device
        </span>
        <span>{formatCount(totalSessions)} sessions</span>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {devices.map((device) => {
          const widthPercent = Math.max(
            (device.sessions / maxSessions) * 100,
            6,
          );
          const share = Math.round((device.sessions / totalSessions) * 100);
          return (
            <div key={device.device} className="min-w-0">
              <div className="flex items-start justify-between gap-4">
                <p className="truncate text-sm font-medium text-text-primary">
                  {device.label}
                </p>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-xs text-text-primary">
                    {formatCount(device.sessions)}
                  </p>
                  <p className="text-[11px] text-text-secondary">
                    {share}% · {formatCount(device.visitors)} users
                  </p>
                </div>
              </div>
              <div className="mt-2 h-2 shrink-0 rounded-full bg-bg-secondary">
                <div
                  className="h-2 rounded-full bg-brand-primary/80 transition-all duration-500"
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

function EmptyReport({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-55 flex-1 items-center justify-center rounded-xl border border-dashed border-black/10 bg-bg-secondary/70 px-6 text-center text-sm text-text-secondary">
      {message}
    </div>
  );
}
