"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { getTheme, setTheme, type Theme } from "lumo-ui/core";
import { Button } from "@/components/ui/button";

const CHANGE = "lumo:themechange";

/**
 * Three stops, cycled by one button: system -> light -> dark -> system.
 *
 * A first-time reader follows the operating system: `themeScript` in the layout
 * leaves `<html data-theme>` off, and the tokens' `prefers-color-scheme` block
 * then tracks the OS live, with no JavaScript involved. Pressing the button
 * makes an explicit choice that wins and persists (`lumo-theme` in
 * localStorage); the third press hands the decision back to the system, so a
 * reader is never locked out of following their OS once they have touched it.
 *
 * The control shows the reader's SETTING (system, light or dark), not the
 * resolved colour, and its accessible name says both the current setting and
 * what a press will do. The setting lives in storage, so this subscribes to it
 * (same-tab changes through a custom event, other tabs through `storage`)
 * rather than mirroring it into state.
 */
const NEXT: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };
const ICON = { system: MonitorIcon, light: SunIcon, dark: MoonIcon } as const;

export type ThemeToggleLabels = Record<Theme, string>;

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const getSnapshot = (): Theme => getTheme();
const getServerSnapshot = (): Theme => "system";

export function ThemeToggle({ labels }: { labels: ThemeToggleLabels }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  /*
   * Switching language remounts the root layout, and React re-acquires the
   * <html> singleton by removing every attribute it does not own — including
   * the `data-theme` the boot script set. Without this an explicit choice
   * silently fell back to the system setting on every language change. The
   * toggle remounts with the layout, so it puts the stored choice back before
   * the frame paints. `system` needs nothing: the attribute is already absent.
   */
  useLayoutEffect(() => {
    const stored = getTheme();
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      window.dispatchEvent(new Event(CHANGE));
    }
  }, []);

  function cycle() {
    setTheme(NEXT[theme]);
    window.dispatchEvent(new Event(CHANGE));
  }

  const label = labels[theme];
  const Icon = ICON[theme];

  return (
    <Button
      variant="ghost"
      size="icon"
      className="control"
      aria-label={label}
      title={label}
      onClick={cycle}
      suppressHydrationWarning
    >
      <Icon className="size-4" aria-hidden="true" />
    </Button>
  );
}
