import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    env: { TZ: "Asia/Tehran" },
    // See vitest.setup.ts: without `globals`, Testing Library never installs
    // its own afterEach(cleanup), so renders accumulated across tests.
    setupFiles: ["./vitest.setup.ts"],
  },
});
