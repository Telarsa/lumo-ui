import { defineConfig } from "vitest/config";

/**
 * The policy's own suite. It lints poison fixtures with the exported rules and
 * reads the root manifest to prove the policy is wired to something that runs.
 * No environment: nothing here renders.
 *
 * ── WHY testTimeout IS RAISED, MEASURED 12 AUG 2026 ─────────────────────────
 *
 * One test in here is not a unit test at all: "lints the two trees the contract
 * is about" runs the real ESLint over the source of `core`, `dates`, `gate`
 * and the website, because a policy that resolves and matches no file is
 * the vacuous pass this repository refuses everywhere else. That means its
 * budget is the size of those two trees, and the trees grow.
 *
 * It sat just under Vitest's 5000ms default and crossed it during the Phase 2.1
 * ref/id sweep, which added roughly 1,300 lines of type surface and comment to
 * exactly the two directories it parses. Measured on this machine, same tree,
 * same test: 5.29s and 6.85s on two consecutive runs — a failure whose cause is
 * a BUDGET rather than a defect, which is the shape DECISIONS/AUDIT §2.8
 * already names as the thing that teaches a team to re-run instead of read.
 *
 * 30s, not 15s: `packages/ui`'s number is per jsdom file and this one is a
 * whole-tree lint that will keep growing with the library. If it ever
 * approaches this, the answer is to scope the assertion to a sample of files
 * rather than to raise it again.
 */
export default defineConfig({
  test: { include: ["eslint/**/*.test.mjs"], testTimeout: 30_000 },
});
