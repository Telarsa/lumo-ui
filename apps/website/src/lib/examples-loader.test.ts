import { describe, expect, it } from "vitest";
import {
  assertKnownParts,
  compositionTags,
  extractExampleSource,
  parseExportedNames,
} from "@/examples/_system/extract";
import { exampleSlugs, loadExamplesFor, newExampleSlugs } from "./examples-loader";

/**
 * The example system's contract, exercised from both ends: the pure text
 * mechanics against synthetic files (every documented failure mode observed
 * actually failing — a rule that has never been seen failing is decoration,
 * per CONTRIBUTING.md), and the real loader against the real example files on
 * disk, so a sibling's new examples file is validated by this suite the moment
 * it exists.
 */

const FILE = "sample.tsx";

function sampleFile(): string {
  return [
    `function AlphaExample(l) {`,
    `  return { locale: l };`,
    `}`,
    ``,
    `function BetaExample(l) {`,
    `  return [l];`,
    `}`,
    ``,
    `export const EXAMPLES = {`,
    `  meta: {},`,
    `  examples: [`,
    `    {`,
    `      id: "alpha",`,
    `      render: AlphaExample,`,
    `    },`,
    `    {`,
    `      id: "beta",`,
    `      render: BetaExample,`,
    `    },`,
    `  ],`,
    `};`,
  ].join("\n");
}

describe("extractExampleSource", () => {
  it("slices exactly the named render function's declaration", () => {
    const source = extractExampleSource(sampleFile(), FILE, "alpha");
    expect(source).toBe("function AlphaExample(l) {\n  return { locale: l };\n}");
  });

  it("binds render to its own entry, not the neighbour's", () => {
    const source = extractExampleSource(sampleFile(), FILE, "beta");
    expect(source).toContain("BetaExample");
    expect(source).not.toContain("Alpha");
  });

  it("fails loudly when the id literal is absent", () => {
    expect(() => extractExampleSource(sampleFile(), FILE, "gamma")).toThrow(
      /"gamma".*does not appear/s,
    );
  });

  it("fails loudly on a duplicated id literal", () => {
    const text = sampleFile().replace(`id: "beta"`, `id: "alpha"`);
    expect(() => extractExampleSource(text, FILE, "alpha")).toThrow(/more than once/);
  });

  it("rejects a BARE inline arrow — its end is ambiguous to the slicer", () => {
    // Round-3 review: commas inside generics/comparisons are invisible to the
    // bracket counter, so a bare arrow could ship silently truncated source.
    const text = sampleFile().replace("render: AlphaExample", "render: (l) => null");
    expect(() => extractExampleSource(text, FILE, "alpha")).toThrow(/parentheses/);
  });

  it("slices a PARENTHESIZED inline arrow verbatim — the wrapper is the bracket", () => {
    const text = sampleFile().replace("render: AlphaExample", "render: ((l) => null)");
    expect(extractExampleSource(text, FILE, "alpha")).toBe("((l) => null)");
  });

  it("fails loudly on a render with no value", () => {
    const text = sampleFile().replace("render: AlphaExample,", "render: ,");
    expect(() => extractExampleSource(text, FILE, "alpha")).toThrow(/no value/);
  });

  it("fails loudly when the named function is not declared", () => {
    const text = sampleFile().replace("function AlphaExample", "function Renamed");
    expect(() => extractExampleSource(text, FILE, "alpha")).toThrow(
      /no top-level "function AlphaExample\("/,
    );
  });

  it("fails loudly when braces never balance", () => {
    const text = sampleFile().replace(`return { locale: l };`, `return "{";`);
    expect(() => extractExampleSource(text, FILE, "alpha")).toThrow(/never balance/);
  });
});

describe("parseExportedNames", () => {
  const index = [
    `export { Button, IconButton } from "./button.tsx";`,
    `export type { ButtonProps, IconButtonProps } from "./button.tsx";`,
    `export {`,
    `  Select,`,
    `  SelectItem,`,
    `  selectVariants,`,
    `} from "./select.tsx";`,
  ].join("\n");

  it("collects value exports per module and overall", () => {
    const parsed = parseExportedNames(index);
    expect(parsed.all.has("Button")).toBe(true);
    expect(parsed.all.has("SelectItem")).toBe(true);
    expect(parsed.byModule.get("button.tsx")).toEqual(["Button", "IconButton"]);
    expect(parsed.byModule.get("select.tsx")).toContain("Select");
  });

  it("ignores type-only export blocks", () => {
    const parsed = parseExportedNames(index);
    expect(parsed.all.has("ButtonProps")).toBe(false);
  });
});

describe("composition validation", () => {
  it("reads every capitalised tag once", () => {
    const tags = compositionTags("<Select>\n  <SelectItem />\n  <SelectItem />\n</Select>");
    expect(tags).toEqual(["Select", "SelectItem"]);
  });

  it("fails loudly on a part the library does not export", () => {
    expect(() =>
      assertKnownParts(["Select", "SelectGhost"], new Set(["Select"]), FILE, "meta.composition"),
    ).toThrow(/"SelectGhost".*exports no such part/s);
  });
});

describe("the real example files on disk", () => {
  const FLAGSHIPS = [
    "button",
    "checkbox",
    "command",
    "dialog",
    "menu",
    "select",
    "switch",
    "table",
    "tabs",
    "text-field",
  ];

  it("discovers the flagship files by existence", () => {
    const slugs = exampleSlugs();
    for (const slug of FLAGSHIPS) expect(slugs).toContain(slug);
  });

  it("loads and fully validates every flagship file", async () => {
    // The loader THROWS on any contract violation, so this test failing red
    // is the local, fast version of the build failing. It walks the FLAGSHIP
    // files rather than the whole directory on purpose: full validation
    // includes cross-file state (composition parts against index.ts exports)
    // that for a sibling's in-flight component is the integrator's merge to
    // complete — their file is still validated, by their own page, at build.
    for (const slug of FLAGSHIPS) {
      const loaded = await loadExamplesFor(slug);
      expect(loaded, slug).toBeDefined();
      if (loaded === undefined) continue;
      expect(loaded.examples.length, slug).toBeGreaterThanOrEqual(4);
      for (const example of loaded.examples) {
        // The flagships all use the canonical shape: a named function whose
        // whole declaration is the shown source.
        expect(example.source.startsWith("function ")).toBe(true);
        expect(example.source.endsWith("}")).toBe(true);
      }
    }
    /*
     * ── WHY THESE TWO CARRY AN EXPLICIT TIMEOUT ─────────────────────────────
     *
     * Both reach the loader's DYNAMIC IMPORT, whose specifier keeps a static
     * prefix and extension so a bundler turns it into a directory context —
     * and a directory context is compiled as a whole. The examples directory
     * went from 32 files to 81 when coverage was closed, so the first `await`
     * in this file now pays for transforming every example module on disk, not
     * just the flagships it names.
     *
     * That is a property of the fixture growing, not of anything being slow:
     * the work is real, it is one-time per run, and the build does the same.
     * Vitest's 5s default was sized for the 32-file directory. Raising it here
     * rather than globally keeps the default tight for every other test, so a
     * genuinely slow unit test still shows up as one.
     */
  }, 60_000);

  it(
    "exposes isNew to the sidebar",
    async () => {
      const flagged = await newExampleSlugs();
      expect(flagged.has("command")).toBe(true);
      expect(flagged.has("button")).toBe(false);
    },
    60_000,
  );
});
