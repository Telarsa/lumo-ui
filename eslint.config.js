/**
 * The root that makes `packages/config/eslint/lumo.mjs` actually run.
 *
 * That policy file has been correct and unexecuted since it was written. On
 * 12 Aug 2026 an audit measured the gap: injecting `className="ml-2 text-left"`
 * and a Latin `String(5)` into `rating.tsx` produced ZERO failures across the
 * suite, while CONTRIBUTING.md told contributors "a physical utility is caught
 * by lint. There is no exception." Two of this repository's three memorialised
 * incidents have this exact shape — a rule that exists, self-tests, documents
 * itself, and grades nothing.
 *
 * THE SHAPE, and why:
 *
 * - ONE config at the root, not one per package. The policy is a property of
 *   the contract, not of a package, and a per-package config is a place for a
 *   package to quietly not have one. `packages/config` and `packages/theme`
 *   have no build of their own and would have been the two that missed out.
 *
 * - The shared fragment is SPREAD, not copied. `lumo.mjs` stays the single
 *   statement of the policy and stays plugin-free, so the claim in its header —
 *   "a consuming repo installs one file and gets the whole policy" — remains
 *   true. This file adds only what a repo cannot ship in a zero-dependency
 *   fragment: a parser that can read .tsx, and the one rule that needs
 *   control-flow analysis rather than a selector.
 *
 * - No formatter, no stylistic rules, no `eslint:recommended`. Every rule here
 *   is one whose violation has actually shipped in this repository. A rule that
 *   fires on style teaches people to read lint output as noise, and this gate's
 *   whole value is that its output is read.
 */
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import lumo from "./packages/config/eslint/lumo.mjs";

/**
 * Not linted, and each for a stated reason rather than to make the run quiet.
 */
const IGNORES = [
  "apps/website/next-env.d.ts",
  "apps/website/out/**",
  // shadcn-managed copies (§51): upstream code the repo deliberately does not
  // lint-own — the gate grades their served OUTPUT instead.
  "apps/website/src/components/ui/**",
  "**/node_modules/**",
  "**/dist/**",
  "**/out/**",
  "**/.next/**",
  // Measurement scratch, when it exists: deliberately-wrong baselines are
  // evidence, and linting evidence into compliance would destroy it.
  "experiments/**",
  // Poison fixtures — the HTML gate's, and this policy's own. They contain the
  // defects they exist to catch; a clean fixture is a broken fixture. They are
  // linted by `packages/config/eslint/lumo.test.mjs`, which asserts exactly
  // which lines must fail.
  "packages/*/fixtures/**",
];

export default [
  { ignores: IGNORES },

  {
    // typescript-eslint's parser is used for EVERY file, including .mjs. One
    // parser means one AST shape, which matters here: `lumo.mjs`'s selectors
    // are written against ESTree node names and a second parser would silently
    // change which of them match.
    files: ["**/*.{ts,tsx,js,jsx,mjs,cjs}"],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    linterOptions: {
      // An `eslint-disable` for a rule that no longer fires is a claim about
      // the code that has stopped being true. This is how an exemption expires
      // rather than accumulating.
      reportUnusedDisableDirectives: "error",
    },
  },

  // The policy itself. Its own second element turns `no-restricted-syntax` off
  // for tests and fixtures, so order matters: it must come after the parser
  // block and before nothing that re-enables it.
  ...lumo,

  {
    // rules-of-hooks is the reason a plugin is admitted at all. It is not
    // expressible as a syntax selector: `useContext` in the right operand of
    // `&&` is legal syntax everywhere except inside a component, and only the
    // plugin knows which functions are components.
    //
    // Scoped to files that can contain components. Enabled as ERROR with no
    // companions: `exhaustive-deps` is a judgement call that produces
    // suppressions rather than fixes, and the react-compiler rules in this
    // plugin's `recommended` grade a compiler this repo does not run.
    files: ["**/*.{ts,tsx,jsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: { "react-hooks/rules-of-hooks": "error" },
  },

  {
    // The one rule admitted for a different reason: `packages/core/src/props.ts`
    // already carried `// eslint-disable-next-line @typescript-eslint/no-explicit-any`
    // with thirteen lines justifying it. A suppression for a rule nobody runs is
    // the same defect as a rule nobody runs, so the choice was to delete the
    // claim or make it true. Making it true costs nothing measurable: the whole
    // repository contains exactly ONE explicit `any`, and it is that one.
    //
    // `tseslint.plugin` is already installed for its parser, so this adds no
    // package. The rule is syntactic, so it needs no type-aware program.
    files: ["**/*.{ts,tsx}"],
    plugins: { "@typescript-eslint": tseslint.plugin },
    rules: { "@typescript-eslint/no-explicit-any": "error" },
  },
];
