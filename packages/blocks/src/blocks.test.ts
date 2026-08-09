import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const SRC = import.meta.dirname;

const blockFiles = readdirSync(SRC).filter(
  (f: string) => f.endsWith(".tsx") && !f.includes(".test."),
);

const barrel = readFileSync(`${SRC}/index.ts`, "utf8");

/**
 * The blocks contract.
 *
 * A block is a whole screen, which makes it the layer where hardcoding a
 * heading is most tempting and least visible — nobody reviews a marketing hero
 * for language policy. So the rule that every component states per control is
 * restated here at screen scale, and checked mechanically rather than trusted.
 */
describe("blocks — every block is wired", () => {
  it("has blocks at all (guards a vacuous pass)", () => {
    expect(blockFiles.length).toBeGreaterThan(10);
  });

  it.each(blockFiles.map((f) => [f] as const))("%s is exported", (file) => {
    expect(barrel).toContain(`"./${file}"`);
  });

  it.each(blockFiles.map((f) => [f] as const))("%s takes its text as props", (file) => {
    const source = readFileSync(`${SRC}/${file}`, "utf8");
    // Every block must declare a Strings interface — that is what makes a
    // missing string a compile error instead of an English word in production.
    expect(
      /interface\s+\w*Strings\b/.test(source) || /strings:\s*\w+Strings/.test(source),
      `${file} has no Strings interface — its text is not caller-supplied`,
    ).toBe(true);
  });
});

describe("blocks — no user-facing English", () => {
  it.each(blockFiles.map((f) => [f] as const))("%s hardcodes no visible English", (file) => {
    const source = readFileSync(`${SRC}/${file}`, "utf8");
    // Comments legitimately quote English while explaining the rule, so they are
    // stripped before matching — a check that fires on its own documentation
    // gets disabled, and a disabled check is worse than none.
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");

    const literals = [
      // JSX text: >Sign in<
      /*[^{<>]*/ />[ \t]*[A-Z][a-z]{2,}(?:[ \t]+[A-Za-z]{2,})*[ \t]*</g,
      // an English default for a string prop
      /\b\w*(?:[Ll]abel|[Tt]itle|[Tt]ext|[Pp]laceholder)\s*=\s*"[A-Za-z][^"]{2,}"/g,
    ];

    const found: string[] = [];
    for (const re of literals) for (const m of code.matchAll(re)) found.push(m[0].trim());

    expect(found, `${file} contains user-facing English`).toEqual([]);
  });
});
