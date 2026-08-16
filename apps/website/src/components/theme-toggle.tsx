"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import type { BuiltinLocale as Locale } from "@lumo-ui/core";

type Resolved = "light" | "dark";

/** The label states the ACTION, not the state. Before the effective theme is
 *  known it is the generic action — a complete sentence, so served bytes are named. */
const LABELS: Record<Locale, { generic: string; toDark: string; toLight: string }> = {
  "fa-IR": {
    generic: "تغییر پوسته",
    toDark: "تغییر به پوستهٔ تیره",
    toLight: "تغییر به پوستهٔ روشن",
  },
  "en-US": {
    generic: "Toggle theme",
    toDark: "Switch to dark theme",
    toLight: "Switch to light theme",
  },
};

/** The theme the visitor is actually SEEING: explicit `data-theme` stamp wins,
 *  otherwise the OS. Read from the DOM: `ThemeScript` stamps it before hydration. */
function effectiveTheme(): Resolved {
  const stamped = document.documentElement.getAttribute("data-theme");
  if (stamped === "dark" || stamped === "light") return stamped;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * One icon button, sun ⇄ moon. "System" stays the DEFAULT but is not a visible
 * option: the first click resolves the effective theme and flips it. BOTH icons
 * are always in the DOM and CSS (`.lumo-theme-icon-*`) picks one, so first paint
 * is right with no mount gate. The click writes the attribute imperatively so
 * the snap class and the flip land in one frame; state only drives the label.
 */
export function ThemeToggle({ lang }: { lang: Locale }) {
  const [resolved, setResolved] = useState<Resolved | null>(null);

  useEffect(() => {
    setResolved(effectiveTheme());
    // While the theme is "system", the OS can flip underneath us; keep the label truthful.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolved(effectiveTheme());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const labels = LABELS[lang];
  const label =
    resolved === null ? labels.generic : resolved === "dark" ? labels.toLight : labels.toDark;

  function toggle() {
    const root = document.documentElement;
    const next: Resolved = effectiveTheme() === "dark" ? "light" : "dark";
    // Suppress every transition for the flip itself; the class comes off after
    // a double rAF. See `.lumo-theme-snap` in globals.css.
    root.classList.add("lumo-theme-snap");
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("lumo-theme", next);
    } catch {
      /* storage may be denied; the page-local flip above still happened */
    }
    setResolved(next);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.remove("lumo-theme-snap"));
    });
  }

  return (
    <button
      type="button"
      data-lumo=""
      // Every icon-only control carries its name. The icon is not the name.
      aria-label={label}
      onClick={toggle}
      className="grid size-8 place-items-center rounded-md text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
    >
      <Sun aria-hidden="true" className="lumo-theme-icon-sun size-4" />
      <Moon aria-hidden="true" className="lumo-theme-icon-moon size-4" />
    </button>
  );
}

/** Applies the stored theme before first paint — a blocking inline script is the
 *  only way ahead of paint. `nonce` is threaded through for the planned strict CSP. */
export function ThemeScript({ nonce }: { nonce?: string | undefined }) {
  const script =
    "try{var t=localStorage.getItem('lumo-theme');" +
    "if(t&&t!=='system')document.documentElement.setAttribute('data-theme',t)}catch(e){}";
  return <script nonce={nonce} dangerouslySetInnerHTML={{ __html: script }} />;
}
