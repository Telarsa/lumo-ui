/**
 * The MOBILE side of a component page — `/components/<slug>/mobile/`. Same
 * component, the React Native implementation: its examples in a phone frame
 * (rendered in the browser through react-native-web — the page says so), the
 * install (a git pin on `@lumo-ui/native`, imported, not copied), the generated
 * props, and where the device evidence lives. The platform is a ROUTE, as the
 * locale is, so the Web | Mobile switch is two links and both pages are served
 * bytes the gate grades.
 */
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
import { NativeStage } from "@/components/native-stage";
import { PlatformSwitch } from "@/components/platform-switch";
import { highlight } from "@/lib/highlight";
import { assertLocale, segmentFor, site } from "@/lib/locale";
import { catalogById } from "@/lib/catalog";
import { loadExamplesFor } from "@/lib/examples-loader";
import { loadNativeExamples, nativeSlugs } from "@/lib/native-examples";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export async function generateStaticParams() {
  return LOCALES.flatMap((lang) => nativeSlugs().map((slug) => ({ lang: segmentFor(lang), slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang: raw, slug } = await params;
  const lang = assertLocale(raw);
  const demo = await catalogById(slug);
  if (!demo) return {};
  const c = COPY[lang];
  return { title: `${demo.title[lang]} — ${c.mobileTitle} — ${site[lang].title}` };
}

const VERSION = (JSON.parse(readFileSync(join(process.cwd(), "..", "..", "package.json"), "utf8")) as { version: string }).version;

const COPY = {
  "fa-IR": {
    mobileTitle: "موبایل (React Native)",
    previewOrCode: "پیش‌نمایش یا کد",
    preview: "پیش‌نمایش",
    code: "کد",
    frame: "پیش‌نمایش موبایل در مرورگر",
    browserNote: "همان کد React Native که روی گوشی اجرا می‌شود، اینجا از راه react-native-web در مرورگر رندر شده. رندر مرورگر است، نه اجرای دستگاه — شواهد دستگاه را در صفحهٔ موبایل ببینید.",
    rail: { preview: "پیش‌نمایش", installation: "نصب", notes: "قرارداد", api: "مرجع API", evidence: "شواهد دستگاه" },
    installIntro: "کامپوننت‌های موبایل به‌جای کپی، وارد می‌شوند: بستهٔ @lumo-ui/native را با همان تگ بقیهٔ بسته‌های قرارداد سنجاق کنید.",
    copyCommand: "کپی فرمان", copyCommandDone: "کپی شد",
    copyUsage: "کپی نمونه", copyUsageDone: "کپی شد",
    exampleView: "نمایش کد", exampleHide: "پنهان‌کردن کد", exampleCopy: "کپی کد", exampleCopied: "کپی شد",
    apiIntro: "از تعریف‌های تایپ‌اسکریپت packages/native تولید شده؛ رشته‌های اعلام‌شونده اجباری‌اند.",
    propHeader: "ویژگی", typeHeader: "نوع", descriptionHeader: "شرح", requirementHeader: "الزام", requiredLabel: "اجباری", optionalLabel: "اختیاری",
    evidence: "این کامپوننت با همان چهارده قاعدهٔ وب از راه react-native-web آزموده می‌شود؛ اجراهای واقعی روی شبیه‌ساز iOS و وضعیت پروب ICU در صفحهٔ موبایل ثبت شده‌اند.",
    evidenceLink: "صفحهٔ موبایل و شواهد دستگاه",
    webPageLink: "نسخهٔ وب همین کامپوننت",
  },
  "en-US": {
    mobileTitle: "Mobile (React Native)",
    previewOrCode: "Preview or code",
    preview: "Preview",
    code: "Code",
    frame: "Mobile preview in the browser",
    browserNote: "The same React Native source a phone runs, rendered here in your browser through react-native-web. A browser rendering, not a device run — the device evidence is on the mobile page.",
    rail: { preview: "Preview", installation: "Installation", notes: "Contract", api: "API reference", evidence: "Device evidence" },
    installIntro: "Mobile components are imported rather than copied: pin @lumo-ui/native to the same tag as the other contract packages.",
    copyCommand: "Copy command", copyCommandDone: "Copied",
    copyUsage: "Copy usage", copyUsageDone: "Copied",
    exampleView: "View code", exampleHide: "Hide code", exampleCopy: "Copy code", exampleCopied: "Copied",
    apiIntro: "Generated from the TypeScript declarations in packages/native; announced strings are required.",
    propHeader: "Prop", typeHeader: "Type", descriptionHeader: "Description", requirementHeader: "Requirement", requiredLabel: "Required", optionalLabel: "Optional",
    evidence: "This component is tested through react-native-web with the same fourteen rules as the web; real iOS-simulator runs and the ICU probe's status are recorded on the mobile page.",
    evidenceLink: "The mobile page and device evidence",
    webPageLink: "The web version of this component",
  },
} as const satisfies Record<Locale, Record<string, unknown>>;

export default async function MobileComponentPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang: raw, slug } = await params;
  const lang = assertLocale(raw);
  const demo = await catalogById(slug);
  const native = await loadNativeExamples(slug);
  if (!demo || native === undefined) notFound();
  const c = COPY[lang];
  const web = await loadExamplesFor(slug);
  const first = native.examples[0];
  if (first === undefined) throw new Error(`[native examples] ${slug}: no examples`);
  const cards = await Promise.all(native.examples.map(async (e) => ({ example: e, html: await highlight(e.source, "tsx") })));
  const install = `pnpm add "@lumo-ui/native@github:Telarsa/lumo-ui#v${VERSION}&path:packages/native"`;
  const installHtml = await highlight(install, "bash");
  const usageHtml = await highlight(`import { LumoNativeProvider, ${native.api.map((g) => g.name.replace(/Props$/, "")).filter((n) => !n.startsWith("LumoNative")).join(", ")} } from "@lumo-ui/native";\n\n<LumoNativeProvider locale="${lang}">…</LumoNativeProvider>`, "tsx");
  const railItems = [
    { id: "preview", label: c.rail.preview },
    { id: "installation", label: c.rail.installation },
    ...native.examples.map((e) => ({ id: `example-${e.id}`, label: e.title[lang] })),
    ...(native.meta.notes ? [{ id: "notes", label: c.rail.notes }] : []),
    { id: "api", label: c.rail.api },
    { id: "evidence", label: c.rail.evidence },
  ];
  return (
    <SiteShell lang={lang} path={`components/${slug}/mobile/`} wide>
      <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)_14rem]">
        <aside className="hidden lg:block">
          <div data-docs-sidebar-scroll="" className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto pe-2">
            <DocsSidebar lang={lang} active={slug} />
          </div>
        </aside>
        <article className="min-w-0">
          <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-fg-muted">{c.mobileTitle}</p>
              <h1 className="text-3xl font-semibold tracking-tight text-fg">{demo.title[lang]}</h1>
              <p className="mt-2 max-w-2xl text-fg-muted">{native.meta.intro?.[lang] ?? demo.intro[lang]}</p>
            </div>
            <div className="ms-auto flex shrink-0 items-center gap-2">
              <PlatformSwitch lang={lang} slug={slug} platform="mobile" />
            </div>
          </header>

          <section id="preview" className="mt-8 scroll-mt-24">
            <Tabs>
              <TabList label={c.previewOrCode}>
                <Tab id="preview">{c.preview}</Tab>
                <Tab id="code">{c.code}</Tab>
              </TabList>
              <TabPanel id="preview" className="mt-4">
                <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-bg p-6 sm:p-10">
                  <Frame device="phone" label={c.frame}>
                    <NativeStage locale={lang} render={first.render} />
                  </Frame>
                  <p className="max-w-xl text-center text-xs text-fg-muted">{c.browserNote}</p>
                </div>
              </TabPanel>
              <TabPanel id="code" shouldForceMount className="mt-4 data-inert:hidden">
                <CodePanel html={cards[0]?.html} label={c.exampleCopy} copiedLabel={c.exampleCopied} isPageSource />
              </TabPanel>
            </Tabs>
          </section>

          <section id="installation" className="mt-8 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">{c.rail.installation}</h2>
            <p className="mt-2 max-w-2xl text-sm text-fg-muted">{c.installIntro}</p>
            <div className="mt-3 flex flex-col gap-3">
              <CodePanel html={installHtml} label={c.copyCommand} copiedLabel={c.copyCommandDone} />
              <CodePanel html={usageHtml} label={c.copyUsage} copiedLabel={c.copyUsageDone} />
            </div>
          </section>

          {cards.map(({ example, html }, index) => (
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
              {index > 0 ? (
                <div className="flex w-full flex-col items-center">
                  <Frame device="phone" label={`${c.frame} — ${example.title[lang]}`}>
                    <NativeStage locale={lang} render={example.render} />
                  </Frame>
                </div>
              ) : undefined}
            </ExampleCard>
          ))}

          {native.meta.notes ? (
            <section id="notes" className="mt-10 scroll-mt-24">
              <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">{c.rail.notes}</h2>
              <p className="mt-2 max-w-2xl text-sm text-fg">{native.meta.notes[lang]}</p>
              {web?.usage ? <p className="mt-2 max-w-2xl text-sm text-fg-muted">{web.usage.when[lang]}</p> : null}
            </section>
          ) : null}

          <section id="api" className="mt-10 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">{c.rail.api}</h2>
            <p className="mt-2 max-w-2xl text-sm text-fg-muted">{c.apiIntro}</p>
            <div className="mt-3">
              <PropsTable
                groups={native.api}
                propHeader={c.propHeader}
                typeHeader={c.typeHeader}
                descriptionHeader={c.descriptionHeader}
                requirementHeader={c.requirementHeader}
                requiredLabel={c.requiredLabel}
                optionalLabel={c.optionalLabel}
              />
            </div>
          </section>

          <section id="evidence" className="mt-10 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">{c.rail.evidence}</h2>
            <p className="mt-2 max-w-2xl text-sm text-fg-muted">{c.evidence}</p>
            <p className="mt-2 flex flex-wrap gap-4 text-sm">
              <Link href={`/${segmentFor(lang)}/docs/native/`} className="text-accent underline-offset-4 hover:underline">{c.evidenceLink}</Link>
              <Link href={`/${segmentFor(lang)}/components/${slug}/`} className="text-accent underline-offset-4 hover:underline">{c.webPageLink}</Link>
            </p>
          </section>
        </article>
        <aside className="hidden xl:block">
          <div className="sticky top-24">
            <OnThisPage lang={lang} items={railItems} />
          </div>
        </aside>
      </div>
    </SiteShell>
  );
}
