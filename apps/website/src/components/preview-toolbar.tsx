"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
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
  /*
   * `null` until mounted, then the theme the PAGE is actually showing. The
   * old `useState<Theme>("light")` was measured wrong on a dark-mode macOS:
   * the control claimed "light" while the stage — which only stamped
   * `data-theme` for dark — inherited the system-dark page, so the sun
   * button changed nothing. Now the stage stamps EXPLICITLY in both
   * directions (tokens.css gained the `[data-theme="light"]` island selector
   * for exactly this), and the control's initial selection is read from the
   * document instead of asserted.
   */
  const [theme, setTheme] = useState<Theme | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stamped = document.documentElement.getAttribute("data-theme");
    if (stamped === "dark" || stamped === "light") setTheme(stamped);
    else
      setTheme(
        window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      );
  }, []);

  /** Flip the stage with the same one-frame transition kill the header uses. */
  function setStageTheme(next: Theme) {
    const stage = stageRef.current;
    stage?.classList.add("lumo-theme-snap");
    setTheme(next);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => stage?.classList.remove("lumo-theme-snap"));
    });
  }
  const t = COPY[lang];
  const otherLang: Locale = lang === "fa-IR" ? "en-US" : "fa-IR";
  const dir = direction(lang);
  const otherDir = direction(otherLang);

  return (
    <div className="flex flex-col gap-2">
      {/*
       * Slim chrome, end-aligned above the card — two small segmented groups
       * rather than a full-width bordered bar. The MECHANISMS are unchanged:
       * direction is still a real navigation and theme is still scoped client
       * state (see the file header for both arguments).
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
            href={`/${otherLang}/components/${slug}/#preview`}
            hrefLang={otherLang}
            aria-label={otherDir === "rtl" ? t.rtl : t.ltr}
            className="inline-flex h-6 items-center rounded-sm px-2 text-xs text-fg-muted transition-colors hover:text-fg"
          >
            <span aria-hidden="true" dir="ltr" lang="en" data-lumo-latn="">
              {otherDir === "rtl" ? "RTL" : "LTR"}
            </span>
          </Link>
        </div>

        <SegmentedControl
          label={t.themeGroup}
          selectedKeys={theme === null ? [] : [theme]}
          onSelectionChange={(keys) => {
            // `SegmentedControl` fixes `selectionMode` to `"single"`, which is
            // why its `onSelectionChange` is typed as a plain `Set<Key>` here
            // rather than RAC's broader `Selection` — the `"all"` variant only
            // exists for multiple selection, so there is nothing to guard.
            const next = [...keys][0];
            if (next === "light" || next === "dark") setStageTheme(next);
          }}
        >
          {/* Icon-only items: the required per-locale name rides on aria-label. */}
          <SegmentedControlItem
            id="light"
            size="sm"
            aria-label={t.light}
            className="h-6 px-2 [&_svg]:size-3.5"
          >
            <Sun aria-hidden="true" />
          </SegmentedControlItem>
          <SegmentedControlItem
            id="dark"
            size="sm"
            aria-label={t.dark}
            className="h-6 px-2 [&_svg]:size-3.5"
          >
            <Moon aria-hidden="true" />
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
        ref={stageRef}
        data-theme={theme ?? undefined}
        data-lumo-demo-root=""
        /*
         * The preview is a STAGE, not a paragraph: a generous minimum height
         * with the demo centred in it, so a lone switch and a full table both
         * read as exhibits rather than as content that happens to be short.
         * `bg` comes from the token so the dark-theme subtree repaints.
         */
        className="grid min-h-96 place-items-center rounded-lg border border-border bg-bg p-8 sm:p-10"
      >
        <div className="w-full max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
