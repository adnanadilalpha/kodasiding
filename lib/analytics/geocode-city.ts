import "server-only";

type GeoPoint = {
  latitude: number;
  longitude: number;
};

const geocodeCache = new Map<string, GeoPoint | null>();

function cacheKey(
  countryCode: string,
  region: string | null | undefined,
  city: string | null | undefined,
): string {
  return [
    countryCode.toUpperCase(),
    region?.trim().toLowerCase() ?? "",
    city?.trim().toLowerCase() ?? "",
  ].join("|");
}

function averageCoordinates(points: GeoPoint[]): GeoPoint | null {
  if (points.length === 0) return null;

  const totals = points.reduce(
    (sum, point) => ({
      latitude: sum.latitude + point.latitude,
      longitude: sum.longitude + point.longitude,
    }),
    { latitude: 0, longitude: 0 },
  );

  return {
    latitude: totals.latitude / points.length,
    longitude: totals.longitude / points.length,
  };
}

export function averageStoredCoordinates(
  values: Array<{ latitude?: number | null; longitude?: number | null }>,
): GeoPoint | null {
  const points = values
    .map((value) => {
      if (
        typeof value.latitude !== "number" ||
        typeof value.longitude !== "number" ||
        !Number.isFinite(value.latitude) ||
        !Number.isFinite(value.longitude)
      ) {
        return null;
      }

      return {
        latitude: value.latitude,
        longitude: value.longitude,
      };
    })
    .filter((point): point is GeoPoint => point !== null);

  return averageCoordinates(points);
}

/** Free geocoder for city labels missing stored coordinates (Open-Meteo). */
export async function geocodeCityLocation(input: {
  countryCode: string;
  region?: string | null;
  city?: string | null;
}): Promise<GeoPoint | null> {
  const countryCode = input.countryCode.trim().toUpperCase();
  const region = input.region?.trim() ?? "";
  const city = input.city?.trim() ?? "";
  const key = cacheKey(countryCode, region, city);

  if (geocodeCache.has(key)) {
    return geocodeCache.get(key) ?? null;
  }

  const searchName = city || region;
  if (!searchName) {
    geocodeCache.set(key, null);
    return null;
  }

  try {
    const params = new URLSearchParams({
      name: searchName,
      count: "5",
      language: "en",
      format: "json",
    });

    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`,
      {
        signal: AbortSignal.timeout(4000),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      geocodeCache.set(key, null);
      return null;
    }

    const data = (await response.json()) as {
      results?: Array<{
        latitude: number;
        longitude: number;
        country_code?: string;
        admin1?: string;
        name?: string;
      }>;
    };

    const results = data.results ?? [];
    const normalizedRegion = region.toLowerCase();
    const normalizedCity = city.toLowerCase();

    const match =
      results.find((result) => {
        const countryMatches =
          !result.country_code ||
          result.country_code.toUpperCase() === countryCode;
        const adminMatches =
          !normalizedRegion ||
          result.admin1?.toLowerCase().includes(normalizedRegion) ||
          normalizedRegion.includes(result.admin1?.toLowerCase() ?? "");
        const cityMatches =
          !normalizedCity ||
          result.name?.toLowerCase() === normalizedCity ||
          result.name?.toLowerCase().includes(normalizedCity);

        return countryMatches && (cityMatches || adminMatches);
      }) ?? results.find((result) => result.country_code?.toUpperCase() === countryCode) ?? results[0];

    if (!match) {
      geocodeCache.set(key, null);
      return null;
    }

    const point = {
      latitude: match.latitude,
      longitude: match.longitude,
    };
    geocodeCache.set(key, point);
    return point;
  } catch {
    geocodeCache.set(key, null);
    return null;
  }
}
