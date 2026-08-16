import type { BuiltinLocale as Locale, LumoNode } from "@lumo-ui/core";
import { assertLocale, localeParams } from "@/lib/locale";
import { highlight } from "@/lib/highlight";
import { CLI_COMMAND } from "@/lib/install-commands";
import { DocSection, DocsShell, P, Snippet, Term } from "../docs-shell";

/**
 * /docs/installation — the workspace loop and what a consuming app must wire.
 *
 * Commands are the repository's real ones: the workspace loop from README.md,
 * the CSS import order from `packages/theme/src/theme.css`'s own header, and
 * the add command built by the same `CLI_COMMAND` table the install tabs use —
 * derived, so this page and the component pages cannot disagree.
 */

const WORKSPACE_CMDS = `pnpm install
pnpm verify      # types → no-CSS-Modules → tests → build → gate
pnpm dev         # the showcase site, live`;

const PREVIEW_CMDS = `pnpm --filter website build
pnpm start                     # http://localhost:4173/fa/`;

const CSS_IMPORTS = `@import "tailwindcss";
@import "@lumo-ui/theme/tokens.css";
@import "@lumo-ui/theme/theme.css";
@import "@lumo-ui/theme/script.css"; /* greenfield app only — page-wide Persian typography */`;

const PROVIDER_TSX = `import { LumoHtml } from "@lumo-ui/core";
import { LumoProvider } from "@lumo-ui/ui";

export default function RootLayout({ children }) {
  return (
    <LumoHtml lang="fa-IR">
      <body>
        <LumoProvider locale="fa-IR">{children}</LumoProvider>
      </body>
    </LumoHtml>
  );
}`;

/** One page per locale, prerendered — the same params every [lang] leaf declares. */
export function generateStaticParams() {
  return localeParams;
}

/** Section ids in reading order; the rail and the headings both derive from it. */
const SECTIONS = ["scope", "workspace", "css", "provider", "add"] as const;
type SectionId = (typeof SECTIONS)[number];

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
    scope: LumoNode;
    /** Two paragraphs: the loop, then why there is no server to start. */
    workspaceLoop: LumoNode;
    workspacePreview: LumoNode;
    css: LumoNode;
    provider: LumoNode;
    /** Two paragraphs: the add command, then where the rest is documented. */
    addCommand: LumoNode;
    addTabs: LumoNode;
  };
}

const COPY = {
  "fa-IR": {
    title: "نصب",
    intro: "حلقهٔ کار در خود مخزن، و آنچه یک اپ مصرف‌کننده باید سیم‌کشی کند.",
    heading: {
      scope: "دامنهٔ استفاده",
      workspace: "کار روی خود لومو",
      css: "استایل: ترتیب ایمپورت",
      provider: "سند و پرووایدر",
      add: "افزودن کامپوننت",
    },
    body: {
      scope: (
        <>
          لومو خصوصی است و درون سازمان تلارسا مصرف می‌شود؛ روی npm منتشر نشده و رجیستری عمومی
          ندارد (<Term>DECISIONS.md §0.2</Term>). توزیع دو مسیر دارد: کامپوننت‌ها و بلوک‌ها
          به‌صورت کپی در پروژهٔ مصرف‌کننده می‌نشینند تا قابل ویرایش باشند؛ بسته‌های{" "}
          <Term>@lumo-ui/core</Term>، <Term>@lumo-ui/theme</Term> و <Term>@lumo-ui/base-ui-ssr</Term>{" "}
          — یعنی قراردادها — به‌صورت وابستگی گیتِ سنجاق‌شده به یک تگ نصب می‌شوند، چون ویرایش
          آن‌ها باگ است، نه شخصی‌سازی. شکل دقیق:{" "}
          <Term>&quot;@lumo-ui/core&quot;: &quot;github:Telarsa/lumo-ui#v0.1.0&amp;path:packages/core&quot;</Term>{" "}
          (و همین برای theme و base-ui-ssr)، به‌علاوهٔ خودِ مخزن به‌عنوان وابستگی توسعه —{" "}
          <Term>&quot;lumo-ui&quot;: &quot;github:Telarsa/lumo-ui#v0.1.0&quot;</Term> — که فرمان{" "}
          <Term>lumo</Term> و رجیستری را می‌آورد. راهنمای کامل: <Term>docs/agent-consumer.md</Term>.
        </>
      ),
      workspaceLoop: (
        <>
          کل قرارداد یک دستور است: اگر <Term>pnpm verify</Term> سبز باشد، خروجی قابل عرضه است.
          هیچ چیز دیگری دروازه نیست.
        </>
      ),
      workspacePreview: (
        <>
          <Term>next start</Term> اینجا کار نمی‌کند — سایت یک خروجی استاتیک است و سروری برای
          راه‌اندازی وجود ندارد. <Term>pnpm start</Term> به‌جایش همان پوشهٔ خروجی را سرو می‌کند،
          دقیقاً همان‌طور که یک میزبان واقعی: نشانی بدون اسلشِ پایانی به شکل اسلش‌دار هدایت
          می‌شود و صفحهٔ خطای چهارصدوچهار خودِ سایت سرو می‌شود، نه پیام خام Node. پس همان
          بایت‌هایی را می‌بینید که دروازه نمره داده:
        </>
      ),
      css: (
        <>
          Tailwind نسخهٔ ۴ است و فایل پیکربندی ندارد؛ پلِ توکن‌ها با <Term>@theme inline</Term>{" "}
          در خود CSS تعریف شده. ترتیب ایمپورت قابل جابه‌جایی نیست: اول Tailwind تا زمینه‌ای برای
          گسترش باشد، بعد توکن‌ها تا متغیرها وجود داشته باشند، و در آخر پلی که به آن‌ها ارجاع
          می‌دهد.
        </>
      ),
      provider: (
        <>
          هرگز <Term>{"<html>"}</Term> را خودتان ننویسید — <Term>LumoHtml</Term> تنها چیزی است
          که آن را می‌نویسد، و چون <Term>dir</Term> را از خود زبان استخراج می‌کند، جهتِ غلط
          اصلاً قابل پاس‌دادن نیست. و <Term>LumoProvider</Term> اختیاری نیست: بدون آن React
          Aria زبانش را از <Term>navigator.language</Term> می‌گیرد — که هنگام رندر سرور وجود
          ندارد — و به <Term>en-US</Term> برمی‌گردد. اندازه‌گیری شده: دستگیرهٔ اسلایدر در مقدار
          ۴۰ به‌جای <Term>left: 60%</Term> در <Term>left: 40%</Term> می‌نشیند و هیچ دروازه‌ای
          هم آن را نمی‌گیرد، چون HTML معتبری است با استایل‌های باورپذیر. برای همین «پرووایدر
          اجباری» یک کامپوننت با پراپ اجباری است، نه یک خط مستندات.
        </>
      ),
      addCommand: (
        <>
          کامپوننت‌ها با فرمان <Term>lumo add</Term> نصب می‌شوند؛ هر آیتم با وابستگی‌های
          رجیستری‌اش کپی می‌شود و در <Term>lumo.lock.json</Term> ثبت می‌شود تا{" "}
          <Term>lumo upgrade</Term> بعداً ویرایش‌های شما را نگه دارد:
        </>
      ),
      addTabs: (
        <>
          صفحهٔ هر کامپوننت همین دستور را برای چهار مدیر بسته دارد، به‌علاوهٔ زبانهٔ «دستی» با
          وابستگی‌ها و کدِ آماده برای کپی. جزئیات رجیستری و ابزارها در صفحهٔ{" "}
          <Term>CLI</Term> آمده است.
        </>
      ),
    },
  },
  "en-US": {
    title: "Installation",
    intro: "The loop inside this repository, and what a consuming app must wire up.",
    heading: {
      scope: "Who this is for",
      workspace: "Working on Lumo itself",
      css: "Styles: the import order",
      provider: "The document and the provider",
      add: "Adding a component",
    },
    body: {
      scope: (
        <>
          Lumo is private and consumed inside the Telarsa organisation; it is not published to
          npm and serves no public registry (<Term>DECISIONS.md §0.2</Term>). Distribution has
          two paths: components and blocks land as copies in the consuming project so they can
          be edited, while the packages — <Term>@lumo-ui/core</Term>, <Term>@lumo-ui/theme</Term>{" "}
          and <Term>@lumo-ui/base-ui-ssr</Term>, the contracts — are installed as git dependencies
          pinned to a tag, because an edit to them is a bug, not a customisation. The exact form:{" "}
          <Term>&quot;@lumo-ui/core&quot;: &quot;github:Telarsa/lumo-ui#v0.1.0&amp;path:packages/core&quot;</Term>{" "}
          (likewise theme and base-ui-ssr), plus the repository itself as a dev dependency —{" "}
          <Term>&quot;lumo-ui&quot;: &quot;github:Telarsa/lumo-ui#v0.1.0&quot;</Term> — which brings the{" "}
          <Term>lumo</Term> command and the registry. Full guide: <Term>docs/agent-consumer.md</Term>.
        </>
      ),
      workspaceLoop: (
        <>
          The whole contract is one command: if <Term>pnpm verify</Term> is green, the thing is
          shippable. Nothing else is a gate.
        </>
      ),
      workspacePreview: (
        <>
          <Term>next start</Term> does not work here — the site is a static export, so there is
          no server to start. <Term>pnpm start</Term> serves the export instead, and serves it
          the way a real host would: an unslashed URL redirects to its slashed form, and the
          site&rsquo;s own 404 page is served rather than a bare Node message. So what you see is
          the exact bytes the gate graded:
        </>
      ),
      css: (
        <>
          Tailwind is v4 and there is no config file; the token bridge is declared in CSS via{" "}
          <Term>@theme inline</Term>. The import order is not interchangeable: Tailwind first so
          there is a theme to extend, tokens next so the custom properties exist, then the
          bridge that references them.
        </>
      ),
      provider: (
        <>
         Never write <Term>{"<html>"}</Term> yourself — <Term>LumoHtml</Term> is the only thing
         that writes it, and because it derives <Term>dir</Term> from the locale, a wrong
         direction cannot be passed. And <Term>LumoProvider</Term> is not optional: without it
          Base UI&rsquo;s direction context defaults to <Term>ltr</Term>. LumoProvider sends the
          same required locale to Lumo&rsquo;s formatter/string context and to Base UI&rsquo;s{" "}
          <Term>DirectionProvider</Term>, so Persian text, digits, arrows and keyboard geometry
          cannot disagree. That is why the provider is a component with a required prop rather
          than a line of documentation.
        </>
      ),
      addCommand: (
        <>
          Components install with <Term>lumo add</Term>; each item is copied with its registry
          closure and recorded in <Term>lumo.lock.json</Term>, so <Term>lumo upgrade</Term> can
          later keep your edits:
        </>
      ),
      addTabs: (
        <>
          Every component page carries this command for all four package managers, plus a Manual
          tab with the dependencies and the source ready to copy. The registry and the tooling
          are documented on the <Term>CLI</Term> page.
        </>
      ),
    },
  },
} as const satisfies Record<Locale, PageCopy>;

export default async function InstallationPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = assertLocale((await params).lang);
  const t = COPY[lang];
  const sections = SECTIONS.map((id) => ({ id, label: t.heading[id] }));

  const workspaceHtml = await highlight(WORKSPACE_CMDS, "bash");
  const previewHtml = await highlight(PREVIEW_CMDS, "bash");
  const providerHtml = await highlight(PROVIDER_TSX, "tsx");
  const addCmd = CLI_COMMAND.pnpm("button");
  const addHtml = await highlight(addCmd, "bash");

  return (
    <DocsShell lang={lang} slug="installation" title={t.title} intro={t.intro} sections={sections}>
      <DocSection id="scope" title={t.heading.scope}>
        <P>{t.body.scope}</P>
      </DocSection>

      <DocSection id="workspace" title={t.heading.workspace}>
        <P>{t.body.workspaceLoop}</P>
        <Snippet lang={lang} code={WORKSPACE_CMDS} html={workspaceHtml} />
        <P>{t.body.workspacePreview}</P>
        <Snippet lang={lang} code={PREVIEW_CMDS} html={previewHtml} />
      </DocSection>

      <DocSection id="css" title={t.heading.css}>
        <P>{t.body.css}</P>
        <Snippet lang={lang} code={CSS_IMPORTS} />
      </DocSection>

      <DocSection id="provider" title={t.heading.provider}>
        <P>{t.body.provider}</P>
        <Snippet lang={lang} code={PROVIDER_TSX} html={providerHtml} />
      </DocSection>

      <DocSection id="add" title={t.heading.add}>
        <P>{t.body.addCommand}</P>
        <Snippet lang={lang} code={addCmd} html={addHtml} />
        <P>{t.body.addTabs}</P>
      </DocSection>
    </DocsShell>
  );
}
