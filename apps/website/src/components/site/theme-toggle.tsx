"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { getTheme, setTheme, resolvedTheme, type Theme } from "lumo-ui/core";
import { Button } from "@/components/ui/button";

/**
 * The theme policy is core's (`themeScript` in the layout ran before paint);
 * this button only walks light → dark → system. Dogfood, not a dependency:
 * next-themes would work too — §51 does not claim this seam.
 */
export function ThemeToggle({ label }: { label: string }) {
  const [theme, set] = useState<Theme | null>(null);
  useEffect(() => set(getTheme()), []);

  function cycle() {
    const next: Theme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
    set(next);
  }

  return (
    <Button variant="ghost" size="icon-sm" aria-label={label} onClick={cycle} suppressHydrationWarning>
      {theme === null || resolvedTheme() === "light" ? (
        <SunIcon className="size-4" />
      ) : (
        <MoonIcon className="size-4" />
      )}
    </Button>
  );
}
