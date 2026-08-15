import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..", "..", "..");
const read = (...parts: string[]) => readFileSync(join(ROOT, ...parts), "utf8");

describe("current public documentation", () => {
  it("describes the React/Base UI architecture rather than the superseded Preact scaffold", () => {
    const architecture = read("ARCHITECTURE.md");
    expect(architecture).toContain("React 19");
    expect(architecture).toContain("Base UI");
    expect(architecture).toContain("111 registry components");
    expect(architecture).not.toContain("core uses nothing but Preact");
    expect(architecture).not.toContain("Everything else is scaffolding");
  });

  it("does not present the retired React Aria engine or unfinished date family as current", () => {
    const introduction = read(
      "apps",
      "website",
      "src",
      "app",
      "[lang]",
      "docs",
      "introduction",
      "page.tsx",
    );
    expect(introduction).toContain("Behaviour is rented from <Term>Base UI</Term>");
    expect(introduction).not.toContain(
      "Behaviour is rented from <Term>React Aria Components</Term>",
    );
    expect(introduction).not.toContain("is still open, scheduled as v0.7");

    const installation = read(
      "apps",
      "website",
      "src",
      "app",
      "[lang]",
      "docs",
      "installation",
      "page.tsx",
    );
    expect(installation).toContain("Base UI&rsquo;s direction context defaults");
    expect(installation).not.toContain("React Aria resolves its locale");

    const cli = read("apps", "website", "src", "app", "[lang]", "docs", "cli", "page.tsx");
    expect(cli).toContain("<Term>base-vega</Term>");
    expect(cli).not.toContain("<Term>aria-vega</Term>");
  });

  it("stamps chart evidence with the installed TanStack Charts version", () => {
    const workspace = read("pnpm-workspace.yaml");
    const installed = /'@tanstack\/charts':\s*([^\s#]+)/.exec(workspace)?.[1];
    expect(installed).toBeTruthy();
    for (const file of ["chart.tsx", "chart.variants.ts"]) {
      const source = read("packages", "ui", "src", file);
      expect(source, file).toContain(`@tanstack/charts\` ${installed}`);
      expect(source, file).not.toContain("@tanstack/charts` 0.9.0");
    }
  });
});
