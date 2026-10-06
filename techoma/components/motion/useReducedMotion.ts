"use client";

import { useEffect, useState } from "react";

/**
 * Tracks prefers-reduced-motion live (not just on mount), since some
 * OSes let users flip it without a reload.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Syncing an external browser API into state on mount — not derivable at render time (SSR has no matchMedia).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(query.matches);

    const handler = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);

  return reduced;
}
