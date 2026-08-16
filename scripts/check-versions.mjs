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
for (const name of ["core", "theme", "base-ui-ssr", "."]) {
  const pkg = name === "." ? root : JSON.parse(readFileSync(join(ROOT, "packages", name, "package.json"), "utf8"));
  for (const [section, deps] of Object.entries({ dependencies: pkg.dependencies ?? {}, peerDependencies: pkg.peerDependencies ?? {} })) {
    for (const [dep, spec] of Object.entries(/** @type {Record<string, string>} */ (deps))) {
      if (spec.startsWith("catalog:") || spec.startsWith("workspace:")) problems.push(`${name === "." ? "root" : `packages/${name}`} ${section}.${dep}: "${spec}" cannot be installed as a git dependency`);
      const m = new RegExp(`^\\s+["']?${dep.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}["']?:\\s*([^\\s#]+)`, "m").exec(catalog);
      if (m && section === "dependencies" && m[1] !== spec) problems.push(`${name === "." ? "root" : `packages/${name}`} dependencies.${dep}: "${spec}" differs from the catalog's ${m[1]}`);
    }
  }
}
// base-ui-ssr's peer on core moves in lockstep with the release.
const ssr = JSON.parse(readFileSync(join(ROOT, "packages/base-ui-ssr/package.json"), "utf8"));
if (ssr.peerDependencies?.["@lumo-ui/core"] !== root.version) problems.push(`packages/base-ui-ssr peerDependencies.@lumo-ui/core: "${ssr.peerDependencies?.["@lumo-ui/core"]}" (root is ${root.version})`);
const changelog = readFileSync(join(ROOT, "CHANGELOG.md"), "utf8");
const first = /^## (\d+\.\d+\.\d+)/m.exec(changelog)?.[1];
if (first !== root.version) problems.push(`CHANGELOG.md: newest section is ${first ?? "missing"}, root version is ${root.version}`);
if (problems.length > 0) {
  console.error("  versions: every package moves together with the root and the CHANGELOG —\n    " + problems.join("\n    "));
  process.exit(1);
}
console.log(`  versions: ${root.version} everywhere, CHANGELOG.md leads with it, license "${root.license}"`);
