import { notFound } from "next/navigation";
import { LOCALES } from "@lumo-ui/core";
import { assertLocale } from "@/lib/locale";
import { allBlocks, blockById } from "@/lib/blocks";

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => allBlocks().map((b) => ({ lang, slug: b.id })));
}

/**
 * A block, alone, in a real document — the full-page preview.
 *
 * Mirrors `app/view/[lang]/[slug]/page.tsx` exactly. The block's own page
 * (`app/[lang]/blocks/[slug]/page.tsx`) embeds this route in an iframe, in
 * both directions, via `DemoFrame` — but this route is also a real page on
 * its own, so an `AppShell` or `ProductDetail` block genuinely occupies a
 * whole viewport rather than a 224px thumbnail.
 */
export default async function ViewBlock({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: raw, slug } = await params;
  const lang = assertLocale(raw);
  const block = blockById(slug);
  if (!block) notFound();
  return <>{block.render(lang)}</>;
}
