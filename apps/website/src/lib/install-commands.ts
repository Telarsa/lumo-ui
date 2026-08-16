/**
 * The install commands, in a module with NO `"use client"` directive: the server page (build-time highlighting) and the client tabs share one source instead of a client reference.
 */
export type PM = "pnpm" | "npm" | "yarn" | "bun";

/** pnpm first — Lumo is pnpm-first, and the first tab is the default tab. */
export const PMS: readonly PM[] = ["pnpm", "npm", "yarn", "bun"];

/**
 * `lumo` is the CLI the root `lumo-ui` dev dependency provides (path A: git
 * dependencies, no registry host). It copies the item and its closure from the
 * installed checkout and records lumo.lock.json.
 */
export const CLI_COMMAND: Record<PM, (name: string) => string> = {
  pnpm: (name) => `pnpm exec lumo add ${name} --to .`,
  npm: (name) => `npx lumo add ${name} --to .`,
  yarn: (name) => `yarn lumo add ${name} --to .`,
  bun: (name) => `bunx lumo add ${name} --to .`,
};

export function depsCommand(dependencies: readonly string[]): string {
  return `pnpm add ${dependencies.join(" ")}`;
}
