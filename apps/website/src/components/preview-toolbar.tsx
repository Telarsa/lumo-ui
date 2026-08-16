import Link from "next/link";
import type { BuiltinLocale as Locale, LumoNode } from "@lumo-ui/core";
import { direction } from "@lumo-ui/core";
import { oppositeDirectionLocale, segmentFor } from "@/lib/locale";

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

const COPY: Record<
  Locale,
  {
    directionGroup: string;
    rtl: string;
    ltr: string;
  }
> = {
  "fa-IR": {
    directionGroup: "جهت پیش‌نمایش",
    rtl: "راست‌به‌چپ",
    ltr: "چپ‌به‌راست",
  },
  "en-US": {
    directionGroup: "Preview direction",
    rtl: "Right to left",
    ltr: "Left to right",
  },
};

export function PreviewToolbar({ lang, slug, children }: PreviewToolbarProps) {
  const t = COPY[lang];
  const otherLang = oppositeDirectionLocale(lang);
  const dir = direction(lang);
  const otherDir = direction(otherLang);

  return (
    <div className="flex flex-col gap-2">
      {/*
       * Slim chrome, end-aligned above the card — one small segmented group.
       */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div
          role="group"
          aria-label={t.directionGroup}
          className="inline-flex w-fit items-center gap-1 rounded-md border border-border bg-surface-sunken p-1"
        >
          {/*
           * "RTL"/"LTR" are technical identifiers: Latin islands, `aria-hidden`,
           * decoration over the sr-only per-locale name.
           */}
          <span
            aria-current="true"
            className="inline-flex h-6 select-none items-center rounded-sm bg-surface px-2 text-xs font-medium text-fg shadow-sm"
          >
            <span aria-hidden="true" dir="ltr" lang="en" data-lumo-latn="">
              {dir === "rtl" ? "RTL" : "LTR"}
            </span>
            <span className="sr-only">{dir === "rtl" ? t.rtl : t.ltr}</span>
          </span>
          {/* A real navigation — see the file header. */}
          <Link
            href={`/${segmentFor(otherLang)}/components/${slug}/#preview`}
            hrefLang={otherLang}
            aria-label={otherDir === "rtl" ? t.rtl : t.ltr}
            className="inline-flex h-6 items-center rounded-sm px-2 text-xs text-fg-muted transition-colors hover:text-fg"
          >
            <span aria-hidden="true" dir="ltr" lang="en" data-lumo-latn="">
              {otherDir === "rtl" ? "RTL" : "LTR"}
            </span>
          </Link>
        </div>

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
