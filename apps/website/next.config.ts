import type { NextConfig } from "next";

const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  transpilePackages: ["lumo-ui"],
  ...(process.env.NODE_ENV === "development" ? {
    redirects: async () => [{ source: "/", destination: "/en/", permanent: false }],
  } : {}),
};

export default config;
