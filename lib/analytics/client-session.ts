/** GA-style client identity: persistent visitor + 30-minute inactivity session timeout. */

export const VISITOR_STORAGE_KEY = "koda.analytics.visitor";
export const SESSION_STORAGE_KEY = "koda.analytics.session";
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

type StoredSession = {
  id: string;
  visitorId: string;
  startedAt: number;
  lastActivityAt: number;
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (
      typeof parsed.id === "string" &&
      typeof parsed.visitorId === "string" &&
      typeof parsed.lastActivityAt === "number"
    ) {
      return parsed;
    }
  } catch {
    // ignore corrupt storage
  }

  return null;
}

function writeStoredSession(session: StoredSession) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function getVisitorId(): string {
  const existing = localStorage.getItem(VISITOR_STORAGE_KEY);
  if (existing) return existing;

  const visitorId = createId();
  localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);
  return visitorId;
}

/** Returns the active session or starts a new one after 30 minutes of inactivity. */
export function getOrRefreshSession(now = Date.now()): StoredSession {
  const visitorId = getVisitorId();
  const existing = readStoredSession();

  if (
    existing &&
    existing.visitorId === visitorId &&
    now - existing.lastActivityAt < SESSION_TIMEOUT_MS
  ) {
    const refreshed = { ...existing, lastActivityAt: now };
    writeStoredSession(refreshed);
    return refreshed;
  }

  const session: StoredSession = {
    id: createId(),
    visitorId,
    startedAt: now,
    lastActivityAt: now,
  };
  writeStoredSession(session);
  return session;
}

export function touchSession(now = Date.now()) {
  const session = readStoredSession();
  if (!session) return;
  writeStoredSession({ ...session, lastActivityAt: now });
}
