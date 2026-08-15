import { LumoHtml, type LumoNode } from "@lumo-ui/core";
import { fontVariables } from "@/fonts";
import { ThemeScript } from "@/components/theme-toggle";
import { LumoProvider } from "@lumo-ui/ui";
import { assertLocale, localeParams } from "@/lib/locale";
import "../../globals.css";

/**
 * A second root layout for the preview frames: it writes its own `<html lang dir>` via
 * LumoHtml, so an iframe pointing here contains a genuinely Persian (or English) document.
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
    <LumoHtml lang={lang} className={fontVariables} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      {/*
       * Inside `DemoFrame`'s fixed-height iframe, so scrollbars appear in the thumbnail:
       * `overflow-x-clip` keeps wide content scrolling in its own container, the `max-w-2xl`
       * `items-center` cell matches `preview-toolbar.tsx`'s stage width and centres narrow
       * exhibits, and only `p-4` so padding does not force a second document scrollbar.
       */}
      <body className="grid min-h-dvh place-items-center overflow-x-clip bg-bg p-4 text-fg sm:p-6">
        <LumoProvider locale={lang}>
          <div className="flex w-full max-w-2xl flex-col items-center">{children}</div>
        </LumoProvider>
      </body>
    </LumoHtml>
  );
}
