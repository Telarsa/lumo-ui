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

    /*
     * ── WHAT THESE THREE PATTERNS COVER, AND WHY THERE ARE THREE ──────────────
     *
     * The first two spellings of this check anchored on `[A-Z]` and on a literal
     * `=`, and eight probes appended to `footer.tsx` one at a time showed that
     * five of them walked straight through (AUDIT.md §2.9). The misses were not
     * exotic:
     *
     *     const DEFAULT_TITLE = "Sign in to continue";   assignment, not attribute
     *     placeholder={"Search everything"}              brace-wrapped JSX string
     *     const COPY = { title: "Get started today" };   object key, colon not equals
     *     <div>OK</div>                                  no lowercase tail after the capital
     *     <div>sign in now</div>                         no leading capital at all
     *
     * The object-literal miss is the one that matters. CONTRIBUTING is explicit
     * that "there is no partial locale and no fallback — a fallback is what puts
     * an English word in a Persian sentence", and an English `DEFAULT_STRINGS =
     * { … }` is the single most natural way to introduce exactly that fallback.
     * It was invisible here.
     *
     * The `[A-Z]`-anchored JSX pattern is KEPT rather than replaced, because it
     * is the only one of the three that catches text followed by a nested
     * element (`<p>Sign in <b>now</b>`). The lowercase pattern requires a
     * closing `</` on purpose: without that anchor it matches TypeScript, not
     * JSX — `interface X<T> extends Base<T>` reads as ">" text "<" and fired on
     * `table-view.tsx` while this widening was being written. A check that
     * fires on the package's own type declarations is a check somebody deletes.
     */
    const literals = [
      // JSX text with a leading capital, before a closing tag OR a nested one:
      // >Sign in<
      /*[^{<>]*/ />[ \t]*[A-Z][a-z]{2,}(?:[ \t]+[A-Za-z]{2,})*[ \t]*</g,
      // JSX text of ANY case, immediately before a closing tag: >OK</, >sign in</
      />[ \t]*[A-Za-z]{2,}(?:[ \t]+[A-Za-z]{2,})*[ \t]*<\//g,
      // An English string bound to a text-bearing name, however it is bound:
      // attribute (label="x"), object key (label: "x"), assignment (LABEL = "x"),
      // and the brace-wrapped JSX form (label={"x"}). Case-insensitive, so
      // SCREAMING_CASE constants — where a hardcoded default actually lives —
      // are not a hole.
      /\b\w*(?:label|title|text|placeholder|description|message|heading|caption|hint|prompt|copy|action|content)\s*[:=]\s*\{?\s*"[A-Za-z][^"]*"/gi,
    ];

    const found: string[] = [];
    for (const re of literals) for (const m of code.matchAll(re)) found.push(m[0].trim());

    expect(found, `${file} contains user-facing English`).toEqual([]);
  });
});
