import type { MediaAsset, SiteSnapshotPayload } from "@/lib/cms/types";
import { LIVE_SNAPSHOT_STATUS, SITE_CACHE_TAG } from "@/lib/cms/constants";
import { normalizeGeoAccess } from "@/lib/cms/geo-access";
import { compareProfiles } from "@/lib/cms/profile-sort";
import { createClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";

export { LIVE_SNAPSHOT_STATUS, SITE_CACHE_TAG };

/** Build public payload from current draft CMS tables (admin session). */
export async function buildSnapshotPayload(): Promise<SiteSnapshotPayload> {
  const supabase = await createClient();

  const [
    settingsRes,
    homeRes,
    pageProfilesRes,
    partnersRes,
    jewelsRes,
    profilesRes,
    dealersRes,
    videosRes,
    documentsRes,
    mediaRes,
  ] = await Promise.all([
    supabase.from("site_settings").select("*").eq("id", 1).single(),
    supabase.from("page_home").select("*").eq("id", 1).single(),
    supabase.from("page_profiles").select("*").eq("id", 1).single(),
    supabase
      .from("partners")
      .select("id, name, logo_media_id, sort_order, is_published")
      .eq("is_published", true)
      .order("sort_order"),
    supabase
      .from("home_profile_jewels")
      .select(
        "id, name, reveal, image_media_id, sort_order, is_published",
      )
      .eq("is_published", true)
      .order("sort_order"),
    supabase
      .from("profiles")
      .select(
        "id, slug, name, reveal, orientation, description, hover_copy, exposure, face_width, depth, install, image_media_id, diagram_media_id, sort_order, is_published, show_on_home",
      )
      .eq("is_published", true)
      .order("sort_order"),
    supabase
      .from("dealers")
      .select(
        "id, name, address, city, region, postal, lat, lng, phone, website, is_published",
      )
      .eq("is_published", true)
      .order("name"),
    supabase
      .from("videos")
      .select(
        "id, title, orientation, thumbnail_media_id, video_url, sort_order, is_published",
      )
      .eq("is_published", true)
      .order("sort_order"),
    supabase.from("documents").select("id, key, title, storage_path, bucket"),
    supabase
      .from("media_assets")
      .select("id, bucket, path, alt, width, height, bytes, mime_type, created_at"),
  ]);

  if (settingsRes.error) throw new Error(settingsRes.error.message);
  if (homeRes.error) throw new Error(homeRes.error.message);
  if (pageProfilesRes.error) throw new Error(pageProfilesRes.error.message);

  const mediaMap: Record<string, MediaAsset> = {};
  for (const asset of mediaRes.data ?? []) {
    mediaMap[asset.id] = asset as MediaAsset;
  }

  const settings = settingsRes.data;
  const home = homeRes.data;

  return {
    settings: {
      ...settings,
      show_partners: settings.show_partners !== false,
      geo_access: normalizeGeoAccess(settings.geo_access),
      nav: {
        ...settings.nav,
        show_find_dealer: settings.nav?.show_find_dealer === true,
      },
    },
    home: {
      ...home,
      ctas: {
        ...home.ctas,
        show_dealer: home.ctas?.show_dealer === true,
      },
    },
    page_profiles: pageProfilesRes.data,
    partners: partnersRes.data ?? [],
    home_profile_jewels: jewelsRes.data ?? [],
    profiles: [...(profilesRes.data ?? [])].sort(compareProfiles),
    dealers: dealersRes.data ?? [],
    videos: videosRes.data ?? [],
    documents: documentsRes.data ?? [],
    media: mediaMap,
    published_at: new Date().toISOString(),
  };
}

/**
 * Rebuild the single public snapshot after an admin save.
 * Marketing site reads only this row (egress-safe).
 */
export async function syncPublicSite(userId?: string | null) {
  const supabase = await createClient();
  const payload = await buildSnapshotPayload();
  const row = {
    status: LIVE_SNAPSHOT_STATUS,
    payload,
    published_at: payload.published_at,
    published_by: userId ?? null,
  };

  // Update in place so a failed insert never leaves the live site blank.
  const { data: existing, error: selectError } = await supabase
    .from("site_snapshots")
    .select("id")
    .eq("status", LIVE_SNAPSHOT_STATUS)
    .maybeSingle();

  if (selectError) throw new Error(selectError.message);

  if (existing?.id) {
    const { error } = await supabase
      .from("site_snapshots")
      .update({
        payload: row.payload,
        published_at: row.published_at,
        published_by: row.published_by,
      })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("site_snapshots").insert(row);
    if (error) throw new Error(error.message);
  }

  revalidateTag(SITE_CACHE_TAG, "max");
  return payload;
}
