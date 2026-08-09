import Link from "next/link";
import type { Locale } from "@lumo-ui/core";
import { site } from "@/lib/locale";

/**
 * The site chrome.
 *
 * The language control is an `<a href>` to the mirrored path, not a toggle.
 * That is the whole honesty argument: a toggle would flip CSS while leaving
 * `lang` on the document unchanged, which is the exact defect this library
 * exists to prevent. Crossing locales is a document navigation because the two
 * locales are two documents.
 */
export function SiteShell({
  lang,
  children,
  path = "",
}: {
  lang: Locale;
  children: React.ReactNode;
  path?: string;
}) {
  const t = site[lang];
  const other: Locale = lang === "fa-IR" ? "en-US" : "fa-IR";

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-6 py-4">
          <Link href={`/${lang}/`} className="flex items-center gap-2 font-semibold text-fg">
            <span
              aria-hidden="true"
              className="inline-block size-4 rounded-ss-lg bg-accent-mark"
            />
            {t.title}
          </Link>
          <nav className="flex items-center gap-4 text-sm text-fg-muted">
            <Link href={`/${lang}/components/`} className="hover:text-fg">
              {t.components}
            </Link>
            <Link href={`/${lang}/blocks/`} className="hover:text-fg">
              {t.blocks}
            </Link>
          </nav>
          <div className="ms-auto flex items-center gap-3 text-sm">
            {/* A real link, not a toggle — see the file header. */}
            <Link
              href={`/${other}/${path}`}
              hrefLang={other}
              aria-label={t.switchLabel}
              className="rounded-md border border-border px-3 py-1.5 text-fg-muted hover:text-fg"
            >
              {t.switchTo}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>

      <footer className="border-t border-border px-6 py-8 text-sm text-fg-muted">
        <div className="mx-auto max-w-6xl">Telarsa · Lumo UI</div>
      </footer>
    </div>
  );
}
