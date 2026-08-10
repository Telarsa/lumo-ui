"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import type { Locale } from "@lumo-ui/core";
import { cn } from "@lumo-ui/core";

type Theme = "light" | "dark" | "system";

const LABELS: Record<Locale, Record<Theme, string>> = {
  "fa-IR": { light: "روشن", dark: "تیره", system: "سیستم" },
  "en-US": { light: "Light", dark: "Dark", system: "System" },
};

const GROUP_LABEL: Record<Locale, string> = {
  "fa-IR": "انتخاب پوستهٔ نمایش",
  "en-US": "Choose display theme",
};

/**
 * Three states, not two.
 *
 * A binary toggle cannot express "follow the operating system", which is the
 * state most visitors are actually in — and a site that silently overrides it is
 * a site that ignores a preference the reader already stated once. So: light,
 * dark, and system, with system the default.
 *
 * The tokens are already written for all three (see tokens.css): the bare
 * `:root` block holds the light palette, `prefers-color-scheme: dark` guarded by
 * `:not([data-theme="light"])` handles the unstamped system case, and
 * `[data-theme="dark"]` lets an explicit choice win in both directions. This
 * component only stamps the attribute.
 *
 * It renders nothing until mounted. The alternative — rendering a guess and
 * correcting it after hydration — flashes the wrong icon at every visitor whose
 * system is dark, and a control that lies for 200ms about the state it controls
 * is worse than one that appears 200ms late.
 */
export function ThemeToggle({ lang }: { lang: Locale }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("lumo-theme") as Theme | null;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
    localStorage.setItem("lumo-theme", theme);
  }, [theme, mounted]);

  const options: Array<{ value: Theme; Icon: typeof Sun }> = [
    { value: "light", Icon: Sun },
    { value: "dark", Icon: Moon },
    { value: "system", Icon: Monitor },
  ];

  return (
    <div
      role="group"
      aria-label={GROUP_LABEL[lang]}
      className="inline-flex items-center gap-0.5 rounded-md border border-border p-0.5"
    >
      {options.map(({ value, Icon }) => (
        <button
          key={value}
          type="button"
          data-lumo=""
          // Every icon-only control carries its name. The icon is not the name.
          aria-label={LABELS[lang][value]}
          aria-pressed={mounted ? theme === value : undefined}
          onClick={() => setTheme(value)}
          className={cn(
            "grid size-7 place-items-center rounded-sm text-fg-muted transition-colors",
            "hover:text-fg",
            mounted && theme === value && "bg-surface-hover text-fg",
          )}
        >
          <Icon aria-hidden="true" className="size-4" />
        </button>
      ))}
    </div>
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
