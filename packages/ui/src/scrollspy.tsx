"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A table of contents that knows where the reader is.
 *
 *     <Scrollspy
 *       label="در این صفحه"
 *       items={[{ id: "install", label: "نصب" }, { id: "usage", label: "استفاده" }]}
 *     />
 *
 * ═══ IT IS A `<nav>` OF LINKS, AND THE LINKS ARE REAL ═══════════════════════
 *
 * Every anchor here is a genuine `href="#id"` that works with JavaScript
 * disabled, before hydration, and in a printed page. The observer only decides
 * which one is MARKED — it never intercepts the click, never calls
 * `scrollIntoView`, and never writes `history`. That is the difference between
 * a table of contents that degrades and one that is a list of dead text until
 * a bundle arrives.
 *
 * ═══ `aria-current="location"`, NOT `aria-selected` AND NOT A CLASS ═════════
 *
 * The state is "this link points at the part of the page you are looking at",
 * and `aria-current="location"` is the token for exactly that — it is what a
 * screen reader announces as "current location". `aria-selected` belongs to
 * widgets with a selection model (tabs, options) and is meaningless on a link;
 * a class alone is invisible to anyone not looking at the screen.
 *
 * The class then follows the attribute — `aria-current:font-medium` — rather
 * than being applied in parallel. One source of truth, so the visual state
 * cannot disagree with the announced one.
 *
 * ═══ WHY THE TOPMOST VISIBLE HEADING, NOT THE MOST VISIBLE ONE ══════════════
 *
 * `IntersectionObserver` reports several sections intersecting at once on any
 * screen taller than a section. Two rules are available and they behave very
 * differently:
 *
 *   most visible    Pick the entry with the largest `intersectionRatio`. Reads
 *                   well in a demo and thrashes in real prose: a short section
 *                   between two long ones is never the largest, so it is never
 *                   marked, and its heading is unreachable from the contents.
 *
 *   topmost         Pick the first section whose top has passed the reader.
 *                   This is what "where am I" means to a person reading down a
 *                   page, and every heading gets its turn.
 *
 * The second is what this does, and the `rootMargin` is what implements it: a
 * large negative bottom inset shrinks the observation band to a strip near the
 * top of the viewport, so "intersecting" means "at the reader's eye line"
 * rather than "somewhere on screen".
 *
 * ═══ THE LAST SECTION, WHICH EVERY SCROLLSPY GETS WRONG ═════════════════════
 *
 * A short final section never reaches the strip — the page runs out of scroll
 * first — so the last entry in the contents can never be marked, no matter how
 * far down the reader goes. It is the most reported bug in every scrollspy
 * implementation and it needs its own rule, not a smaller margin: at the bottom
 * of the document, the last item wins outright.
 *
 * ═══ DEGRADATION ═══════════════════════════════════════════════════════════
 *
 * No `IntersectionObserver` — jsdom, or a browser old enough to matter — and
 * the links still render, still navigate, and simply never mark themselves.
 * The feature detection is the same call `virtualizer.ts` and
 * `message-scroller.tsx` make: a hook that throws from inside an effect makes
 * the component unrenderable in every consumer's test suite.
 */

export const scrollspyVariants = cva("flex flex-col gap-1 text-sm");

export const scrollspyLinkVariants = cva(
  // The active class follows the ARIA attribute rather than sitting beside it,
  // so the visible state cannot disagree with the announced one.
  // `border-s` and `ps-3`: the marker rail is on the reader's leading edge.
  "border-s border-transparent ps-3 py-1 text-fg-muted transition-colors " +
    "hover:text-fg " +
    "aria-current:border-accent aria-current:font-medium aria-current:text-fg",
);

export interface ScrollspyItem {
  /** The heading's `id`. The link's `href` is `#id`. */
  id: string;
  label: LumoNode;
}

export interface ScrollspyProps {
  /**
   * Names the navigation, e.g. «در این صفحه». REQUIRED.
   *
   * A page routinely has several `<nav>` elements, and a screen reader's
   * landmark list shows them by name. Two unnamed ones are indistinguishable.
   */
  label: string;
  items: readonly ScrollspyItem[];
  /**
   * How far down the viewport the reader's eye line sits, as a CSS length.
   *
   * The default clears a typical sticky header. Raise it if yours is taller —
   * the symptom of getting this wrong is a contents list that marks the section
   * ABOVE the one on screen, because the strip is still behind the header.
   */
  topOffset?: string;
  className?: string | undefined;
}

export function Scrollspy({
  label,
  items,
  topOffset = "80px",
  className,
}: ScrollspyProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    if (items.length === 0) return;

    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    /*
     * The observer records WHICH sections are in the strip; this picks the
     * topmost of them by document order. Deliberately not by
     * `intersectionRatio` — see the file header.
     */
    const inStrip = new Set<string>();

    const pick = () => {
      // The last-section rule, which is not an optimisation: a short final
      // section never reaches the strip because the page runs out of scroll
      // first, so without this the last entry can never be marked.
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) {
        setActiveId(items.at(-1)?.id ?? null);
        return;
      }
      const topmost = elements.find((el) => inStrip.has(el.id));
      if (topmost) setActiveId(topmost.id);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) inStrip.add(entry.target.id);
          else inStrip.delete(entry.target.id);
        }
        pick();
      },
      {
        // The strip. A large negative bottom inset means "intersecting" is
        // "at the reader's eye line", not "somewhere on screen".
        rootMargin: `-${topOffset} 0px -70% 0px`,
      },
    );

    for (const el of elements) observer.observe(el);
    // The bottom rule is a SCROLL fact, not an intersection one, so it needs
    // its own listener — the observer does not fire again once the last
    // section has settled.
    window.addEventListener("scroll", pick, { passive: true });
    pick();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", pick);
    };
  }, [items, topOffset]);

  return (
    <nav aria-label={label} data-lumo="" className={cn(scrollspyVariants(), className)}>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          // `location` and not `true` or `page`: this link points at the part
          // of the page the reader is looking at, which is what the token
          // means. See the file header.
          {...(activeId === item.id ? { "aria-current": "location" as const } : {})}
          className={scrollspyLinkVariants()}
        >
          {item.label as React.ReactNode}
        </a>
      ))}
    </nav>
  );
}
