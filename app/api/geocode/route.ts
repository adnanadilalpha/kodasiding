import { NextResponse } from "next/server";
import {
  allowRateLimitedRequest,
  requestClientIp,
} from "@/lib/api/rate-limit";

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

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;

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

  const ip = requestClientIp(request);
  if (
    !(await allowRateLimitedRequest({
      bucket: "geocode",
      key: ip,
      max: RATE_MAX,
      windowMs: RATE_WINDOW_MS,
    }))
  ) {
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
