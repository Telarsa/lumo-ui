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
 *   lumo deps <name>                 the registry closure an `add` copies
 *   lumo add <name…> --to <dir>      copy the item(s) + closure into <dir>/components/…, record lumo.lock.json
 *   lumo diff [<name…>] --to <dir>   what changed between your copies and this checkout (3-way aware)
 *   lumo upgrade [<name…>] --to <dir> replace untouched copies; 3-way merge edited ones (conflict markers, never silent)
 *   lumo gate <out-dir> [floors]     grade a built site's served HTML with Lumo's rules
 *   lumo doctor --to <dir>           check the consumer's contract-package versions against this checkout
 */

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const ROOT = new URL("..", import.meta.url).pathname;
const [, , command, ...rest] = process.argv;

/** @param {string} flag */
function flagValue(flag) {
  const i = rest.indexOf(flag);
  return i === -1 ? undefined : rest[i + 1];
}
const positional = rest.filter((a, i) => !a.startsWith("--") && rest[i - 1] !== "--to" && rest[i - 1] !== "--tier");

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

/** @param {string} name @param {{ items: Array<{ name: string; registryDependencies?: string[]; files?: Array<{ path: string; target?: string }>; dependencies?: string[] }> }} registry */
function closure(name, registry) {
  /** @type {string[]} */
  const order = [];
  const seen = new Set();
  const visit = (/** @type {string} */ n) => {
    if (seen.has(n)) return;
    seen.add(n);
    const item = registry.items.find((i) => i.name === n);
    if (!item) throw new Error(`unknown registry item: ${n}`);
    for (const dep of item.registryDependencies ?? []) visit(dep);
    order.push(n);
  };
  visit(name);
  return order;
}

async function deps() {
  const { registry } = await loadCatalog();
  const name = positional[0];
  if (!name) return usage("deps needs a name");
  const order = closure(name, registry);
  const npm = new Set();
  for (const n of order) for (const d of registry.items.find((i) => i.name === n)?.dependencies ?? []) npm.add(d);
  console.log(`  registry closure (copied by \`lumo add ${name}\`): ${order.join(" → ")}`);
  console.log(`  npm packages you install yourself: ${[...npm].join(", ") || "—"}`);
}

/** Where a registry file lands in the consumer: the item's declared target, else components/ui/<basename>. */
function targetOf(/** @type {{ path: string; target?: string }} */ file, /** @type {string} */ to) {
  return join(to, file.target ?? `components/ui/${file.path.split("/").pop()}`);
}

async function loadLock(/** @type {string} */ to) {
  const p = join(to, "lumo.lock.json");
  return existsSync(p) ? await readJson(p) : { version: 1, source: "lumo-ui", lumo: undefined, items: {} };
}

async function add() {
  const to = flagValue("--to");
  if (!to || positional.length === 0) return usage("add needs names and --to <consumer dir>: lumo add button dialog --to ../my-app");
  const { registry, version } = await loadCatalog();
  const lock = await loadLock(to);
  const npm = new Set();
  for (const name of positional) {
    for (const n of closure(name, registry)) {
      const item = registry.items.find((i) => i.name === n);
      if (!item) continue;
      for (const d of item.dependencies ?? []) npm.add(d);
      /** @type {Record<string, string>} */
      const files = {};
      for (const file of item.files ?? []) {
        const src = join(ROOT, file.path);
        const dst = targetOf(file, to);
        const text = await readFile(src, "utf8");
        if (existsSync(dst) && (await readFile(dst, "utf8")) !== text && lock.items[n]?.files?.[relative(to, dst)] !== undefined) {
          console.log(`  keep    ${relative(to, dst)}  (already installed and edited — use \`lumo upgrade ${n}\`)`);
          files[relative(to, dst)] = lock.items[n].files[relative(to, dst)];
          continue;
        }
        await mkdir(dirname(dst), { recursive: true });
        await copyFile(src, dst);
        await mkdir(join(to, ".lumo/originals", dirname(relative(to, dst))), { recursive: true });
        await writeFile(join(to, ".lumo/originals", relative(to, dst)), text);
        files[relative(to, dst)] = sha(text);
        console.log(`  copied  ${relative(to, dst)}`);
      }
      lock.items[n] = { version, files };
    }
  }
  lock.lumo = version;
  await writeFile(join(to, "lumo.lock.json"), `${JSON.stringify(lock, null, 2)}\n`);
  console.log(`\n  recorded in ${join(to, "lumo.lock.json")} (lumo-ui ${version}); originals kept under .lumo/originals/ for 3-way upgrades.`);
  if (npm.size) console.log(`  install these yourself (exact versions in this checkout's pnpm-workspace.yaml catalog):\n    pnpm add ${[...npm].join(" ")}`);
  console.log(`  contract packages (@lumo-ui/core, @lumo-ui/theme, @lumo-ui/base-ui-ssr) come from your git dependency on lumo-ui, pinned to v${version} — see docs/agent-consumer.md.`);
}

/** @param {"diff" | "upgrade"} mode */
async function diffOrUpgrade(mode) {
  const to = flagValue("--to");
  if (!to) return usage(`${mode} needs --to <consumer dir>`);
  const { registry, version } = await loadCatalog();
  const lock = await loadLock(to);
  const names = positional.length ? positional : Object.keys(lock.items);
  if (names.length === 0) return console.log("  nothing recorded in lumo.lock.json — run `lumo add` first.");
  let changed = 0, merged = 0, conflicts = 0;
  for (const name of names) {
    const item = registry.items.find((i) => i.name === name);
    if (!item) { console.log(`  ${name}: not in this checkout's registry`); continue; }
    for (const file of item.files ?? []) {
      const dst = targetOf(file, to);
      const rel = relative(to, dst);
      const originalPath = join(to, ".lumo/originals", rel);
      const next = await readFile(join(ROOT, file.path), "utf8");
      const current = existsSync(dst) ? await readFile(dst, "utf8") : undefined;
      const original = existsSync(originalPath) ? await readFile(originalPath, "utf8") : undefined;
      if (current === undefined) { console.log(`  ${rel}: not installed`); continue; }
      const upstreamChanged = original !== undefined ? original !== next : current !== next;
      const locallyEdited = original !== undefined && original !== current;
      if (!upstreamChanged) { console.log(`  ${rel}: up to date`); continue; }
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
      const tmpNext = join(to, ".lumo/incoming", rel);
      await mkdir(dirname(tmpNext), { recursive: true });
      await writeFile(tmpNext, next);
      const r = spawnSync("git", ["merge-file", "-L", "yours", "-L", "lumo-ui (installed)", "-L", `lumo-ui ${version}`, dst, originalPath, tmpNext], { encoding: "utf8" });
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
}

async function gate() {
  const [out, floors] = positional;
  if (!out) return usage("gate needs a built site directory: lumo gate ./out [gate.floors.json]");
  const args = ["--experimental-strip-types", join(ROOT, "packages/gate/src/cli.ts"), resolve(out)];
  if (floors) args.push(resolve(floors));
  try { execFileSync(process.execPath, args, { stdio: "inherit" }); } catch { process.exitCode = 1; }
}

async function doctor() {
  const to = flagValue("--to");
  if (!to) return usage("doctor needs --to <consumer dir>");
  const { version } = await loadCatalog();
  const pkgPath = join(to, "package.json");
  if (!existsSync(pkgPath)) return console.log(`  no package.json in ${to}`);
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
  console.log(`  copied components recorded: ${Object.keys(lock.items).length} (lumo.lock.json says lumo-ui ${lock.lumo ?? "—"}; this checkout is ${version})`);
  if (lock.lumo && lock.lumo !== version) console.log(`  → run \`lumo diff --to ${to}\` then \`lumo upgrade --to ${to}\``);
}

/** @param {string} [message] */
function usage(message) {
  if (message) console.error(`  ${message}`);
  console.log(`
  lumo search <words…>             lumo info <name>            lumo list [--tier form|overlay|…|block]
  lumo deps <name>                 lumo add <name…> --to <dir> lumo diff|upgrade [<name…>] --to <dir>
  lumo gate <out-dir> [floors]     lumo doctor --to <dir>
  Read docs/agent-consumer.md first — it is written for an AI session working in another project.`);
  if (message) process.exitCode = 1;
}

const commands = { search, info, list, deps, add, diff: () => diffOrUpgrade("diff"), upgrade: () => diffOrUpgrade("upgrade"), gate, doctor };
const run = commands[/** @type {keyof typeof commands} */ (command)];
if (run === undefined) usage(command === undefined ? undefined : `unknown command: ${command}`);
else await run();
