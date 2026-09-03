"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { getTheme, resolvedTheme, setTheme, type ResolvedTheme } from "lumo-ui/core";

const CHANGE = "lumo:themechange";

/**
 * Two states, light and dark. A first-time reader gets the operating system's
 * choice through `themeScript` in the layout; the first press makes it
 * explicit and it stays that way — there is no third "system" stop in the
 * cycle, because a reader who has pressed the button has already said what
 * they want.
 *
 * The theme lives on the DOM (`<html data-theme>`), so this subscribes to it
 * rather than mirroring it into state: no second render to correct a guess.
 */
function subscribe(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  window.addEventListener(CHANGE, onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener(CHANGE, onChange);
  };
}

const getServerSnapshot = (): ResolvedTheme => "light";

export function ThemeToggle({ labels }: { labels: { label: string; light: string; dark: string } }) {
  const theme = useSyncExternalStore(subscribe, resolvedTheme, getServerSnapshot);

  /*
   * Switching language remounts the root layout, and React re-acquires the
   * <html> singleton by removing every attribute it does not own — including
   * the `data-theme` the boot script set. Without this the theme silently fell
   * back to the system setting on every language change. The toggle remounts
   * with the layout, so it puts the stored choice back before the frame paints.
   */
  useLayoutEffect(() => {
    const stored = getTheme();
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      window.dispatchEvent(new Event(CHANGE));
    }
  }, []);

  function toggle() {
    setTheme(theme === "dark" ? "light" : "dark");
    window.dispatchEvent(new Event(CHANGE));
  }

  const next = theme === "dark" ? labels.light : labels.dark;
  const Icon = theme === "dark" ? MoonIcon : SunIcon;

  return (
    <button type="button" className="control" aria-label={`${labels.label}: ${next}`} title={next} onClick={toggle} suppressHydrationWarning>
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}
