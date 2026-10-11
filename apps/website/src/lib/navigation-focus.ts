/** Reveal the complete focused link inside its own horizontal navigation rail. */
export function revealFocusedNavigationLink(link: HTMLElement, rail: HTMLElement | null) {
  const reveal = () => {
    if (!rail || document.activeElement !== link || rail.scrollWidth <= rail.clientWidth + 1) return;
    const viewport = rail.getBoundingClientRect();
    const target = link.getBoundingClientRect();
    const focus = getComputedStyle(link);
    const ring = parseFloat(focus.outlineWidth) + parseFloat(focus.outlineOffset);
    const inset = Math.min(Math.max(4, ring + 1), Math.max(0, (rail.clientWidth - target.width) / 2));
    const left = viewport.left + rail.clientLeft + inset;
    const right = viewport.left + rail.clientLeft + rail.clientWidth - inset;
    const delta = target.left < left ? target.left - left : target.right > right ? target.right - right : 0;
    if (Math.abs(delta) > 0.5) rail.scrollBy({ left: delta, behavior: "instant" });
  };
  // Native focus may keep a partly visible link in place. The next frame also
  // covers the browser's own focus scroll without moving the page or its focus.
  reveal();
  requestAnimationFrame(reveal);
}
