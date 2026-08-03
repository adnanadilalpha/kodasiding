import type { Dealer } from "@/lib/cms/types";

export type GeoPoint = { lat: number; lng: number; label: string; zoom?: number };

export type DealerWithDistance = Dealer & {
  distanceMi: number | null;
};

const EARTH_MI = 3958.8;

export function haversineMiles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_MI * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatMiles(mi: number | null) {
  if (mi == null || !Number.isFinite(mi)) return "";
  return `${Math.round(mi)} mi`;
}

export function dealerHasCoords(
  dealer: Dealer,
): dealer is Dealer & { lat: number; lng: number } {
  return (
    typeof dealer.lat === "number" &&
    typeof dealer.lng === "number" &&
    Number.isFinite(dealer.lat) &&
    Number.isFinite(dealer.lng) &&
    // Null Island — almost always bad CMS data, never a real US dealer
    !(dealer.lat === 0 && dealer.lng === 0)
  );
}

export function rankDealersNear(
  dealers: Dealer[],
  origin: { lat: number; lng: number },
  maxMiles = 500,
): DealerWithDistance[] {
  return dealers
    .filter(dealerHasCoords)
    .map((dealer) => ({
      ...dealer,
      distanceMi: haversineMiles(origin, {
        lat: dealer.lat,
        lng: dealer.lng,
      }),
    }))
    .filter((d) => (d.distanceMi ?? Infinity) <= maxMiles)
    .sort((a, b) => (a.distanceMi ?? Infinity) - (b.distanceMi ?? Infinity));
}

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Quick-search chips + common U.S. places — resolved instantly, no network. */
export const QUICK_SEARCH: {
  label: string;
  query: string;
  lat: number;
  lng: number;
  zoom: number;
}[] = [
  { label: "Nebraska", query: "Nebraska", lat: 41.5, lng: -99.75, zoom: 7 },
  { label: "Omaha", query: "Omaha, NE", lat: 41.2565, lng: -95.9345, zoom: 10 },
  {
    label: "Lincoln",
    query: "Lincoln, NE",
    lat: 40.8136,
    lng: -96.7026,
    zoom: 10,
  },
  {
    label: "Kansas City",
    query: "Kansas City, MO",
    lat: 39.0997,
    lng: -94.5786,
    zoom: 10,
  },
  {
    label: "Des Moines",
    query: "Des Moines, IA",
    lat: 41.5868,
    lng: -93.625,
    zoom: 10,
  },
];

/** States + major metros for instant typed search (no API). */
const US_PLACES: { keys: string[]; label: string; lat: number; lng: number; zoom: number }[] = [
  // States
  { keys: ["alabama", "al"], label: "Alabama", lat: 32.8067, lng: -86.7911, zoom: 7 },
  { keys: ["alaska", "ak"], label: "Alaska", lat: 61.3707, lng: -152.4044, zoom: 5 },
  { keys: ["arizona", "az"], label: "Arizona", lat: 33.7298, lng: -111.4312, zoom: 7 },
  { keys: ["arkansas", "ar"], label: "Arkansas", lat: 34.9697, lng: -92.3731, zoom: 7 },
  { keys: ["california", "ca"], label: "California", lat: 36.1162, lng: -119.6816, zoom: 6 },
  { keys: ["colorado", "co"], label: "Colorado", lat: 39.0598, lng: -105.3111, zoom: 7 },
  { keys: ["connecticut", "ct"], label: "Connecticut", lat: 41.5978, lng: -72.7554, zoom: 8 },
  { keys: ["delaware", "de"], label: "Delaware", lat: 39.3185, lng: -75.5071, zoom: 8 },
  { keys: ["florida", "fl"], label: "Florida", lat: 27.7663, lng: -81.6868, zoom: 7 },
  { keys: ["georgia", "ga"], label: "Georgia", lat: 33.0406, lng: -83.6431, zoom: 7 },
  { keys: ["hawaii", "hi"], label: "Hawaii", lat: 21.0943, lng: -157.4983, zoom: 7 },
  { keys: ["idaho", "id"], label: "Idaho", lat: 44.2405, lng: -114.4788, zoom: 6 },
  { keys: ["illinois", "il"], label: "Illinois", lat: 40.3495, lng: -88.9861, zoom: 7 },
  { keys: ["indiana", "in"], label: "Indiana", lat: 39.8494, lng: -86.2583, zoom: 7 },
  { keys: ["iowa", "ia"], label: "Iowa", lat: 42.0115, lng: -93.2105, zoom: 7 },
  { keys: ["kansas", "ks"], label: "Kansas", lat: 38.5266, lng: -96.7265, zoom: 7 },
  { keys: ["kentucky", "ky"], label: "Kentucky", lat: 37.6681, lng: -84.6701, zoom: 7 },
  { keys: ["louisiana", "la"], label: "Louisiana", lat: 31.1695, lng: -91.8678, zoom: 7 },
  { keys: ["maine", "me"], label: "Maine", lat: 44.6939, lng: -69.3819, zoom: 7 },
  { keys: ["maryland", "md"], label: "Maryland", lat: 39.0639, lng: -76.8021, zoom: 8 },
  { keys: ["massachusetts", "ma"], label: "Massachusetts", lat: 42.2302, lng: -71.5301, zoom: 8 },
  { keys: ["michigan", "mi"], label: "Michigan", lat: 43.3266, lng: -84.5361, zoom: 7 },
  { keys: ["minnesota", "mn"], label: "Minnesota", lat: 45.6945, lng: -93.9002, zoom: 7 },
  { keys: ["mississippi", "ms"], label: "Mississippi", lat: 32.7416, lng: -89.6787, zoom: 7 },
  { keys: ["missouri", "mo"], label: "Missouri", lat: 38.4561, lng: -92.2884, zoom: 7 },
  { keys: ["montana", "mt"], label: "Montana", lat: 46.9219, lng: -110.4544, zoom: 6 },
  { keys: ["nebraska", "ne"], label: "Nebraska", lat: 41.1254, lng: -98.2681, zoom: 7 },
  { keys: ["nevada", "nv"], label: "Nevada", lat: 38.3135, lng: -117.0554, zoom: 6 },
  { keys: ["new hampshire", "nh"], label: "New Hampshire", lat: 43.4525, lng: -71.5639, zoom: 8 },
  { keys: ["new jersey", "nj"], label: "New Jersey", lat: 40.2989, lng: -74.521, zoom: 8 },
  { keys: ["new mexico", "nm"], label: "New Mexico", lat: 34.8405, lng: -106.2485, zoom: 7 },
  { keys: ["new york", "ny"], label: "New York", lat: 42.1657, lng: -74.9481, zoom: 7 },
  { keys: ["north carolina", "nc"], label: "North Carolina", lat: 35.6301, lng: -79.8064, zoom: 7 },
  { keys: ["north dakota", "nd"], label: "North Dakota", lat: 47.5289, lng: -99.784, zoom: 7 },
  { keys: ["ohio", "oh"], label: "Ohio", lat: 40.3888, lng: -82.7649, zoom: 7 },
  { keys: ["oklahoma", "ok"], label: "Oklahoma", lat: 35.5653, lng: -96.9289, zoom: 7 },
  { keys: ["oregon", "or"], label: "Oregon", lat: 44.572, lng: -122.0709, zoom: 7 },
  { keys: ["pennsylvania", "pa"], label: "Pennsylvania", lat: 40.5908, lng: -77.2098, zoom: 7 },
  { keys: ["rhode island", "ri"], label: "Rhode Island", lat: 41.6809, lng: -71.5118, zoom: 9 },
  { keys: ["south carolina", "sc"], label: "South Carolina", lat: 33.8569, lng: -80.945, zoom: 7 },
  { keys: ["south dakota", "sd"], label: "South Dakota", lat: 44.2998, lng: -99.4388, zoom: 7 },
  { keys: ["tennessee", "tn"], label: "Tennessee", lat: 35.7478, lng: -86.6923, zoom: 7 },
  { keys: ["texas", "tx"], label: "Texas", lat: 31.0545, lng: -97.5635, zoom: 6 },
  { keys: ["utah", "ut"], label: "Utah", lat: 40.15, lng: -111.8624, zoom: 7 },
  { keys: ["vermont", "vt"], label: "Vermont", lat: 44.0459, lng: -72.7107, zoom: 8 },
  { keys: ["virginia", "va"], label: "Virginia", lat: 37.7693, lng: -78.17, zoom: 7 },
  { keys: ["washington", "wa"], label: "Washington", lat: 47.4009, lng: -121.4905, zoom: 7 },
  { keys: ["west virginia", "wv"], label: "West Virginia", lat: 38.4912, lng: -80.9545, zoom: 7 },
  { keys: ["wisconsin", "wi"], label: "Wisconsin", lat: 44.2685, lng: -89.6165, zoom: 7 },
  { keys: ["wyoming", "wy"], label: "Wyoming", lat: 42.75597, lng: -107.3025, zoom: 7 },
  { keys: ["district of columbia", "washington dc", "washington, dc", "dc"], label: "Washington, DC", lat: 38.9072, lng: -77.0369, zoom: 11 },
  // Major cities
  { keys: ["seattle", "seattle, wa"], label: "Seattle", lat: 47.6062, lng: -122.3321, zoom: 11 },
  { keys: ["portland", "portland, or"], label: "Portland", lat: 45.5152, lng: -122.6784, zoom: 11 },
  { keys: ["omaha", "omaha, ne"], label: "Omaha", lat: 41.2565, lng: -95.9345, zoom: 10 },
  { keys: ["lincoln", "lincoln, ne"], label: "Lincoln", lat: 40.8136, lng: -96.7026, zoom: 10 },
  { keys: ["kansas city", "kansas city, mo", "kansas city, ks"], label: "Kansas City", lat: 39.0997, lng: -94.5786, zoom: 10 },
  { keys: ["des moines", "des moines, ia"], label: "Des Moines", lat: 41.5868, lng: -93.625, zoom: 10 },
  { keys: ["los angeles", "los angeles, ca"], label: "Los Angeles", lat: 34.0522, lng: -118.2437, zoom: 10 },
  { keys: ["san francisco", "sf", "san francisco, ca"], label: "San Francisco", lat: 37.7749, lng: -122.4194, zoom: 11 },
  { keys: ["san diego", "san diego, ca"], label: "San Diego", lat: 32.7157, lng: -117.1611, zoom: 10 },
  { keys: ["chicago", "chicago, il"], label: "Chicago", lat: 41.8781, lng: -87.6298, zoom: 10 },
  { keys: ["houston", "houston, tx"], label: "Houston", lat: 29.7604, lng: -95.3698, zoom: 10 },
  { keys: ["dallas", "dallas, tx"], label: "Dallas", lat: 32.7767, lng: -96.797, zoom: 10 },
  { keys: ["austin", "austin, tx"], label: "Austin", lat: 30.2672, lng: -97.7431, zoom: 10 },
  { keys: ["phoenix", "phoenix, az"], label: "Phoenix", lat: 33.4484, lng: -112.074, zoom: 10 },
  { keys: ["denver", "denver, co"], label: "Denver", lat: 39.7392, lng: -104.9903, zoom: 10 },
  { keys: ["miami", "miami, fl"], label: "Miami", lat: 25.7617, lng: -80.1918, zoom: 11 },
  { keys: ["atlanta", "atlanta, ga"], label: "Atlanta", lat: 33.749, lng: -84.388, zoom: 10 },
  { keys: ["boston", "boston, ma"], label: "Boston", lat: 42.3601, lng: -71.0589, zoom: 11 },
  { keys: ["philadelphia", "philly", "philadelphia, pa"], label: "Philadelphia", lat: 39.9526, lng: -75.1652, zoom: 10 },
  { keys: ["new york city", "nyc", "new york, ny"], label: "New York City", lat: 40.7128, lng: -74.006, zoom: 11 },
  { keys: ["minneapolis", "minneapolis, mn"], label: "Minneapolis", lat: 44.9778, lng: -93.265, zoom: 10 },
  { keys: ["detroit", "detroit, mi"], label: "Detroit", lat: 42.3314, lng: -83.0458, zoom: 10 },
  { keys: ["nashville", "nashville, tn"], label: "Nashville", lat: 36.1627, lng: -86.7816, zoom: 10 },
  { keys: ["charlotte", "charlotte, nc"], label: "Charlotte", lat: 35.2271, lng: -80.8431, zoom: 10 },
  { keys: ["las vegas", "las vegas, nv"], label: "Las Vegas", lat: 36.1699, lng: -115.1398, zoom: 10 },
  { keys: ["salt lake city", "salt lake city, ut"], label: "Salt Lake City", lat: 40.7608, lng: -111.891, zoom: 10 },
  { keys: ["spokane", "spokane, wa"], label: "Spokane", lat: 47.6588, lng: -117.426, zoom: 10 },
  { keys: ["boise", "boise, id"], label: "Boise", lat: 43.615, lng: -116.2023, zoom: 10 },
  { keys: ["tacoma", "tacoma, wa"], label: "Tacoma", lat: 47.2529, lng: -122.4443, zoom: 11 },
  { keys: ["eugene", "eugene, or"], label: "Eugene", lat: 44.0521, lng: -123.0868, zoom: 11 },
];

const PLACE_INDEX = (() => {
  const map = new Map<string, GeoPoint>();
  for (const place of QUICK_SEARCH) {
    const point = {
      lat: place.lat,
      lng: place.lng,
      label: place.label,
      zoom: place.zoom,
    };
    map.set(normalize(place.label), point);
    map.set(normalize(place.query), point);
  }
  for (const place of US_PLACES) {
    const point = {
      lat: place.lat,
      lng: place.lng,
      label: place.label,
      zoom: place.zoom,
    };
    for (const key of place.keys) {
      const n = normalize(key);
      // Prefer first registration for ambiguous short keys (state codes win
      // because states are listed before cities in US_PLACES).
      if (n.length <= 2 && map.has(n)) continue;
      map.set(n, point);
    }
  }
  return map;
})();

export const US_MAP_CENTER: { lat: number; lng: number } = {
  lat: 39.5,
  lng: -98.35,
};
export const US_MAP_ZOOM = 5;

type GeocodeCacheEntry = { at: number; value: GeoPoint | null };
const geocodeCache = new Map<string, GeocodeCacheEntry>();
const GEOCODE_POSITIVE_TTL_MS = 1000 * 60 * 60 * 24;
const GEOCODE_NEGATIVE_TTL_MS = 1000 * 60 * 2;
const GEOCODE_MAX = 200;

function readGeocodeCache(key: string): GeoPoint | null | undefined {
  const entry = geocodeCache.get(key);
  if (!entry) return undefined;
  const ttl = entry.value ? GEOCODE_POSITIVE_TTL_MS : GEOCODE_NEGATIVE_TTL_MS;
  if (Date.now() - entry.at >= ttl) {
    geocodeCache.delete(key);
    return undefined;
  }
  return entry.value;
}

function writeGeocodeCache(key: string, value: GeoPoint | null) {
  if (geocodeCache.size >= GEOCODE_MAX) {
    const oldest = geocodeCache.keys().next().value;
    if (oldest !== undefined) geocodeCache.delete(oldest);
  }
  geocodeCache.set(key, { at: Date.now(), value });
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function dealerTextMatch(dealer: Dealer, q: string) {
  const fields = [
    dealer.name,
    dealer.city,
    dealer.region,
    dealer.postal,
    dealer.address,
  ]
    .filter(Boolean)
    .map((s) => normalize(String(s)));

  if (fields.some((f) => f === q || f.startsWith(`${q} `) || f.endsWith(` ${q}`))) {
    return true;
  }

  // ZIP prefix search
  if (/^\d{3,5}$/.test(q) && dealer.postal) {
    return normalize(dealer.postal).startsWith(q);
  }

  const hay = fields.join(" ");
  // Short queries: whole-token only (avoids "ne" matching "avenue")
  if (q.length < 3) {
    return hay.split(/[^a-z0-9]+/).includes(q);
  }

  return new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(q)}`).test(hay);
}

function centroid(
  dealers: (Dealer & { lat: number; lng: number })[],
): { lat: number; lng: number } | null {
  if (dealers.length === 0) return null;
  const lat =
    dealers.reduce((sum, d) => sum + d.lat, 0) / dealers.length;
  const lng =
    dealers.reduce((sum, d) => sum + d.lng, 0) / dealers.length;
  return { lat, lng };
}

/**
 * Instant resolve — known places, ZIP prefix on dealers, dealer text.
 * Returns null only when a network lookup is needed.
 */
export function resolvePlaceLocal(
  query: string,
  dealers: Dealer[],
): { place: GeoPoint; results: DealerWithDistance[] } | null {
  const q = normalize(query);
  if (!q) return null;

  // Places first so state codes ("ne", "or") are not stolen by address substrings
  const known = PLACE_INDEX.get(q);
  if (known) {
    return {
      place: known,
      results: rankDealersNear(dealers, known),
    };
  }

  // "City, ST" → try city key and state
  const cityState = q.match(/^(.+?),\s*([a-z]{2})$/);
  if (cityState) {
    const cityKey = cityState[1];
    const keyed = PLACE_INDEX.get(`${cityKey}, ${cityState[2]}`) ??
      PLACE_INDEX.get(cityKey);
    if (keyed) {
      return {
        place: keyed,
        results: rankDealersNear(dealers, keyed),
      };
    }
  }

  const textHits = dealers.filter((d) => dealerTextMatch(d, q));
  if (textHits.length > 0) {
    const withCoords = textHits.filter(dealerHasCoords);
    const origin =
      centroid(withCoords) ??
      (withCoords[0]
        ? { lat: withCoords[0].lat, lng: withCoords[0].lng }
        : null);
    if (origin) {
      const ranked = withCoords.map((dealer) => ({
        ...dealer,
        distanceMi: haversineMiles(origin, {
          lat: dealer.lat,
          lng: dealer.lng,
        }),
      }));
      ranked.sort(
        (a, b) => (a.distanceMi ?? Infinity) - (b.distanceMi ?? Infinity),
      );
      const nearby = rankDealersNear(dealers, origin);
      const byId = new Map<string, DealerWithDistance>();
      for (const d of ranked) byId.set(d.id, d);
      for (const d of nearby) {
        if (!byId.has(d.id)) byId.set(d.id, d);
      }
      const results = [...byId.values()].sort(
        (a, b) => (a.distanceMi ?? Infinity) - (b.distanceMi ?? Infinity),
      );
      const label =
        textHits[0].city ||
        textHits[0].region ||
        textHits[0].name ||
        query.trim();
      return {
        place: { ...origin, label, zoom: 10 },
        results,
      };
    }
  }

  return null;
}

/** Free ZIP lookup — Zippopotam.us, no API key, CORS-friendly, fast. */
async function geocodeZip(zip: string): Promise<GeoPoint | null> {
  const cached = readGeocodeCache(`zip:${zip}`);
  if (cached !== undefined) return cached;

  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (res.status === 404) {
      writeGeocodeCache(`zip:${zip}`, null);
      return null;
    }
    if (!res.ok) return null;

    const data = (await res.json()) as {
      "post code": string;
      places: {
        "place name": string;
        state: string;
        "state abbreviation": string;
        latitude: string;
        longitude: string;
      }[];
    };
    const place = data.places?.[0];
    if (!place) {
      writeGeocodeCache(`zip:${zip}`, null);
      return null;
    }
    const lat = Number(place.latitude);
    const lng = Number(place.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      writeGeocodeCache(`zip:${zip}`, null);
      return null;
    }
    const point: GeoPoint = {
      lat,
      lng,
      label: `${place["place name"]}, ${place["state abbreviation"]}`,
      zoom: 11,
    };
    writeGeocodeCache(`zip:${zip}`, point);
    return point;
  } catch {
    // Transient — do not cache failure
    return null;
  }
}

/** Cached city geocode via our API (Nominatim server-side). */
async function geocodeViaApi(query: string): Promise<GeoPoint | null> {
  const key = `q:${normalize(query)}`;
  const cached = readGeocodeCache(key);
  if (cached !== undefined) return cached;

  try {
    const url = `/api/geocode?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.status === 404) {
      writeGeocodeCache(key, null);
      return null;
    }
    if (!res.ok) return null;

    const data = (await res.json()) as {
      lat?: number;
      lng?: number;
      label?: string;
    } | null;
    if (
      !data ||
      typeof data.lat !== "number" ||
      typeof data.lng !== "number"
    ) {
      writeGeocodeCache(key, null);
      return null;
    }
    const point: GeoPoint = {
      lat: data.lat,
      lng: data.lng,
      label: data.label || query.trim(),
      zoom: 10,
    };
    writeGeocodeCache(key, point);
    return point;
  } catch {
    return null;
  }
}

/**
 * Resolve a search query to a map origin.
 * Prefers local/instant paths; network only when needed.
 */
export async function resolveSearch(
  query: string,
  dealers: Dealer[],
): Promise<{ place: GeoPoint; results: DealerWithDistance[] } | null> {
  const local = resolvePlaceLocal(query, dealers);
  if (local) return local;

  const q = query.trim();
  const zip = q.match(/^\d{5}$/);
  if (zip) {
    const place = await geocodeZip(zip[0]);
    if (!place) return null;
    return { place, results: rankDealersNear(dealers, place) };
  }

  const place = await geocodeViaApi(q);
  if (!place) return null;
  return { place, results: rankDealersNear(dealers, place) };
}

export function directionsUrl(dealer: Dealer) {
  if (dealerHasCoords(dealer)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${dealer.lat},${dealer.lng}`;
  }
  const q = [dealer.address, dealer.city, dealer.region, dealer.postal]
    .filter(Boolean)
    .join(", ");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
}

export function phoneHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : null;
}
