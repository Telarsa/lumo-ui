import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { routes } from "./helpers";

/**
 * axe-core (WCAG 2.x A/AA) over EVERY built route, in Chromium. Serious and
 * critical violations fail; moderate/minor are reported in the trace only. A
 * per-route allowlist is deliberately absent: an engine defect we cannot fix
 * belongs in `docs/upstream/` and a `test.fixme` here with that link, not in a
 * silent list.
 */
// `/` is a 0-second meta-refresh onto `/fa/` (graded); axe cannot finish on a document that navigates.
const ALL = routes().filter((r) => r !== "/");

test("the export has routes to grade", () => {
  expect(ALL.length).toBeGreaterThan(500);
});

/**
 * WCAG 1.4.3 exempts text that is part of an inactive user-interface component. axe
 * has no notion of "inside a disabled field", so a disabled field's label and
 * description (`data-disabled` from Base UI's Field, `aria-disabled`, `:disabled`)
 * are excluded HERE — narrowly, by ancestor, and counted into the test annotations
 * so a page cannot quietly accumulate them. Everything else fails.
 */
const DISABLED_ANCESTOR = '[data-disabled], [aria-disabled="true"], :disabled, [data-disabled="true"]';

for (const route of ALL) {
  test(`axe ${route}`, async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "axe runs in Chromium; the other engines run the @cross subset");
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    let disabledText = 0;
    const serious = [];
    for (const v of results.violations) {
      if (v.impact !== "serious" && v.impact !== "critical") continue;
      let nodes = v.nodes;
      if (v.id === "color-contrast") {
        const kept = [];
        for (const n of nodes) {
          const inDisabled = await page
            .locator(n.target.join(" "))
            .first()
            .evaluate((el, sel) => el.closest(sel) !== null, DISABLED_ANCESTOR)
            .catch(() => false);
          if (inDisabled) disabledText++;
          else kept.push(n);
        }
        nodes = kept;
      }
      if (nodes.length > 0) serious.push(`${v.id} (${v.impact}): ${nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
    }
    if (disabledText > 0) {
      test.info().annotations.push({ type: "disabled-text-excluded", description: `${disabledText} contrast node(s) inside a disabled component (WCAG 1.4.3 exemption)` });
    }
    expect(serious).toEqual([]);
  });
}
