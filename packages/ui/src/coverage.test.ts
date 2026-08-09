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

describe("coverage — no server module calls a cva that lives on the client", () => {
  /**
   * A `cva()` exported from a `"use client"` module is a client reference in the
   * RSC graph, and a server component that CALLS it fails at build time:
   *
   *   Attempted to call buttonVariants() from the server but buttonVariants is
   *   on the client.
   *
   * That is not hypothetical — it broke the whole `/fa-IR/blocks` route.
   * `hero.tsx` and `pricing-table.tsx` are server-rendered on purpose, so their
   * marketing copy lands in the first byte, and they styled their links with
   * `buttonVariants()`.
   *
   * The rule checks the DEPENDENCY, not the mere existence of a client-side
   * cva: a variant only needs its own directive-free module if something on the
   * server actually reaches for it. Flagging all twenty would be twenty files of
   * churn for a problem one of them had, and a rule that cries wolf gets
   * suppressed.
   */
  const isClient = (file: string) =>
    readFileSync(`${SRC}/${file}`, "utf8").trimStart().startsWith('"use client"');

  /** Variant names exported from each client module. */
  const clientVariants = new Map<string, string>();
  for (const file of componentFiles.filter(isClient)) {
    const source = readFileSync(`${SRC}/${file}`, "utf8");
    for (const m of source.matchAll(/export const (\w+) = cva\(/g)) {
      clientVariants.set(m[1]!, file);
    }
  }

  const serverFiles = componentFiles.filter((f) => !isClient(f));

  it("there are both server and client modules to compare", () => {
    expect(serverFiles.length).toBeGreaterThan(0);
    expect(clientVariants.size).toBeGreaterThan(0);
  });

  it.each(serverFiles.map((f) => [f] as const))(
    "%s does not import a variant defined on the client",
    (file) => {
      const source = readFileSync(`${SRC}/${file}`, "utf8");
      const offenders: string[] = [];
      for (const [name, owner] of clientVariants) {
        if (new RegExp(`\\b${name}\\b`).test(source)) offenders.push(`${name} (from ${owner})`);
      }
      expect(
        offenders,
        `${file} renders on the server but uses ${offenders.join(", ")}. Move that cva ` +
          `definition into a *.variants.ts module with no "use client" and re-export it.`,
      ).toEqual([]);
    },
  );
});
