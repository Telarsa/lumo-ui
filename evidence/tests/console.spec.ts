import { expect, test } from "@playwright/test";
import { routes } from "./helpers";

/**
 * NOTHING THROWS AND NOTHING WARNS — on every built route, in a real browser.
 *
 * The site is statically exported, so `gate:html` proves the SERVER produced
 * good markup. It says nothing about what happens once React runs against it:
 * a hydration mismatch, a key warning, a failed image, an uncaught error in an
 * effect. All of those are silent to every other instrument in this repo and
 * loud in a consumer's console — and a hydration mismatch in particular means
 * the DOM the reader ends up with is not the DOM the gate graded.
 *
 * Every route, not a sample. Chromium only: these are React and platform
 * diagnostics, not engine-specific rendering.
 */
const ALL = routes();

/**
 * Console noise that is the harness's, not the site's. Kept as an explicit,
 * short list — an empty ignore list would fail on things no one can fix, and a
 * broad one would hide the defects this exists to find.
 */
const IGNORE = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  // Flutter's own loader (`flutter_bootstrap.js` in the embedded mobile
  // preview) warns when its service worker takes >4s to prepare, then proceeds
  // ("Moving on"). Under a dozen parallel Playwright workers that timer fires
  // on timing alone; the gallery still loads, so it is contention noise, not a
  // page defect. Scoped to the exact message so a real loader failure still fails.
  /prepareServiceWorker took more than \d+ms to resolve\. Moving on/,
];

for (const route of ALL) {
  test(`${route}: no console errors, warnings or uncaught exceptions`, async ({ page }) => {
    const noise: string[] = [];
    page.on("console", (message) => {
      const type = message.type();
      if (type !== "error" && type !== "warning") return;
      const text = message.text();
      if (IGNORE.some((pattern) => pattern.test(text))) return;
      noise.push(`console.${type}: ${text}`);
    });
    page.on("pageerror", (error) => noise.push(`uncaught: ${error.message}`));
    page.on("requestfailed", (request) => {
      // A failed request for a real asset is a broken page; ignore aborts the
      // browser itself causes on navigation.
      const failure = request.failure()?.errorText ?? "";
      if (/ERR_ABORTED/.test(failure)) return;
      noise.push(`request failed (${failure}): ${request.url()}`);
    });

    // `load`, NOT `networkidle`: every page's sidebar holds ~150 links and
    // Next prefetches the ones in view, so "network idle" means "every prefetch
    // finished" — ~13s per route, two hours for the sweep, waiting on traffic
    // that is not page health. Hydration runs at first paint after load; two
    // frames are enough for React to commit and any mismatch to be reported.
    await page.goto(route, { waitUntil: "load" });
    // A route may client-redirect (the bare root sends the reader to their
    // locale home), which destroys the evaluation context mid-wait. Settle on
    // the landed document and sample its frames instead — the redirect target
    // is graded by its own test, but the landing must still be error-free.
    const frames = () =>
      page.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null)))),
      );
    try {
      await frames();
    } catch {
      await page.waitForLoadState("load");
      await frames();
    }

    expect(noise, `${route}\n  ${noise.join("\n  ")}`).toEqual([]);
  });
}
