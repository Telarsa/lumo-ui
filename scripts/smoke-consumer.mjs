#!/usr/bin/env node
/**
 * The consumer smoke test. Everything else verifies Lumo against itself; this
 * validates each item's declared package and sibling closure, then copies the
 * registry payloads into a throwaway consumer project and type-checks them —
 * because a component can be perfect inside the workspace and uninstallable
 * outside it.
 */

import { mkdtemp, readFile, writeFile, mkdir, cp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, posix } from "node:path";
import { execFileSync } from "node:child_process";
import ts from "typescript";

/** @typedef {{ path: string, target: string, type?: string }} RegistryFile */
/** @typedef {{ name: string, files?: RegistryFile[], dependencies?: string[], registryDependencies?: string[] }} RegistryItem */

const ROOT = new URL("..", import.meta.url).pathname;

const registryFlag = process.argv.indexOf("--registry");
const registryPath =
  registryFlag === -1 ? join(ROOT, "registry.json") : process.argv[registryFlag + 1];
if (registryPath === undefined) {
  console.error("  smoke: --registry requires a path");
  process.exit(1);
}

/** @type {{ items: RegistryItem[] }} */
const registry = JSON.parse(await readFile(registryPath, "utf8"));
if (!registry.items?.length) {
  console.error("  smoke: registry has no items — refusing to report success");
  process.exit(1);
}

/*
 * Validate the manifest as a manifest first: the compile below has a real
 * node_modules, so by itself it cannot prove an item declares the packages and
 * sibling items its source imports.
 */
/** @type {Map<string, string[]>} */
const ownersByTarget = new Map();
for (const item of registry.items) {
  for (const file of item.files ?? []) {
    const owners = ownersByTarget.get(file.target) ?? [];
    owners.push(item.name);
    ownersByTarget.set(file.target, owners);
  }
}

const IMPLICIT_CONSUMER_PACKAGES = new Set(["react", "react-dom"]);
/** @param {string} specifier */
const packageOf = (specifier) => {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : (parts[0] ?? specifier);
};
/**
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

/** @type {string[]} */
const metadataErrors = [];
for (const item of registry.items) {
  const ownTargets = new Set((item.files ?? []).map((file) => file.target));
  const declaredSiblings = new Set(item.registryDependencies ?? []);
  const declaredPackages = new Set(item.dependencies ?? []);

  for (const file of item.files ?? []) {
    const source = await readFile(join(ROOT, file.path), "utf8");
    for (const specifier of importSpecifiers(source, file.path)) {
      if (specifier.startsWith(".")) {
        const stem = posix.normalize(posix.join(posix.dirname(file.target), specifier));
        const candidates = [stem, `${stem}.tsx`, `${stem}.ts`, `${stem}/index.tsx`, `${stem}/index.ts`];
        if (candidates.some((candidate) => ownTargets.has(candidate))) continue;

        const owner = candidates
          .flatMap((candidate) => ownersByTarget.get(candidate) ?? [])
          .find((candidate) => candidate !== item.name);
        if (owner === undefined) {
          metadataErrors.push(`${item.name}: ${file.target} imports missing file ${specifier}`);
        } else if (!declaredSiblings.has(owner)) {
          metadataErrors.push(
            `${item.name}: ${file.target} imports ${specifier} from undeclared registry dependency ${owner}`,
          );
        }
        continue;
      }

      if (specifier.startsWith("node:")) continue;
      const dependency = packageOf(specifier);
      if (!IMPLICIT_CONSUMER_PACKAGES.has(dependency) && !declaredPackages.has(dependency)) {
        metadataErrors.push(
          `${item.name}: ${file.target} imports undeclared package dependency ${dependency}`,
        );
      }
    }
  }
}

if (metadataErrors.length > 0) {
  console.error("  smoke: registry dependency metadata is incomplete");
  for (const error of metadataErrors) console.error(`    ${error}`);
  process.exit(1);
}

const dir = await mkdtemp(join(tmpdir(), "lumo-smoke-"));
let failed = false;

try {
  // A consumer project: the copied components, the packaged invariants resolved by path, nothing else.
  await mkdir(join(dir, "components/ui"), { recursive: true });

  for (const item of registry.items) {
    for (const file of item.files ?? []) {
      await cp(join(ROOT, file.path), join(dir, file.target ?? `components/ui/${item.name}.tsx`));
    }
  }

  // Symlinking a real node_modules exercises the resolution a consumer's
  // bundler performs. packages/ui's, not the root's: pnpm hoists nothing, so
  // the root has no `react` at all.
  await symlink(join(ROOT, "packages/ui/node_modules"), join(dir, "node_modules"), "dir");

  /**
   * Two consumers, not one: a bundler (Vite, Next — `moduleResolution: bundler`)
   * and Node ESM (`NodeNext`, which is strict about file extensions and package
   * `exports`). An item that compiles under one and not the other is a
   * distribution defect a single profile would hide.
   */
  const PROFILES = [
    { name: "bundler (Vite / Next)", module: "preserve", moduleResolution: "bundler" },
    { name: "Node ESM (NodeNext)", module: "NodeNext", moduleResolution: "NodeNext" },
  ];
  for (const profile of PROFILES) {
  await writeFile(
    join(dir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2023",
          lib: ["ES2023", "DOM", "DOM.Iterable"],
          module: profile.module,
          moduleResolution: profile.moduleResolution,
          jsx: "react-jsx",
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          allowImportingTsExtensions: true,
          exactOptionalPropertyTypes: true,
          noUncheckedIndexedAccess: true,
          // The workspace packages a consumer installs rather than copies;
          // everything else must resolve from node_modules on its own.
          paths: {
            "@lumo-ui/core": [join(ROOT, "packages/core/src/index.ts")],
            "@lumo-ui/ui": [join(ROOT, "packages/ui/src/index.ts")],
            "@lumo-ui/base-ui-ssr": [join(ROOT, "packages/base-ui-ssr/src/index.ts")],
          },
        },
        include: ["components/**/*"],
      },
      null,
      2,
    ),
  );

  if (profile === PROFILES[0]) {
    console.log(`  smoke: ${registry.items.length} item dependency graph(s) validated`);
    console.log(`  smoke: ${registry.items.length} item payload(s) copied into a bare project`);
  }

  execFileSync(join(ROOT, "node_modules/.bin/tsc"), ["--noEmit", "-p", dir], {
    stdio: "inherit",
    cwd: ROOT,
  });
  console.log(`  smoke: every registry item type-checks outside the workspace — ${profile.name}`);
  }
} catch {
  failed = true;
  console.error(
    "\n  smoke: a registry item does not compile as a consumer receives it.\n" +
      "  Usually a missing entry in `dependencies`, or a relative import to a file\n" +
      "  the consumer never gets. Fix the component or the registry entry, not this script.\n",
  );
} finally {
  await rm(dir, { recursive: true, force: true });
}

process.exit(failed ? 1 : 0);
