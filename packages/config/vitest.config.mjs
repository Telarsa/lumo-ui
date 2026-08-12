import { defineConfig } from "vitest/config";

/**
 * The policy's own suite. It lints poison fixtures with the exported rules and
 * reads the root manifest to prove the policy is wired to something that runs.
 * No environment: nothing here renders.
 */
export default defineConfig({ test: { include: ["eslint/**/*.test.mjs"] } });
