#!/usr/bin/env node
/**
 * `lumo` — what is left of the command line after §50.6.
 *
 * Until 0.3.0 this was the component-distribution tool: search/info/list/deps
 * over the generated catalog, `add` with a registry closure, `diff`/`upgrade`
 * with a 3-way merge. The component library is retired and the registry is
 * gone, so those commands are gone with it — a consumer's copies are OWNED
 * code now, upgraded by nobody. (The full CLI is readable at any v0.1.x/v0.2.x
 * tag, which is also where `lumo.lock.json`-recorded originals are fetched
 * from; those tags stay.)
 *
 * What remains is what §50 kept:
 *
 *   lumo gate <html-dir> [floors]   grade a built site's served HTML with Lumo's rules
 *   lumo doctor [--to <root>]       check the consumer's contract-package pins and copy records
 */
import { existsSync } from "node:fs";
import { checkWiring, reportWiring } from "./lib/doctor-wiring.mjs";
import { runFix } from "./lib/fix.mjs";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = new URL("..", import.meta.url).pathname;
const [, , command, ...rest] = process.argv;

/** @param {string} flag */
function flagValue(flag) {
  const i = rest.indexOf(flag);
  return i === -1 ? undefined : rest[i + 1];
}
const VALUE_FLAGS = new Set(["--to"]);
const positional = rest.filter((a, i) => !a.startsWith("--") && !VALUE_FLAGS.has(rest[i - 1] ?? ""));

/** The nearest `<name>` at or above `from`, or undefined. */
function nearestUp(/** @type {string} */ from, /** @type {string} */ name) {
  for (let d = resolve(from); ; d = dirname(d)) {
    if (existsSync(join(d, name))) return join(d, name);
    if (dirname(d) === d) return undefined;
  }
}

/** The consumer's project root: `--to`, else the nearest lumo.lock.json at or above the current directory. */
function consumerRoot() {
  const from = resolve(flagValue("--to") ?? ".");
  const lock = nearestUp(from, "lumo.lock.json");
  return lock === undefined ? from : dirname(lock);
}

/** @param {string} p */
const readJson = async (p) => JSON.parse(await readFile(p, "utf8"));

async function gate() {
  const [out, floors] = positional;
  if (!out) return usage("gate needs a directory of served HTML: lumo gate ./out [gate.floors.json]  (a static export, or a `next build`'s .next/server/app — see scripts/grade-app.mjs for staging a single-locale app)");
  // Runs the COMMITTED JavaScript build of the gate (packages/gate/dist), not the
  // TypeScript source: Node refuses to strip types under node_modules
  // (ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING), which is where a consumer's
  // copy of this checkout lives. `gate:dist` in verify keeps dist fresh.
  const args = [join(ROOT, "packages/gate/dist/cli.js"), resolve(out)];
  if (floors) args.push(resolve(floors));
  try { execFileSync(process.execPath, args, { stdio: "inherit" }); } catch { process.exitCode = 1; }
}

async function doctor() {
  const to = consumerRoot();
  const version = (await readJson(join(ROOT, "package.json"))).version;
  const pkgPath = nearestUp(to, "package.json");
  if (pkgPath === undefined) return console.log(`  no package.json at or above ${to}`);
  const pkg = await readJson(pkgPath);

  // Run inside Lumo's own repository, every check below is nonsense: it reports
  // `@lumo-ui/core` MISSING and advises adding it as a git dependency, to the
  // repository that publishes it. That is the most likely place someone runs
  // this command for the first time — to see what it does — and being told to
  // install the thing you are standing in is a bad first impression of a tool
  // whose whole job is to tell you the truth about your pins.
  if (pkg.name === "lumo-ui") {
    console.log("  this IS the lumo-ui repository — there are no pins to check here.");
    console.log(`  Run \`lumo doctor\` in a CONSUMER's repo, or point it at one:`);
    console.log("    lumo doctor --to ../my-app");
    return;
  }

  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };

  // ONE pin to check, since §60. This loop used to walk `@lumo-ui/core`,
  // `@lumo-ui/theme`, `@lumo-ui/dates` and `@lumo-ui/base-ui-ssr` and report
  // the first two MISSING — against a CORRECT 0.4.x install, where there is
  // nothing to miss. A tool whose only job is telling you the truth about your
  // pins was telling a consumer to add two packages that no longer exist.
  const spec = deps["lumo-ui"];
  if (spec === undefined) {
    console.log('  lumo-ui   MISSING — add "lumo-ui": "github:Telarsa/lumo-ui#v' + version + '"');
    console.log("            Everything imports from it: lumo-ui/core, /dates, /base-ui-ssr,");
    console.log("            /gate, /theme/*.css, /config/eslint.");
  } else {
    const tag = /#v?([0-9][^&\s]*)/.exec(spec)?.[1];
    console.log(`  lumo-ui   ${spec}`);
    if (tag !== undefined && tag !== version) {
      console.log(`            ← pinned to ${tag}; this checkout is ${version}`);
    }
    if (/@lumo-ui\//.test(JSON.stringify(deps))) {
      const stale = Object.keys(deps).filter((d) => d.startsWith("@lumo-ui/"));
      console.log(`  ${stale.length} pre-0.4.0 scoped dependenc(ies) still declared: ${stale.join(", ")}`);
      console.log("            They are not published any more. Remove them and import by");
      console.log("            subpath from `lumo-ui` — see docs/agent-consumer.md.");
    }
  }
  const lockPath = join(to, "lumo.lock.json");
  if (existsSync(lockPath)) {
    const lock = await readJson(lockPath);
    console.log(`  copied components recorded: ${Object.keys(lock.items ?? {}).length} (lumo.lock.json says lumo-ui ${lock.lumo ?? "—"})`);
    console.log("  → copies are owned code since 0.3.0 (§50): there is no upstream to merge; edit them in place.");
  }

  // The pin is the least of it. Every CI failure on the day a consumer took
  // Lumo as a private dependency was in the WIRING — a job without the
  // credential, a Next config without the transpile, a gate without its floors
  // — and every one was visible from the working tree. See scripts/lib/doctor-wiring.mjs.
  console.log("");
  process.exitCode = reportWiring(checkWiring(dirname(pkgPath)));
}

/** @param {string} [message] */
function usage(message) {
  if (message) console.error(`  ${message}`);
  console.log(`
  lumo gate <html-dir> [floors]   grade a built site's served HTML with Lumo's rules
  lumo doctor [--to <root>]       check contract-package pins (and any recorded copies)

  Component distribution (search/add/diff/upgrade) retired in 0.3.0 — see CHANGELOG.md.
  Read docs/agent-consumer.md for the whole consumer workflow.

  lumo doctor [--to <root>]   the pin, AND the wiring every CI failure of first
                              contact was in: a job installing without the
                              credential, a Next config without the transpile,
                              a gate without @min-documents / @locales. Exits
                              non-zero on anything that would fail CI.
  lumo fix --zwnj --digits [--locale fa|ar] [--write] <path...>
                              the two mechanical corrections a Persian
                              catalogue needs. DRY RUN unless --write.`);
  if (message) process.exitCode = 1;
}


/**
 * lumo fix [--zwnj] [--digits] [--locale fa|ar] [--write] <path…>
 * Dry run unless --write. See scripts/lib/fix.mjs for what each pass touches.
 */
async function fix() {
  const args = process.argv.slice(3);
  /** @param {string} n */
  const flag = (n) => args.includes(n);
  const li = args.indexOf("--locale");
  const locale = (li >= 0 ? args[li + 1] : undefined) ?? "fa";
  const paths = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--locale");
  const zwnj = flag("--zwnj"), digits = flag("--digits"), write = flag("--write");
  if (paths.length === 0 || (!zwnj && !digits)) return usage("fix needs at least one of --zwnj / --digits and a path");
  const r = runFix({ zwnj, digits, locale, write, paths });
  console.log(`  ${r.files} file(s) read, ${r.changed} would change${write ? " — WRITTEN" : " (dry run; add --write)"}`);
  if (zwnj) console.log(`  zwnj:   ${r.zwnj} break(s) joined with U+200C`);
  if (digits) console.log(`  digits: ${r.digitLines} line(s) of ${locale} prose`);
  for (const sample of r.samples) console.log(`  ${sample}`);
  if (!write && r.changed > 0) console.log("  Read the samples, then re-run with --write.");
}

const commands = { gate, doctor, fix, help: () => usage() };
const run = commands[/** @type {keyof typeof commands} */ (command === "--help" || command === "-h" ? "help" : command)];
if (run === undefined) usage(command === undefined ? undefined : `unknown command: ${command}${["search","info","list","deps","add","diff","upgrade"].includes(command ?? "") ? " (retired in 0.3.0 with the component registry — your copies are owned code)" : ""}`);
else await run();
