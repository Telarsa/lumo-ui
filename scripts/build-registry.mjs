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
import ts from "typescript";

const ROOT = new URL("..", import.meta.url).pathname;
const registryFlag = process.argv.indexOf("--registry");
const registryPath =
  registryFlag === -1 ? join(ROOT, "registry.json") : process.argv[registryFlag + 1];
if (registryPath === undefined) {
  console.error("  registry: --registry requires a path");
  process.exit(2);
}
const checkOnly = process.argv.includes("--check");
const SOURCES = [
  { dir: join(ROOT, "packages/ui/src"), type: "registry:ui", target: "components/ui" },
  { dir: join(ROOT, "packages/blocks/src"), type: "registry:block", target: "components/blocks" },
];

/*
 * Modules that are not components but that copied components import. They ride
 * along in every item that references them — the same argument `*.variants.ts`
 * makes, generalised: a consumer receives files, and a file that imports a
 * sibling nobody shipped does not compile.
 *
 * The three entries are three different KINDS of cost, and the difference is
 * worth keeping visible:
 *
 *   base-ui-adapter.ts   Translates an API that exists. Base UI has a button;
 *                        it just spells `onPress` as `onClick`. It shrank when
 *                        the ENGINE half of it left — see below.
 *   date-field-state.ts  IS the primitive. Base UI ships no date field at all,
 *                        so the segmented-entry engine React Aria used to
 *                        supply is now a file in this repo that every date
 *                        component copies.
 *   locale.ts            The locale context Base UI has no equivalent for; it
 *                        models direction and nothing else.
 *
 * A FOURTH KIND deliberately does NOT appear in this set: `@lumo-ui/base-ui-ssr`
 * is a PACKAGE, not a companion file, so it is declared in `dependencies` beside
 * `@lumo-ui/core` rather than copied. The rule is the same one DECISIONS.md
 * states for core, and it applies for a sharper reason here. That module exists
 * to compensate for a specific version of somebody else's library; when Base UI
 * fixes the layout-effect naming upstream, one `pnpm up` retires it for every
 * consumer at once. Copied into 107 items it would instead be 107 forks of a
 * workaround, each frozen at the day it was copied, each still shipping after
 * the bug it works around is gone. Copy-in is right for code a consumer should
 * own and edit; it is wrong for a patch against an upstream defect.
 */
const SHARED_COMPANIONS = new Set([
  "base-ui-adapter.ts",
  "date-field-state.ts",
  "locale.ts",
  /*
   * A FIFTH kind, and the newest: `virtualizer.ts` is not a translation, not a
   * missing primitive and not a context — it is ARITHMETIC that used to be a
   * dependency. `virtual-list.tsx` ran on `@tanstack/react-virtual` until
   * 11 Aug 2026; replacing it moved a package into this repository, and a
   * consumer who copies `virtual-list` must receive the arithmetic with it or
   * receive an unresolved import.
   *
   * It is listed here rather than picked up automatically because the automatic
   * companion rule matches `<name>.variants.ts` only, and this is deliberately
   * NOT named `virtual-list.variants.ts`: the variants module is directive-free
   * so a server component can call it, and this one carries `"use client"`.
   * Merging them would drag the whole hook into the RSC graph.
   *
   * Caught by `gate:smoke`, which compiled the item as a consumer receives it
   * and found the dangling `./virtualizer.ts` — the exact failure this set
   * exists to prevent, on the exact day the set gained a member.
   */
  "virtualizer.ts",
  /*
   * Two more, added by the react-day-picker migration on 11 Aug 2026, and both
   * for the reason this set exists rather than by analogy:
   *
   *   calendar-datelib.ts  binds react-day-picker's grid to
   *                        `@internationalized/date`'s calendar systems. It is
   *                        the file that makes a Jalali month a Jalali month,
   *                        and `calendar.tsx` and `range-calendar.tsx` both
   *                        import it. Not named `calendar.variants.ts` because
   *                        it is not classes — it is a `DateLib`, a formatter
   *                        set and a label table.
   *
   *   date-input.tsx       THE segmented input: the keyboard model, once, for
   *                        the whole date family. `date-field`, `time-field`,
   *                        `date-picker` and `date-range-picker` all render it.
   *                        It carries `"use client"` and its own markup, so it
   *                        is neither a variants module nor a plain helper.
   *
   * Both were caught by `gate:smoke` compiling the item as a consumer receives
   * it — the dangling `./calendar-datelib.ts` showed up on the same run that
   * introduced it, which is the third time this set has gained a member that
   * way.
   */
  "calendar-datelib.ts",
  "date-input.tsx",
  /*
   * Filters is interactive, but its clause factory is useful while rendering
   * a server-owned default query. Keep that factory directive-free and copy it
   * with the client component; otherwise the generated registry leaves a
   * dangling `./filters.shared.ts` import in every consumer project.
   */
  "filters.shared.ts",
]);

/** Packages a consumer must install; everything else is workspace-internal. */
const EXTERNAL = new Set([
  /*
   * `react-aria-components` WAS the first entry here and is gone, by the rule
   * the `recharts` note below states: an EXTERNAL entry is only ever justified
   * by an import that exists.
   *
   * The runtime imports went with the Base UI migration, but 31 files kept
   * `import type { … } from "react-aria-components"` to `Omit` and `Pick` from,
   * and a type import matches the scanner above exactly as a runtime one does —
   * so every one of those 31 items was still telling a consumer to install
   * React Aria to get types for behaviour the component no longer had. That is
   * the failure this file is otherwise good at preventing, arriving through the
   * one door a bundler cannot see. The shapes live in `@lumo-ui/core`'s
   * `props.ts` now; the package is a devDependency of `packages/ui`, kept only
   * so the poison-twin tests can render real React Aria.
   */
  "@internationalized/date",
  // The calendar grid itself since 11 Aug 2026. A consumer copying `calendar`
  // installs it; the CALENDAR SYSTEM still comes from
  // `@internationalized/date`, which rides along as a companion file.
  "react-day-picker",
  "class-variance-authority",
  "lucide-react",
  "clsx",
  "tailwind-merge",
  // Rendering dependencies, not behaviour ones. A consumer who copies chart.tsx
  // or carousel.tsx without these gets an unresolved import. The smoke test's
  // metadata pass now catches that omission before its node_modules symlink can
  // make the later payload compile look green.
  //
  // `recharts` WAS in this set and is gone with the pin (pnpm-workspace.yaml):
  // `chart.tsx` stopped importing it on the TanStack swap, so the entry was
  // telling every consumer of the `chart` item to install a renderer that item
  // no longer contains. An EXTERNAL entry is only ever justified by an import
  // that exists.
  "embla-carousel-react",
  "@base-ui/react",
  // The renderer since 11 Aug 2026 (chart.tsx) and the two headless state
  // layers (table.tsx, form-state.tsx). Both are imported by SUBPATH —
  // `@tanstack/charts/react`, `@tanstack/charts/scales/linear` — which is
  // exactly the case the `packageOf` matcher below exists for.
  //
  // `@tanstack/react-virtual` was here and is gone: `virtual-list.tsx` runs on
  // Lumo's own `virtualizer.ts` since 11 Aug 2026. It is the ONE TanStack
  // package that was replaced rather than kept, because it was the one with
  // measured defects for this library — see that file's header.
  "@tanstack/charts",
  "@tanstack/react-table",
  "@tanstack/react-form",
]);

/**
 * Parse real module specifiers. Prose and examples in comments are not imports.
 * @param {string} source
 * @param {string} fileName
 * @returns {string[]}
 */
const importSpecifiers = (source, fileName) => {
  const parsed = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, false);
  /** @type {string[]} */
  const specifiers = [];
  /** @param {ts.Node} node */
  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier !== undefined &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1
    ) {
      const argument = node.arguments[0];
      if (argument !== undefined && ts.isStringLiteral(argument)) {
        specifiers.push(argument.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(parsed);
  return specifiers;
};

const items = [];
for (const { dir, type, target } of SOURCES) {
  /** @type {string[]} */
  const all = await readdir(dir).catch(() => []);
  const files = all.filter(
    (f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx") && !f.endsWith(".type-test.tsx"),
  );
  for (const file of files.sort()) {
  const name = file.replace(/\.tsx$/, "");
  const source = await readFile(join(dir, file), "utf8");

  /*
   * A component's imports are its OWN plus its companion's.
   *
   * The companion is shipped in the same registry item (see the files array
   * below), so a consumer copying `table` receives `table.variants.ts` — and
   * that file has imports of its own. Scanning only the `.tsx` declared ZERO
   * dependencies for anything a companion alone imports, and the consumer got
   * an unresolved specifier that the smoke test cannot see, because its
   * node_modules symlink already resolves it.
   *
   * Found when `cva()` moved out of table.tsx into table.variants.ts during the
   * TanStack migration: `class-variance-authority` silently left the item's
   * dependency list while the import stayed in the shipped files. chart.tsx had
   * carried the same hole since its companion was introduced. The smoke
   * metadata pass now also proves this closure independently of generation.
   */
  /** @type {string[]} */
  const shippedFileNames = [file];
  const variantFile = file.replace(/\.tsx$/, ".variants.ts");
  if (all.includes(variantFile)) shippedFileNames.push(variantFile);

  // Shared companions can have package imports of their own. Follow the
  // carried-file closure so dependency metadata describes every byte shipped,
  // not only the top-level component and variants file.
  /** @type {Map<string, string>} */
  const sourceByFile = new Map([[file, source]]);
  for (let index = 0; index < shippedFileNames.length; index += 1) {
    const shipped = shippedFileNames[index];
    if (shipped === undefined) continue;
    const shippedSource =
      sourceByFile.get(shipped) ?? await readFile(join(dir, shipped), "utf8");
    sourceByFile.set(shipped, shippedSource);
    for (const specifier of importSpecifiers(shippedSource, shipped)) {
      if (!specifier.startsWith("./")) continue;
      const localFile = specifier.replace(/^\.\//, "");
      if (
        SHARED_COMPANIONS.has(localFile) &&
        all.includes(localFile) &&
        !shippedFileNames.includes(localFile)
      ) {
        shippedFileNames.push(localFile);
      }
    }
  }

  const imports = shippedFileNames.flatMap((shipped) =>
    importSpecifiers(sourceByFile.get(shipped) ?? "", shipped),
  );
  /*
   * Subpath-aware. `EXTERNAL` lists PACKAGE names, but a modern package is often
   * imported by subpath — `@base-ui/react/select`, not `@base-ui/react`. An
   * exact-match set silently declared ZERO dependencies for every such import,
   * so a consumer copying the file received an import for a package nothing told
   * them to install. Found by the Base UI experiment; the bug is the matcher's,
   * and it would bite any subpath-exporting dependency.
   */
  /** @param {string} spec @returns {string} */
  const packageOf = (spec) => {
    const parts = spec.split("/");
    // `parts[0]` is `string | undefined` under noUncheckedIndexedAccess even
    // though String.split never returns an empty array; `?? spec` keeps the
    // fallback truthful (an unsplittable specifier IS its own package name)
    // rather than asserting the index away.
    return spec.startsWith("@") ? parts.slice(0, 2).join("/") : (parts[0] ?? spec);
  };
  const dependencies = [
    ...new Set(imports.map(packageOf).filter((i) => EXTERNAL.has(i))),
  ].sort();
  const registryDependencies = [
    ...new Set(
      imports
        .filter((i) => i.startsWith("./"))
        .map((i) => i.replace(/^\.\//, "").replace(/\.(?:tsx?|jsx?)$/, ""))
        // A companion import names its OWNER: importing `file-upload.variants.ts`
        // depends on the `file-upload` registry item (which carries the
        // companion in its files array) — there is no item named
        // "file-upload.variants.ts", and the review found attachment shipping
        // exactly that unresolvable dependency.
        .map((i) => i.replace(/\.variants$/, ""))
        // A shared companion is carried as a FILE, never named as an item —
        // there is no registry item called "base-ui-adapter.ts".
        .filter((i) => !SHARED_COMPANIONS.has(`${i}.ts`) && !SHARED_COMPANIONS.has(i))
        // A file's own companion is itself, not a dependency.
        .filter((i) => i !== name),
    ),
  ].sort();

  // @lumo-ui/core is a package, not a copy-in item: it holds the invariants a
  // consumer must NOT diverge from. See DECISIONS.md on the package/copy-in line.
  if (imports.includes("@lumo-ui/core")) dependencies.push("@lumo-ui/core");
  // @lumo-ui/base-ui-ssr is a package for the opposite reason: it holds a
  // workaround against a dated upstream defect, and a copied workaround is one
  // that outlives its bug. See the header.
  if (imports.includes("@lumo-ui/base-ui-ssr")) dependencies.push("@lumo-ui/base-ui-ssr");
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
      ...shippedFileNames
        .filter((shipped) => shipped !== file)
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

const serialized = JSON.stringify(registry, null, 2) + "\n";
if (checkOnly) {
  const current = await readFile(registryPath, "utf8").catch(() => "");
  if (current !== serialized) {
    console.error(`  registry: ${registryPath} is stale; run node scripts/build-registry.mjs`);
    process.exit(1);
  }
} else {
  await writeFile(registryPath, serialized);
}

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
