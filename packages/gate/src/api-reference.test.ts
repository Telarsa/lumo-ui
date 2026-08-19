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
    // CI runs the CONTRACT, not a transcribed subset (19 Aug: six gates had
    // drifted out of the hand-copied list). gate:api is in CI because verify
    // is — the line above proves gate:api is in verify.
    expect(workflow).toContain("run: pnpm run verify");
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

  it("exposes no React Aria link/press/hover compatibility names on Tab", () => {
    /*
     * These were `?: undefined` compatibility carriers until 15 Aug 2026,
     * when the RAC-shaped surface was removed outright: a `<Tab>` renders a
     * `<button>`, so link attributes had no destination (one — `hrefLang` —
     * was proved LEAKING into served bytes), and the press/hover callbacks
     * had no engine event to bind to. Absent is stronger than unrepresentable:
     * the names are neither declared nor generated. Compile-time rejection is
     * pinned by `packages/ui/src/tabs.type-test.tsx`.
     */
    const api = JSON.parse(readFileSync(join(ROOT, "api-reference.json"), "utf8")) as {
      modules: Record<string, { name: string; props: { name: string }[] }[]>;
    };
    const tabProps = api.modules["tabs.tsx"]?.find((group) => group.name === "TabProps");
    expect(tabProps, "TabProps must be in the generated reference").toBeTruthy();
    for (const name of [
      "href", "hrefLang", "target", "rel", "download", "ping", "referrerPolicy", "routerOptions",
      "onPress", "onPressStart", "onPressEnd", "onPressChange", "onPressUp",
      "onHoverStart", "onHoverEnd", "onHoverChange", "onFocusChange", "slot",
    ]) {
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
