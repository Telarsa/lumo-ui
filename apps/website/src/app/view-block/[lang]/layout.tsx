import { LumoHtml, type LumoNode } from "@lumo-ui/core";
import { fontVariables } from "@/fonts";
import { ThemeScript } from "@/components/theme-toggle";
import { LumoProvider } from "@lumo-ui/ui";
import { assertLocale, localeParams } from "@/lib/locale";
import "../../globals.css";

/**
 * A second root layout for the block preview frames (mirrors `app/view/[lang]/layout.tsx`).
 * It writes its own `<html lang dir>` via `LumoHtml`, and `LumoProvider` is required so
 * Base UI's direction context is not `ltr` on a `dir="rtl"` page (README.md rule 3).
 * `place-items-center` but NO padding: block roots are `w-full`, and padding around a
 * `min-h-dvh` block would force a document scrollbar inside the iframe.
 */
// Unknown segments 404 rather than 500 — see the [lang] layout's note on /sw.js.
export const dynamicParams = false;

export function generateStaticParams() {
  return localeParams;
}

export default async function ViewBlockLayout({
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
      <body className="grid min-h-dvh place-items-center overflow-x-clip bg-bg text-fg">
        <LumoProvider locale={lang}>{children}</LumoProvider>
      </body>
    </LumoHtml>
  );
}
