/**
 * The install commands, in a module with NO `"use client"` directive.
 *
 * They lived inside `install-tabs.tsx` until the build-time highlighter needed
 * them: a function imported FROM a client module INTO a server component is a
 * client reference, not a function — the server page could see the commands
 * but never call the builders. Both sides import from here instead: the server
 * page to highlight each command during the export, the tabs to know which
 * command belongs to which tab.
 */
export type PM = "pnpm" | "npm" | "yarn" | "bun";

/** pnpm first — Lumo is pnpm-first, and the first tab is the default tab. */
export const PMS: readonly PM[] = ["pnpm", "npm", "yarn", "bun"];

export const CLI_COMMAND: Record<PM, (name: string) => string> = {
  pnpm: (name) => `pnpm dlx shadcn@latest add @lumo/${name}`,
  npm: (name) => `npm exec shadcn@latest add @lumo/${name}`,
  yarn: (name) => `yarn dlx shadcn@latest add @lumo/${name}`,
  bun: (name) => `bunx --bun shadcn@latest add @lumo/${name}`,
};

export function depsCommand(dependencies: readonly string[]): string {
  return `pnpm add ${dependencies.join(" ")}`;
}
