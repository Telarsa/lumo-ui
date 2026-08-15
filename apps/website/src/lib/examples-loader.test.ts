import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertKnownParts,
  compositionTags,
  extractExampleSource,
  parseExportedNames,
} from "@/examples/_system/extract";
import { exampleSlugs, loadExamplesFor, newExampleSlugs, sourceOf } from "./examples-loader";

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

  /*
   * ── THE PARSER'S BLIND SPOT, PINNED RATHER THAN PATCHED ───────────────────
   *
   * `parseExportedNames` matches `export { … } from "./module"` and nothing
   * else. That is a deliberate and reasonable limit — the barrel is a flat
   * re-export file — but it is a limit the whole parts system rests on, and it
   * was silent: an `export *` in the barrel would have produced an empty parts
   * list for that component's page, and the page would have rendered as though
   * the component simply had no parts.
   *
   * `examples-loader.ts` now throws on the empty case. This is the other half:
   * it asserts the ASSUMPTION, so the blind spot cannot open underneath it. The
   * check is against the REAL barrel, not a fixture, because a fixture would
   * only prove the regex works on text chosen to make it work.
   *
   * If this ever fails, the fix is a decision, not a patch: either keep the
   * barrel flat, or teach the parser the new form. Both are fine; silently
   * having neither is not.
   */
  it("the real barrel uses only the form this parser can read", () => {
    const source = readFileSync(
      join(process.cwd(), "..", "..", "packages", "ui", "src", "index.ts"),
      "utf8",
    );
    // `export * from "./x"` — re-exports names this parser cannot enumerate
    // without reading the target module.
    expect(source.match(/^export \*.*$/gm) ?? []).toEqual([]);
    // `export const Foo = …` directly in the barrel — a value that belongs to
    // no module key, so `byModule` could never carry it.
    expect(source.match(/^export (?:const|function|class) \w+/gm) ?? []).toEqual([]);
  });

  it("every component page's module is actually in the barrel", () => {
    /*
     * The invariant `examples-loader.ts` now enforces per page, asserted once
     * here so a break is reported as one failure naming every offender rather
     * than as whichever page happened to build first.
     */
    const parsed = parseExportedNames(
      readFileSync(join(process.cwd(), "..", "..", "packages", "ui", "src", "index.ts"), "utf8"),
    );
    // The same resolution the loader does: `meta.sourceFile` when the file
    // names one (icon-button documents button.tsx), else `<slug>.tsx`.
    const moduleOf = (slug: string) => {
      const path = sourceOf(slug);
      const text = path === undefined ? "" : readFileSync(path, "utf8");
      return /sourceFile:\s*"([^"]+)"/.exec(text)?.[1] ?? `${slug}.tsx`;
    };
    const missing = exampleSlugs().filter(
      (slug) => sourceOf(slug) !== undefined && !parsed.byModule.has(moduleOf(slug)),
    );
    expect(missing).toEqual([]);
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
      expect(loaded.api.length, `${slug} has no generated prop reference`).toBeGreaterThan(0);
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

  it("derives required and optional Select props from the exported type", async () => {
    const loaded = await loadExamplesFor("select");
    const select = loaded?.api.find((group) => group.name === "SelectProps");
    expect(select?.props.find((prop) => prop.name === "placeholder")?.required).toBe(true);
    expect(select?.props.find((prop) => prop.name === "validate")?.required).toBe(false);
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
