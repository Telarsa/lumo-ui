"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { getTheme, setTheme, type Theme } from "lumo-ui/core";
import type { Copy } from "@/content/copy";

/*
 * One button cycles system -> light -> dark -> system. "system" is the default:
 * themeScript leaves data-theme off, so the prefers-color-scheme tokens follow
 * the OS live. An explicit choice wins and persists (`lumo-theme`); the third
 * press returns to following the system. The icon and name show the stored
 * SETTING, not the resolved colour, so they come from storage, not the DOM.
 */
const event = "lumo:themechange";
const next: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };

function subscribe(onChange: () => void) {
  window.addEventListener(event, onChange);
  window.addEventListener("storage", onChange);
  return () => { window.removeEventListener(event, onChange); window.removeEventListener("storage", onChange); };
}
const snapshot = (): Theme => getTheme();
const serverSnapshot = (): Theme => "system";

function Icon({ theme }: { theme: Theme }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {theme === "system" && <><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8m-4-4v4" /></>}
    {theme === "light" && <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>}
    {theme === "dark" && <path d="M20.8 13.2A8.8 8.8 0 0 1 10.8 3.2 9 9 0 1 0 20.8 13.2Z" />}
  </svg>;
}

export function ThemeToggle({ labels }: { labels: Copy["theme"] }) {
  const theme = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  // A language switch remounts <html> and drops data-theme; put an explicit choice back before paint.
  useLayoutEffect(() => {
    const stored = getTheme();
    if (stored === "light" || stored === "dark") { setTheme(stored); window.dispatchEvent(new Event(event)); }
  }, []);
  const label = labels[theme];
  return <button className="control theme-control" type="button" aria-label={label} title={label} onClick={() => { setTheme(next[theme]); window.dispatchEvent(new Event(event)); }}>
    <Icon theme={theme} />
  </button>;
}
