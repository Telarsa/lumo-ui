import type { NextConfig } from "next";

/**
 * Static export, deliberately.
 *
 * The gate grades `out/**\/*.html` — the exact bytes a crawler, a JS-disabled
 * reader and the first paint receive. A dev-server-only site could be graded
 * with a browser instead, but that puts a browser download on the critical path
 * of every CI run, and this team works where that is not reliable.
 *
 * `trailingSlash` gives every route its own directory and `index.html`, so the
 * gate can derive a locale from the first path segment without special-casing.
 */
const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  images: { unoptimized: true },
  // The React Native components (@lumo-ui/native) are PREVIEWED on the docs site
  // through react-native-web. `import … from "react-native"` in that package is
  // the real thing on a device; here it resolves to the web renderer. The site
  // labels the preview as a browser rendering, not a device run.
  turbopack: {
    resolveAlias: { "react-native": "react-native-web" },
    // `@rn-primitives/*` (the native engine) ships Metro-style platform files
    // behind extensionless relative imports (`export * from "./dialog"` →
    // dialog.web.mjs on web); the web files must win here.
    resolveExtensions: [".web.tsx", ".web.ts", ".web.mjs", ".web.js", ".tsx", ".ts", ".mjs", ".js", ".mts", ".cts", ".jsx", ".json"],
  },
  // …and those files carry raw JSX in .mjs (Metro's Babel accepts it), so they go through the compiler.
  transpilePackages: ["@rn-primitives/dialog", "@rn-primitives/portal", "@rn-primitives/slot", "@rn-primitives/hooks", "@rn-primitives/types"],
};

export default config;
