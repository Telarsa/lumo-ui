import type { Metadata } from "next";
import { LumoHtml, type LumoNode } from "@lumo-ui/core";
import { fontVariables } from "@/fonts";
import { ThemeScript } from "@/components/theme-toggle";
import { LumoProvider } from "@lumo-ui/ui";
import { assertLocale, localeParams, site } from "@/lib/locale";
import "../globals.css";

/**
 * The root layout, one per locale. `LumoHtml` is the only thing that writes
 * `<html>` and takes no `dir` prop — direction derives from the closed locale
 * contract, so a wrong direction cannot be passed.
 */
export function generateStaticParams() {
  return localeParams;
}

/**
 * Unknown segments 404 instead of rendering. Without this a stray request such as
 * `/sw.js` falls into this route as `lang="sw.js"` and `assertLocale` 500s.
 */
export const dynamicParams = false;

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
  children: LumoNode;
  params: Promise<{ lang: string }>;
}) {
  const lang = assertLocale((await params).lang);
  return (
    <LumoHtml lang={lang} className={fontVariables} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh antialiased">
        <LumoProvider locale={lang}>{children}</LumoProvider>
      </body>
    </LumoHtml>
  );
}
