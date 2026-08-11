import Link from "next/link";
import { Check, Languages } from "lucide-react";
import type { Locale } from "@lumo-ui/core";
import { cn, LOCALES } from "@lumo-ui/core";
import { IconButton, Menu, MenuItem, MenuPopover, MenuTrigger } from "@lumo-ui/ui";
import { LOCALE_NAMES, site, segmentFor} from "@/lib/locale";
import { allBlocks } from "@/lib/blocks";
import { allCatalog } from "@/lib/catalog";
import { buildSearchIndex } from "@/lib/search-index";
import { DOCS_PAGES } from "@/lib/docs-pages";
import { SiteSearch } from "./site-search";
import { ThemeToggle } from "./theme-toggle";

/**
 * The site chrome.
 *
 * The language control is a menu of real `<a href>`s to the mirrored path —
 * one entry per member of `LOCALES`, so a third locale appears here by being
 * added to the union, not by someone remembering this file. It is never a
 * toggle. That is the whole honesty argument: a toggle would flip CSS while
 * leaving `lang` on the document unchanged, which is the exact defect this
 * library exists to prevent. Crossing locales is a document navigation because
 * the two locales are two documents.
 *
 * The header is sticky with a blurred backdrop — the shape every serious
 * component-library site converged on, because docs are read scrolled and the
 * navigation must not scroll away. `bg-surface/80` + `backdrop-blur` rather
 * than opaque so content sliding beneath reads as depth, in both themes.
 *
 * `searchIndex` is built ONCE, at module scope rather than inside `SiteShell`.
 * `allDemos()`/`allBlocks()` each read source files off disk (see their own
 * headers); computing it inside the component body would re-run both on every
 * one of the ~200 pages this shell wraps, once per page, during the static
 * export. Module scope means Node's own module cache does that work once per
 * build instead — every `<SiteShell>` render in the same process reuses the
 * same array. See `search-index.ts` for why the builder itself takes these
 * two arrays as plain arguments rather than reading the registries itself.
 */
// A promise at module scope (allCatalog is async); resolved once per build
// process, awaited by the (server) shell per render at cached cost.
const searchIndexPromise = allCatalog().then((entries) =>
  buildSearchIndex(
    entries,
    allBlocks(),
    DOCS_PAGES.map((d) => ({ id: d.slug, title: d.label, intro: d.intro })),
  ),
);

/**
 * lucide-react 1.x removed its brand icons, so the GitHub mark is inlined —
 * one path, `fill-currentColor`, decorative. The LINK carries the accessible
 * name (per locale, from `site`); the drawing never does.
 */
function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("fill-current", className)}>
      <path d="M12 .5C5.65.5.5 5.66.5 12.02c0 5.09 3.29 9.4 7.86 10.93.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.27 5.69.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .31.21.67.8.56A11.52 11.52 0 0 0 23.5 12.02C23.5 5.66 18.35.5 12 .5Z" />
    </svg>
  );
}

export async function SiteShell({
  lang,
  children,
  path = "",
  wide = false,
}: {
  lang: Locale;
  children: React.ReactNode;
  path?: string;
  /** Docs pages need the full three-column width; prose pages do not. */
  wide?: boolean;
}) {
  const t = site[lang];
  // The path prop already encodes which area of the site this page lives in;
  // deriving the active link from it keeps the header stateless and honest.
  const section = path.startsWith("docs")
    ? "docs"
    : path.startsWith("components")
      ? "components"
      : path.startsWith("blocks")
        ? "blocks"
        : null;

  // Docs first — reading order, and the review's finding: a docs section that
  // no header link reaches is a docs section that does not exist on a phone.
  const navLinks: Array<{ key: "docs" | "components" | "blocks"; href: string; label: string }> = [
    { key: "docs", href: `/${segmentFor(lang)}/docs/introduction/`, label: t.docs },
    { key: "components", href: `/${segmentFor(lang)}/components/`, label: t.components },
    { key: "blocks", href: `/${segmentFor(lang)}/blocks/`, label: t.blocks },
  ];

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur supports-backdrop-filter:bg-surface/60">
        {/*
         * ── WHY THIS ROW WRAPS BELOW `md` ────────────────────────────────
         *
         * Measured on the built export via CDP, 11 Aug 2026: this element's
         * own `scrollWidth` was 580 (fa) / 594 (en) — a MIN-CONTENT floor,
         * identical at every viewport — against a 375px `clientWidth`. Being
         * the widest box on the page, it set `documentElement.scrollWidth` to
         * 581, so every page on the site scrolled sideways on a phone. Logo +
         * three nav labels + a 160px search pill + three icon buttons + two
         * 24px gaps simply do not fit in one 375px line, and no amount of
         * shrinking makes them: `nowrap` text has no smaller size to go to.
         *
         * So the line breaks instead. `flex-wrap` plus `order-last w-full` on
         * the nav puts the section links on their own row below `md`, where
         * they measure ~240px (fa) and fit at 320. The DOM order is unchanged
         * — logo, nav, actions — so tab order still follows reading order;
         * only the visual line assignment moves. The height therefore cannot
         * be a fixed `h-14` on a phone: `py-2` lets two rows breathe, and
         * `md:h-14` restores the exact single-row header everywhere it fits.
         *
         * `min-w-0` on the two flexible children is the other half: a flex
         * item's `min-width: auto` floors it at min-content and out-ranks any
         * width you give it, which is the mechanism that produced this bug in
         * the first place.
         */}
        <div className="mx-auto flex w-full max-w-screen-2xl flex-wrap items-center gap-x-6 gap-y-1 px-6 py-2 md:h-14 md:flex-nowrap md:py-0">
          <Link
            href={`/${segmentFor(lang)}/`}
            className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight text-fg"
          >
            <span
              aria-hidden="true"
              className="inline-block size-4 rounded-ss-lg bg-accent-mark"
            />
            {t.title}
          </Link>
          <nav className="order-last flex w-full min-w-0 flex-wrap items-center gap-x-5 gap-y-1 text-sm md:order-0 md:w-auto md:flex-nowrap">
            {navLinks.map((l) => (
              <Link
                key={l.key}
                href={l.href}
                aria-current={section === l.key ? "page" : undefined}
                className={cn(
                  "transition-colors hover:text-fg",
                  section === l.key ? "font-medium text-fg" : "text-fg-muted",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          {/*
           * `ms-auto` — logical, so the cluster sits at the END of the line in
           * both directions — and `min-w-0` so this cluster is allowed to be
           * narrower than its contents' min-content rather than pushing the
           * row past the viewport, which is what it did before the search
           * trigger learned to collapse (see site-search.tsx).
           */}
          <div className="ms-auto flex min-w-0 items-center gap-1.5">
            <SiteSearch lang={lang} index={await searchIndexPromise} />
            <div className="flex items-center gap-0.5">
              {/* Icon-only, so the accessible name is required copy — see locale.ts. */}
              <a
                href="https://github.com/Telarsa/lumo-ui"
                target="_blank"
                rel="noreferrer"
                aria-label={t.github}
                className="grid size-8 place-items-center rounded-md text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
              >
                <GitHubMark className="size-4" />
              </a>
              <ThemeToggle lang={lang} />
              {/*
               * The language menu. Each entry is a real <a href> to the SAME
               * `path` in that locale, not a toggle — see the file header;
               * crossing locales is a navigation. The icon trigger scales to
               * any number of locales where a "switch to the other one" link
               * could only ever name two.
               */}
              <MenuTrigger>
                <IconButton
                  label={t.language}
                  variant="ghost"
                  size="sm"
                  className="text-fg-muted data-hovered:text-fg"
                >
                  <Languages aria-hidden="true" className="size-4" />
                </IconButton>
                <MenuPopover className="min-w-36">
                  <Menu>
                    {LOCALES.map((locale) => (
                      <MenuItem
                        key={locale}
                        id={locale}
                        href={`/${locale}/${path}`}
                        hrefLang={locale}
                        textValue={LOCALE_NAMES[locale]}
                        className={locale === lang ? "font-medium" : undefined}
                      >
                        {LOCALE_NAMES[locale]}
                        {/* The current locale, marked. Decorative: the mark's
                            meaning is already carried by the document you are
                            reading being IN this language. */}
                        {locale === lang ? (
                          <Check aria-hidden="true" className="ms-2 inline-block size-4 text-fg-muted" />
                        ) : null}
                      </MenuItem>
                    ))}
                  </Menu>
                </MenuPopover>
              </MenuTrigger>
            </div>
          </div>
        </div>
      </header>

      <main
        className={`mx-auto w-full flex-1 px-6 py-8 ${wide ? "max-w-screen-2xl" : "max-w-6xl"}`}
      >
        {children}
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-6 py-6 text-xs text-fg-muted">
          <span>Telarsa · Lumo UI</span>
          <span className="tabular-nums">{t.footerNote}</span>
        </div>
      </footer>
    </div>
  );
}
