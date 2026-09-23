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
 * (The first of those, the credential, is retired: see the note in
 * `checkWiring`. Lumo is public from 1.0.0.)
 *
 * Corrected on 23 Sep 2026, each after it was observed to mislead on a real
 * consumer:
 *
 *   - a static export (`output: "export"`) was told to run `own-error-shells`,
 *     which rewrites a SERVER build's `.next/server` shells. An export has none;
 *     its 404 documents sit in `out/`, where the gate grades them.
 *   - a `gate` script that never runs Lumo was told it lacked a floors file
 *     (and failed the doctor), when the likelier truth is that Lumo grades none
 *     of that app's pages. The doctor now follows what the gate runs and, when
 *     it finds no grader call, says so as advice, worded as what it measured.
 *     A route list handed to a local grader is no longer taken for its floors.
 *   - a lint config that imports Lumo's policy and then redefines
 *     `no-restricted-syntax` passed, because the check was a text match on the
 *     import. It now reads the effective config through the app's own ESLint,
 *     which EXECUTES that config: run the doctor on repositories you trust.
 *
 * `hard` findings exit non-zero. `soft` ones are advice that is usually right.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";

import { lumoRules } from "../../packages/config/eslint/lumo.mjs";

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

/**
 * What runs Lumo's GRADER: `grade-app`, the CLI (whose other commands a gate
 * has no reason to call), the `lumo gate` bin, or the gate module itself.
 * `own-error-shells` is Lumo's too and is deliberately not in this list: a
 * build that owns its error shells and a gate that grades nothing with Lumo is
 * exactly the shape this has to tell apart.
 */
const GRADER = /grade-app|lumo-cli|\blumo\s+gate\b|lumo-ui\/gate\b|packages\/gate\/dist/;

/**
 * Whether parsed JSON is shaped like a floors file: an object of `//`
 * comments, `@` settings and per-path numbers, which is what `readFloors` in
 * `packages/gate/src/cli.ts` reads. A route list (an array) or a tsconfig
 * (object values) is not a floors file with problems; it is not a floors file.
 * @param {unknown} value
 */
function floorsShaped(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && Object.entries(value).every(([k, v]) => k.startsWith("//") || k.startsWith("@") || typeof v === "number");
}

/**
 * The floors file one grader command names: its first `.json` argument that is
 * missing, unparsable or floors-shaped. A missing or broken one is returned so
 * the caller reports it; a JSON input of another kind is skipped.
 * @param {string} dir @param {string} segment @returns {string | undefined}
 */
function floorsIn(dir, segment) {
  for (const m of segment.matchAll(/(?:^|\s)["']?([^\s"']+\.json)\b/g)) {
    const name = m[1] ?? "";
    let raw;
    try { raw = readFileSync(join(dir, name), "utf8"); } catch { return name; /* named and missing */ }
    try { if (!floorsShaped(JSON.parse(raw))) continue; } catch { return name; /* named and unparsable */ }
    return name;
  }
  return undefined;
}

/**
 * Follow a `gate` script to what it actually runs: the command, the package's
 * own scripts it calls by name (`pnpm run grade`), and the local script files it
 * executes (`node scripts/grade-served.mjs`), up to four levels deep. A
 * consumer's gate can be entirely its own assertions with no Lumo in it, and
 * then a floors file would arm nothing.
 *
 * The floors file comes only from a `&&` / `||` / `;` / `|` segment that runs
 * the grader, and only from a `.json` argument shaped like one (`floorsIn`).
 * `tsc -p tsconfig.json && lumo gate out gate.floors.json` names two JSON files
 * and one floors file. A local grader handed a route list, as in
 * `node ../../scripts/grade-served.mjs apps/console 3110 fa-IR gate.routes.json`
 * (observed on a consumer, 23 Sep 2026), reads its floors from beside
 * package.json itself, and the caller falls back to that file.
 *
 * What this cannot see: a test runner or config that imports `lumo-ui/gate`
 * without naming it on a command line, a script it cannot resolve to a local
 * file, and anything more than four levels down. In the other direction, a
 * script that names the grader only in a comment counts as running it. So
 * `invokes: false` means no grader call was FOUND in what was followed, not
 * that nothing grades the app, and the caller words it that way.
 * @param {string} dir @param {string} command @param {Record<string, unknown>} scripts
 * @returns {{ invokes: boolean, floorsArg: string | undefined }}
 */
function traceGate(dir, command, scripts) {
  /** @type {Set<string>} */
  const seen = new Set();
  let invokes = false;
  /** @type {string | undefined} */
  let floorsArg;
  /** @param {string} cmd @param {number} depth */
  const visit = (cmd, depth) => {
    if (depth > 4 || seen.has(cmd)) return;
    seen.add(cmd);
    for (const segment of cmd.split(/&&|\|\||[;|]/)) {
      let grades = GRADER.test(segment);
      for (const m of segment.matchAll(/\b(?:pnpm|npm|yarn)\s+(?:run\s+)?([\w:.-]+)/g)) {
        const next = scripts[m[1] ?? ""];
        if (typeof next === "string") visit(next, depth + 1);
      }
      for (const token of segment.split(/\s+/)) {
        const file = token.replace(/^["']|["']$/g, "");
        if (!/\.(?:[cm]?[jt]s|sh)$/.test(file) || file.includes("node_modules")) continue;
        let text;
        try { text = readFileSync(join(dir, file), "utf8"); } catch { continue; /* not a local script */ }
        // `node scripts/grade.mjs gate.served.floors.json` hands the script its floors.
        if (GRADER.test(text)) grades = true;
      }
      if (grades) {
        invokes = true;
        floorsArg ??= floorsIn(dir, segment);
      }
    }
  };
  visit(command, 0);
  return { invokes, floorsArg };
}

/**
 * A floors file's two settings, each a hard finding when absent.
 * @param {string} appDir @param {string} here @param {string} floorsName @param {Finding[]} out
 */
function checkFloors(appDir, here, floorsName, out) {
  const floors = readJsonSafe(join(appDir, floorsName));
  if (!floors) {
    out.push({ level: "hard", where: `${here}/${floorsName}`, what: "is missing or unparsable", fix: "create it with `@min-documents` and `@locales`" });
    return;
  }
  if (typeof floors["@min-documents"] !== "number") out.push({ level: "hard", where: `${here}/${floorsName}`, what: "declares no `@min-documents`", fix: "set it to the number of documents the build emits today — the guard against a build that emitted SOME of its pages does nothing until a repository commits a number" });
  if (!Array.isArray(floors["@locales"])) out.push({ level: "hard", where: `${here}/${floorsName}`, what: "declares no `@locales`", fix: 'list the app\'s locales, e.g. `"@locales": ["en", "fa"]` — otherwise a route like `/pro` is graded as the locale `pro` (Old Provençal)' });
}

/** @param {any} rules @returns {string[]} */
const selectorsOf = (rules) => /** @type {Array<{ selector: string }>} */ (rules["no-restricted-syntax"].slice(1)).map((s) => s.selector);

/** This checkout's selectors: the fallback when the app's own copy cannot be loaded. */
const LUMO_SELECTORS = selectorsOf(lumoRules);

/**
 * Lumo's selectors as the lumo-ui the app's eslint config IMPORTS defines them,
 * resolved from beside that config the way its own `import` resolves. That is
 * the set its effective config should carry. `lumo doctor --to <app>` can run
 * from a checkout at another version than the app's pin (the doctor reports
 * that skew separately), and measuring the app against this checkout's
 * selectors would then call every selector missing from a correctly wired app.
 * This checkout's copy is used only when the app's cannot be loaded.
 * @param {string} configPath @returns {string[]}
 */
function lumoSelectorsFor(configPath) {
  try {
    // Synchronous `require` of an ES module (Node 22.12+; this package needs 24).
    const selectors = selectorsOf(createRequire(configPath)("lumo-ui/config/eslint").lumoRules);
    if (selectors.length > 0 && selectors.every((s) => typeof s === "string")) return selectors;
  } catch { /* not resolvable or not loadable from the app */ }
  return LUMO_SELECTORS;
}

/**
 * One of the app's own source files to ask ESLint about. Tests, fixtures and
 * type-tests are skipped: Lumo's policy switches itself off for them on
 * purpose, so they would report a gap that is not there.
 * @param {string} dir @returns {string | undefined}
 */
function sampleSource(dir) {
  /** @type {Record<string, string>} */
  const byExt = {};
  for (const p of walkPackage(dir)) {
    if (/\.(test|spec|type-test)\.|\/fixtures\/|\.d\.ts$|(^|\/)[^/]*\.config\.[cm]?[jt]s$/.test(p)) continue;
    const ext = /\.(tsx|ts|jsx|js|mjs)$/.exec(p)?.[1];
    if (ext !== undefined && byExt[ext] === undefined) byExt[ext] = p;
  }
  return byExt.tsx ?? byExt.ts ?? byExt.jsx ?? byExt.js ?? byExt.mjs;
}

/**
 * The `no-restricted-syntax` selectors ESLint would actually apply to one of
 * this app's files, asked of the app's OWN ESLint (`--print-config`).
 *
 * A text match on the import cannot answer this. ESLint REPLACES a rule's
 * options when a later config block names the same rule; it does not merge
 * them. A config that spreads Lumo's policy and then declares its own
 * `no-restricted-syntax` keeps the import and none of Lumo's selectors, and
 * that exact shape passed this check while every Lumo selector was off.
 *
 * Returns undefined when the answer cannot be established: no ESLint installed
 * for this app, no source file to ask about, the file is ignored, or ESLint
 * failed. The caller then reports nothing either way rather than guessing.
 * @param {string} appDir @param {string} configPath
 * @returns {{ file: string, selectors: string[] } | undefined}
 */
function effectiveSelectors(appDir, configPath) {
  const file = sampleSource(appDir);
  if (file === undefined) return undefined;
  let bin;
  try {
    const manifest = createRequire(join(appDir, "package.json")).resolve("eslint/package.json");
    const binField = JSON.parse(readFileSync(manifest, "utf8")).bin;
    bin = join(dirname(manifest), typeof binField === "string" ? binField : binField?.eslint ?? "bin/eslint.js");
  } catch { return undefined; }
  let config;
  try {
    // Real paths: ESLint measures the file against its cwd, which a child
    // process reports resolved. Through a symlinked prefix (macOS `/var` is
    // `/private/var`) the file would sit "outside" it and print as ignored.
    const cfg = realpathSync(configPath);
    const stdout = execFileSync(process.execPath, [bin, "--config", cfg, "--print-config", realpathSync(file)], {
      cwd: dirname(cfg), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60_000, maxBuffer: 64 * 1024 * 1024,
    });
    config = JSON.parse(stdout);
  } catch { return undefined; }
  if (config === null || typeof config !== "object") return undefined;
  const rule = config.rules?.["no-restricted-syntax"];
  const entries = Array.isArray(rule) ? rule : [rule];
  const level = entries[0];
  if (rule === undefined || level === 0 || level === "off") return { file, selectors: [] };
  const selectors = entries.slice(1).map((e) => (typeof e === "string" ? e : e?.selector)).filter((s) => typeof s === "string");
  return { file, selectors };
}

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
      // E. the served error shells — a SERVER build's. A static export has no
      // `.next/server` tree for own-error-shells to rewrite and no server to
      // answer `/_global-error`; its 404 documents are in `out/`, which the
      // gate grades like any other page.
      const build = app.pkg?.scripts?.build ?? "";
      const staticExport = /\boutput\s*:\s*["']export["']/.test(src);
      if (!staticExport && !/own-error-shells/.test(build)) {
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
    // D. the gate's floors file — for a gate that runs Lumo at all
    const gate = app.pkg?.scripts?.gate;
    const traced = typeof gate === "string" && !DELEGATES.test(gate.trim()) ? traceGate(app.dir, gate, app.pkg?.scripts ?? {}) : undefined;
    const besideFloors = existsSync(join(app.dir, "gate.floors.json")) ? "gate.floors.json" : undefined;
    if (traced !== undefined && !traced.invokes) {
      // Its own assertions, as far as the trace can see. Demanding a floors
      // file here was a hard failure about a file nothing would read, and it
      // hid the real gap. The wording is what was measured: the trace has
      // limits (see `traceGate`), so this is advice, not a verdict.
      out.push({ level: "soft", where: `${here}/package.json › scripts.gate`, what: "no call to Lumo's grader was found in what this gate runs (followed: the command, the package scripts it names and the local script files it executes), so as far as this check can see, Lumo grades none of this app's pages", fix: "pipe the pages this gate already builds or fetches through `lumo gate <dir> gate.floors.json` (or `grade-app.mjs <dir> <locale> gate.floors.json`), with `@min-documents` and `@locales` declared. If Lumo runs by a route this check cannot follow, this is noise" });
      // A floors file beside package.json says something reads it, perhaps by
      // a route the trace missed, so it is still held to its settings.
      if (besideFloors !== undefined) checkFloors(app.dir, here, besideFloors, out);
    } else if (traced !== undefined) {
      // Named on the command line, or — as a served-byte grader in a consumer
      // app does — read by the script itself from beside package.json.
      const floorsName = traced.floorsArg ?? besideFloors;
      if (!floorsName) {
        out.push({ level: "hard", where: `${here}/package.json › scripts.gate`, what: "runs the gate with no floors file", fix: "pass `gate.floors.json` as the last argument, declaring `@min-documents` and `@locales`" });
      } else {
        checkFloors(app.dir, here, floorsName, out);
      }
    }
    // F. the lint policy is the FIRST line; the gate is the last
    const eslint = ["eslint.config.mjs", "eslint.config.js", "eslint.config.ts"].map((n) => join(app.dir, n)).find(existsSync)
      ?? ["eslint.config.mjs", "eslint.config.js", "eslint.config.ts"].map((n) => join(root, n)).find(existsSync);
    if (eslint && !seenEslint.has(eslint)) {
      seenEslint.add(eslint);
      if (!/lumo-ui\/config\/eslint/.test(readFileSync(eslint, "utf8"))) {
        out.push({ level: "soft", where: rel(eslint), what: "does not extend Lumo's lint policy", fix: 'import from "lumo-ui/config/eslint" — the gate is the last line; lint at authoring time is the first, and first-contact counts of 645 and 17,797 are what its absence costs' });
      } else {
        // The import is there; whether its selectors survive is a separate question.
        const effective = effectiveSelectors(app.dir, eslint);
        const expected = effective === undefined ? [] : lumoSelectorsFor(eslint);
        const missing = effective === undefined ? [] : expected.filter((s) => !effective.selectors.includes(s));
        if (effective !== undefined && missing.length > 0) {
          out.push({ level: "soft", where: rel(eslint), what: `extends Lumo's lint policy, but ${missing.length} of its ${expected.length} selectors are not in effect for ${rel(effective.file)} — usually a later block that declares its own \`no-restricted-syntax\`, which ESLint applies INSTEAD of Lumo's, not beside them`, fix: 'merge them: `"no-restricted-syntax": [level, ...lumoRules["no-restricted-syntax"].slice(1), ...yours]`, with `lumoRules` imported from "lumo-ui/config/eslint"' });
        }
      }
    }
  }
  return out;
}

/** Render findings for a terminal. Returns the exit code the caller should use.
 * @param {Finding[]} findings */
export function reportWiring(findings) {
  if (findings.length === 0) {
    console.log("  wiring: no findings in the checks run here (transpile, TypeScript extensions, gate and floors, error shells, lint policy).");
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
