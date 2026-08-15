import { notFound } from "next/navigation";
import { LOCALES } from "@lumo-ui/core";
import { assertLocale, segmentFor } from "@/lib/locale";
import { allBlocks, blockById } from "@/lib/blocks";

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => allBlocks().map((b) => ({ lang: segmentFor(lang), slug: b.id })));
}

/**
 * A block, alone, in a real document — the full-page preview. Mirrors
 * `app/view/[lang]/[slug]/page.tsx`; the block's own page embeds this route in an
 * iframe via `DemoFrame`, but it is also a real page on its own.
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
