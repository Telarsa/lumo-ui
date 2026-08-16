#!/usr/bin/env node
/**
 * Lockstep versions: every package in the workspace carries the SAME version as
 * the root, and the newest CHANGELOG.md section is that version. Consumers pin
 * one tag for the contract packages and read one CHANGELOG entry per upgrade;
 * a package left behind would make "which Lumo do I have" unanswerable.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const root = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
/** @type {string[]} */
const problems = [];
for (const dir of ["packages", "apps"]) {
  for (const name of readdirSync(join(ROOT, dir))) {
    const file = join(ROOT, dir, name, "package.json");
    let pkg;
    try { pkg = JSON.parse(readFileSync(file, "utf8")); } catch { continue; }
    if (pkg.version !== root.version) problems.push(`${dir}/${name}: ${pkg.version} (root is ${root.version})`);
    if (pkg.license !== root.license) problems.push(`${dir}/${name}: license "${pkg.license}" (root is "${root.license}")`);
  }
}
const changelog = readFileSync(join(ROOT, "CHANGELOG.md"), "utf8");
const first = /^## (\d+\.\d+\.\d+)/m.exec(changelog)?.[1];
if (first !== root.version) problems.push(`CHANGELOG.md: newest section is ${first ?? "missing"}, root version is ${root.version}`);
if (problems.length > 0) {
  console.error("  versions: every package moves together with the root and the CHANGELOG —\n    " + problems.join("\n    "));
  process.exit(1);
}
console.log(`  versions: ${root.version} everywhere, CHANGELOG.md leads with it, license "${root.license}"`);
