"use client";

import { useState } from "react";
import Link from "next/link";
import type { Locale, LumoNode } from "@lumo-ui/core";
import { direction } from "@lumo-ui/core";
import { SegmentedControl, SegmentedControlItem } from "@lumo-ui/ui";

/**
 * Sits above the live preview. Two controls: direction and theme.
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
 *     `LumoProvider` (`packages/core/src/types.ts`'s `direction()`), never from
 *     a prop. There is no supported way to hand a rendered subtree a `dir` that
 *     disagrees with its own locale — a class-based override would either do
 *     nothing (RAC still resolves arrow keys and mirrored placement from the
 *     real document direction, not from a wrapping class) or require fighting
 *     the library's own architecture to force it, which is a worse bug than the
 *     one being demonstrated.
 *
 * So direction is a real navigation: the control's "other direction" option is
 * an `<a href>` to `/${otherLocale}/components/${slug}/` — the SAME route this
 * page already serves in the mirrored locale, a separately prerendered document
 * with its own genuine `lang`/`dir`. This was chosen over driving the `<iframe>`
 * in the "Both directions" section for a concrete reason: that iframe's inner
 * document lives at `/view/<lang>/<slug>/`, a route this file does not own and
 * is not in scope to modify (see the task's exclusive file list), so it has no
 * mechanism for receiving a theme choice from this toolbar — and a control that
 * silently fails to affect what it claims to control on half of its job is worse
 * than not offering that half. A same-origin navigation has no such gap: every
 * locale it can land on is a real, complete, independently graded document.
 *
 * ── WHY THEME IS DIFFERENT ───────────────────────────────────────────────────
 *
 * Theme has no such constraint — light/dark is genuinely a CSS decision
 * (tokens.css defines `[data-theme="dark"]` unscoped from `:root` for exactly
 * this reason), and it does not correlate with document language the way
 * direction does. So theme is real client state, scoped to the preview's own
 * wrapper rather than `<html>` — it restyles only the box below, and leaves the
 * site's own chrome (and its independent `ThemeToggle`) untouched.
 */

export interface PreviewToolbarProps {
  lang: Locale;
  slug: string;
  children: LumoNode;
}

type Theme = "light" | "dark";

const COPY: Record<
  Locale,
  {
    directionGroup: string;
    rtl: string;
    ltr: string;
    themeGroup: string;
    light: string;
    dark: string;
  }
> = {
  "fa-IR": {
    directionGroup: "جهت پیش‌نمایش",
    rtl: "راست‌به‌چپ",
    ltr: "چپ‌به‌راست",
    themeGroup: "پوستهٔ پیش‌نمایش",
    light: "روشن",
    dark: "تیره",
  },
  "en-US": {
    directionGroup: "Preview direction",
    rtl: "Right to left",
    ltr: "Left to right",
    themeGroup: "Preview theme",
    light: "Light",
    dark: "Dark",
  },
};

export function PreviewToolbar({ lang, slug, children }: PreviewToolbarProps) {
  const [theme, setTheme] = useState<Theme>("light");
  const t = COPY[lang];
  const otherLang: Locale = lang === "fa-IR" ? "en-US" : "fa-IR";
  const dir = direction(lang);
  const otherDir = direction(otherLang);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-sunken px-3 py-2">
        <div role="group" aria-label={t.directionGroup} className="inline-flex items-center gap-1 text-xs">
          <span
            aria-current="true"
            className="rounded-sm bg-surface px-2 py-1 font-medium text-fg shadow-sm"
          >
            {dir === "rtl" ? t.rtl : t.ltr}
          </span>
          {/* A real navigation — see the file header. */}
          <Link
            href={`/${otherLang}/components/${slug}/#preview`}
            hrefLang={otherLang}
            className="rounded-sm px-2 py-1 text-fg-muted hover:text-fg"
          >
            {otherDir === "rtl" ? t.rtl : t.ltr}
          </Link>
        </div>

        <SegmentedControl
          label={t.themeGroup}
          defaultSelectedKeys={["light"]}
          onSelectionChange={(keys) => {
            // `SegmentedControl` fixes `selectionMode` to `"single"`, which is
            // why its `onSelectionChange` is typed as a plain `Set<Key>` here
            // rather than RAC's broader `Selection` — the `"all"` variant only
            // exists for multiple selection, so there is nothing to guard.
            const next = [...keys][0];
            if (next === "light" || next === "dark") setTheme(next);
          }}
        >
          <SegmentedControlItem id="light" size="sm">
            {t.light}
          </SegmentedControlItem>
          <SegmentedControlItem id="dark" size="sm">
            {t.dark}
          </SegmentedControlItem>
        </SegmentedControl>
      </div>

      {/*
       * `data-theme` scoped to this wrapper only — see the file header on why
       * that is legitimate here in a way it is not for direction. tokens.css
       * defines `[data-theme="dark"]` without a `:root` qualifier precisely so
       * a subtree, not only the document, can carry it.
       *
       * `data-lumo-demo-root` marks exactly the subtree that IS the demo, as
       * opposed to this toolbar's own direction/theme controls around it.
       * `apps/website/scripts/inject-evidence.mjs` (see `evidence-panel.tsx`'s
       * file header for why the computation lives there rather than in React)
       * reads the real, already-rendered markup inside this element to build
       * the accessibility evidence panel further down the page — so this is
       * the one true source both sections show, not two independent renders
       * that could quietly drift apart.
       */}
      <div
        data-theme={theme === "dark" ? "dark" : undefined}
        data-lumo-demo-root=""
        /*
         * The preview is a STAGE, not a paragraph: a generous minimum height
         * with the demo centred in it, so a lone switch and a full table both
         * read as exhibits rather than as content that happens to be short.
         * `bg` comes from the token so the dark-theme subtree repaints.
         */
        className="grid min-h-80 place-items-center rounded-lg border border-border bg-bg p-8 sm:p-10"
      >
        <div className="w-full max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
