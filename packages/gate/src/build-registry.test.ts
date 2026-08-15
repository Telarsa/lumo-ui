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

  it("takes a component description from its named export, not an earlier helper", () => {
    const registry = JSON.parse(readFileSync(join(ROOT, "registry.json"), "utf8")) as {
      items: { name: string; description: string }[];
    };
    expect(registry.items.find(({ name }) => name === "treemap-chart")?.description).toBe(
      "A responsive hierarchical area chart; authored rows are never mutated.",
    );
  });

  it("keeps public catalogue counts synchronized with the generated registry", () => {
    const registry = JSON.parse(readFileSync(join(ROOT, "registry.json"), "utf8")) as {
      items: { type: string }[];
    };
    const components = registry.items.filter(({ type }) => type === "registry:ui").length;
    const blocks = registry.items.filter(({ type }) => type === "registry:block").length;
    const total = registry.items.length;
    const fa = (value: number) => new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(value);

    const readme = readFileSync(join(ROOT, "README.md"), "utf8");
    expect(readme).toContain(`packages/ui       ${components} registry components`);
    expect(readme).toContain(
      `**Current state.** ${components} components, ${blocks} blocks and ${total} generated registry items.`,
    );

    const introduction = readFileSync(
      join(ROOT, "apps", "website", "src", "app", "[lang]", "docs", "introduction", "page.tsx"),
      "utf8",
    );
    expect(introduction).toContain(
      `Today the tree holds ${components} components, ${blocks} whole-screen blocks and ${total} registry items`,
    );
    expect(introduction).toContain(
      `امروز ${fa(components)} کامپوننت، ${fa(blocks)} بلوکِ تمام‌صفحه و ${fa(total)} آیتم رجیستری`,
    );

    const cli = readFileSync(
      join(ROOT, "apps", "website", "src", "app", "[lang]", "docs", "cli", "page.tsx"),
      "utf8",
    );
    expect(cli).toContain(`<Term>registry.json</Term> — ${total} items today`);
    expect(cli).toContain(`<Term>registry.json</Term> — امروز ${fa(total)} آیتم`);
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
