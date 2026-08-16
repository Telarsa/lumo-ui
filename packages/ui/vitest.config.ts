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
    /*
     * ── WHY THIS IS 15s, AND WHAT THE NUMBER IS HIDING ───────────────────────
     *
     * Vitest's default is 5000ms, and this suite FAILED ON A CLEAN TREE under
     * it — reproducibly, with a different victim each run. Measured at
     * e7988b8 over four consecutive runs: 0, 8, 2 and 2 failures, every one
     * `Test timed out in 5000ms`, and the slowest survivors sitting at 4745ms
     * (context-menu), 4260ms (date-selector), 3623ms (chart). Under load the
     * same tests reached 8207ms and 23501ms.
     *
     * So nothing here is flaky in LOGIC; it is flaky in BUDGET. That matters
     * more than it sounds: a suite that goes red for reasons unrelated to the
     * change teaches a team to re-run rather than read, and "just re-run it" is
     * exactly how a real failure gets rationalised away. `verify exits 0` was a
     * sample, not a property.
     *
     * ── THE COST THIS NUMBER IS NOT FIXING ───────────────────────────────────
     *
     * Raising a timeout to make a suite pass is how a slow suite becomes a very
     * slow suite, so the measurement is recorded here rather than left implied.
     * One full run of these 61 files:
     *
     *     wall clock   108s
     *     environment  244s   ← jsdom construction, ~4s per file
     *     import       210s
     *     tests        203s
     *
     * The dominant cost is not the assertions. It is building a jsdom per file
     * and importing Base UI into each one, 61 times over, on a machine with
     * fewer cores than files. An individual test then competes for CPU with 60
     * siblings doing the same thing, which is why the failing SET moves between
     * runs while the failing REASON never does.
     *
     * The real fix is to stop paying for jsdom where it is not needed — a
     * meaningful share of these files assert on `renderToStaticMarkup` output
     * or on `cva()` strings and need no DOM at all. That is a per-file audit,
     * not a config line, and it is tracked as its own piece of work. Until then
     * this buys correctness honestly rather than pretending the cost is gone.
     */
    testTimeout: 15_000,
  },
});
