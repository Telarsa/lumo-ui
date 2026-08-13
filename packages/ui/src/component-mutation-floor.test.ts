/**
 * Breadth floor for the 99-module mutation campaign.
 *
 * Ninety-seven implementation modules render styled DOM and therefore contain
 * JSX `className` assignments. Removing those assignments from one module is an
 * observable visual mutation: the affected part loses its component styling.
 * The two honest non-visual modules have behavior-specific anchors instead:
 * FormState owns submit cancellation, and Provider derives Base UI direction
 * from locale. The campaign rewrites one anchor at a time and requires this
 * suite to name and kill every mutant.
 *
 * This is a floor, not a mutation score. It proves one comparable mutation per
 * module; deeper component tests remain responsible for state and interaction.
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sourceDirectory = dirname(fileURLToPath(import.meta.url));
const componentFiles = readdirSync(sourceDirectory)
  .filter((file) => file.endsWith(".tsx") && !file.endsWith(".test.tsx"))
  .sort();

const behaviorAnchors: Readonly<Record<string, string>> = {
  "form-state.tsx": "event.preventDefault();",
  "provider.tsx": "<DirectionProvider direction={direction(locale)}>",
};

describe("the systematic component mutation floor", () => {
  it("grades the declared 99-module catalogue", () => {
    expect(componentFiles).toHaveLength(99);
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
