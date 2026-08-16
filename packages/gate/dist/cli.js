#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { addCoverage, EMPTY_COVERAGE, format, formatCoverage, gradeHtml, missingDenseDigitFloors, } from "./index.js";
import { RULES, persianDigitFloor } from "./rules.js";
const root = process.argv[2];
if (!root) {
    console.error("usage: lumo-gate <build-output-dir> [floors.json]");
    process.exit(2);
}
// The digit floors are per-path and belong to the SITE, so they arrive as a
// JSON file argument. No file → the floor rule is not constructed, visibly here
// (it once had a factory, fixture and docs and was never in RULES at all).
const floorsPath = process.argv[3];
/** Keys beginning with "//" are comments, not floors — JSON has no other way. */
async function readFloors(path) {
    const raw = JSON.parse(await readFile(path, "utf8"));
    return Object.fromEntries(Object.entries(raw).filter(([k, v]) => !k.startsWith("//") && typeof v === "number"));
}
const rules = [...RULES];
let floorCount = 0;
let floorLedger = {};
if (floorsPath) {
    floorLedger = await readFloors(floorsPath);
    const entries = Object.keys(floorLedger).length;
    if (entries === 0) {
        console.error(`  ${floorsPath} declares no floors. An empty floors file is`);
        console.error("  the vacuous pass this rule exists to prevent.");
        process.exit(2);
    }
    rules.push(persianDigitFloor(floorLedger));
    floorCount = entries;
    console.log(`  persian-digit-floor armed for ${entries} route(s)`);
}
async function htmlFiles(dir) {
    const out = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory())
            out.push(...(await htmlFiles(path)));
        else if (entry.name.endsWith(".html"))
            out.push(path);
    }
    return out;
}
const files = await htmlFiles(root);
// A gate that grades nothing and prints "clean" is worse than no gate. Refuse loudly.
if (files.length === 0) {
    console.error(`  lumo-gate found no .html under ${root}.`);
    console.error("  Refusing to report success on nothing.");
    process.exit(2);
}
const violations = [];
const graded = new Set();
const pages = [];
let coverage = EMPTY_COVERAGE;
for (const file of files) {
    const rel = relative(root, file);
    graded.add(rel);
    const html = await readFile(file, "utf8");
    pages.push({ path: rel, html });
    violations.push(...gradeHtml(rel, html, rules));
    // Coverage prints, it never fails.
    coverage = addCoverage(coverage, rel, html);
}
// A floor keyed to a path that no longer exists is a rule that silently stopped grading.
if (floorsPath) {
    for (const declared of Object.keys(floorLedger)) {
        if (!graded.has(declared)) {
            violations.push({
                rule: "persian-digit-floor",
                path: declared,
                detail: "floor declared for a path the build did not produce — stale floors file",
            });
        }
    }
    for (const missing of missingDenseDigitFloors(pages, floorLedger)) {
        violations.push({
            rule: "persian-digit-floor",
            path: missing.path,
            detail: `number-dense route has ${String(missing.found)} visible native digits but no committed floor; ` +
                "add a reviewed baseline at about 55% of this count",
        });
    }
}
console.log(format(violations));
console.log(`  ${files.length} document(s) graded, ${violations.length} violation(s)`);
const scope = formatCoverage(coverage, floorCount);
if (scope)
    console.log(scope);
process.exit(violations.length ? 1 : 0);
