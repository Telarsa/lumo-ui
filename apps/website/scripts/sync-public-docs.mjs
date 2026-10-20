import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { execFileSync } from "node:child_process";

// Explicitly invoked snapshot refresh; ordinary builds never run it.
//
// The source is the documentation app this site replaced. Since 9 October 2026
// the site lives in the same repository at `apps/website`, so the original
// pages no longer exist in the working tree: they are read from git history at
// the recorded source commit (or a ref passed as the first argument), from this
// repository or another clone passed as the second. Sources are read-only.
const appRoot = resolve(import.meta.dirname, "..");
const previous = JSON.parse(readFileSync(resolve(appRoot, "docs/public-docs-snapshot.json"), "utf8"));
const ref = process.argv[2] || previous.sourceCommit;
const sourceRoot = resolve(process.argv[3] || resolve(appRoot, "../.."));
const show = (path) => execFileSync("git", ["-C", sourceRoot, "show", `${ref}:${path}`], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
const slugs = ["getting-started", "contract", "helpers", "dates", "gate", "mobile"];
const files = [
  "src/app/[locale]/docs/page.tsx", "src/app/[locale]/docs/layout.tsx",
  ...slugs.map((slug) => `src/app/[locale]/docs/${slug}/page.tsx`),
  "src/components/site/docs.tsx", "src/components/site/docs-sidebar.tsx",
  "src/components/site/dates-demo.tsx", "src/lib/docs-order.ts",
  "src/lib/site-strings.ts", "src/lib/chrome.ts",
];

// Durable URLs come from the original authored section keys and positions,
// never translated headings or inferred slugs. A changed source must be
// reviewed rather than silently receive different public section targets.
const sectionPlan = {
  "getting-started": [
    ["<Section title={t.s1}>", "installation"],
    ["<Section title={t.s2}>", "styles"],
    ["<Section title={t.s3}>", "wiring"],
    ["<Section title={t.s4}>", "grade"],
  ],
  contract: [["<Section>", "overview"], ["<Section title={t.divergeTitle}>", "divergence"], ["<Section title={t.versionTitle}>", "versioned"]],
  helpers: [
    ["<Section title={t.islandsTitle}>", "latin-islands"],
    ["<Section title={t.numbersTitle}>", "numbers"],
    ['<Section title={<span data-lumo-latn dir="ltr">{t.doctorTitle}</span>}>', "doctor"],
    ['<Section title={<span data-lumo-latn dir="ltr">{t.fixTitle}</span>}>', "fix"],
  ],
  dates: [["<Section title={t.demoTitle}>", "demo"], ["<Section title={t.usageTitle}>", "usage"], ["<Section title={t.boundaryTitle}>", "boundary"], ["<Section title={t.provedTitle}>", "proof"], ["<Section title={t.fixedTitle}>", "fixed-date"]],
  gate: [["<Section title={t.rulesTitle}>", "rules"], ["<Section title={t.floorsTitle}>", "floors"], ["<Section title={t.runTitle}>", "run"], ["<Section title={t.artifactTitle}>", "artifact"]],
  mobile: [["<Section>", "overview"], ["<Section>", "contract"], ["<Section title={t.installTitle}>", "installation"], ["<Section title={t.rulesTitle}>", "rules"], ["<Section title={t.galleryTitle}>", "gallery"]],
};

function replaceRequired(text, before, after, path) {
  if (!text.includes(before)) throw new Error(`Original documentation adaptation target missing in ${path}: ${before}`);
  return text.replace(before, after);
}

function adapt(path, text) {
  const slug = path.match(/^src\/app\/\[locale\]\/docs\/([^/]+)\/page\.tsx$/)?.[1];
  if (slug && sectionPlan[slug]) {
    const plan = sectionPlan[slug];
    if ((text.match(/<Section(?:\s|>)/g) || []).length !== plan.length) throw new Error(`Original section count changed in ${path}`);
    let previousPosition = -1;
    // Track the untouched source positions before injecting attributes. The
    // repeated untitled mobile sections are intentional authored positions.
    for (const [opening] of plan) {
      const position = text.indexOf(opening, previousPosition + 1);
      if (position < 0) throw new Error(`Original section order changed in ${path}`);
      previousPosition = position;
    }
    text = 'import { CHROME } from "@/lib/chrome";\n' + text;
    for (const [opening, id] of plan) text = replaceRequired(text, opening,
      opening.replace("<Section", `<Section id="${id}" permalinkLabel={CHROME[locale].docs.sectionLink}`), path);
  }
  if (path === "src/lib/chrome.ts") text = text
    .replace('"onThisSite": "Auf dieser Website"', '"onThisSite": "Auf dieser Website",\n    "sectionLink": "Link zu diesem Abschnitt"')
    .replace('onThisSite: "در این سایت",', 'onThisSite: "در این سایت",\n      sectionLink: "پیوند به این بخش",')
    .replace('onThisSite: "On this site",', 'onThisSite: "On this site",\n      sectionLink: "Link to this section",');
  if (path.endsWith("site/docs.tsx")) {
    text = replaceRequired(text,
      'export function Section({ title, id, children }: { title?: ReactNode; id?: string; children: ReactNode }) {',
      'export function Section({ title, id, permalinkLabel, children }: { title?: ReactNode; id?: string; permalinkLabel?: string; children: ReactNode }) {', path);
    text = replaceRequired(text, '{title ? <h2 className="doc-h2">{title}</h2> : null}',
      '{title ? <div className="doc-heading"><h2 className="doc-h2" id={id ? `${id}-title` : undefined}>{title}</h2>{id && permalinkLabel ? <a className="doc-permalink" href={`#${id}`} aria-labelledby={`${id}-title ${id}-permalink-label`}><span className="doc-visually-hidden" id={`${id}-permalink-label`}>{permalinkLabel}</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" focusable="false"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2m3 6a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2" /></svg></a> : null}</div> : null}', path);
  }
  if (path.endsWith("docs/helpers/page.tsx")) {
    for (const [before, after] of [
      ["Jede sichtbare Zahl verwendet formatNumber. Das Zahlensystem kommt aus der Spracheinstellung und wird nicht unbemerkt von ICU übernommen. So stimmen die Ergebnisse über Laufzeitumgebungen hinweg überein.", "Jede sichtbare Zahl verwendet formatNumber. formatLocale setzt für fa-Sprachen den persischen Kalender und erweiterte arabisch-indische Ziffern ausdrücklich, für ar-SA den Umm al-Qura-Kalender. Andere Tags verwenden die Intl/CLDR-Vorgaben; vom Aufrufer gesetzte -u-Erweiterungen bleiben erhalten. Die Ergebnisse hängen von der Intl-Unterstützung der Laufzeit ab."],
      ["هر عددی که خواننده می‌بیند از formatNumber می‌گذرد. سیستم شماره از locale می‌آید و هرگز از ICU ارث نمی‌رسد؛ روی هر runtime یک جواب.", "اعداد دیدنی با قالب‌بندی لومو نمایش داده می‌شوند. پروفایل فارسی تقویم هجری خورشیدی و ارقام فارسی را صریح تنظیم می‌کند و پروفایل عربی عربستان تقویم ام‌القری را. زبان‌های دیگر از پیش‌فرض‌های داده‌های بین‌المللیِ زمان اجرا استفاده می‌کنند؛ افزونه‌های زبانیِ تعیین‌شده توسط برنامه حفظ می‌شوند. نتیجه به پشتیبانیِ قالب‌بندی بین‌المللی در زمان اجرا وابسته است."],
      ["Every number a reader sees goes through formatNumber. The numbering system comes from the locale and is never inherited from ICU; one answer on every runtime.", "Every visible number uses formatNumber. formatLocale explicitly sets the Persian calendar and extended Arabic-Indic digits for fa locales, and the Umm al-Qura calendar for ar-SA. Other tags use Intl/CLDR defaults; caller-supplied -u- extensions are preserved. Results depend on the runtime’s Intl support."],
      ["Prüft, ob lumo-ui/config tatsächlich in ESLint eingebunden ist.", "Sucht im Text der Konfigurationsdatei nach lumo-ui/config/eslint; die tatsächlich wirksame ESLint-Konfiguration wird nicht ausgewertet."],
      ["این‌که lumo-ui/config واقعاً در پیکربندی ESLint باشد.", "متن پروندهٔ پیکربندی را برای lumo-ui/config/eslint جست‌وجو می‌کند؛ پیکربندی مؤثر ESLint را ارزیابی نمی‌کند."],
      ["That lumo-ui/config is actually in the ESLint configuration.", "Searches the configuration file text for lumo-ui/config/eslint; it does not evaluate the effective ESLint configuration."],
    ]) text = replaceRequired(text, before, after, path);
    text = replaceRequired(text, "const T = {", 'function lintDescription(value: string) {\n  const identifier = "lumo-ui/config/eslint";\n  const position = value.indexOf(identifier);\n  return position < 0 ? value : <>{value.slice(0, position)}<Id>{identifier}</Id>{value.slice(position + identifier.length)}</>;\n}\n\nconst T = {', path);
    text = replaceRequired(text, '<Table firstMono rows={t.checks.map(([k, v]) => [<Id key={k}>{k}</Id>, v])} />', '<Table firstMono rows={t.checks.map(([k, v]) => [<Id key={k}>{k}</Id>, lintDescription(v)])} />', path);
  }
  // Horizontal listings and tables must be reachable for keyboard scrolling.
  // This changes renderer furniture only; authored examples remain intact.
  if (path.endsWith("site/docs.tsx")) text = text
    .replace('<pre data-lumo-latn dir="ltr">', '<pre data-lumo-latn dir="ltr" tabIndex={0}>')
    .replace('<div className="table-wrap">', '<div className="table-wrap" tabIndex={0}>');
  if (path.endsWith("docs/gate/page.tsx")) {
    text = text.replace('<div className="table-wrap">', '<div className="table-wrap" tabIndex={0}>');
    text = replaceRequired(text, "lumo gate ./out gate.floors.json", "pnpm exec lumo gate ./out gate.floors.json", path);
    text = replaceRequired(text, "node scripts/grade-app.mjs .next/server/app", "node node_modules/lumo-ui/scripts/grade-app.mjs .next/server/app", path);
    // The public v1.0.0 tag predates the later IDREF and staging fixes:
    // packages/gate/src/rules.ts exempts react-aria-* and
    // scripts/grade-app.mjs copies colliding destinations without a guard.
    // Keep these release-specific adaptations separate from the frozen corpus.
    for (const [before, after] of [
      ['  "streaming": "Von React', '  "idrefNote": "In `v1.0.0` sind nicht aufgelöste Verweise mit dem Präfix `react-aria-` von `resolved-idrefs` ausgenommen. Prüfen Sie diese Verweise zusätzlich manuell.",\n  "stageNote": "`grade-app` kann in `v1.0.0` eine `index.html` im Wurzelverzeichnis und `fa/index.html` am selben Ziel ablegen; dabei wird eine Datei überschrieben. Prüfen Sie beide Dateien getrennt.",\n  "streaming": "Von React'],
      ['    streaming: "قطعه', '    idrefNote: "در `v1.0.0`، ارجاع‌های حل‌نشده با پیشوند `react-aria-` از قانون `resolved-idrefs` مستثنا هستند؛ آن‌ها را دستی هم بررسی کنید.",\n    stageNote: "در `v1.0.0`، `grade-app` ممکن است `index.html` ریشه و `fa/index.html` را در یک مقصد قرار دهد و یکی را بازنویسی کند. هر دو فایل را جداگانه بررسی کنید.",\n    streaming: "قطعه'],
      ['    streaming: "React', '    idrefNote: "In `v1.0.0`, unresolved references beginning with `react-aria-` are exempt from `resolved-idrefs`. Review those references manually.",\n    stageNote: "In `v1.0.0`, `grade-app` can stage a root `index.html` and a locale `fa/index.html` to the same destination, overwriting one. Grade those files separately to ensure both are checked.",\n    streaming: "React'],
    ]) text = replaceRequired(text, before, after, path);
    text = replaceRequired(text, "const T = {", 'function releaseNote(value: string) {\n  return value.split(/(`[^`]+`)/g).map((part, index) =>\n    part.startsWith("`") && part.endsWith("`") ? <code key={index} data-lumo-latn dir="ltr">{part.slice(1, -1)}</code> : part,\n  );\n}\n\nconst T = {', path);
    text = replaceRequired(text, "<p>{t.streaming}</p>", "<p>{t.streaming}</p>\n          <p>{releaseNote(t.idrefNote)}</p>", path);
    text = replaceRequired(text, "<Callout>{t.stubs}</Callout>", "<Callout>{t.stubs}</Callout>\n        <Callout>{releaseNote(t.stageNote)}</Callout>", path);
  }
  if (path.endsWith("docs/getting-started/page.tsx")) {
    text = replaceRequired(text, "lumo gate ./out gate.floors.json", "pnpm exec lumo gate ./out gate.floors.json", path);
    text = replaceRequired(text, "pnpm add -D ${INSTALL_SPEC}", "pnpm add ${INSTALL_SPEC}", path);
  }
  if (path.endsWith("docs/layout.tsx")) text = 'import "../../docs.css";\n' + text.replace('className="shell docs"', 'className="container docs"');
  if (path.endsWith("docs-sidebar.tsx")) text = text
    .replace("const pathname = usePathname();", 'const pathname = usePathname().replace(/\\/$/, "") + "/";')
    .replace('import { CHROME } from "@/lib/chrome";', 'import { useEffect, useRef } from "react";\nimport { revealCurrentNavigationLink, revealFocusedNavigationLink } from "@/lib/navigation-focus";\nimport { CHROME } from "@/lib/chrome";')
    .replace('  const c = CHROME[locale].docs;', '  const c = CHROME[locale].docs;\n  const sideRef = useRef<HTMLElement>(null);\n  useEffect(() => {\n    const rail = sideRef.current?.querySelector("ol");\n    const current = rail?.querySelector<HTMLElement>("a[aria-current=page]");\n    if (current && rail) revealCurrentNavigationLink(current, rail);\n  }, [pathname]);')
    .replace('<nav className="docs__side"', '<nav ref={sideRef} className="docs__side"')
    .replaceAll('<Link href=', '<Link onFocus={(event) => revealFocusedNavigationLink(event.currentTarget, event.currentTarget.closest("ol"))} href=');
  if (path.endsWith("docs/mobile/page.tsx")) text = text.replace('className="grid gap-4 sm:grid-cols-3"', 'className="docs-card-grid"');
  if (path.endsWith("dates-demo.tsx")) text = text
    .replace(
      " * The whole pitch in one component: the Calendar below is shadcn's copy,\n * untouched. The four props from `lumoCalendar()` are what make it count in the",
      " * The Calendar preserves the public example's DayPicker behaviour with a\n * site-owned semantic CSS skin. The four props from `lumoCalendar()` count in the",
    )
    .replace("          selected={selectedDate}", "          selected={selectedDate}\n          defaultMonth={selectedDate}");
  if (path.endsWith("dates-demo.tsx")) {
    text = replaceRequired(text, 'import { formatDate } from "lumo-ui/core";', 'import { direction, formatDate } from "lumo-ui/core";', path);
    text = replaceRequired(text, '        <Calendar\n          mode="single"', '        <Calendar\n          dir={direction(locale)}\n          mode="single"', path);
  }
  if (path.endsWith("docs/dates/page.tsx")) text = text
    .replace(
      "Der Kalender ist die shadcn-Kopie. Das Kalenderverhalten wird als Props übergeben. Ansagen für Navigation und Zellen sind vollständig angegeben: integrierte Sprachen verwenden stringsFor, Deutsch verwendet einen eigenen vollständigen Textsatz.",
      "Dieses Beispiel behält das Kalenderverhalten von DayPicker mit der Gestaltung dieser Website. Lumo liefert die Kalender-Props und die erforderlichen Ansagen für Navigation und Zellen. Integrierte Sprachen verwenden stringsFor; Deutsch verwendet einen eigenen vollständigen Textsatz.",
    )
    .replace(
      "تقویم بالا کپیِ shadcn است؛ جلالی‌بودنش از بیرون می‌آید، به‌شکل prop. رشته‌های اعلانی — نام ماه‌بر، سلول‌ها — الزامی‌اند و از stringsFor می‌آیند؛ زبانِ بدون رشته، خطای کامپایل است.",
      "نمونهٔ بالا رفتار همان انتخابگر تاریخ را با ظاهر اختصاصی این سایت حفظ می‌کند؛ تنظیمات تقویم و نام‌های الزامی راهبری و سلول‌ها از لومو می‌آیند. زبان‌های داخلی از رشته‌های آماده و آلمانی از مجموعهٔ کامل اختصاصی استفاده می‌کند.",
    )
    .replace(
      "The calendar above is the shadcn copy; the Jalali behaviour arrives from outside, as props. The announced strings — the nav, the cells — are required and come from stringsFor; a language without them is a compile error.",
      "This example preserves DayPicker’s calendar behaviour with this website’s visual styling. Lumo supplies the calendar props and required navigation and cell names. Built-in languages use stringsFor; German supplies a complete custom set.",
    );
  if (path.endsWith("docs/dates/page.tsx")) {
    text = replaceRequired(text, 'import { stringsFor } from "lumo-ui/core";', 'import { direction, stringsFor } from "lumo-ui/core";', path);
    text = replaceRequired(text, '<Calendar dateLib={dateLib} formatters={formatters}', '<Calendar dir={direction(locale)} dateLib={dateLib} formatters={formatters}', path);
    text = replaceRequired(text, "const strings = stringsFor(locale);", 'const locale = "fa-IR";\nconst strings = stringsFor(locale);', path);
    for (const [before, after] of [
      ['"usageTitle": "Verwendung",', '"usageTitle": "Verwendung",\n  "usageNote": "Dieses Beispiel verwendet fa-IR. Für andere Tags als fa-IR und en-US muss die Anwendung einen vollständigen eigenen Textsatz an stringsFor übergeben.",'],
      ['usageTitle: "استفاده",', 'usageTitle: "استفاده",\n    usageNote: "این نمونه از fa-IR استفاده می‌کند. برای برچسبی جز fa-IR و en-US، برنامه باید مجموعهٔ کامل رشته‌های خود را به stringsFor بدهد.",'],
      ['usageTitle: "Usage",', 'usageTitle: "Usage",\n    usageNote: "This example uses fa-IR. For tags other than fa-IR and en-US, pass your application’s complete string set to stringsFor.",'],
    ]) text = replaceRequired(text, before, after, path);
    text = replaceRequired(text, '<Code caption="calendar.tsx">{USAGE}</Code>', '<Code caption="calendar.tsx">{USAGE}</Code>\n        <Prose><p>{t.usageNote}</p></Prose>', path);
  }
  // These sentences refer to the original public example, rather than this
  // website. Technical instructions remain intact.
  if (path.endsWith("docs/getting-started/page.tsx")) text = text
    .replace("Der öffentliche Quelltext dieser Website zeigt das Vorgehen.", "Der öffentliche Quelltext der ursprünglichen Lumo-Dokumentationswebsite zeigt das Vorgehen.")
    .replace("همین سایت همین کار را می‌کند و کد منبعش عمومی است.", "سایت مرجع عمومی لومو همین کار را می‌کند و کد منبع آن در مخزن عمومی موجود است.")
    .replace("this very site does exactly that, and its source is public.", "the original public Lumo documentation website demonstrates this in its public source.");
  if (path.endsWith("docs/contract/page.tsx")) text = text
    .replace("Diese Website setzt den Vertrag selbst um:", "Die ursprüngliche öffentliche Dokumentationswebsite setzt den Vertrag selbst um:")
    .replace("همین سایت اجرای همین قرارداد است:", "سایت مستندات مرجع عمومی، اجرای همین قرارداد است:")
    .replace("This site is the contract executing itself:", "The original public documentation website demonstrates this contract:");
  // Each docs page carries this website's Open Graph/Twitter card with its
  // language alternates (9 Oct 2026); title and description are unchanged.
  if (/docs\/(?:[^/]+\/)?page\.tsx$/.test(path)) text = text
    .replace(/^(import \{.*)\balternatesFor\b(.*\} from "@\/lib\/site";)$/m, "$1pageMetadata$2")
    .replace(/return \{ title: (.*?), description: (.*?), alternates: alternatesFor\(locale, (.*?)\) \};/, "return pageMetadata(locale, $3, $1, $2);");
  return text;
}

// Validate and prepare the entire corpus and its provenance before touching a
// destination: a later source drift must not leave an earlier page refreshed.
const prepared = files.map((path) => {
  const original = show(`apps/website/${path}`);
  const adapted = adapt(path, original);
  return { adapted, record: { source: `apps/website/${path}`, destination: path, sourceSha256: createHash("sha256").update(original).digest("hex"), adaptedSha256: createHash("sha256").update(adapted).digest("hex") } };
});
const records = prepared.map(({ record }) => record);
const nextSnapshot = JSON.stringify({
  sourceRepository: "https://github.com/Telarsa/lumo-ui",
  sourceCommit: execFileSync("git", ["-C", sourceRoot, "rev-parse", `${ref}^{commit}`], { encoding: "utf8" }).trim(),
  sourcePackageVersion: JSON.parse(show("package.json")).version,
  licence: "MIT", snapshotDate: "2026-10-05", locales: ["en", "de", "fa"],
  routes: ["/docs/", ...slugs.map((slug) => `/docs/${slug}/`)], files: records,
}, null, 2) + "\n";
for (const { adapted, record } of prepared) {
  const target = resolve(appRoot, record.destination);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, adapted);
}
writeFileSync(resolve(appRoot, "docs/public-docs-snapshot.json"), nextSnapshot);
console.log(`Restored ${records.length} licensed public docs sources, with all authored EN/DE/FA content.`);
