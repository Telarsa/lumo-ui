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

    const workflow = readFileSync(join(ROOT, ".github", "workflows", "ci.yml"), "utf8");
    expect(workflow).toContain("run: pnpm run gate:api");
  });

  it("runs the component mutation campaign in its own CI job", () => {
    const workflow = readFileSync(join(ROOT, ".github", "workflows", "ci.yml"), "utf8");
    expect(workflow).toMatch(/\n  mutation:\n/);
    expect(workflow).toContain("run: pnpm run mutation:components");
    expect(workflow.indexOf("\n  mutation:\n")).toBeLessThan(
      workflow.indexOf("run: pnpm run mutation:components"),
    );
  });

  it("publishes source documentation for every generated prop", () => {
    const api = JSON.parse(readFileSync(join(ROOT, "api-reference.json"), "utf8")) as {
      modules: Record<string, { name: string; props: { name: string; description?: string }[] }[]>;
    };
    const undocumented = Object.entries(api.modules).flatMap(([moduleName, groups]) =>
      groups.flatMap((group) =>
        group.props
          .filter((prop) => prop.description === undefined || prop.description.length === 0)
          .map((prop) => `${moduleName}:${group.name}.${prop.name}`),
      ),
    );
    expect(undocumented).toEqual([]);
  });

  it("makes unsupported Tab compatibility props unrepresentable and documents why", () => {
    const api = JSON.parse(readFileSync(join(ROOT, "api-reference.json"), "utf8")) as {
      modules: Record<string, { name: string; props: { name: string; type: string; description: string }[] }[]>;
    };
    const tabProps = api.modules["tabs.tsx"]?.find((group) => group.name === "TabProps");
    const source = readFileSync(join(ROOT, "packages", "ui", "src", "tabs.tsx"), "utf8");
    const unreachable = [
      "href",
      "target",
      "rel",
      "download",
      "ping",
      "referrerPolicy",
      "routerOptions",
      "onPress",
      "onPressStart",
      "onPressEnd",
      "onPressChange",
      "onPressUp",
      "onHoverStart",
      "onHoverEnd",
      "onHoverChange",
      "onFocusChange",
      "style",
    ];
    for (const name of unreachable) {
      expect(source, name).toMatch(
        new RegExp(`UNREPRESENTABLE COMPATIBILITY CARRIER:[^\\n]*\\n  ${name}\\?: undefined;`),
      );
      expect(tabProps?.props.some((candidate) => candidate.name === name), name).toBe(false);
    }
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
