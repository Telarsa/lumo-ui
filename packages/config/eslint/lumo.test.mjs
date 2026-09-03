/**
 * The lint policy grading itself.
 *
 * Two tiers, because this policy has failed in two different ways and only one
 * of them is about the rules:
 *
 *   TIER 1  The rules detect. Poison fixtures under `../fixtures/`, one
 *           assertion per line that must fail and a blanket assertion that
 *           nothing else does. This is the convention CONTRIBUTING.md already
 *           states for the HTML gate: "a rule that has never been observed
 *           failing is decoration."
 *
 *   TIER 2  The rules RUN. The whole policy was correct and unexecuted until
 *           12 Aug 2026 — no root config, no script, no CI step, and
 *           CONTRIBUTING.md telling contributors otherwise. That is the same
 *           shape as `persian-digit-floor`, which disappeared twice and is now
 *           held in place by a string assertion on the root manifest in
 *           `packages/gate/src/gate.test.ts`. This is that assertion for lint.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ESLint } from "eslint";
import tseslint from "typescript-eslint";
import { describe, expect, it } from "vitest";
import { lumoRules } from "./lumo.mjs";
import lumoFlatConfig from "./lumo.mjs";

const HERE = import.meta.dirname;
const REPO = join(HERE, "..", "..", "..");
const FIXTURES = join(HERE, "..", "fixtures");

/**
 * The fixtures live under `fixtures/`, which `lumo.mjs`'s own second block
 * switches the rules OFF for — deliberately, and asserted below. So they are
 * linted with the rules applied directly rather than through the flat-config
 * fragment; anything else would grade nothing, which is the failure this whole
 * file exists to prevent.
 */
const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: [
    {
      files: ["**/*.tsx"],
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      rules: lumoRules,
    },
  ],
});

/** @param {string} name @returns {Promise<Map<number, string[]>>} lines → messages */
async function lintFixture(name) {
  const [result] = await eslint.lintFiles([join(FIXTURES, name)]);
  const byLine = new Map();
  for (const m of result?.messages ?? []) {
    byLine.set(m.line, [...(byLine.get(m.line) ?? []), m.message]);
  }
  return byLine;
}

/**
 * The BAD lines, read from the fixture itself rather than hardcoded here.
 * A fixture whose comments and whose assertions can drift apart is two claims,
 * and the one nobody re-reads is the one that goes wrong.
 *
 * @param {string} name @returns {number[]} 1-based lines whose NEXT line is marked BAD
 */
function declaredBadLines(name) {
  const lines = readFileSync(join(FIXTURES, name), "utf8").split("\n");
  const bad = [];
  lines.forEach((line, i) => {
    if (!/(^|\s)BAD:/.test(line)) return;
    // The marker is a comment; the offending code is the line after it, except
    // for a block comment marker sitting on its own line.
    bad.push(i + 2);
  });
  return bad;
}

describe("the physical-utility rule detects, and only where classes live", () => {
  it("fires on exactly the lines marked BAD", async () => {
    const found = await lintFixture("physical.bad.tsx");
    const expected = declaredBadLines("physical.bad.tsx");
    expect(expected.length).toBeGreaterThan(6);
    expect([...found.keys()].sort((a, b) => a - b)).toEqual(expected);
  });

  it("catches a utility hidden behind a Tailwind variant", async () => {
    // The specific miss that made the old pattern worse than useless: its token
    // boundary was literal whitespace, so `md:` or `after:` hid the utility.
    const found = await lintFixture("physical.bad.tsx");
    const text = readFileSync(join(FIXTURES, "physical.bad.tsx"), "utf8").split("\n");
    const variantLines = [...found.keys()].filter((l) => /(md:|after:)/.test(text[l - 1] ?? ""));
    expect(variantLines.length).toBeGreaterThan(0);
  });

  it("stays silent on prose, which was 34 of the first run's 37 errors", async () => {
    const found = await lintFixture("physical.bad.tsx");
    const text = readFileSync(join(FIXTURES, "physical.bad.tsx"), "utf8").split("\n");
    for (const line of found.keys()) {
      expect(text[line - 1], `line ${line} is prose, not a class position`).not.toMatch(
        /right-click|bottom-right|rather than/,
      );
    }
  });

  it("stays silent on inset-x and space-x, which tailwindcss 4 emits as logical", async () => {
    // Measured against the pinned tailwindcss 4.3.3: `inset-x-0` → `inset-inline`,
    // `space-x-4` → `margin-inline-start`/`-end`. Both were in PHYSICAL, and
    // `inset-x-` produced every class-string hit in the first run.
    const found = await lintFixture("physical.bad.tsx");
    const text = readFileSync(join(FIXTURES, "physical.bad.tsx"), "utf8").split("\n");
    for (const line of found.keys()) {
      expect(text[line - 1], `line ${line} is a logical utility on Tailwind 4`).not.toMatch(
        /inset-x-|space-x-/,
      );
    }
  });
});

describe("the Persian rules detect", () => {
  it("fires on exactly the lines marked BAD", async () => {
    const found = await lintFixture("persian.bad.tsx");
    expect([...found.keys()].sort((a, b) => a - b)).toEqual(declaredBadLines("persian.bad.tsx"));
  });

  it("still sees a raw number rendered as a JSX child", async () => {
    // This selector matched NOTHING before 12 Aug 2026: it tested a regex
    // against a NUMERIC `value`, which esquery skips, and only ever looked at
    // the left operand of a `+`. A rule that cannot fail is not a rule.
    const found = await lintFixture("persian.bad.tsx");
    const messages = [...found.values()].flat();
    expect(messages.some((m) => m.includes("renders Latin digits"))).toBe(true);
  });
});

describe("the exemption block is still an exemption block", () => {
  it("switches the syntax rules off for tests, fixtures and type-tests", () => {
    // Load-bearing in both directions: the poison fixtures and the deliberate
    // `<Cell>{day.day + 1}</Cell>` in `types.type-test.tsx` must stay red-free,
    // and this is where anyone would widen the escape by accident.
    const off = lumoFlatConfig.find((block) => block.rules?.["no-restricted-syntax"] === "off");
    expect(off, "no block turns the rules off").toBeDefined();
    expect(off.files).toContain("**/fixtures/**");
    expect(off.files).toContain("**/*.type-test.tsx");
  });
});

describe("the policy is wired to something that actually runs", () => {
  const root = JSON.parse(readFileSync(join(REPO, "package.json"), "utf8"));

  it("verify contains a lint step", () => {
    // The assertion this repository learned to write the hard way. Until
    // 12 Aug 2026 the policy below had no root config, no script and no CI
    // step, while CONTRIBUTING.md said "a physical utility is caught by lint.
    // There is no exception." Everything else in this file grades rules; this
    // grades whether anything grades.
    expect(root.scripts.verify, "verify does not run lint").toMatch(/\bgate:lint\b/);
    expect(root.scripts["gate:lint"], "gate:lint is not defined").toMatch(/\beslint\b/);
  });

  it("the root config composes THIS policy rather than restating it", () => {
    // A copy would drift, and the copy is what a consumer would not get.
    const config = readFileSync(join(REPO, "eslint.config.js"), "utf8");
    expect(config).toMatch(/packages\/config\/eslint\/lumo\.mjs/);
    expect(config).toMatch(/react-hooks\/rules-of-hooks/);
  });

  it("lints every tree the contract is about", async () => {
    // A config that resolves but matches no file is the vacuous pass
    // `packages/gate/src/cli.ts` refuses loudly for HTML. Same refusal here.
    //
    // Retargeted 31 Aug 2026: this named `packages/ui/src` and
    // `packages/blocks/src`, which §50.6 deleted — so it had been asserting
    // ">20 files" about two directories that did not exist, and failing.
    // The list is now the trees that DO exist, `apps/website/src` included:
    // the docs site is a consumer and its own pages are linted, while its
    // shadcn copies sit in the ignore list by design (§51).
    const repoEslint = new ESLint({ cwd: REPO });
    for (const dir of [
      "packages/core/src",
      "packages/dates/src",
      "packages/gate/src",
      "apps/website/src",
    ]) {
      const results = await repoEslint.lintFiles([join(REPO, dir)]);
      expect(results.length, `${dir} contributed no linted files`).toBeGreaterThan(3);
    }
  });
});
