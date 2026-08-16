import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

/**
 * Unmount between tests. See `packages/ui/vitest.setup.ts` for the full
 * argument; the short version is that Testing Library installs its own
 * `afterEach(cleanup)` ONLY under Vitest's `globals: true`, which none of these
 * configs set, so without this file every `render()` stays in `document.body`
 * for the rest of the file.
 *
 * Both suites here already cleaned up by hand, so this changes nothing today.
 * It is here because the gap in `packages/ui` was also nothing until it was
 * thirteen files, and the failure it produces is a test that PASSES against DOM
 * an earlier test left behind.
 */
afterEach(() => {
  cleanup();
});
