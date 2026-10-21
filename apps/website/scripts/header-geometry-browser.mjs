/** Focused served-header geometry and navigation regression. */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const from = process.env.PLAYWRIGHT_FROM;
assert.ok(from, "PLAYWRIGHT_FROM must point to installed Playwright package metadata");
const { webkit } = createRequire(resolve(from))("@playwright/test");
const origin = process.env.WEBSITE_URL || "http://127.0.0.1:3113";
const widths = process.env.HEADER_WIDTHS ? process.env.HEADER_WIDTHS.split(",").map(Number) : [1920, 1440, 1100, 768, 390];
const browser = await webkit.launch({ headless: true });
try {
  for (const locale of ["en", "de", "fa"]) for (const theme of ["light", "dark"]) for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce", hasTouch: width < 1152 });
    try {
      await context.addInitScript((value) => localStorage.setItem("lumo-theme", value), theme);
      const page = await context.newPage();
      await page.goto(`${origin}/${locale}/`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      if (width < 1152) await page.locator(".mobile-menu > summary").click();
      const data = await page.evaluate(() => {
        const header = document.querySelector(".site-header");
        const frame = document.querySelector(".header-row");
        const logo = document.querySelector('.site-header .brand img:not([style*="display: none"])');
        const visibleLogo = [...document.querySelectorAll(".site-header .brand img")].find((node) => getComputedStyle(node).display !== "none");
        const style = getComputedStyle(frame);
        const controls = [...document.querySelectorAll(".header-controls .control, .header-start, .mobile-menu > summary")].filter((node) => node.getClientRects().length > 0).map((node) => { const rect = node.getBoundingClientRect(); const hit = getComputedStyle(node, "::after"); return { width: rect.width, height: rect.height, hitWidth: rect.width - (parseFloat(hit.left) || 0) - (parseFloat(hit.right) || 0), hitHeight: rect.height - (parseFloat(hit.top) || 0) - (parseFloat(hit.bottom) || 0) }; });
        const rowControls = [...document.querySelectorAll(".mobile-menu-panel .header-controls > *")].map((node) => node.getBoundingClientRect());
        const touchOverlap = rowControls.some((a, i) => rowControls.slice(i + 1).some((b) => a.left - 4 < b.right + 4 && a.right + 4 > b.left - 4 && a.top - 4 < b.bottom + 4 && a.bottom + 4 > b.top - 4));
        const button = document.querySelector(".hero .button");
        const nav = document.querySelector(innerWidth < 1152 ? ".mobile-nav" : ".desktop-nav");
        const brandRect = (visibleLogo || logo).getBoundingClientRect();
        const adjacent = document.querySelector(innerWidth < 1152 ? ".mobile-menu > summary" : ".desktop-nav").getBoundingClientRect();
        const overlap = brandRect.left < adjacent.right && brandRect.right > adjacent.left && brandRect.top < adjacent.bottom && brandRect.bottom > adjacent.top;
        return { header: header.getBoundingClientRect().height, frame: frame.getBoundingClientRect().width, paddingStart: parseFloat(style.paddingInlineStart), paddingEnd: parseFloat(style.paddingInlineEnd), logo: brandRect.height, overlap, touchOverlap, controls, buttonHeight: button.getBoundingClientRect().height, buttonFont: parseFloat(getComputedStyle(button).fontSize), bodyFont: parseFloat(getComputedStyle(document.body).fontSize), navVisible: getComputedStyle(nav).display !== "none", navLinks: nav.querySelectorAll("a").length, overflow: document.documentElement.scrollWidth > innerWidth + 1 };
      });
      const approx = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1, `${label}: ${actual} != ${expected}`);
      approx(data.header, width < 1024 ? 52 : 68, "header height");
      approx(data.frame, Math.min(width, 1440), "frame width");
      approx(data.paddingStart, 24, "frame start padding");
      approx(data.paddingEnd, 24, "frame end padding");
      approx(data.logo, 32, "logo height");
      assert.equal(data.overlap, false, "logo does not overlap navigation");
      assert.ok(data.controls.length >= 2 && data.controls.every(({ width: w, height: h }) => w >= 36 && h === 36), "header controls use the 36px visible scale");
      if (width < 1152) assert.ok(data.controls.every(({ hitWidth, hitHeight }) => hitWidth >= 44 && hitHeight >= 44), "touch targets extend to 44px");
      if (width < 1152) assert.equal(data.touchOverlap, false, "adjacent touch targets do not overlap");
      approx(data.buttonHeight, 40, "main button height");
      approx(data.buttonFont, 14, "button label size");
      approx(data.bodyFont, 16, "body text size");
      assert.ok(data.navVisible && data.navLinks === 3, "primary navigation remains available");
      assert.equal(data.overflow, false, "no document horizontal overflow");
      assert.equal(await page.locator("html").getAttribute("data-theme"), theme);
      if (width < 1152) {
        const menu = page.locator(".mobile-menu");
        assert.equal(await menu.locator(".header-start").count(), 1, "mobile menu retains Get Started");
        await menu.locator(".language-menu > summary").click();
        await page.keyboard.press("Escape");
        assert.equal(await menu.evaluate((node) => node.open), true, "nested language Escape keeps menu open");
        await page.keyboard.press("Escape");
        assert.equal(await menu.evaluate((node) => node.open), false, "Escape closes menu");
        assert.ok(await page.locator(".mobile-menu > summary").evaluate((node) => node === document.activeElement), "Escape restores focus");
        await menu.locator("summary").first().click();
        await page.locator("main").click({ position: { x: 10, y: 10 } });
        assert.equal(await menu.evaluate((node) => node.open), false, "outside click closes menu");
      }
      console.log(`PASS ${locale} ${theme} ${width} ${JSON.stringify(data)}`);
    } finally { await context.close(); }
  }
  const noJs = await browser.newContext({ viewport: { width: 390, height: 600 }, javaScriptEnabled: false });
  try {
    const page = await noJs.newPage();
    await page.goto(`${origin}/en/`);
    await page.locator(".mobile-menu > summary").click();
    assert.equal(await page.locator(".mobile-nav a:visible").count(), 3, "navigation works without JavaScript");
    assert.equal(await page.locator(".mobile-menu .header-start:visible").count(), 1, "Get Started works without JavaScript");
  } finally { await noJs.close(); }
} finally { await browser.close(); }
