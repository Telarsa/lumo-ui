import type { BuiltinLocale as Locale, LumoNode } from "@lumo-ui/core";
import { oppositeDirectionLocale, segmentFor } from "@/lib/locale";
import { DirectionSwitch } from "@/components/direction-switch";

/**
 * Sits above the live preview. ONE control: direction — a real navigation to
 * the same route in the mirrored locale (a separately prerendered document with
 * its own genuine `lang`/`dir`), NOT a client-side flip: `<html lang>` would
 * still say the page's locale and every Lumo component derives `dir` from
 * `LumoProvider`, never a prop. Uses `segmentFor()`, not the locale, for the
 * href (the locale form was 202 dead links). Theme and density controls were
 * removed (redundant / inert-looking), leaving no client state, so this is a
 * SERVER component. History: docs/decisions/log.md.
 */

export interface PreviewToolbarProps {
  lang: Locale;
  slug: string;
  children: LumoNode;
}

export function PreviewToolbar({ lang, slug, children }: PreviewToolbarProps) {
  const otherLang = oppositeDirectionLocale(lang);

  return (
    <div className="flex flex-col gap-2">
      {/*
       * Slim chrome, end-aligned above the card — one small segmented group.
       */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <DirectionSwitch lang={lang} href={`/${segmentFor(otherLang)}/components/${slug}/#preview`} />

      </div>

      {/*
       * No `data-theme` on the stage: it inherits the document's theme from the
       * header's global toggle — one control, one answer.
       *
       * `data-lumo-demo-root` marks exactly the subtree that IS the demo.
       * `scripts/inject-evidence.mjs` reads the rendered markup inside it to build
       * the accessibility evidence panel — one true source, not two renders.
       */}
      <div
        data-lumo-demo-root=""
        // The preview is a STAGE: generous minimum height, demo centred.
        // `bg` comes from the token so the dark-theme subtree repaints.
        className="grid min-h-96 place-items-center rounded-lg border border-border bg-bg p-8 sm:p-10"
      >
        {/*
         * `min-w-0`, not just `w-full max-w-2xl`: as a GRID ITEM its `min-width`
         * resolves to the demo's min-content width, which pushed wide demos past
         * the canvas. Removing the floor lets their own `overflow` rules work.
         */}
        <div className="w-full min-w-0 max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
