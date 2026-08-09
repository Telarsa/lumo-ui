#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { format, gradeHtml } from "./index.ts";

const root = process.argv[2];
if (!root) {
  console.error("usage: lumo-gate <build-output-dir>");
  process.exit(2);
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
for (const file of files) {
  violations.push(...gradeHtml(relative(root, file), await readFile(file, "utf8")));
}

console.log(format(violations));
console.log(`  ${files.length} document(s) graded, ${violations.length} violation(s)`);
process.exit(violations.length ? 1 : 0);
