import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/*
 * TWO TIERS, on purpose.
 *
 * The pure tier (`datelib.test.ts`) needs no DOM and pins the arithmetic. The
 * INTERACTIVE tier (`selection.test.tsx`) mounts a real `<DayPicker>` and
 * clicks it, because the defect that shipped twice — the selection highlight
 * not following a click — is invisible to every other tier: the server render
 * is correct, the types are correct, and only a second render after an event
 * shows it.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    env: { TZ: "Asia/Tehran" },
  },
});
