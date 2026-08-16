#!/usr/bin/env node
/**
 * catalog.json — the machine-readable component catalogue an agent (or the
 * `lumo` CLI) reads to FIND the right component: per registry item, its title,
 * intro, tier and `usage` (when / when not) in both locales, its composition
 * sketch, its parts, plus what the registry knows (dependencies, files) and
 * what the API reference knows (required props, required announced strings).
 * Generated from the same sources the docs site renders, so it cannot drift
 * from the pages: `apps/website/src/examples/<slug>.tsx` meta (AST, not
 * import — those files import islands the CLI must not load), registry.json,
 * api-reference.json. `--check` fails when the committed file is stale.
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import ts from "typescript";

const ROOT = new URL("..", import.meta.url).pathname;
const EXAMPLES_DIR = join(ROOT, "apps/website/src/examples");
const OUT = join(ROOT, "catalog.json");
const LOCALES = ["fa-IR", "en-US"];

/** @type {{ items: Array<{ name: string; type: string; dependencies?: string[]; registryDependencies?: string[]; files?: Array<{ path: string; target?: string }>; description?: string }> }} */
const registry = JSON.parse(await readFile(join(ROOT, "registry.json"), "utf8"));
/** @type {{ modules: Record<string, Array<{ name: string; props: Array<{ name: string; type: string; required: boolean; description: string }> }>> }} */
const api = JSON.parse(await readFile(join(ROOT, "api-reference.json"), "utf8"));

/**
 * Read a locale-string map `{ "fa-IR": "…", "en-US": "…" }` (or a copy-table
 * reference `t.key`) out of an object literal, statically.
 * @param {import("typescript").SourceFile} sf
 */
function metaReader(sf) {
  /** @param {import("typescript").Node} node @param {string} name @returns {import("typescript").PropertyAssignment | undefined} */
  const property = (node, name) =>
    ts.isAsExpression(node) || ts.isSatisfiesExpression(node)
      ? property(node.expression, name)
      : ts.isObjectLiteralExpression(node)
        ? node.properties
            .filter(ts.isPropertyAssignment)
            .find((p) => p.name.getText(sf).replace(/["']/g, "") === name)
        : undefined;
  /** @param {import("typescript").Node} node */
  const resolve = (node) => {
    if (!ts.isPropertyAccessExpression(node) || !ts.isIdentifier(node.expression)) return node;
    const table = node.expression.text;
    /** @type {import("typescript").Node | undefined} */
    let declaration;
    /** @param {import("typescript").Node} candidate */
    const findTable = (candidate) => {
      if (ts.isVariableDeclaration(candidate) && candidate.name.getText(sf) === table) declaration = candidate.initializer;
      if (declaration === undefined) ts.forEachChild(candidate, findTable);
    };
    findTable(sf);
    return declaration === undefined ? node : (property(declaration, node.name.text)?.initializer ?? node);
  };
  /** @param {import("typescript").Node | undefined} node @returns {Record<string, string> | undefined} */
  const localized = (node) => {
    if (node === undefined) return undefined;
    const literal = resolve(node);
    /** @type {Record<string, string>} */
    const out = {};
    for (const locale of LOCALES) {
      const p = property(literal, locale);
      if (p !== undefined && ts.isStringLiteralLike(p.initializer)) out[locale] = p.initializer.text;
    }
    return Object.keys(out).length === LOCALES.length ? out : undefined;
  };
  /** @param {import("typescript").Node} node */
  const string = (node) => {
    const literal = resolve(node);
    return ts.isStringLiteralLike(literal) || ts.isNoSubstitutionTemplateLiteral(literal) ? literal.text : undefined;
  };
  return { property, localized, string };
}

/** @type {Record<string, unknown>} */
const pages = {};
// A page is `<slug>.tsx`, or `<slug>/index.tsx` for the few that need a folder.
const entries = await readdir(EXAMPLES_DIR, { withFileTypes: true });
const pageFiles = [
  ...entries.filter((e) => e.isFile() && e.name.endsWith(".tsx") && !e.name.endsWith(".test.tsx")).map((e) => e.name),
  ...entries.filter((e) => e.isDirectory() && !e.name.startsWith("_")).map((e) => `${e.name}/index.tsx`),
];
for (const file of pageFiles) {
  const slug = file.replace(/\/index\.tsx$/, "").replace(/\.tsx$/, "");
  const text = await readFile(join(EXAMPLES_DIR, file), "utf8").catch(() => "");
  if (text === "") continue;
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const { property, localized, string } = metaReader(sf);
  /** @type {import("typescript").Node | undefined} */
  let meta;
  /** @param {import("typescript").Node} node */
  const findMeta = (node) => {
    if (meta !== undefined) return;
    if ((ts.isPropertyAssignment(node) || ts.isVariableDeclaration(node)) && node.name.getText(sf) === "meta" && node.initializer !== undefined) {
      meta = node.initializer;
      return;
    }
    ts.forEachChild(node, findMeta);
  };
  findMeta(sf);
  if (meta === undefined) continue;
  const usage = property(meta, "usage")?.initializer;
  const usageWhen = usage === undefined ? undefined : localized(property(usage, "when")?.initializer);
  const usageWhenNot = usage === undefined ? undefined : localized(property(usage, "whenNot")?.initializer);
  const tierNode = property(meta, "tier")?.initializer;
  const compositionNode = property(meta, "composition")?.initializer;
  const sourceFileNode = property(meta, "sourceFile")?.initializer;
  pages[slug] = {
    title: localized(property(meta, "title")?.initializer),
    intro: localized(property(meta, "intro")?.initializer),
    tier: tierNode === undefined ? undefined : string(tierNode),
    usage: usageWhen !== undefined && usageWhenNot !== undefined ? { when: usageWhen, whenNot: usageWhenNot } : undefined,
    composition: compositionNode === undefined ? undefined : string(compositionNode),
    module: (sourceFileNode === undefined ? undefined : string(sourceFileNode)) ?? `${slug}.tsx`,
    docs: LOCALES.map((/** @type {string} */ l) => `/${l.split("-")[0]}/components/${slug}/`),
  };
}

/** Announced strings: required string props whose docblock says the reader hears them, or whose name says so. */
const ANNOUNCED = /label|Label|roleDescription|placeholder|Message|message|Text$|Announcement|Template|Word/;

/** @typedef {{ name: string; type: string; description: string | undefined; usage?: unknown; title?: unknown; dependencies: string[]; registryDependencies: string[]; files: string[]; types: string[]; requiredProps: string[]; requiredAnnouncedStrings: string[] }} CatalogItem */
/** @type {CatalogItem[]} */
const items = registry.items.map((item) => {
  const modules = api.modules[`${item.name}.tsx`] ?? [];
  const requiredProps = [];
  const requiredStrings = [];
  for (const type of modules) {
    for (const prop of type.props) {
      if (!prop.required) continue;
      requiredProps.push(`${type.name}.${prop.name}`);
      if (/\bstring\b/.test(prop.type) && ANNOUNCED.test(prop.name)) requiredStrings.push(`${type.name}.${prop.name}`);
    }
  }
  const page = /** @type {Record<string, unknown> | undefined} */ (pages[item.name]);
  return {
    name: item.name,
    type: item.type,
    description: item.description,
    ...(page ?? {}),
    dependencies: item.dependencies ?? [],
    registryDependencies: item.registryDependencies ?? [],
    files: (item.files ?? []).map((f) => f.path),
    types: modules.map((t) => t.name),
    requiredProps,
    requiredAnnouncedStrings: requiredStrings,
  };
});

const catalog = { version: 1, generatedFrom: ["apps/website/src/examples/*.tsx meta", "registry.json", "api-reference.json"], items };
const next = `${JSON.stringify(catalog, null, 2)}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(OUT, "utf8").catch(() => "");
  if (current !== next) {
    console.error("  catalog: catalog.json is stale; run node scripts/build-catalog.mjs");
    process.exit(1);
  }
  console.log(`  catalog: ${items.length} item(s) checked`);
} else {
  await writeFile(OUT, next);
  const withUsage = items.filter((i) => i.usage !== undefined).length;
  console.log(`  catalog: ${items.length} item(s), ${withUsage} with usage copy, ${Object.keys(pages).length} pages read`);
}
