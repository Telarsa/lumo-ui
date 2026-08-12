#!/usr/bin/env node
/**
 * `lumo-inert-props <dir> [dir…]` — the source half of the gate.
 *
 * Separate binary from `cli.ts` because it grades a different medium: `cli.ts`
 * reads a build output directory of HTML, this reads component sources, and
 * running them from one entry point would mean one of the two arguments is
 * always ignored. It runs in `verify` between `gate:types` and `gate:test`,
 * where the audit put it — before the tests, because an inert prop makes tests
 * pass rather than fail, and after types, because a file that does not compile
 * has a better error waiting for it.
 */
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { formatPropViolations, gradeSource, type PropViolation } from "./inert-props.ts";

const roots = process.argv.slice(2);
if (roots.length === 0) {
  console.error("usage: lumo-inert-props <component-src-dir> [more dirs…]");
  process.exit(2);
}

/** Component files only. `.ts` modules are excluded deliberately: a file with no
 *  JSX declares no components, so every prop in it is unreferenced by
 *  construction — see the header of `inert-props.ts`. */
async function sources(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await sources(path)));
    else if (entry.name.endsWith(".tsx") && !entry.name.includes(".test.")) out.push(path);
  }
  return out;
}

const files: string[] = [];
for (const root of roots) files.push(...(await sources(root)));

/*
 * The same refusal `cli.ts` makes, for the same reason: a gate that grades
 * nothing and prints "clean" is worse than no gate, because it is trusted. This
 * one has a specific way of going vacuous — a directory rename, or the `.tsx`
 * filter meeting a codebase that moved to `.ts` — and both look exactly like
 * success from the outside.
 */
if (files.length === 0) {
  console.error(`  lumo-inert-props found no component sources under ${roots.join(", ")}.`);
  console.error("  Refusing to report success on nothing.");
  process.exit(2);
}

const violations: PropViolation[] = [];
for (const file of files) {
  violations.push(...gradeSource(relative(process.cwd(), file), await readFile(file, "utf8")));
}

console.log(formatPropViolations(violations));
console.log(`  ${String(files.length)} component file(s) graded, ${String(violations.length)} violation(s)`);
process.exit(violations.length ? 1 : 0);
