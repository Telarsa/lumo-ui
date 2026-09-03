"use client";

import { useEffect, useState } from "react";
import { MoonIcon, MonitorIcon, SunIcon } from "lucide-react";
import { getTheme, setTheme, type Theme } from "lumo-ui/core";

/**
 * The theme policy is core's: `themeScript` in the layout applied the stored
 * choice before first paint. This control walks light → dark → system and
 * says which one it is on, in the reader's language, through its label.
 */
export function ThemeToggle({
  labels,
}: {
  labels: { label: string; light: string; dark: string; system: string };
}) {
  const [theme, set] = useState<Theme | null>(null);
  useEffect(() => set(getTheme()), []);

  function cycle() {
    const next: Theme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
    set(next);
  }

  const current = theme ?? "system";
  const Icon = current === "light" ? SunIcon : current === "dark" ? MoonIcon : MonitorIcon;

  return (
    <button
      type="button"
      className="control"
      aria-label={`${labels.label}: ${labels[current]}`}
      title={labels[current]}
      onClick={cycle}
      suppressHydrationWarning
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}
