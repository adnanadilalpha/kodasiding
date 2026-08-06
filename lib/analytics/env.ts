/** Server-side local analytics override (see ANALYTICS_ENABLE_LOCAL). */
export function isServerLocalAnalyticsEnabled(): boolean {
  return process.env.ANALYTICS_ENABLE_LOCAL === "true";
}

/** Client-side mirror — must be NEXT_PUBLIC_ to reach the browser. */
export function isClientLocalAnalyticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ANALYTICS_ENABLE_LOCAL === "true";
}

export function isLocalHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".local") ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  );
}
