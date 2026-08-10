import type { Metadata } from "next";
import { LumoHtml } from "@lumo-ui/core";
import { ThemeScript } from "@/components/theme-toggle";
import { assertLocale, localeParams, site } from "@/lib/locale";
import "../globals.css";

/**
 * The root layout, one per locale.
 *
 * `LumoHtml` is the only thing in the system that writes `<html>`, and it takes
 * no `dir` prop — direction is derived from the locale via
 * `Intl.Locale.getTextInfo()`, so a wrong direction cannot be passed. The gate
 * asserts the result against the prerendered output, not against a jsdom render.
 */
export function generateStaticParams() {
  return localeParams;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = assertLocale((await params).lang);
  return { title: `${site[lang].title} — ${site[lang].tagline}`, description: site[lang].intro };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const lang = assertLocale((await params).lang);
  return (
    <LumoHtml lang={lang}>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </LumoHtml>
  );
}
