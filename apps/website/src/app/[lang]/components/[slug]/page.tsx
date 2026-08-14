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
  // The CATALOG, not (await allCatalog()): round 3 shipped eleven components whose only
  // registration was an examples file, and this line — then reading demos.tsx
  // alone — quietly built no page for any of them. See lib/catalog.ts.
  const entries = await allCatalog();
  return LOCALES.flatMap((lang) => entries.map((d) => ({ lang: segmentFor(lang), slug: d.id })));
}

/**
 * The page's own copy, keyed by locale.
 *
 * NOT `lang === "fa-IR" ? persian : english`. That ternary compiles with a third
 * locale in the union and hands it the ENGLISH branch — silently, and invisibly
 * to the HTML gate, because both branches are Latin script. A
 * `Record<Locale, …>` turns the same addition into a compile error listing every
 * string still to translate. This page carried thirty-three of them, eleven
 * inside `aria-label`s that only a screen-reader user would ever hear. See the
 * rule in CONTRIBUTING's "Adding a locale".
 *
 * `rail` is shared with the section headings deliberately: four of the `<h2>`s
 * repeated their rail label as a second literal, free to drift from it. One
 * string each now, which is the same argument `sections()` below already makes
 * about order.
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
  /**
   * Names the narrow-viewport component list. REQUIRED copy, not decoration:
   * below 1024px this `<summary>` is the only navigation to the other 93
   * components, so an unnamed one is an unreachable library.
   */
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
 *
 * There is no "source" entry: the source moved into the Preview | Code tab
 * pair inside `#preview`, so a rail link to a `#source` fragment would point
 * at nothing — exactly the drift this function exists to prevent.
 *
 * The list is DYNAMIC over the component's loaded examples file (see
 * `lib/examples-loader.ts`): each example contributes an `example-<id>`
 * section between Preview and Evidence, and the composition / parts-reference
 * sections appear only when the file declares them. The page body below maps
 * over the SAME loaded object in the same order, which is what keeps the rail
 * and the page structurally unable to disagree — the invariant this function
 * has always existed to hold.
 */
function sections(lang: Locale, loaded: LoadedComponentExamples | undefined) {
  const c = COPY[lang];
  // Annotated, not inferred: COPY is `as const`, so an inferred element type
  // would narrow to the first entry's literal and reject every later push.
  const list: Array<{ id: string; label: string }> = [
    { id: "preview", label: c.rail.preview },
    /*
     * ── INSTALLATION IS SECOND, AND WAS SECOND-TO-LAST ──────────────────────
     *
     * Both ui.shadcn.com and reui.io put it directly under the preview, and
     * they are right for a reason this library has more of than either: these
     * components are COPIED, not imported. The page's job is not to admire the
     * component — it is to get the file into somebody's project. Everything
     * below (examples, composition, the parts table, the accessibility
     * evidence, the two-direction render) is what you read AFTER you have it.
     *
     * It sat between "evidence" and "directions", which is where a section
     * lands when it is added late rather than placed.
     */
    { id: "installation", label: c.rail.installation },
  ];
  if (loaded !== undefined) {
    // Every example has a card now, including the first: its card is
    // source-only (the preview above IS its render), so the anchor exists and
    // a rail entry scrolls to something. See the card loop in the page body.
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
 * The header's previous/next pager, over `(await allCatalog())`'s alphabetical order.
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
const UI_SOURCE_ROOT = join(REPO_ROOT, "packages", "ui", "src");
const BLOCKS_SOURCE_ROOT = join(REPO_ROOT, "packages", "blocks", "src");

/**
 * Registry files are generated from exactly these two flat source folders.
 * Keeping each dynamic read rooted there prevents Turbopack from treating a
 * registry path as a pattern over the whole repository (11,000+ files in the
 * warning that exposed this). The equality checks also fail closed if a future
 * registry entry introduces a nested or out-of-tree path.
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
   * ── EVERY LISTING ON THE PAGE IS BUILT HERE, AND THAT IS A BYTE DECISION ────
   *
   * Highlighting has always happened in this server pass, because shiki plus
   * two grammars must not reach a browser bundle. What is new is that the
   * PANELS are built here too, as `CodePanel` elements, instead of the markup
   * being handed to `"use client"` modules as `html` and `code` strings.
   *
   * Measured at 3f46039 on the largest page, `fa/components/event-calendar`
   * (2,217,379 chars): the RSC flight payload was 1,678,774 of them, 76%, and
   * React outlines every string over 1024 chars into its own row. Fifteen such
   * rows held 1,102,417 chars — nine shiki (885,280) and six raw source
   * (217,137) — against 364,509 chars of `<pre>` actually in the DOM. The raw
   * source was there only to feed copy buttons, and it is gone entirely: the
   * buttons read the rendered listing (see `code-block.tsx`'s `CopyCode`).
   *
   * `sourcePanel` is ONE ELEMENT, placed twice. The Preview → Code tab and
   * Installation → Manual show the same file whenever `resolveRegistryItem`
   * matched by content, which is the normal case — and as two `html` props they
   * shipped as two byte-identical 336,371-char rows. React's flight writer
   * deduplicates objects by reference (`writtenObjects`) and never strings
   * (`serializeLargeTextString` emits a fresh row per call), so the saving is
   * available to an element and not to a string, however carefully the string
   * is shared. `isPageSource` marks it for the header's "Copy page" — and yes,
   * the marker rides along to the second placement, so a reader who opens the
   * Manual tab has two elements carrying it. `document.querySelector` takes the
   * first, which is the force-mounted Code tab; and the reuse only happens when
   * the two listings are the SAME BYTES, so the copy is identical either way.
   * The alternative — a third highlight of a file already highlighted twice —
   * would cost 336,371 characters to remove a distinction nobody can observe.
   *
   * Sequential awaits, deliberately: the highlighter is one shared instance and
   * the export builds ~100 of these pages — a `Promise.all` per page just
   * interleaves the same single-threaded work.
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
   * A full `Record<PM, …>`, built by iterating `PMS` — the props type asks for
   * every manager because a missing panel is a tab that selects into an empty
   * region, which nobody notices until they click it. `Object.fromEntries`
   * would type as a `Partial`, so this accumulates into an explicit record.
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
   * The component's worked examples, when an examples file exists — discovery
   * is by existence (see lib/examples-loader.ts), and demos.tsx remains the
   * whole page for components without one. The loader has already sliced and
   * validated every example's source; highlighting happens here in the same
   * sequential server pass as everything else above, for the same
   * single-highlighter reason.
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
     * ── THE FIRST EXAMPLE IS THE PREVIEW, SO ITS CARD IS SOURCE-ONLY ─────────
     *
     * `catalog.ts` builds a component's demo as `render: first.render` — the
     * preview at the top of this page IS the first example. Rendering it
     * again in a card DUPLICATED EVERY ID IN IT: `unique-ids` found
     * `spy-usage` twice on the scrollspy page and the table page's row ids
     * five times over, and a duplicated id breaks `<label for>` and
     * `aria-labelledby`, which resolve by document order.
     *
     * The previous answer was `slice(1)` — no card at all — which quietly
     * removed the first example's USAGE SOURCE from the page: the Code tab
     * above holds the component's implementation, not the call site. On the
     * eighteen single-example components that meant a page with no usage
     * listing anywhere. So the first example keeps its titled, anchored card
     * and only the stage is omitted; both invariants hold at once.
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
   * The header toolbar's data. The pager walks `(await allCatalog())` — the SAME
   * alphabetical order the sidebar shows — and "Copy page" still yields the
   * install command plus the component's source, the two things a reader would
   * otherwise copy one at a time. It is no longer CONCATENATED here: that put a
   * third copy of the source (58,715 chars on event-calendar) into the flight
   * payload beside the two the listings already carried. The button now carries
   * the ~50-character command and appends the source's own `<pre>` at press
   * time, from the force-mounted Code tab that is unconditionally in the served
   * bytes. Same string, one copy of it.
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
         * ── THE NARROW-VIEWPORT PATH, WHICH DID NOT EXIST ────────────────────
         *
         * The sidebar above is `hidden lg:block` with nothing in its place, so
         * below 1024px the entire 94-component list was reachable only through
         * search or by typing a URL. The prose docs pages have had a mobile
         * strip since their own review found the same hole
         * (`docs/docs-shell.tsx`); the component pages never got one.
         *
         * NOT that strip, though. Six doc pages fit in a horizontal scroll;
         * ninety-four do not — it would be a 94-chip rail nobody can find
         * anything in, which is a worse answer than none because it looks like
         * navigation. So it is a native `<details>` holding the SAME
         * `DocsSidebar`, tier-grouped and counted exactly as on desktop.
         *
         * `<details>` and not a client disclosure on purpose: it needs no
         * JavaScript, it is open-able before hydration, and the summary is a
         * real button to assistive tech without a single ARIA attribute. The
         * one behaviour it does not get is closing on navigation — and there
         * is nothing to close, because following a link leaves the page.
         */}
        <details className="group -mx-6 border-be border-border px-6 pbe-4 lg:hidden">
          <summary
            className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-md py-2 text-sm font-medium text-fg [&::-webkit-details-marker]:hidden"
          >
            {c.browseComponents}
            {/*
             * `›` is U+203A, a Bidi_Mirrored character — the text engine draws
             * it as `‹` under RTL, so the affordance points the correct way in
             * both directions with no `rtl:` variant. The same technique the
             * pager and the submenu arrow use. `aria-hidden` because the
             * summary's own text already names the control, and `<details>`
             * announces its own expanded state.
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
             * Preview | Code, the shadcn anatomy: the live demo and its
             * highlighted source are the same exhibit seen two ways, so they
             * share one tab pair rather than sitting a page apart. The preview
             * tab is FIRST — it is the default selection, so the prerendered
             * HTML contains the demo markup, which `[data-lumo-demo-root]`
             * (inside PreviewToolbar) and the post-build evidence injector
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
           * The worked examples, between Preview and Evidence — each one a
           * titled, anchored section the rail lists, in the same order, from
           * the same loaded object (see `sections()` above). The cards carry
           * no [data-lumo-demo-root]: that marker stays unique to the preview
           * stage the evidence injector reads.
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
