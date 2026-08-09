#!/usr/bin/env node
/**
 * Gate 3 — CSS Modules are banned in Lumo.
 *
 * This is the mechanical form of the styling decision itself. Without it,
 * "we use Tailwind" is a comment, and comments have already failed once on
 * this exact project: a 52-component prototype shipped 118 `.module.css`
 * files and 19,116 lines of hand-written CSS, none of it shareable and none
 * of it diffable against upstream.
 *
 * The ban is not aesthetic. A component whose styling lives in a separate
 * `.module.css` has no class strings, and therefore:
 *   - `shadcn add <name> --diff` has nothing to compare against upstream, and
 *   - `shadcn migrate rtl` — which rewrites 38 physical utilities to logical
 *     ones at the AST level — has nothing to walk.
 * Both mechanical RTL enforcers exist only on the Tailwind path.
 *
 * Runs on an empty repository and passes, which is the point: the gate exists
 * before the code it guards.
 */

import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SEARCH = ["packages", "apps", "registry"];
const SKIP = new Set(["node_modules", ".next", "out", "dist", ".git"]);

/** @param {string} dir @returns {Promise<string[]>} */
async function walk(dir) {
  /** @type {import('node:fs').Dirent[]} */
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return []; // a search root that does not exist yet is not a failure
  }
  const found = [];
  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await walk(path)));
    else if (entry.name.endsWith(".module.css")) found.push(path);
  }
  return found;
}

const offenders = (
  await Promise.all(SEARCH.map((d) => walk(join(ROOT, d))))
).flat();

if (offenders.length > 0) {
  console.error(
    `\n  CSS Modules are banned in Lumo — found ${offenders.length}:\n`,
  );
  for (const file of offenders) console.error(`    ${relative(ROOT, file)}`);
  console.error(
    "\n  Style with Tailwind utilities inside cva() so that `shadcn migrate rtl`\n" +
      "  and `shadcn add --diff` can both see them. See DECISIONS.md.\n",
  );
  process.exit(1);
}

console.log("  gate:no-css-modules — clean");
