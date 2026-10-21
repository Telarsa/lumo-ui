/** Focused served-header geometry and navigation regression. */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const from = process.env.PLAYWRIGHT_FROM;
assert.ok(from, "PLAYWRIGHT_FROM must point to installed Playwright package metadata");
const { webkit } = createRequire(resolve(from))("@playwright/test");
const origin = process.env.WEBSITE_URL || "http://127.0.0.1:3113";
const browser = await webkit.launch({ headless: true });
try {
  for (const locale of ["en", "de", "fa"]) for (const theme of ["light", "dark"]) for (const width of [1920, 1440, 1100, 768, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
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
        const controls = [...document.querySelectorAll(".header-controls .control, .header-start, .mobile-menu > summary, .mobile-nav a")].filter((node) => node.getClientRects().length > 0).map((node) => ({ width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height }));
        const nav = document.querySelector(innerWidth < 1152 ? ".mobile-nav" : ".desktop-nav");
        return { header: header.getBoundingClientRect().height, frame: frame.getBoundingClientRect().width, paddingStart: parseFloat(style.paddingInlineStart), paddingEnd: parseFloat(style.paddingInlineEnd), logo: (visibleLogo || logo).getBoundingClientRect().height, controls, navVisible: getComputedStyle(nav).display !== "none", navLinks: nav.querySelectorAll("a").length, overflow: document.documentElement.scrollWidth > innerWidth + 1 };
      });
      const approx = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1, `${label}: ${actual} != ${expected}`);
      approx(data.header, width < 1024 ? 52 : 68, "header height");
      approx(data.frame, Math.min(width, 1440), "frame width");
      approx(data.paddingStart, 24, "frame start padding");
      approx(data.paddingEnd, 24, "frame end padding");
      approx(data.logo, 24, "logo height");
      assert.ok(data.controls.length >= 2 && data.controls.every(({ width: w, height: h }) => w >= 44 && h >= 44), "header controls retain 44px targets");
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
