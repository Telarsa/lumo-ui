import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import ts from "typescript";
import { defineConfig, type Plugin } from "vitest/config";

/**
 * `@rn-primitives/*` ships Metro-style platform files (`dialog.mjs` native,
 * `dialog.web.mjs` web) behind an EXTENSIONLESS `export * from "./dialog"` —
 * resolvable only by a bundler with platform extensions. Under Vite/vitest the
 * web build is what react-native-web needs, so this plugin prefers
 * `<name>.web.mjs` when it exists, and the packages are inlined so the
 * `react-native → react-native-web` alias reaches them. Their `.mjs` also carry
 * RAW JSX (Metro's Babel accepts it), so they are run through esbuild's JSX
 * loader here — the same accommodation the docs site's bundler makes.
 */
function rnPrimitivesWeb(): Plugin {
  return {
    name: "lumo:rn-primitives-web",
    enforce: "pre",
    resolveId(source, importer) {
      if (importer === undefined || !importer.includes("/@rn-primitives/") || !source.startsWith("./")) return null;
      const base = resolve(dirname(importer), source);
      for (const ext of [".web.mjs", ".web.js", ".mjs", ".js"]) if (existsSync(base + ext)) return base + ext;
      return null;
    },
    transform(code, id) {
      if (!id.includes("/@rn-primitives/") || !/\.m?js$/.test(id) || !code.includes("<")) return null;
      // TypeScript's transpiler (already a devDependency) turns the JSX into `react/jsx-runtime` calls.
      const out = ts.transpileModule(code, {
        fileName: id.replace(/\.m?js$/, ".jsx"),
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, allowJs: true },
      });
      return { code: out.outputText, map: null };
    },
  };
}

// The native components are tested the way every Lumo component is: rendered to
// static markup and graded. `react-native` resolves to `react-native-web` here —
// a browser rendering, not a device; the ICU probe (src/icu-probe.ts) is what a
// device run must answer, and packages/native/README.md says which runs.
export default defineConfig({
  plugins: [rnPrimitivesWeb()],
  resolve: { alias: { "react-native": "react-native-web" } },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    server: { deps: { inline: [/@rn-primitives\//] } },
  },
});
