import { DocsSidebar } from "@/components/site/docs-sidebar";
import { isSiteLocale } from "@/lib/locales";
import { notFound } from "next/navigation";

export default async function DocsLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSiteLocale(locale)) notFound();
  return (
    <div className="container docs">
      <DocsSidebar locale={locale} />
      <div className="docs__main">{children}</div>
    </div>
  );
}
