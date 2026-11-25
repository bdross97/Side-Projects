"use client";

import { useSyncExternalStore } from "react";

// The static HTML was rendered at build time. The first client render must
// match it (no hydration mismatch), so the server snapshot is the build time.
// React then re-renders with the visitor's real clock straight after hydrating.
const BUILD_TIME = Date.parse(process.env.NEXT_PUBLIC_BUILD_TIME ?? "") || 0;

let cached: { key: string; ms: number } | null = null;

/**
 * Dev only: ?now=YYYY-MM-DD pretends it is noon in Salt Lake City that day.
 * Ignored in production builds.
 */
function readNow(): number {
  const search = typeof window === "undefined" ? "" : window.location.search;
  if (cached && cached.key === search) return cached.ms;

  let ms = Date.now();
  if (process.env.NODE_ENV === "development") {
    const override = new URLSearchParams(search).get("now");
    if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) {
      ms = Date.parse(`${override}T12:00:00-07:00`);
    }
  }
  cached = { key: search, ms };
  return ms;
}

const subscribe = () => () => {};

export function useNow(): Date {
  const ms = useSyncExternalStore(subscribe, readNow, () => BUILD_TIME);
  return new Date(ms);
}
