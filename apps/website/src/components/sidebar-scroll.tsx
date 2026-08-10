"use client";

import { useEffect } from "react";

/**
 * Keeps the sidebar's active entry in view across page loads.
 *
 * The complaint: "if you select something, the sidebar goes up the whole
 * time." Every navigation is a fresh document (static export) or a fresh
 * render of the page tree (client nav — the sidebar lives in each page, not
 * in a persisted layout), so the sidebar's own scroll container resets to the
 * top while the reader is forty components deep in the T section. shadcn's
 * docs keep the rail where you were; this recovers the same feel from the
 * other direction — instead of preserving scroll state across documents, it
 * scrolls the CURRENT entry into view on arrival, which lands within a row or
 * two of where the last document's rail stood.
 *
 * `block: "center"` rather than "nearest": nearest pins the active row to the
 * very edge of the container, which hides everything after it; centred shows
 * the neighbourhood — what you came from and what is next.
 *
 * A component, not an inline script: it must run after the sidebar exists,
 * and an effect after hydration is the earliest moment that is also CSP-clean.
 * The one-frame delay is invisible inside a `sticky` container that sits in
 * the viewport's top screen anyway.
 */
export function SidebarScroll() {
  useEffect(() => {
    const active = document.querySelector('[data-docs-sidebar] [aria-current="page"]');
    // scrollIntoView would also scroll the PAGE if the row is off the page's
    // own viewport; constrain the correction to the sidebar's scroll container
    // so arriving at a long page never yanks the reading position.
    const container = active?.closest("[data-docs-sidebar-scroll]");
    if (!active || !container) return;
    const a = (active as HTMLElement).getBoundingClientRect();
    const c = (container as HTMLElement).getBoundingClientRect();
    if (a.top < c.top || a.bottom > c.bottom) {
      (container as HTMLElement).scrollTop +=
        a.top - c.top - c.height / 2 + a.height / 2;
    }
  }, []);
  return null;
}
