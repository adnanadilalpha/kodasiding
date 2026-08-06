export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"] as const;
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;

  if (exponent === 0) return `${Math.round(value)} ${units[exponent]}`;
  if (value >= 10) return `${Math.round(value)} ${units[exponent]}`;
  return `${value.toFixed(1)} ${units[exponent]}`;
}

export function formatPercentChange(
  current: number,
  previous: number,
): string | null {
  // No prior period baseline — don't invent a fake +100%.
  if (previous === 0) {
    return null;
  }

  const change = ((current - previous) / previous) * 100;
  const rounded = Math.round(change);
  return `${rounded >= 0 ? "+" : ""}${rounded}%`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0s";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

export function getTimeGreeting(date = new Date()): string {
  const hour = date.getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function getTodayStartIso(): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}
