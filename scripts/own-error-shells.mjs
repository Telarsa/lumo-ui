/**
 * Own Next's builtin error shells.
 *
 * Next renders two documents that no app-router source file can reach, and
 * serves both to real readers:
 *
 *   /_global-error → `next/dist/client/components/builtin/app-error.js`
 *   /_not-found    → `next/dist/client/components/builtin/global-not-found.js`
 *
 * Each renders a bare `<html>` — no `lang`, no `dir` — with English copy. On a
 * Persian-default product that is a screen reader announcing "A server error
 * occurred. Reload to try again." in an English voice, on a page the reader
 * reached by having something go wrong.
 *
 * **`_global-error` cannot be fixed in source.** It is not a matter of writing
 * `app/global-error.tsx`; a correct one has no effect. The build hardwires the
 * route to the builtin module and then deletes every user layout from its tree:
 *
 *   route-discovery.js:186   `const hasAppGlobalError = !isDev && appDirOnly;`
 *   route-discovery.js:192   `require.resolve(".../builtin/app-error")`
 *   next-app-loader:303-318  `if (isAppErrorRoute)` sets the page unconditionally
 *   next-app-loader:333      `if (isAppErrorRoute) { … filter(type !== "layout") }`
 *
 * (Measured on Next 16.3 against a consumer app that ships a correct
 * `app/global-error.tsx` whose Persian copy appears ZERO times in the shell.)
 *
 * **`_not-found` usually IS fixable in source** — it renders UNDER the root
 * layout, so any app whose root layout emits `<html lang dir>` already ships a
 * clean one and must not be touched here. Only an app that puts `<html>` inside
 * a `[locale]` segment, leaving no root layout, gets the bare builtin.
 *
 * So the remaining lever is the bytes. These shells are static files, and
 * `next build` copies each to the path the server actually resolves:
 *
 *   .next/server/app/_global-error.html → .next/server/pages/500.html
 *   .next/server/app/_not-found.html    → .next/server/pages/404.html
 *   pages-manifest.json                 → {"/404": …, "/500": …}
 *
 * Both copies are byte-identical and `base-server` reads the manifest to answer
 * a 404 or a 500. Rewriting BOTH is therefore a real fix and not a way to quiet
 * the gate: the second path is what a reader receives. Rewriting only the first
 * would leave the served bytes wrong while the grade went green, which is the
 * one outcome this file exists to avoid.
 *
 * A shell is a hand-written static document. It cannot negotiate a locale —
 * reading `headers()` makes the route dynamic and Next then emits no artifact at
 * all — so a multi-locale product declares one language here, the same one it
 * declares to `grade-app`.
 *
 *   usage: own-error-shells <.next dir> --error <file.html> [--not-found <file.html>]
 */
import { copyFileSync, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const argv = process.argv.slice(2);
const dir = argv[0];
/** @type {Record<string, string|undefined>} */
const flags = {};
for (let i = 1; i < argv.length; i += 2) {
  const flag = argv[i];
  if (flag === undefined || !flag.startsWith("--")) usage(`unexpected argument: ${flag}`);
  else flags[flag.slice(2)] = argv[i + 1];
}

/** @param {string} [message] */
function usage(message) {
  if (message) console.error(`  ${message}`);
  console.error("usage: own-error-shells <.next dir> --error <file.html> [--not-found <file.html>]");
  console.error("  e.g. own-error-shells .next --error error-shell.html");
  process.exit(2);
}

if (!dir) usage();
for (const key of Object.keys(flags)) {
  if (key !== "error" && key !== "not-found") usage(`unknown flag: --${key}`);
}
if (!flags.error && !flags["not-found"]) usage("nothing to do: pass --error and/or --not-found");

const next = resolve(/** @type {string} */ (dir));
if (!existsSync(join(next, "server"))) {
  usage(`${relative(process.cwd(), next)} does not look like a .next directory (no server/)`);
}

/**
 * The two places one shell lives. The `app/` copy is what `grade-app` reads;
 * the `pages/` copy is what `pages-manifest.json` points the server at. They
 * are written by the same build and must stay in step.
 */
const SHELLS = {
  error: { app: "app/_global-error.html", served: "pages/500.html" },
  "not-found": { app: "app/_not-found.html", served: "pages/404.html" },
};

/**
 * A document that already declares BOTH `lang` and `dir` is one the app owns —
 * it is exactly what `lang-dir` asks for, so replacing it with a static shell
 * would trade a working localised page for a hardcoded one. Skip it and say so.
 * @param {string} file
 */
function alreadyOwned(file) {
  const open = /<html([^>]*)>/i.exec(readFileSync(file, "utf8"));
  const attrs = open?.[1];
  if (attrs === undefined) return false;
  return /\blang\s*=/i.test(attrs) && /\bdir\s*=/i.test(attrs);
}

/**
 * `output: "standalone"` copies the whole server tree into a self-contained
 * bundle — including its OWN copy of these shells, at a nested `.next` whose
 * depth depends on the workspace root Next inferred. That bundle is what ships
 * in the Docker image, so rewriting only the outer tree would fix the graded
 * copy and deploy the broken one, which is the failure this file exists to
 * prevent. Measured on a consumer app whose bundle carries a byte-identical
 * copy at `.next/standalone/apps/web/.next/server/pages/500.html`.
 * @param {string} root
 * @returns {string[]} every `<something>/server` directory holding built shells
 */
function serverRoots(root) {
  const roots = [join(root, "server")];
  const standalone = join(root, "standalone");
  if (!existsSync(standalone)) return roots;
  /** @param {string} dir @param {number} depth */
  const walk = (dir, depth) => {
    if (depth > 6) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (entry.name === "node_modules") continue;
      const child = join(dir, entry.name);
      if (entry.name === ".next" && existsSync(join(child, "server"))) roots.push(join(child, "server"));
      else walk(child, depth + 1);
    }
  };
  walk(standalone, 0);
  return roots;
}

const roots = serverRoots(next);
let replaced = 0;
let skipped = 0;
for (const [flag, paths] of Object.entries(SHELLS)) {
  const source = flags[flag];
  if (!source) continue;
  const shell = resolve(source);
  if (!existsSync(shell) || !statSync(shell).isFile()) usage(`--${flag}: no such file: ${source}`);

  for (const server of roots) {
    for (const target of [paths.app, paths.served]) {
      const dest = join(server, target);
      if (!existsSync(dest)) continue;
      const label = relative(next, dest);
      if (alreadyOwned(dest)) {
        console.log(`  own-error-shells: ${label} already declares lang and dir — left alone`);
        skipped += 1;
        continue;
      }
      copyFileSync(shell, dest);
      replaced += 1;
    }
  }
}

if (replaced === 0 && skipped === 0) {
  console.error("  own-error-shells: no builtin shell found to replace — is this a `next build` output?");
  process.exit(1);
}
console.log(`  own-error-shells: ${replaced} shell(s) replaced with the site's own`);
