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
 * `place-items-center` but NO padding, unlike the component preview layout.
 * Every block root carries `w-full` (checked across packages/blocks/src), and
 * `justify-items: center` resolves a `w-full` child against the grid area —
 * the full viewport — so full-width blocks are unaffected, `AppShell`'s
 * `min-h-dvh w-full` still fills the frame, and only an exhibit that is
 * genuinely narrower or shorter than the frame (a sign-in card above the
 * fold, a lone footer) moves: it now sits centred on both axes instead of
 * hugging the block-start edge over a bare strip of background — the defect
 * the design review screenshotted. Padding stays at zero because padding
 * around a `min-h-dvh` block guarantees a document scrollbar inside the
 * iframe even when nothing overflows — the double-scrollbar defect the
 * component preview layout fixed by trimming ITS padding — and
 * `overflow-x-clip` keeps wide content scrolling inside its own
 * `overflow-auto` container rather than as a second, document-level bar.
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
