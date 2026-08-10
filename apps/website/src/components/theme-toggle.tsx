"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import type { Locale } from "@lumo-ui/core";

type Resolved = "light" | "dark";

/**
 * The label states the ACTION, not the state — «تغییر به پوستهٔ تیره» is an
 * offer, where «تیره» alone would be a claim about the present that the next
 * click immediately falsifies. Until the effective theme is known (it depends
 * on `prefers-color-scheme`, which the server cannot see) the label is the
 * generic action; after mount it swaps to the specific one. The generic label
 * is still a complete Persian sentence, so the SERVED bytes carry a correct
 * accessible name — the gate grades those bytes, not the hydrated tree.
 */
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

/**
 * The theme the visitor is actually SEEING right now, regardless of what is
 * stored: an explicit `data-theme` stamp wins, otherwise the OS preference.
 * Read from the document rather than from React state because `ThemeScript`
 * stamps the attribute before hydration — the DOM is the source of truth here,
 * and mirroring it into state early is how a control lies about what it
 * controls.
 */
function effectiveTheme(): Resolved {
  const stamped = document.documentElement.getAttribute("data-theme");
  if (stamped === "dark" || stamped === "light") return stamped;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * One icon button, sun ⇄ moon — the `ui.shadcn.com` shape.
 *
 * The triple (light/dark/system) said true things and answered a question no
 * visitor was asking. "System" remains the DEFAULT — a visitor who never
 * touches this control keeps following the OS — but it is not a visible
 * option: the first click resolves whatever theme is currently in effect and
 * flips it to an explicit choice, exactly what shadcn's toggle does. The
 * stored value (`lumo-theme` in localStorage) and the `ThemeScript` no-flash
 * contract are unchanged; this component only stopped exhibiting the state
 * machine in the header.
 *
 * BOTH icons are always in the DOM and CSS decides which one paints — the
 * `.lumo-theme-icon-*` rules in globals.css use the same three-state
 * selectors as tokens.css. That is what lets this render a correct icon at
 * FIRST paint with no mount gate and no wrong-icon flash: `ThemeScript` has
 * already stamped the attribute by the time the stylesheet resolves.
 *
 * The click writes the attribute imperatively rather than through an effect,
 * because the snap class and the theme flip must land in the same frame — see
 * the `.lumo-theme-snap` rule in globals.css for why theme changes must not
 * transition. React state exists only to drive the aria-label.
 */
export function ThemeToggle({ lang }: { lang: Locale }) {
  const [resolved, setResolved] = useState<Resolved | null>(null);

  useEffect(() => {
    setResolved(effectiveTheme());
    // While the stored theme is "system", the OS can flip underneath us; keep
    // the label truthful without touching the stored value.
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
    // Suppress every transition for the flip itself — tokens swapping under
    // `transition-colors` surfaces reads as a smeared cross-fade. The class
    // comes off after a double rAF: one frame for the restyle to paint, one to
    // be safely past it. See globals.css.
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

/**
 * Applies the stored theme before first paint.
 *
 * Without this, a visitor who chose dark sees a white flash on every navigation
 * — the stylesheet paints the light palette, then hydration stamps the
 * attribute. Reading localStorage in a blocking inline script is the only way to
 * get ahead of paint, and it is why this string is inlined rather than imported.
 *
 * `nonce` is threaded through because a strict CSP is planned and an inline
 * script without one is the first thing such a policy blocks.
 */
export function ThemeScript({ nonce }: { nonce?: string | undefined }) {
  const script =
    "try{var t=localStorage.getItem('lumo-theme');" +
    "if(t&&t!=='system')document.documentElement.setAttribute('data-theme',t)}catch(e){}";
  return <script nonce={nonce} dangerouslySetInnerHTML={{ __html: script }} />;
}
