import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..", "..", "..");

describe("generated API reference gate", () => {
  it("runs as part of the repository verification contract", () => {
    const rootPackage = JSON.parse(
      readFileSync(join(ROOT, "package.json"), "utf8"),
    ) as { scripts?: Record<string, string> };

    expect(rootPackage.scripts?.["gate:api"]).toBe(
      "node scripts/build-api-reference.mjs --check",
    );
    expect(rootPackage.scripts?.["build:api"]).toBe(
      "node scripts/build-api-reference.mjs",
    );
    expect(rootPackage.scripts?.verify).toContain("pnpm run gate:api");
  });

  it("rejects stale output and accepts only checker-generated content", () => {
    const dir = mkdtempSync(join(tmpdir(), "lumo-api-fixture-"));
    try {
      const output = join(dir, "api-reference.json");
      writeFileSync(output, "{}\n");

      const stale = spawnSync(
        process.execPath,
        [join(ROOT, "scripts", "build-api-reference.mjs"), "--check", "--api", output],
        { cwd: ROOT, encoding: "utf8" },
      );
      expect(stale.status, `${stale.stdout}\n${stale.stderr}`).not.toBe(0);
      expect(stale.stderr).toContain("stale");

      const write = spawnSync(
        process.execPath,
        [join(ROOT, "scripts", "build-api-reference.mjs"), "--api", output],
        { cwd: ROOT, encoding: "utf8" },
      );
      expect(write.status, `${write.stdout}\n${write.stderr}`).toBe(0);

      const fresh = spawnSync(
        process.execPath,
        [join(ROOT, "scripts", "build-api-reference.mjs"), "--check", "--api", output],
        { cwd: ROOT, encoding: "utf8" },
      );
      expect(fresh.status, `${fresh.stdout}\n${fresh.stderr}`).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  // This poison fixture intentionally runs the full checker three times: stale,
  // generated, then fresh. A cold TypeScript program can take ~25 seconds per
  // pass on CI or a busy review workspace, so the repository's former 60-second
  // ceiling timed out before the third assertion while every child process was
  // still healthy. Keep enough headroom for the behavior test to finish; a
  // performance budget belongs on one measured generator run, not on three
  // correctness runs sharing a wall-clock timeout.
  }, 120_000);
});
