#!/usr/bin/env node
/**
 * Vendors a component from shadcn's registry instead of hand-writing it:
 *
 *   node scripts/vendor-from-shadcn.mjs chart slider pagination
 *
 * Never hand-type a component upstream already has. The raw emit lands
 * UNMODIFIED in its own commit and Lumo's edits go in a second, so `git log -p`
 * shows ours versus theirs and a later `--diff` still works. Every vendored
 * file then needs the Lumo pass: logical utilities (`shadcn migrate rtl`),
 * English defaults → required props, raw numbers → `formatNumber`, `cn` from
 * `@lumo-ui/core`, and `cva` moved to `<name>.variants.ts` where a server
 * block calls it.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

// `base-vega` — Base UI underneath, the engine Lumo migrated to; was `aria-vega`.
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
    // A 404 usually means the component exists only under another style. Say which.
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
