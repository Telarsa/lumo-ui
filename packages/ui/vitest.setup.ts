import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

/**
 * UNMOUNT BETWEEN TESTS. ONCE, HERE.
 *
 * ═══ WHY THIS FILE EXISTS ═══════════════════════════════════════════════════
 *
 * `@testing-library/react` registers its own `afterEach(cleanup)` ONLY when the
 * test runner exposes a global `afterEach` — that is, under Vitest's
 * `globals: true`. This config does not set it (imports are explicit here, which
 * is the better default), so the automatic cleanup never installed and every
 * `render()` stayed mounted in `document.body` for the rest of the file.
 *
 * 46 of the 59 suites had written `afterEach(cleanup)` by hand. THIRTEEN had
 * not, and that is the shape of the problem: a per-file habit that is correct
 * in most files is not a guarantee, it is a coin flip weighted by whoever wrote
 * the file. It surfaced when a date-picker test counted four `<select>`s where
 * two were rendered — the other two belonged to the previous test.
 *
 * ═══ WHY IT MATTERS BEYOND A WRONG COUNT ════════════════════════════════════
 *
 * Leftover DOM does not usually fail a test; it usually makes one PASS. A
 * `getAllByRole(…)[0]` resolves against the first match in the document, which
 * after an un-cleaned render is an element from an earlier test — so an
 * assertion can be reading a control the current test never made, and a broken
 * component can look fine because its predecessor was not. That is the exact
 * failure mode this repository builds poison fixtures to prevent, and it was
 * sitting in the harness.
 *
 * ═══ WHY NOT `globals: true` ════════════════════════════════════════════════
 *
 * That would install this AND make `describe`/`it`/`expect` ambient in every
 * file, which is a much larger change to how the suite reads, for one line of
 * benefit. The per-file `afterEach(cleanup)` calls are left in place: they are
 * now redundant rather than wrong, calling `cleanup()` twice is a no-op, and
 * removing 46 of them would be a large diff that makes the guarantee LESS
 * visible where people actually read it.
 */
afterEach(() => {
  cleanup();
});
