import { notFound } from "next/navigation";
import { LOCALES } from "@lumo-ui/core";
import { assertLocale } from "@/lib/locale";
import { allCatalog, catalogById } from "@/lib/catalog";

export async function generateStaticParams() {
  const entries = await allCatalog();
  return LOCALES.flatMap((lang) => entries.map((d) => ({ lang, slug: d.id })));
}

export default async function View({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: raw, slug } = await params;
  const lang = assertLocale(raw);
  const demo = await catalogById(slug);
  if (!demo) notFound();
  return <>{demo.render(lang)}</>;
}
