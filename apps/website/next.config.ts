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
};

export default config;
