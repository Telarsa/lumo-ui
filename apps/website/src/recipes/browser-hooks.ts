"use client";

import * as React from "react";

/**
 * Copy this hook into an application when one delayed value is all it needs — a docs recipe, not a Lumo runtime abstraction.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);
  return debounced;
}

/**
 * Subscribe to a media query without a hydration guess: pass the layout the served HTML represents as `serverMatches`.
 */
export function useMediaQuery(query: string, serverMatches: boolean): boolean {
  const subscribe = React.useCallback((notify: () => void) => {
    if (typeof window === "undefined") return () => {};
    const media = window.matchMedia(query);
    media.addEventListener("change", notify);
    return () => media.removeEventListener("change", notify);
  }, [query]);
  const getSnapshot = React.useCallback(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
    [query],
  );
  const getServerSnapshot = React.useCallback(() => serverMatches, [serverMatches]);
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
