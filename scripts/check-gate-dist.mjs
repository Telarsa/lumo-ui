#!/usr/bin/env node
/**
 * packages/gate/dist is a COMMITTED build: `lumo gate` runs it from a consumer's
 * node_modules, where Node refuses to strip TypeScript types. This rebuilds it
 * to a scratch directory and fails when the committed copy differs — the same
 * shape as `gate:catalog`. Run `pnpm run build:gate` to refresh.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const scratch = mkdtempSync(join(tmpdir(), "lumo-gate-dist-"));
try {
  // node + the workspace's tsc directly (not `pnpm exec`, which may re-run install).
  execFileSync(process.execPath, [join(ROOT, "node_modules/typescript/bin/tsc"), "-p", "packages/gate/tsconfig.dist.json", "--outDir", scratch], { cwd: ROOT, stdio: "inherit" });
  const committed = join(ROOT, "packages/gate/dist");
  const files = readdirSync(scratch).sort();
  const stale = files.filter((f) => {
    try { return readFileSync(join(committed, f), "utf8") !== readFileSync(join(scratch, f), "utf8"); } catch { return true; }
  });
  if (stale.length) {
    console.error(`  gate:dist: packages/gate/dist is stale (${stale.join(", ")}); run pnpm run build:gate`);
    process.exit(1);
  }
  console.log(`  gate:dist: ${files.length} file(s) fresh`);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
