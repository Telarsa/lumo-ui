import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import lumo from "lumo-ui/config/eslint";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  ...lumo,
  globalIgnores([".next/**", "out/**", "next-env.d.ts", "docs/verification/**"]),
]);
