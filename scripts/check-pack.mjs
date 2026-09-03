#!/usr/bin/env node
/**
 * The `lumo-ui` dev dependency reaches a consumer as a git dependency, packed
 * by its `files` allow-list. This packs the root to a scratch directory and
 * checks that everything the `lumo` CLI imports or reads at runtime is inside —
 * found necessary when 0.1.2's first install lacked scripts/lib (16 Aug 2026).
 *
 * And then RUNS the two commands, from the extracted tarball, in a directory
 * shaped like a consumer's. Presence is not the claim docs/verification.md
 * makes: it says the tarball "carries every file the CLI and `grade-app` need
 * AT RUNTIME", and a `tar tzf` cannot say that.
 *
 * The gap was not hypothetical. `grade-app.mjs` spawned
 * `packages/gate/src/cli.ts` with `--experimental-strip-types`, and Node
 * refuses to strip types under node_modules — which is exactly where a
 * consumer's copy lives. Every file it needed was present, so this script
 * passed, while the command README, llms.txt, the skill and
 * docs/agent-consumer.md all name as HOW YOU GRADE A PRODUCT died in Node
 * internals for every consumer, and worked here only because a checkout is not
 * under node_modules.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const REQUIRED = [
  "package/scripts/lumo-cli.mjs",
  "package/scripts/grade-app.mjs",
  "package/scripts/own-error-shells.mjs",
  // Every subpath the root `exports` map promises must be IN the tarball.
  //
  // The sub-package manifests are deliberately NOT here and deliberately not
  // shipped. `exports` points at FILES, so nothing resolves through them, and
  // every one of them is full of pnpm's `catalog:` protocol — which npm cannot
  // parse while preparing a git dependency, so shipping them broke
  // `npm install github:Telarsa/lumo-ui#<tag>` outright.
  // `config/eslint` is the one that was not: it lives outside `src/`, and the
  // files allow-list only reached `packages/*/src/**`, so `lumo-ui/config/eslint`
  // resolved in the workspace and MODULE_NOT_FOUND in an install.
  "package/packages/config/eslint/lumo.mjs",
  "package/packages/core/src/index.ts",
  "package/packages/theme/src/tokens.css",
  "package/packages/gate/dist/index.js",
  "package/packages/gate/dist/cli.js",
  "package/packages/gate/dist/index.js",
  "package/packages/gate/dist/rules.js",
  "package/pnpm-workspace.yaml",
  "package/docs/agent-consumer.md",
  "package/skills/lumo-ui/SKILL.md",
  "package/CHANGELOG.md",
  "package/LICENSE",
];
const scratch = mkdtempSync(join(tmpdir(), "lumo-pack-"));
try {
  execFileSync("pnpm", ["pack", "--pack-destination", scratch], { cwd: ROOT, stdio: "ignore" });
  const tgz = readdirSync(scratch).find((f) => f.endsWith(".tgz"));
  if (tgz === undefined) throw new Error("pnpm pack produced no tarball");
  const entries = new Set(execFileSync("tar", ["tzf", join(scratch, tgz)], { encoding: "utf8" }).split("\n"));
  const missing = REQUIRED.filter((e) => !entries.has(e));
  if (missing.length) {
    console.error(`  pack: the packed lumo-ui lacks ${missing.length} file(s) the CLI needs:\n    ${missing.join("\n    ")}\n  add them to package.json "files"`);
    process.exit(1);
  }
  // Extract, and run both commands the way a consumer does: from inside
  // node_modules, which is the condition that broke grade-app.
  const consumer = join(scratch, "consumer");
  mkdirSync(join(consumer, "node_modules"), { recursive: true });
  execFileSync("tar", ["xzf", join(scratch, tgz), "-C", join(consumer, "node_modules")]);
  renameSync(join(consumer, "node_modules", "package"), join(consumer, "node_modules", "lumo-ui"));

  // A file can be LISTED and still be nothing: docs/agent-consumer.md and the
  // skill shipped as zero bytes in four releases (0.5.1 → 0.5.5) because this
  // check read the tarball's index, never a size. A required file is required
  // to have content.
  const empty = REQUIRED.filter((e) => statSync(join(consumer, "node_modules", "lumo-ui", e.replace(/^package\//, ""))).size === 0);
  if (empty.length) {
    console.error(`  pack: ${empty.length} required file(s) packed EMPTY:\n    ${empty.join("\n    ")}`);
    process.exit(1);
  }

  /*
   * THE HELPERS WITHOUT REACT. This scratch consumer installs nothing but the
   * tarball — no react, no react/jsx-runtime — which is exactly the shape of an
   * Astro site on Preact. `lumo-ui/core` cannot load here (it imports the JSX
   * runtime for LumoHtml); `lumo-ui/core/latn` must. If this import fails, the
   * first non-React consumer to reach for isLatinRun finds out at build time,
   * which is how it was found the first time.
   */
  // A FILE inside the consumer, not `-e`: an eval has no package scope, so a
  // bare `lumo-ui` specifier would not resolve from it even when installed.
  writeFileSync(
    join(consumer, "latn-smoke.mjs"),
    "import { isLatinRun, latnAttrs, plain } from 'lumo-ui/core/latn';\n" +
      "if (!isLatinRun('SKU-4825') || isLatinRun('سلام') || !isLatinRun('۹۰ Mt/year')) process.exit(1);\n" +
      "if (latnAttrs('Acme')['data-lumo-latn'] !== '' || plain('a [[b]] c') !== 'a b c') process.exit(1);\n",
  );
  execFileSync(process.execPath, [join(consumer, "latn-smoke.mjs")], { cwd: consumer, stdio: "pipe" });
  console.log("  lumo-ui/core/latn imports with no React installed");

  // A real consumer's `npm install` also fetches this package's own runtime
  // dependencies. Symlinking them from this checkout reproduces that WITHOUT a
  // network round trip, which is what lets this run inside `verify`. The
  // dependency list is read from the manifest rather than hard-coded, so a new
  // runtime dependency is exercised here the day it is added instead of the day
  // a consumer reports it missing.
  const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  for (const dep of Object.keys(manifest.dependencies ?? {})) {
    // The DIRECTORY, not a resolved specifier. `createRequire(...).resolve` is
    // the obvious tool and the wrong one: a modern package may not export
    // "./package.json", so resolving it throws for a dependency that is
    // installed and working. `@internationalized/date` is one.
    const from = join(ROOT, "node_modules", dep);
    if (!existsSync(from)) {
      console.error(`  pack: ${dep} is a runtime dependency but is not installed here — run pnpm install.`);
      process.exit(1);
    }
    const to = join(consumer, "node_modules", dep);
    mkdirSync(dirname(to), { recursive: true });
    symlinkSync(from, to, "dir");
  }

  const out = join(consumer, "out", "fa-IR");
  mkdirSync(out, { recursive: true });
  writeFileSync(
    join(out, "index.html"),
    '<!doctype html><html lang="fa-IR" dir="rtl"><body><h1>سفارش‌ها</h1>' +
      '<button aria-label="افزودن">+</button><p>۱۲۰٬۰۰۰ ریال</p></body></html>',
  );

  /** @type {ReadonlyArray<{ label: string; argv: string[] }>} */
  const commands = [
    {
      label: "lumo gate",
      argv: [join(consumer, "node_modules/lumo-ui/scripts/lumo-cli.mjs"), "gate", join(consumer, "out")],
    },
    {
      label: "grade-app",
      argv: [join(consumer, "node_modules/lumo-ui/scripts/grade-app.mjs"), join(consumer, "out", "fa-IR"), "fa-IR"],
    },
  ];
  for (const { label, argv } of commands) {
    try {
      execFileSync(process.execPath, argv, { cwd: consumer, stdio: "pipe" });
    } catch (error) {
      const detail =
        error !== null && typeof error === "object" && "stderr" in error
          ? String(/** @type {{ stderr: unknown }} */ (error).stderr)
          : String(error);
      console.error(`  pack: \`${label}\` FAILED from an installed tarball — the files are all there and the command`);
      console.error("  still does not run. This is the defect a presence check cannot see.");
      console.error(detail.slice(0, 900));
      process.exit(1);
    }
  }

  /*
   * `grade-app` must SKIP a redirect stub, and SAY that it did.
   *
   * A page that calls `redirect()` still leaves an `.html` artifact, but no
   * reader receives its body — Next writes a `.meta` sidecar with the status
   * and answers 3xx from it. One consumer app's `/console/services` is one, and
   * its leftover body is Next's error shell, so grading it reported two
   * `lang-dir` violations against a page nobody can see.
   *
   * Both halves are asserted. Skipping silently would be the worse bug of the
   * two: this tool's whole position is that an ungraded page is an unprotected
   * page, so a skip nobody is told about is how a gate grades 3 of 55 and calls
   * it green.
   */
  const rdir = join(consumer, "redirects", "fa-IR");
  mkdirSync(rdir, { recursive: true });
  writeFileSync(join(rdir, "index.html"), '<!doctype html><html lang="fa-IR" dir="rtl"><body><p>سلام</p></body></html>');
  // The stub Next leaves behind: an error-shell body with no lang or dir.
  writeFileSync(join(rdir, "moved.html"), '<!doctype html><html id="__next_error__"><body>redirecting</body></html>');
  writeFileSync(join(rdir, "moved.meta"), JSON.stringify({ status: 307, headers: { location: "/fa-IR/" } }));
  const graded = execFileSync(
    process.execPath,
    [join(consumer, "node_modules/lumo-ui/scripts/grade-app.mjs"), join(consumer, "redirects", "fa-IR"), "fa-IR"],
    { cwd: consumer, encoding: "utf8" },
  );
  if (!/skipped 1 redirect stub/.test(graded)) {
    console.error("  pack: `grade-app` did not report skipping a 307 stub — a silent skip is an unprotected page.");
    console.error(graded.slice(0, 600));
    process.exit(1);
  }
  if (!/staged 1 document/.test(graded)) {
    console.error("  pack: `grade-app` staged the redirect stub — its body is never served and must not be graded.");
    console.error(graded.slice(0, 600));
    process.exit(1);
  }

  /*
   * `own-error-shells` is checked by RESULT, not by exit code.
   *
   * Its whole reason to exist is a discrimination: replace the shell Next
   * generated, leave alone the one the app already owns. A run that exits 0
   * having overwritten a consumer's working localised 404 would be a
   * REGRESSION reported as a success, so the exit code is the one thing that
   * cannot be the assertion. Both branches are exercised in one run.
   */
  const built = join(consumer, "next");
  const BUILTIN = '<!doctype html><html id="__next_error__"><body>A server error occurred.</body></html>';
  const OWNED = '<!doctype html><html lang="fa-IR" dir="rtl"><body>صفحهٔ خودمان</body></html>';
  /** @type {ReadonlyArray<readonly [string, string]>} */
  const fixture = [
    ["server/app/_global-error.html", BUILTIN],
    ["server/pages/500.html", BUILTIN],
    ["server/app/_not-found.html", OWNED],
    ["server/pages/404.html", OWNED],
    // `output: "standalone"` ships its own copy of the server tree, nested at a
    // depth that depends on the workspace root Next inferred. THAT bundle is
    // what a Docker image runs, so a rewrite that misses it fixes the graded
    // copy and deploys the broken one. Shaped after a consumer app's real
    // output.
    ["standalone/apps/web/.next/server/pages/500.html", BUILTIN],
    ["standalone/apps/web/.next/server/pages/404.html", OWNED],
  ];
  for (const [rel, body] of fixture) {
    mkdirSync(dirname(join(built, rel)), { recursive: true });
    writeFileSync(join(built, rel), body);
  }
  const shell = join(consumer, "shell.html");
  writeFileSync(shell, '<!doctype html><html lang="fa-IR" dir="rtl"><body>REPLACED</body></html>');

  execFileSync(
    process.execPath,
    [
      join(consumer, "node_modules/lumo-ui/scripts/own-error-shells.mjs"),
      join(consumer, "next"),
      "--error",
      shell,
      "--not-found",
      shell,
    ],
    { cwd: consumer, stdio: "pipe" },
  );

  /** @type {string[]} */
  const wrong = [];
  for (const rel of [
    "server/app/_global-error.html",
    "server/pages/500.html",
    "standalone/apps/web/.next/server/pages/500.html",
  ]) {
    // The SERVED copy matters as much as the graded one: pages-manifest.json
    // points the server at pages/500.html, so rewriting only the app/ copy
    // would turn the gate green while readers kept receiving the old bytes.
    if (!readFileSync(join(built, rel), "utf8").includes("REPLACED")) {
      wrong.push(`${rel} was NOT replaced — Next's builtin shell still ships`);
    }
  }
  for (const rel of [
    "server/app/_not-found.html",
    "server/pages/404.html",
    "standalone/apps/web/.next/server/pages/404.html",
  ]) {
    if (!readFileSync(join(built, rel), "utf8").includes("صفحهٔ خودمان")) {
      wrong.push(`${rel} WAS overwritten — a shell the app already owns must be left alone`);
    }
  }
  if (wrong.length) {
    console.error(`  pack: \`own-error-shells\` did the wrong thing:\n    ${wrong.join("\n    ")}`);
    process.exit(1);
  }

  console.log(
    `  pack: ${entries.size - 1} file(s); \`lumo gate\`, \`grade-app\` and \`own-error-shells\` all RUN from an installed tarball`,
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
