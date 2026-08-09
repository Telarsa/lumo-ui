#!/usr/bin/env node
/**
 * The consumer smoke test.
 *
 * Everything else in this repo verifies Lumo against itself. This verifies it
 * against someone else: it copies each registry item into a throwaway project
 * exactly as `shadcn add` would, resolves the imports, and type-checks.
 *
 * It exists because of a specific failure mode. A component can be perfect
 * inside the workspace — where `@lumo-ui/core` resolves through a workspace link
 * and TypeScript sees the source — and be uninstallable outside it, because the
 * registry entry forgot a dependency or a relative import points at a file the
 * consumer never receives. Nobody notices until the first consumer tries, and by
 * then it has been published.
 *
 * Two minutes of CI standing between Telarsa and shipping a registry nobody has
 * ever installed from.
 */

import { mkdtemp, readFile, writeFile, mkdir, cp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = new URL("..", import.meta.url).pathname;

const registry = JSON.parse(await readFile(join(ROOT, "registry.json"), "utf8"));
if (!registry.items?.length) {
  console.error("  smoke: registry has no items — refusing to report success");
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
          baseUrl: ".",
          paths: {
            "@lumo-ui/core": [join(ROOT, "packages/core/src/index.ts")],
            "react-aria-components": [join(ROOT, "node_modules/react-aria-components")],
            "react": [join(ROOT, "node_modules/react")],
          },
          typeRoots: [join(ROOT, "node_modules/@types")],
        },
        include: ["components/**/*"],
      },
      null,
      2,
    ),
  );

  console.log(`  smoke: ${registry.items.length} item(s) copied into a bare project`);

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
