import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A STATIC EXPORT, deliberately: `out/**` is the corpus `gate:html` grades —
  // the bytes a crawler, a JS-off reader and the first paint receive (§51).
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // Lumo ships TypeScript source (git/file deps); Next transpiles it — the same
  // one line every consumer carries, and it is now ONE entry rather than three
  // because there is one package. `transpilePackages` takes PACKAGE NAMES, not
  // subpaths: "lumo-ui/core" matches nothing and Turbopack then reports
  // "Unknown module type" on a .ts file it was never told to compile.
  transpilePackages: ["lumo-ui"],
  /*
   * DEV ONLY: `/` → the default locale. A static export ignores redirects()
   * (public/index.html covers `/` on a host), but `next dev` does not serve
   * that file at the bare origin, so without this dev 404s at `/`.
   */
  ...(process.env.NODE_ENV === "development"
    ? {
        redirects: async () => [
          { source: "/", destination: "/en/", permanent: false },
        ],
      }
    : {}),
};

export default nextConfig;
