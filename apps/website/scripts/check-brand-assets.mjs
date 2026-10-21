/** New identity assets: source fidelity, self-contained outlines and usable icons.
 * --record is an explicit post-render step, never part of an ordinary build.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scan, attributes, htmlFiles } from "./csp.mjs";

const app = fileURLToPath(new URL("../", import.meta.url));
const rasterSizes = {
  "apple-touch-icon.png": [180, 180],
  "icons/icon-16.png": [16, 16], "icons/icon-32.png": [32, 32],
  "icons/icon-64.png": [64, 64], "icons/icon-96.png": [96, 96], "icons/icon-192.png": [192, 192],
  "icons/icon-512.png": [512, 512],
  "og/lumo-en.png": [1200, 630], "og/lumo-de.png": [1200, 630], "og/lumo-fa.png": [1200, 630],
};
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const read = (root, path) => readFile(join(root, path));

export function pngSize(bytes) {
  assert(bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), "A real PNG header is required");
  assert.equal(bytes.toString("ascii", 12, 16), "IHDR");
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

export function checkIco(bytes) {
  assert(bytes.length >= 54 && bytes.readUInt16LE(0) === 0 && bytes.readUInt16LE(2) === 1, "A real ICO directory is required");
  assert.equal(bytes.readUInt16LE(4), 3, "ICO must retain 16/32/48 entries");
  const dimensions = [];
  for (let i = 0; i < 3; i++) {
    const index = 6 + i * 16, width = bytes[index] || 256, height = bytes[index + 1] || 256;
    const length = bytes.readUInt32LE(index + 8), offset = bytes.readUInt32LE(index + 12);
    assert(offset >= 54 && offset + length <= bytes.length && length > 0, "ICO entry must be inside the file");
    assert.equal(bytes.readUInt16LE(index + 6), 32, "ICO entries retain 32-bit colour");
    assert.deepEqual(pngSize(bytes.subarray(offset, offset + length)), [width, height], "ICO payload and directory dimensions must agree");
    dimensions.push([width, height]);
  }
  assert.deepEqual(dimensions.sort((a, b) => a[0] - b[0]), [[16, 16], [32, 32], [48, 48]]);
}

export function svgGeometry(svg) {
  const elements = scan(svg), root = elements.find((element) => element.name === "svg");
  assert(root, "SVG root is required");
  assert(!/<!DOCTYPE|<!ENTITY/i.test(svg), "SVGs must be self-contained");
  assert(!elements.some((element) => ["text", "script", "foreignobject", "image", "use"].includes(element.name)), "Wordmarks are outlines; executable/live text/foreign references are forbidden");
  const props = attributes(root.attributes);
  assert.equal(props.get("role"), "img");
  assert(props.get("aria-label"), "SVG identity needs a name");
  for (const element of elements) {
    const attrs = attributes(element.attributes), transform = attrs.get("transform") || "";
    assert(!attrs.has("href") && !attrs.has("xlink:href") && !attrs.has("src"), "SVGs must not reference foreign resources");
    assert(!/scale\s*\(\s*-|matrix\s*\(\s*-/i.test(transform), "Logo must never mirror its X axis");
    assert(![...attrs.keys()].some((name) => /^on[a-z]+$/.test(name)), "SVGs cannot execute handlers");
  }
  assert(!/@import\b|url\(\s*["']?(?!#)[^\s"')]/i.test(svg), "SVG styles cannot fetch foreign resources");
  return { viewBox: props.get("viewbox"), paths: elements.filter((element) => element.name === "path").map((element) => attributes(element.attributes).get("d")), transforms: elements.map((element) => attributes(element.attributes).get("transform")).filter(Boolean) };
}

async function checkMasters(root) {
  const repository = resolve(root, "../.."), source = join(repository, "assets/logo");
  const provenance = JSON.parse(await readFile(join(source, "provenance.json"), "utf8"));
  assert(provenance.originalSymbol && provenance.wordmark.outlined, "Original symbol and outlined wordmark provenance are required");
  const lockups = Object.keys(provenance.masters).filter((name) => name.startsWith("lumo-lockup-") && name.endsWith(".svg"));
  assert(lockups.filter((name) => /-fa-/.test(name)).length >= 4 && lockups.filter((name) => !/-fa-/.test(name)).length >= 4, "Both Latin and Persian horizontal/vertical theme masters are required");
  const wordmarkFa = provenance.wordmarkFa;
  assert(wordmarkFa?.outlined && /OFL/i.test(wordmarkFa.licence) && !/IRANSans/i.test(JSON.stringify(wordmarkFa)), "Persian outlines need public OFL provenance; never private IRANSans");
  assert.equal(wordmarkFa.text, "لومو یو‌آی", "Keep the owner's confirmed Persian wordmark");
  assert(/^assets\/logo\/source\/[A-Za-z0-9.-]+\.(?:ttf|otf|woff2)$/.test(wordmarkFa.source), "Persian source stays in the owned public font directory");
  assert.equal(digest(await readFile(join(repository, wordmarkFa.source))), wordmarkFa.sourceSha256, "Persian wordmark font matches its source provenance");
  assert.match(await readFile(join(source, "source/OFL-Vazirmatn.txt"), "utf8"), /SIL OPEN FONT LICENSE/);
  assert.equal(digest(await read(root, "src/assets/fonts/InterVariable-Latin.woff2")), provenance.wordmark.sourceSha256, "Latin outlines match the unchanged OFL master");
  const geometries = new Map();
  for (const [name, expected] of Object.entries(provenance.masters)) {
    assert(/^lumo-[a-z-]+\.svg$/.test(name), "Master names stay inside assets/logo");
    const bytes = await readFile(join(source, name));
    assert.equal(digest(bytes), expected, `Master changed without reviewed provenance: ${name}`);
    const geometry = svgGeometry(bytes.toString()); geometries.set(name, geometry);
    assert.equal(geometry.viewBox, name.includes("lockup") ? name.includes("vertical") ? "0 0 420 220" : "0 0 420 100" : "0 0 112 112", "Identity layout dimensions must remain explicit");
    if (lockups.includes(name)) assert((await read(root, `public/brand/${name}`)).equals(bytes), `Public identity differs from master: ${name}`);
  }
  for (const name of lockups.filter((name) => name.endsWith("-on-paper.svg"))) {
    assert.deepEqual(geometries.get(name), geometries.get(name.replace("-on-paper.svg", "-on-ink.svg")), "Theme identity keeps the same geometry and orientation");
  }
  const master = await readFile(join(source, "lumo-mark-on-paper.svg"), "utf8");
  const tiledIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112" role="img" aria-label="Lumo UI"><rect width="112" height="112" rx="17.92" fill="#FAF9F6"/>${master.replace("<svg ", '<svg x="15.68" y="15.68" width="80.64" height="80.64" ')}</svg>\n`;
  assert.equal((await read(root, "public/icon.svg")).toString(), tiledIcon, "SVG icon must derive from the on-paper master on its opaque tile");
  const component = await readFile(join(root, "src/components/brand.tsx"), "utf8");
  assert(component.includes('dir="ltr"') && component.includes("locale") && component.includes('"fa"'), "Brand keeps symbol-left orientation and chooses the Persian identity");
  const css = await readFile(join(root, "src/app/globals.css"), "utf8");
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (match[1].includes(".brand")) assert(!/(?:transform|rotate|scale)\s*:/.test(match[2]), "Brand selectors must not mirror/rotate logo artwork");
  }
  return { provenance, lockups };
}

async function rasterRecord(root) {
  const files = {};
  for (const [path, expected] of Object.entries(rasterSizes)) {
    const bytes = await read(root, `public/${path}`);
    assert.deepEqual(pngSize(bytes), expected, `Wrong associated PNG dimensions: ${path}`);
    files[path] = digest(bytes);
  }
  const ico = await read(root, "public/favicon.ico"); checkIco(ico); files["favicon.ico"] = digest(ico);
  const manifestBytes = await read(root, "public/site.webmanifest"), manifest = JSON.parse(manifestBytes);
  assert.equal(manifest.name, "Lumo UI"); assert.equal(manifest.scope, "/"); assert.equal(manifest.start_url, "/en/");
  for (const [src, sizes, type] of [["/icon.svg", "any", "image/svg+xml"], ["/icons/icon-192.png", "192x192", "image/png"], ["/icons/icon-512.png", "512x512", "image/png"]]) {
    assert(manifest.icons.some((icon) => icon.src === src && icon.sizes === sizes && icon.type === type), "Manifest retains each usable icon variant");
    await read(root, `public${src}`);
  }
  files["site.webmanifest"] = digest(manifestBytes);
  return files;
}

export async function checkBrandAssets(root = app, { record = false } = {}) {
  const { provenance, lockups } = await checkMasters(root), rasters = await rasterRecord(root);
  const rendererSha256 = digest(await read(root, "scripts/render-brand-images.mjs"));
  const value = { sourceMasterHashes: provenance.masters, rendererSha256, files: rasters };
  const manifest = join(root, "docs/brand-assets.json");
  if (record) await writeFile(manifest, `${JSON.stringify(value, null, 2)}\n`);
  else assert.deepEqual(JSON.parse(await readFile(manifest, "utf8")), value, "Brand rasters/source must match reviewed post-render hashes; do not silently rerecord in builds");
  return { lockups: lockups.length, associatedFiles: Object.keys(rasters).length };
}

export function checkIconHead(html) {
  const head = html.match(/<head(?:\s[^>]*)?>([\s\S]*?)<\/head>/i)?.[1];
  assert(head !== undefined, "An actual document head is required for icon metadata");
  const links = scan(head).filter((element) => element.name === "link").map((element) => attributes(element.attributes));
  for (const [rel, href] of [["icon", "/favicon.ico"], ["icon", "/icon.svg"], ["icon", "/icons/icon-96.png"], ["apple-touch-icon", "/apple-touch-icon.png"], ["manifest", "/site.webmanifest"]]) {
    assert(links.some((attrs) => attrs.get("rel") === rel && attrs.get("href") === href), `Missing generated associated icon metadata: ${rel} ${href}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await checkBrandAssets(app, { record: process.argv.includes("--record") });
  const exportIndex = process.argv.indexOf("--export");
  if (exportIndex !== -1) for (const file of htmlFiles(resolve(app, process.argv[exportIndex + 1]))) checkIconHead(await readFile(file, "utf8"));
  console.log(`Brand assets: ${result.lockups} identity lockups and ${result.associatedFiles} associated files verified.`);
}
