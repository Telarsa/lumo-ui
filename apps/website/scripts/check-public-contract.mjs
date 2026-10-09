import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { RULES } from "lumo-ui/gate";

const root = new URL("../", import.meta.url);
const json = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));
const consumer = await json("package.json");
const publicPackage = await json("node_modules/lumo-ui/package.json");
const facts = await readFile(new URL("src/content/site.ts", root), "utf8");
const publicVersion = facts.match(/export const version = "([^"]+)"/)?.[1];
const displayedRules = Number(facts.match(/export const ruleCount = (\d+)/)?.[1]);
// Inside the monorepo the site consumes the workspace package itself (9 Oct
// 2026); the facts it displays must still be those of the released version.
assert.equal(consumer.dependencies["lumo-ui"], "workspace:*");
assert.equal(publicPackage.version, publicVersion);
assert.equal(publicPackage.license, "MIT");
assert.equal(displayedRules, RULES.length + 1, "Displayed checks must match pinned gate rules plus its separate native-digit floor");
console.log(`Workspace Lumo UI ${publicVersion}: displayed version and rule count verified against the actual registry`);
