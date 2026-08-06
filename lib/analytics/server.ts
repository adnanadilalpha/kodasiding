import "server-only";

import { createHash } from "node:crypto";
import {
  isLocalHostname,
  isServerLocalAnalyticsEnabled,
} from "@/lib/analytics/env";

const ID_PATTERN = /^[a-z0-9-]{16,64}$/i;

export function isValidAnalyticsId(value: string | undefined): value is string {
  return typeof value === "string" && ID_PATTERN.test(value);
}

function getHashSalt(): string {
  return (
    process.env.ANALYTICS_HASH_SALT?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 24) ||
    "koda-analytics"
  );
}

export function hashVisitorKey(ip: string, userAgent: string): string {
  return createHash("sha256")
    .update(`${ip}|${userAgent}|${getHashSalt()}`)
    .digest("hex")
    .slice(0, 32);
}

export function getClientIp(request: Request): string {
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

function isLocalRequest(request: Request): boolean {
  const host = (request.headers.get("host") ?? "").split(":")[0] ?? "";
  if (host && isLocalHostname(host)) {
    return true;
  }

  const ip = getClientIp(request);
  return isPrivateIp(ip);
}

/** Record analytics unless explicitly disabled for local/dev. */
export function shouldRecordAnalytics(request: Request): boolean {
  // Opt out of local recording: ANALYTICS_ENABLE_LOCAL=false
  if (process.env.ANALYTICS_ENABLE_LOCAL === "false") {
    if (process.env.NODE_ENV === "development" || isLocalRequest(request)) {
      return false;
    }
  }

  // next dev + local machines record by default so the admin dashboard
  // has data while building (writes to whatever Supabase the app uses).
  if (
    isServerLocalAnalyticsEnabled() ||
    process.env.NODE_ENV === "development"
  ) {
    return true;
  }

  return !isLocalRequest(request);
}

export type RequestGeo = {
  countryCode: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
};

function decodeGeoHeader(value: string | null | undefined): string | null {
  if (!value) return null;

  try {
    return decodeURIComponent(value.trim());
  } catch {
    return value.trim();
  }
}

function parseCoordinate(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function geoFromHeaders(request: Request): RequestGeo {
  const countryCode =
    request.headers.get("x-vercel-ip-country")?.trim() ||
    request.headers.get("cf-ipcountry")?.trim() ||
    null;

  const region = decodeGeoHeader(
    request.headers.get("x-vercel-ip-country-region"),
  );

  const city = decodeGeoHeader(request.headers.get("x-vercel-ip-city"));
  const latitude = parseCoordinate(request.headers.get("x-vercel-ip-latitude"));
  const longitude = parseCoordinate(
    request.headers.get("x-vercel-ip-longitude"),
  );

  return {
    countryCode: countryCode ? countryCode.toUpperCase() : null,
    region,
    city,
    latitude,
    longitude,
  };
}

async function lookupGeoFromIp(ip: string): Promise<RequestGeo> {
  try {
    const query = ip && !isPrivateIp(ip) ? encodeURIComponent(ip) : "";
    const url = query
      ? `http://ip-api.com/json/${query}?fields=status,countryCode,regionName,city,lat,lon`
      : "http://ip-api.com/json/?fields=status,countryCode,regionName,city,lat,lon";

    const response = await fetch(url, {
      signal: AbortSignal.timeout(2500),
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        countryCode: null,
        region: null,
        city: null,
        latitude: null,
        longitude: null,
      };
    }

    const data = (await response.json()) as {
      status?: string;
      countryCode?: string;
      regionName?: string;
      city?: string;
      lat?: number;
      lon?: number;
    };

    if (data.status !== "success" || !data.countryCode) {
      return {
        countryCode: null,
        region: null,
        city: null,
        latitude: null,
        longitude: null,
      };
    }

    return {
      countryCode: data.countryCode.toUpperCase(),
      region: data.regionName ?? null,
      city: data.city ?? null,
      latitude: typeof data.lat === "number" ? data.lat : null,
      longitude: typeof data.lon === "number" ? data.lon : null,
    };
  } catch {
    return {
      countryCode: null,
      region: null,
      city: null,
      latitude: null,
      longitude: null,
    };
  }
}

export async function getRequestGeo(request: Request): Promise<RequestGeo> {
  const fromHeaders = geoFromHeaders(request);
  const ip = getClientIp(request);
  const needsIpLookup =
    !fromHeaders.countryCode ||
    fromHeaders.latitude == null ||
    fromHeaders.longitude == null;
  const fromIp = needsIpLookup ? await lookupGeoFromIp(ip) : null;
  const countryCode = fromHeaders.countryCode ?? fromIp?.countryCode ?? null;

  if (!countryCode) {
    return {
      countryCode: null,
      region: null,
      city: null,
      latitude: null,
      longitude: null,
    };
  }

  return {
    countryCode,
    region: fromHeaders.region ?? fromIp?.region ?? null,
    city: fromHeaders.city ?? fromIp?.city ?? null,
    latitude: fromHeaders.latitude ?? fromIp?.latitude ?? null,
    longitude: fromHeaders.longitude ?? fromIp?.longitude ?? null,
  };
}

export type RequestAnalyticsContext = RequestGeo & {
  visitorKey: string;
  shouldRecord: boolean;
};

export async function getRequestAnalyticsContext(
  request: Request,
): Promise<RequestAnalyticsContext> {
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent") ?? "";
  const geo = await getRequestGeo(request);
  const visitorSeed = ip || request.headers.get("host") || "unknown";

  return {
    ...geo,
    visitorKey: hashVisitorKey(visitorSeed, userAgent),
    shouldRecord: shouldRecordAnalytics(request),
  };
}
