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
import {
  formatPropViolations,
  formatRootViolations,
  gradeRootContract,
  gradeSource,
  type PropViolation,
  type RootViolation,
} from "./inert-props.ts";

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

/*
 * TWO RULES, ONE PASS. `gradeSource` grades the props a file DECLARES;
 * `gradeRootContract` grades the DOM surface it INHERITS — the `ref`/`id`
 * contract decided in `@lumo-ui/core`'s props.ts. They are reported separately
 * because they fail for different reasons and are fixed by different edits, and
 * they exit together because a build is one answer.
 */
const violations: PropViolation[] = [];
const roots_: RootViolation[] = [];
for (const file of files) {
  const path = relative(process.cwd(), file);
  const text = await readFile(file, "utf8");
  violations.push(...gradeSource(path, text));
  roots_.push(...gradeRootContract(path, text));
}

console.log(formatPropViolations(violations));
console.log(formatRootViolations(roots_));
const total = violations.length + roots_.length;
console.log(
  `  ${String(files.length)} component file(s) graded, ${String(violations.length)} inert-prop ` +
    `violation(s), ${String(roots_.length)} root-contract violation(s)`,
);
process.exit(total ? 1 : 0);
