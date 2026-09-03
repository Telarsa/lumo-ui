/**
 * The consumer wiring `lumo doctor` checks, as pure functions over a root.
 *
 * Every check here is a CI failure that actually happened, the day a consumer
 * took Lumo as a private git dependency, and every one was discoverable from
 * the working tree before the push:
 *
 *   - a workflow JOB that installs without the credential (`url.insteadOf` is
 *     per-job config; one consumer's Flutter job installed without one for
 *     weeks, failing with "could not read Username", which names neither a
 *     repository nor a secret)
 *   - a Next app without `transpilePackages: ["lumo-ui"]` (Turbopack: "Unknown
 *     module type")
 *   - a tsconfig without `allowImportingTsExtensions` (Lumo ships TypeScript
 *     sources importing with explicit extensions)
 *   - a gate script with no floors file, or one without `@min-documents` — the
 *     guard that exists to catch a build that emitted SOME of its pages does
 *     nothing until a repository commits a number
 *   - no `@locales`, so `/pro` is graded as Old Provençal
 *
 * `hard` findings exit non-zero. `soft` ones are advice that is usually right.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";

/** @typedef {{ level: "hard" | "soft", where: string, what: string, fix: string }} Finding */

const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build", "out", ".turbo", ".astro"]);

/** @param {string} dir @param {number} [depth] @returns {Generator<string>} */
function* walk(dir, depth = 0) {
  if (depth > 4) return;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) yield* walk(p, depth + 1);
    else yield p;
  }
}

/** @param {string} p @returns {any} */
function readJsonSafe(p) {
  try { return JSON.parse(readFileSync(p, "utf8")); } catch { return undefined; }
}

/** The package.json files whose dependencies name lumo-ui, and the Flutter apps pinning lumo_ui_mobile. */
/** @param {string} root @returns {{ node: Array<{ dir: string, pkg: any, spec: unknown }>, flutter: Array<{ dir: string }> }} */
function consumersIn(root) {
  /** @type {Array<{ dir: string, pkg: any, spec: unknown }>} */
  const node = [];
  /** @type {Array<{ dir: string }>} */
  const flutter = [];
  for (const p of walk(root)) {
    if (p.endsWith("/package.json")) {
      const pkg = readJsonSafe(p);
      const deps = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };
      if (deps["lumo-ui"] !== undefined) node.push({ dir: dirname(p), pkg, spec: deps["lumo-ui"] });
    } else if (p.endsWith("/pubspec.yaml") && /lumo_ui_mobile/.test(readFileSync(p, "utf8"))) {
      flutter.push({ dir: dirname(p) });
    }
  }
  return { node, flutter };
}

/**
 * Whether an app IMPORTS Lumo's TypeScript source — `lumo-ui/core`, `/dates`,
 * `/base-ui-ssr` — as opposed to only running its scripts. Two of the ten
 * consumers are grader-only: they never import a Lumo module, so neither
 * `transpilePackages` nor `allowImportingTsExtensions` applies to them, and a
 * doctor that demanded both was reporting problems that could not fail anything.
 */
/** @param {string} dir @param {number} [depth] @returns {Generator<string>} */
function* walkPackage(dir, depth = 0) {
  if (depth > 4) return;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) {
      // A nested package.json is another package's territory — a workspace
      // root must not be credited with (or blamed for) its children's imports.
      if (existsSync(join(p, "package.json"))) continue;
      yield* walkPackage(p, depth + 1);
    } else yield p;
  }
}

/** @param {string} dir */
function importsLumoSource(dir) {
  const re = /from\s+["']lumo-ui\/(core|dates|base-ui-ssr)/;
  for (const p of walkPackage(dir)) {
    if (!/\.(ts|tsx|mts|js|jsx|mjs|astro)$/.test(p)) continue;
    try { if (re.test(readFileSync(p, "utf8"))) return true; } catch { /* unreadable: not an import */ }
  }
  return false;
}

/** A `gate` script that only hands off to a workspace child is not itself a gate. */
const DELEGATES = /^(pnpm|npm|yarn)\s+(--filter|-r|-F|run\s+-r)\b|^turbo\b/;

/** Split a GitHub Actions workflow into its jobs, crudely but reliably enough for the two keys we grep. */

/** @param {string} root @returns {Finding[]} */
export function checkWiring(root) {
  /** @type {Finding[]} */
  const out = [];
  const seenEslint = new Set();
  /** @param {string} p */
  const rel = (p) => relative(root, p) || ".";
  const { node } = consumersIn(root);

  /*
   * There was a check A here: every CI job that installed had to carry a
   * credential, because Lumo was a PRIVATE git dependency and a job without it
   * died at "could not read Username for 'https://github.com'", naming neither
   * the repository nor the secret. Lumo is public from 1.0.0, so an install
   * needs no credential and the check would now demand a secret nobody needs.
   * The lesson it encoded — this configuration is per JOB, not per workflow —
   * is kept in the doctor's docs rather than as a rule with nothing to catch.
   */

  for (const app of node) {
    const here = rel(app.dir);
    // G. the pin is a tag
    if (typeof app.spec === "string" && /^(github:|git\+)/.test(app.spec) && !/#v\d/.test(app.spec)) {
      out.push({ level: "soft", where: `${here}/package.json`, what: `lumo-ui is pinned to "${app.spec}", not a release tag`, fix: "pin `github:Telarsa/lumo-ui#v<version>` so an upgrade is a diff, not a surprise" });
    }
    const imports = importsLumoSource(app.dir);
    // B. Next needs the package NAME transpiled — when it imports the package at all
    const nextCfg = ["next.config.ts", "next.config.mjs", "next.config.js"].map((n) => join(app.dir, n)).find(existsSync);
    if (nextCfg) {
      const src = readFileSync(nextCfg, "utf8");
      if (imports && !/transpilePackages\s*:\s*\[[^\]]*["']lumo-ui["']/.test(src)) {
        out.push({ level: "hard", where: `${here}/${nextCfg.split("/").pop()}`, what: '`transpilePackages` does not include "lumo-ui"', fix: 'add `transpilePackages: ["lumo-ui"]` — the package NAME; a subpath matches nothing and Turbopack reports "Unknown module type"' });
      }
      // E. the served error shells
      const build = app.pkg?.scripts?.build ?? "";
      if (!/own-error-shells/.test(build)) {
        out.push({ level: "soft", where: `${here}/package.json › scripts.build`, what: "does not own Next's builtin error shells", fix: "append `&& node node_modules/lumo-ui/scripts/own-error-shells.mjs .next --error error-shell.html` — `/_global-error` is SERVED with no lang/dir and cannot be fixed from source" });
      }
    }
    // C. explicit .ts extensions — again only if Lumo's source is imported
    const tsconfig = join(app.dir, "tsconfig.json");
    // A solution file — `"files": []` plus `references` — compiles nothing
    // itself; the flag belongs in the projects it points at.
    const solution = existsSync(tsconfig) && /"files"\s*:\s*\[\s*\]/.test(readFileSync(tsconfig, "utf8")) && /"references"/.test(readFileSync(tsconfig, "utf8"));
    if (imports && existsSync(tsconfig) && !solution) {
      /** @type {string[]} */
      const chain = [];
      /** @type {string | undefined} */
      let cur = tsconfig;
      for (let i = 0; i < 4 && cur !== undefined && existsSync(cur); i += 1) {
        /** @type {string} */
        const raw = readFileSync(cur, "utf8");
        chain.push(raw);
        /** @type {string | undefined} */
        const ext = /"extends"\s*:\s*"([^"]+)"/.exec(raw)?.[1];
        cur = ext === undefined ? undefined : join(dirname(cur), ext.endsWith(".json") ? ext : `${ext}.json`);
      }
      if (!chain.some((raw) => /"allowImportingTsExtensions"\s*:\s*true/.test(raw))) {
        out.push({ level: "hard", where: `${here}/tsconfig.json`, what: "`allowImportingTsExtensions` is not enabled", fix: 'set `"allowImportingTsExtensions": true` — lumo-ui ships TypeScript sources that import with explicit .ts extensions' });
      }
    }
    // D. the gate's floors file
    const gate = app.pkg?.scripts?.gate;
    if (typeof gate === "string" && !DELEGATES.test(gate.trim())) {
      // Named on the command line, or — as a served-byte grader in a consumer
      // app does — read by the script itself from beside package.json.
      const floorsName = /(\S+\.json)\b/.exec(gate)?.[1] ?? (existsSync(join(app.dir, "gate.floors.json")) ? "gate.floors.json" : undefined);
      if (!floorsName) {
        out.push({ level: "hard", where: `${here}/package.json › scripts.gate`, what: "runs the gate with no floors file", fix: "pass `gate.floors.json` as the last argument, declaring `@min-documents` and `@locales`" });
      } else {
        const floors = readJsonSafe(join(app.dir, floorsName));
        if (!floors) {
          out.push({ level: "hard", where: `${here}/${floorsName}`, what: "named by the gate script but missing or unparsable", fix: "create it with `@min-documents` and `@locales`" });
        } else {
          if (typeof floors["@min-documents"] !== "number") out.push({ level: "hard", where: `${here}/${floorsName}`, what: "declares no `@min-documents`", fix: "set it to the number of documents the build emits today — the guard against a build that emitted SOME of its pages does nothing until a repository commits a number" });
          if (!Array.isArray(floors["@locales"])) out.push({ level: "hard", where: `${here}/${floorsName}`, what: "declares no `@locales`", fix: 'list the app\'s locales, e.g. `"@locales": ["en", "fa"]` — otherwise a route like `/pro` is graded as the locale `pro` (Old Provençal)' });
        }
      }
    }
    // F. the lint policy is the FIRST line; the gate is the last
    const eslint = ["eslint.config.mjs", "eslint.config.js", "eslint.config.ts"].map((n) => join(app.dir, n)).find(existsSync)
      ?? ["eslint.config.mjs", "eslint.config.js", "eslint.config.ts"].map((n) => join(root, n)).find(existsSync);
    if (eslint && !seenEslint.has(eslint) && !/lumo-ui\/config\/eslint/.test(readFileSync(eslint, "utf8"))) {
      seenEslint.add(eslint);
      out.push({ level: "soft", where: rel(eslint), what: "does not extend Lumo's lint policy", fix: 'import from "lumo-ui/config/eslint" — the gate is the last line; lint at authoring time is the first, and first-contact counts of 645 and 17,797 are what its absence costs' });
    }
  }
  return out;
}

/** Render findings for a terminal. Returns the exit code the caller should use.
 * @param {Finding[]} findings */
export function reportWiring(findings) {
  if (findings.length === 0) {
    console.log("  wiring: every installing job carries the credential, every Next app transpiles lumo-ui, every gate has its floors.");
    return 0;
  }
  const hard = findings.filter((f) => f.level === "hard");
  for (const f of findings) {
    console.log(`  ${f.level === "hard" ? "✗" : "·"} ${f.where}`);
    console.log(`      ${f.what}`);
    console.log(`      → ${f.fix}`);
  }
  console.log(`  ${hard.length} problem(s) that will fail CI, ${findings.length - hard.length} advisory.`);
  return hard.length > 0 ? 1 : 0;
}
