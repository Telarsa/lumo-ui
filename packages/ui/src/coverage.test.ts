import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const SRC = import.meta.dirname;

const componentFiles = readdirSync(SRC).filter(
  (f: string) => f.endsWith(".tsx") && !f.includes(".test.") && !f.includes(".type-test."),
);

const barrel = readFileSync(`${SRC}/index.ts`, "utf8");

/**
 * The completeness gate.
 *
 * Every other test in this package checks a component that someone remembered
 * to write a test for. This one checks the components nobody remembered — it
 * enumerates the filesystem rather than an import list, so a component added
 * without an export, or without its announced strings typed as required, turns
 * the suite red instead of shipping unnoticed.
 *
 * That distinction is the whole reason it exists. A prototype shipped 33
 * unnamed controls and 77 Latin-digit calendar cells; every one of those files
 * would have passed a suite that only tested what it imported.
 */
describe("coverage — every component is wired", () => {
  it("has components at all (guards against a vacuous pass)", () => {
    // If a refactor moved the directory, every assertion below would iterate an
    // empty list and report green. Assert the corpus is non-trivial first.
    expect(componentFiles.length).toBeGreaterThan(20);
  });

  it.each(componentFiles.map((f) => [f] as const))("%s is exported from the barrel", (file) => {
    expect(barrel).toContain(`"./${file}"`);
  });

  it.each(componentFiles.map((f) => [f] as const))("%s declares \"use client\" or explains why not", (file) => {
    const source = readFileSync(`${SRC}/${file}`, "utf8");
    const isClient = source.trimStart().startsWith('"use client"');
    if (isClient) return;
    // A server-renderable component is a deliberate win — it costs the consumer
    // no hydration. But it must be a decision, not an omission, so the file has
    // to say so. Importing RAC and forgetting the directive is a runtime error
    // in a consumer's app, discovered by them rather than by us.
    expect(
      /server|no client|without javascript|presentational/i.test(source),
      `${file} has no "use client" and no comment explaining why it is server-renderable`,
    ).toBe(true);
    expect(
      source.includes('from "react-aria-components"'),
      `${file} imports react-aria-components but has no "use client"`,
    ).toBe(false);
  });
});

describe("coverage — no user-facing English in the library", () => {
  /**
   * Rule 3, checked mechanically.
   *
   * A default like `label = "Close"` is exactly the thing that looks harmless in
   * review and ships an English word into a Persian product. The library ships
   * no user-facing English at all — a consumer passes every announced string, or
   * it does not compile.
   */
  it.each(componentFiles.map((f) => [f] as const))("%s has no English default for an announced string", (file) => {
    const source = readFileSync(`${SRC}/${file}`, "utf8");
    // Strip comments — they legitimately quote English strings when explaining
    // which React Aria default they replace.
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");

    const defaults = [
      // `label = "Close"` in a destructuring default
      /\b(label|title|description|placeholder|[a-zA-Z]*Label)\s*=\s*"[A-Za-z][^"]{2,}"/g,
      // aria-* set to a literal English string
      /aria-(label|roledescription|valuetext|description)\s*=\s*"[A-Za-z][^"]{2,}"/g,
    ];

    const found: string[] = [];
    for (const re of defaults) {
      for (const m of code.matchAll(re)) found.push(m[0]);
    }
    expect(found, `${file} hardcodes user-facing English`).toEqual([]);
  });
});
