/** GA4-style engaged session threshold (seconds on site or multi-page). */
export const ENGAGED_SESSION_SECONDS = 10;

const MAX_DURATION_SECONDS = 86_400;

export type SessionEngagementView = {
  path: string;
  duration_seconds: number | null;
  created_at?: string;
  last_seen_at?: string | null;
};

export function inferredViewDurationSeconds(
  view: SessionEngagementView,
): number {
  if (typeof view.duration_seconds === "number" && view.duration_seconds > 0) {
    return view.duration_seconds;
  }

  if (view.created_at && view.last_seen_at) {
    const startMs = new Date(view.created_at).getTime();
    const endMs = new Date(view.last_seen_at).getTime();
    if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs) {
      return Math.min(
        MAX_DURATION_SECONDS,
        Math.round((endMs - startMs) / 1000),
      );
    }
  }

  return 0;
}

export function sessionDurationSeconds(
  views: SessionEngagementView[],
): number {
  return views.reduce(
    (sum, view) => sum + inferredViewDurationSeconds(view),
    0,
  );
}

export function groupViewsBySession<T extends { session_id: string }>(
  views: T[],
): Map<string, T[]> {
  const sessions = new Map<string, T[]>();

  for (const view of views) {
    const sessionViews = sessions.get(view.session_id) ?? [];
    sessionViews.push(view);
    sessions.set(view.session_id, sessionViews);
  }

  return sessions;
}

/** Engaged = 2+ pages, tracked events, or at least ENGAGED_SESSION_SECONDS on site. */
export function isEngagedSession(
  views: SessionEngagementView[],
  hasEvents = false,
): boolean {
  if (hasEvents) return true;

  const uniquePaths = new Set(views.map((view) => view.path));
  if (uniquePaths.size > 1) return true;

  return sessionDurationSeconds(views) >= ENGAGED_SESSION_SECONDS;
}

export function isBounceSession(
  views: SessionEngagementView[],
  hasEvents = false,
): boolean {
  return views.length > 0 && !isEngagedSession(views, hasEvents);
}
