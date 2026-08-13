import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..", "..", "..");

describe("registry freshness gate", () => {
  it("publishes complete, non-empty registry descriptions", () => {
    const registry = JSON.parse(readFileSync(join(ROOT, "registry.json"), "utf8")) as {
      items: { name: string; description: string }[];
    };
    const incomplete = registry.items.filter(
      ({ description }) => description.length === 0 || !/[.!?…):`\]»]$/.test(description),
    );
    expect(incomplete.map(({ name }) => name)).toEqual([]);
  });

  it("checks generated content against the requested file without relying on git state", () => {
    const dir = mkdtempSync(join(tmpdir(), "lumo-registry-fixture-"));
    try {
      const output = join(dir, "registry.json");
      writeFileSync(output, "{}\n");

      const stale = spawnSync(
        process.execPath,
        [join(ROOT, "scripts", "build-registry.mjs"), "--check", "--registry", output],
        { cwd: ROOT, encoding: "utf8" },
      );
      expect(stale.status, `${stale.stdout}\n${stale.stderr}`).not.toBe(0);
      expect(stale.stderr).toContain("stale");

      const write = spawnSync(
        process.execPath,
        [join(ROOT, "scripts", "build-registry.mjs"), "--registry", output],
        { cwd: ROOT, encoding: "utf8" },
      );
      expect(write.status, `${write.stdout}\n${write.stderr}`).toBe(0);

      const fresh = spawnSync(
        process.execPath,
        [join(ROOT, "scripts", "build-registry.mjs"), "--check", "--registry", output],
        { cwd: ROOT, encoding: "utf8" },
      );
      expect(fresh.status, `${fresh.stdout}\n${fresh.stderr}`).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 30_000);
});
