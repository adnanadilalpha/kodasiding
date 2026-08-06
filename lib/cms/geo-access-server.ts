import "server-only";

import {
  DEFAULT_GEO_ACCESS,
  normalizeGeoAccess,
  type GeoAccessSettings,
} from "@/lib/cms/geo-access";
import { createServiceClient } from "@/lib/supabase/admin";

type CacheEntry = {
  at: number;
  value: GeoAccessSettings;
};

let cache: CacheEntry | null = null;
const TTL_MS = 5_000;

export async function loadGeoAccessSettings(): Promise<GeoAccessSettings> {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return cache.value;
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("geo_access")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      console.error("geo_access load failed", error.message);
      return DEFAULT_GEO_ACCESS;
    }

    const value = normalizeGeoAccess(data?.geo_access);
    cache = { at: Date.now(), value };
    return value;
  } catch (err) {
    console.error("geo_access load unavailable", err);
    return DEFAULT_GEO_ACCESS;
  }
}

export function invalidateGeoAccessCache() {
  cache = null;
}
