import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..", "..", "..");

describe("consumer smoke uses each item's declared dependency closure", () => {
  it("rejects an item whose sibling registry dependencies are missing", () => {
    const dir = mkdtempSync(join(tmpdir(), "lumo-smoke-fixture-"));
    try {
      const registry = JSON.parse(readFileSync(join(ROOT, "registry.json"), "utf8")) as {
        items: Array<{ name: string; registryDependencies?: string[] }>;
      };
      const attachment = registry.items.find((item) => item.name === "attachment");
      if (attachment === undefined) throw new Error("attachment registry fixture is missing");
      attachment.registryDependencies = [];

      const fixture = join(dir, "registry.json");
      writeFileSync(fixture, `${JSON.stringify(registry, null, 2)}\n`);

      const result = spawnSync(
        process.execPath,
        [join(ROOT, "scripts", "smoke-consumer.mjs"), "--registry", fixture],
        { cwd: ROOT, encoding: "utf8" },
      );

      expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
      expect(result.stderr).toContain("attachment");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 30_000);

  it("rejects an item whose external package dependency is missing", () => {
    const dir = mkdtempSync(join(tmpdir(), "lumo-smoke-fixture-"));
    try {
      const registry = JSON.parse(readFileSync(join(ROOT, "registry.json"), "utf8")) as {
        items: Array<{ name: string; dependencies?: string[] }>;
      };
      const attachment = registry.items.find((item) => item.name === "attachment");
      if (attachment === undefined) throw new Error("attachment registry fixture is missing");
      attachment.dependencies = (attachment.dependencies ?? []).filter(
        (dependency) => dependency !== "class-variance-authority",
      );

      const fixture = join(dir, "registry.json");
      writeFileSync(fixture, `${JSON.stringify(registry, null, 2)}\n`);
      const result = spawnSync(
        process.execPath,
        [join(ROOT, "scripts", "smoke-consumer.mjs"), "--registry", fixture],
        { cwd: ROOT, encoding: "utf8" },
      );

      expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
      expect(result.stderr).toContain("attachment");
      expect(result.stderr).toContain("class-variance-authority");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 30_000);
});
