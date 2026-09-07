#!/usr/bin/env node
/**
 * Review a built website in its locales, themes and widths.
 * node scripts/probe-website.mjs 'http://127.0.0.1:4300/{locale}/' en,de,fa /tmp/site-review
 * The URL template preserves the site's own trailing-slash policy.
 * This captures browser evidence, not a content, accessibility or production certificate.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { chromium } from "@playwright/test";

const [template, localeList, destination] = process.argv.slice(2);
if (!template?.includes("{locale}") || !localeList || !destination) {
  console.error("usage: probe-website <URL-with-{locale}> <en,de,fa> <evidence-directory>");
  process.exit(2);
}
const output = resolve(destination);
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
/** @type {unknown[]} */
const results = [];
/** @type {string[]} */
const failures = [];
try {
  for (const locale of localeList.split(",")) {
    for (const theme of /** @type {const} */ (["light", "dark"])) {
      const context = await browser.newContext({ colorScheme: theme, reducedMotion: "reduce" });
      const page = await context.newPage();
      /** @type {string[]} */
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const response = await page.goto(template.replace("{locale}", locale), { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      for (const width of [1440, 768, 390, 320]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.mouse.move(0, 999);
        await page.evaluate(() => new Promise(requestAnimationFrame));
        const key = `${locale}-${theme}-${width}`;
        const metrics = await page.evaluate(() => ({
          lang: document.documentElement.lang,
          dir: document.documentElement.dir,
          theme: document.documentElement.dataset.theme,
          viewport: innerWidth,
          contentWidth: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight,
          background: getComputedStyle(document.body).backgroundColor,
          title: document.title,
        }));
        await page.screenshot({ path: join(output, `${key}-rest.png`), animations: "disabled" });
        const target = page.locator("header a").filter({ visible: true }).first();
        const rest = await target.boundingBox();
        await target.hover();
        const hover = await target.boundingBox();
        await page.screenshot({ path: join(output, `${key}-hover.png`), animations: "disabled" });
        if (metrics.contentWidth > width + 1) failures.push(`${key}: horizontal overflow (${metrics.contentWidth}px)`);
        if (response?.status() !== 200) failures.push(`${key}: HTTP ${response?.status()}`);
        if (!metrics.lang.startsWith(locale)) failures.push(`${key}: unexpected language ${metrics.lang}`);
        if (rest && hover && (Math.abs(rest.width - hover.width) > 1 || Math.abs(rest.height - hover.height) > 1)) failures.push(`${key}: hover changes link dimensions`);
        results.push({ key, ...metrics, status: response?.status(), hover: { rest, hover }, errors: [...errors] });
      }
      if (errors.length) failures.push(`${locale}/${theme}: ${errors.join("; ")}`);
      await context.close();
      console.log(`${locale}/${theme}: captured`);
    }
  }
} finally {
  await browser.close();
  await writeFile(join(output, "metrics.json"), JSON.stringify({ results, failures }, null, 2) + "\n");
}
if (failures.length) { console.error(failures.join("\n")); process.exitCode = 1; }
else console.log(`Website probes passed; review screenshots in ${output}`);
