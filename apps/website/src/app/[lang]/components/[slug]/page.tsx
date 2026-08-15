import { readFileSync } from "node:fs";
import { basename, join } from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LOCALES, type Locale, type LumoNode } from "@lumo-ui/core";
import { Tab, TabList, TabPanel, Tabs } from "@lumo-ui/ui";
import { SiteShell } from "@/components/site-shell";
import { DocsSidebar } from "@/components/docs-sidebar";
import { OnThisPage } from "@/components/on-this-page";
import { DemoFrame, DirectionCompare } from "@/components/demo-frame";
import { CopyButton } from "@/components/code-block";
import { CodePanel } from "@/components/code-panel";
import { InstallTabs, type InstallFile } from "@/components/install-tabs";
import { INSTALL_COPY } from "@/lib/install-copy";
import { CLI_COMMAND, PMS, depsCommand, type PM } from "@/lib/install-commands";
import { highlight } from "@/lib/highlight";
import { PreviewToolbar } from "@/components/preview-toolbar";
import { EvidencePanel } from "@/components/evidence-panel";
import { assertLocale, oppositeDirectionLocale, site, segmentFor} from "@/lib/locale";
import { allCatalog, catalogById } from "@/lib/catalog";
import { loadExamplesFor, type LoadedComponentExamples } from "@/lib/examples-loader";
import { ExampleCard } from "@/components/example-card";
import { CompositionTree, PartsTable, PropsTable } from "@/components/composition-tree";

export async function generateStaticParams() {
  // The CATALOG: every component with an examples file, and nothing else. See lib/catalog.ts.
  const entries = await allCatalog();
  return LOCALES.flatMap((lang) => entries.map((d) => ({ lang: segmentFor(lang), slug: d.id })));
}

/**
 * The page's own copy, keyed by locale — a `Record<Locale, …>`, never a binary
 * ternary, so a third locale is a compile error listing every string still to
 * translate. `rail` is shared with the section headings so they cannot drift.
 */
interface PageCopy {
  rail: {
    preview: string;
    composition: string;
    api: string;
    evidence: string;
    installation: string;
    directions: string;
  };
  /** Names the narrow-viewport component list. REQUIRED: below 1024px this `<summary>` is the only navigation to the other components. */
  browseComponents: string;
  copyPage: string;
  copied: string;
  /** The header pager's landmark name and its two per-neighbour labels. */
  pagerNav: string;
  pagerPrev: (title: string) => string;
  pagerNext: (title: string) => string;
  previewOrCode: string;
  copySource: string;
  sourceCopied: string;
  /** `ExampleCard`'s four required announced names. */
  exampleView: string;
  exampleHide: string;
  exampleCopy: string;
  exampleCopied: string;
  compositionIntro: string;
  copyComposition: string;
  compositionCopied: string;
  exportedParts: string;
  partHeader: string;
  descriptionHeader: string;
  apiIntro: string;
  propHeader: string;
  typeHeader: string;
  requirementHeader: string;
  requiredLabel: string;
  optionalLabel: string;
  /** The two-direction section: its `<h2>` differs from its short rail label. */
  directionsHeading: string;
  directionsIntro: string;
  showCompare: string;
  hideCompare: string;
}

const COPY = {
  "fa-IR": {
    rail: {
      preview: "پیش‌نمایش",
      composition: "ترکیب اجزا",
      api: "مرجع API",
      evidence: "شواهد دسترس‌پذیری",
      installation: "نصب",
      directions: "هر دو جهت",
    },
    browseComponents: "همهٔ کامپوننت‌ها",
    copyPage: "کپی صفحه",
    copied: "کپی شد",
    pagerNav: "کامپوننت قبلی و بعدی",
    pagerPrev: (title: string) => `کامپوننت قبلی: ${title}`,
    pagerNext: (title: string) => `کامپوننت بعدی: ${title}`,
    previewOrCode: "پیش‌نمایش یا کد",
    copySource: "کپی کد کامپوننت",
    sourceCopied: "کد کامپوننت کپی شد",
    exampleView: "نمایش کد",
    exampleHide: "پنهان کردن کد",
    exampleCopy: "کپی کد نمونه",
    exampleCopied: "کد نمونه کپی شد",
    compositionIntro:
      "درخت اجزا، آمادهٔ کپی — هر تگ آن هنگام ساخت با خروجی‌های واقعی کتابخانه تطبیق داده شده است.",
    copyComposition: "کپی درخت اجزا",
    compositionCopied: "درخت اجزا کپی شد",
    exportedParts: "اجزای صادرشده",
    partHeader: "جزء",
    descriptionHeader: "شرح",
    apiIntro:
      "نام، نوع و اجباری‌بودن ویژگی‌ها مستقیماً از API تایپ‌اسکریپتِ صادرشده ساخته شده‌اند؛ تغییر نوع بدون بازسازی این جدول، دروازهٔ تأیید را رد نمی‌کند.",
    propHeader: "ویژگی",
    typeHeader: "نوع",
    requirementHeader: "الزام",
    requiredLabel: "اجباری",
    optionalLabel: "اختیاری",
    directionsHeading: "فارسی و انگلیسی، کنار هم",
    directionsIntro:
      "هر قاب یک سند مستقل با ‎lang‎ و ‎dir‎ واقعی خودش است — نه یک div که وانمود می‌کند. برای دیدن هر دو جهت کنار هم، مقایسه را باز کنید.",
    showCompare: "نمایش مقایسهٔ دو جهت",
    hideCompare: "بستن مقایسهٔ دو جهت",
  },
  "en-US": {
    rail: {
      preview: "Preview",
      composition: "Composition",
      api: "API reference",
      evidence: "Accessibility evidence",
      installation: "Installation",
      directions: "Both directions",
    },
    browseComponents: "All components",
    copyPage: "Copy page",
    copied: "Copied",
    pagerNav: "Previous and next component",
    pagerPrev: (title: string) => `Previous component: ${title}`,
    pagerNext: (title: string) => `Next component: ${title}`,
    previewOrCode: "Preview or code",
    copySource: "Copy the component's source",
    sourceCopied: "Component source copied",
    exampleView: "View code",
    exampleHide: "Hide code",
    exampleCopy: "Copy the example code",
    exampleCopied: "Example code copied",
    compositionIntro:
      "The parts tree, ready to copy — every tag in it is checked against the library's real exports at build time.",
    copyComposition: "Copy the composition tree",
    compositionCopied: "Composition tree copied",
    exportedParts: "Exported parts",
    partHeader: "Part",
    descriptionHeader: "Description",
    apiIntro:
      "Prop names, resolved types, and requiredness are generated directly from the exported TypeScript API; changing a type without rebuilding this table fails verification.",
    propHeader: "Prop",
    typeHeader: "Type",
    requirementHeader: "Requirement",
    requiredLabel: "Required",
    optionalLabel: "Optional",
    directionsHeading: "Persian and English, side by side",
    directionsIntro:
      "Each frame is a real document with its own lang and dir — not a div pretending to be one. Open the comparison to see both directions side by side.",
    showCompare: "Compare both directions",
    hideCompare: "Hide the comparison",
  },
} as const satisfies Record<Locale, PageCopy>;

/**
 * Section headings, in both locales, so the rail and the page cannot disagree.
 * The list is DYNAMIC over the loaded examples file: each example contributes an
 * `example-<id>` section, and the page body maps over the SAME loaded object in
 * the same order — the invariant this function exists to hold. There is no
 * "source" entry: the source lives in the Preview | Code tab pair.
 */
function sections(lang: Locale, loaded: LoadedComponentExamples | undefined) {
  const c = COPY[lang];
  // Annotated, not inferred: COPY is `as const`, so inference would narrow to the first literal.
  const list: Array<{ id: string; label: string }> = [
    { id: "preview", label: c.rail.preview },
    /*
     * Installation is SECOND, directly under the preview (as shadcn/reui do):
     * these components are COPIED, and everything below is what you read after.
     */
    { id: "installation", label: c.rail.installation },
  ];
  if (loaded !== undefined) {
    // Every example has a card, including the first (source-only), so each rail entry scrolls to something.
    for (const example of loaded.examples) {
      list.push({ id: `example-${example.id}`, label: example.title[lang] });
    }
    if (loaded.composition !== undefined) {
      list.push({ id: "composition", label: c.rail.composition });
    }
    if (loaded.api.length > 0) {
      list.push({ id: "api", label: c.rail.api });
    }
  }
  list.push(
    { id: "evidence", label: c.rail.evidence },
    { id: "directions", label: c.rail.directions },
  );
  return list;
}

/**
 * The header's previous/next pager, over the catalog's alphabetical order.
 * The glyphs are `‹`/`›`, a `Bidi_Mirrored` pair: under `dir="rtl"` both the
 * arrowhead and the position flip from normal flow alone (see pagination.tsx).
 * They are `aria-hidden`; the per-locale `aria-label` is the name.
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
 * registry.json, READ AT BUILD TIME, NEVER HARDCODED: the Installation section
 * is derived from the manifest `scripts/build-registry.mjs` generates, so this
 * page and the registry cannot disagree.
 */
const REPO_ROOT = join(process.cwd(), "..", "..");
const UI_SOURCE_ROOT = join(REPO_ROOT, "packages", "ui", "src");
const BLOCKS_SOURCE_ROOT = join(REPO_ROOT, "packages", "blocks", "src");

/**
 * Registry files come from exactly these two flat source folders. Rooting each
 * dynamic read there stops Turbopack treating a registry path as a pattern over
 * the whole repository, and fails closed on a nested or out-of-tree path.
 */
function readRegistrySource(path: string): string {
  const file = basename(path);
  if (path === `packages/ui/src/${file}`) {
    return readFileSync(join(UI_SOURCE_ROOT, file), "utf8");
  }
  if (path === `packages/blocks/src/${file}`) {
    return readFileSync(join(BLOCKS_SOURCE_ROOT, file), "utf8");
  }
  throw new Error(`Registry source is outside the supported source roots: ${path}`);
}

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
 * it. Most match by NAME; `icon-button` ships from `button.tsx` (one item per
 * FILE), so a byte comparison against the demo's displayed source is the
 * fallback rather than a hardcoded exception.
 */
function resolveRegistryItem(
  registry: RegistryData,
  slug: string,
  source: string,
): RegistryItem | undefined {
  const uiItems = registry.items.filter((i) => i.type === "registry:ui");
  /*
   * Byte-comparison FIRST, name second: name-first once told the skeleton page
   * to install a file its own demo was not showing. What the page DISPLAYS is
   * the ground truth of what it should install.
   */
  const byContent = uiItems.find((i) => {
    const main = mainFileOf(i);
    if (!main) return false;
    try {
      return readRegistrySource(main.path) === source;
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
  const demo = await catalogById(slug);
  if (!demo) notFound();

  const t = site[lang];
  const c = COPY[lang];

  const registry = loadRegistry();
  const item = resolveRegistryItem(registry, slug, demo.source);
  if (!item) {
    // An ungraded install command is as bad as an ungraded page: refuse to
    // render rather than fall back to a guess.
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
   * Every listing is highlighted AND assembled into `CodePanel` elements in this
   * server pass — never handed to client modules as `html`/`code` strings, which
   * once made the RSC flight payload 76% of the largest page. `sourcePanel` is
   * ONE ELEMENT placed twice (Code tab and Manual tab): React's flight writer
   * deduplicates elements by reference but never strings. `isPageSource` marks
   * it for "Copy page"; `querySelector` takes the first, the force-mounted Code
   * tab. Sequential awaits: one shared highlighter, ~100 pages.
   */
  const ic = INSTALL_COPY[lang];
  const sourceHtml = await highlight(demo.source, "tsx");
  const sourcePanel = (
    <CodePanel
      html={sourceHtml}
      label={c.copySource}
      copiedLabel={c.sourceCopied}
      isPageSource
    />
  );

  const installFiles: InstallFile[] = [];
  for (const [i, f] of item.files.entries()) {
    const code = readRegistrySource(f.path);
    const panel =
      code === demo.source ? (
        sourcePanel
      ) : (
        <CodePanel
          html={await highlight(code, "tsx")}
          label={i === 0 ? ic.copyMain : ic.copyCompanion}
          copiedLabel={i === 0 ? ic.copyMainDone : ic.copyCompanionDone}
        />
      );
    installFiles.push({ target: f.target, panel });
  }
  /*
   * A full `Record<PM, …>`: a missing panel is a tab that selects into an empty
   * region. `Object.fromEntries` would type as a `Partial`.
   */
  const commandPanels = {} as Record<PM, LumoNode>;
  for (const pm of PMS) {
    commandPanels[pm] = (
      <CodePanel
        html={await highlight(CLI_COMMAND[pm](item.name), "bash")}
        label={ic.copyCommand}
        copiedLabel={ic.copyCommandDone}
      />
    );
  }
  const deps = item.dependencies ?? [];
  const depsPanel =
    deps.length > 0 ? (
      <CodePanel
        html={await highlight(depsCommand(deps), "bash")}
        label={ic.copyDeps}
        copiedLabel={ic.copyDepsDone}
      />
    ) : undefined;

  /*
   * The worked examples, when an examples file exists (discovery by existence);
   * highlighted here in the same sequential server pass.
   */
  const loaded = await loadExamplesFor(slug);
  const exampleCards: Array<{
    example: LoadedComponentExamples["examples"][number];
    html: string;
    /** False only for the first example — the preview above IS its render. */
    withStage: boolean;
  }> = [];
  if (loaded !== undefined) {
    /*
     * The first example IS the preview, so its card is source-only: rendering it
     * again DUPLICATED EVERY ID IN IT (`unique-ids`), and dropping the card
     * removed its usage source from the page. Titled, anchored card; no stage.
     */
    for (const [index, example] of loaded.examples.entries()) {
      exampleCards.push({
        example,
        html: await highlight(example.source, "tsx"),
        withStage: index > 0,
      });
    }
  }
  const compositionHtml =
    loaded?.composition !== undefined ? await highlight(loaded.composition, "tsx") : undefined;


  /*
   * The header toolbar's data. "Copy page" carries only the ~50-char command
   * and appends the source's own `<pre>` at press time (from the force-mounted
   * Code tab) rather than concatenating a third copy into the flight payload.
   */
  const demos = (await allCatalog());
  const index = demos.findIndex((d) => d.id === slug);
  const prevDemo = index > 0 ? demos[index - 1] : undefined;
  const nextDemo = index >= 0 && index < demos.length - 1 ? demos[index + 1] : undefined;

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

        {/*
         * The narrow-viewport path: the sidebar is `hidden lg:block`, so below
         * 1024px this native `<details>` holds the SAME `DocsSidebar`. Not the
         * docs-shell chip strip (94 chips is not navigation), and not a client
         * disclosure — `<details>` needs no JavaScript and no ARIA.
         */}
        <details className="group -mx-6 border-be border-border px-6 pbe-4 lg:hidden">
          <summary
            className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-md py-2 text-sm font-medium text-fg [&::-webkit-details-marker]:hidden"
          >
            {c.browseComponents}
            {/*
             * `›` (U+203A) is Bidi_Mirrored, so it points the correct way under RTL
             * with no `rtl:` variant. `aria-hidden`: the summary text names the control.
             */}
            <span
              aria-hidden="true"
              className="text-fg-muted transition-transform group-open:rotate-90"
            >
              ›
            </span>
          </summary>
          <div className="mt-2 max-h-[60vh] overflow-y-auto">
            <DocsSidebar lang={lang} active={slug} />
          </div>
        </details>

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
                text={CLI_COMMAND.pnpm(item.name)}
                appendFrom="[data-lumo-code-source] pre"
                label={c.copyPage}
                copiedLabel={c.copied}
              />
              <Pager
                prev={
                  prevDemo && {
                    href: `/${segmentFor(lang)}/components/${prevDemo.id}/`,
                    title: prevDemo.title[lang],
                  }
                }
                next={
                  nextDemo && {
                    href: `/${segmentFor(lang)}/components/${nextDemo.id}/`,
                    title: nextDemo.title[lang],
                  }
                }
                navLabel={c.pagerNav}
                prevLabel={c.pagerPrev}
                nextLabel={c.pagerNext}
              />
            </div>
          </header>

          <section id="preview" className="mt-8 scroll-mt-24">
            {/*
             * Preview | Code: the preview tab is FIRST so the prerendered HTML contains
             * the demo markup that `[data-lumo-demo-root]` and the evidence injector
             * depend on being in the served bytes.
             */}
            <Tabs>
              <TabList label={c.previewOrCode}>
                <Tab id="preview">{t.preview}</Tab>
                <Tab id="code">{t.code}</Tab>
              </TabList>
              <TabPanel id="preview" className="mt-4">
                <PreviewToolbar lang={lang} slug={slug}>
                  {/*
                   * `items-center` on a column flex centres an intrinsic-width exhibit on the
                   * inline axis while a `w-full` demo still spans the cell.
                   */}
                  <div className="flex w-full flex-col items-center">{demo.render(lang)}</div>
                </PreviewToolbar>
              </TabPanel>
              {/*
               * `shouldForceMount`: otherwise only the selected panel mounts and the
               * component source vanishes from the served HTML — a no-JS reader must
               * still get it.
               */}
              <TabPanel id="code" shouldForceMount className="mt-4 data-inert:hidden">
                {sourcePanel}
              </TabPanel>
            </Tabs>
          </section>

          <section id="installation" className="mt-8 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
              {c.rail.installation}
            </h2>
            <div className="mt-3">
              <InstallTabs
                locale={lang}
                registryComponents={registryComponents}
                files={installFiles}
                commandPanels={commandPanels}
                depsPanel={depsPanel}
              />
            </div>
          </section>

          {/*
           * The worked examples, in the same order as `sections()`. The cards carry no
           * [data-lumo-demo-root]: that marker stays unique to the preview stage the
           * evidence injector reads.
           */}
          {exampleCards.map(({ example, html, withStage }) => (
            <ExampleCard
              key={example.id}
              id={`example-${example.id}`}
              title={example.title[lang]}
              description={example.description?.[lang]}
              html={html}
              viewLabel={c.exampleView}
              hideLabel={c.exampleHide}
              copyLabel={c.exampleCopy}
              copiedLabel={c.exampleCopied}
            >
              {withStage ? (
                <div className="flex w-full flex-col items-center">{example.render(lang)}</div>
              ) : undefined}
            </ExampleCard>
          ))}

          {loaded !== undefined &&
          loaded.composition !== undefined &&
          compositionHtml !== undefined ? (
            <section id="composition" className="mt-10 scroll-mt-24">
              <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
                {c.rail.composition}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-fg-muted">
                {c.compositionIntro}
              </p>
              <div className="mt-3">
                <CompositionTree
                  html={compositionHtml}
                  copyLabel={c.copyComposition}
                  copiedLabel={c.compositionCopied}
                  parts={loaded.moduleParts}
                  partsLabel={c.exportedParts}
                />
              </div>
            </section>
          ) : null}

          {loaded !== undefined && loaded.api.length > 0 ? (
            <section id="api" className="mt-10 scroll-mt-24">
              <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
                {c.rail.api}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-fg-muted">{c.apiIntro}</p>
              <div className="mt-3 flex flex-col gap-6">
                <PropsTable
                  groups={loaded.api}
                  propHeader={c.propHeader}
                  typeHeader={c.typeHeader}
                  descriptionHeader={c.descriptionHeader}
                  requirementHeader={c.requirementHeader}
                  requiredLabel={c.requiredLabel}
                  optionalLabel={c.optionalLabel}
                />
                {loaded.parts !== undefined && loaded.parts.length > 0 ? (
                  <PartsTable
                    parts={loaded.parts}
                    locale={lang}
                    partHeader={c.partHeader}
                    descriptionHeader={c.descriptionHeader}
                  />
                ) : null}
              </div>
            </section>
          ) : null}

          <section id="evidence" className="mt-10 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
              {c.rail.evidence}
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

          <section id="directions" className="mt-10 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
              {c.directionsHeading}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-fg-muted">
              {c.directionsIntro}
            </p>
            {/*
             * One frame by default, the mirrored document a disclosure away; the hidden
             * frame stays in the served bytes with `loading="lazy"`.
             */}
            <div className="mt-3">
              <DirectionCompare
                primary={
                  <DemoFrame slug={slug} lang={lang} title={demo.title[lang]} pageLang={lang} />
                }
                comparison={
                  <DemoFrame
                    slug={slug}
                    lang={oppositeDirectionLocale(lang)}
                    title={demo.title[lang]}
                    pageLang={lang}
                  />
                }
                showLabel={c.showCompare}
                hideLabel={c.hideCompare}
              />
            </div>
          </section>

        </article>

        <OnThisPage lang={lang} items={sections(lang, loaded)} />
      </div>
    </SiteShell>
  );
}
