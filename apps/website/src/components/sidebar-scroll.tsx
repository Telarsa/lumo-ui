"use client";

import { useEffect } from "react";

/**
 * Keeps the sidebar's active entry in view: every navigation resets the rail's
 * scroll container, so this centres the CURRENT entry on arrival. A component,
 * not an inline script: it must run after the sidebar exists, CSP-clean.
 */
export function SidebarScroll() {
  useEffect(() => {
    const active = document.querySelector('[data-docs-sidebar] [aria-current="page"]');
    // Constrain the correction to the sidebar's own scroll container so
    // arriving at a long page never yanks the reading position.
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
