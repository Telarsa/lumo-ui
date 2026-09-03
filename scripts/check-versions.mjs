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
// The CONTRACT packages are consumed as git dependencies (path A): their runtime
// dependencies must be real specifiers, equal to the workspace catalog, never
// `catalog:` or `workspace:` — pnpm refuses those outside the workspace.
// The ROOT package is the `lumo-ui` dev dependency: its `dependencies` are the
// `lumo gate` runtime (linkedom, dom-accessibility-api) and follow the same rule.
const catalog = readFileSync(join(ROOT, "pnpm-workspace.yaml"), "utf8");
// `dates` joined 30 Aug 2026 (§50). It was ADDED here because its absence is
// exactly why this gate passed green while packages/dates shipped `catalog:`
// and `workspace:*` in its runtime dependencies — the uninstallable-by-git
// defect CHANGELOG v0.1.1 exists to fix, reintroduced and ungraded.
for (const name of ["core", "theme", "base-ui-ssr", "dates", "."]) {
  const pkg = name === "." ? root : JSON.parse(readFileSync(join(ROOT, "packages", name, "package.json"), "utf8"));
  for (const [section, deps] of Object.entries({ dependencies: pkg.dependencies ?? {}, peerDependencies: pkg.peerDependencies ?? {} })) {
    for (const [dep, spec] of Object.entries(/** @type {Record<string, string>} */ (deps))) {
      if (spec.startsWith("catalog:") || spec.startsWith("workspace:")) problems.push(`${name === "." ? "root" : `packages/${name}`} ${section}.${dep}: "${spec}" cannot be installed as a git dependency`);
      const m = new RegExp(`^\\s+["']?${dep.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}["']?:\\s*([^\\s#]+)`, "m").exec(catalog);
      if (m && section === "dependencies" && m[1] !== spec) problems.push(`${name === "." ? "root" : `packages/${name}`} dependencies.${dep}: "${spec}" differs from the catalog's ${m[1]}`);
    }
  }
}
// `@lumo-ui/core` used to be a peer of dates and base-ui-ssr, checked here
// against the root version so the two moved in lockstep. There is no such
// package to depend on since §60: those files reach core by relative path, and
// a consumer installs one package, so there is nothing left to keep in step.
// packages/mobile (Lumo UI Mobile, decision §30) moves with the root too — pubspec.yaml, not package.json.
const pubspec = readFileSync(join(ROOT, "packages/mobile/pubspec.yaml"), "utf8");
const pubVersion = /^version:\s*(\S+)/m.exec(pubspec)?.[1];
if (pubVersion !== root.version) problems.push(`packages/mobile/pubspec.yaml: version ${pubVersion ?? "missing"} (root is ${root.version})`);
const changelog = readFileSync(join(ROOT, "CHANGELOG.md"), "utf8");
const first = /^## (\d+\.\d+\.\d+)/m.exec(changelog)?.[1];
if (first !== root.version) problems.push(`CHANGELOG.md: newest section is ${first ?? "missing"}, root version is ${root.version}`);
if (problems.length > 0) {
  console.error("  versions: every package moves together with the root and the CHANGELOG —\n    " + problems.join("\n    "));
  process.exit(1);
}
console.log(`  versions: ${root.version} everywhere, CHANGELOG.md leads with it, license "${root.license}"`);
