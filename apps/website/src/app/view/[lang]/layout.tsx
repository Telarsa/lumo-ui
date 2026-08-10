import { LumoHtml, type LumoNode } from "@lumo-ui/core";
import { fontVariables } from "@/fonts";
import { ThemeScript } from "@/components/theme-toggle";
import { LumoProvider } from "@lumo-ui/ui";
import { assertLocale, localeParams } from "@/lib/locale";
import "../../globals.css";

/**
 * A second root layout for the preview frames.
 *
 * It writes its own `<html lang dir>` via LumoHtml, so an iframe pointing here
 * contains a genuinely Persian (or English) document rather than a styled div
 * pretending to be one. The gate grades these routes exactly like any other.
 */
// Unknown segments 404 rather than 500 — see the [lang] layout's note on /sw.js.
export const dynamicParams = false;

export function generateStaticParams() {
  return localeParams;
}

export default async function ViewLayout({
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
      {/*
       * This document lives inside `DemoFrame`'s fixed-height iframe, so its
       * scrollbars appear INSIDE the thumbnail. Three decisions keep it to at
       * most one scrollbar, and only when content genuinely overflows:
       *
       *  - `overflow-x-clip` on the body: wide content must scroll inside its
       *    own `overflow-auto` container (a Table's wrapper, a ListBox), never
       *    as a document-level horizontal bar under a vertical one.
       *  - the demo sits in a `w-full max-w-2xl` cell — the same stage width
       *    `preview-toolbar.tsx` gives it — so components lay out at a real
       *    width and their internal scroll areas engage instead of the page's.
       *  - modest padding (`p-4`): at the iframe's fixed height, padding is
       *    the first thing that pushes an almost-fitting demo into a document
       *    scrollbar ON TOP of the demo's own — the double-scrollbar defect
       *    this layout previously shipped.
       */}
      <body className="grid min-h-dvh place-items-center overflow-x-clip bg-bg p-4 text-fg sm:p-6">
        <LumoProvider locale={lang}>
          <div className="w-full max-w-2xl">{children}</div>
        </LumoProvider>
      </body>
    </LumoHtml>
  );
}
