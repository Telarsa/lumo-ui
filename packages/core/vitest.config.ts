import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Persian formatting is timezone-sensitive at date boundaries. Pinning the
    // zone means a test that passes in Tehran passes on a CI runner in UTC.
    env: { TZ: "Asia/Tehran" },
  },
});
