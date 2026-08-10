import type { Locale, LumoNode } from "@lumo-ui/core";
import { assertLocale, localeParams } from "@/lib/locale";
import { highlight } from "@/lib/highlight";
import { CLI_COMMAND, PMS } from "@/lib/install-commands";
import { Bullets, DocSection, DocsShell, P, Snippet, Term } from "../docs-shell";

/**
 * /docs/cli — the real tooling: the add command, the registry, the vendor
 * script and `verify`.
 *
 * The add commands are BUILT from the same `CLI_COMMAND` table the install
 * tabs render, so this page cannot drift from what the component pages say.
 * The verify chain and what each gate proves are README.md's own table; the
 * vendor workflow is `scripts/vendor-from-shadcn.mjs`'s own header.
 */

const VENDOR_CMD = `node scripts/vendor-from-shadcn.mjs chart slider pagination`;

const VERIFY_CMD = `pnpm verify
# gate:types → gate:no-css-modules → gate:test → gate:registry → gate:smoke → gate:html`;

/** One page per locale, prerendered — the same params every [lang] leaf declares. */
export function generateStaticParams() {
  return localeParams;
}

/** Section ids in reading order; the rail and the headings both derive from it. */
const SECTIONS = ["add", "registry", "vendor", "verify"] as const;
type SectionId = (typeof SECTIONS)[number];

/** One `Bullets` row. */
interface Item {
  key: string;
  body: LumoNode;
}

/**
 * Page copy as a `Record<Locale, …>` rather than `lang === "fa-IR" ? … : …`.
 * A ternary compiles with a third locale in the union and silently serves it the
 * English branch; this makes the same addition a compile error. See the rule in
 * CONTRIBUTING's "Adding a locale".
 */
interface PageCopy {
  title: string;
  intro: string;
  heading: Record<SectionId, string>;
  body: {
    addCommand: LumoNode;
    /** Two paragraphs: how the manifest is generated, then what smoke adds. */
    registryManifest: LumoNode;
    registrySmoke: LumoNode;
    /** Two paragraphs around the vendor command, then the per-file checklist. */
    vendorRule: LumoNode;
    vendorCommits: LumoNode;
    vendorChecklist: readonly Item[];
    verifyIntro: LumoNode;
    verifyGates: readonly Item[];
  };
}

const COPY = {
  "fa-IR": {
    title: "خط فرمان",
    intro: "دستور نصب، رجیستری، اسکریپت وندورکردن از shadcn، و زنجیرهٔ verify.",
    heading: {
      add: "دستور add",
      registry: "رجیستری",
      vendor: "وندورکردن از shadcn",
      verify: "زنجیرهٔ verify",
    },
    body: {
      addCommand: (
        <>
          لومو ابزار خط فرمانِ خودش را نمی‌سازد؛ رجیستری‌اش با CLI خود shadcn سازگار است و همان
          دستورِ آشنا، فایل‌های آیتم را در پروژهٔ شما کپی می‌کند — با هر چهار مدیر بسته
          (pnpm اول، چون لومو pnpm-محور است):
        </>

      ),
      registryManifest: (
        <>
          <Term>registry.json</Term> — امروز ۸۵ آیتم — هرگز با دست نگه‌داری نمی‌شود؛{" "}
          <Term>scripts/build-registry.mjs</Term> آن را از روی کامپوننت‌هایی که واقعاً وجود
          دارند تولید می‌کند. دروازهٔ <Term>gate:registry</Term> همین تولید را دوباره اجرا
          می‌کند و با <Term>git diff --exit-code</Term> می‌سنجد: اگر مانیفست از کد قابلِ
          بازتولید نباشد، بیلد قرمز است.
        </>

      ),
      registrySmoke: (
        <>
          <Term>gate:smoke</Term> یک قدم جلوتر می‌رود: هر آیتم را همان‌طور که به دست
          مصرف‌کننده می‌رسد، بیرون از فضای کاری کامپایل می‌کند. همین تست یک باگ توزیعِ واقعی را
          گرفت — ماژول همراهی که از یک آیتم رجیستری جا افتاده بود و از درون فضای کاری از نظر
          ساختاری نامرئی بود.
        </>

      ),
      vendorRule: (
        <>
          قاعده: چیزی را که بالادست از قبل دارد، با دست تایپ نکن. shadcn سبکِ{" "}
          <Term>aria-vega</Term> را منتشر می‌کند — زیرش همان React Aria است که لومو اجاره کرده —
          پس بیشتر آنچه لازم می‌شود، آن‌جا آماده است:
        </>

      ),
      vendorCommits: (
        <>
          خروجیِ خام در یک کامیتِ جدا می‌نشیند و تغییرات لومو در کامیت دوم — تا{" "}
          <Term>git log -p</Term> نشان دهد چه چیزی مال ماست و چه چیزی مال آن‌ها، و{" "}
          <Term>shadcn add --diff</Term> بعدها بتواند تغییرات بالادست را نشان دهد. فایل
          وندورشده هیچ‌وقت با ورودش تمام نیست؛ هر کدام یک گذر لازم دارد:
        </>

      ),
      verifyIntro: "شش دروازه، به همان ترتیبی که اجرا می‌شوند — و هر کدام چیزی را ثابت می‌کند که قبلی نمی‌تواند:",
      vendorChecklist: [
        { key: "physical", body: (
            <>
              کلاس‌های فیزیکی (<Term>ml-</Term>، <Term>pr-</Term>، <Term>text-left</Term>) که
              باید منطقی شوند — <Term>shadcn migrate rtl</Term> بیشترش را مکانیکی انجام می‌دهد.
            </>

          ) },
        { key: "defaults", body: (
            <>
              پیش‌فرض‌های انگلیسی، مثل هر <Term>label = "Close"</Term>، که باید پراپ اجباری
              شوند.
            </>

          ) },
        { key: "numbers", body: (
            <>
              عددهای خام در JSX که <Term>LumoNode</Term> ردشان می‌کند و باید از{" "}
              <Term>formatNumber</Term> عبور کنند.
            </>

          ) },
        { key: "cn", body: (
            <>
              مسیر ایمپورت <Term>cn</Term>: بالادست از <Term>@/lib/utils</Term> می‌آورد، لومو
              از <Term>@lumo-ui/core</Term>.
            </>

          ) },
      ],
      verifyGates: [
        { key: "types", body: (
            <>
              <Term>gate:types</Term> — <Term>LumoNode</Term>، اتحادِ بستهٔ <Term>Locale</Term>،
              و هر پراپِ رشته‌ایِ اجباری.
            </>

          ) },
        { key: "nocss", body: (
            <>
              <Term>gate:no-css-modules</Term> — تصمیمِ استایل واقعی است، نه یک کامنت.
            </>

          ) },
        { key: "test", body: (
            <>
              <Term>gate:test</Term> — مجموعه‌های تست، از جمله فیکسچرهای سمیِ خودِ قاعده‌های
              دروازه.
            </>

          ) },
        { key: "registry", body: (
            <>
              <Term>gate:registry</Term> — مانیفست از کد قابل استخراج است، نه دست‌نگه‌داشته.
            </>

          ) },
        { key: "smoke", body: (
            <>
              <Term>gate:smoke</Term> — هر آیتم همان‌طور که مصرف‌کننده دریافتش می‌کند، بیرون از
              فضای کاری کامپایل می‌شود.
            </>

          ) },
        { key: "html", body: (
            <>
              <Term>gate:html</Term> — بایت‌هایی که واقعاً سرو می‌شوند درست‌اند: <Term>lang</Term>{" "}
              و <Term>dir</Term> هر مسیر، نبودِ ارقام لاتین در متنِ فارسی، کمینه‌ای از ارقام
              فارسی، نبودِ خطِ لاتین در صفت‌های خوانده‌شونده، نام‌داشتنِ هر کنترل، و نبودِ
              ارجاع‌های آویزان.
            </>

          ) },
      ],
    },
  },
  "en-US": {
    title: "CLI",
    intro: "The add command, the registry, the shadcn vendor script, and the verify chain.",
    heading: {
      add: "The add command",
      registry: "The registry",
      vendor: "Vendoring from shadcn",
      verify: "The verify chain",
    },
    body: {
      addCommand: (
        <>
          Lumo does not ship a CLI of its own; the registry is compatible with shadcn&rsquo;s,
          and the familiar command copies an item&rsquo;s files into your project — under any of
          the four package managers (pnpm first, because Lumo is pnpm-first):
        </>

      ),
      registryManifest: (
        <>
          <Term>registry.json</Term> — 85 items today — is never hand-kept:{" "}
          <Term>scripts/build-registry.mjs</Term> generates it from the components that actually
          exist. <Term>gate:registry</Term> re-runs that generation and checks it with{" "}
          <Term>git diff --exit-code</Term>: if the manifest is not reproducible from the code,
          the build is red.
        </>

      ),
      registrySmoke: (
        <>
          <Term>gate:smoke</Term> goes one step further: it compiles every item exactly as a
          consumer receives it, outside the workspace. That test caught a real distribution bug
          — a companion module missing from a registry item, structurally invisible from inside
          the workspace.
        </>

      ),
      vendorRule: (
        <>
          The rule: never hand-type a component upstream already has. shadcn publishes the{" "}
          <Term>aria-vega</Term> style — React Aria underneath, the same base Lumo rents — so
          most of what is needed already exists there:
        </>

      ),
      vendorCommits: (
        <>
          The raw emit lands as one commit and Lumo&rsquo;s changes as a second — so{" "}
          <Term>git log -p</Term> shows what is ours versus theirs, and{" "}
          <Term>shadcn add --diff</Term> can still show what upstream changed later. A vendored
          file is never done on arrival; every one needs a pass for:
        </>

      ),
      verifyIntro: "Six gates, in the order they run — each proving something the one before it cannot:",
      vendorChecklist: [
        { key: "physical", body: (
            <>
              Physical utilities (<Term>ml-</Term>, <Term>pr-</Term>, <Term>text-left</Term>)
              that must become logical — <Term>shadcn migrate rtl</Term> handles most of it
              mechanically.
            </>

          ) },
        { key: "defaults", body: (
            <>
              English defaults — any <Term>label = "Close"</Term> — that must become required
              props.
            </>

          ) },
        { key: "numbers", body: (
            <>
              Raw numbers in JSX, which <Term>LumoNode</Term> rejects and which must route
              through <Term>formatNumber</Term>.
            </>

          ) },
        { key: "cn", body: (
            <>
              The <Term>cn</Term> import path: upstream imports from <Term>@/lib/utils</Term>,
              Lumo&rsquo;s lives in <Term>@lumo-ui/core</Term>.
            </>

          ) },
      ],
      verifyGates: [
        { key: "types", body: (
            <>
              <Term>gate:types</Term> — <Term>LumoNode</Term>, the closed <Term>Locale</Term>{" "}
              union, and every required string prop.
            </>

          ) },
        { key: "nocss", body: (
            <>
              <Term>gate:no-css-modules</Term> — the styling decision is real, not a comment.
            </>

          ) },
        { key: "test", body: (
            <>
              <Term>gate:test</Term> — the suites, including each gate rule&rsquo;s own poison
              fixtures.
            </>

          ) },
        { key: "registry", body: (
            <>
              <Term>gate:registry</Term> — the manifest is derivable from the code, not
              hand-kept.
            </>

          ) },
        { key: "smoke", body: (
            <>
              <Term>gate:smoke</Term> — every item compiles as a consumer receives it, outside
              the workspace.
            </>

          ) },
        { key: "html", body: (
            <>
              <Term>gate:html</Term> — the bytes actually served are correct: <Term>lang</Term>/
              <Term>dir</Term> per route, no Latin digits in Persian text, a minimum count of
              Persian digits, no Latin script in spoken attributes, every control named, no
              dangling id references.
            </>

          ) },
      ],
    },
  },
} as const satisfies Record<Locale, PageCopy>;

export default async function CliPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = assertLocale((await params).lang);
  const t = COPY[lang];
  const sections = SECTIONS.map((id) => ({ id, label: t.heading[id] }));

  /* One block, all four managers — derived, never retyped. */
  const addCmds = PMS.map((pm) => CLI_COMMAND[pm]("button")).join("\n");
  const addHtml = await highlight(addCmds, "bash");
  const vendorHtml = await highlight(VENDOR_CMD, "bash");
  const verifyHtml = await highlight(VERIFY_CMD, "bash");

  return (
    <DocsShell lang={lang} slug="cli" title={t.title} intro={t.intro} sections={sections}>
      <DocSection id="add" title={t.heading.add}>
        <P>{t.body.addCommand}</P>
        <Snippet lang={lang} code={addCmds} html={addHtml} />
      </DocSection>

      <DocSection id="registry" title={t.heading.registry}>
        <P>{t.body.registryManifest}</P>
        <P>{t.body.registrySmoke}</P>
      </DocSection>

      <DocSection id="vendor" title={t.heading.vendor}>
        <P>{t.body.vendorRule}</P>
        <Snippet lang={lang} code={VENDOR_CMD} html={vendorHtml} />
        <P>{t.body.vendorCommits}</P>
        <Bullets items={t.body.vendorChecklist} />
      </DocSection>

      <DocSection id="verify" title={t.heading.verify}>
        <P>{t.body.verifyIntro}</P>
        <Snippet lang={lang} code={VERIFY_CMD} html={verifyHtml} />
        <Bullets items={t.body.verifyGates} />
      </DocSection>
    </DocsShell>
  );
}
