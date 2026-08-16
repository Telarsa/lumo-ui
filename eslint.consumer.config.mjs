// A CONSUMER's lint, not ours. `lumo add` copies these files into an app whose
// ESLint is typically typescript-eslint `recommended` plus react-hooks — that is
// what `eslint-config-next` composes — with no `_`-prefix allowance and warnings
// treated as failures in CI. A copy must pass that on day one, so this config
// runs over every copyable source with `--max-warnings 0` (`gate:consumer-lint`).
// Found necessary by the first consumer trials, 16 Aug 2026 (an empty
// `interface … extends {}` and `label: _label` discards failed a Next app's lint).
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  {
    ignores: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.type-test.tsx",
      "**/*.render.test.tsx",
    ],
  },
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    files: ["packages/ui/src/**/*.{ts,tsx}", "packages/blocks/src/**/*.{ts,tsx}", "packages/native/src/**/*.{ts,tsx}"],
  },
);
