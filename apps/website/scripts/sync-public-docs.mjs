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

function adapt(path, text) {
  if (path.endsWith("docs/layout.tsx")) text = 'import "../../docs.css";\n' + text.replace('className="shell docs"', 'className="container docs"');
  if (path.endsWith("docs-sidebar.tsx")) text = text.replace("const pathname = usePathname();", 'const pathname = usePathname().replace(/\\/$/, "") + "/";');
  if (path.endsWith("docs/mobile/page.tsx")) text = text.replace('className="grid gap-4 sm:grid-cols-3"', 'className="docs-card-grid"');
  if (path.endsWith("dates-demo.tsx")) text = text
    .replace(
      " * The whole pitch in one component: the Calendar below is shadcn's copy,\n * untouched. The four props from `lumoCalendar()` are what make it count in the",
      " * The Calendar preserves the public example's DayPicker behaviour with a\n * site-owned semantic CSS skin. The four props from `lumoCalendar()` count in the",
    )
    .replace("          selected={selectedDate}", "          selected={selectedDate}\n          defaultMonth={selectedDate}");
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

const records = files.map((path) => {
  const original = show(`apps/website/${path}`);
  const adapted = adapt(path, original);
  const target = resolve(appRoot, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, adapted);
  return { source: `apps/website/${path}`, destination: path, sourceSha256: createHash("sha256").update(original).digest("hex"), adaptedSha256: createHash("sha256").update(adapted).digest("hex") };
});
writeFileSync(resolve(appRoot, "docs/public-docs-snapshot.json"), JSON.stringify({
  sourceRepository: "https://github.com/Telarsa/lumo-ui",
  sourceCommit: execFileSync("git", ["-C", sourceRoot, "rev-parse", `${ref}^{commit}`], { encoding: "utf8" }).trim(),
  sourcePackageVersion: JSON.parse(show("package.json")).version,
  licence: "MIT", snapshotDate: "2026-10-05", locales: ["en", "de", "fa"],
  routes: ["/docs/", ...slugs.map((slug) => `/docs/${slug}/`)], files: records,
}, null, 2) + "\n");
console.log(`Restored ${records.length} licensed public docs sources, with all authored EN/DE/FA content.`);
