import type { Locale } from "@lumo-ui/core";
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

const COPY = {
  "fa-IR": {
    title: "خط فرمان",
    intro: "دستور نصب، رجیستری، اسکریپت وندورکردن از shadcn، و زنجیرهٔ verify.",
    sections: [
      { id: "add", label: "دستور add" },
      { id: "registry", label: "رجیستری" },
      { id: "vendor", label: "وندورکردن از shadcn" },
      { id: "verify", label: "زنجیرهٔ verify" },
    ],
  },
  "en-US": {
    title: "CLI",
    intro: "The add command, the registry, the shadcn vendor script, and the verify chain.",
    sections: [
      { id: "add", label: "The add command" },
      { id: "registry", label: "The registry" },
      { id: "vendor", label: "Vendoring from shadcn" },
      { id: "verify", label: "The verify chain" },
    ],
  },
} as const satisfies Record<Locale, { title: string; intro: string; sections: readonly { id: string; label: string }[] }>;

export default async function CliPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = assertLocale((await params).lang);
  const t = COPY[lang];
  const fa = lang === "fa-IR";

  /* One block, all four managers — derived, never retyped. */
  const addCmds = PMS.map((pm) => CLI_COMMAND[pm]("button")).join("\n");
  const addHtml = await highlight(addCmds, "bash");
  const vendorHtml = await highlight(VENDOR_CMD, "bash");
  const verifyHtml = await highlight(VERIFY_CMD, "bash");

  return (
    <DocsShell lang={lang} slug="cli" title={t.title} intro={t.intro} sections={t.sections}>
      <DocSection id="add" title={fa ? "دستور add" : "The add command"}>
        <P>
          {fa ? (
            <>
              لومو ابزار خط فرمانِ خودش را نمی‌سازد؛ رجیستری‌اش با CLI خود shadcn سازگار است و همان
              دستورِ آشنا، فایل‌های آیتم را در پروژهٔ شما کپی می‌کند — با هر چهار مدیر بسته
              (pnpm اول، چون لومو pnpm-محور است):
            </>
          ) : (
            <>
              Lumo does not ship a CLI of its own; the registry is compatible with shadcn&rsquo;s,
              and the familiar command copies an item&rsquo;s files into your project — under any of
              the four package managers (pnpm first, because Lumo is pnpm-first):
            </>
          )}
        </P>
        <Snippet lang={lang} code={addCmds} html={addHtml} />
      </DocSection>

      <DocSection id="registry" title={fa ? "رجیستری" : "The registry"}>
        <P>
          {fa ? (
            <>
              <Term>registry.json</Term> — امروز ۸۵ آیتم — هرگز با دست نگه‌داری نمی‌شود؛{" "}
              <Term>scripts/build-registry.mjs</Term> آن را از روی کامپوننت‌هایی که واقعاً وجود
              دارند تولید می‌کند. دروازهٔ <Term>gate:registry</Term> همین تولید را دوباره اجرا
              می‌کند و با <Term>git diff --exit-code</Term> می‌سنجد: اگر مانیفست از کد قابلِ
              بازتولید نباشد، بیلد قرمز است.
            </>
          ) : (
            <>
              <Term>registry.json</Term> — 85 items today — is never hand-kept:{" "}
              <Term>scripts/build-registry.mjs</Term> generates it from the components that actually
              exist. <Term>gate:registry</Term> re-runs that generation and checks it with{" "}
              <Term>git diff --exit-code</Term>: if the manifest is not reproducible from the code,
              the build is red.
            </>
          )}
        </P>
        <P>
          {fa ? (
            <>
              <Term>gate:smoke</Term> یک قدم جلوتر می‌رود: هر آیتم را همان‌طور که به دست
              مصرف‌کننده می‌رسد، بیرون از فضای کاری کامپایل می‌کند. همین تست یک باگ توزیعِ واقعی را
              گرفت — ماژول همراهی که از یک آیتم رجیستری جا افتاده بود و از درون فضای کاری از نظر
              ساختاری نامرئی بود.
            </>
          ) : (
            <>
              <Term>gate:smoke</Term> goes one step further: it compiles every item exactly as a
              consumer receives it, outside the workspace. That test caught a real distribution bug
              — a companion module missing from a registry item, structurally invisible from inside
              the workspace.
            </>
          )}
        </P>
      </DocSection>

      <DocSection id="vendor" title={fa ? "وندورکردن از shadcn" : "Vendoring from shadcn"}>
        <P>
          {fa ? (
            <>
              قاعده: چیزی را که بالادست از قبل دارد، با دست تایپ نکن. shadcn سبکِ{" "}
              <Term>aria-vega</Term> را منتشر می‌کند — زیرش همان React Aria است که لومو اجاره کرده —
              پس بیشتر آنچه لازم می‌شود، آن‌جا آماده است:
            </>
          ) : (
            <>
              The rule: never hand-type a component upstream already has. shadcn publishes the{" "}
              <Term>aria-vega</Term> style — React Aria underneath, the same base Lumo rents — so
              most of what is needed already exists there:
            </>
          )}
        </P>
        <Snippet lang={lang} code={VENDOR_CMD} html={vendorHtml} />
        <P>
          {fa ? (
            <>
              خروجیِ خام در یک کامیتِ جدا می‌نشیند و تغییرات لومو در کامیت دوم — تا{" "}
              <Term>git log -p</Term> نشان دهد چه چیزی مال ماست و چه چیزی مال آن‌ها، و{" "}
              <Term>shadcn add --diff</Term> بعدها بتواند تغییرات بالادست را نشان دهد. فایل
              وندورشده هیچ‌وقت با ورودش تمام نیست؛ هر کدام یک گذر لازم دارد:
            </>
          ) : (
            <>
              The raw emit lands as one commit and Lumo&rsquo;s changes as a second — so{" "}
              <Term>git log -p</Term> shows what is ours versus theirs, and{" "}
              <Term>shadcn add --diff</Term> can still show what upstream changed later. A vendored
              file is never done on arrival; every one needs a pass for:
            </>
          )}
        </P>
        <Bullets
          items={[
            {
              key: "physical",
              body: fa ? (
                <>
                  کلاس‌های فیزیکی (<Term>ml-</Term>، <Term>pr-</Term>، <Term>text-left</Term>) که
                  باید منطقی شوند — <Term>shadcn migrate rtl</Term> بیشترش را مکانیکی انجام می‌دهد.
                </>
              ) : (
                <>
                  Physical utilities (<Term>ml-</Term>, <Term>pr-</Term>, <Term>text-left</Term>)
                  that must become logical — <Term>shadcn migrate rtl</Term> handles most of it
                  mechanically.
                </>
              ),
            },
            {
              key: "defaults",
              body: fa ? (
                <>
                  پیش‌فرض‌های انگلیسی، مثل هر <Term>label = "Close"</Term>، که باید پراپ اجباری
                  شوند.
                </>
              ) : (
                <>
                  English defaults — any <Term>label = "Close"</Term> — that must become required
                  props.
                </>
              ),
            },
            {
              key: "numbers",
              body: fa ? (
                <>
                  عددهای خام در JSX که <Term>LumoNode</Term> ردشان می‌کند و باید از{" "}
                  <Term>formatNumber</Term> عبور کنند.
                </>
              ) : (
                <>
                  Raw numbers in JSX, which <Term>LumoNode</Term> rejects and which must route
                  through <Term>formatNumber</Term>.
                </>
              ),
            },
            {
              key: "cn",
              body: fa ? (
                <>
                  مسیر ایمپورت <Term>cn</Term>: بالادست از <Term>@/lib/utils</Term> می‌آورد، لومو
                  از <Term>@lumo-ui/core</Term>.
                </>
              ) : (
                <>
                  The <Term>cn</Term> import path: upstream imports from <Term>@/lib/utils</Term>,
                  Lumo&rsquo;s lives in <Term>@lumo-ui/core</Term>.
                </>
              ),
            },
          ]}
        />
      </DocSection>

      <DocSection id="verify" title={fa ? "زنجیرهٔ verify" : "The verify chain"}>
        <P>
          {fa
            ? "شش دروازه، به همان ترتیبی که اجرا می‌شوند — و هر کدام چیزی را ثابت می‌کند که قبلی نمی‌تواند:"
            : "Six gates, in the order they run — each proving something the one before it cannot:"}
        </P>
        <Snippet lang={lang} code={VERIFY_CMD} html={verifyHtml} />
        <Bullets
          items={[
            {
              key: "types",
              body: fa ? (
                <>
                  <Term>gate:types</Term> — <Term>LumoNode</Term>، اتحادِ بستهٔ <Term>Locale</Term>،
                  و هر پراپِ رشته‌ایِ اجباری.
                </>
              ) : (
                <>
                  <Term>gate:types</Term> — <Term>LumoNode</Term>, the closed <Term>Locale</Term>{" "}
                  union, and every required string prop.
                </>
              ),
            },
            {
              key: "nocss",
              body: fa ? (
                <>
                  <Term>gate:no-css-modules</Term> — تصمیمِ استایل واقعی است، نه یک کامنت.
                </>
              ) : (
                <>
                  <Term>gate:no-css-modules</Term> — the styling decision is real, not a comment.
                </>
              ),
            },
            {
              key: "test",
              body: fa ? (
                <>
                  <Term>gate:test</Term> — مجموعه‌های تست، از جمله فیکسچرهای سمیِ خودِ قاعده‌های
                  دروازه.
                </>
              ) : (
                <>
                  <Term>gate:test</Term> — the suites, including each gate rule&rsquo;s own poison
                  fixtures.
                </>
              ),
            },
            {
              key: "registry",
              body: fa ? (
                <>
                  <Term>gate:registry</Term> — مانیفست از کد قابل استخراج است، نه دست‌نگه‌داشته.
                </>
              ) : (
                <>
                  <Term>gate:registry</Term> — the manifest is derivable from the code, not
                  hand-kept.
                </>
              ),
            },
            {
              key: "smoke",
              body: fa ? (
                <>
                  <Term>gate:smoke</Term> — هر آیتم همان‌طور که مصرف‌کننده دریافتش می‌کند، بیرون از
                  فضای کاری کامپایل می‌شود.
                </>
              ) : (
                <>
                  <Term>gate:smoke</Term> — every item compiles as a consumer receives it, outside
                  the workspace.
                </>
              ),
            },
            {
              key: "html",
              body: fa ? (
                <>
                  <Term>gate:html</Term> — بایت‌هایی که واقعاً سرو می‌شوند درست‌اند: <Term>lang</Term>{" "}
                  و <Term>dir</Term> هر مسیر، نبودِ ارقام لاتین در متنِ فارسی، کمینه‌ای از ارقام
                  فارسی، نبودِ خطِ لاتین در صفت‌های خوانده‌شونده، نام‌داشتنِ هر کنترل، و نبودِ
                  ارجاع‌های آویزان.
                </>
              ) : (
                <>
                  <Term>gate:html</Term> — the bytes actually served are correct: <Term>lang</Term>/
                  <Term>dir</Term> per route, no Latin digits in Persian text, a minimum count of
                  Persian digits, no Latin script in spoken attributes, every control named, no
                  dangling id references.
                </>
              ),
            },
          ]}
        />
      </DocSection>
    </DocsShell>
  );
}
