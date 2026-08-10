"use client";

import { useEffect, useId, useState } from "react";
import type { Locale, LumoNode } from "@lumo-ui/core";
import { cn, direction } from "@lumo-ui/core";
import { Button } from "@lumo-ui/ui";

/* ════════════════════════════════════════════════════════════════════════════
 * THEME SYNC FOR ALREADY-LOADED PREVIEW FRAMES
 *
 * The defect, from the review backlog: flip the header's theme toggle and every
 * `/view/` and `/view-block/` iframe already on the page keeps its old theme
 * until it is reloaded. The page repaints around a light rectangle.
 *
 * Why it happens: `ThemeScript` reads `localStorage` ONCE, before the frame's
 * first paint. It is a no-flash contract, not a subscription, so a document that
 * has already booted never hears about a later change.
 *
 * ── WHY THE STAMP COMES FROM THE PARENT RATHER THAN A LISTENER INSIDE ───────
 *
 * The tidier-sounding fix is a `storage` listener inside the two view layouts:
 * `storage` fires natively in every OTHER same-origin document when
 * `localStorage` is written, so the toggle would need no change at all. It is
 * the right instinct and it is not sufficient here, for three reasons that only
 * show up once you write it down:
 *
 *  1. **`storage` does not fire in the document that wrote it.** The toggle
 *     lives in the top document, so the top document is exactly the one place
 *     the event never arrives — irrelevant for the frames, but it means the
 *     mechanism can never be tested from the page that owns the control.
 *  2. **Not every theme change touches storage.** `theme-toggle.tsx` writes
 *     `localStorage` inside a `try`, and says so: "storage may be denied; the
 *     page-local flip above still happened". Under a denied quota the attribute
 *     changes and no event is dispatched, so the frames desynchronise silently —
 *     the failure mode this whole library is organised against.
 *  3. **The stored value is not the effective one.** With no stored choice the
 *     page follows `prefers-color-scheme`, and an OS flip mid-session moves the
 *     page with zero storage writes.
 *
 * So the source of truth is the same one `theme-toggle.tsx` reads: the `data-theme`
 * attribute on `<html>`, plus the media query behind it. A `MutationObserver` on
 * that attribute catches every path — toggle, OS change, and any future control —
 * and the frames are same-origin, so writing the attribute into
 * `frame.contentDocument.documentElement` is a plain DOM write.
 * ═══════════════════════════════════════════════════════════════════════════ */

type Resolved = "light" | "dark";

/** Every same-origin preview frame on the page: component AND block previews. */
const PREVIEW_FRAMES = 'iframe[src^="/view/"], iframe[src^="/view-block/"]';

/**
 * The theme the PAGE is actually showing — an explicit stamp wins, otherwise
 * the OS. Deliberately the same three-state resolution `theme-toggle.tsx` and
 * `preview-toolbar.tsx` use; a fourth spelling of it would be a fourth thing to
 * keep in step.
 */
function effectiveTheme(): Resolved {
  const stamped = document.documentElement.getAttribute("data-theme");
  if (stamped === "dark" || stamped === "light") return stamped;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Stamps one frame's inner document, with the snap.
 *
 * Exported for the test: the whole mechanism is one DOM write plus one class,
 * and a test can hand it a real iframe rather than simulating a theme flip.
 *
 * Returns whether it wrote anything, so a caller — and the test — can tell "not
 * loaded yet" from "already correct".
 */
export function syncFrameTheme(frame: HTMLIFrameElement, theme: Resolved): boolean {
  let doc: Document | null = null;
  try {
    // Same-origin by construction (both routes are this site's own). The guard
    // is for the one case that is not a bug: a frame whose document has been
    // torn down mid-navigation, where the access throws instead of returning
    // null.
    doc = frame.contentDocument;
  } catch {
    return false;
  }
  const root = doc?.documentElement;
  if (!root) return false;
  if (root.getAttribute("data-theme") === theme) return false;

  // The same one-frame transition kill the header and the preview stage use.
  // Without it the inner document cross-fades every `transition-colors` surface
  // it owns, on its own clock, inside a 384px box.
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
 *
 * Mounted by `DemoFrame`, so component pages get it by existing. Exported
 * because the blocks pages build their `/view-block/` iframes themselves
 * (`DemoFrame` hardcodes the component route) — one `<PreviewFrameThemeSync />`
 * anywhere on those pages is the whole integration.
 *
 * Two instances on one page is fine and not worth coordinating away: the work
 * is an idempotent attribute write, and `syncFrameTheme` returns early when the
 * value already matches.
 */
export function PreviewFrameThemeSync() {
  useEffect(() => {
    const frames = () => Array.from(document.querySelectorAll<HTMLIFrameElement>(PREVIEW_FRAMES));
    const syncAll = () => {
      const theme = effectiveTheme();
      for (const frame of frames()) syncFrameTheme(frame, theme);
    };

    // A `loading="lazy"` frame has no document until it is revealed, and a
    // freshly loaded one has already read localStorage for itself — but not for
    // an OS-driven or storage-denied state, so it is stamped on arrival too.
    const onLoad = (event: Event) => {
      const frame = event.target as HTMLIFrameElement;
      syncFrameTheme(frame, effectiveTheme());
    };
    for (const frame of frames()) frame.addEventListener("load", onLoad);

    // The page's own flip. `theme-toggle.tsx` writes the attribute imperatively
    // so the snap and the flip land in one frame — which means an attribute
    // observer sees every change, including ones that never reach storage.
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
      {/*
       * Renders nothing. It exists so that flipping the header's theme repaints
       * the document INSIDE this frame too — see the block at the top of this
       * file for why the stamp comes from out here rather than from a listener
       * in the view layout.
       */}
      <PreviewFrameThemeSync />
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
