import type { ReactNode } from "react";

type AdminStatCardProps = {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
  trendPositive?: boolean;
  showTrendIcon?: boolean;
  statusLabel?: string;
  className?: string;
};

export function AdminStatCard({
  label,
  value,
  icon,
  trend,
  trendPositive = true,
  showTrendIcon = true,
  statusLabel,
  className = "",
}: AdminStatCardProps) {
  return (
    <article
      className={`flex h-full flex-col rounded-[14px] border border-black/8 bg-white p-5 shadow-[0_1px_3px_rgba(16,22,19,0.06)] ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[11px] font-medium tracking-[0.11em] text-text-secondary uppercase">
          {label}
        </p>
        {icon ? (
          <div className="shrink-0 text-text-primary/40">{icon}</div>
        ) : null}
      </div>
      <p className="mt-3 text-[32px] leading-8 font-semibold text-text-primary">
        {value}
      </p>
      <div className="mt-auto min-h-11 pt-2">
        {trend ? (
          <p
            className={`flex items-center gap-1.5 font-mono text-xs leading-4 ${
              showTrendIcon
                ? trendPositive
                  ? "text-emerald-700"
                  : "text-red-700"
                : "text-text-secondary"
            }`}
          >
            {showTrendIcon ? <span aria-hidden>↗</span> : null}
            {trend}
          </p>
        ) : null}
        {statusLabel ? (
          <p className="font-mono text-xs leading-4 text-emerald-700">
            {statusLabel}
          </p>
        ) : null}
      </div>
    </article>
  );
}
