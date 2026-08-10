import Link from "next/link";
import type { Locale } from "@lumo-ui/core";
import { site } from "@/lib/locale";
import { allBlocks } from "@/lib/blocks";
import { allDemos } from "@/lib/demos";
import { buildSearchIndex } from "@/lib/search-index";
import { SiteSearch } from "./site-search";
import { ThemeToggle } from "./theme-toggle";

/**
 * The site chrome.
 *
 * The language control is an `<a href>` to the mirrored path, not a toggle.
 * That is the whole honesty argument: a toggle would flip CSS while leaving
 * `lang` on the document unchanged, which is the exact defect this library
 * exists to prevent. Crossing locales is a document navigation because the two
 * locales are two documents.
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
const searchIndex = buildSearchIndex(allDemos(), allBlocks());

export function SiteShell({
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
  const other: Locale = lang === "fa-IR" ? "en-US" : "fa-IR";

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur supports-backdrop-filter:bg-surface/60">
        <div className="mx-auto flex h-14 w-full max-w-screen-2xl items-center gap-6 px-6">
          <Link
            href={`/${lang}/`}
            className="flex items-center gap-2 text-sm font-semibold tracking-tight text-fg"
          >
            <span
              aria-hidden="true"
              className="inline-block size-4 rounded-ss-lg bg-accent-mark"
            />
            {t.title}
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium text-fg-muted">
            <Link href={`/${lang}/components/`} className="transition-colors hover:text-fg">
              {t.components}
            </Link>
            <Link href={`/${lang}/blocks/`} className="transition-colors hover:text-fg">
              {t.blocks}
            </Link>
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <SiteSearch lang={lang} index={searchIndex} />
            <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
            <ThemeToggle lang={lang} />
            {/* A real link, not a toggle — see the file header. */}
            <Link
              href={`/${other}/${path}`}
              hrefLang={other}
              aria-label={t.switchLabel}
              className="inline-flex h-8 items-center rounded-md px-2.5 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
            >
              {t.switchTo}
            </Link>
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
