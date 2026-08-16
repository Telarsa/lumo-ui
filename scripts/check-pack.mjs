#!/usr/bin/env node
/**
 * The `lumo-ui` dev dependency reaches a consumer as a git dependency, packed
 * by its `files` allow-list. This packs the root to a scratch directory and
 * checks that everything the `lumo` CLI imports or reads at runtime is inside —
 * found necessary when 0.1.2's first install lacked scripts/lib (16 Aug 2026).
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const REQUIRED = [
  "package/scripts/lumo-cli.mjs",
  "package/scripts/lib/consumer-copy.mjs",
  "package/packages/gate/dist/cli.js",
  "package/packages/gate/dist/index.js",
  "package/packages/gate/dist/rules.js",
  "package/packages/ui/src/index.ts",
  "package/packages/native/src/index.ts",
  "package/packages/native/package.json",
  "package/packages/core/package.json",
  "package/registry.json",
  "package/catalog.json",
  "package/api-reference.json",
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
  console.log(`  pack: ${entries.size - 1} file(s); every CLI runtime file present`);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
