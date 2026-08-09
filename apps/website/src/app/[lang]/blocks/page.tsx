import { SiteShell } from "@/components/site-shell";
import { assertLocale, localeParams, site } from "@/lib/locale";
import { allBlocks } from "@/lib/blocks";

export function generateStaticParams() {
  return localeParams;
}

/**
 * The blocks gallery.
 *
 * Blocks are shown at full width and stacked, because a block IS a page section
 * — a grid of thumbnails would show the frame and hide the thing. Each is
 * rendered in the surrounding page's locale, so on `/fa-IR/` every one of them
 * is a Persian screen and the gate grades it as such.
 */
export default async function Blocks({ params }: { params: Promise<{ lang: string }> }) {
  const lang = assertLocale((await params).lang);

  return (
    <SiteShell lang={lang} path="blocks/">
      <h1 className="text-3xl font-semibold tracking-tight text-fg">{site[lang].blocks}</h1>
      <p className="mt-3 max-w-2xl text-fg-muted">
        {lang === "fa-IR"
          ? "بخش‌های کاملِ صفحه، ساخته‌شده فقط از کامپوننت‌های همین کتابخانه. هر بلوک تمام متن خود را به‌صورت prop می‌گیرد، پس هیچ واژهٔ انگلیسی در آن جا نمی‌ماند."
          : "Whole page sections, composed only from this library's components. Every block takes all of its text as props, so no English word can be left inside one."}
      </p>

      <div className="mt-10 flex flex-col gap-16">
        {allBlocks().map((block) => (
          <section key={block.id}>
            <header className="mb-4 border-bs border-border pbs-6">
              <h2 className="text-xl font-semibold text-fg">{block.title[lang]}</h2>
              <p className="mt-2 max-w-2xl text-sm text-fg-muted">{block.intro[lang]}</p>
            </header>
            <div className="overflow-hidden rounded-lg border border-border bg-surface">
              {block.render(lang)}
            </div>
          </section>
        ))}
      </div>
    </SiteShell>
  );
}
