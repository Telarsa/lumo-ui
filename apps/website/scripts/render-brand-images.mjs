/**
 * Render the committed raster brand files in public/ from public/icon.svg, the
 * site's colours (src/app/globals.css) and the typed hero copy:
 *
 *   favicon.ico (16/32/48), apple-touch-icon.png (180), icons/icon-{16,32,64,192,512}.png
 *   og/lumo-{en,de,fa}.png (1200x630 Open Graph / Twitter cards)
 *
 * A manual step, not part of the build: rerun it after the mark, the colours or
 * the hero copy change, review the PNGs and commit them. It uses the
 * workspace's Playwright Chromium and the committed Inter (OFL). Persian text
 * uses the platform's Arabic-script UI face, exactly like a public build of
 * the site; the proprietary Persian font is never loaded here.
 *
 *   node scripts/render-brand-images.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const app = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(app, "public");
const { copy } = await import(pathToFileURL(join(app, "src/content/copy.ts")).href);

/** The light theme of src/app/globals.css. */
const colour = { bg: "#f8f7f3", text: "#101114", muted: "#646257", line: "#dedbd1", lit: "#55701c", mark: "#7fa828" };
const markPaths = `<path fill="${colour.text}" d="M50 12H88V88H12V50H50Z"/><path fill="${colour.mark}" d="M12 50A38 38 0 0 1 50 12L50 50Z"/>`;
const mark = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">${markPaths}</svg>`;
// Inlined: a page set from a string cannot load file: URLs.
const inter = `data:font/woff2;base64,${readFileSync(join(app, "src/assets/fonts/InterVariable.woff2")).toString("base64")}`;
const persianFallback = `"Vazirmatn", "Noto Sans Arabic", "Segoe UI", Tahoma, "Geeza Pro", sans-serif`;

function iconHtml(size, background) {
  return `<!doctype html><html><head><style>html,body{margin:0;padding:0;background:${background ?? "transparent"}}svg{display:block}</style></head><body>${mark(size)}</body></html>`;
}

function ogHtml(locale) {
  const t = copy[locale];
  const rtl = locale === "fa";
  const family = rtl ? `${persianFallback}` : `"Inter", sans-serif`;
  return `<!doctype html><html lang="${locale}" dir="${rtl ? "rtl" : "ltr"}"><head><meta charset="utf-8"><style>
@font-face { font-family: "Inter"; src: url("${inter}") format("woff2"); font-weight: 100 900; }
html, body { margin: 0; inline-size: 1200px; block-size: 630px; background: ${colour.bg}; color: ${colour.text}; font-family: ${family}; }
body { box-sizing: border-box; padding: 64px 80px; display: flex; flex-direction: column; }
.brand { display: flex; align-items: center; gap: 16px; font-family: "Inter", sans-serif; font-weight: 600; font-size: 34px; letter-spacing: -0.03em; direction: ltr; align-self: flex-start; }
.brand svg { inline-size: 48px; block-size: 48px; }
.eyebrow { margin-block: auto 0; display: flex; align-items: center; gap: 16px; color: ${colour.muted}; font-size: 26px; font-weight: 500; }
.eyebrow::before { content: ""; inline-size: 40px; block-size: 3px; background: ${colour.mark}; }
h1 { margin: 22px 0 0; font-size: ${rtl ? 66 : 70}px; line-height: ${rtl ? 1.3 : 1.08}; letter-spacing: ${rtl ? 0 : "-0.035em"}; font-weight: ${rtl ? 700 : 600}; max-inline-size: 1040px; }
h1 span { display: block; color: ${colour.lit}; }
footer { margin-block-start: auto; padding-block-start: 26px; border-block-start: 2px solid ${colour.line}; display: flex; justify-content: space-between; color: ${colour.muted}; font-size: 24px; }
footer code { font-family: "Inter", sans-serif; direction: ltr; }
</style></head><body><div class="brand">${mark(48)}<span>Lumo UI</span></div><p class="eyebrow">${t.hero.eyebrow}</p><h1>${t.hero.title}<span>${t.hero.accent}</span></h1><footer><span>${t.footer.by}</span><code>github.com/Telarsa/lumo-ui</code></footer></body></html>`;
}

/** An ICO container holding PNG images (supported by every current browser). */
function ico(pngs) {
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, data }, index) => {
    const entry = 6 + 16 * index;
    header.writeUInt8(size >= 256 ? 0 : size, entry);
    header.writeUInt8(size >= 256 ? 0 : size, entry + 1);
    header.writeUInt8(0, entry + 2);
    header.writeUInt8(0, entry + 3);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...pngs.map(({ data }) => data)]);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const shoot = async (html, width, height, omitBackground) => {
    await page.setViewportSize({ width, height });
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(async () => { await document.fonts.load("600 34px Inter"); await document.fonts.ready; });
    return page.screenshot({ type: "png", omitBackground, clip: { x: 0, y: 0, width, height } });
  };
  const write = (path, data) => {
    mkdirSync(dirname(join(pub, path)), { recursive: true });
    writeFileSync(join(pub, path), data);
    console.log(`public/${path} (${data.length} bytes)`);
  };
  // Small transparent marks: the SVG icon adapts to dark mode, these cannot.
  const transparent = {};
  for (const size of [16, 32, 48, 64]) transparent[size] = await shoot(iconHtml(size), size, size, true);
  write("favicon.ico", ico([16, 32, 48].map((size) => ({ size, data: transparent[size] }))));
  for (const size of [16, 32, 64]) write(`icons/icon-${size}.png`, transparent[size]);
  // Home-screen and install icons sit on the page background, mark inset.
  const tile = (size) => `<!doctype html><html><head><style>html,body{margin:0;background:${colour.bg}}body{inline-size:${size}px;block-size:${size}px;display:grid;place-items:center}svg{display:block}</style></head><body>${mark(Math.round(size * 0.8))}</body></html>`;
  write("apple-touch-icon.png", await shoot(tile(180), 180, 180, false));
  for (const size of [192, 512]) write(`icons/icon-${size}.png`, await shoot(tile(size), size, size, false));
  for (const locale of ["en", "de", "fa"]) write(`og/lumo-${locale}.png`, await shoot(ogHtml(locale), 1200, 630, false));
} finally {
  await browser.close();
}
// Guard the written ICO header so a broken run cannot be committed unnoticed.
const written = readFileSync(join(pub, "favicon.ico"));
if (written.readUInt16LE(2) !== 1 || written.readUInt16LE(4) !== 3) throw new Error("favicon.ico header is invalid");
