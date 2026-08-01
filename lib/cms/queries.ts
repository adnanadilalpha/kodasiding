import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { LIVE_SNAPSHOT_STATUS, SITE_CACHE_TAG } from "@/lib/cms/constants";
import type { SiteSnapshotPayload } from "@/lib/cms/types";

/** Cookie-free anon client — safe inside unstable_cache. */
function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch },
  });
}

async function fetchLiveSnapshot(): Promise<SiteSnapshotPayload | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("site_snapshots")
    .select("payload")
    .eq("status", LIVE_SNAPSHOT_STATUS)
    .maybeSingle();

  if (error) {
    console.error("site snapshot fetch failed", error.message);
    return null;
  }
  if (!data) return null;
  return data.payload as SiteSnapshotPayload;
}

/**
 * Public site content — one snapshot row, cached in Next until admin save
 * calls revalidateTag("site"). Avoids multi-table Supabase fan-out on reloads.
 */
export const getSiteContent = unstable_cache(
  fetchLiveSnapshot,
  ["site-live-snapshot-v5"],
  { tags: [SITE_CACHE_TAG], revalidate: false },
);

