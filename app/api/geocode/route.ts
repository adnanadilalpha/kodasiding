import { NextResponse } from "next/server";

export const runtime = "nodejs";

type NominatimHit = {
  lat: string;
  lon: string;
  display_name: string;
};

type CacheEntry = { at: number; value: NominatimHit | null };

const memory = new Map<string, CacheEntry>();
const POSITIVE_TTL_MS = 1000 * 60 * 60 * 24;
const NEGATIVE_TTL_MS = 1000 * 60 * 15;
const MAX_CACHE = 500;

/** Simple per-IP throttle — Nominatim asks for ≤1 req/s; we stay well under. */
const rateByIp = new Map<string, { windowStart: number; count: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function allowRequest(ip: string) {
  const now = Date.now();
  const entry = rateByIp.get(ip);
  if (!entry || now - entry.windowStart >= RATE_WINDOW_MS) {
    rateByIp.set(ip, { windowStart: now, count: 1 });
    return true;
  }
  if (entry.count >= RATE_MAX) return false;
  entry.count += 1;
  return true;
}

function pruneCache(now: number) {
  if (memory.size <= MAX_CACHE) return;
  for (const [key, entry] of memory) {
    const ttl = entry.value ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS;
    if (now - entry.at >= ttl) memory.delete(key);
  }
  while (memory.size > MAX_CACHE) {
    const oldest = memory.keys().next().value;
    if (oldest === undefined) break;
    memory.delete(oldest);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q || q.length < 2 || q.length > 120) {
    return NextResponse.json({ error: "Missing q" }, { status: 400 });
  }

  const ip = clientIp(request);
  if (!allowRequest(ip)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
  }

  const key = q.toLowerCase();
  const now = Date.now();
  const cached = memory.get(key);
  if (cached) {
    const ttl = cached.value ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS;
    if (now - cached.at < ttl) {
      if (!cached.value) {
        return NextResponse.json(null, { status: 404 });
      }
      return NextResponse.json({
        lat: Number(cached.value.lat),
        lng: Number(cached.value.lon),
        label: shortLabel(cached.value.display_name, q),
      });
    }
    memory.delete(key);
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "us");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "KodaSidingFindDealer/1.0 (find-dealer)",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(4500),
    });

    // Transient upstream failures — never cache as "not found"
    if (res.status === 429 || res.status >= 500) {
      return NextResponse.json(
        { error: "Geocoder unavailable" },
        { status: 503 },
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: "Geocoder error" },
        { status: 502 },
      );
    }

    const data = (await res.json()) as NominatimHit[];
    const hit = data[0] ?? null;
    pruneCache(now);
    // Only cache definitive empty results, not transport failures
    memory.set(key, { at: now, value: hit });

    if (!hit) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json({
      lat: Number(hit.lat),
      lng: Number(hit.lon),
      label: shortLabel(hit.display_name, q),
    });
  } catch {
    return NextResponse.json(
      { error: "Geocoder unavailable" },
      { status: 503 },
    );
  }
}

function shortLabel(displayName: string, fallback: string) {
  return displayName.split(",").slice(0, 2).join(",").trim() || fallback;
}
