/**
 * The install commands, in a module with NO `"use client"` directive: the server page (build-time highlighting) and the client tabs share one source instead of a client reference.
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
