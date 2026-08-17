#!/usr/bin/env node
/**
 * The Flutter web gallery the Mobile component pages embed is BUILT, not
 * committed.
 *
 * It was committed at first — ~17 MB of `main.dart.js`, CanvasKit and fonts
 * under `apps/website/public/mobile-preview/` — on the reasoning that the site
 * should build on a machine that has never heard of Dart. The owner pushed back:
 * the repo needs Flutter anyway, so that is 17 MB of git weight for no reason,
 * re-added on every gallery change and kept forever. That is right, and it is
 * better than right — CI did not install Flutter, which meant the mobile gates
 * (`gate:flutter`, `gate:flutter-contract`, `gate:mobile-api`,
 * `gate:mobile-demos`) never ran there at all. Requiring the toolchain fixes
 * both: no build output in git, and the mobile library graded on every push.
 *
 * The cost of building is paid only when something changed. This script stamps
 * the output with a hash of everything that can change it and rebuilds only on
 * a miss, so the common path — `next build` with an untouched gallery — is a
 * hash of a few dozen files and nothing else.
 *
 * Absent Flutter it FAILS, loudly and with the command to fix it. It does not
 * fall back to a page without its preview: a documentation page that silently
 * drops the thing it is documenting is worse than a build that stops.
 * `LUMO_SKIP_GALLERY=1` is the deliberate, visible escape — the same shape as
 * `LUMO_SKIP_FLUTTER=1` in `gate:flutter` — and it says what it left stale.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

import { SEARCHED, findFlutter, flutterEnv } from "./lib/flutter.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const GALLERY = join(ROOT, "apps", "mobile-gallery");
const OUT = join(ROOT, "apps", "website", "public", "mobile-preview");
const STAMP = join(OUT, ".build-stamp.json");

/**
 * Directories whose contents can change a rendered demo.
 * @type {ReadonlyArray<{ dir: string; exts: string[] }>}
 */
const INPUT_DIRS = [
  { dir: join(GALLERY, "lib"), exts: [".dart"] },
  { dir: join(GALLERY, "web"), exts: [".html", ".json", ".js"] },
  // The library the demos render. A widget change must reach the preview.
  { dir: join(ROOT, "packages", "mobile", "lib"), exts: [".dart"] },
];

/**
 * Single files with the same power — the pins that decide what gets compiled.
 * @type {readonly string[]}
 */
const INPUT_FILES = [
  join(GALLERY, "pubspec.yaml"),
  join(GALLERY, "pubspec.lock"),
  join(ROOT, "packages", "mobile", "pubspec.yaml"),
];

/**
 * Every file under `dir` whose name ends in one of `exts`, recursively.
 * @param {string} dir
 * @param {string[]} exts
 * @returns {string[]}
 */
function filesUnder(dir, exts) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path, exts));
    else if (exts.some((/** @type {string} */ e) => entry.name.endsWith(e))) out.push(path);
  }
  return out;
}

function inputHash() {
  const hash = createHash("sha256");
  /** @type {string[]} */
  const paths = [];
  for (const { dir, exts } of INPUT_DIRS) paths.push(...filesUnder(dir, exts));
  for (const file of INPUT_FILES) if (existsSync(file)) paths.push(file);
  for (const path of paths.sort()) {
    hash.update(path.slice(ROOT.length));
    hash.update(readFileSync(path));
  }
  return { hash: hash.digest("hex"), count: paths.length };
}

const { hash, count } = inputHash();
const built = existsSync(join(OUT, "main.dart.js"));
const stamped = existsSync(STAMP) ? JSON.parse(readFileSync(STAMP, "utf8")).hash : null;

if (built && stamped === hash) {
  console.log(`  mobile-gallery: up to date (${String(count)} input file(s) unchanged) — not rebuilding`);
  process.exit(0);
}

const why = !built ? "no build present" : stamped === null ? "no stamp — the build's provenance is unknown" : "inputs changed";

if (process.env.LUMO_SKIP_GALLERY === "1") {
  console.log(`  mobile-gallery: SKIPPED (LUMO_SKIP_GALLERY=1) — ${why}.`);
  console.log(built ? "  The Mobile pages will embed the PREVIOUS build, which no longer matches the demos." : "  The Mobile pages will embed NOTHING — the preview frames will be blank.");
  process.exit(0);
}

const sdk = findFlutter();
if (!sdk) {
  console.error(`  mobile-gallery: ${why}, and no Flutter SDK was found (${SEARCHED}).`);
  console.error("  The Mobile component pages embed a Flutter web build; the site cannot be built without it.");
  console.error("  Install Flutter (https://docs.flutter.dev/get-started/install), or set LUMO_SKIP_GALLERY=1");
  console.error("  to build a site whose mobile previews are stale or missing — and say so wherever you ship it.");
  process.exit(1);
}

console.log(`  mobile-gallery: rebuilding (${why})…`);
const status = spawnSync(process.execPath, [join(ROOT, "scripts", "build-mobile-gallery.mjs")], {
  stdio: "inherit",
  env: flutterEnv(sdk.binDir),
}).status;
if (status !== 0) {
  console.error("  mobile-gallery: the build failed; see the output above.");
  process.exit(1);
}

writeFileSync(STAMP, `${JSON.stringify({ hash, inputs: count, builtAt: "see git history — this file records inputs, not a clock" }, null, 2)}\n`);
console.log(`  mobile-gallery: built and stamped (${String(count)} input file(s))`);
