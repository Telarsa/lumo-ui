/**
 * Theme policy — the half of theming the CSS cannot express.
 *
 * The tokens already carry the mechanism: `:root, [data-theme="light"]` is
 * light, `[data-theme="dark"]` is dark, and a `prefers-color-scheme` block
 * guarded by `:root:not([data-theme="light"])` follows the operating system.
 * That is three states, and the third one is the trap:
 *
 *   **absent `data-theme` does not mean light. It means FOLLOW THE OS.**
 *
 * Every consumer that wanted a light-by-default product has had to discover
 * that on its own, and write the same script, the same storage read and the
 * same set of helpers to express it. At least one got it wrong first — leaving
 * the attribute off for light, which silently let the OS drive every token the
 * consumer had not overridden by hand.
 *
 * So the policy lives here, and BOTH policies are first class:
 *
 *   - `defaultTheme: "system"` — the usual default. A first-time visitor gets
 *     their OS setting, and the attribute is REMOVED whenever the choice is
 *     `system`, so the media query is free to decide.
 *   - `defaultTheme: "light"` (or `"dark"`) — the product owns its theme. The
 *     attribute is ALWAYS written, so the OS never reaches any token, including
 *     ones added to Lumo later.
 *
 * Neither is more correct. A product whose dark palette has had the same design
 * attention as its light one should follow the OS; one whose has not should
 * not ship a theme nobody reviewed to a reader who never asked for it.
 */

/** What a reader can choose. `system` defers to `prefers-color-scheme`. */
export type Theme = "light" | "dark" | "system";

/** What the document ends up showing. `system` has been resolved away. */
export type ResolvedTheme = "light" | "dark";

export interface ThemeOptions {
  /** Where the choice is remembered. Default `"lumo-theme"`. */
  storageKey?: string;
  /** What a first-time reader gets. Default `"system"`. */
  defaultTheme?: Theme;
}

const KEY = "lumo-theme";
const ATTR = "data-theme";

function opts(o?: ThemeOptions) {
  return { key: o?.storageKey ?? KEY, fallback: o?.defaultTheme ?? "system" } as const;
}

/**
 * The source of a blocking script, to run BEFORE first paint.
 *
 * It has to be source text rather than a function you import: by the time a
 * framework hydrates, the page has painted, and a reader who chose dark sees a
 * flash of light first. Put the result in a `<script>` in the document head, or
 * as the first child of `<body>`.
 *
 * Wrapped in try/catch because `localStorage` THROWS in some privacy modes
 * rather than returning null — a theme script that can break the page is worse
 * than one that occasionally forgets.
 */
export function themeScript(options?: ThemeOptions): string {
  const { key, fallback } = opts(options);
  const k = JSON.stringify(key);
  const f = JSON.stringify(fallback);
  const a = JSON.stringify(ATTR);
  // `system` removes the attribute so the media query decides; anything else
  // is written explicitly so the OS cannot reach a single token.
  return (
    `try{var t=localStorage.getItem(${k})||${f};` +
    `var e=document.documentElement;` +
    `if(t==="light"||t==="dark"){e.setAttribute(${a},t)}else{e.removeAttribute(${a})}` +
    `}catch(e){}`
  );
}

/** The reader's setting, which may be `system`. Safe on the server. */
export function getTheme(options?: ThemeOptions): Theme {
  const { key, fallback } = opts(options);
  if (typeof localStorage === "undefined") return fallback;
  try {
    const t = localStorage.getItem(key);
    return t === "light" || t === "dark" || t === "system" ? t : fallback;
  } catch {
    return fallback;
  }
}

/**
 * What the document is showing right now, read from the DOM rather than
 * re-derived from storage — after `themeScript` has run these cannot disagree,
 * and the DOM is the one that is actually painted.
 */
export function resolvedTheme(): ResolvedTheme {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.getAttribute(ATTR);
  if (attr === "dark" || attr === "light") return attr;
  if (typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

/** Apply a choice and remember it. */
export function setTheme(theme: Theme, options?: ThemeOptions): void {
  const { key } = opts(options);
  const el = document.documentElement;
  if (theme === "system") el.removeAttribute(ATTR);
  else el.setAttribute(ATTR, theme);
  try {
    localStorage.setItem(key, theme);
  } catch {
    /* private mode — the choice holds for this page, just not the next one */
  }
}
