/* Inline in the document head so early input is observed without a network request. */
export const fragmentClearanceScript = String.raw`/* Preserve native history and fragment links. A reload can restore the old
 * scroll position against fallback font metrics, before the real font moves
 * the section. Correct only an obscured initial docs heading, and only while
 * the reader has not taken control of the page. */
(() => {
  const initialUrl = location.href;
  let id;
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  if (!/^\/(en|de|fa)\/docs\/[^/]+\/?$/.test(location.pathname) || !/^[a-z][a-z-]*$/.test(id)) return;
  // History traversal owns its restored reading position, including on a
  // traversal that causes a fresh document load instead of a bfcache restore.
  if (performance.getEntriesByType("navigation")[0]?.type === "back_forward") return;

  let cancelled = false;
  const inputs = ["wheel", "touchstart", "pointerdown", "keydown"];
  const cleanup = () => {
    for (const type of inputs) window.removeEventListener(type, cancel, true);
    window.removeEventListener("hashchange", cancel);
    window.removeEventListener("popstate", cancel);
    window.removeEventListener("pagehide", cancel);
    document.removeEventListener("DOMContentLoaded", ready);
  };
  const cancel = () => { cancelled = true; cleanup(); };
  const ready = () => {
    const target = document.getElementById(id);
    if (!target?.matches(".doc-section")) { cleanup(); return; }
    document.fonts.ready.then(() => {
      if (cancelled || location.href !== initialUrl || document.getElementById(id) !== target) { cleanup(); return; }
      const heading = target.querySelector(".doc-h2");
      const header = document.querySelector(".site-header");
      if (heading && header) {
        const top = heading.getBoundingClientRect().top;
        const bottom = header.getBoundingClientRect().bottom;
        // A heading above the viewport can be an intentionally restored reading
        // position; only repair an actual overlap within the viewport.
        if (top >= 0 && top < bottom) {
          const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingBlockStart) || 0;
          const margin = parseFloat(getComputedStyle(target).scrollMarginBlockStart) || 0;
          window.scrollBy({ top: top - (Math.max(bottom, padding) + margin), behavior: "instant" });
        }
      }
      cleanup();
    }, cleanup);
  };
  for (const type of inputs) window.addEventListener(type, cancel, { capture: true, passive: true });
  window.addEventListener("hashchange", cancel);
  window.addEventListener("popstate", cancel);
  window.addEventListener("pagehide", cancel);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready, { once: true });
  else ready();
})();
`;
