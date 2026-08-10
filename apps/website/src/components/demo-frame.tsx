"use client";

import { useId, useState } from "react";
import type { Locale, LumoNode } from "@lumo-ui/core";
import { cn, direction } from "@lumo-ui/core";
import { Button } from "@lumo-ui/ui";

/**
 * A demo rendered in its own document.
 *
 * `/view/<lang>/<slug>/` is a real prerendered route with its own root layout,
 * so the iframe contains a genuine `<html lang="fa-IR" dir="rtl">`. That is the
 * point: a preview that claims Persian correctness must actually BE a Persian
 * document, or it is demonstrating nothing.
 *
 * Lazy-loaded and fixed-height on purpose — a ResizeObserver + postMessage
 * handshake would add JavaScript to every component page to save a few pixels
 * of whitespace. The height is GENEROUS (`h-96`) rather than minimal: the
 * inner document centres the demo and only scrolls when content genuinely
 * overflows, so a stingy frame height is what used to produce a document
 * scrollbar stacked on top of a ListBox's own — two scrollbars for one list.
 */
export function DemoFrame({
  slug,
  lang,
  title,
  pageLang,
}: {
  slug: string;
  lang: Locale;
  /** The component's name in the SURROUNDING page's language, not the frame's. */
  title: string;
  pageLang: Locale;
}) {
  return (
    <figure className="m-0 overflow-hidden rounded-lg border border-border">
      <figcaption
        dir="ltr"
        lang="en"
        data-lumo-latn=""
        className="flex items-center justify-between border-b border-border bg-surface-sunken px-3 py-1.5 text-xs text-fg-muted"
      >
        <code>{`lang="${lang}" dir="${direction(lang)}"`}</code>
      </figcaption>
      <iframe
        src={`/view/${lang}/${slug}/`}
        /*
         * The frame's accessible name is in the PAGE's language, because a
         * screen reader reads it from the surrounding document. Interpolating
         * the slug here shipped English into a Persian page and the gate caught
         * it — which is precisely why the name is a required prop now.
         */
        title={
          pageLang === "fa-IR"
            ? `${title} — ${lang === "fa-IR" ? "فارسی" : "انگلیسی"}`
            : `${title} — ${lang === "fa-IR" ? "Persian" : "English"}`
        }
        loading="lazy"
        className="block h-96 w-full bg-surface"
      />
    </figure>
  );
}

/**
 * One frame by default, two on request.
 *
 * The "Both directions" section used to render the fa/en iframe pair
 * unconditionally, side by side — which put a second, mirrored copy of the demo
 * on every page for a comparison most visits never make. This shows only the
 * page's OWN locale until the reader asks for the comparison.
 *
 * Both frames stay REAL documents and both are in the served bytes — the
 * mirrored one is merely `hidden`, not conditionally rendered, so the markup a
 * crawler or a no-JS reader receives still contains both `/view/` references.
 * `loading="lazy"` means the hidden frame's document is not fetched until it is
 * actually revealed, so the default page costs one iframe, not two.
 *
 * The control is a disclosure, not a tab: `aria-expanded` carries the state and
 * `aria-controls` points at the wrapper that appears — an id that always exists
 * in the DOM, because `resolved-idrefs` (packages/gate) fails the build on a
 * dangling reference. `showLabel`/`hideLabel` are REQUIRED per-locale props,
 * per CONTRIBUTING.md: any string a screen reader announces is a required prop,
 * and a visible label is also the accessible name so the control stays
 * reachable by voice.
 */
export interface DirectionCompareProps {
  /** The frame in the page's own locale. Always visible. */
  primary: LumoNode;
  /** The mirrored-locale frame, revealed by the toggle. */
  comparison: LumoNode;
  /** Visible text and accessible name while the comparison is closed. Required. */
  showLabel: string;
  /** Visible text and accessible name while the comparison is open. Required. */
  hideLabel: string;
}

export function DirectionCompare({
  primary,
  comparison,
  showLabel,
  hideLabel,
}: DirectionCompareProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          aria-expanded={open}
          aria-controls={panelId}
          onPress={() => setOpen((v) => !v)}
          className="h-7 px-2.5 text-xs"
        >
          {open ? hideLabel : showLabel}
        </Button>
      </div>
      {/*
       * Closed: the single frame spans the full column. Open: the pair shares
       * a two-up grid — the same layout the section always had, now opt-in.
       */}
      <div className={cn("grid gap-4", open && "md:grid-cols-2")}>
        <div>{primary}</div>
        <div id={panelId} hidden={!open}>
          {comparison}
        </div>
      </div>
    </div>
  );
}
