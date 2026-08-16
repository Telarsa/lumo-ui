import { defineConfig } from "vitest/config";

// The native components are tested the way every Lumo component is: rendered to
// static markup and graded. `react-native` resolves to `react-native-web` here —
// a browser rendering, not a device; the ICU probe (src/icu-probe.ts) is what a
// device run must answer, and packages/native/README.md says which runs.
export default defineConfig({
  resolve: { alias: { "react-native": "react-native-web" } },
  test: { environment: "node", include: ["src/**/*.test.{ts,tsx}"] },
});
