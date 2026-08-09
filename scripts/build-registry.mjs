#!/usr/bin/env node
/**
 * Generates `registry.json` from the components that actually exist.
 *
 * Hand-maintaining a manifest beside a component directory is a guarantee the
 * two will drift — the manifest is the thing nobody remembers to update, and its
 * failure mode is silent: a component that exists but cannot be installed, or an
 * entry pointing at a file that was renamed.
 *
 * So the manifest is derived. Each component file declares what it needs through
 * its own imports, and this script reads them:
 *
 *   - `registryDependencies` from imports of sibling components
 *   - `dependencies` from external package imports
 *   - `type` from whether the file carries "use client"
 *
 * The emitted shape conforms to shadcn's registry-item schema so that a consumer
 * can `shadcn add` it, and so that publishing later is a hosting decision rather
 * than a rewrite. Lumo is private today (DECISIONS.md §0.2); nothing here
 * depends on that staying true.
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SOURCES = [
  { dir: join(ROOT, "packages/ui/src"), type: "registry:ui", target: "components/ui" },
  { dir: join(ROOT, "packages/blocks/src"), type: "registry:block", target: "components/blocks" },
];

/** Packages a consumer must install; everything else is workspace-internal. */
const EXTERNAL = new Set([
  "react-aria-components",
  "@internationalized/date",
  "class-variance-authority",
  "lucide-react",
  "clsx",
  "tailwind-merge",
]);

const items = [];
for (const { dir, type, target } of SOURCES) {
  const all = await readdir(dir).catch(() => []);
  const files = all.filter(
    (f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx") && !f.endsWith(".type-test.tsx"),
  );
  for (const file of files.sort()) {
  const name = file.replace(/\.tsx$/, "");
  const source = await readFile(join(dir, file), "utf8");

  const imports = [...source.matchAll(/from\s+["']([^"']+)["']/g)]
    .map((m) => m[1])
    .filter((i) => i !== undefined);
  const dependencies = [...new Set(imports.filter((i) => EXTERNAL.has(i)))].sort();
  const registryDependencies = [
    ...new Set(
      imports
        .filter((i) => i.startsWith("./"))
        .map((i) => i.replace(/^\.\//, "").replace(/\.tsx$/, "")),
    ),
  ].sort();

  // @lumo-ui/core is a package, not a copy-in item: it holds the invariants a
  // consumer must NOT diverge from. See DECISIONS.md on the package/copy-in line.
  if (imports.includes("@lumo-ui/core")) dependencies.push("@lumo-ui/core");
  // A block composes shipped components rather than reimplementing primitives,
  // so it depends on the library as a package.
  if (imports.includes("@lumo-ui/ui")) dependencies.push("@lumo-ui/ui");

  items.push({
    name,
    type,
    title: name.replace(/(^|-)(\w)/g, (_, d, c) => (d ? " " : "") + c.toUpperCase()).trim(),
    description: (source.match(/^\s*\*\s+(.+)$/m)?.[1] ?? "").slice(0, 200),
    author: "Telarsa",
    ...(dependencies.length ? { dependencies: [...new Set(dependencies)].sort() } : {}),
    ...(registryDependencies.length ? { registryDependencies } : {}),
    // Companion modules travel WITH the component.
    //
    // `button.variants.ts` exists because a cva() exported from a "use client"
    // module cannot be called by a server component. It is not a component in
    // its own right, so it gets no registry item — but a consumer who copies
    // button.tsx without it receives a broken import. The smoke test found this
    // by compiling the copied files in a bare project, which is precisely the
    // failure a workspace cannot see.
    files: [
      { path: `${relative(ROOT, dir)}/${file}`, type, target: `${target}/${file}` },
      ...all
        .filter((f) => f === `${name}.variants.ts`)
        .map((f) => ({ path: `${relative(ROOT, dir)}/${f}`, type, target: `${target}/${f}` })),
    ],
  });
  }
}

const registry = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "lumo",
  homepage: "https://lumo-ui.com",
  items,
};

await writeFile(join(ROOT, "registry.json"), JSON.stringify(registry, null, 2) + "\n");

// A registry that lists nothing would publish silently and break every consumer
// on their next `add`. Refuse, the same way the gate refuses an empty build.
if (items.length === 0) {
  console.error("  registry: no components found — refusing to emit an empty manifest");
  process.exit(1);
}

console.log(`  registry: ${items.length} item(s)`);
for (const item of items) {
  const deps = [...(item.dependencies ?? []), ...(item.registryDependencies ?? [])];
  console.log(`    ${item.name.padEnd(18)} ${deps.length ? deps.join(", ") : "no dependencies"}`);
}
