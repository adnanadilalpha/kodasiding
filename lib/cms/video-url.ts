/** Parse YouTube watch / share / embed / shorts URLs → video id. */
export function parseYoutubeId(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const v = url.searchParams.get("v");
      if (v) return v;

      const parts = url.pathname.split("/").filter(Boolean);
      if (
        (parts[0] === "embed" ||
          parts[0] === "shorts" ||
          parts[0] === "live" ||
          parts[0] === "v") &&
        parts[1]
      ) {
        return parts[1];
      }
    }
  } catch {
    // not a URL
  }

  return null;
}

export function youtubeEmbedUrl(id: string, autoplay = true) {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  if (autoplay) params.set("autoplay", "1");
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

export function youtubeThumbnailUrl(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/** Uploaded Supabase videos or direct MP4/WebM links. */
export function isDirectVideoUrl(raw: string): boolean {
  const value = raw.trim();
  if (!value) return false;
  if (value.includes("/storage/v1/object/public/videos/")) return true;
  return /\.(mp4|webm|ogg)(\?|#|$)/i.test(value);
}

export function parseVimeoId(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "video" && parts[1]) return parts[1];
    if (parts[0] && /^\d+$/.test(parts[0])) return parts[0];
  } catch {
    return null;
  }
  return null;
}

export function vimeoEmbedUrl(id: string, autoplay = true) {
  const params = new URLSearchParams({ title: "0", byline: "0", portrait: "0" });
  if (autoplay) params.set("autoplay", "1");
  return `https://player.vimeo.com/video/${id}?${params.toString()}`;
}
