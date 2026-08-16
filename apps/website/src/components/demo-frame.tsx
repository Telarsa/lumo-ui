"use client";

import { segmentFor } from "@/lib/locale";
import { useEffect, useId, useState } from "react";
import type { BuiltinLocale as Locale, LumoNode } from "@lumo-ui/core";
import { cn, direction } from "@lumo-ui/core";
import { Button } from "@lumo-ui/ui";

/*
 * THEME SYNC FOR ALREADY-LOADED PREVIEW FRAMES. `ThemeScript` reads localStorage
 * ONCE, so a booted `/view/` frame never hears a later flip. The stamp comes
 * from the PARENT (MutationObserver on `<html>[data-theme]` + media query), not
 * a `storage` listener inside: `storage` never fires in the writing document,
 * writes may be denied, and the OS case writes nothing. See docs/decisions/log.md.
 */

type Resolved = "light" | "dark";

/** Every same-origin preview frame on the page: component AND block previews. */
const PREVIEW_FRAMES = 'iframe[src^="/view/"], iframe[src^="/view-block/"]';

/**
 * The theme the PAGE is actually showing — an explicit stamp wins, otherwise
 * the OS. Same three-state resolution as `theme-toggle.tsx`/`preview-toolbar.tsx`.
 */
function effectiveTheme(): Resolved {
  const stamped = document.documentElement.getAttribute("data-theme");
  if (stamped === "dark" || stamped === "light") return stamped;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Stamps one frame's inner document, with the snap. Exported for the test;
 *  returns whether it wrote anything ("not loaded yet" vs "already correct"). */
export function syncFrameTheme(frame: HTMLIFrameElement, theme: Resolved): boolean {
  let doc: Document | null = null;
  try {
    // Same-origin by construction; the guard is for a frame torn down
    // mid-navigation, where the access throws instead of returning null.
    doc = frame.contentDocument;
  } catch {
    return false;
  }
  const root = doc?.documentElement;
  if (!root) return false;
  if (root.getAttribute("data-theme") === theme) return false;

  // The same one-frame transition kill the header and the preview stage use.
  root.classList.add("lumo-theme-snap");
  root.setAttribute("data-theme", theme);
  const view = frame.contentWindow ?? window;
  view.requestAnimationFrame(() => {
    view.requestAnimationFrame(() => root.classList.remove("lumo-theme-snap"));
  });
  return true;
}

/**
 * Keeps every preview frame on the page in step with the page's own theme.
 * Mounted by `DemoFrame`; exported for the blocks pages, which build their own
 * `/view-block/` iframes. Two instances on one page is fine (idempotent write).
 */
export function PreviewFrameThemeSync() {
  useEffect(() => {
    const frames = () => Array.from(document.querySelectorAll<HTMLIFrameElement>(PREVIEW_FRAMES));
    const syncAll = () => {
      const theme = effectiveTheme();
      for (const frame of frames()) syncFrameTheme(frame, theme);
    };

    // A `loading="lazy"` frame has no document until revealed, so it is
    // stamped on arrival too (covers OS-driven and storage-denied state).
    const onLoad = (event: Event) => {
      const frame = event.target as HTMLIFrameElement;
      syncFrameTheme(frame, effectiveTheme());
    };
    for (const frame of frames()) frame.addEventListener("load", onLoad);

    // The page's own flip: sees every change, including ones that never reach storage.
    const observer = new MutationObserver(syncAll);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    // The "system" case: no attribute changes at all, the OS moves underneath.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", syncAll);

    syncAll();
    return () => {
      observer.disconnect();
      mq.removeEventListener("change", syncAll);
      for (const frame of frames()) frame.removeEventListener("load", onLoad);
    };
  }, []);

  return null;
}

/**
 * A demo rendered in its own document: `/view/<lang>/<slug>/` is a real
 * prerendered route, so the iframe IS a genuine `<html lang="fa-IR" dir="rtl">`.
 * Lazy-loaded and fixed-height (`h-96`, generous: a stingy height stacks a
 * document scrollbar on top of a ListBox's own).
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
        src={`/view/${segmentFor(lang)}/${slug}/`}
        // The frame's accessible name is in the PAGE's language, because a
        // screen reader reads it from the surrounding document.
        title={
          pageLang === "fa-IR"
            ? `${title} — ${lang === "fa-IR" ? "فارسی" : "انگلیسی"}`
            : `${title} — ${lang === "fa-IR" ? "Persian" : "English"}`
        }
        loading="lazy"
        className="block h-96 w-full bg-surface"
      />
      {/*
       * Renders nothing; makes a header theme flip repaint the document INSIDE
       * this frame too — see the block at the top of this file.
       */}
      <PreviewFrameThemeSync />
    </figure>
  );
}

/**
 * One frame by default, two on request. The mirrored frame is `hidden`, not
 * conditionally rendered (crawlers still see both `/view/` refs) and lazy, so
 * the default page costs one iframe. Disclosure semantics: `aria-expanded` +
 * `aria-controls` → an id that always exists (`resolved-idrefs` gate).
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
       * Closed: the single frame spans the column. Open: a two-up grid.
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
