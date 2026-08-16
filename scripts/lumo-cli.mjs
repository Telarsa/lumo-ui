#!/usr/bin/env node
/**
 * `lumo` — the command line a consumer (a person or an AI session in another
 * project) uses to FIND, GET, and UPGRADE Lumo components. Reads the generated
 * artefacts of this checkout (catalog.json, registry.json, api-reference.json)
 * and copies files from packages/*, so it works wherever this repository is
 * reachable on disk — a git dependency, a sibling clone, a submodule — with no
 * hosting. What it never does: install npm packages (it TELLS you which),
 * network, or silent overwrites of your edited copies.
 *
 *   lumo search <words…>            find components by name, title, intro, usage (both locales)
 *   lumo info <name>                 what it is for, required announced strings, props, deps, docs page
 *   lumo list [--tier <tier>]        every item, one line each
 *   lumo deps <name…>                the registry closure an `add` copies, and the exact npm packages
 *   lumo add <name…> [--to <root>] [--dir <components dir>] [--force]
 *                                    copy the item(s) + closure into <root>/<dir>/ui/… (blocks: <dir>/blocks/…),
 *                                    record <root>/lumo.lock.json; never overwrites a file that is not a Lumo copy
 *   lumo diff [<name…>] [--to <root>]    what changed between your copies and this checkout (3-way aware), and what you edited
 *   lumo upgrade [<name…>] [--to <root>] replace untouched copies; 3-way merge edited ones (conflict markers, never silent)
 *   lumo gate <out-dir> [floors]     grade a built site's served HTML with Lumo's rules
 *   lumo doctor [--to <root>]        check the consumer's contract-package versions against this checkout
 *
 * `--to` is the consumer's project root (default `.`): where package.json,
 * lumo.lock.json and .lumo/originals live. `--dir` is where components go,
 * relative to it (default `components`; remembered in the lock, so pass it once).
 */

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

import { ROOT, blockDependencies, catalogVersions, rewriteBlockImports, targetOf } from "./lib/consumer-copy.mjs";
const [, , command, ...rest] = process.argv;

/** @param {string} flag */
function flagValue(flag) {
  const i = rest.indexOf(flag);
  return i === -1 ? undefined : rest[i + 1];
}
const VALUE_FLAGS = new Set(["--to", "--tier", "--dir"]);
const positional = rest.filter((a, i) => !a.startsWith("--") && !VALUE_FLAGS.has(rest[i - 1] ?? ""));
const hasFlag = (/** @type {string} */ f) => rest.includes(f);
/** The nearest `<name>` at or above `from`, or undefined. */
function nearestUp(/** @type {string} */ from, /** @type {string} */ name) {
  for (let d = resolve(from); ; d = dirname(d)) {
    if (existsSync(join(d, name))) return join(d, name);
    if (dirname(d) === d) return undefined;
  }
}
/**
 * The consumer's project root: `--to`, else the current directory — and for the
 * commands that read an existing install, the nearest directory at or above it
 * that holds lumo.lock.json (so `--to src/components` still finds the project).
 */
function consumerRoot(/** @type {boolean} */ existing = false) {
  const from = resolve(flagValue("--to") ?? ".");
  if (!existing) return from;
  const lock = nearestUp(from, "lumo.lock.json");
  return lock === undefined ? from : dirname(lock);
}
/** A path for messages: relative to the current directory when it is below it, else absolute. */
const shown = (/** @type {string} */ p) => { const r = relative(process.cwd(), p); return r === "" ? "." : r.startsWith("..") ? p : r; };

/** @param {string} p */
const readJson = async (p) => JSON.parse(await readFile(p, "utf8"));
/** @param {string} text */
const sha = (text) => createHash("sha256").update(text).digest("hex").slice(0, 16);

async function loadCatalog() {
  /** @type {{ items: Array<Record<string, any>> }} */
  const catalog = await readJson(join(ROOT, "catalog.json"));
  /** @type {{ items: Array<{ name: string; type: string; files?: Array<{ path: string; target?: string }>; dependencies?: string[]; registryDependencies?: string[] }> }} */
  const registry = await readJson(join(ROOT, "registry.json"));
  const version = (await readJson(join(ROOT, "packages/ui/package.json"))).version;
  return { catalog, registry, version };
}

/** @param {string} s */
const norm = (s) => s.toLowerCase().normalize("NFKC").replace(/[‌‍]/g, "");

async function search() {
  const { catalog } = await loadCatalog();
  const query = positional.map(norm);
  if (query.length === 0) return usage("search needs words: lumo search date picker");
  const scored = catalog.items
    .map((/** @type {Record<string, any>} */ item) => {
      const hay = [
        item.name,
        item.title?.["fa-IR"], item.title?.["en-US"],
        item.intro?.["fa-IR"], item.intro?.["en-US"],
        item.usage?.when?.["fa-IR"], item.usage?.when?.["en-US"],
        item.usage?.whenNot?.["fa-IR"], item.usage?.whenNot?.["en-US"],
        item.tier, item.description,
      ].filter(Boolean).map(norm);
      let score = 0;
      for (const q of query) {
        if (norm(item.name).includes(q)) score += 5;
        if (hay[1]?.includes(q) || hay[2]?.includes(q)) score += 3;
        if (hay.some((h) => h.includes(q))) score += 1;
      }
      return { item, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
  if (scored.length === 0) { console.log("  nothing matched. Try `lumo list` or fewer words."); return; }
  for (const { item } of scored) {
    console.log(`  ${item.name.padEnd(20)} ${item.type === "registry:block" ? "block" : item.tier ?? "ui"}  ${item.title?.["en-US"] ?? ""} · ${item.title?.["fa-IR"] ?? ""}`);
    if (item.usage?.when) console.log(`      when: ${item.usage.when["en-US"]}`);
  }
}

async function info() {
  const { catalog, registry, version } = await loadCatalog();
  const name = positional[0];
  const item = catalog.items.find((i) => i.name === name);
  if (!item) return usage(`no item named ${name}. Try: lumo search ${name ?? ""}`);
  const reg = registry.items.find((i) => i.name === name);
  console.log(`\n  ${item.name}  (${item.type}, lumo-ui ${version})`);
  if (item.title) console.log(`  ${item.title["en-US"]} · ${item.title["fa-IR"]}`);
  if (item.intro) console.log(`\n  ${item.intro["en-US"]}\n  ${item.intro["fa-IR"]}`);
  if (item.usage) {
    console.log(`\n  Use it when:      ${item.usage.when["en-US"]}`);
    console.log(`  Do not use when:  ${item.usage.whenNot["en-US"]}`);
  }
  if (item.requiredAnnouncedStrings?.length) {
    console.log(`\n  REQUIRED announced strings (no defaults — English is the defect this library prevents):`);
    for (const s of item.requiredAnnouncedStrings) console.log(`    ${s}`);
  }
  if (item.requiredProps?.length) console.log(`  Required props: ${item.requiredProps.join(", ")}`);
  if (item.composition) console.log(`\n  Composition:\n${item.composition.split("\n").map((/** @type {string} */ l) => "    " + l).join("\n")}`);
  console.log(`\n  Files: ${(reg?.files ?? []).map((f) => f.path).join(", ")}`);
  console.log(`  npm dependencies: ${(reg?.dependencies ?? []).join(", ") || "—"}`);
  console.log(`  registry dependencies: ${(reg?.registryDependencies ?? []).join(", ") || "—"}`);
  console.log(`  Docs: ${(item.docs ?? []).join("  ")}`);
  console.log(`  API: api-reference.json → modules["${item.name}.tsx"]  (props with descriptions)\n`);
}

async function list() {
  const { catalog } = await loadCatalog();
  const tier = flagValue("--tier");
  for (const item of catalog.items) {
    if (tier && item.tier !== tier && !(tier === "block" && item.type === "registry:block")) continue;
    console.log(`  ${item.name.padEnd(20)} ${(item.type === "registry:block" ? "block" : item.tier ?? "ui").padEnd(10)} ${item.title?.["en-US"] ?? item.description ?? ""}`);
  }
}

/** The `pnpm add …` line for a set of npm packages: exact versions, contract packages left to the git pins. */
async function installLine(/** @type {Iterable<string>} */ npm) {
  const versions = await catalogVersions();
  const list = [...npm].filter((d) => !d.startsWith("@lumo-ui/")).sort();
  if (list.length === 0) return undefined;
  return `pnpm add ${list.map((d) => `${d}@${versions.get(d) ?? "<version in lumo-ui pnpm-workspace.yaml catalog>"}`).join(" ")}`;
}

/** Registry closure of several names, in copy order, deduplicated. Blocks derive their ui/block dependencies from their imports. */
async function closureOf(/** @type {string[]} */ names, /** @type {any} */ registry) {
  /** @type {string[]} */
  const order = [];
  const seen = new Set();
  const visit = async (/** @type {string} */ n) => {
    if (seen.has(n)) return;
    seen.add(n);
    const item = registry.items.find((/** @type {any} */ i) => i.name === n);
    if (!item) throw new Error(`unknown registry item: ${n}`);
    for (const dep of item.registryDependencies ?? []) await visit(dep);
    if (item.type === "registry:block") for (const dep of await blockDependencies(item, registry)) await visit(dep);
    order.push(n);
  };
  for (const n of names) await visit(n);
  return order;
}

async function deps() {
  const { registry } = await loadCatalog();
  if (positional.length === 0) return usage("deps needs a name: lumo deps date-range-picker dialog");
  const order = await closureOf(positional, registry);
  const npm = new Set();
  for (const n of order) for (const d of registry.items.find((i) => i.name === n)?.dependencies ?? []) npm.add(d);
  console.log(`  registry closure (copied by \`lumo add ${positional.join(" ")}\`): ${order.join(" → ")}`);
  const line = await installLine(npm);
  console.log(line === undefined ? "  npm packages you install yourself: none beyond the contract packages" : `  npm packages you install yourself (exact versions this checkout was verified against):\n    ${line}`);
  console.log(`  @lumo-ui/core, @lumo-ui/theme, @lumo-ui/base-ui-ssr come from your git pins, not npm.`);
}

/** The pristine copy `add` keeps for 3-way upgrades. Stored with a `.orig` suffix so a consumer's lint/tsc globs (`**\/*.tsx`) do not pick it up; the pre-0.1.2 unsuffixed path is still read. */
function originalPathOf(/** @type {string} */ to, /** @type {string} */ rel) {
  const suffixed = join(to, ".lumo/originals", `${rel}.orig`);
  const legacy = join(to, ".lumo/originals", rel);
  return existsSync(suffixed) || !existsSync(legacy) ? suffixed : legacy;
}

async function loadLock(/** @type {string} */ to) {
  const p = join(to, "lumo.lock.json");
  return existsSync(p) ? await readJson(p) : { version: 1, source: "lumo-ui", lumo: undefined, dir: undefined, items: {} };
}

/** The components directory: `--dir`, else what the lock remembers, else `components`. */
function dirOf(/** @type {{ dir?: string }} */ lock) {
  return flagValue("--dir") ?? lock.dir ?? "components";
}

async function add() {
  const to = consumerRoot(true);
  if (positional.length === 0) return usage("add needs names: lumo add button dialog [--to <project root>] [--dir src/components]");
  const { registry, version } = await loadCatalog();
  const lock = await loadLock(to);
  const dir = dirOf(lock);
  if (lock.dir !== undefined && lock.dir !== dir) return usage(`this project's copies live under ${lock.dir} (lumo.lock.json); pass --dir ${lock.dir} or move them first`);
  const npm = new Set();
  const order = await closureOf(positional, registry);
  /** @type {string[]} */
  const refused = [];
  for (const n of order) {
    const item = registry.items.find((i) => i.name === n);
    if (!item) continue;
    for (const d of item.dependencies ?? []) if (d !== "@lumo-ui/ui") npm.add(d);
    /** @type {Record<string, string>} */
    const files = {};
    for (const file of item.files ?? []) {
      const src = join(ROOT, file.path);
      const dst = targetOf(file, to, dir);
      const rel = relative(to, dst);
      let text = await readFile(src, "utf8");
      if (item.type === "registry:block") text = await rewriteBlockImports(text);
      const recorded = lock.items[n]?.files?.[rel];
      const existing = existsSync(dst) ? await readFile(dst, "utf8") : undefined;
      if (existing !== undefined && existing !== text) {
        if (recorded !== undefined) {
          console.log(`  keep    ${rel}  (already installed and edited — use \`lumo upgrade ${n}\`)`);
          files[rel] = recorded;
          continue;
        }
        if (!hasFlag("--force")) {
          refused.push(rel);
          console.log(`  REFUSED ${rel}  exists and is not a Lumo copy (not in lumo.lock.json) — move it, choose another --dir, or pass --force to overwrite`);
          continue;
        }
      }
      await mkdir(dirname(dst), { recursive: true });
      await writeFile(dst, text);
      const originalPath = join(to, ".lumo/originals", `${rel}.orig`);
      await mkdir(dirname(originalPath), { recursive: true });
      await writeFile(originalPath, text);
      files[rel] = sha(text);
      console.log(`  ${existing === undefined ? "copied " : existing === text ? "same   " : "REPLACED"} ${rel}`);
    }
    lock.items[n] = { version, files };
  }
  lock.lumo = version;
  lock.dir = dir;
  await writeFile(join(to, "lumo.lock.json"), `${JSON.stringify(lock, null, 2)}\n`);
  console.log(`\n  recorded in ${shown(join(to, "lumo.lock.json"))} (lumo-ui ${version}, dir ${dir}); originals under .lumo/originals/ (*.orig) for 3-way upgrades — commit both.`);
  const line = await installLine(npm);
  if (line) console.log(`  install these yourself (exact versions this checkout was verified against):\n    ${line}`);
  console.log(`  @lumo-ui/core, @lumo-ui/theme, @lumo-ui/base-ui-ssr come from your git pins on lumo-ui v${version} — see docs/agent-consumer.md.`);
  if (refused.length) { console.error(`\n  ${refused.length} file(s) refused — nothing of yours was overwritten.`); process.exitCode = 1; }
}

/** @param {"diff" | "upgrade"} mode */
async function diffOrUpgrade(mode) {
  const to = consumerRoot(true);
  const { registry, version } = await loadCatalog();
  const lock = await loadLock(to);
  const dir = dirOf(lock);
  const names = positional.length ? positional : Object.keys(lock.items);
  if (names.length === 0) return console.log("  nothing recorded in lumo.lock.json — run `lumo add` first.");
  let changed = 0, merged = 0, conflicts = 0;
  /** @type {string[]} */
  const edited = [];
  for (const name of names) {
    const item = registry.items.find((i) => i.name === name);
    if (!item) { console.log(`  ${name}: not in this checkout's registry`); continue; }
    for (const file of item.files ?? []) {
      const dst = targetOf(file, to, dir);
      const rel = relative(to, dst);
      const originalPath = originalPathOf(to, rel);
      let next = await readFile(join(ROOT, file.path), "utf8");
      if (item.type === "registry:block") next = await rewriteBlockImports(next);
      const current = existsSync(dst) ? await readFile(dst, "utf8") : undefined;
      const original = existsSync(originalPath) ? await readFile(originalPath, "utf8") : undefined;
      if (current === undefined) { console.log(`  ${rel}: not installed`); continue; }
      const upstreamChanged = original !== undefined ? original !== next : current !== next;
      const locallyEdited = original !== undefined && original !== current;
      if (locallyEdited) edited.push(rel);
      if (!upstreamChanged) { console.log(`  ${rel}: up to date${locallyEdited ? " (edited locally)" : ""}`); continue; }
      changed++;
      if (mode === "diff") {
        console.log(`  ${rel}: lumo-ui changed this file${locallyEdited ? " AND you edited your copy (upgrade will 3-way merge)" : ""}`);
        const d = spawnSync("git", ["diff", "--no-index", "--stat", originalPath ?? dst, join(ROOT, file.path)], { encoding: "utf8" });
        if (d.stdout) console.log(d.stdout.split("\n").map((l) => "      " + l).join("\n"));
        continue;
      }
      if (!locallyEdited) {
        await writeFile(dst, next);
        await mkdir(dirname(originalPath), { recursive: true });
        await writeFile(originalPath, next);
        lock.items[name] = { version, files: { ...(lock.items[name]?.files ?? {}), [rel]: sha(next) } };
        console.log(`  ${rel}: replaced (your copy was untouched)`);
        continue;
      }
      // Three-way merge: yours (current) · base (recorded original) · theirs (this checkout).
      const tmpNext = join(to, ".lumo/incoming", `${rel}.orig`);
      await mkdir(dirname(tmpNext), { recursive: true });
      await writeFile(tmpNext, next);
      const r = spawnSync("git", ["merge-file", "-L", "yours", "-L", "lumo-ui (installed)", "-L", `lumo-ui ${version}`, dst, originalPath, tmpNext], { encoding: "utf8" });
      await rm(join(to, ".lumo/incoming"), { recursive: true, force: true });
      await mkdir(dirname(originalPath), { recursive: true });
      await writeFile(originalPath, next);
      lock.items[name] = { version, files: { ...(lock.items[name]?.files ?? {}), [rel]: sha(next) } };
      if (r.status === 0) { merged++; console.log(`  ${rel}: merged cleanly with your edits`); }
      else { conflicts++; console.log(`  ${rel}: MERGED WITH CONFLICTS — resolve the <<<<<<< markers, then run your gates`); }
    }
  }
  if (mode === "upgrade") {
    lock.lumo = version;
    await writeFile(join(to, "lumo.lock.json"), `${JSON.stringify(lock, null, 2)}\n`);
    console.log(`\n  ${changed} file(s) changed upstream; ${merged} merged; ${conflicts} with conflicts. lumo.lock.json → ${version}.`);
    if (conflicts) process.exitCode = 2;
  } else if (changed === 0) console.log("  everything is at this checkout's version.");
  if (mode === "diff" && edited.length) console.log(`  edited locally (kept through upgrades by 3-way merge): ${edited.join(", ")}`);
}

async function gate() {
  const [out, floors] = positional;
  if (!out) return usage("gate needs a directory of served HTML: lumo gate ./out [gate.floors.json]  (a static export, or files you saved from `next start` / curl)");
  // Runs the COMMITTED JavaScript build of the gate (packages/gate/dist), not the
  // TypeScript source: Node refuses to strip types under node_modules
  // (ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING), which is where a consumer's
  // copy of this checkout lives. `gate:dist` in verify keeps dist fresh.
  const args = [join(ROOT, "packages/gate/dist/cli.js"), resolve(out)];
  if (floors) args.push(resolve(floors));
  try { execFileSync(process.execPath, args, { stdio: "inherit" }); } catch { process.exitCode = 1; }
}

async function doctor() {
  const to = consumerRoot(true);
  const { version } = await loadCatalog();
  const pkgPath = nearestUp(to, "package.json");
  if (pkgPath === undefined) return console.log(`  no package.json at or above ${to}`);
  const pkg = await readJson(pkgPath);
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  for (const name of ["@lumo-ui/core", "@lumo-ui/theme", "@lumo-ui/base-ui-ssr", "lumo-ui"]) {
    const spec = deps[name];
    const tag = spec === undefined ? undefined : /#v?([0-9][^&\s]*)/.exec(spec)?.[1];
    const verdict = spec === undefined
      ? "MISSING — add it as a git dependency pinned to v" + version
      : tag !== undefined && tag !== version ? `${spec}  ← pinned to ${tag}, this checkout is ${version}` : spec;
    console.log(`  ${name.padEnd(22)} ${verdict}`);
  }
  const lock = await loadLock(to);
  console.log(`  copied components recorded: ${Object.keys(lock.items).length} under ${dirOf(lock)}/ (lumo.lock.json says lumo-ui ${lock.lumo ?? "—"}; this checkout is ${version})`);
  if (lock.lumo && lock.lumo !== version) console.log(`  → run \`lumo diff --to ${to}\` then \`lumo upgrade --to ${to}\``);
}

/** @param {string} [message] */
function usage(message) {
  if (message) console.error(`  ${message}`);
  console.log(`
  lumo search <words…>               lumo info <name>                 lumo list [--tier form|overlay|…|block]
  lumo deps <name…>                  lumo add <name…> [--to <root>] [--dir <components dir>] [--force]
  lumo diff|upgrade [<name…>] [--to <root>]                           lumo doctor [--to <root>]
  lumo gate <html-dir> [floors]      lumo help
  --to is the project root (default .); --dir is where copies go, relative to it (default components; remembered).
  Read docs/agent-consumer.md first — it is written for an AI session working in another project.`);
  if (message) process.exitCode = 1;
}

const commands = { search, info, list, deps, add, diff: () => diffOrUpgrade("diff"), upgrade: () => diffOrUpgrade("upgrade"), gate, doctor, help: () => usage() };
const run = commands[/** @type {keyof typeof commands} */ (command === "--help" || command === "-h" ? "help" : command)];
if (run === undefined) usage(command === undefined ? undefined : `unknown command: ${command}`);
else await run();
