import { segmentFor } from "@/lib/locale";
import type { BuiltinLocale as Locale, LumoNode } from "@lumo-ui/core";
import { SiteShell } from "@/components/site-shell";
import { DocsSidebar } from "@/components/docs-sidebar";
import { DOCS_PAGES } from "@/lib/docs-pages";
import Link from "next/link";
import { cn } from "@lumo-ui/core";
import { OnThisPage } from "@/components/on-this-page";
import { CodePanel } from "@/components/code-panel";

/**
 * The shared scaffold for the prose docs pages. Not a `layout.tsx` on purpose: the
 * on-this-page rail takes each page's OWN section list, and a layout cannot receive
 * per-page props. Every page built on it defines its copy as a
 * `satisfies Record<Locale, …>` table, so a missing Persian paragraph is a compile error.
 */
export interface DocSectionDef {
  id: string;
  label: string;
}

/**
 * The scaffold's own chrome copy, keyed by locale — a full `Record<Locale, …>` map, not a
 * binary conditional on `lang` (see CONTRIBUTING's "Adding a locale").
 */
const COPY = {
  "fa-IR": {
    pagesNav: "صفحه‌های مستندات",
    pagerNav: "پیمایش مستندات",
    previous: "قبلی",
    next: "بعدی",
    copyCode: "کپی کد",
    codeCopied: "کد کپی شد",
  },
  "en-US": {
    pagesNav: "Documentation pages",
    pagerNav: "Docs pagination",
    previous: "Previous",
    next: "Next",
    copyCode: "Copy code",
    codeCopied: "Code copied",
  },
} as const satisfies Record<
  Locale,
  {
    pagesNav: string;
    pagerNav: string;
    previous: string;
    next: string;
    /** `CodeBlock`'s two required announced names, supplied once for every page. */
    copyCode: string;
    codeCopied: string;
  }
>;

export function DocsShell({
  lang,
  slug,
  title,
  intro,
  sections,
  children,
}: {
  lang: Locale;
  /** The route segment under /docs/ — also what marks the sidebar entry active. */
  slug: string;
  title: string;
  intro: string;
  sections: ReadonlyArray<DocSectionDef>;
  children?: LumoNode;
}) {
  const index = DOCS_PAGES.findIndex((d) => d.slug === slug);
  const prev = index > 0 ? DOCS_PAGES[index - 1] : undefined;
  const next = index >= 0 && index < DOCS_PAGES.length - 1 ? DOCS_PAGES[index + 1] : undefined;
  const t = COPY[lang];

  return (
    <SiteShell lang={lang} path={`docs/${slug}/`} wide>
      {/*
       * The narrow-viewport path: the sidebar is `hidden lg:block`, so this strip is the mobile
       * navigation — a horizontal scroll of the SAME canonical list, hidden where the sidebar appears.
       */}
      <nav
        aria-label={t.pagesNav}
        className="-mx-6 mb-6 overflow-x-auto border-be border-border px-6 pbe-3 lg:hidden"
      >
        <ul className="flex w-max items-center gap-1 text-sm">
          {DOCS_PAGES.map((d) => (
            <li key={d.slug}>
              <Link
                href={`/${segmentFor(lang)}/docs/${d.slug}/`}
                aria-current={d.slug === slug ? "page" : undefined}
                className={cn(
                  "block whitespace-nowrap rounded-md px-2.5 py-1 transition-colors",
                  d.slug === slug
                    ? "bg-surface-hover font-medium text-fg"
                    : "text-fg-muted hover:text-fg",
                )}
              >
                {d.label[lang]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* The docs grid — the same three columns the component pages use. */}
      <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)_14rem]">
        <aside className="hidden lg:block">
          <div data-docs-sidebar-scroll="" className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto pe-2">
            <DocsSidebar lang={lang} active={`docs:${slug}`} />
          </div>
        </aside>

        <article className="min-w-0">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight text-fg">{title}</h1>
            <p className="mt-2 max-w-2xl text-fg-muted">{intro}</p>
          </header>
          <div className="mt-10 flex flex-col gap-12">{children}</div>
          {/*
           * Foot-of-article pager over the same canonical list, so each page hands you the next.
           * `‹`/`›` are Bidi_Mirrored (see pagination.tsx): under RTL they redraw as each other.
           */}
          {(prev || next) && (
            <nav
              aria-label={t.pagerNav}
              className="mt-12 flex items-stretch justify-between gap-3 border-bs border-border pbs-6"
            >
              {prev ? (
                <Link
                  href={`/${segmentFor(lang)}/docs/${prev.slug}/`}
                  className="group flex max-w-[45%] flex-col gap-0.5 rounded-md border border-border px-4 py-3 transition-colors hover:bg-surface-hover"
                >
                  <span className="text-xs text-fg-subtle">
                    <span aria-hidden="true">‹ </span>
                    {t.previous}
                  </span>
                  <span className="truncate text-sm font-medium text-fg">{prev.label[lang]}</span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link
                  href={`/${segmentFor(lang)}/docs/${next.slug}/`}
                  className="group flex max-w-[45%] flex-col gap-0.5 rounded-md border border-border px-4 py-3 text-end transition-colors hover:bg-surface-hover"
                >
                  <span className="text-xs text-fg-subtle">
                    {t.next}
                    <span aria-hidden="true"> ›</span>
                  </span>
                  <span className="truncate text-sm font-medium text-fg">{next.label[lang]}</span>
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </article>

        <OnThisPage lang={lang} items={sections} />
      </div>
    </SiteShell>
  );
}

/** One rail-addressable section. `id` must appear in the page's section list. */
export function DocSection({
  id,
  title,
  dualCalendar,
  children,
}: {
  id: string;
  title: string;
  /**
   * Marks the heading as deliberately carrying a GREGORIAN date beside the native one, so
   * `lumo-gate`'s `native-calendar` rule allows it — a narrow, marked exemption on the markup
   * (same shape as `data-lumo-latn`), not a config allow-list.
   */
  dualCalendar?: boolean | undefined;
  children?: LumoNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2
        className="text-xl font-semibold text-fg"
        {...(dualCalendar ? { "data-lumo-gregory": "" } : {})}
      >
        {title}
      </h2>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}

/** A prose paragraph, sized between the compact chrome and a reading line. */
export function P({ children }: { children?: LumoNode }) {
  return <p className="max-w-2xl text-[0.9375rem]/7 text-fg-muted">{children}</p>;
}

/**
 * An inline identifier — `LumoNode`, `pnpm verify`, a file path. Marked as a genuinely-Latin
 * island (`data-lumo-latn`) so the gate's digit and aria rules skip it, and `dir="ltr"` so a
 * path does not render mirrored mid-sentence on a Persian page.
 */
export function Term({ children }: { children?: LumoNode }) {
  return (
    <code
      dir="ltr"
      lang="en"
      data-lumo-latn=""
      className="rounded-sm bg-surface-sunken px-1.5 py-0.5 font-mono text-[0.8125em] text-fg"
    >
      {children}
    </code>
  );
}

/**
 * A code listing with the standard copy affordance; `CodePanel`'s labels are supplied here
 * once per locale. `code` stays a prop because the CSS snippets ship no `html` (no CSS
 * grammar in `lib/highlight.ts`) and the fallback renders it on the SERVER as a text child.
 */
export function Snippet({
  lang,
  code,
  html,
}: {
  lang: Locale;
  code: string;
  html?: string | undefined;
}) {
  const t = COPY[lang];
  return (
    <div className="max-w-2xl">
      <CodePanel
        code={code}
        html={html}
        label={t.copyCode}
        copiedLabel={t.codeCopied}
      />
    </div>
  );
}

/**
 * A bulleted list for prose pages. Items are LumoNode so a page can mix text with `Term`
 * islands; the marker colour comes from the muted token so bullets read as structure.
 */
export function Bullets({ items }: { items: ReadonlyArray<{ key: string; body: LumoNode }> }) {
  return (
    <ul className="max-w-2xl list-disc space-y-2 ps-5 text-[0.9375rem]/7 text-fg-muted marker:text-fg-subtle">
      {items.map((i) => (
        <li key={i.key}>{i.body}</li>
      ))}
    </ul>
  );
}
