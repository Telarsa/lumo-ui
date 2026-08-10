import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Mirrors packages/ui/vitest.config.ts: jsdom + the React plugin, because
// site-search.test.tsx renders the real palette through @testing-library/react
// (search-index.test.ts itself is pure functions and runs fine under jsdom
// too). TZ is pinned for the same reason every other vitest.config.ts in this
// repo pins it — a test that is timezone-sensitive at a date boundary should
// pass the same way on a laptop and on a CI runner in UTC.
//
// The `@/*` alias mirrors tsconfig.json's `paths` — Next's build reads that
// file directly, but Vite (which vitest runs on) does not, so the same map
// has to be restated here or every `@/lib/...`/`@/components/...` import
// resolves under Next and fails under vitest.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    env: { TZ: "Asia/Tehran" },
  },
});
