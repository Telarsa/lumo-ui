import { readFileSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LOCALES, type Locale } from "@lumo-ui/core";
import { Tab, TabList, TabPanel, Tabs } from "@lumo-ui/ui";
import { SiteShell } from "@/components/site-shell";
import { DocsSidebar } from "@/components/docs-sidebar";
import { OnThisPage } from "@/components/on-this-page";
import { DemoFrame, DirectionCompare } from "@/components/demo-frame";
import { CodeBlock, CopyButton } from "@/components/code-block";
import { InstallTabs, type InstallFile } from "@/components/install-tabs";
import { CLI_COMMAND, PMS, depsCommand, type PM } from "@/lib/install-commands";
import { highlight } from "@/lib/highlight";
import { PreviewToolbar } from "@/components/preview-toolbar";
import { EvidencePanel } from "@/components/evidence-panel";
import { assertLocale, site } from "@/lib/locale";
import { allDemos, demoById } from "@/lib/demos";

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => allDemos().map((d) => ({ lang, slug: d.id })));
}

/**
 * Section headings, in both locales, so the rail and the page cannot disagree.
 *
 * There is no "source" entry: the source moved into the Preview | Code tab
 * pair inside `#preview`, so a rail link to a `#source` fragment would point
 * at nothing — exactly the drift this function exists to prevent.
 */
function sections(lang: Locale) {
  return [
    { id: "preview", label: lang === "fa-IR" ? "پیش‌نمایش" : "Preview" },
    {
      id: "evidence",
      label: lang === "fa-IR" ? "شواهد دسترس‌پذیری" : "Accessibility evidence",
    },
    { id: "installation", label: lang === "fa-IR" ? "نصب" : "Installation" },
    { id: "directions", label: lang === "fa-IR" ? "هر دو جهت" : "Both directions" },
  ];
}

/**
 * The header's previous/next pager, over `allDemos()`'s alphabetical order.
 *
 * The glyphs are `‹`/`›` — a Unicode `Bidi_Mirrored` pair, the exact pattern
 * `packages/ui/src/pagination.tsx`'s header documents: under `dir="rtl"` the
 * text engine redraws each as the other AND the flex row reverses, so both the
 * arrowhead and the position flip from normal flow alone. "Previous" is always
 * toward the reading start. The glyphs are `aria-hidden`; the per-locale
 * `aria-label` (which carries the neighbour's own title) is the name.
 *
 * At either end the missing control is simply not rendered.
 */
function Pager({
  prev,
  next,
  navLabel,
  prevLabel,
  nextLabel,
}: {
  prev: { href: string; title: string } | undefined;
  next: { href: string; title: string } | undefined;
  /** Announced name of the `<nav>` landmark. Required, per-locale. */
  navLabel: string;
  prevLabel: (title: string) => string;
  nextLabel: (title: string) => string;
}) {
  if (!prev && !next) return null;
  const itemClass =
    "inline-flex size-8 items-center justify-center rounded-md border border-border " +
    "text-sm text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg";
  return (
    <nav aria-label={navLabel} className="flex items-center gap-1">
      {prev && (
        <Link href={prev.href} aria-label={prevLabel(prev.title)} className={itemClass}>
          <span aria-hidden="true">‹</span>
        </Link>
      )}
      {next && (
        <Link href={next.href} aria-label={nextLabel(next.title)} className={itemClass}>
          <span aria-hidden="true">›</span>
        </Link>
      )}
    </nav>
  );
}

/*
 * ── registry.json, READ AT BUILD TIME, NEVER HARDCODED ──────────────────────
 *
 * The Installation section (Command/Manual tabs, dependencies, the source to
 * copy) is entirely derived from the manifest `scripts/build-registry.mjs`
 * generates from the components that actually exist — the same manifest
 * `pnpm run gate:registry` checks is still exactly reproducible from source.
 * Reading it here rather than re-deriving it a second way keeps this page and
 * the registry unable to disagree.
 */
const REPO_ROOT = join(process.cwd(), "..", "..");

interface RegistryFile {
  path: string;
  type: string;
  target: string;
}
interface RegistryItem {
  name: string;
  type: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: RegistryFile[];
}
interface RegistryData {
  items: RegistryItem[];
}

let cachedRegistry: RegistryData | undefined;
function loadRegistry(): RegistryData {
  cachedRegistry ??= JSON.parse(
    readFileSync(join(REPO_ROOT, "registry.json"), "utf8"),
  ) as RegistryData;
  return cachedRegistry;
}

/** The item's own file — as opposed to a companion `*.variants.ts` it also ships. */
function mainFileOf(item: RegistryItem): RegistryFile | undefined {
  return item.files.find((f) => f.path.endsWith(`/${item.name}.tsx`));
}

/**
 * Matches a component page's slug to the registry item that actually installs
 * it. Most match by NAME. `icon-button` does not: `IconButton` ships from
 * `button.tsx` alongside `Button`, and `scripts/build-registry.mjs` derives
 * one registry item per FILE, not per exported component, so it is registered
 * once, as "button".
 *
 * Rather than hardcoding that one exception, this falls back to a byte
 * comparison against the demo's own displayed source — which `demos.tsx`
 * also reads straight from `packages/ui/src` — so a future split is picked up
 * automatically instead of silently pointing an install command at the wrong
 * package.
 */
function resolveRegistryItem(
  registry: RegistryData,
  slug: string,
  source: string,
): RegistryItem | undefined {
  const uiItems = registry.items.filter((i) => i.type === "registry:ui");
  /*
   * Byte-comparison FIRST, name second. The name-first order shipped a real
   * wrong install: the "skeleton" demo page shows skeleton-presets.tsx, but
   * name-matching short-circuited to the bare `skeleton` item, so the page
   * told the reader to install the one file its own demo was not showing.
   * What the page DISPLAYS is the ground truth of what it should install —
   * the name is only the fallback for pages whose displayed source is not a
   * registry main file at all.
   */
  const byContent = uiItems.find((i) => {
    const main = mainFileOf(i);
    if (!main) return false;
    try {
      return readFileSync(join(REPO_ROOT, main.path), "utf8") === source;
    } catch {
      return false;
    }
  });
  return byContent ?? uiItems.find((i) => i.name === slug);
}

export default async function ComponentPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: raw, slug } = await params;
  const lang = assertLocale(raw);
  const demo = demoById(slug);
  if (!demo) notFound();

  const t = site[lang];

  const registry = loadRegistry();
  const item = resolveRegistryItem(registry, slug, demo.source);
  if (!item) {
    // Every shipped demo has a real registry entry — an ungraded install
    // command is the same class of problem as an ungraded page (see
    // README.md's "An ungraded page is an unprotected page"), so this refuses
    // to render a page that cannot show a real one rather than falling back
    // to a guess.
    throw new Error(
      `No registry.json item resolves for component page "${slug}". Every demo ` +
        `must correspond to a real registry entry.`,
    );
  }
  const uiNames = new Set(
    registry.items.filter((i) => i.type === "registry:ui").map((i) => i.name),
  );
  const registryComponents = (item.registryDependencies ?? []).filter(
    (d) => d !== item.name && uiNames.has(d),
  );
  /*
   * Every code surface on the page is highlighted HERE, in the server pass,
   * because both consumers of the output are "use client" modules that must
   * not import the tokenizer. Sequential awaits, deliberately: the highlighter
   * is one shared instance and the export builds ~100 of these pages — a
   * Promise.all per page just interleaves the same single-threaded work.
   */
  const installFiles: InstallFile[] = [];
  for (const f of item.files) {
    const code = readFileSync(join(REPO_ROOT, f.path), "utf8");
    installFiles.push({ target: f.target, code, html: await highlight(code, "tsx") });
  }
  const commandHtml: Partial<Record<PM, string>> = {};
  for (const pm of PMS) {
    commandHtml[pm] = await highlight(CLI_COMMAND[pm](item.name), "bash");
  }
  const deps = item.dependencies ?? [];
  const depsHtml = deps.length > 0 ? await highlight(depsCommand(deps), "bash") : undefined;
  const sourceHtml = await highlight(demo.source, "tsx");

  /*
   * The header toolbar's data. The pager walks `allDemos()` — the SAME
   * alphabetical order the sidebar shows — and "Copy page" carries the install
   * command plus the component's source, the two things a reader would
   * otherwise copy one at a time.
   */
  const demos = allDemos();
  const index = demos.findIndex((d) => d.id === slug);
  const prevDemo = index > 0 ? demos[index - 1] : undefined;
  const nextDemo = index >= 0 && index < demos.length - 1 ? demos[index + 1] : undefined;
  const copyPageText = `${CLI_COMMAND.pnpm(item.name)}\n\n${demo.source}`;

  return (
    <SiteShell lang={lang} path={`components/${slug}/`} wide>
      {/*
        Three columns: nav, content, rail. Grid rather than flex so the centre
        column can be `minmax(0, 1fr)` — without that a wide code block pushes
        the whole layout sideways instead of scrolling inside its own container.
      */}
      <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)_14rem]">
        <aside className="hidden lg:block">
          <div data-docs-sidebar-scroll="" className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto pe-2">
            <DocsSidebar lang={lang} active={slug} />
          </div>
        </aside>

        <article className="min-w-0">
          <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-semibold tracking-tight text-fg">
                {demo.title[lang]}
              </h1>
              <p className="mt-2 max-w-2xl text-fg-muted">{demo.intro[lang]}</p>
            </div>
            {/* The toolbar row, on the end side: copy the page, then the pager. */}
            <div className="ms-auto flex shrink-0 items-center gap-2">
              <CopyButton
                text={copyPageText}
                label={lang === "fa-IR" ? "کپی صفحه" : "Copy page"}
                copiedLabel={lang === "fa-IR" ? "کپی شد" : "Copied"}
              />
              <Pager
                prev={
                  prevDemo && {
                    href: `/${lang}/components/${prevDemo.id}/`,
                    title: prevDemo.title[lang],
                  }
                }
                next={
                  nextDemo && {
                    href: `/${lang}/components/${nextDemo.id}/`,
                    title: nextDemo.title[lang],
                  }
                }
                navLabel={lang === "fa-IR" ? "کامپوننت قبلی و بعدی" : "Previous and next component"}
                prevLabel={(title) =>
                  lang === "fa-IR" ? `کامپوننت قبلی: ${title}` : `Previous component: ${title}`
                }
                nextLabel={(title) =>
                  lang === "fa-IR" ? `کامپوننت بعدی: ${title}` : `Next component: ${title}`
                }
              />
            </div>
          </header>

          <section id="preview" className="mt-8 scroll-mt-24">
            {/*
             * Preview | Code, the shadcn anatomy: the live demo and its
             * highlighted source are the same exhibit seen two ways, so they
             * share one tab pair rather than sitting a page apart. The preview
             * tab is FIRST — it is the default selection, so the prerendered
             * HTML contains the demo markup, which `[data-lumo-demo-root]`
             * (inside PreviewToolbar) and the post-build evidence injector
             * depend on being in the served bytes.
             */}
            <Tabs>
              <TabList label={lang === "fa-IR" ? "پیش‌نمایش یا کد" : "Preview or code"}>
                <Tab id="preview">{t.preview}</Tab>
                <Tab id="code">{t.code}</Tab>
              </TabList>
              <TabPanel id="preview" className="mt-4">
                <PreviewToolbar lang={lang} slug={slug}>
                  {/*
                   * The stage centres its cell vertically, but the cell itself
                   * is `w-full max-w-2xl` — so an intrinsic-width exhibit (a
                   * lone switch, a button pair) used to hug the start edge of
                   * an otherwise empty stage, which is what the design review
                   * screenshotted. `items-center` on a column flex centres an
                   * intrinsic exhibit on the inline axis while a `w-full` demo
                   * still spans the cell — centring without re-introducing a
                   * width constraint the demo did not ask for.
                   */}
                  <div className="flex w-full flex-col items-center">{demo.render(lang)}</div>
                </PreviewToolbar>
              </TabPanel>
              {/*
               * `shouldForceMount`: without it React Aria mounts ONLY the
               * selected panel, and the review of the built bytes caught the
               * consequence — the component source vanished from the served
               * HTML entirely, on a site whose first claim is "in the served
               * bytes, before any JavaScript runs". Force-mounted, the panel
               * is in the DOM (inert while unselected) and a no-JS reader
               * still gets the source, exactly as the old #source section
               * served it.
               */}
              <TabPanel id="code" shouldForceMount className="mt-4 data-inert:hidden">
                <CodeBlock
                  code={demo.source}
                  html={sourceHtml}
                  label={lang === "fa-IR" ? "کپی کد کامپوننت" : "Copy the component's source"}
                  copiedLabel={lang === "fa-IR" ? "کد کامپوننت کپی شد" : "Component source copied"}
                />
              </TabPanel>
            </Tabs>
          </section>

          <section id="evidence" className="mt-10 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
              {lang === "fa-IR" ? "شواهد دسترس‌پذیری" : "Accessibility evidence"}
            </h2>
            <div className="mt-3">
              {/*
                Renders an empty placeholder — the real table is injected by
                `apps/website/scripts/inject-evidence.mjs` after `next build`,
                from the demo's actual rendered markup inside PreviewToolbar's
                `[data-lumo-demo-root]` above. See `evidence-panel.tsx`'s file
                header for why this cannot be computed here in React.
              */}
              <EvidencePanel locale={lang} />
            </div>
          </section>

          <section id="installation" className="mt-10 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
              {lang === "fa-IR" ? "نصب" : "Installation"}
            </h2>
            <div className="mt-3">
              <InstallTabs
                locale={lang}
                registryName={item.name}
                dependencies={item.dependencies ?? []}
                registryComponents={registryComponents}
                files={installFiles}
                commandHtml={commandHtml}
                depsHtml={depsHtml}
              />
            </div>
          </section>

          <section id="directions" className="mt-10 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
              {lang === "fa-IR" ? "فارسی و انگلیسی، کنار هم" : "Persian and English, side by side"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-fg-muted">
              {lang === "fa-IR"
                ? "هر قاب یک سند مستقل با ‎lang‎ و ‎dir‎ واقعی خودش است — نه یک div که وانمود می‌کند. برای دیدن هر دو جهت کنار هم، مقایسه را باز کنید."
                : "Each frame is a real document with its own lang and dir — not a div pretending to be one. Open the comparison to see both directions side by side."}
            </p>
            {/*
             * One frame by default — the page's own locale — with the mirrored
             * document a disclosure away. See `DirectionCompare`'s header: the
             * hidden frame stays in the served bytes, and `loading="lazy"`
             * keeps it unfetched until revealed.
             */}
            <div className="mt-3">
              <DirectionCompare
                primary={
                  <DemoFrame slug={slug} lang={lang} title={demo.title[lang]} pageLang={lang} />
                }
                comparison={
                  <DemoFrame
                    slug={slug}
                    lang={lang === "fa-IR" ? "en-US" : "fa-IR"}
                    title={demo.title[lang]}
                    pageLang={lang}
                  />
                }
                showLabel={lang === "fa-IR" ? "نمایش مقایسهٔ دو جهت" : "Compare both directions"}
                hideLabel={lang === "fa-IR" ? "بستن مقایسهٔ دو جهت" : "Hide the comparison"}
              />
            </div>
          </section>

        </article>

        <OnThisPage lang={lang} items={sections(lang)} />
      </div>
    </SiteShell>
  );
}
