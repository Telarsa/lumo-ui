import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { checkBrandAssets, checkIconHead, svgGeometry } from "./check-brand-assets.mjs";

const app = fileURLToPath(new URL("../", import.meta.url));
const repository = resolve(app, "../..");
const provenance = JSON.parse(await readFile(join(repository, "assets/logo/provenance.json"), "utf8"));
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const iconHead = '<link rel="icon" href="/favicon.ico"><link rel="icon" href="/icon.svg"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest">';

/** Only public inputs are copied; no private application fonts enter fixtures. */
async function fixture(run) {
  const temporary = await mkdtemp(join(tmpdir(), "lumo-brand-assets-"));
  const root = join(temporary, "apps/website");
  const copy = async (from, to) => {
    await mkdir(dirname(to), { recursive: true });
    await copyFile(from, to);
  };
  try {
    for (const path of [
      "docs/brand-assets.json", "scripts/render-brand-images.mjs", "src/components/brand.tsx",
      "src/app/globals.css", "src/assets/fonts/InterVariable-Latin.woff2",
      "public/icon.svg", "public/favicon.ico", "public/apple-touch-icon.png", "public/site.webmanifest",
      ...[16, 32, 64, 192, 512].map((size) => `public/icons/icon-${size}.png`),
      ...["en", "de", "fa"].map((locale) => `public/og/lumo-${locale}.png`),
      ...Object.keys(provenance.masters).filter((name) => name.startsWith("lumo-lockup-")).map((name) => `public/brand/${name}`),
    ]) await copy(join(app, path), join(root, path));
    for (const path of [
      "assets/logo/provenance.json", provenance.wordmarkFa.source,
      "assets/logo/source/OFL-Vazirmatn.txt", ...Object.keys(provenance.masters).map((name) => `assets/logo/${name}`),
    ]) await copy(join(repository, path), join(temporary, path));
    await run(root);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

test("reviewed Latin/Persian masters, raster dimensions and associated files validate", () =>
  fixture(async (root) => assert.deepEqual(await checkBrandAssets(root), { lockups: 8, associatedFiles: 11 })));

test("a missing home-screen icon cannot pass the manifest references", () =>
  fixture(async (root) => {
    await rm(join(root, "public/icons/icon-192.png"));
    await assert.rejects(checkBrandAssets(root), /ENOENT/);
  }));

test("a wrong PNG size fails even when its recorded checksum is changed", () =>
  fixture(async (root) => {
    const path = join(root, "public/apple-touch-icon.png"), bytes = await readFile(path);
    bytes.writeUInt32BE(16, 16);
    await writeFile(path, bytes);
    const manifestPath = join(root, "docs/brand-assets.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.files["apple-touch-icon.png"] = digest(bytes);
    await writeFile(manifestPath, JSON.stringify(manifest));
    await assert.rejects(checkBrandAssets(root), /Wrong associated PNG dimensions/);
  }));

test("an ICO directory cannot advertise a different embedded PNG size", () =>
  fixture(async (root) => {
    const path = join(root, "public/favicon.ico"), bytes = await readFile(path);
    bytes[6] = 32;
    await writeFile(path, bytes);
    await assert.rejects(checkBrandAssets(root), /ICO payload and directory dimensions must agree/);
  }));

test("a website logo copy cannot diverge from the reviewed master", () =>
  fixture(async (root) => {
    const path = join(root, "public/brand/lumo-lockup-fa-on-paper.svg");
    await writeFile(path, (await readFile(path, "utf8")).replace("#7fa828", "#000000"));
    await assert.rejects(checkBrandAssets(root), /Public identity differs from master/);
  }));

test("a raster rewrite cannot silently replace the reviewed post-render record", () =>
  fixture(async (root) => {
    const path = join(root, "public/og/lumo-fa.png"), bytes = await readFile(path);
    bytes[bytes.length - 1] ^= 1;
    await writeFile(path, bytes);
    await assert.rejects(checkBrandAssets(root), /reviewed post-render hashes/);
  }));

test("outlines cannot be replaced with a live wordmark even if provenance is updated", () =>
  fixture(async (root) => {
    const repo = resolve(root, "../.."), name = "lumo-lockup-fa-on-paper.svg";
    const path = join(repo, "assets/logo", name);
    const svg = (await readFile(path, "utf8")).replace("</svg>", "<text>لومو یو‌آی</text></svg>");
    await writeFile(path, svg);
    await writeFile(join(root, "public/brand", name), svg);
    const provenancePath = join(repo, "assets/logo/provenance.json");
    const value = JSON.parse(await readFile(provenancePath, "utf8"));
    value.masters[name] = digest(svg);
    await writeFile(provenancePath, JSON.stringify(value));
    await assert.rejects(checkBrandAssets(root), /Wordmarks are outlines/);
  }));

test("logo geometry rejects horizontal mirroring while allowing font-coordinate Y conversion", () => {
  const root = '<svg viewBox="0 0 112 112" role="img" aria-label="Lumo UI">';
  assert.throws(() => svgGeometry(`${root}<g transform="scale(-1 1)"><path d="M1 1L2 2"/></g></svg>`), /never mirror/);
  assert.doesNotThrow(() => svgGeometry(`${root}<g transform="scale(1 -1)"><path d="M1 1L2 2"/></g></svg>`));
  assert.throws(() => svgGeometry(`${root}<image href="https://example.com/logo.svg"/></svg>`), /foreign references/);
});

test("all owned document heads need favicon, adaptive SVG, apple and manifest metadata", () => {
  assert.doesNotThrow(() => checkIconHead(`<!doctype html><html><head>${iconHead}</head></html>`));
  for (const href of ["/favicon.ico", "/icon.svg", "/apple-touch-icon.png", "/site.webmanifest"]) {
    const missing = iconHead.replace(new RegExp(`<link[^>]+href="${href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>`), "");
    assert.throws(() => checkIconHead(`<html><head>${missing}</head></html>`), /Missing generated associated icon metadata/);
  }
  assert.throws(() => checkIconHead(`<html><head></head><body>${iconHead}</body></html>`), /Missing generated associated icon metadata/);
});
