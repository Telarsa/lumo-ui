#!/usr/bin/env node
/**
 * Gate 3 — CSS Modules are banned in Lumo. A component styled in `.module.css`
 * has no class strings, so `lumo diff`/`lumo upgrade` and the styling gates — the
 * two mechanical RTL enforcers — have nothing to walk. Runs on an empty
 * repository and passes: the gate exists before the code it guards.
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
    "\n  Style with Tailwind utilities inside cva() so that the styling floors and\n" +
      "  `lumo diff`/`lumo upgrade` can both see them. See docs/decisions/log.md.\n",
  );
  process.exit(1);
}

console.log("  gate:no-css-modules — clean");
