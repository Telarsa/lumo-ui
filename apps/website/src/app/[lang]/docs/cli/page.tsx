import type { BuiltinLocale as Locale, LumoNode } from "@lumo-ui/core";
import { assertLocale, localeParams } from "@/lib/locale";
import { highlight } from "@/lib/highlight";
import { CLI_COMMAND, PMS } from "@/lib/install-commands";
import { Bullets, DocSection, DocsShell, P, Snippet, Term } from "../docs-shell";

/**
 * /docs/cli — the real tooling: the `lumo` command, the registry, and the verify chain.
 */


const VERIFY_CMD = `pnpm verify
# gate:types → gate:no-css-modules → gate:test → gate:registry → gate:smoke → gate:html`;

/** One page per locale, prerendered — the same params every [lang] leaf declares. */
export function generateStaticParams() {
  return localeParams;
}

/** Section ids in reading order; the rail and the headings both derive from it. */
const SECTIONS = ["add", "registry", "verify"] as const;
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
    verifyIntro: LumoNode;
    verifyGates: readonly Item[];
  };
}

const COPY = {
  "fa-IR": {
    title: "خط فرمان",
    intro: "فرمان lumo، رجیستری، و زنجیرهٔ verify.",
    heading: {
      add: "دستور add",
      registry: "رجیستری",
      verify: "زنجیرهٔ verify",
    },
    body: {
      addCommand: (
        <>
          فرمان <Term>lumo</Term> با وابستگیِ توسعهٔ <Term>lumo-ui</Term> می‌آید:{" "}
          <Term>search</Term> و <Term>info</Term> برای پیدا کردن کامپوننت درست، <Term>add</Term>{" "}
          برای کپی آیتم و بستارِ رجیستری‌اش، <Term>diff</Term> و <Term>upgrade</Term> برای
          به‌روزرسانی با ادغام سه‌طرفه که ویرایش‌های شما را نگه می‌دارد، <Term>gate</Term> برای
          سنجش HTML سروشدهٔ خودتان با قاعده‌های لومو — با هر چهار مدیر بسته (pnpm اول، چون لومو
          pnpm-محور است):
        </>

      ),
      registryManifest: (
        <>
          <Term>registry.json</Term> — امروز ۱۴۳ آیتم — هرگز با دست نگه‌داری نمی‌شود؛{" "}
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
      verifyIntro: "شش دروازه، به همان ترتیبی که اجرا می‌شوند — و هر کدام چیزی را ثابت می‌کند که قبلی نمی‌تواند:",
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
    intro: "The lumo command, the registry, and the verify chain.",
    heading: {
      add: "The add command",
      registry: "The registry",
      verify: "The verify chain",
    },
    body: {
      addCommand: (
        <>
          The <Term>lumo</Term> command comes with the <Term>lumo-ui</Term> dev dependency:{" "}
          <Term>search</Term> and <Term>info</Term> to find the right component, <Term>add</Term>{" "}
          to copy an item with its registry closure, <Term>diff</Term> and <Term>upgrade</Term> to
          update with a three-way merge that keeps your edits, <Term>gate</Term> to grade your own
          served HTML with Lumo&rsquo;s rules — under any of the four package managers (pnpm first,
          because Lumo is pnpm-first):
        </>

      ),
      registryManifest: (
        <>
          <Term>registry.json</Term> — 143 items today — is never hand-kept:{" "}
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
      verifyIntro: "Six gates, in the order they run — each proving something the one before it cannot:",
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


      <DocSection id="verify" title={t.heading.verify}>
        <P>{t.body.verifyIntro}</P>
        <Snippet lang={lang} code={VERIFY_CMD} html={verifyHtml} />
        <Bullets items={t.body.verifyGates} />
      </DocSection>
    </DocsShell>
  );
}
