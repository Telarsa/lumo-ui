import { notFound } from "next/navigation";
import { LOCALES } from "@lumo-ui/core";
import { assertLocale } from "@/lib/locale";
import { allDemos, demoById } from "@/lib/demos";

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => allDemos().map((d) => ({ lang, slug: d.id })));
}

export default async function View({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: raw, slug } = await params;
  const lang = assertLocale(raw);
  const demo = demoById(slug);
  if (!demo) notFound();
  return <>{demo.render(lang)}</>;
}
