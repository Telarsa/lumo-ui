/** Focused served-export regression for native documentation fragment reloads.
 * PLAYWRIGHT_FROM=/path/to/@playwright/test/package.json
 * WEBSITE_URL=http://127.0.0.1:3113 node scripts/fragment-position-browser.mjs
 * A controlled fonts-ready gate tests correction and cancellation independently
 * of the installed Persian font and its metrics.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const from = process.env.PLAYWRIGHT_FROM;
assert.ok(from, "PLAYWRIGHT_FROM must identify installed Playwright metadata");
const { chromium } = createRequire(resolve(from))("@playwright/test");
const origin = process.env.WEBSITE_URL || "http://127.0.0.1:3113";
const browser = await chromium.launch({ headless: true });
const failures = [];
try {
  for (const [locale, slug, hash, width] of [
    ["fa", "helpers", "fix", 390], ["fa", "gate", "run", 390],
    ["fa", "helpers", "fix", 1440], ["fa", "gate", "run", 1440],
    ["en", "helpers", "fix", 390], ["de", "gate", "run", 390],
  ]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    try {
      await page.goto(`${origin}/${locale}/docs/${slug}/?probe=fragment`, { waitUntil: "networkidle" });
      await page.locator(`a.doc-permalink[href="#${hash}"]`).click();
      await page.reload({ waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const geometry = await page.evaluate((id) => ({
        heading: document.querySelector(`#${id} .doc-h2`).getBoundingClientRect().top,
        header: document.querySelector(".site-header").getBoundingClientRect().bottom,
        hash: location.hash, search: location.search, scrollX, focus: document.activeElement.tagName,
      }), hash);
      assert.equal(geometry.hash, `#${hash}`);
      assert.equal(geometry.search, "?probe=fragment");
      assert.ok(geometry.heading >= geometry.header, `${JSON.stringify(geometry)}`);
      assert.equal(geometry.scrollX, 0);
      assert.equal(geometry.focus, "BODY");
      console.log(`PASS ${locale}/${slug}#${hash} ${width}: ${JSON.stringify(geometry)}`);
    } catch (error) {
      failures.push(`${locale}/${slug}#${hash} ${width}: ${error.message}`);
      console.error(`FAIL ${failures.at(-1)}`);
    } finally { await context.close(); }
  }
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    try {
      await page.goto(`${origin}/fa/docs/helpers/?probe=history`, { waitUntil: "networkidle" });
      await page.locator('a.doc-permalink[href="#fix"]').click();
      await page.evaluate(() => new Promise((resolve) => {
        window.scrollBy({ top: 300, behavior: "instant" });
        requestAnimationFrame(() => resolve());
      }));
      const saved = await page.evaluate(() => scrollY);
      await page.goto(`${origin}/fa/docs/gate/`, { waitUntil: "networkidle" });
      await page.goBack({ waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const restored = await page.evaluate(() => ({ y: scrollY, hash: location.hash, search: location.search }));
      assert.equal(restored.hash, "#fix");
      assert.equal(restored.search, "?probe=history");
      assert.ok(Math.abs(restored.y - saved) <= 2, `saved ${saved}, restored ${JSON.stringify(restored)}`);
      console.log(`PASS history restoration: saved ${saved}, restored ${JSON.stringify(restored)}`);
    } catch (error) {
      failures.push(`history restoration: ${error.message}`);
      console.error(`FAIL ${failures.at(-1)}`);
    } finally { await context.close(); }
  }
  for (const cancel of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    try {
      await context.addInitScript(() => {
        const fonts = document.fonts;
        const ready = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(fonts), "ready").get;
        let release;
        const gate = new Promise((resolve) => { release = resolve; });
        Object.defineProperty(fonts, "ready", { get: () => Promise.all([ready.call(fonts), gate]) });
        window.__nativeFontsReady = () => ready.call(fonts);
        window.__releaseFontsGate = release;
        const original = window.scrollBy.bind(window);
        window.__fragmentScrollCalls = 0;
        window.scrollBy = (...args) => { window.__fragmentScrollCalls += 1; return original(...args); };
      });
      await page.goto(`${origin}/fa/docs/helpers/?probe=control#fix`, { waitUntil: "networkidle" });
      await page.evaluate(() => window.__nativeFontsReady());
      const before = await page.evaluate(() => {
        const heading = document.querySelector("#fix .doc-h2");
        const header = document.querySelector(".site-header");
        window.scrollTo({ top: scrollY + heading.getBoundingClientRect().top - header.getBoundingClientRect().bottom + 10, behavior: "instant" });
        window.__fragmentScrollCalls = 0;
        return { heading: heading.getBoundingClientRect().top, header: header.getBoundingClientRect().bottom };
      });
      assert.ok(before.heading < before.header, `test must seed overlap: ${JSON.stringify(before)}`);
      if (cancel) await page.mouse.click(10, 800);
      await page.evaluate(async () => {
        window.__releaseFontsGate();
        await document.fonts.ready;
        await new Promise((resolve) => requestAnimationFrame(resolve));
      });
      const after = await page.evaluate(() => ({
        heading: document.querySelector("#fix .doc-h2").getBoundingClientRect().top,
        header: document.querySelector(".site-header").getBoundingClientRect().bottom,
        hash: location.hash, search: location.search, calls: window.__fragmentScrollCalls,
      }));
      assert.equal(after.hash, "#fix");
      assert.equal(after.search, "?probe=control");
      if (cancel) {
        assert.equal(after.calls, 0, `input must cancel correction: ${JSON.stringify(after)}`);
        assert.ok(after.heading < after.header, `input must retain the seeded position: ${JSON.stringify(after)}`);
      } else {
        assert.equal(after.calls, 1, `control must exercise the guard: ${JSON.stringify(after)}`);
        assert.ok(after.heading >= after.header, `control must clear the heading: ${JSON.stringify(after)}`);
      }
      console.log(`PASS ${cancel ? "input cancellation" : "correction control"}: ${JSON.stringify({ before, after })}`);
    } catch (error) {
      failures.push(`${cancel ? "input cancellation" : "correction control"}: ${error.message}`);
      console.error(`FAIL ${failures.at(-1)}`);
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
if (failures.length) process.exitCode = 1;
