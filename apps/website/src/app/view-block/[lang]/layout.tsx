import { LumoHtml, type LumoNode } from "@lumo-ui/core";
import { fontVariables } from "@/fonts";
import { ThemeScript } from "@/components/theme-toggle";
import { LumoProvider } from "@lumo-ui/ui";
import { assertLocale, localeParams } from "@/lib/locale";
import "../../globals.css";

/**
 * A second root layout for the block preview frames — the same move
 * `app/view/[lang]/layout.tsx` makes for components, copied exactly.
 *
 * It writes its own `<html lang dir>` via `LumoHtml`, so a `view-block` route
 * is a genuinely Persian (or English) document rather than a styled div
 * pretending to be one, and `lumo-gate` grades it exactly like any other page.
 *
 * `LumoProvider` is not optional here either. Without it React Aria resolves
 * its locale from `navigator.language` — absent during server rendering — and
 * falls back to `en-US`, so a block like `AppShell` or `ProductDetail` would
 * render its interactive parts (a NumberField stepper, a RadioGroup) LTR on a
 * `dir="rtl"` page. See `README.md` rule 3.
 *
 * No `place-items-center` / `p-6` here, unlike the component preview layout.
 * A block IS a page section — `AppShell` sets `min-h-dvh w-full` itself — so
 * centring it inside a padded grid cell would just add a false margin around
 * the one thing this route exists to show full width. Worse, padding around a
 * `min-h-dvh` block guarantees a document scrollbar inside the iframe even
 * when nothing overflows — the double-scrollbar defect the component preview
 * layout fixed by trimming ITS padding. The grid still stretches its single
 * cell, so a short block (a footer, a sign-in card) fills the frame's height
 * instead of floating over a bare strip of background, and `overflow-x-clip`
 * keeps wide content scrolling inside its own `overflow-auto` container
 * rather than as a second, document-level bar.
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
    <LumoHtml lang={lang} className={fontVariables}>
      <head>
        <ThemeScript />
      </head>
      <body className="grid min-h-dvh overflow-x-clip bg-bg text-fg">
        <LumoProvider locale={lang}>{children}</LumoProvider>
      </body>
    </LumoHtml>
  );
}
