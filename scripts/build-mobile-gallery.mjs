#!/usr/bin/env node
/**
 * apps/website/public/mobile-preview/ — the Flutter web build of
 * `apps/mobile-gallery`, the ONE app that serves every mobile demo on the docs
 * site. One build, one engine download, cached across every component page:
 *
 *   /mobile-preview/index.html?demo=<demoId>&lang=<fa-IR|en-US>&theme=<light|dark>
 *
 * The site is a STATIC EXPORT: there is no server here, so everything the page
 * needs must be a plain file under `public/`. The output is NOT committed —
 * `scripts/ensure-mobile-gallery.mjs` owns when this runs, stamping the output
 * with a hash of everything that can change it and calling this script only on
 * a miss. Run this one directly to force a rebuild.
 *
 * What is pruned, and why, is printed on every run — a deployed byte nobody
 * can account for is a deployed byte nobody maintains.
 */

import { existsSync } from "node:fs";
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

import { SEARCHED, findFlutter, flutterRunner } from "./lib/flutter.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const APP = join(ROOT, "apps", "mobile-gallery");
const BUILT = join(APP, "build", "web");
const OUT = join(ROOT, "apps", "website", "public", "mobile-preview");

/**
 * Where the built gallery is ADDRESSED FROM, which is not where Flutter
 * assumes. `flutter build web` bakes `<base href="/">` into index.html, so
 * every asset — flutter_bootstrap.js, main.dart.js, canvaskit/ — is fetched
 * from the SITE ROOT. Served under /mobile-preview/ that is 404 after 404 and
 * a permanently blank iframe, with nothing in the page's own HTML to show for
 * it. Verified by loading the built output in a real browser; the failure has
 * no other symptom.
 */
const BASE_HREF = "/mobile-preview/";

/**
 * The installable-app surface, deleted rather than deployed: the gallery is
 * only ever loaded INSIDE AN IFRAME on the docs site, so nothing can install
 * it and nothing shows its icon.
 *
 * `flutter_service_worker.js` and `version.json` STAY, and the reason is worth
 * writing down because the first version of this script deleted them. Flutter
 * 3.35's bootstrapper sets `serviceWorkerVersion` unconditionally, so removing
 * the worker leaves a permanent 404 in every docs page that frames a demo —
 * caught only by loading the built output in a real browser. And the worker is
 * an asset here rather than a liability: it is scoped to /mobile-preview/, it
 * cannot shadow the docs site, and caching the ~7 MB engine is exactly the
 * behaviour the one-app-for-every-demo design is built around.
 */
const PRUNE_PWA = ["icons", "manifest.json", "favicon.png", ".last_build_id"];

const sdk = findFlutter();
if (!sdk) {
  console.error(`  mobile-gallery: no Flutter SDK found (${SEARCHED}). The gallery cannot be built on this machine.`);
  process.exit(1);
}

const run = flutterRunner(sdk, APP);

if (run(["pub", "get"]) !== 0) process.exit(1);
if (run(["build", "web", "--release", `--base-href=${BASE_HREF}`]) !== 0) {
  console.error("  mobile-gallery: flutter build web failed");
  process.exit(1);
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await cp(BUILT, OUT, { recursive: true });

/** @param {string} dir @returns {Promise<Array<{ path: string, bytes: number }>>} */
async function walk(dir) {
  /** @type {Array<{ path: string, bytes: number }>} */
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else out.push({ path, bytes: (await stat(path)).size });
  }
  return out;
}

/** @type {Array<{ what: string, why: string, bytes: number }>} */
const pruned = [];
/** @param {string[]} names @param {string} why */
async function prune(names, why) {
  for (const name of names) {
    const path = join(OUT, name);
    if (!existsSync(path)) continue;
    const bytes = (await walk(path).catch(async () => [{ path, bytes: (await stat(path)).size }])).reduce((n, f) => n + f.bytes, 0);
    pruned.push({ what: name, why, bytes });
    await rm(path, { recursive: true, force: true });
  }
}

await prune(PRUNE_PWA, "the gallery is only ever an iframe: nothing installs it, and a service worker here would cache the frame behind the site's own deploy");

// skwasm — VERIFIED unreachable, not assumed. `flutter build web` without
// `--wasm` bakes `"renderer":"canvaskit"` into flutter_bootstrap.js, and the
// bootstrapper's skwasm branch is behind `renderer === "skwasm"`. The check is
// belt and braces: if a future build ever does select skwasm, this script
// keeps the files instead of shipping a blank canvas.
const bootstrap = await readFile(join(OUT, "flutter_bootstrap.js"), "utf8");
const app = await readFile(join(OUT, "main.dart.js"), "utf8").catch(() => "");
const canvasKitOnly = /"renderer"\s*:\s*"canvaskit"/.test(bootstrap) && !/skwasm[a-z_.]*\.(?:js|wasm)/.test(app);
if (canvasKitOnly) {
  await prune(
    ["canvaskit/skwasm.js", "canvaskit/skwasm.wasm", "canvaskit/skwasm_heavy.js", "canvaskit/skwasm_heavy.wasm"],
    'this build declares renderer "canvaskit"; the skwasm branch of the bootstrapper is unreachable and main.dart.js never names it',
  );
} else {
  console.log("  mobile-gallery: skwasm KEPT — this build can select it at runtime.");
}

// The *.js.symbols files are the deobfuscation maps `flutter symbolize` and
// DevTools read from disk. Nothing the browser loads asks for them.
const symbols = (await walk(OUT)).filter((f) => f.path.endsWith(".js.symbols"));
const served = [bootstrap, app, await readFile(join(OUT, "flutter.js"), "utf8").catch(() => ""), await readFile(join(OUT, "index.html"), "utf8").catch(() => "")].join("\n");
if (symbols.length > 0 && !served.includes(".js.symbols")) {
  await prune(symbols.map((f) => relative(OUT, f.path)), "a DevTools deobfuscation map; nothing the browser loads requests it");
}

// The service worker carries a RESOURCES manifest listing every file the
// build produced, including the ones just pruned. `install` only precaches
// CORE and `activate` never touches RESOURCES, so today those keys are inert —
// but `downloadOffline()` does `cache.addAll(Object.keys(RESOURCES))`, and one
// 404 in that list rejects the whole call and caches NOTHING. Rewriting the
// manifest to what is actually on disk closes a trap rather than a bug.
const swPath = join(OUT, "flutter_service_worker.js");
if (existsSync(swPath)) {
  const sw = await readFile(swPath, "utf8");
  const opened = sw.indexOf("const RESOURCES = {");
  const closed = sw.indexOf("};", opened);
  if (opened === -1 || closed === -1) {
    console.error("  mobile-gallery: flutter_service_worker.js has no RESOURCES map — the shape this script rewrites has changed. Refusing to guess.");
    process.exit(1);
  }
  const resources = JSON.parse(sw.slice(opened + "const RESOURCES = ".length, closed + 1));
  const kept = Object.fromEntries(Object.entries(resources).filter(([key]) => existsSync(join(OUT, key))));
  const dropped = Object.keys(resources).length - Object.keys(kept).length;
  await writeFile(swPath, `${sw.slice(0, opened)}const RESOURCES = ${JSON.stringify(kept)}${sw.slice(closed + 1)}`);
  console.log(`  mobile-gallery: dropped ${dropped} pruned entr(ies) from the service worker's RESOURCES manifest.`);
}

// NOT pruned, deliberately:
//   canvaskit/canvaskit.* AND canvaskit/chromium/canvaskit.* — the bootstrapper
//     chooses between them AT RUNTIME from what the browser reports
//     (`hasChromiumBreakIterators && hasImageCodecs`). Dropping the variant this
//     machine happens not to use works here and blanks someone else's canvas.
//   assets/NOTICES — the open-source attribution for everything Flutter bundles.
//     It is ~1.6 MB and it is not ours to delete.

const files = await walk(OUT);
const total = files.reduce((sum, f) => sum + f.bytes, 0);
const mb = (/** @type {number} */ bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

const index = join(OUT, "index.html");
if (!existsSync(index)) {
  console.error("  mobile-gallery: the copied build has no index.html — the docs pages would frame nothing");
  process.exit(1);
}

const prunedBytes = pruned.reduce((n, p) => n + p.bytes, 0);
console.log(`\n  mobile-gallery: ${files.length} file(s), ${mb(total)} deployed to apps/website/public/mobile-preview/`);
for (const file of files.sort((a, b) => b.bytes - a.bytes).slice(0, 10)) {
  console.log(`    ${mb(file.bytes).padStart(9)}  ${relative(OUT, file.path)}`);
}
console.log(`\n  pruned ${mb(prunedBytes)}:`);
for (const p of pruned.sort((a, b) => b.bytes - a.bytes)) console.log(`    ${mb(p.bytes).padStart(9)}  ${p.what} — ${p.why}`);
console.log("\n  kept in full: canvaskit/ (both variants) — the bootstrapper picks one from what the BROWSER reports, so pruning by what this machine uses would blank someone else's canvas; assets/NOTICES — the OSS attribution Flutter bundles, not ours to delete.");
console.log(`  base href: ${BASE_HREF} — the gallery is addressed from there, not from the site root.`);
console.log("  this output is BUILT, not committed: `scripts/ensure-mobile-gallery.mjs` stamps it and calls this script again when the gallery, packages/mobile or the Flutter version changes.");
