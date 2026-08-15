import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { demoRoot, latinSpoken } from "./helpers";

/**
 * Popup interiors, opened FOR REAL in a browser on the built fa pages, then:
 *   1. their ARIA tree is pinned as an aria snapshot (text, committed beside this file);
 *   2. no spoken attribute inside the popup carries a Latin word (outside `data-lumo-latn`);
 *   3. the popup has an authored accessible name where its role needs one;
 *   4. axe (WCAG 2.x A/AA) reports no serious/critical violation with the popup open (Chromium).
 * This is the browser twin of `packages/ui/src/popup-interiors.test.tsx` (jsdom + gate rules).
 * It proves accessibility-TREE facts in Chromium/WebKit/Firefox. It is not a screen-reader run.
 */

interface Family {
  slug: string;
  open: (root: Locator, page: Page) => Promise<void>;
  /** CSS selector(s) for the popup element once open. */
  popup: string;
  /** Roles that need no name of their own (tooltip: its content IS the name of the trigger). */
  unnamedOk?: boolean;
  /** An engine defect recorded in docs/upstream/; axe is still RUN and reported, but does not fail. */
  axeFixme?: string;
}

const click = (selector: string) => async (root: Locator) => {
  await root.locator(selector).first().click();
};
const hover = (selector: string) => async (root: Locator) => {
  await root.locator(selector).first().hover();
};
const focusArrowDown = (selector: string) => async (root: Locator, page: Page) => {
  await root.locator(selector).first().focus();
  await page.keyboard.press("ArrowDown");
};

const FAMILIES: Family[] = [
  { slug: "dialog", open: click('button[aria-haspopup="dialog"]'), popup: '[role="dialog"]' },
  { slug: "alert-dialog", open: click("button[data-base-ui-click-trigger]"), popup: '[role="alertdialog"]' },
  { slug: "drawer", open: click("button[data-base-ui-click-trigger]"), popup: '[role="dialog"]' },
  { slug: "command", open: click("button[data-base-ui-click-trigger]"), popup: '[role="dialog"]' },
  { slug: "popover", open: click("button[data-base-ui-click-trigger]"), popup: '[data-open][role="dialog"], [data-open] [role="dialog"]' },
  { slug: "menu", open: click('button[aria-haspopup="menu"]'), popup: '[role="menu"]' },
  {
    slug: "menubar",
    open: click("button"),
    popup: '[role="menu"]',
    // Base UI injects its focus guards INSIDE role="menubar" while a menu is open → axe aria-required-children.
    axeFixme: "docs/upstream/base-ui-focus-guards.md",
  },
  {
    slug: "context-menu",
    open: async (root) => {
      await root.locator("p").first().click({ button: "right" });
    },
    popup: '[role="menu"]',
  },
  { slug: "select", open: click('[role="combobox"]'), popup: '[role="listbox"]' },
  // Base UI marks the rest of the document aria-hidden (without inert) while a Combobox list is open → axe aria-hidden-focus.
  { slug: "combobox", open: focusArrowDown("input"), popup: '[role="listbox"]', axeFixme: "docs/upstream/base-ui-focus-guards.md" },
  { slug: "multi-select", open: focusArrowDown('[role="combobox"]'), popup: '[role="listbox"]', axeFixme: "docs/upstream/base-ui-focus-guards.md" },
  { slug: "autocomplete", open: click("input"), popup: '[role="listbox"]' },
  { slug: "cascader", open: click("button"), popup: '[role="listbox"], [role="dialog"]' },
  { slug: "tree-select", open: click("button"), popup: '[role="tree"], [role="listbox"], [role="dialog"]' },
  { slug: "date-picker", open: click('button[aria-label]'), popup: '[role="dialog"]' },
  { slug: "date-range-picker", open: click('button[aria-label]'), popup: '[role="dialog"]' },
  { slug: "date-selector", open: click("button"), popup: '[role="dialog"], [role="listbox"]' },
  { slug: "tooltip", open: hover("button[aria-label]"), popup: '[role="tooltip"]', unnamedOk: true },
  // Lumo's hover card popup is role=dialog with a required label — named like any dialog.
  { slug: "hover-card", open: hover("a[href]"), popup: '[data-open] [role="dialog"], [data-open][role="dialog"]' },
  {
    slug: "navigation-menu",
    open: click("button[aria-expanded]"),
    popup: '[data-open] [data-lumo], [data-open]',
    unnamedOk: true,
    // Base UI's focus guards (`span[data-base-ui-focus-guard][aria-hidden="true"]`, tabindex 0 while open)
    // trip axe `aria-hidden-focus` (serious). Engine behaviour: docs/upstream/base-ui-focus-guards.md.
    axeFixme: "docs/upstream/base-ui-focus-guards.md",
  },
];

for (const family of FAMILIES) {
  test(`${family.slug} popup interior @cross`, async ({ page, browserName }) => {
    await page.goto(`/fa/components/${family.slug}/`);
    const root = demoRoot(page);
    await expect(root).toBeVisible();
    await family.open(root, page);
    const popup = page.locator(family.popup).first();
    await expect(popup, `${family.slug}: popup did not open`).toBeVisible();

    // 1. the ARIA tree, pinned
    await expect(popup).toMatchAriaSnapshot({ name: `${family.slug}.aria.yml` });

    // 2. nothing spoken in Latin
    expect(await latinSpoken(popup), `${family.slug}: Latin in a spoken attribute`).toEqual([]);

    // 3. a computed accessible name where the role needs one — the ENGINE's accname
    //    (Playwright's matcher), not a DOM approximation: the second blind pass showed a
    //    listbox whose aria-labelledby pointed at a role=combobox trigger, which names by
    //    VALUE, so every attribute-reading check said "named" while the tree said nothing.
    if (!family.unnamedOk) {
      const role = await popup.getAttribute("role");
      if (role !== null && role !== "tooltip") {
        await expect(popup, `${family.slug}: role=${role} has no computed accessible name`).toHaveAccessibleName(/\S/);
      }
    }

    // 4. axe with the popup open (Chromium; the other engines pin the tree above)
    if (browserName === "chromium") {
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      const report = serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
      if (family.axeFixme !== undefined && report.length > 0) {
        test.info().annotations.push({ type: "fixme", description: `${family.axeFixme}: ${report.join(" | ")}` });
      } else {
        expect(report, `${family.slug}: axe serious/critical with the popup open`).toEqual([]);
      }
    }
  });
}
