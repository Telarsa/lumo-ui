"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { getSiteTheme, setSiteTheme, type SiteTheme } from "@/lib/site-theme.mjs";
import type { Copy } from "@/content/copy";

const event = "lumo:themechange";

function subscribe(onChange: () => void) {
  window.addEventListener(event, onChange);
  const onStorage = (change: StorageEvent) => {
    if (change.key === "lumo-theme" || change.key === null) {
      setSiteTheme(change.newValue === "dark" ? "dark" : "light");
      onChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => { window.removeEventListener(event, onChange); window.removeEventListener("storage", onStorage); };
}
const snapshot = (): SiteTheme => getSiteTheme();
const serverSnapshot = (): SiteTheme | null => null;

function Icon({ theme }: { theme: SiteTheme }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {theme === "light" && <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>}
    {theme === "dark" && <path d="M20.8 13.2A8.8 8.8 0 0 1 10.8 3.2 9 9 0 1 0 20.8 13.2Z" />}
  </svg>;
}

export function ThemeToggle({ labels }: { labels: Copy["theme"] }) {
  const theme = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  // A language switch remounts <html> and drops data-theme; put an explicit choice back before paint.
  useLayoutEffect(() => {
    let stored: SiteTheme = "light";
    try { if (localStorage.getItem("lumo-theme") === "dark") stored = "dark"; } catch { /* Default to light. */ }
    setSiteTheme(stored); window.dispatchEvent(new Event(event));
  }, []);
  if (theme === null) return <button className="control theme-control" type="button" disabled aria-hidden="true" style={{ visibility: "hidden" }} />;
  const label = labels[theme];
  return <button className="control theme-control" type="button" aria-label={label} title={label} onClick={() => { setSiteTheme(theme === "light" ? "dark" : "light"); window.dispatchEvent(new Event(event)); }}>
    <Icon theme={theme} />
  </button>;
}
