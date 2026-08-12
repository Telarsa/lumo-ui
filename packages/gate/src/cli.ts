#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { addCoverage, EMPTY_COVERAGE, format, formatCoverage, gradeHtml } from "./index.ts";
import { RULES, persianDigitFloor } from "./rules.ts";

const root = process.argv[2];
if (!root) {
  console.error("usage: lumo-gate <build-output-dir> [floors.json]");
  process.exit(2);
}

/*
 * The digit floors — rule 3's missing half, found by a review two days in.
 *
 * `persianDigitFloor` had a factory, a poison fixture, a passing self-test, a
 * README paragraph and a docs page — and was never in the RULES array this CLI
 * runs. Every one of those artifacts described a rule that graded nothing:
 * the anti-vacuity rule was itself vacuous, which is the failure mode this
 * repo's own docs call "worse than no rule, because it is trusted".
 *
 * Floors are per-path and belong to the SITE (the consumer knows which of its
 * routes exist to show numbers), so they arrive as a JSON file argument rather
 * than living here. No file → the floor rule simply is not constructed, and
 * that absence is now visible in this file instead of implied by an array
 * nobody re-read.
 */
const floorsPath = process.argv[3];

/** Keys beginning with "//" are comments, not floors — JSON has no other way. */
async function readFloors(path: string): Promise<Record<string, number>> {
  const raw = JSON.parse(await readFile(path, "utf8")) as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(raw).filter(([k, v]) => !k.startsWith("//") && typeof v === "number"),
  ) as Record<string, number>;
}

const rules = [...RULES];
let floorCount = 0;
if (floorsPath) {
  const floors = await readFloors(floorsPath);
  const entries = Object.keys(floors).length;
  if (entries === 0) {
    console.error(`  ${floorsPath} declares no floors. An empty floors file is`);
    console.error("  the vacuous pass this rule exists to prevent.");
    process.exit(2);
  }
  rules.push(persianDigitFloor(floors));
  floorCount = entries;
  console.log(`  persian-digit-floor armed for ${entries} route(s)`);
}

async function htmlFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(path)));
    else if (entry.name.endsWith(".html")) out.push(path);
  }
  return out;
}

const files = await htmlFiles(root);

// An empty run reporting success is the vacuous pass this whole project exists
// to prevent — a gate that grades nothing and prints "clean" is worse than no
// gate, because it is trusted. Refuse loudly instead.
if (files.length === 0) {
  console.error(`  lumo-gate found no .html under ${root}.`);
  console.error("  Refusing to report success on nothing.");
  process.exit(2);
}

const violations = [];
const graded = new Set<string>();
let coverage = EMPTY_COVERAGE;
for (const file of files) {
  const rel = relative(root, file);
  graded.add(rel);
  const html = await readFile(file, "utf8");
  violations.push(...gradeHtml(rel, html, rules));
  // Same read, second question: how much of it did the rules actually look at.
  // See `addCoverage` — this prints, it never fails.
  coverage = addCoverage(coverage, rel, html);
}

// A floor keyed to a path that no longer exists is a rule that silently
// stopped grading — the same hole as an unwired rule, one rename later.
if (floorsPath) {
  const floors = await readFloors(floorsPath);
  for (const declared of Object.keys(floors)) {
    if (!graded.has(declared)) {
      violations.push({
        rule: "persian-digit-floor",
        path: declared,
        detail: "floor declared for a path the build did not produce — stale floors file",
      });
    }
  }
}

console.log(format(violations));
console.log(`  ${files.length} document(s) graded, ${violations.length} violation(s)`);
const scope = formatCoverage(coverage, floorCount);
if (scope) console.log(scope);
process.exit(violations.length ? 1 : 0);
