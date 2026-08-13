import type { Metadata } from "next";
import { LumoHtml, type LumoNode } from "@lumo-ui/core";
import { fontVariables } from "@/fonts";
import { ThemeScript } from "@/components/theme-toggle";
import { LumoProvider } from "@lumo-ui/ui";
import { assertLocale, localeParams, site } from "@/lib/locale";
import "../globals.css";

/**
 * The root layout, one per locale.
 *
 * `LumoHtml` is the only thing in the system that writes `<html>`, and it takes
 * no `dir` prop — direction is derived from the closed locale contract, so a
 * wrong direction cannot be passed. The gate asserts the result against the
 * prerendered output, not against a jsdom render.
 */
export function generateStaticParams() {
  return localeParams;
}

/**
 * Unknown segments 404 instead of rendering.
 *
 * Without this, any stray request — most famously `/sw.js`, a service worker
 * left registered on localhost:3000 by some OTHER project — falls into this
 * route as `lang="sw.js"`, and `assertLocale` turns it into a 500 on every
 * request. The throw is right at build time; at request time the honest answer
 * to an unknown locale is "no such document", which is exactly what refusing to
 * serve ungraded content means.
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
    <LumoHtml lang={lang} className={fontVariables}>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh antialiased">
        <LumoProvider locale={lang}>{children}</LumoProvider>
      </body>
    </LumoHtml>
  );
}
