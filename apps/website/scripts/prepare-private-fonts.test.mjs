import { test } from "node:test";
import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { preparePrivateFonts, GENERATED, PRIVATE_MODULE, FALLBACK_MODULE } from "./prepare-private-fonts.mjs";

const app = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(await readFile(join(app, "docs/site-assets.json"), "utf8"));
const privateFiles = manifest.files.filter((file) => file.private).map((file) => file.path);
const hasPrivateFont = privateFiles.every((path) => existsSync(join(app, path)));
const quiet = () => {};

async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), "lumo-private-fonts-"));
  const source = join(root, "private-source");
  try {
    await mkdir(join(root, "docs"), { recursive: true });
    await mkdir(source, { recursive: true });
    await copyFile(join(app, "docs/site-assets.json"), join(root, "docs/site-assets.json"));
    await run(root, source);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("without the variable or a local copy, the build gets the system fallback", () =>
  fixture(async (root) => {
    assert.equal(await preparePrivateFonts({ root, env: {}, log: quiet }), "fallback");
    assert.equal(await readFile(join(root, GENERATED), "utf8"), FALLBACK_MODULE);
  }));

test("a production build can insist on the private font", () =>
  fixture(async (root) => {
    await assert.rejects(preparePrivateFonts({ root, env: { LUMO_PRIVATE_FONTS_DIR: "", LUMO_REQUIRE_PRIVATE_FONTS: "1" }, log: quiet }), /absent/);
  }));

test("a named private directory missing the licence note is an error, not a silent fallback", () =>
  fixture(async (root, source) => {
    await writeFile(join(source, "IRANSansXVF.woff2"), "not the font");
    await assert.rejects(preparePrivateFonts({ root, env: { LUMO_PRIVATE_FONTS_DIR: source }, log: quiet }), /no IRANSansX-LICENSE-NOTE\.txt/);
  }));

test("bytes that differ from the reviewed checksum are refused", () =>
  fixture(async (root, source) => {
    await writeFile(join(source, "IRANSansXVF.woff2"), "not the font");
    await writeFile(join(source, "IRANSansX-LICENSE-NOTE.txt"), "not the note");
    await assert.rejects(preparePrivateFonts({ root, env: { LUMO_PRIVATE_FONTS_DIR: source }, log: quiet }), /reviewed checksum/);
  }));

test("the real private font is copied, verified and declared", { skip: !hasPrivateFont && "private font not present in this checkout" }, () =>
  fixture(async (root, source) => {
    for (const path of privateFiles) await copyFile(join(app, path), join(source, basename(path)));
    assert.equal(await preparePrivateFonts({ root, env: { LUMO_PRIVATE_FONTS_DIR: source, LUMO_REQUIRE_PRIVATE_FONTS: "1" }, log: quiet }), "private");
    assert.equal(await readFile(join(root, GENERATED), "utf8"), PRIVATE_MODULE);
    // A later run without the variable keeps using the verified local copy.
    assert.equal(await preparePrivateFonts({ root, env: {}, log: quiet }), "private");
  }));
