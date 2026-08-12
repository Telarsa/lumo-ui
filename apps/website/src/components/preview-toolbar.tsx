import Link from "next/link";
import type { Locale, LumoNode } from "@lumo-ui/core";
import { direction } from "@lumo-ui/core";
import { oppositeDirectionLocale, segmentFor } from "@/lib/locale";

/**
 * Sits above the live preview. ONE control: direction.
 *
 * ── WHY DIRECTION IS A LINK, NOT A TOGGLE ───────────────────────────────────
 *
 * The obvious implementation is a client-side flip: hold `dir` in state, apply
 * it as a class or an inline style on the preview's wrapper. That was rejected,
 * and the reason is the same one `site-shell.tsx`'s header gives for the
 * language switcher, which this control is the sibling of:
 *
 *   - `<html lang>` would still say the PAGE's locale while the preview
 *     rendered mirrored. A screen reader picks its speech synthesiser from
 *     `lang`, not from which way the box is drawn, so a Persian document
 *     showing English-direction content through a CSS flip announces itself
 *     correctly and reads wrong — exactly the class of defect README.md rule 4
 *     exists to make unrepresentable, done here on the one page whose entire
 *     purpose is demonstrating that rule.
 *   - Every Lumo component derives `dir` from `Intl.Locale.getTextInfo()` via
 *     `LumoProvider`, never from a prop. There is no supported way to hand a
 *     rendered subtree a `dir` that disagrees with its own locale.
 *
 * So direction is a real navigation to the same route in the mirrored locale —
 * a separately prerendered document with its own genuine `lang`/`dir`.
 *
 * ── THE ROUTE SEGMENT IS NOT THE LOCALE ─────────────────────────────────────
 *
 * `segmentFor()`, not the locale itself. This link was `/${otherLang}/…`, which
 * resolves to `/fa-IR/components/button/` — a route that is never generated.
 * Measured on the export: 202 dead links across six call sites that had each
 * skipped the helper. `lib/locale-routing.test.ts` now fails on the pattern.
 *
 * ── WHAT THIS TOOLBAR NO LONGER CARRIES ─────────────────────────────────────
 *
 * It had a theme control and a density control beside this one. Both are gone,
 * and neither was removed for being broken in the way a test would find:
 *
 *   **Theme** worked. It was redundant — the site header already owns a theme
 *   toggle that restyles the whole document including this stage, so the page
 *   offered two controls for one decision and the local one silently disagreed
 *   with the global one whenever they were set differently.
 *
 *   **Density** also worked, and that is the more interesting removal. It
 *   stamped `data-density` on the stage and tokens.css answered with a real
 *   island; control heights genuinely moved 36px → 30px. But density moves
 *   ONLY control heights by design (scaling Tailwind's `--spacing` would shrink
 *   icons too, which is a zoom, not a density) — so on every page whose demo is
 *   not a sized control, pressing it changed nothing visible. A control that is
 *   correct and appears inert teaches people the site is broken. It belongs
 *   back when density is a system-wide property with something to show, not as
 *   docs chrome ahead of the feature.
 *
 * With both gone there is no client state left here, so the file is a SERVER
 * component: the `"use client"` directive, `useState`, `useEffect`, `useRef`
 * and the transition-suppression helper all went with them. The stage stops
 * shipping JavaScript for a control it no longer has.
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
       * Slim chrome, end-aligned above the card — one small segmented group
       * rather than a full-width bordered bar. It read "two groups" while the
       * theme and density controls stood here; see the file header for why
       * both went.
       */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div
          role="group"
          aria-label={t.directionGroup}
          className="inline-flex w-fit items-center gap-1 rounded-md border border-border bg-surface-sunken p-1"
        >
          {/*
           * "RTL"/"LTR" are technical identifiers, marked as genuinely-Latin
           * islands exactly like the `lang="…" dir="…"` captions on the frames
           * below — and they are `aria-hidden`, decoration over the sr-only
           * per-locale name, so no Latin script is ever announced.
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
       * The stage carries no `data-theme` of its own any more. It stamped one
       * while this toolbar had a theme control; with that gone the stage simply
       * inherits the document's theme, which is what the header's global toggle
       * sets — one control, one answer. tokens.css's `[data-theme]` island rules
       * are unchanged and still unscoped from `:root`, so a subtree CAN carry a
       * theme; nothing here needs to.
       *
       * `data-lumo-demo-root` marks exactly the subtree that IS the demo, as
       * opposed to this toolbar's own direction control around it.
       * `apps/website/scripts/inject-evidence.mjs` (see `evidence-panel.tsx`'s
       * file header for why the computation lives there rather than in React)
       * reads the real, already-rendered markup inside this element to build
       * the accessibility evidence panel further down the page — so this is
       * the one true source both sections show, not two independent renders
       * that could quietly drift apart.
       */}
      <div
        data-lumo-demo-root=""
        /*
         * The preview is a STAGE, not a paragraph: a generous minimum height
         * with the demo centred in it, so a lone switch and a full table both
         * read as exhibits rather than as content that happens to be short.
         * `bg` comes from the token so the dark-theme subtree repaints.
         */
        className="grid min-h-96 place-items-center rounded-lg border border-border bg-bg p-8 sm:p-10"
      >
        {/*
         * `min-w-0` and not just `w-full max-w-2xl`. This element is a GRID
         * ITEM, so its `min-width` resolves to `auto` — the automatic minimum
         * size — and that floor is the demo's min-content width, which
         * out-ranks both `w-full` and the stage's padding. A demo whose content
         * has a hard minimum therefore pushed this cell WIDER than the canvas
         * and painted over the page instead of being contained by it.
         *
         * Measured at a 390px viewport, where the stage's content box is 263px:
         * the carousel's cell rendered at 400px and spilled 138px past the
         * border; pagination 78px, steps 31px, tabs' second example 28px.
         * `min-w-0` removes the floor and every one of those resolves to the
         * canvas width — the demos below then shrink or scroll internally,
         * which is what their own `overflow` rules were written to do.
         */}
        <div className="w-full min-w-0 max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
