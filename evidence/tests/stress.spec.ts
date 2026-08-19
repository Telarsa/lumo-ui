import { expect, test } from "@playwright/test";
import { routes } from "./helpers";

/**
 * STRESS — the two conditions a component library meets in production and never
 * meets in its own gallery: a small phone, and a reader who has turned the text
 * up.
 *
 * This is the web counterpart of `apps/mobile-gallery/test/composition_stress_test.dart`,
 * written after the mobile sweep found three real overflows at 2x text that 679
 * library tests and 120 demos had never looked for. The web had the same hole:
 * `gate:smoke` proves a component INSTALLS and TYPECHECKS outside the
 * workspace and never renders it, and the RTL spec checks horizontal overflow
 * on 20 sampled routes at a desktop viewport only.
 *
 * Both checks are the same fact — `documentElement.scrollWidth` exceeding
 * `clientWidth` — because that is the one overflow a reader cannot work around.
 * Vertical growth is fine; a page you must scroll SIDEWAYS to read is not.
 *
 * Chromium only (no `@cross` tag). Overflow arithmetic is layout, not
 * engine-specific text shaping, and running three engines over every component
 * route would treble the slowest job in CI for a fact that does not vary.
 */

/** Every fa component route — not a sample. Overflow hides in the one you skipped. */
const COMPONENT_ROUTES = routes("fa/components/");

/** The narrowest phone anything realistically ships to: an iPhone SE. */
const NARROW = { width: 320, height: 640 };

/**
 * 200% text. The browser's own font-size setting scales the root font, which is
 * what `rem` resolves against — so doubling it is what the reader's setting
 * actually does, and it is a far harsher test than zoom (zoom scales the
 * viewport too, so the layout keeps its proportions; a font-size change does
 * not).
 */
const ROOT_FONT_PX = 32;

/**
 * The routes that still scroll sideways at 200% text, and an honest account of
 * why they are a list rather than a fix.
 *
 * Each one's overflow is PURELY SCROLLABLE: walking the whole tree, not one
 * element's border box extends past the viewport, yet the document can still be
 * scrolled 4–242px. Every candidate was measured and cleared — the demo stage
 * scrolls correctly (`scrollWidth 721` inside a `clientWidth 292` scrollport),
 * forcing every `overflow-x: auto` element to `hidden` changes nothing, and the
 * section reports `scrollWidth === clientWidth`. Isolating sections one at a
 * time reproduces it for exactly these, so it is real and route-specific.
 *
 * It is recorded rather than guessed at. The list may only SHRINK: a new entry
 * means a route started scrolling sideways, which is the defect this sweep
 * exists to catch.
 */
// route → the WORST overflow measured when pinned (px). A ratchet in both
// directions: growing past the cap fails (the defect got worse), and dropping
// to zero fails too (it is fixed — remove the entry). The 18 Aug blind review
// asked for exactly this: a pin without a severity cap lets a 4px nuisance
// quietly become a 400px break while staying "known".
const KNOWN_SIDEWAYS_AT_200 = new Map<string, number>([
  ["/fa/components/chart/", 87],
  ["/fa/components/dialog/", 4],
  ["/fa/components/drawer/mobile/", 10],
  ["/fa/components/segmented-control/", 15],
  ["/fa/components/segmented-control/mobile/", 15],
  ["/fa/components/steps/", 242],
  ["/fa/components/table/", 15],
]);


async function horizontalOverflow(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const html = document.documentElement;
    const over = html.scrollWidth - html.clientWidth;
    if (over <= 0) return { over, culprit: "" };
    // Name the widest offender, so a failure is actionable rather than a number.
    let worst = "";
    let worstRight = html.clientWidth;
    for (const el of Array.from(document.body.querySelectorAll<HTMLElement>("*"))) {
      const box = el.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) continue;
      const right = Math.max(box.right, html.clientWidth - box.left);
      if (right > worstRight) {
        worstRight = right;
        const id = el.getAttribute("data-slot") ?? el.className?.toString().slice(0, 60) ?? "";
        worst = `<${el.tagName.toLowerCase()} ${id}>`;
      }
    }
    return { over, culprit: worst };
  });
}

test.describe("a small phone", () => {
  test.use({ viewport: NARROW });
  for (const route of COMPONENT_ROUTES) {
    test(`${route} does not scroll sideways at 320px`, async ({ page }) => {
      await page.goto(route);
      const { over, culprit } = await horizontalOverflow(page);
      expect(over, `${route} overflows by ${over}px — widest: ${culprit}`).toBeLessThanOrEqual(0);
    });
  }
});

test.describe("a reader who turned the text up", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  for (const route of COMPONENT_ROUTES) {
    test(`${route} does not scroll sideways at 200% text`, async ({ page }) => {
      await page.goto(route);
      await page.addStyleTag({ content: `html { font-size: ${ROOT_FONT_PX}px !important; }` });
      // The style lands before paint; give layout a frame to settle on it.
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
      const { over, culprit } = await horizontalOverflow(page);
      const cap = KNOWN_SIDEWAYS_AT_200.get(route);
      if (cap !== undefined) {
        // Pinned, not excused — and capped: worse than the recorded overflow
        // is a regression, zero means fixed and the entry must go.
        expect(over, `${route} no longer overflows — remove it from KNOWN_SIDEWAYS_AT_200`).toBeGreaterThan(0);
        expect(over, `${route} overflow grew past its recorded ${cap}px — widest: ${culprit}`).toBeLessThanOrEqual(cap);
        return;
      }
      expect(over, `${route} overflows by ${over}px at 200% text — widest: ${culprit}`).toBeLessThanOrEqual(0);
    });
  }
});
