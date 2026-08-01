export function publicMediaUrl(path: string, bucket = "media") {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base || !path) return null;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

export function mediaUrlFromMap(
  media: Record<string, { path: string; bucket: string }>,
  id: string | null | undefined,
  fallback?: string | null,
): string | null {
  if (id && media[id]) {
    return publicMediaUrl(media[id].path, media[id].bucket) ?? fallback ?? null;
  }
  return fallback ?? null;
}
