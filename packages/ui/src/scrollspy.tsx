"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A table of contents that knows where the reader is. Every anchor is a real
 * `href="#id"`; the observer only decides which is MARKED, with
 * `aria-current="location"` (the class follows the attribute). It marks the
 * TOPMOST section in a strip near the eye line, not the most visible one,
 * which starves short sections; at the bottom of the document the last item
 * wins outright. Without `IntersectionObserver` the links still navigate.
 */

export const scrollspyVariants = cva("flex flex-col gap-1 text-sm");

export const scrollspyLinkVariants = cva(
  // The active class follows the ARIA attribute; `border-s`/`ps-3` put the rail on the leading edge.
  "border-s border-transparent ps-3 py-1 text-fg-muted transition-colors " +
    "hover:text-fg " +
    "active:translate-y-px " +
    "aria-current:border-accent aria-current:font-medium aria-current:text-fg",
);

export interface ScrollspyItem {
  /** The heading's `id`. The link's `href` is `#id`. */
  id: string;
  label: LumoNode;
}

export interface ScrollspyProps {
  /** Names the navigation, e.g. «در این صفحه». REQUIRED — a page routinely has several `<nav>`s. */
  label: string;
  /** The page sections linked: each an element id with a visible label. */
  items: readonly ScrollspyItem[];
  /** How far down the viewport the eye line sits. The default clears a typical sticky header; raise it if yours is taller. */
  topOffset?: string;
  /** Scroll container to observe. Omit it for the document viewport. */
  scrollRootRef?: React.RefObject<HTMLElement | null> | undefined;
  /** Called when the section carrying `aria-current="location"` changes. */
  onActiveChange?: ((id: string | null) => void) | undefined;
  className?: string | undefined;
}

export function Scrollspy({
  label,
  items,
  topOffset = "80px",
  scrollRootRef,
  onActiveChange,
  className,
}: ScrollspyProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const activeIdRef = React.useRef<string | null>(null);
  const commitActive = React.useCallback(
    (id: string | null) => {
      if (activeIdRef.current === id) return;
      activeIdRef.current = id;
      setActiveId(id);
      onActiveChange?.(id);
    },
    [onActiveChange],
  );

  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    if (items.length === 0) return;

    const scrollRoot = scrollRootRef?.current ?? null;
    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter(
        (el): el is HTMLElement =>
          el !== null && (scrollRoot === null || scrollRoot.contains(el)),
      );
    if (elements.length === 0) return;

    // The observer records WHICH sections are in the strip; `pick` takes the topmost by document order.
    const inStrip = new Set<string>();

    const pick = () => {
      // The last-section rule: a short final section never reaches the strip.
      const atBottom = scrollRoot
        ? scrollRoot.scrollTop + scrollRoot.clientHeight >= scrollRoot.scrollHeight - 2
        : window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) {
        commitActive(elements.at(-1)?.id ?? null);
        return;
      }
      const topmost = elements.find((el) => inStrip.has(el.id));
      if (topmost) commitActive(topmost.id);
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
        root: scrollRoot,
        // The strip: a large negative bottom inset means "at the eye line".
        rootMargin: `-${topOffset} 0px -70% 0px`,
      },
    );

    for (const el of elements) observer.observe(el);
    // The bottom rule is a SCROLL fact, not an intersection one, so it needs its own listener.
    const scrollTarget = scrollRoot ?? window;
    scrollTarget.addEventListener("scroll", pick, { passive: true });
    pick();

    return () => {
      observer.disconnect();
      scrollTarget.removeEventListener("scroll", pick);
    };
  }, [commitActive, items, scrollRootRef, topOffset]);

  return (
    <nav aria-label={label} data-lumo="" className={cn(scrollspyVariants(), className)}>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          {...(activeId === item.id ? { "aria-current": "location" as const } : {})}
          className={scrollspyLinkVariants()}
        >
          {item.label as React.ReactNode}
        </a>
      ))}
    </nav>
  );
}
