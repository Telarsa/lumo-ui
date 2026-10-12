import { test } from "node:test";
import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { checkSiteAssets } from "./check-site-assets.mjs";
import { preparePrivateFonts } from "./prepare-private-fonts.mjs";

const app = fileURLToPath(new URL("../", import.meta.url));
const sourceManifest = JSON.parse(await readFile(join(app, "docs/site-assets.json"), "utf8"));
const publicFiles = sourceManifest.files.filter((file) => !file.private).map((file) => file.path);
const privateFiles = sourceManifest.files.filter((file) => file.private).map((file) => file.path);
const hasPrivateFont = privateFiles.every((path) => existsSync(join(app, path)));
const quiet = () => {};

/** A copy of the site's checked files; the private font only when asked and available. */
async function fixture(run, { withPrivate = false } = {}) {
  const root = await mkdtemp(join(tmpdir(), "lumo-site-assets-"));
  try {
    for (const path of [
      "package.json", "docs/site-assets.json", "src/app/globals.css", "src/app/[locale]/layout.tsx",
      ...publicFiles, ...(withPrivate ? privateFiles : []),
    ]) {
      await mkdir(dirname(join(root, path)), { recursive: true });
      await copyFile(join(app, path), join(root, path));
    }
    await preparePrivateFonts({ root, env: {}, log: quiet });
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("a public clone without the private font validates and selects the system fallback", () =>
  fixture(async (root) => assert.deepEqual(await checkSiteAssets(root), { verified: 5, persian: "fallback" })));

test("with the private font present, its bytes and notice are verified too", { skip: !hasPrivateFont && "private font not present in this checkout" }, () =>
  fixture(async (root) => assert.deepEqual(await checkSiteAssets(root), { verified: 7, persian: "private" }), { withPrivate: true }));

test("the subset cannot silently lose its full source fallback", () =>
  fixture(async (root) => {
    await rm(join(root, "src/assets/fonts/InterVariable-Full.woff2"));
    await assert.rejects(checkSiteAssets(root), /ENOENT/);
  }));

test("declared font coverage must match the real Unicode cmap", () =>
  fixture(async (root) => {
    const path = join(root, "docs/site-assets.json");
    const manifest = JSON.parse(await readFile(path, "utf8"));
    manifest.files.find((file) => file.path.endsWith("/InterVariable.woff2")).unicodeRange = "U+0000-FFFF";
    await writeFile(path, JSON.stringify(manifest));
    await assert.rejects(checkSiteAssets(root), /unicode-range must equal the actual cmap/);
  }));

test("the full fallback cannot rejoin the preload budget", () =>
  fixture(async (root) => {
    const path = join(root, "src/app/[locale]/layout.tsx");
    await writeFile(path, (await readFile(path, "utf8")).replace(/(const interFull = .*?)preload: false/, "$1preload: true"));
    await assert.rejects(checkSiteAssets(root), /must not be preloaded/);
  }));

test("the original Latin complement cannot disappear or overlap the primary", () =>
  fixture(async (root) => {
    const path = join(root, "docs/site-assets.json");
    const manifest = JSON.parse(await readFile(path, "utf8"));
    manifest.files.find((file) => file.path.endsWith("/InterVariable-Latin.woff2")).unicodeRange = manifest.files.find((file) => file.path.endsWith("/InterVariable.woff2")).unicodeRange;
    await writeFile(path, JSON.stringify(manifest));
    await assert.rejects(checkSiteAssets(root), /Latin complement unicode-range.*without overlap/);
    await rm(join(root, "src/assets/fonts/InterVariable-Latin.woff2"));
    await assert.rejects(checkSiteAssets(root), /ENOENT/);
  }));

test("the original Latin complement stays outside the preload budget", () =>
  fixture(async (root) => {
    const path = join(root, "src/app/[locale]/layout.tsx");
    await writeFile(path, (await readFile(path, "utf8")).replace(/(const interLatin = .*?)preload: false/, "$1preload: true"));
    await assert.rejects(checkSiteAssets(root), /Latin complement must not be preloaded/);
  }));

test("a changed private font is rejected rather than silently altering the website", { skip: !hasPrivateFont && "private font not present in this checkout" }, () =>
  fixture(async (root) => {
    const path = join(root, "src/assets/fonts/private/IRANSansXVF.woff2");
    const data = await readFile(path);
    data[4] ^= 1;
    await writeFile(path, data);
    await assert.rejects(checkSiteAssets(root), /asset changed.*IRANSansXVF/);
  }, { withPrivate: true }));

test("a changed font is rejected rather than silently altering the website", () =>
  fixture(async (root) => {
    const path = join(root, "src/assets/fonts/InterVariable.woff2");
    const data = await readFile(path);
    data[4] ^= 1;
    await writeFile(path, data);
    await assert.rejects(checkSiteAssets(root), /asset changed.*InterVariable/);
  }));

test("font distribution requires the actual retained licence notice", () =>
  fixture(async (root) => {
    await rm(join(root, "src/assets/fonts/Inter-LICENSE.txt"));
    await assert.rejects(checkSiteAssets(root), /ENOENT/);
  }));

test("a proprietary font cannot be paired with the open font notice", () =>
  fixture(async (root) => {
    const path = join(root, "docs/site-assets.json");
    const manifest = JSON.parse(await readFile(path, "utf8"));
    manifest.files.find((file) => file.path.endsWith("IRANSansXVF.woff2")).notice = "src/assets/fonts/Inter-LICENSE.txt";
    await writeFile(path, JSON.stringify(manifest));
    await assert.rejects(checkSiteAssets(root), /matching font notice/);
  }));

test("the proprietary font cannot be moved out of the private directory", () =>
  fixture(async (root) => {
    const path = join(root, "docs/site-assets.json");
    const manifest = JSON.parse(await readFile(path, "utf8"));
    manifest.files.find((file) => file.path.endsWith("IRANSansXVF.woff2")).private = false;
    await writeFile(path, JSON.stringify(manifest));
    await assert.rejects(checkSiteAssets(root), /Only the proprietary font and its note are private/);
  }));

test("a stale generated module is rejected", () =>
  fixture(async (root) => {
    await writeFile(join(root, "src/assets/fonts/private/persian-font.ts"), "export const persian = { variable: \"\" };\n");
    await assert.rejects(checkSiteAssets(root), /generated Persian font module/);
  }));

test("reintroducing the retired shared styling dependency fails the local ownership check", () =>
  fixture(async (root) => {
    const path = join(root, "package.json");
    const manifest = JSON.parse(await readFile(path, "utf8"));
    manifest.dependencies["@telarsa/web-foundation"] = "file:retired.tgz";
    await writeFile(path, JSON.stringify(manifest));
    await assert.rejects(checkSiteAssets(root), /styles must be owned locally/);
  }));

test("the site's licence matches the public MIT repository", () =>
  fixture(async (root) => {
    const path = join(root, "package.json");
    const manifest = JSON.parse(await readFile(path, "utf8"));
    manifest.license = "UNLICENSED";
    await writeFile(path, JSON.stringify(manifest));
    await assert.rejects(checkSiteAssets(root), /MIT/);
  }));
