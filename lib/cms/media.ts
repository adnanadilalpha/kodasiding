import { createClient } from "@/lib/supabase/server";
import type { MediaAsset } from "@/lib/cms/types";

export async function getMediaMap(
  ids: Array<string | null | undefined>,
): Promise<Record<string, MediaAsset>> {
  const unique = [...new Set(ids.filter(Boolean) as string[])];
  if (unique.length === 0) return {};

  const supabase = await createClient();
  const map: Record<string, MediaAsset> = {};

  // Chunk to stay under PostgREST URL / request limits.
  const chunkSize = 80;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from("media_assets")
      .select(
        "id, bucket, path, alt, width, height, bytes, mime_type, created_at",
      )
      .in("id", chunk);

    if (error) {
      console.error("getMediaMap failed", error.message);
      continue;
    }
    for (const row of data ?? []) {
      map[row.id] = row as MediaAsset;
    }
  }

  return map;
}
