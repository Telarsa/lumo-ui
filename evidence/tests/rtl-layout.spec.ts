import { expect, test, type Page } from "@playwright/test";
import { demoRoot, routes } from "./helpers";

/**
 * RTL LAYOUT evidence in real layout engines: not pixels (font rendering
 * differs per OS, so screenshot baselines lie across machines) but GEOMETRY.
 * For every mirrored family, the same two elements must be ordered
 * right-to-left on the fa page and left-to-right on the en page; the document
 * must be `dir="rtl"` with `direction: rtl` computed; and no fa route may
 * scroll horizontally. Proves layout-tree facts in Chromium/WebKit/Firefox.
 */

/** Two siblings whose reading order must flip with the document direction. */
const MIRRORS: Array<{ slug: string; items: string }> = [
  { slug: "tabs", items: '[role="tab"]' },
  { slug: "toggle-group", items: '[role="radiogroup"] button, [role="group"] button' },
  { slug: "button-group", items: "button" },
  { slug: "pagination", items: "nav button, nav a" },
  { slug: "steps", items: "ol li" },
  { slug: "toolbar", items: '[role="toolbar"] button' },
  { slug: "menubar", items: '[role="menubar"] button' },
  // breadcrumbs, segmented-control and stack: their first-example markup does not put two items on one row
  // with a stable selector; they are NOT in this list rather than silently skipped. Add them with a proved selector.
];

async function firstTwoBoxes(page: Page, items: string) {
  const root = demoRoot(page);
  const els = root.locator(items);
  const count = await els.count();
  if (count < 2) return null;
  const a = await els.nth(0).boundingBox();
  const b = await els.nth(1).boundingBox();
  if (!a || !b) return null;
  // Same row only: a vertical stack tells us nothing about direction.
  if (Math.abs(a.y - b.y) > Math.max(a.height, b.height)) return null;
  return { a, b };
}

for (const { slug, items } of MIRRORS) {
  test(`${slug}: reading order flips with direction @cross`, async ({ page }) => {
    await page.goto(`/fa/components/${slug}/`);
    const fa = await firstTwoBoxes(page, items);
    await page.goto(`/en/components/${slug}/`);
    const en = await firstTwoBoxes(page, items);
    // The list is curated: a family that no longer renders two same-row items is a finding, not a skip.
    expect(fa, `${slug} fa: fewer than two same-row items matched "${items}"`).not.toBeNull();
    expect(en, `${slug} en: fewer than two same-row items matched "${items}"`).not.toBeNull();
    expect(fa!.a.x, `${slug} fa: first item should sit to the RIGHT of the second`).toBeGreaterThan(fa!.b.x);
    expect(en!.a.x, `${slug} en: first item should sit to the LEFT of the second`).toBeLessThan(en!.b.x);
  });
}

const FA_SAMPLE = routes("fa/components/").filter((_, i) => i % 6 === 0).slice(0, 20);
FA_SAMPLE.push("/fa/", "/fa/docs/installation/");

for (const route of FA_SAMPLE) {
  test(`${route}: rtl document, no horizontal scroll @cross`, async ({ page }) => {
    await page.goto(route);
    const facts = await page.evaluate(() => {
      const html = document.documentElement;
      return {
        dir: html.getAttribute("dir"),
        lang: html.getAttribute("lang"),
        direction: getComputedStyle(html).direction,
        overflow: html.scrollWidth - html.clientWidth,
      };
    });
    expect(facts.dir).toBe("rtl");
    expect(facts.direction).toBe("rtl");
    expect(facts.lang?.startsWith("fa")).toBe(true);
    expect(facts.overflow, `${route} scrolls horizontally by ${facts.overflow}px`).toBeLessThanOrEqual(0);
  });
}
