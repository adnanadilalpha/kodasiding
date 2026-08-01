import { createClient } from "@/lib/supabase/server";
import type { MediaAsset } from "@/lib/cms/types";

export async function getMediaMap(
  ids: Array<string | null | undefined>,
): Promise<Record<string, MediaAsset>> {
  const unique = [...new Set(ids.filter(Boolean) as string[])];
  if (unique.length === 0) return {};

  const supabase = await createClient();
  const { data } = await supabase
    .from("media_assets")
    .select("id, bucket, path, alt, width, height, bytes, mime_type, created_at")
    .in("id", unique);

  const map: Record<string, MediaAsset> = {};
  for (const row of data ?? []) {
    map[row.id] = row as MediaAsset;
  }
  return map;
}
