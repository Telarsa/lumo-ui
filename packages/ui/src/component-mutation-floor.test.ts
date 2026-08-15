/**
 * Anchor drift guard for the component mutation campaign.
 *
 * `scripts/mutate-components.mjs` rewrites one anchor per module — JSX
 * `className` assignments for visual modules, a behavior-specific anchor for
 * the two honest non-visual modules — and grades each mutant with
 * `vitest related`, so only tests that import the module can kill it. This
 * suite is NOT the kill oracle: it reads source text with `fs`, so counting
 * its failures as kills would be circular (an earlier version of the campaign
 * did exactly that). Its only job is to fail loudly when a module loses its
 * anchor, which would silently shrink the campaign's reach.
 *
 * The catalogue size is derived from registry.json rather than hardcoded: a
 * hardcoded count rotted once already (99 against a directory of 111), and
 * the real invariant is directory ↔ registry agreement.
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sourceDirectory = dirname(fileURLToPath(import.meta.url));
const componentFiles = readdirSync(sourceDirectory)
  .filter((file) => file.endsWith(".tsx") && !file.endsWith(".test.tsx") && !file.endsWith(".type-test.tsx"))
  .sort();

const registry = JSON.parse(
  readFileSync(join(sourceDirectory, "../../../registry.json"), "utf8"),
) as { items: Array<{ type: string }> };
const declaredModules = registry.items.filter(
  (item) => item.type === "registry:ui",
).length;

const behaviorAnchors: Readonly<Record<string, string>> = {
  "form-state.tsx": "event.preventDefault();",
  "provider.tsx": "<DirectionProvider direction={direction(locale)}>",
};

describe("the systematic component mutation floor", () => {
  it("matches the registry-declared catalogue", () => {
    expect(componentFiles).toHaveLength(declaredModules);
  });

  it.each(componentFiles)("%s preserves its campaign anchor", (file) => {
    const source = readFileSync(join(sourceDirectory, file), "utf8");
    const anchor = behaviorAnchors[file] ?? "className=";
    expect(
      source.includes(anchor),
      `${file} lost its mutation anchor ${JSON.stringify(anchor)}`,
    ).toBe(true);
  });
});
