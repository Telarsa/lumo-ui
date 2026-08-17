import Link from "next/link";
import { notFound } from "next/navigation";
import { LOCALES, type BuiltinLocale as Locale } from "@lumo-ui/core";
import { Frame, Tab, TabList, TabPanel, Tabs } from "@lumo-ui/ui";
import { SiteShell } from "@/components/site-shell";
import { DocsSidebar } from "@/components/docs-sidebar";
import { OnThisPage } from "@/components/on-this-page";
import { CodePanel } from "@/components/code-panel";
import { ExampleCard } from "@/components/example-card";
import { PropsTable } from "@/components/composition-tree";
import { PlatformSwitch } from "@/components/platform-switch";
import { MobilePreview } from "@/components/mobile-preview";
import { GeneratedText } from "@/components/generated-text";
import { highlight } from "@/lib/highlight";
import { assertLocale, segmentFor, site } from "@/lib/locale";
import { catalogById } from "@/lib/catalog";
import {
  galleryUrl,
  loadMobileDemos,
  mobileSlugs,
  MOBILE_PACKAGE,
  MOBILE_PACKAGE_PATH,
  MOBILE_REPO_BROWSE,
  MOBILE_REPO_URL,
  MOBILE_VERSION,
  type MobileDemo,
} from "@/lib/mobile-examples";

/**
 * The MOBILE side of a component page — `/components/<slug>/mobile/`. Same
 * component, the Flutter implementation: the REAL widget running in a phone
 * frame (one Flutter web app serves every demo, embedded per demo in an
 * iframe), each demo's Dart source, the GENERATED props table, the install, the
 * contract, and the honest caveats.
 *
 * The platform is a ROUTE, as the locale is, so the Web | Mobile switch is two
 * links and BOTH pages are served bytes the gate grades. The shell, the rail,
 * the heading rhythm and the voice are the Web page's — deliberately, down to
 * the section order: a reader who has read one component page has read this one.
 *
 * What the gate can and cannot see here is stated ON the page, not only in this
 * comment: the preview is a canvas, and the semantics-tree tests in
 * `packages/mobile/test/` are the proof.
 */

export async function generateStaticParams() {
  // Derived, never hand-listed: a slug has a Mobile side IFF it has demos.
  return LOCALES.flatMap((lang) => mobileSlugs().map((slug) => ({ lang: segmentFor(lang), slug })));
}

/** One `<title>` per page (WCAG 2.4.2): the component, then the platform, then the site. */
export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang: raw, slug } = await params;
  const lang = assertLocale(raw);
  const demo = await catalogById(slug);
  if (demo === undefined) return { title: site[lang].title };
  const c = COPY[lang];
  return {
    title: `${demo.title[lang]} — ${c.platform} — ${site[lang].title}`,
    description: c.metaDescription(demo.title[lang]),
  };
}

/**
 * The page's own copy, keyed by locale — a `Record<Locale, …>`, never a binary
 * ternary, so a third locale is a compile error listing every string still to
 * translate. `rail` is shared with the section headings so they cannot drift.
 */
interface PageCopy {
  /** «موبایل (فلاتر)» — the platform's name, above the component's own. */
  platform: string;
  metaDescription: (title: string) => string;
  rail: {
    preview: string;
    installation: string;
    contract: string;
    api: string;
    caveats: string;
    evidence: string;
  };
  /** Names the narrow-viewport component list. REQUIRED: below 1024px this `<summary>` is the only navigation to the other components. */
  browseComponents: string;
  previewOrCode: string;
  /** Names what is inside the phone bezel. Required — `Frame` announces it. */
  frameLabel: string;
  previewNote: string;
  copySource: string;
  sourceCopied: string;
  /** `ExampleCard`'s four required announced names. */
  exampleView: string;
  exampleHide: string;
  exampleCopy: string;
  exampleCopied: string;
  installIntro: string;
  copyDependency: string;
  dependencyCopied: string;
  scopeIntro: string;
  copyScope: string;
  scopeCopied: string;
  contractIntro: string;
  contractPoints: readonly string[];
  apiIntro: string;
  /** Shown INSTEAD of the table when the family's API is not a widget constructor. */
  apiNotAWidget: string;
  announcedHeading: string;
  noAnnounced: string;
  enumsHeading: string;
  propHeader: string;
  typeHeader: string;
  descriptionHeader: string;
  requirementHeader: string;
  requiredLabel: string;
  optionalLabel: string;
  caveatPoints: readonly string[];
  evidenceIntro: string;
  testLink: string;
  testsLink: string;
  webLink: string;
  /** Precedes the Dart file(s) the props table was generated from. */
  generatedFrom: string;
}

const COPY = {
  "fa-IR": {
    platform: "موبایل (فلاتر)",
    metaDescription: (title: string) => `${title} روی فلاتر: ویجت زنده، کد دارت، و جدول ویژگی‌های تولیدشده.`,
    rail: {
      preview: "پیش‌نمایش",
      installation: "نصب",
      contract: "قرارداد",
      api: "مرجع API",
      caveats: "آنچه این صفحه ثابت نمی‌کند",
      evidence: "شواهد",
    },
    browseComponents: "همهٔ کامپوننت‌ها",
    previewOrCode: "پیش‌نمایش یا کد",
    frameLabel: "پیش‌نمایش زندهٔ موبایل",
    previewNote:
      "این تصویر یا بازسازی وب نیست: همان ویجتی است که روی گوشی اجرا می‌شود، این‌بار برای وب ساخته و درون قاب بالا اجرا شده — با زبان و پوستهٔ همین صفحه.",
    copySource: "کپی کد دارت",
    sourceCopied: "کد دارت کپی شد",
    exampleView: "نمایش کد",
    exampleHide: "پنهان کردن کد",
    exampleCopy: "کپی کد نمونه",
    exampleCopied: "کد نمونه کپی شد",
    installIntro:
      "کامپوننت‌های موبایل کپی نمی‌شوند، وارد می‌شوند — برخلاف کامپوننت‌های وب که کدشان را به پروژه‌تان می‌ریزید. بستهٔ دارت را با همان تگی سنجاق کنید که بقیهٔ بسته‌های قرارداد روی آن نشسته‌اند:",
    copyDependency: "کپی وابستگی",
    dependencyCopied: "وابستگی کپی شد",
    scopeIntro:
      "سپس ریشهٔ هر مسیر را داخل محدودهٔ لومو بگذارید. جهت از زبان می‌آید، نه از یک پرچم، و رنگ‌ها از همان محدوده خوانده می‌شوند:",
    copyScope: "کپی کد ریشه",
    scopeCopied: "کد ریشه کپی شد",
    contractIntro: "همان قرارداد وب، این‌بار روی لایهٔ ویجت‌های متریال:",
    contractPoints: [
      "هر رشتهٔ اعلام‌شونده یک پارامتر اجباری است. هیچ متن انگلیسی پیش‌فرضی وجود ندارد — انگلیسیِ ناخواسته همان نقصی است که این کتابخانه برای جلوگیری از آن ساخته شده.",
      "جهت از زبان می‌آید: محدوده، جهت متن را می‌چیند و هر ویجت از فاصله‌ها و چیدمان جهت‌دار استفاده می‌کند. هیچ ویجتی پرچم راست‌به‌چپ نمی‌گیرد.",
      "ارقام و تاریخ‌ها قالب‌بندی می‌شوند: ارقام فارسی و تقویم جلالی، با همان قاعده‌ای که نسخهٔ وب دارد.",
      "توکن‌ها یکی‌اند: رنگ‌ها و اندازه‌ها از همان منبعی تولید می‌شوند که وب از آن می‌خواند، و کهنه‌شدنشان دروازهٔ خودش را دارد.",
    ],
    apiIntro:
      "از دارت‌داک‌های بستهٔ موبایل تولید شده، نه دست‌نویس. سرفصل قرارداد در ستون «الزام» دیده می‌شود: هر رشتهٔ اعلام‌شونده یک پارامتر اجباری است.",
    apiNotAWidget:
      "این خانواده جدول ویژگی ندارد، چون رابطش سازندهٔ یک ویجت نیست: با یک تابع فراخوانده می‌شود. مرجع تولیدشده فقط سازنده‌های ویجت را جدول می‌کند، پس به‌جای جدولی خالی، فایل دارت آن را پایین آورده‌ایم — رشته‌های اعلام‌شونده همان‌جا هم اجباری‌اند.",
    announcedHeading: "رشته‌های اعلام‌شوندهٔ اجباری",
    noAnnounced:
      "این خانواده هیچ رشتهٔ اجباری‌ای ندارد: نامش را از برچسب دیدنی‌اش می‌گیرد، و همان برچسب چیزی است که خوانده می‌شود.",
    enumsHeading: "مقدارهای شمارشی",
    propHeader: "ویژگی",
    typeHeader: "نوع",
    descriptionHeader: "شرح",
    requirementHeader: "الزام",
    requiredLabel: "اجباری",
    optionalLabel: "اختیاری",
    caveatPoints: [
      "پیش‌نمایش بالا یک بوم است. دروازهٔ این سایت بایت‌های سرو‌شده را نمره می‌دهد و درون بوم هیچ عنصری برای نمره‌دادن نیست؛ آنچه دروازه اینجا ثابت می‌کند متن‌ها، پیوندها، جدول ویژگی‌ها و کدهای پیرامون بوم است، نه خود ویجت.",
      "اثبات جای دیگری است: آزمون‌های درخت معنایی در بستهٔ موبایل، که همتای دروازهٔ بایت‌های سرو‌شده روی وب‌اند. پیوندشان در بخش شواهد پایین همین صفحه است.",
      "بار اول حدود دو مگابایت موتور دانلود می‌شود. یک برنامهٔ واحد همهٔ نمونه‌های سایت را سرو می‌کند، پس این هزینه یک‌بار پرداخت و پس از آن از حافظهٔ نهان خوانده می‌شود.",
      "تغییر پوسته یا زبان صفحه، قاب را دوباره بار می‌کند: پوسته و زبان در نشانی نمونه‌اند، نه حالتی که از بیرون به آن تزریق شود.",
    ],
    evidenceIntro:
      "چیزی که واقعاً بررسی شده: درخت معنایی — همان چیزی که صفحه‌خوان می‌خواند — در آزمون‌های بستهٔ موبایل ادعا و اجرا می‌شود.",
    testLink: "آزمون درخت معنایی این کامپوننت",
    testsLink: "آزمون‌های درخت معنایی بستهٔ موبایل",
    webLink: "نسخهٔ وب همین کامپوننت",
    generatedFrom: "جدول ویژگی‌های بالا از این فایل ساخته شده:",
  },
  "en-US": {
    platform: "Mobile (Flutter)",
    metaDescription: (title: string) => `${title} on Flutter: the live widget, its Dart source, and the generated props table.`,
    rail: {
      preview: "Preview",
      installation: "Installation",
      contract: "Contract",
      api: "API reference",
      caveats: "What this page does not prove",
      evidence: "Evidence",
    },
    browseComponents: "All components",
    previewOrCode: "Preview or code",
    frameLabel: "Live mobile preview",
    previewNote:
      "Not a screenshot and not a web re-creation: this is the widget a phone runs, compiled for the web and running in the frame above, in this page's own language and theme.",
    copySource: "Copy the Dart source",
    sourceCopied: "Dart source copied",
    exampleView: "View code",
    exampleHide: "Hide code",
    exampleCopy: "Copy the example code",
    exampleCopied: "Example code copied",
    installIntro:
      "Mobile components are imported rather than copied — unlike the web ones, whose source you vendor into your project. Pin the Dart package to the same tag the rest of the contract packages sit on:",
    copyDependency: "Copy the dependency",
    dependencyCopied: "Dependency copied",
    scopeIntro:
      "Then put the root of every route inside the Lumo scope. Direction comes from the language, never a flag, and the colours are read from that same scope:",
    copyScope: "Copy the root snippet",
    scopeCopied: "Root snippet copied",
    contractIntro: "The same contract as the web, on Material's widget layer:",
    contractPoints: [
      "Every announced string is a required parameter. There is no English default anywhere — unintended English is the defect this library exists to prevent.",
      "Direction comes from the language: the scope sets the text direction and every widget lays out directionally. No widget takes a right-to-left flag.",
      "Numbers and dates are formatted: Persian digits and the Jalali calendar, under the same rule the web version follows.",
      "There is one token source: colours and sizes are generated from the file the web reads, and going stale has a gate of its own.",
    ],
    apiIntro:
      "Generated from the mobile package's Dart docs, never hand-typed. The contract's headline is the Requirement column: an announced string is a required parameter.",
    apiNotAWidget:
      "This family has no props table, because its interface is not a widget constructor: it is called as a function. The generated reference tables widget constructors, so rather than print an empty table we name the Dart file below — the announced strings are required there too.",
    announcedHeading: "Required announced strings",
    noAnnounced:
      "This family has no required string: it takes its name from its visible label, and that label is what gets read out.",
    enumsHeading: "Enum values",
    propHeader: "Parameter",
    typeHeader: "Type",
    descriptionHeader: "Description",
    requirementHeader: "Requirement",
    requiredLabel: "Required",
    optionalLabel: "Optional",
    caveatPoints: [
      "The preview above is a canvas. This site's gate grades served bytes, and there is nothing inside a canvas for it to grade; what the gate proves here is the prose, the links, the props table and the code around the canvas — not the widget itself.",
      "The proof lives elsewhere: the semantics-tree tests in the mobile package, which are the counterpart of the served-bytes gate on the web. They are linked in the evidence section below.",
      "The first load downloads about two megabytes of engine. One app serves every demo on the site, so that cost is paid once and read from cache afterwards.",
      "Changing the page's theme or language reloads the frame: the theme and the language are in the demo's address, not state pushed into it from outside.",
    ],
    evidenceIntro:
      "What was actually checked: the semantics tree — what a screen reader reads — is asserted and run in the mobile package's tests.",
    testLink: "This component's semantics-tree test",
    testsLink: "The mobile package's semantics-tree tests",
    webLink: "The web version of this component",
    generatedFrom: "The props table above was generated from:",
  },
} as const satisfies Record<Locale, PageCopy>;

/**
 * One demo, running, inside the phone bezel. `min-h-0` overrides the bezel's
 * portrait floor: the frame's height is the DEMO's — a fixed default that
 * renders with JavaScript off, replaced by the gallery's own measurement when
 * the height message arrives (see `mobile-preview.tsx`).
 */
function PhoneDemo({ lang, demo, frameLabel }: { lang: Locale; demo: MobileDemo; frameLabel: string }) {
  // The frame's name is in the PAGE's language: a screen reader reads it from
  // the surrounding document, not from inside the canvas.
  const name = `${demo.title[lang]} — ${frameLabel}`;
  return (
    // No `min-h-0`: that cancelled the phone variant's own `min-h-[44rem]`, and
    // with it the reason that class exists. A demo is one control, so the bezel
    // collapsed to a letterbox around a single field — and then GREW when the
    // control opened a dropdown, so the page shifted under the reader's finger.
    // A phone is a fixed shape; content that outgrows it scrolls inside it.
    <Frame device="phone" label={name}>
      <MobilePreview
        lightSrc={galleryUrl(demo.id, lang, "light")}
        darkSrc={galleryUrl(demo.id, lang, "dark")}
        title={name}
      />
    </Frame>
  );
}

/** A Latin identifier — a widget name, a parameter, an enum value — as an island. */
function Code({ children }: { children: string }) {
  return (
    <code
      dir="ltr"
      lang="en"
      data-lumo-latn=""
      className="rounded-md border border-border bg-surface-sunken px-1.5 py-0.5 text-xs text-fg"
    >
      {children}
    </code>
  );
}

export default async function MobileComponentPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: raw, slug } = await params;
  const lang = assertLocale(raw);
  const demo = await catalogById(slug);
  const mobile = loadMobileDemos(slug);
  if (demo === undefined || mobile === undefined) notFound();

  const t = site[lang];
  const c = COPY[lang];

  const first = mobile.demos[0];
  if (first === undefined) {
    // The loader refuses an empty slug, so this is a contract break, not a state.
    throw new Error(`[mobile docs] ${slug}: no demos survived loading.`);
  }

  /*
   * Everything is highlighted in this ONE server pass and handed to `CodePanel`
   * as elements — never as `html`/`code` strings to a client module, the same
   * discipline as the Web page's flight-payload note. `sourcePanel` is ONE
   * element placed twice (the Code tab and the first demo's card).
   */
  // The snippet is localized like the copy around it: an English reader copies
  // English Dart, a Persian reader copies Persian Dart, and neither sees the
  // gallery's own `t['key']` indirection.
  const sources = await Promise.all(mobile.demos.map((d) => highlight(d.source[lang], "dart")));
  const firstSource = sources[0] ?? "";
  const sourcePanel = (
    <CodePanel html={firstSource} label={c.copySource} copiedLabel={c.sourceCopied} isPageSource />
  );

  /*
   * A GIT-PINNED dependency, at the tag this monorepo is on — the version is
   * read from the root package.json at build time, never typed here, so the
   * page and the release cannot disagree.
   */
  const dependency = [
    "dependencies:",
    `  ${MOBILE_PACKAGE}:`,
    "    git:",
    `      url: ${MOBILE_REPO_URL}`,
    `      ref: v${MOBILE_VERSION}`,
    `      path: ${MOBILE_PACKAGE_PATH}`,
  ].join("\n");
  const dependencyHtml = await highlight(dependency, "yaml");

  const rootSnippet = [
    "import 'package:flutter/material.dart';",
    `import 'package:${MOBILE_PACKAGE}/${MOBILE_PACKAGE}.dart';`,
    "",
    "MaterialApp(",
    "  theme: lumoThemeData(brightness: Brightness.light),",
    "  darkTheme: lumoThemeData(brightness: Brightness.dark),",
    "  builder: (context, child) => LumoScope(",
    `    locale: '${lang}',`,
    "    child: child!,",
    "  ),",
    "  home: const HomePage(),",
    ");",
  ].join("\n");
  const rootHtml = await highlight(rootSnippet, "dart");

  /*
   * `blob` for a file, `tree` for the directory: when a family's semantics tests
   * live in the package-wide suite instead of its own file, the loader hands
   * back the directory, and a `blob` URL for a directory is a 404 dressed as
   * evidence.
   */
  const testHref = `${MOBILE_REPO_BROWSE}/${mobile.hasOwnTest ? "blob" : "tree"}/v${MOBILE_VERSION}/${mobile.testPath}`;

  const railItems = [
    { id: "preview", label: c.rail.preview },
    { id: "installation", label: c.rail.installation },
    ...mobile.demos.map((d) => ({ id: `demo-${d.id}`, label: d.title[lang] })),
    { id: "contract", label: c.rail.contract },
    { id: "api", label: c.rail.api },
    { id: "caveats", label: c.rail.caveats },
    { id: "evidence", label: c.rail.evidence },
  ];

  return (
    <SiteShell lang={lang} path={`components/${slug}/mobile/`} wide>
      {/* The Web page's three columns, unchanged: nav, content, rail. */}
      <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)_14rem]">
        <aside className="hidden lg:block">
          <div data-docs-sidebar-scroll="" className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto pe-2">
            <DocsSidebar lang={lang} active={slug} />
          </div>
        </aside>

        {/* The narrow-viewport path, as on the Web page: below 1024px this
            native `<details>` is the only navigation to the other components. */}
        <details className="group -mx-6 border-be border-border px-6 pbe-4 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-md py-2 text-sm font-medium text-fg [&::-webkit-details-marker]:hidden">
            {c.browseComponents}
            <span aria-hidden="true" className="text-fg-muted transition-transform group-open:rotate-90">
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
              <p className="text-sm font-medium text-fg-muted">{c.platform}</p>
              <h1 className="text-3xl font-semibold tracking-tight text-fg">{demo.title[lang]}</h1>
              <p className="mt-2 max-w-2xl text-fg-muted">{demo.intro[lang]}</p>
            </div>
            {/* The toolbar row, on the end side: the platform switch. */}
            <div className="ms-auto flex shrink-0 items-center gap-2">
              <PlatformSwitch lang={lang} slug={slug} platform="mobile" />
            </div>
          </header>

          <section id="preview" className="mt-8 scroll-mt-24">
            {/*
             * Preview | Code, the Web page's pair. The Code panel is force-mounted
             * so the Dart source is in the served bytes for a no-JS reader — the
             * one part of this page a reader can still use with the engine blocked.
             */}
            <Tabs>
              <TabList label={c.previewOrCode}>
                <Tab id="preview">{t.preview}</Tab>
                <Tab id="code">{t.code}</Tab>
              </TabList>
              <TabPanel id="preview" className="mt-4">
                <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-bg p-6 sm:p-10">
                  <PhoneDemo lang={lang} demo={first} frameLabel={c.frameLabel} />
                  <p className="max-w-xl text-center text-xs text-fg-muted">{c.previewNote}</p>
                </div>
              </TabPanel>
              <TabPanel id="code" shouldForceMount className="mt-4 data-inert:hidden">
                {sourcePanel}
              </TabPanel>
            </Tabs>
          </section>

          <section id="installation" className="mt-8 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
              {c.rail.installation}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-fg-muted">{c.installIntro}</p>
            <div className="mt-3">
              <CodePanel html={dependencyHtml} label={c.copyDependency} copiedLabel={c.dependencyCopied} />
            </div>
            <p className="mt-4 max-w-2xl text-sm text-fg-muted">{c.scopeIntro}</p>
            <div className="mt-3">
              <CodePanel html={rootHtml} label={c.copyScope} copiedLabel={c.scopeCopied} />
            </div>
          </section>

          {/*
           * The worked demos, in the same order as the rail. The FIRST demo's
           * card is source-only: the preview above already IS its render, and a
           * second frame would be a second engine handshake for the same widget.
           */}
          {mobile.demos.map((d, index) => (
            <ExampleCard
              key={d.id}
              id={`demo-${d.id}`}
              title={d.title[lang]}
              // Generated copy: its Latin identifiers are islanded here, because
              // the manifest has nowhere to mark them. See `generated-text.tsx`.
              description={<GeneratedText text={d.description[lang]} locale={lang} />}
              html={sources[index] ?? ""}
              viewLabel={c.exampleView}
              hideLabel={c.exampleHide}
              copyLabel={c.exampleCopy}
              copiedLabel={c.exampleCopied}
            >
              {index > 0 ? (
                <div className="flex w-full flex-col items-center">
                  <PhoneDemo lang={lang} demo={d} frameLabel={c.frameLabel} />
                </div>
              ) : undefined}
            </ExampleCard>
          ))}

          <section id="contract" className="mt-10 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
              {c.rail.contract}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-fg-muted">{c.contractIntro}</p>
            <ul className="mt-3 flex max-w-2xl flex-col gap-2">
              {c.contractPoints.map((point) => (
                <li key={point} className="rounded-lg border border-border bg-surface p-3 text-sm text-fg-muted">
                  {point}
                </li>
              ))}
            </ul>
          </section>

          <section id="api" className="mt-10 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">{c.rail.api}</h2>
            <p className="mt-2 max-w-2xl text-sm text-fg-muted">
              {mobile.api.length > 0 ? c.apiIntro : c.apiNotAWidget}
            </p>

            {mobile.api.length > 0 ? (
              <>
            <h3 className="mt-4 text-xs font-medium uppercase tracking-wide text-fg-subtle">
              {c.announcedHeading}
            </h3>
            {mobile.announced.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {mobile.announced.map((a) => (
                  <li key={`${a.widget}.${a.name}`}>
                    <Code>{`${a.widget}.${a.name}`}</Code>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 max-w-2xl text-sm text-fg-muted">{c.noAnnounced}</p>
            )}

            <div className="mt-4">
              <PropsTable
                groups={mobile.api}
                propHeader={c.propHeader}
                typeHeader={c.typeHeader}
                descriptionHeader={c.descriptionHeader}
                requirementHeader={c.requirementHeader}
                requiredLabel={c.requiredLabel}
                optionalLabel={c.optionalLabel}
              />
            </div>

            {mobile.enums.length > 0 ? (
              <>
                <h3 className="mt-6 text-xs font-medium uppercase tracking-wide text-fg-subtle">
                  {c.enumsHeading}
                </h3>
                <dl className="mt-2 flex flex-col gap-2">
                  {mobile.enums.map((e) => (
                    <div key={e.name} className="flex flex-wrap items-baseline gap-2">
                      <dt>
                        <Code>{e.name}</Code>
                      </dt>
                      <dd className="flex flex-wrap gap-1.5">
                        {e.values.map((value) => (
                          <Code key={value}>{value}</Code>
                        ))}
                      </dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : null}
              </>
            ) : null}
          </section>

          <section id="caveats" className="mt-10 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
              {c.rail.caveats}
            </h2>
            <ul className="mt-3 flex max-w-2xl flex-col gap-2">
              {c.caveatPoints.map((point) => (
                <li key={point} className="rounded-lg border border-border bg-surface p-3 text-sm text-fg-muted">
                  {point}
                </li>
              ))}
            </ul>
          </section>

          <section id="evidence" className="mt-10 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
              {c.rail.evidence}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-fg-muted">{c.evidenceIntro}</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              <li>
                {/*
                 * The link's TEXT is the page's language; the path beside it is a
                 * Latin island. `hasOwnTest` decides which of the two names is
                 * used, so the page never promises a file that is not there.
                 */}
                <a
                  href={testHref}
                  className="text-accent underline-offset-4 hover:underline"
                >
                  {mobile.hasOwnTest ? c.testLink : c.testsLink}
                </a>{" "}
                <Code>{mobile.testPath}</Code>
              </li>
              <li>
                <Link
                  href={`/${segmentFor(lang)}/components/${slug}/`}
                  className="text-accent underline-offset-4 hover:underline"
                >
                  {c.webLink}
                </Link>
              </li>
              {/* Where the props table above was generated FROM — stated, not implied. */}
              <li className="text-fg-muted">
                {c.generatedFrom}{" "}
                {mobile.files.map((file) => (
                  <Code key={file}>{file}</Code>
                ))}
              </li>
            </ul>
          </section>
        </article>

        <OnThisPage lang={lang} items={railItems} />
      </div>
    </SiteShell>
  );
}
