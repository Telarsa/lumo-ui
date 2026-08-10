import { LumoHtml, type LumoNode } from "@lumo-ui/core";
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
 * the one thing this route exists to show full width.
 */
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
    <LumoHtml lang={lang}>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh bg-bg text-fg">
        <LumoProvider locale={lang}>{children}</LumoProvider>
      </body>
    </LumoHtml>
  );
}
