#!/usr/bin/env node
/**
 * Vendors a component from shadcn's registry instead of hand-writing it.
 *
 *   node scripts/vendor-from-shadcn.mjs chart slider pagination
 *
 * The rule this exists to enforce: **never hand-type a component upstream
 * already has.** shadcn publishes an `aria-vega` style — React Aria underneath,
 * the same base Lumo rents — so most of what remains on the roadmap already
 * exists, tested, in a shape this library can adopt with edits rather than
 * author from zero.
 *
 * What it does NOT do is drop the file in and call it done. Vendored code lands
 * as a **raw emit in its own commit**, unmodified, and Lumo's changes go in a
 * second commit on top. That separation is the entire point:
 *
 *   - `git log -p <file>` shows exactly what is ours versus theirs
 *   - a later `shadcn add <name> --diff` can still show what upstream changed
 *   - a reviewer can see the Persian/RTL edits without reading 300 lines of
 *     unfamiliar upstream code
 *
 * Squash the two and every future upgrade becomes a manual merge.
 *
 * ── WHAT ALWAYS NEEDS EDITING AFTER A VENDOR ────────────────────────────────
 *
 * Upstream is English-first and direction-agnostic. Every vendored file needs a
 * pass for:
 *
 *  1. **Physical utilities.** `ml-`, `pr-`, `text-left`, `rounded-tl-`,
 *     `space-x-`. Lint will catch these, but fix them rather than suppressing.
 *     `shadcn migrate rtl` handles most automatically — run it.
 *  2. **English defaults.** Any `label = "Close"` or hardcoded `aria-label`
 *     becomes a REQUIRED prop. This is rule 3 and the coverage gate enforces it.
 *  3. **Raw numbers in JSX.** `LumoNode` makes `{count}` a compile error;
 *     upstream has no such rule. Route them through `formatNumber`.
 *  4. **`cn` import path.** Upstream imports from `@/lib/utils`; Lumo's lives in
 *     `@lumo-ui/core`.
 *  5. **`cva` in a client module.** If a server-rendered block might call the
 *     variants, they move to `<name>.variants.ts` — see button.variants.ts.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/*
 * `base-vega` — Base UI underneath, the engine Lumo migrated to (10 Aug 2026,
 * experiments/COMPARISON.md). Was `aria-vega` while Lumo rented React Aria.
 *
 * Measured the day of the switch: 48 of Lumo's 77 components have a base-vega
 * counterpart (experiments/measurements/base-vega-inventory.json). That is the
 * cheapest path through the migration by a wide margin — vendor the emit, then
 * apply the Lumo pass. Hand-writing a component that upstream already ships is
 * the thing this script exists to stop.
 */
const STYLE = process.env.LUMO_STYLE ?? "base-vega";
const ROOT = new URL("..", import.meta.url).pathname;
const OUT = join(ROOT, "packages/ui/src");

const names = process.argv.slice(2);
if (names.length === 0) {
  console.error("usage: vendor-from-shadcn.mjs <component>...");
  console.error("       e.g. chart slider pagination carousel command");
  process.exit(2);
}

let failed = false;

for (const name of names) {
  const url = `https://ui.shadcn.com/r/styles/${STYLE}/${name}.json`;
  const res = await fetch(url);

  if (!res.ok) {
    // A 404 usually means the component exists only under a Radix or Base UI
    // style. Say which, rather than leaving the reader to guess.
    const alt = await fetch(`https://ui.shadcn.com/r/styles/aria-vega/${name}.json`);
    console.error(
      `  ${name}: not in ${STYLE} (${res.status})` +
        (alt.ok
          ? " — it exists under aria-vega (React Aria), so it is not a free port: " +
            "read it for the composition, then build on Base UI primitives"
          : " — no counterpart in either style; this one is Lumo's to write"),
    );
    failed = true;
    continue;
  }

  const item = await res.json();
  for (const file of item.files ?? []) {
    const target = join(OUT, `${name}.tsx`);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, file.content);
    console.log(`  ${name}: ${file.content.length} chars → packages/ui/src/${name}.tsx`);
  }
  if (item.dependencies?.length) console.log(`    npm deps: ${item.dependencies.join(", ")}`);
  if (item.registryDependencies?.length)
    console.log(`    needs also: ${item.registryDependencies.join(", ")}`);
}

console.log(
  "\n  Commit this raw emit ALONE, then apply Lumo's changes in a second commit.\n" +
    "  Then: pnpm dlx shadcn@4.16.2 migrate rtl . && pnpm run verify\n",
);

process.exit(failed ? 1 : 0);
