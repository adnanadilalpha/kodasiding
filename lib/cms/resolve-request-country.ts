import { isLocalHostname } from "@/lib/analytics/env";

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "";
  }

  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    ""
  );
}

function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  const normalized = ip.toLowerCase();

  if (
    normalized === "::1" ||
    normalized === "127.0.0.1" ||
    normalized === "0.0.0.0"
  ) {
    return true;
  }

  if (normalized.startsWith("10.")) return true;
  if (normalized.startsWith("192.168.")) return true;

  const match = /^172\.(\d+)\./.exec(normalized);
  if (match) {
    const second = Number(match[1]);
    if (second >= 16 && second <= 31) return true;
  }

  return false;
}

/** Localhost / private network — skip geo gate so `next dev` still works. */
export function isLocalDevRequest(request: Request): boolean {
  const host = (request.headers.get("host") ?? "").split(":")[0] ?? "";
  if (host && isLocalHostname(host)) return true;
  return isPrivateIp(getClientIp(request));
}

function countryFromHeaders(request: Request): string | null {
  const raw =
    request.headers.get("x-vercel-ip-country")?.trim() ||
    request.headers.get("cf-ipcountry")?.trim() ||
    null;
  if (!raw || raw === "XX" || raw === "T1") return null;
  return raw.toUpperCase();
}

async function countryFromIp(ip: string): Promise<string | null> {
  if (!ip || isPrivateIp(ip)) return null;

  try {
    const response = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode`,
      {
        signal: AbortSignal.timeout(2000),
        cache: "no-store",
      },
    );
    if (!response.ok) return null;

    const data = (await response.json()) as {
      status?: string;
      countryCode?: string;
    };
    if (data.status !== "success" || !data.countryCode) return null;
    return data.countryCode.toUpperCase();
  } catch {
    return null;
  }
}

/**
 * Resolve visitor country for the geo gate.
 * Prefer edge headers; fall back to IP lookup on public IPs.
 */
export async function resolveRequestCountry(
  request: Request,
): Promise<string | null> {
  const fromHeaders = countryFromHeaders(request);
  if (fromHeaders) return fromHeaders;

  return countryFromIp(getClientIp(request));
}
