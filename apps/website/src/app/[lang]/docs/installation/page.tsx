import type { Locale, LumoNode } from "@lumo-ui/core";
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
pnpm --filter website preview   # http://localhost:4173/fa-IR/`;

const CSS_IMPORTS = `@import "tailwindcss";
@import "@lumo-ui/theme/tokens.css";
@import "@lumo-ui/theme/theme.css";`;

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
          <Term>@lumo-ui/core</Term> و <Term>@lumo-ui/theme</Term> — یعنی قراردادها — به‌صورت
          وابستگی گیتِ سنجاق‌شده به یک تگ سفر می‌کنند، چون ویرایش آن‌ها باگ است، نه شخصی‌سازی.
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
          <Term>pnpm start</Term> وجود ندارد — سایت یک خروجی استاتیک است و سروری در کار نیست.
          برای دیدن همان بایت‌هایی که دروازه نمره داده:
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
          کامپوننت‌ها از راه رجیستریِ shadcn-سازگار نصب می‌شوند؛ هر آیتم، فایل یا فایل‌هایش را
          در پروژهٔ شما کپی می‌کند:
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
          be edited, while the packages — <Term>@lumo-ui/core</Term> and{" "}
          <Term>@lumo-ui/theme</Term>, the contracts — travel as git dependencies pinned to a
          tag, because an edit to them is a bug, not a customisation.
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
          There is no <Term>pnpm start</Term> — the site is a static export, so there is no
          server to start. To view the exact bytes the gate graded:
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
          React Aria resolves its locale from <Term>navigator.language</Term> — absent during
          server rendering — and falls back to <Term>en-US</Term>. Measured: a slider thumb at
          value 40 sits at <Term>left: 40%</Term> instead of <Term>left: 60%</Term>, and no
          gate catches it, because it is valid HTML with plausible inline styles. That is why
          the provider is a component with a required prop rather than a line of documentation.
        </>
      ),
      addCommand: (
        <>
          Components install through the shadcn-compatible registry; each item copies its file
          or files into your project:
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
