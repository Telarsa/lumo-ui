import { readFileSync } from "node:fs";
import { join } from "node:path";
import { notFound } from "next/navigation";
import { LOCALES, type Locale } from "@lumo-ui/core";
import { SiteShell } from "@/components/site-shell";
import { DocsSidebar } from "@/components/docs-sidebar";
import { OnThisPage } from "@/components/on-this-page";
import { DemoFrame } from "@/components/demo-frame";
import { CodeBlock } from "@/components/code-block";
import { InstallTabs, type InstallFile } from "@/components/install-tabs";
import { PreviewToolbar } from "@/components/preview-toolbar";
import { EvidencePanel } from "@/components/evidence-panel";
import { assertLocale, site } from "@/lib/locale";
import { allDemos, demoById } from "@/lib/demos";

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => allDemos().map((d) => ({ lang, slug: d.id })));
}

/** Section headings, in both locales, so the rail and the page cannot disagree. */
function sections(lang: Locale) {
  return [
    { id: "preview", label: lang === "fa-IR" ? "پیش‌نمایش" : "Preview" },
    {
      id: "evidence",
      label: lang === "fa-IR" ? "شواهد دسترس‌پذیری" : "Accessibility evidence",
    },
    { id: "installation", label: lang === "fa-IR" ? "نصب" : "Installation" },
    { id: "directions", label: lang === "fa-IR" ? "هر دو جهت" : "Both directions" },
    { id: "source", label: lang === "fa-IR" ? "کد" : "Source" },
  ];
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
  const exact = uiItems.find((i) => i.name === slug);
  if (exact) return exact;
  return uiItems.find((i) => {
    const main = mainFileOf(i);
    if (!main) return false;
    try {
      return readFileSync(join(REPO_ROOT, main.path), "utf8") === source;
    } catch {
      return false;
    }
  });
}

export default async function ComponentPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: raw, slug } = await params;
  const lang = assertLocale(raw);
  const demo = demoById(slug);
  if (!demo) notFound();

  const t = site[lang];

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
  const installFiles: InstallFile[] = item.files.map((f) => ({
    target: f.target,
    code: readFileSync(join(REPO_ROOT, f.path), "utf8"),
  }));

  return (
    <SiteShell lang={lang} path={`components/${slug}/`} wide>
      {/*
        Three columns: nav, content, rail. Grid rather than flex so the centre
        column can be `minmax(0, 1fr)` — without that a wide code block pushes
        the whole layout sideways instead of scrolling inside its own container.
      */}
      <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)_14rem]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto pe-2">
            <DocsSidebar lang={lang} active={slug} />
          </div>
        </aside>

        <article className="min-w-0">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight text-fg">{demo.title[lang]}</h1>
            <p className="mt-3 max-w-2xl text-fg-muted">{demo.intro[lang]}</p>
          </header>

          <section id="preview" className="mt-8 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
              {t.preview}
            </h2>
            <div className="mt-3">
              <PreviewToolbar lang={lang} slug={slug}>
                {demo.render(lang)}
              </PreviewToolbar>
            </div>
          </section>

          <section id="evidence" className="mt-10 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
              {lang === "fa-IR" ? "شواهد دسترس‌پذیری" : "Accessibility evidence"}
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

          <section id="installation" className="mt-10 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
              {lang === "fa-IR" ? "نصب" : "Installation"}
            </h2>
            <div className="mt-3">
              <InstallTabs
                locale={lang}
                registryName={item.name}
                dependencies={item.dependencies ?? []}
                registryComponents={registryComponents}
                files={installFiles}
              />
            </div>
          </section>

          <section id="directions" className="mt-10 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
              {lang === "fa-IR" ? "فارسی و انگلیسی، کنار هم" : "Persian and English, side by side"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-fg-muted">
              {lang === "fa-IR"
                ? "هر قاب یک سند مستقل با ‎lang‎ و ‎dir‎ واقعی خودش است — نه یک div که وانمود می‌کند."
                : "Each frame is a real document with its own lang and dir — not a div pretending to be one."}
            </p>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {LOCALES.map((l) => (
                <DemoFrame key={l} slug={slug} lang={l} title={demo.title[lang]} pageLang={lang} />
              ))}
            </div>
          </section>

          <section id="source" className="mt-10 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">{t.code}</h2>
            <div className="mt-3">
              <CodeBlock
                code={demo.source}
                label={lang === "fa-IR" ? "کپی کد کامپوننت" : "Copy the component's source"}
                copiedLabel={lang === "fa-IR" ? "کد کامپوننت کپی شد" : "Component source copied"}
              />
            </div>
          </section>
        </article>

        <OnThisPage lang={lang} items={sections(lang)} />
      </div>
    </SiteShell>
  );
}
