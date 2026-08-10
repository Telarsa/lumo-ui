import Link from "next/link";
import type { Locale } from "@lumo-ui/core";
import { cn } from "@lumo-ui/core";
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
  // The path prop already encodes which area of the site this page lives in;
  // deriving the active link from it keeps the header stateless and honest.
  const section = path.startsWith("components") ? "components" : path.startsWith("blocks") ? "blocks" : null;

  const navLinks: Array<{ key: "components" | "blocks"; href: string; label: string }> = [
    { key: "components", href: `/${lang}/components/`, label: t.components },
    { key: "blocks", href: `/${lang}/blocks/`, label: t.blocks },
  ];

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
          <nav className="flex items-center gap-5 text-sm">
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
          <div className="ms-auto flex items-center gap-1.5">
            <SiteSearch lang={lang} index={searchIndex} />
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
              {/* A real link, not a toggle — see the file header. */}
              <Link
                href={`/${other}/${path}`}
                hrefLang={other}
                aria-label={t.switchLabel}
                className="inline-flex h-8 items-center rounded-md px-2 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
              >
                {t.switchTo}
              </Link>
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
