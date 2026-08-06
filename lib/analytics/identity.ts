/** GA-style identity primitives shared by ingestion and aggregation layers. */

export const ACTIVE_USER_WINDOW_MS = 30 * 60 * 1000;

export type AnalyticsIdentityRow = {
  visitor_id?: string | null;
  visitor_key?: string | null;
  session_id: string;
};

/** Stable user key: visitor_id → visitor_key → session_id fallback. */
export function getVisitorDedupKey(row: AnalyticsIdentityRow): string {
  if (row.visitor_id) return `v:${row.visitor_id}`;
  if (row.visitor_key) return `k:${row.visitor_key}`;
  return `s:${row.session_id}`;
}

export function countUniqueVisitors<T extends AnalyticsIdentityRow>(rows: T[]): number {
  const ids = new Set<string>();
  for (const row of rows) {
    ids.add(getVisitorDedupKey(row));
  }
  return ids.size;
}

export function countUniqueSessions<T extends { session_id: string }>(rows: T[]): number {
  return new Set(rows.map((row) => row.session_id)).size;
}

export function countActiveUsers<T extends AnalyticsIdentityRow & { last_seen_at?: string | null; created_at: string }>(
  rows: T[],
  reference = Date.now(),
): number {
  const cutoff = reference - ACTIVE_USER_WINDOW_MS;
  const active = new Set<string>();

  for (const row of rows) {
    const seenAt = new Date(row.last_seen_at ?? row.created_at).getTime();
    if (seenAt >= cutoff) {
      active.add(getVisitorDedupKey(row));
    }
  }

  return active.size;
}
