import { NextResponse } from "next/server";
import { ENGAGED_SESSION_SECONDS } from "@/lib/analytics/engagement";
import { deviceTypeFromUserAgent } from "@/lib/analytics/device";
import { isInternalAnalyticsRequest } from "@/lib/analytics/internal-traffic";
import { normalizeAnalyticsPath } from "@/lib/analytics/normalize-path";
import {
  getRequestAnalyticsContext,
  isValidAnalyticsId,
} from "@/lib/analytics/server";
import {
  allowRateLimitedRequest,
  requestClientIp,
} from "@/lib/api/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";

const RATE_WINDOW_MS = 60_000;
/** Page views + touches — enough for normal browsing, blocks floods. */
const RATE_MAX_PAGE_VIEW = 60;

type PageViewBody = {
  sessionId?: string;
  visitorId?: string | null;
  path?: string;
  pageTitle?: string;
  referrer?: string;
  durationSeconds?: number;
  isBounce?: boolean;
  viewId?: string;
};

function clipText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\0/g, "").trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function safeReferrer(value: unknown): string | null {
  const ref = clipText(value, 500);
  if (!ref) return null;
  const lower = ref.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:")
  ) {
    return null;
  }
  return ref;
}

function clampDuration(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.min(86_400, Math.max(0, Math.round(value)));
}

async function rateLimitOrReject(request: Request) {
  const ip = requestClientIp(request);
  const allowed = await allowRateLimitedRequest({
    bucket: "analytics-page-view",
    key: ip,
    max: RATE_MAX_PAGE_VIEW,
    windowMs: RATE_WINDOW_MS,
  });
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  return null;
}

export async function POST(request: Request) {
  const context = await getRequestAnalyticsContext(request);

  if (!context.shouldRecord) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const limited = await rateLimitOrReject(request);
  if (limited) return limited;

  let body: PageViewBody;

  try {
    body = (await request.json()) as PageViewBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const { sessionId, visitorId, path, pageTitle, referrer, durationSeconds, isBounce } =
    body;

  if (!isValidAnalyticsId(sessionId) || !path || typeof path !== "string") {
    return NextResponse.json(
      { error: "Missing session or path." },
      { status: 400 },
    );
  }

  if (path.length > 300) {
    return NextResponse.json({ error: "Invalid path." }, { status: 400 });
  }

  const normalizedPath = normalizeAnalyticsPath(path);

  if (normalizedPath.startsWith("/admin")) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const supabase = createServiceClient();
  const isInternal = isInternalAnalyticsRequest(context.visitorKey, request);
  const now = new Date().toISOString();
  const safeTitle = clipText(pageTitle, 300);
  const safeRef = safeReferrer(referrer);
  const duration = clampDuration(durationSeconds);

  const { data: sessionView, error: sessionViewError } = await supabase
    .from("page_views")
    .select("id")
    .eq("session_id", sessionId)
    .eq("visitor_key", context.visitorKey)
    .eq("path", normalizedPath)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sessionViewError) {
    return NextResponse.json(
      { error: sessionViewError.message },
      { status: 500 },
    );
  }

  if (sessionView?.id) {
    const { error: touchError } = await supabase
      .from("page_views")
      .update({
        last_seen_at: now,
        page_title: safeTitle,
        referrer: safeRef,
        is_bounce: false,
        is_internal: isInternal,
      })
      .eq("id", sessionView.id)
      .eq("visitor_key", context.visitorKey);

    if (touchError) {
      return NextResponse.json({ error: touchError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      id: sessionView.id,
      deduped: true,
    });
  }

  const { data, error } = await supabase
    .from("page_views")
    .insert({
      session_id: sessionId,
      visitor_id: isValidAnalyticsId(visitorId ?? undefined) ? visitorId : null,
      visitor_key: context.visitorKey,
      path: normalizedPath,
      page_title: safeTitle,
      referrer: safeRef,
      country_code: context.countryCode,
      region: context.region,
      city: context.city,
      latitude: context.latitude,
      longitude: context.longitude,
      device_type: deviceTypeFromUserAgent(
        request.headers.get("user-agent"),
      ),
      duration_seconds: duration,
      is_bounce: typeof isBounce === "boolean" ? isBounce : true,
      is_internal: isInternal,
      view_count: 1,
      last_seen_at: now,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}

export async function PATCH(request: Request) {
  const context = await getRequestAnalyticsContext(request);

  if (!context.shouldRecord) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const limited = await rateLimitOrReject(request);
  if (limited) return limited;

  let body: PageViewBody;

  try {
    body = (await request.json()) as PageViewBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const { viewId, sessionId, durationSeconds, isBounce } = body;

  if (!isValidAnalyticsId(viewId) || !isValidAnalyticsId(sessionId)) {
    return NextResponse.json(
      { error: "Missing view or session id." },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();
  const updates: Record<string, unknown> = {
    last_seen_at: new Date().toISOString(),
  };

  const duration = clampDuration(durationSeconds);
  if (duration != null) {
    updates.duration_seconds = duration;
    updates.is_bounce = duration < ENGAGED_SESSION_SECONDS;
  } else if (typeof isBounce === "boolean") {
    updates.is_bounce = isBounce;
  }

  const { data, error } = await supabase
    .from("page_views")
    .update(updates)
    .eq("id", viewId)
    .eq("session_id", sessionId)
    .eq("visitor_key", context.visitorKey)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
