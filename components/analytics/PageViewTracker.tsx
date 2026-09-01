"use client";

import {
  getOrRefreshSession,
  touchSession,
} from "@/lib/analytics/client-session";
import { ENGAGED_SESSION_SECONDS } from "@/lib/analytics/engagement";
import { canTrackAnalytics } from "@/lib/analytics/track-client";
import { normalizeAnalyticsPath } from "@/lib/analytics/normalize-path";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const VIEW_KEY = "koda.analytics.view";
const SESSION_VIEWS_KEY = "koda.analytics.session-views";
const DURATION_HEARTBEAT_MS = 30_000;

type SessionViewMap = Record<string, Record<string, string>>;

function readSessionViewMap(): SessionViewMap {
  try {
    const raw = sessionStorage.getItem(SESSION_VIEWS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SessionViewMap;
  } catch {
    return {};
  }
}

function getSessionViewId(sessionId: string, path: string): string | null {
  return readSessionViewMap()[sessionId]?.[path] ?? null;
}

function setSessionViewId(sessionId: string, path: string, viewId: string) {
  const map = readSessionViewMap();
  map[sessionId] = { ...(map[sessionId] ?? {}), [path]: viewId };
  sessionStorage.setItem(SESSION_VIEWS_KEY, JSON.stringify(map));
}

async function patchPageView(
  viewId: string,
  sessionId: string,
  options: { durationSeconds?: number; isBounce?: boolean } = {},
) {
  await fetch("/api/analytics/page-view", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      viewId,
      sessionId,
      durationSeconds: options.durationSeconds,
      isBounce: options.isBounce,
    }),
    keepalive: true,
  });

  touchSession();
}

function currentDurationSeconds(startedAt: number): number {
  return Math.max(1, Math.round((Date.now() - startedAt) / 1000));
}

function flushActiveViewDuration(
  viewId: string,
  sessionId: string,
  startedAt: number,
) {
  const durationSeconds = currentDurationSeconds(startedAt);
  void patchPageView(viewId, sessionId, {
    durationSeconds,
    isBounce: durationSeconds < ENGAGED_SESSION_SECONDS,
  });
}

async function trackPageView(path: string, sessionId: string) {
  if (!canTrackAnalytics()) return null;

  const response = await fetch("/api/analytics/page-view", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      visitorId: getOrRefreshSession().visitorId || null,
      path,
      pageTitle: document.title,
      referrer: document.referrer || null,
    }),
    keepalive: true,
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as {
    id?: string;
    skipped?: boolean;
    deduped?: boolean;
  };

  if (payload.skipped || !payload.id) return null;

  sessionStorage.setItem(VIEW_KEY, payload.id);
  setSessionViewId(sessionId, path, payload.id);
  touchSession();
  return payload.id;
}

export function PageViewTracker() {
  const pathname = usePathname();
  const startedAtRef = useRef(Date.now());
  const trackingRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || !canTrackAnalytics()) {
      return;
    }

    const path = normalizeAnalyticsPath(pathname);
    const session = getOrRefreshSession();
    const now = Date.now();

    if (trackingRef.current === path) {
      return;
    }
    trackingRef.current = path;

    const existingViewId = getSessionViewId(session.id, path);
    const previousViewId = sessionStorage.getItem(VIEW_KEY);
    const previousStartedAt = startedAtRef.current;

    if (previousViewId && previousViewId !== existingViewId) {
      void patchPageView(previousViewId, session.id, {
        durationSeconds: Math.max(
          1,
          Math.round((now - previousStartedAt) / 1000),
        ),
        isBounce: false,
      });
    }

    startedAtRef.current = now;

    if (existingViewId) {
      sessionStorage.setItem(VIEW_KEY, existingViewId);
      void patchPageView(existingViewId, session.id, {
        isBounce: false,
      }).finally(() => {
        if (trackingRef.current === path) {
          trackingRef.current = null;
        }
      });
    } else {
      void trackPageView(path, session.id).finally(() => {
        if (trackingRef.current === path) {
          trackingRef.current = null;
        }
      });
    }

    const flushActiveView = () => {
      const viewId = sessionStorage.getItem(VIEW_KEY);
      if (!viewId) return;
      flushActiveViewDuration(viewId, session.id, startedAtRef.current);
    };

    const handlePageHide = () => {
      flushActiveView();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushActiveView();
      }
    };

    const heartbeat = window.setInterval(flushActiveView, DURATION_HEARTBEAT_MS);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [pathname]);

  return null;
}
