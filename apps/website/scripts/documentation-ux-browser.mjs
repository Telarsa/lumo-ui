/** Website-owned regression probe. Requires an already-built, already-served
 * export and installed Playwright; never starts services or installs packages.
 * PLAYWRIGHT_FROM=/path/to/e2e/package.json WEBSITE_URL=http://127.0.0.1:3113
 * node scripts/documentation-ux-browser.mjs [--static|--refresh-check|--calendar-direction|--calendar-contrast|--diagnose-overflow|--diagnose-current-overflow]
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const app = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(app, path), "utf8");
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const sections = {
  "getting-started": ["installation", "styles", "wiring", "grade"],
  contract: ["overview", "divergence", "versioned"],
  helpers: ["latin-islands", "numbers", "doctor", "fix"],
  dates: ["demo", "usage", "boundary", "proof", "fixed-date"],
  gate: ["rules", "floors", "run", "artifact"],
  mobile: ["overview", "contract", "installation", "rules", "gallery"],
};
const labels = { en: "Link to this section", de: "Link zu diesem Abschnitt", fa: "پیوند به این بخش" };
const failures = [];
const evidence = [];
const cspEvidence = [];
async function check(name, action) {
  try { await action(); console.log(`PASS ${name}`); }
  catch (error) { failures.push({ name, message: error.message }); console.error(`FAIL ${name}: ${error.message}`); }
}

async function checkCalendarDirection(page, locale, origin, formatNumber) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/${locale}/docs/dates/`, { waitUntil: "networkidle" });
  const rtl = locale === "fa";
  const seed = rtl ? 9 : 12;
  const digit = (day) => formatNumber(day, locale);
  const buttons = page.locator(".calendar-day-button:not([data-outside]):not([disabled])");
  const seedButton = buttons.filter({ hasText: new RegExp(`^${digit(seed)}$`) });
  assert.equal(await seedButton.count(), 1, "one in-month seed date");
  const movements = [];
  for (const [key, day] of [["ArrowRight", rtl ? 8 : 13], ["ArrowLeft", rtl ? 10 : 11]]) {
    await seedButton.click();
    assert.ok(await seedButton.evaluate((node) => node === document.activeElement), "the clicked seed has native focus");
    const before = await seedButton.boundingBox();
    assert.ok(before, "seed date has a visible position");
    await page.keyboard.press(key);
    const focused = page.locator(".calendar-day-button:focus");
    assert.equal((await focused.textContent()).trim(), digit(day), `${key} focuses the date in its physical direction`);
    const after = await focused.boundingBox();
    assert.ok(after, "focused date has a visible position");
    assert.ok(Math.abs(before.y - after.y) < 2, "the dates remain in the same week");
    assert.ok(key === "ArrowRight" ? after.x > before.x : after.x < before.x, `${key} follows the visible grid`);
    await page.keyboard.press("Enter");
    await page.waitForFunction((expected) => document.querySelector(".calendar-day-button[data-selected]")?.textContent.trim() === expected, digit(day));
    assert.ok(await focused.evaluate((node) => node.hasAttribute("data-selected")), "Enter selects the focused date");
    assert.match(await page.locator(".dates-demo__readout code").textContent(), new RegExp(`day: ${day}\\s*}`));
    movements.push({ key, day, fromX: before.x, toX: after.x });
  }
  assert.equal(await page.locator(".calendar").getAttribute("dir"), rtl ? "rtl" : "ltr", "DayPicker receives its direction explicitly");
  evidence.push({ locale, calendarDirection: rtl ? "rtl" : "ltr", seed, movements });
}

async function checkCalendarOutsideContrast(page, locale, theme, origin) {
  await page.goto(`${origin}/${locale}/docs/dates/`, { waitUntil: "networkidle" });
  const readings = await page.locator(".calendar-day-button[data-outside]:not([data-selected]):not([disabled])").evaluateAll((buttons) => buttons.map((button) => {
    const rgb = (value) => {
      const match = value.match(/^rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\s*\)$/);
      if (!match) throw new Error(`Unsupported computed color: ${value}`);
      return [Number(match[1]), Number(match[2]), Number(match[3]), match[4] === undefined ? 1 : Number(match[4])];
    };
    const style = getComputedStyle(button);
    const foreground = rgb(style.color);
    let background;
    for (let node = button; node; node = node.parentElement) {
      const current = getComputedStyle(node);
      if (node !== button && Number(current.opacity) !== 1) throw new Error("Unexpected ancestor opacity in calendar contrast check");
      const color = rgb(current.backgroundColor);
      if (color[3] !== 0 && color[3] !== 1) throw new Error("Unexpected translucent background in calendar contrast check");
      if (color[3] === 1) { background = color; break; }
    }
    if (!background) throw new Error("No opaque calendar background");
    const alpha = foreground[3] * Number(style.opacity);
    const blended = foreground.slice(0, 3).map((channel, index) => channel * alpha + background[index] * (1 - alpha));
    const luminance = (color) => color.slice(0, 3).reduce((sum, channel, index) => {
      const c = channel / 255;
      return sum + [0.2126, 0.7152, 0.0722][index] * (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    }, 0);
    const first = luminance(blended), second = luminance(background);
    return { label: button.getAttribute("aria-label"), ratio: (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05) };
  }));
  assert.ok(readings.length > 0, "calendar exposes outside-month dates to check");
  for (const reading of readings) assert.ok(reading.ratio >= 4.5, `${reading.label} contrast ${reading.ratio.toFixed(2)}:1 in ${theme}`);
  evidence.push({ locale, theme, calendarOutsideContrast: readings });
}

async function staticChecks() {
  for (const [slug, ids] of Object.entries(sections)) await check(`source section targets: ${slug}`, () => {
    const text = read(`src/app/[locale]/docs/${slug}/page.tsx`);
    const actual = [...text.matchAll(/<Section\s[^>]*\bid="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(actual, ids);
    assert.equal(new Set(actual).size, actual.length);
  });
  await check("published pinned installation policy", () => {
    for (const [path, variable] of [
      ["src/app/[locale]/page.tsx", "installSpec"],
      ["src/app/[locale]/how-it-works/page.tsx", "installSpec"],
      ["src/app/[locale]/docs/getting-started/page.tsx", "INSTALL_SPEC"],
    ]) {
      const source = read(path);
      assert.ok(source.includes(`pnpm add \${${variable}}`), path);
      assert.ok(!source.includes(`pnpm add -D \${${variable}}`), path);
    }
    const root = resolve(app, "../..");
    const version = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")).version;
    const readme = readFileSync(resolve(root, "README.md"), "utf8");
    assert.ok(readme.includes(`pnpm add github:Telarsa/lumo-ui#v${version}`), "public README uses the current pinned runtime install");
    assert.ok(!readme.includes("pnpm add -D github:Telarsa/lumo-ui#"), "public README must not prescribe a dev-only install");
  });
  await check("consumer commands resolve the installed package", () => {
    const start = read("src/app/[locale]/docs/getting-started/page.tsx");
    const gate = read("src/app/[locale]/docs/gate/page.tsx");
    for (const page of [start, gate]) assert.ok(page.includes("pnpm exec lumo gate ./out gate.floors.json"));
    assert.ok(gate.includes("node node_modules/lumo-ui/scripts/grade-app.mjs .next/server/app fa gate.floors.json"));
    assert.ok(!gate.includes("node scripts/grade-app.mjs .next/server/app"));
  });
  await check("calendar example chooses a built-in locale explicitly", () => {
    const dates = read("src/app/[locale]/docs/dates/page.tsx");
    assert.ok(dates.includes('const locale = "fa-IR";'));
    assert.ok(dates.includes("stringsFor(locale)"));
  });
  await check("maintained formatter accuracy in every language", () => {
    const text = read("src/app/[locale]/docs/helpers/page.tsx");
    for (const old of ["never inherited from ICU", "one answer on every runtime", "nicht unbemerkt von ICU", "هرگز از ICU", "روی هر runtime یک جواب"])
      assert.ok(!text.includes(old), `retired guarantee: ${old}`);
    for (const term of ["Intl/CLDR", "-u-", "Umm al-Qura", "پیش‌فرض", "افزونه", "عربستان"])
      assert.ok(text.includes(term), `missing maintained behavior: ${term}`);
  });
  await check("snapshot provenance and complete authored corpus", () => {
    const snapshot = JSON.parse(read("docs/public-docs-snapshot.json"));
    assert.equal(snapshot.sourceCommit, "c040e74904195ca81e0d857220220f3d0010b95b");
    assert.equal(snapshot.licence, "MIT");
    assert.equal(snapshot.files.length, 14);
    for (const file of snapshot.files) assert.equal(sha(read(file.destination)), file.adaptedSha256, file.destination);
  });
}

if (process.argv.includes("--refresh-check")) {
  await check("refresh preserves exact section IDs, wording and provenance", () => {
    const before = JSON.parse(read("docs/public-docs-snapshot.json"));
    const bytes = before.files.map((file) => read(file.destination));
    execFileSync(process.execPath, [resolve(app, "scripts/sync-public-docs.mjs")], { cwd: app, stdio: "pipe" });
    assert.deepEqual(JSON.parse(read("docs/public-docs-snapshot.json")), before);
    before.files.forEach((file, i) => assert.equal(read(file.destination), bytes[i], file.destination));
  });
  await staticChecks();
} else if (process.argv.includes("--static")) {
  await staticChecks();
} else if (process.argv.includes("--calendar-contrast")) {
  const from = process.env.PLAYWRIGHT_FROM;
  assert.ok(from, "PLAYWRIGHT_FROM must identify existing installed e2e package metadata");
  const { webkit } = createRequire(resolve(from))("@playwright/test");
  const origin = process.env.WEBSITE_URL || "http://127.0.0.1:3113";
  const artifacts = resolve(process.env.DOCUMENTATION_UX_ARTIFACTS || "/private/tmp/public-websites-ui-ux-2026-10-13/lumo-calendar-contrast");
  mkdirSync(artifacts, { recursive: true });
  const browser = await webkit.launch({ headless: true });
  try {
    for (const locale of ["en", "de", "fa"]) for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: theme, reducedMotion: "reduce" });
      const page = await context.newPage();
      await page.goto(`${origin}/${locale}/`);
      await page.evaluate((value) => localStorage.setItem("lumo-theme", value), theme);
      await check(`${locale}: ${theme} outside-date contrast`, () => checkCalendarOutsideContrast(page, locale, theme, origin));
      await context.close();
    }
  } finally {
    await browser.close();
    writeFileSync(resolve(artifacts, "calendar-contrast.json"), JSON.stringify({ failures, evidence }, null, 2) + "\n");
  }
} else if (process.argv.includes("--calendar-direction")) {
  const from = process.env.PLAYWRIGHT_FROM;
  assert.ok(from, "PLAYWRIGHT_FROM must identify existing installed e2e package metadata");
  const { webkit } = createRequire(resolve(from))("@playwright/test");
  const { formatNumber } = await import("../../../packages/core/src/format.ts");
  const origin = process.env.WEBSITE_URL || "http://127.0.0.1:3113";
  const artifacts = resolve(process.env.DOCUMENTATION_UX_ARTIFACTS || "/private/tmp/public-websites-ui-ux-2026-10-13/lumo-calendar-direction");
  mkdirSync(artifacts, { recursive: true });
  const browser = await webkit.launch({ headless: true });
  try {
    for (const locale of ["en", "de", "fa"]) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
      const page = await context.newPage();
      await check(`${locale}: calendar keyboard direction`, () => checkCalendarDirection(page, locale, origin, formatNumber));
      await context.close();
    }
  } finally {
    await browser.close();
    writeFileSync(resolve(artifacts, "calendar-direction.json"), JSON.stringify({ failures, evidence }, null, 2) + "\n");
  }
} else if (process.argv.includes("--diagnose-overflow") || process.argv.includes("--diagnose-current-overflow")) {
  const from = process.env.PLAYWRIGHT_FROM;
  assert.ok(from, "PLAYWRIGHT_FROM must identify existing installed e2e package metadata");
  const { webkit } = createRequire(resolve(from))("@playwright/test");
  const origin = process.env.WEBSITE_URL || "http://127.0.0.1:3113";
  const artifacts = resolve(process.env.DOCUMENTATION_UX_ARTIFACTS || "/private/tmp/public-websites-ui-ux-2026-10-13/lumo-overflow-diagnostic");
  mkdirSync(artifacts, { recursive: true });
  const browser = await webkit.launch({ headless: true });
  const records = [];
  const cases = process.argv.includes("--diagnose-current-overflow") ? [
    ["en", "", 390], ["en", "", 360], ["en", "how-it-works/", 360],
    ["de", "", 390], ["de", "", 360], ["de", "how-it-works/", 390], ["de", "how-it-works/", 360],
    ["de", "docs/getting-started/", 390], ["de", "docs/getting-started/", 360],
    ["fa", "", 390], ["fa", "", 360],
  ] : ["en", "de", "fa"].flatMap((locale) => (locale === "de" ? [390, 360, 1440] : [390, 360]).map((width) => [locale, "docs/getting-started/", width]));
  try {
    for (const [locale, route, width] of cases) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
      const page = await context.newPage();
      const response = await page.goto(`${origin}/${locale}/${route}`, { waitUntil: "networkidle" });
      const servedHtml = await response.text();
      const capture = `${locale}-${route.replaceAll("/", "-") || "home"}-${width}`;
      writeFileSync(resolve(artifacts, `${capture}-served.html`), servedHtml);
      await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
      const geometry = await page.evaluate(() => {
        function describe(node) {
          const box = node.getBoundingClientRect();
          const style = getComputedStyle(node);
          return { tag: node.tagName, id: node.id, class: node.className, text: node.textContent?.trim().slice(0, 160), box: { x: box.x, width: box.width, right: box.right }, clientWidth: node.clientWidth, scrollWidth: node.scrollWidth, display: style.display, overflowX: style.overflowX, minInlineSize: style.minInlineSize, inlineSize: style.inlineSize, whiteSpace: style.whiteSpace, overflowWrap: style.overflowWrap, gridTemplateColumns: style.gridTemplateColumns, fontSize: style.fontSize };
        }
        const offenders = [];
        for (const node of document.querySelectorAll("body *")) {
          const box = node.getBoundingClientRect();
          const outsideViewport = box.x < -1 || box.right > innerWidth + 1;
          const exposedContentOverflow = node.scrollWidth > node.clientWidth + 1 && getComputedStyle(node).overflowX === "visible";
          if (!box.width || (!outsideViewport && !exposedContentOverflow)) continue;
          const ancestors = [];
          let ancestor = node.parentElement;
          let clipped = false;
          while (ancestor && ancestor !== document.documentElement) {
            if (getComputedStyle(ancestor).overflowX !== "visible") clipped = true;
            if (ancestors.length < 4) ancestors.push(describe(ancestor));
            ancestor = ancestor.parentElement;
          }
          offenders.push({ ...describe(node), outsideViewport, exposedContentOverflow, clippedByAncestor: clipped, ancestors });
        }
        return { innerWidth, documentClientWidth: document.documentElement.clientWidth, documentScrollWidth: document.documentElement.scrollWidth, visualViewportWidth: visualViewport?.width, offenders };
      });
      records.push({ locale, route, width, servedHtmlSha256: sha(servedHtml), geometry });
      await page.screenshot({ path: resolve(artifacts, `${capture}-zoom200.png`), fullPage: true });
      console.log(JSON.stringify({ locale, route, width, servedHtmlSha256: sha(servedHtml), geometry }));
      await context.close();
    }
  } finally {
    await browser.close();
    writeFileSync(resolve(artifacts, "overflow.json"), JSON.stringify(records, null, 2) + "\n");
  }
} else {
  const from = process.env.PLAYWRIGHT_FROM;
  assert.ok(from, "PLAYWRIGHT_FROM must identify existing installed e2e package metadata");
  const { webkit } = createRequire(resolve(from))("@playwright/test");
  const { gradeHtml } = await import("../../../packages/gate/src/index.ts");
  const { formatNumber } = await import("../../../packages/core/src/format.ts");
  const digitFixture = readFileSync(resolve(app, "../../packages/gate/fixtures/no-latin-digits.bad.html"), "utf8");
  const origin = process.env.WEBSITE_URL || "http://127.0.0.1:3113";
  const artifacts = resolve(process.env.DOCUMENTATION_UX_ARTIFACTS || "/private/tmp/public-websites-ui-ux-2026-10-13/lumo-browser");
  mkdirSync(artifacts, { recursive: true });
  const browser = await webkit.launch({ headless: true });
  try {
    for (const locale of ["en", "de", "fa"]) {
      await check(`${locale}: saved dark prepaint keeps the unsynchronized control hidden`, async () => {
        const pending = await browser.newContext({ viewport: { width: 390, height: 844 } });
        try {
          await pending.addInitScript(() => localStorage.setItem("lumo-theme", "dark"));
          await pending.route("**/*", (route) => route.request().resourceType() === "script" ? route.abort() : route.continue());
          const page = await pending.newPage();
          await page.goto(`${origin}/${locale}/`, { waitUntil: "domcontentloaded" });
          assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
          const toggle = page.locator(".theme-control");
          assert.equal(await toggle.count(), 1);
          assert.equal(await toggle.isVisible(), false);
          assert.equal(await toggle.isDisabled(), true);
          assert.equal(await toggle.getAttribute("aria-hidden"), "true");
          assert.ok(await toggle.evaluate((node) => node.getBoundingClientRect().width > 0), "the hidden control reserves its layout space");
        } finally { await pending.close(); }
      });
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
      const page = await context.newPage();
      // Playwright's WebKit screenshot preparation inserts an inline style.
      // Keep screenshots separate so the navigation context's CSP evidence
      // contains only violations from the site under test.
      const captures = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
      const capturePage = await captures.newPage();
      await capturePage.goto(`${origin}/${locale}/`, { waitUntil: "networkidle" });
      await check(`${locale}: binary theme on a dark device`, async () => {
        await context.setExtraHTTPHeaders({});
        await page.emulateMedia({ colorScheme: "dark" });
        await page.goto(`${origin}/${locale}/`);
        assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
        const toggle = page.locator(".theme-control");
        const lightLabel = await toggle.getAttribute("aria-label");
        await toggle.click();
        assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
        assert.notEqual(await toggle.getAttribute("aria-label"), lightLabel);
        await page.reload();
        assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
        await toggle.click();
        assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
        await page.reload();
        assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
        for (const legacy of ["system", "invalid"]) {
          await page.evaluate((value) => localStorage.setItem("lumo-theme", value), legacy);
          await page.reload();
          assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
        }
      });
      const csp = [];
      await context.exposeBinding("__documentationCspViolation", ({ page: source }, violation) => {
        const record = { locale, url: source.url(), violation };
        csp.push(record);
        cspEvidence.push(record);
      });
      await context.addInitScript(() => document.addEventListener("securitypolicyviolation", (event) => {
        void window.__documentationCspViolation(`${event.violatedDirective}: ${event.blockedURI}`);
      }));
      for (const [slug, expected] of Object.entries(sections)) await check(`${locale}/${slug}: targets and native permalinks`, async () => {
        await page.goto(`${origin}/${locale}/docs/${slug}/`, { waitUntil: "networkidle" });
        const actual = await page.locator(".doc-section").evaluateAll((nodes) => nodes.map((node) => node.id));
        assert.deepEqual(actual, expected);
        assert.equal(new Set(await page.locator("[id]").evaluateAll((nodes) => nodes.map((node) => node.id))).size, await page.locator("[id]").count());
        const headings = page.locator(".doc-h2");
        for (let i = 0; i < await headings.count(); i++) {
          const link = headings.nth(i).locator("..").locator(".doc-permalink");
          assert.equal(await link.count(), 1);
          const heading = (await headings.nth(i).textContent()).replace(/\s+/g, " ").trim();
          assert.equal(await headings.nth(i).and(page.getByRole("heading", { name: heading, exact: true })).count(), 1,
            "accessible heading name contains only its visible title");
          assert.equal(await link.and(page.getByRole("link", { name: `${heading} ${labels[locale]}`, exact: true })).count(), 1,
            "accessible link name includes its own heading and localized purpose");
          const hash = await link.getAttribute("href");
          assert.match(hash, /^#[a-z][a-z-]+$/);
          await link.click();
          assert.equal(new URL(page.url()).hash, hash);
          await page.reload({ waitUntil: "networkidle" });
          assert.equal(await page.locator(hash).count(), 1);
          await page.evaluate(() => document.fonts.ready);
          await page.waitForFunction((target) => {
            const section = document.querySelector(target);
            const heading = section?.querySelector(".doc-h2");
            const header = document.querySelector(".site-header");
            if (!section || !heading || !header) return false;
            const top = section.getBoundingClientRect().top;
            return top >= 0 && top < innerHeight && heading.getBoundingClientRect().top >= header.getBoundingClientRect().bottom;
          }, hash);
          const top = await page.locator(hash).evaluate((node) => node.getBoundingClientRect().top);
          assert.ok(top >= 0 && top < 844, `fragment target visible below header: ${top}`);
          const headerBottom = await page.locator(".site-header").evaluate((node) => node.getBoundingClientRect().bottom);
          const headingTop = await page.locator(`${hash} .doc-h2`).evaluate((node) => node.getBoundingClientRect().top);
          assert.ok(headingTop >= headerBottom, `fragment heading clears actual sticky header: ${headingTop} >= ${headerBottom}`);
        }
        await page.goto(`${origin}/${locale}/docs/${slug}/`, { waitUntil: "networkidle" });
        const firstPermalink = page.locator(".doc-heading > .doc-permalink").first();
        let keyboardReached = false;
        for (let i = 0; i < 180; i++) {
          await page.keyboard.press("Tab");
          if (await firstPermalink.evaluate((node) => node === document.activeElement)) { keyboardReached = true; break; }
        }
        assert.ok(keyboardReached, "ordinary Tab reaches native heading permalink");
        assert.ok(await firstPermalink.evaluate((node) => parseFloat(getComputedStyle(node).outlineWidth) > 0), "visible permalink focus ring");
        await page.keyboard.press("Enter");
        assert.equal(new URL(page.url()).hash, await firstPermalink.getAttribute("href"));
      });
      await check(`${locale}: calendar keyboard direction`, () => checkCalendarDirection(page, locale, origin, formatNumber));
      for (const theme of ["light", "dark"]) await check(`${locale}: ${theme} outside-date contrast`, async () => {
        await page.evaluate((value) => localStorage.setItem("lumo-theme", value), theme);
        await page.setViewportSize({ width: 390, height: 844 });
        await checkCalendarOutsideContrast(page, locale, theme, origin);
      });
      for (const theme of ["light", "dark"]) for (const width of [1440, 390, 360]) for (const route of ["", "how-it-works/", "docs/getting-started/"]) {
        await check(`${locale}/${route || "home"}: ${theme} ${width} code and keyboard`, async () => {
          // Set storage in the already-served same-origin document, then let
          // the destination's blocking theme script apply exactly that choice.
          await page.evaluate((value) => localStorage.setItem("lumo-theme", value), theme);
          await page.setViewportSize({ width, height: 900 });
          await page.goto(`${origin}/${locale}/${route}`, { waitUntil: "networkidle" });
          const code = page.locator(route.startsWith("docs/") ? ".code pre" : ".install-block pre").first();
          const metrics = await code.evaluate((node) => {
            const text = getComputedStyle(node.querySelector("code"));
            return { family: text.fontFamily, size: parseFloat(text.fontSize), lineHeight: getComputedStyle(node).lineHeight, width: node.clientWidth, scrollWidth: node.scrollWidth, tabIndex: node.tabIndex };
          });
          const observedTheme = await page.locator("html").getAttribute("data-theme");
          evidence.push({ locale, route, theme, observedTheme, width, metrics });
          // Capture the same route and theme without polluting strict CSP evidence.
          await capturePage.evaluate((value) => localStorage.setItem("lumo-theme", value), theme);
          await capturePage.setViewportSize({ width, height: 900 });
          await capturePage.goto(`${origin}/${locale}/${route}`, { waitUntil: "networkidle" });
          await capturePage.locator(route.startsWith("docs/") ? ".code pre" : ".install-block pre").first().screenshot({ path: resolve(artifacts, `${locale}-${route.replaceAll("/", "-") || "home"}-${theme}-${width}.png`) });
          assert.equal(observedTheme, theme, "served document applies requested theme");
          assert.equal((await code.textContent()).trim(), "pnpm add github:Telarsa/lumo-ui#v1.0.0");
          assert.match(metrics.family, /monospace/i);
          assert.ok(metrics.size >= 12.8, `code font ${metrics.size}`);
          assert.equal(metrics.tabIndex, 0);
          await page.keyboard.press("Control+Home");
          let reached = false;
          for (let i = 0; i < 100; i++) {
            await page.keyboard.press("Tab");
            if (await code.evaluate((node) => node === document.activeElement)) { reached = true; break; }
          }
          assert.ok(reached, "ordinary Tab reaches code listing");
          assert.ok(await code.evaluate((node) => parseFloat(getComputedStyle(node).outlineWidth) > 0), "visible code focus ring");
          if (metrics.scrollWidth > metrics.width) {
            // Native arrow scrolling can finish after a busy frame; wait for
            // the actual movement, rather than sampling at a fixed delay.
            await code.evaluate((node) => { node.scrollLeft = 0; });
            const codeElement = await code.elementHandle();
            await page.keyboard.press("ArrowRight");
            await page.waitForFunction((node) => node.scrollLeft > 0, codeElement, { timeout: 1500 });
            await page.keyboard.press("ArrowLeft");
            await page.waitForFunction((node) => node.scrollLeft === 0, codeElement, { timeout: 1500 });
          }
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "no page horizontal overflow");
          if (!route && theme === "light" && width === 390) {
            const example = page.locator(".feature-example");
            const samples = await example.locator(".example-code pre").allTextContents();
            assert.equal(samples.length, 2);
            assert.ok(digitFixture.includes(samples[0]), "bad input comes from the maintained gate fixture");
            assert.equal(samples[1], samples[0].replace("1,234", formatNumber(1234, "fa")), "corrected input uses the real Persian formatter output");
            const findings = (input) => gradeHtml("fa/index.html", `<!doctype html><html lang="fa-IR" dir="rtl"><body>${input}</body></html>`).filter((finding) => finding.rule === "no-latin-digits");
            assert.equal(findings(samples[0]).length, 1, "the bad input produces exactly one digit finding");
            assert.match(findings(samples[0])[0].detail, /Latin digits in value: "1,234"/);
            assert.equal(findings(samples[1]).length, 0, "the corrected input clears the digit finding");
            assert.equal(await example.locator("a").getAttribute("href"), `/${locale}/docs/gate/`);
            assert.deepEqual(await example.locator(".example-code pre").evaluateAll((nodes) => nodes.map((node) => node.tabIndex)), [0, 0]);
            await page.emulateMedia({ reducedMotion: "no-preference" });
            assert.equal(await page.locator(".plane, .check-path").evaluateAll((nodes) => nodes.flatMap((node) => node.getAnimations()).length), 0, "the diagram remains still without a reduced-motion preference");
            await page.emulateMedia({ reducedMotion: "reduce" });
          }
          await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "no page overflow at 200% zoom");
        });
      }
      await check(`${locale}: actual locale href, native activation, history and theme`, async () => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.evaluate(() => localStorage.setItem("lumo-theme", "dark"));
        await page.goto(`${origin}/${locale}/docs/getting-started/?probe=one%20two#installation`, { waitUntil: "networkidle" });
        assert.equal(await page.locator("html").getAttribute("data-theme"), "dark", "native-action starting theme is prepared deterministically");
        const next = locale === "en" ? "de" : "en";
        const target = page.locator(`.language-options a[hreflang="${next}"]`);
        const summary = page.locator(".language-menu summary");
        await summary.click();
        const href = `/${next}/docs/getting-started/?probe=one%20two#installation`;
        assert.equal(await target.getAttribute("href"), href, "actual href is copyable after mount");
        await page.evaluate(() => { location.hash = "wiring"; });
        await page.waitForTimeout(100);
        assert.equal(await target.getAttribute("href"), href.replace("#installation", "#wiring"), "hashchange updates actual href");
        await page.evaluate(() => { history.pushState(null, "", "?probe=changed#wiring"); });
        await target.click({ button: "right" });
        assert.equal(await target.getAttribute("href"), `/${next}/docs/getting-started/?probe=changed#wiring`, "context menu/copy URL gets current history state");
        await page.keyboard.press("Escape");
        if (!await page.locator(".language-menu").evaluate((node) => node.open)) await summary.click();
        const popupPromise = context.waitForEvent("page");
        await target.click({ button: "middle" });
        const popup = await popupPromise;
        await popup.waitForLoadState("networkidle");
        assert.equal(popup.url(), `${origin}/${next}/docs/getting-started/?probe=changed#wiring`);
        assert.equal(await popup.locator("html").getAttribute("data-theme"), "dark");
        await popup.close();
        await page.reload({ waitUntil: "networkidle" });
        await summary.click();
        await summary.press("Tab");
        for (let i = 0; i < 3 && !await target.evaluate((node) => node === document.activeElement); i++) await page.keyboard.press("Tab");
        assert.ok(await target.evaluate((node) => node === document.activeElement));
        await page.keyboard.press("Enter");
        await page.waitForURL(`${origin}/${next}/docs/getting-started/?probe=changed#wiring`);
        assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
      });
      await check(`${locale}: CSP preserved`, () => assert.deepEqual(csp, []));
      await captures.close();
      await context.close();
      const noScript = await browser.newContext({ javaScriptEnabled: false, colorScheme: "dark", viewport: { width: 360, height: 844 } });
      const staticPage = await noScript.newPage();
      for (const [slug, ids] of Object.entries(sections)) await check(`${locale}/${slug}: script-independent section links`, async () => {
        await staticPage.goto(`${origin}/${locale}/docs/${slug}/`);
        assert.equal(await staticPage.locator("html").evaluate((el) => getComputedStyle(el).colorScheme), "light");
        assert.deepEqual(await staticPage.locator(".doc-section").evaluateAll((nodes) => nodes.map((node) => node.id)), ids);
        const link = staticPage.locator(".doc-heading > .doc-permalink").first();
        const headingNode = link.locator("..").locator(".doc-h2");
        const heading = (await headingNode.textContent()).replace(/\s+/g, " ").trim();
        assert.equal(await headingNode.and(staticPage.getByRole("heading", { name: heading, exact: true })).count(), 1,
          "script-independent heading has only its title as its accessible name");
        assert.equal(await link.and(staticPage.getByRole("link", { name: `${heading} ${labels[locale]}`, exact: true })).count(), 1,
          "script-independent accessible link name includes its heading and localized purpose");
        await link.click();
        assert.equal(new URL(staticPage.url()).hash, await link.getAttribute("href"));
      });
      await noScript.close();
    }
  } finally {
    await browser.close();
    writeFileSync(resolve(artifacts, "results.json"), JSON.stringify({ failures, evidence, cspEvidence }, null, 2) + "\n");
  }
}
if (failures.length) { console.error(`${failures.length} documentation UX checks failed.`); process.exitCode = 1; }
