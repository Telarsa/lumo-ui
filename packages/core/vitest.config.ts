import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/*
 * The React plugin arrived with the locale context (§50.2): `locale.tsx` is JSX
 * and its suite renders it. NO `environment: "jsdom"`, matching
 * `@lumo-ui/base-ui-ssr` — the tier is `renderToStaticMarkup` on `node`, which
 * proves the context resolves during a SERVER render. That is the property that
 * matters: a locale that only resolves after hydration serves the first byte in
 * the wrong language.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    // Persian formatting is timezone-sensitive at date boundaries. Pinning the
    // zone means a test that passes in Tehran passes on a CI runner in UTC.
    env: { TZ: "Asia/Tehran" },
  },
});
