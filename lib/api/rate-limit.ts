import { createServiceClient } from "@/lib/supabase/admin";

/** Prefer platform client IP over spoofable X-Forwarded-For first hop. */
export function requestClientIp(request: Request): string {
  const vercel =
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim();
  if (vercel) return vercel;
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  );
}

/**
 * Sliding-window rate limit backed by `api_rate_events` (service role).
 * Fails closed on DB errors or missing IP.
 */
export async function allowRateLimitedRequest(options: {
  bucket: string;
  key: string;
  max: number;
  windowMs: number;
}): Promise<boolean> {
  const { bucket, key, max, windowMs } = options;
  if (!key || key === "unknown") return false;

  try {
    const supabase = createServiceClient();
    const since = new Date(Date.now() - windowMs).toISOString();
    const { count, error } = await supabase
      .from("api_rate_events")
      .select("id", { count: "exact", head: true })
      .eq("bucket", bucket)
      .eq("key", key)
      .gte("created_at", since);

    if (error) {
      console.error("rate check failed", bucket, error);
      return false;
    }
    if ((count ?? 0) >= max) return false;

    const { error: insertError } = await supabase
      .from("api_rate_events")
      .insert({ bucket, key });
    if (insertError) {
      console.error("rate insert failed", bucket, insertError);
      return false;
    }
    return true;
  } catch (err) {
    console.error("rate limit unavailable", bucket, err);
    return false;
  }
}
