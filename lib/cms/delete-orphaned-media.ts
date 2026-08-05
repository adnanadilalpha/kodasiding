import { createClient } from "@/lib/supabase/server";

type MediaRef = string | null | undefined;

/** IDs present in `before` but not in `after` (replaced or cleared). */
export function releasedMediaIds(
  before: MediaRef[],
  after: MediaRef[],
): string[] {
  const keep = new Set(
    after.filter((id): id is string => typeof id === "string" && id.length > 0),
  );
  const out: string[] = [];
  for (const id of before) {
    if (typeof id === "string" && id && !keep.has(id) && !out.includes(id)) {
      out.push(id);
    }
  }
  return out;
}

function asMediaId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  return id || null;
}

/**
 * Deletes media rows + storage objects that are no longer referenced anywhere
 * in CMS content. Best-effort: logs failures without throwing so saves succeed.
 */
export async function deleteOrphanedMediaAssets(candidateIds: MediaRef[]) {
  const ids = [
    ...new Set(
      candidateIds.filter(
        (id): id is string => typeof id === "string" && id.length > 0,
      ),
    ),
  ];
  if (ids.length === 0) return;

  const supabase = await createClient();
  const stillUsed = await findReferencedMediaIds(supabase, ids);
  const orphans = ids.filter((id) => !stillUsed.has(id));
  if (orphans.length === 0) return;

  const { data: assets, error: selectError } = await supabase
    .from("media_assets")
    .select("id, bucket, path")
    .in("id", orphans);

  if (selectError) {
    console.error("orphan media select failed", selectError.message);
    return;
  }
  if (!assets?.length) return;

  const byBucket = new Map<string, string[]>();
  for (const asset of assets) {
    const paths = byBucket.get(asset.bucket) ?? [];
    paths.push(asset.path);
    byBucket.set(asset.bucket, paths);
  }

  for (const [bucket, paths] of byBucket) {
    for (let i = 0; i < paths.length; i += 100) {
      const chunk = paths.slice(i, i + 100);
      const { error } = await supabase.storage.from(bucket).remove(chunk);
      if (error) {
        console.error(
          `orphan media storage cleanup failed (${bucket})`,
          error.message,
        );
      }
    }
  }

  const { error: deleteError } = await supabase
    .from("media_assets")
    .delete()
    .in(
      "id",
      assets.map((a) => a.id),
    );

  if (deleteError) {
    console.error("orphan media row cleanup failed", deleteError.message);
  }
}

async function findReferencedMediaIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[],
): Promise<Set<string>> {
  const used = new Set<string>();

  const [
    profileImages,
    profileDiagrams,
    partnerLogos,
    jewelImages,
    videoThumbs,
    pageHome,
    settings,
  ] = await Promise.all([
    supabase.from("profiles").select("image_media_id").in("image_media_id", ids),
    supabase
      .from("profiles")
      .select("diagram_media_id")
      .in("diagram_media_id", ids),
    supabase.from("partners").select("logo_media_id").in("logo_media_id", ids),
    supabase
      .from("home_profile_jewels")
      .select("image_media_id")
      .in("image_media_id", ids),
    supabase
      .from("videos")
      .select("thumbnail_media_id")
      .in("thumbnail_media_id", ids),
    supabase.from("page_home").select("hero, why_koda, ctas").eq("id", 1).maybeSingle(),
    supabase.from("site_settings").select("seo").eq("id", 1).maybeSingle(),
  ]);

  const checkErrors = [
    profileImages.error,
    profileDiagrams.error,
    partnerLogos.error,
    jewelImages.error,
    videoThumbs.error,
    pageHome.error,
    settings.error,
  ].filter(Boolean);
  if (checkErrors.length > 0) {
    console.error(
      "orphan media reference check failed — skipping delete",
      checkErrors.map((e) => e?.message).join("; "),
    );
    // Fail closed: treat all candidates as still used.
    return new Set(ids);
  }

  for (const row of profileImages.data ?? []) {
    const id = asMediaId(row.image_media_id);
    if (id) used.add(id);
  }
  for (const row of profileDiagrams.data ?? []) {
    const id = asMediaId(row.diagram_media_id);
    if (id) used.add(id);
  }
  for (const row of partnerLogos.data ?? []) {
    const id = asMediaId(row.logo_media_id);
    if (id) used.add(id);
  }
  for (const row of jewelImages.data ?? []) {
    const id = asMediaId(row.image_media_id);
    if (id) used.add(id);
  }
  for (const row of videoThumbs.data ?? []) {
    const id = asMediaId(row.thumbnail_media_id);
    if (id) used.add(id);
  }

  const home = pageHome.data;
  if (home) {
    const hero = home.hero as Record<string, unknown> | null;
    const why = home.why_koda as Record<string, unknown> | null;
    const ctas = home.ctas as {
      quote?: Record<string, unknown>;
      dealer?: Record<string, unknown>;
    } | null;

    for (const id of [
      asMediaId(hero?.image_media_id),
      asMediaId(why?.image_media_id),
      asMediaId(ctas?.quote?.image_media_id),
      asMediaId(ctas?.dealer?.image_media_id),
    ]) {
      if (id && ids.includes(id)) used.add(id);
    }
  }

  const seo = settings.data?.seo as Record<string, unknown> | null;
  const og = asMediaId(seo?.og_image_media_id);
  if (og && ids.includes(og)) used.add(og);

  return used;
}
