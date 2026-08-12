#!/usr/bin/env node
/**
 * The consumer smoke test.
 *
 * Everything else in this repo verifies Lumo against itself. This verifies it
 * against someone else: it first validates every item's declared package and
 * sibling-item closure, then copies the registry payloads into a throwaway
 * consumer project, resolves the imports, and type-checks them.
 *
 * It exists because of a specific failure mode. A component can be perfect
 * inside the workspace — where `@lumo-ui/core` resolves through a workspace link
 * and TypeScript sees the source — and be uninstallable outside it, because the
 * registry entry forgot a dependency or a relative import points at a file the
 * consumer never receives. Nobody notices until the first consumer tries, and by
 * then it has been published.
 *
 * One gate standing between Telarsa and shipping a registry nobody has ever
 * installed from.
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
 * Validate the manifest as a manifest before letting the workspace dependency
 * tree help TypeScript. The compile below deliberately has a real node_modules,
 * so by itself it cannot prove that an item declares the packages and sibling
 * items its source imports. This pass follows the public registry payload:
 * every relative import must either be another file in the same item or name a
 * directly declared registry dependency, and every non-peer package import must
 * appear in `dependencies`.
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
  // A consumer project: the copied components, the packaged invariants resolved
  // by path, and nothing else. If a component needs something not declared in
  // its registry entry, it fails here rather than in someone's repository.
  await mkdir(join(dir, "components/ui"), { recursive: true });

  for (const item of registry.items) {
    for (const file of item.files ?? []) {
      await cp(join(ROOT, file.path), join(dir, file.target ?? `components/ui/${item.name}.tsx`));
    }
  }

  // `@lumo-ui/core` is a real package dependency for a consumer, so it is mapped
  // by path rather than copied — that IS the package/copy-in line under test.
  // A real consumer has node_modules. Symlinking one is more faithful than
  // hand-mapping packages through `paths` — it exercises the same resolution a
  // consumer's bundler performs, so a dependency missing from a registry entry
  // surfaces as the error they would actually see.
  //
  // packages/ui's, not the workspace root's: pnpm keeps the root free of the
  // runtime dependencies and hoists nothing, so the root has no `react` at all.
  // The UI package's tree is the closest thing in this repo to what a consumer
  // installs from the registry's `dependencies`.
  await symlink(join(ROOT, "packages/ui/node_modules"), join(dir, "node_modules"), "dir");

  await writeFile(
    join(dir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2023",
          lib: ["ES2023", "DOM", "DOM.Iterable"],
          module: "preserve",
          moduleResolution: "bundler",
          jsx: "react-jsx",
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          allowImportingTsExtensions: true,
          exactOptionalPropertyTypes: true,
          noUncheckedIndexedAccess: true,
          // The two workspace packages a consumer installs rather than copies.
          // Everything else must resolve from node_modules on its own — that is
          // precisely what this test is checking.
          paths: {
            "@lumo-ui/core": [join(ROOT, "packages/core/src/index.ts")],
            "@lumo-ui/ui": [join(ROOT, "packages/ui/src/index.ts")],
            // The engine-compat layer is the third. It is a package rather than
            // a copied file precisely so that it can be upgraded away when Base
            // UI fixes the defects it works around — which means a consumer
            // resolves it from node_modules, and that resolution is under test
            // here exactly like the other two.
            "@lumo-ui/base-ui-ssr": [join(ROOT, "packages/base-ui-ssr/src/index.ts")],
          },
        },
        include: ["components/**/*"],
      },
      null,
      2,
    ),
  );

  console.log(`  smoke: ${registry.items.length} item dependency graph(s) validated`);
  console.log(`  smoke: ${registry.items.length} item payload(s) copied into a bare project`);

  execFileSync(join(ROOT, "node_modules/.bin/tsc"), ["--noEmit", "-p", dir], {
    stdio: "inherit",
    cwd: ROOT,
  });
  console.log("  smoke: every registry item type-checks outside the workspace");
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
