#!/usr/bin/env node
/**
 * Generates `registry.json` from the components that actually exist. A
 * hand-maintained manifest drifts silently, so it is derived: each file
 * declares what it needs through its imports — `registryDependencies` from
 * sibling imports, `dependencies` from external packages, `type` from
 * `"use client"`. Emits shadcn's registry-item schema.
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import ts from "typescript";

const ROOT = new URL("..", import.meta.url).pathname;
const registryFlag = process.argv.indexOf("--registry");
const registryPath =
  registryFlag === -1 ? join(ROOT, "registry.json") : process.argv[registryFlag + 1];
if (registryPath === undefined) {
  console.error("  registry: --registry requires a path");
  process.exit(2);
}
const checkOnly = process.argv.includes("--check");
const SOURCES = [
  { dir: join(ROOT, "packages/ui/src"), type: "registry:ui", target: "components/ui" },
  { dir: join(ROOT, "packages/blocks/src"), type: "registry:block", target: "components/blocks" },
];

/*
 * Modules that are not components but that copied components import; they ride
 * along in every item that references them, because a shipped file that imports
 * an unshipped sibling does not compile. `@lumo-ui/base-ui-ssr` is deliberately
 * NOT here: it is a PACKAGE (a workaround against an upstream defect must be
 * retired by one `pnpm up`, not frozen in 107 copies). Each entry below was
 * caught by `gate:smoke` compiling the item as a consumer receives it.
 */
const SHARED_COMPANIONS = new Set([
  "base-ui-adapter.ts",
  "date-field-state.ts",
  "locale.ts",
  // Not `virtual-list.variants.ts` on purpose: variants are directive-free,
  // this carries `"use client"`.
  "virtualizer.ts",
  // The date family: the DateLib that makes a Jalali month Jalali, and THE
  // segmented input every date component renders.
  "calendar-datelib.ts",
  "date-input.tsx",
  // Directive-free clause factory a server-owned default query can call.
  "filters.shared.ts",
  // Shared remote-collection controller ListBox's presentation shape depends on.
  "async-collection.ts",
  // The router-link seam (`LumoProvider linkComponent`) every anchor-rendering family reads.
  "link-context.ts",
]);

/** Packages a consumer must install; everything else is workspace-internal. */
const EXTERNAL = new Set([
  // An EXTERNAL entry is only ever justified by an import that exists;
  // `react-aria-components` and `recharts` left by that rule.
  "@internationalized/date",
  // The calendar grid; the CALENDAR SYSTEM still comes from `@internationalized/date`.
  "react-day-picker",
  "class-variance-authority",
  "lucide-react",
  "clsx",
  "tailwind-merge",
  // Rendering dependencies: a consumer who copies carousel.tsx without it gets an unresolved import.
  "embla-carousel-react",
  "@base-ui/react",
  // Imported by SUBPATH (`@tanstack/charts/react`), which is what `packageOf` exists for.
  "@tanstack/charts",
  "@tanstack/react-table",
  "@tanstack/react-form",
  // Deep product-input engines, kept behind Lumo's string/raw-value interfaces.
  "culori",
  "maska",
]);

/**
 * Parse real module specifiers. Prose and examples in comments are not imports.
 * @param {string} source
 * @param {string} fileName
 * @returns {string[]}
 */
const importSpecifiers = (source, fileName) => {
  const parsed = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, false);
  /** @type {string[]} */
  const specifiers = [];
  /** @param {ts.Node} node */
  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier !== undefined &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1
    ) {
      const argument = node.arguments[0];
      if (argument !== undefined && ts.isStringLiteral(argument)) {
        specifiers.push(argument.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(parsed);
  return specifiers;
};

/*
 * Item descriptions, resolved from sources that actually DESCRIBE THE ITEM: a
 * docblock attached to the export bearing the item's name, or a true file
 * header (before the first import); otherwise the website's hand-written
 * English intro. Taking "the first docblock in the file" described `table` by
 * a helper's comment.
 */
const WEBSITE_INTRO_SOURCES = [join(ROOT, "apps/website/src/lib/blocks.tsx")];
const websiteIntros = new Map();
for (const introPath of WEBSITE_INTRO_SOURCES) {
  const text = await readFile(introPath, "utf8").catch(() => "");
  if (text === "") continue;
  const sf = ts.createSourceFile(introPath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  /** @param {import("typescript").Node} node */
  const collectIntros = (node) => {
    if (ts.isObjectLiteralExpression(node)) {
      /** @type {string | undefined} */ let id;
      /** @type {string | undefined} */ let intro;
      for (const prop of node.properties) {
        if (!ts.isPropertyAssignment(prop)) continue;
        const key = prop.name.getText(sf).replace(/["']/g, "");
        if (key === "id" && ts.isStringLiteral(prop.initializer)) id = prop.initializer.text;
        if (key === "intro" && ts.isObjectLiteralExpression(prop.initializer)) {
          for (const localeProp of prop.initializer.properties) {
            if (
              ts.isPropertyAssignment(localeProp) &&
              localeProp.name.getText(sf).includes("en-US") &&
              ts.isStringLiteral(localeProp.initializer)
            ) {
              intro = localeProp.initializer.text;
            }
          }
        }
      }
      if (id !== undefined && intro !== undefined && !websiteIntros.has(id)) {
        websiteIntros.set(id, intro);
      }
    }
    ts.forEachChild(node, collectIntros);
  };
  collectIntros(sf);
}
/* The examples files carry the intro under `meta:`, keyed by file name. Only
 * `meta.intro` counts: several files also have an `intro` key in their copy tables. */
const EXAMPLES_DIR = join(ROOT, "apps/website/src/examples");
for (const exampleFile of (await readdir(EXAMPLES_DIR).catch(() => [])).filter(
  (f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx"),
)) {
  const exampleName = exampleFile.replace(/\.tsx$/, "");
  if (websiteIntros.has(exampleName)) continue;
  const text = await readFile(join(EXAMPLES_DIR, exampleFile), "utf8").catch(() => "");
  if (text === "") continue;
  const sf = ts.createSourceFile(exampleFile, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  /**
   * @param {import("typescript").Node} node
   * @param {string} name
   * @returns {import("typescript").PropertyAssignment | undefined}
   */
  const property = (node, name) =>
    ts.isAsExpression(node) || ts.isSatisfiesExpression(node)
      ? property(node.expression, name)
      : ts.isObjectLiteralExpression(node)
      ? node.properties
          .filter(ts.isPropertyAssignment)
          .find((prop) => prop.name.getText(sf).replace(/["']/g, "") === name)
      : undefined;
  /* `intro: t.intro` — a copy-table reference; resolve it through the table's declaration. */
  /** @param {import("typescript").Node} node */
  const resolve = (node) => {
    if (!ts.isPropertyAccessExpression(node) || !ts.isIdentifier(node.expression)) return node;
    const table = node.expression.text;
    /** @type {import("typescript").Node | undefined} */
    let declaration;
    /** @param {import("typescript").Node} candidate */
    const findTable = (candidate) => {
      if (ts.isVariableDeclaration(candidate) && candidate.name.getText(sf) === table) {
        declaration = candidate.initializer;
      }
      if (declaration === undefined) ts.forEachChild(candidate, findTable);
    };
    findTable(sf);
    return declaration === undefined ? node : (property(declaration, node.name.text)?.initializer ?? node);
  };
  /** @type {string | undefined} */
  let intro;
  /** @param {import("typescript").Node} node */
  const findMetaIntro = (node) => {
    if (intro !== undefined) return;
    const isMeta =
      (ts.isPropertyAssignment(node) || ts.isVariableDeclaration(node)) &&
      node.name.getText(sf) === "meta" &&
      node.initializer !== undefined;
    if (isMeta) {
      const introProp = property(node.initializer, "intro");
      const en = introProp === undefined ? undefined : property(resolve(introProp.initializer), "en-US");
      if (en !== undefined && ts.isStringLiteral(en.initializer)) intro = en.initializer.text;
      return;
    }
    ts.forEachChild(node, findMetaIntro);
  };
  findMetaIntro(sf);
  if (intro !== undefined) websiteIntros.set(exampleName, intro);
}

/** @param {string} block */
const proseSentence = (block) => {
  const prose = block
    .split("\n")
    .map((line) => line.replace(/^\s*\*\s?/, "").trim())
    .filter((line) => line.length > 0 && !line.startsWith("═══") && !line.startsWith("──"))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (prose.length === 0) return undefined;
  const sentence = prose.match(/^.*?[.!?…](?:\s|$)/)?.[0]?.trim() ?? `${prose}.`;
  // A build directive or a one/two-word fragment is not a description; refuse
  // it so the resolver falls through to the website intro.
  if (/^no\s+["“]?use client|^["“]use client|^"use client"/i.test(sentence)) return undefined;
  if (sentence.split(/\s+/).length <= 2) return undefined;
  return sentence;
};

/** @param {string} source @param {string} name */
const registryDescription = (source, name) => {
  const pascal = name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  const sourceFile = ts.createSourceFile(
    `${name}.tsx`,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  for (const statement of sourceFile.statements) {
    const modifiers = ts.canHaveModifiers(statement) ? ts.getModifiers(statement) : undefined;
    const exported = modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );
    if (exported !== true) continue;
    // `Lumo` is the house prefix for root-level components; accept both spellings.
    const candidates = new Set([pascal, `Lumo${pascal}`]);
    const declaresNamedExport =
      (ts.isFunctionDeclaration(statement) && candidates.has(statement.name?.text ?? "")) ||
      (ts.isVariableStatement(statement) &&
        statement.declarationList.declarations.some(
          (declaration) => ts.isIdentifier(declaration.name) && candidates.has(declaration.name.text),
        ));
    if (!declaresNamedExport) continue;
    const doc = ts.getJSDocCommentsAndTags(statement).find(ts.isJSDoc);
    if (doc !== undefined) {
      const block = doc.getText(sourceFile).replace(/^\/\*\*/, "").replace(/\*\/$/, "");
      const sentence = proseSentence(block);
      if (sentence !== undefined) return sentence;
    }
  }
  const head = /\/\*\*([\s\S]*?)\*\//.exec(source);
  const firstImport = source.search(/^import /m);
  if (
    head?.[1] !== undefined &&
    (firstImport === -1 || source.indexOf(head[0]) < firstImport)
  ) {
    const sentence = proseSentence(head[1]);
    if (sentence !== undefined) return sentence;
  }
  const intro = websiteIntros.get(name);
  if (intro !== undefined) {
    // Intros are page paragraphs; the registry wants the opening sentence.
    const sentence = intro.match(/^.*?[.!?…](?:\s|$)/)?.[0]?.trim();
    return sentence ?? intro;
  }
  return "Lumo registry item.";
};

const items = [];
for (const { dir, type, target } of SOURCES) {
  /** @type {string[]} */
  const all = await readdir(dir).catch(() => []);
  const files = all.filter(
    (f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx") && !f.endsWith(".type-test.tsx"),
  );
  for (const file of files.sort()) {
  const name = file.replace(/\.tsx$/, "");
  const source = await readFile(join(dir, file), "utf8");

  /*
   * A component's imports are its OWN plus its companions': scanning only the
   * `.tsx` declared zero dependencies for anything a companion alone imports
   * (`class-variance-authority` silently left the `table` item when `cva()`
   * moved into `table.variants.ts`).
   */
  /** @type {string[]} */
  const shippedFileNames = [file];
  const variantFile = file.replace(/\.tsx$/, ".variants.ts");
  if (all.includes(variantFile)) shippedFileNames.push(variantFile);

  // Follow the carried-file closure so dependency metadata describes every byte shipped.
  /** @type {Map<string, string>} */
  const sourceByFile = new Map([[file, source]]);
  for (let index = 0; index < shippedFileNames.length; index += 1) {
    const shipped = shippedFileNames[index];
    if (shipped === undefined) continue;
    const shippedSource =
      sourceByFile.get(shipped) ?? await readFile(join(dir, shipped), "utf8");
    sourceByFile.set(shipped, shippedSource);
    for (const specifier of importSpecifiers(shippedSource, shipped)) {
      if (!specifier.startsWith("./")) continue;
      const localFile = specifier.replace(/^\.\//, "");
      if (
        SHARED_COMPANIONS.has(localFile) &&
        all.includes(localFile) &&
        !shippedFileNames.includes(localFile)
      ) {
        shippedFileNames.push(localFile);
      }
    }
  }

  const imports = shippedFileNames.flatMap((shipped) =>
    importSpecifiers(sourceByFile.get(shipped) ?? "", shipped),
  );
  // Subpath-aware: `@base-ui/react/select` must match the `@base-ui/react` entry,
  // or the item declares zero dependencies for it.
  /** @param {string} spec @returns {string} */
  const packageOf = (spec) => {
    const parts = spec.split("/");
    // `?? spec`: `parts[0]` is `string | undefined` under noUncheckedIndexedAccess.
    return spec.startsWith("@") ? parts.slice(0, 2).join("/") : (parts[0] ?? spec);
  };
  const dependencies = [
    ...new Set(imports.map(packageOf).filter((i) => EXTERNAL.has(i))),
  ].sort();
  const registryDependencies = [
    ...new Set(
      imports
        .filter((i) => i.startsWith("./"))
        .map((i) => i.replace(/^\.\//, "").replace(/\.(?:tsx?|jsx?)$/, ""))
        // A companion import names its OWNER item; there is no item "x.variants".
        .map((i) => i.replace(/\.variants$/, ""))
        // A shared companion is carried as a FILE, never named as an item.
        .filter((i) => !SHARED_COMPANIONS.has(`${i}.ts`) && !SHARED_COMPANIONS.has(i))
        // A file's own companion is itself, not a dependency.
        .filter((i) => i !== name),
    ),
  ].sort();

  // @lumo-ui/core is a package, not a copy-in item: invariants a consumer must NOT diverge from.
  if (imports.includes("@lumo-ui/core")) dependencies.push("@lumo-ui/core");
  // @lumo-ui/base-ui-ssr is a package for the opposite reason: a copied workaround outlives its bug.
  if (imports.includes("@lumo-ui/base-ui-ssr")) dependencies.push("@lumo-ui/base-ui-ssr");
  // A block composes shipped components, so it depends on the library as a package.
  if (imports.includes("@lumo-ui/ui")) dependencies.push("@lumo-ui/ui");

  items.push({
    name,
    type,
    title: name.replace(/(^|-)(\w)/g, (_, d, c) => (d ? " " : "") + c.toUpperCase()).trim(),
    description: registryDescription(source, name),
    author: "Telarsa",
    ...(dependencies.length ? { dependencies: [...new Set(dependencies)].sort() } : {}),
    ...(registryDependencies.length ? { registryDependencies } : {}),
    // Companion modules travel WITH the component: a consumer who copies
    // button.tsx without button.variants.ts receives a broken import.
    files: [
      { path: `${relative(ROOT, dir)}/${file}`, type, target: `${target}/${file}` },
      ...shippedFileNames
        .filter((shipped) => shipped !== file)
        .map((f) => ({ path: `${relative(ROOT, dir)}/${f}`, type, target: `${target}/${f}` })),
    ],
  });
  }
}

const registry = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "lumo",
  homepage: "https://lumo-ui.com",
  items,
};

const serialized = JSON.stringify(registry, null, 2) + "\n";
if (checkOnly) {
  const current = await readFile(registryPath, "utf8").catch(() => "");
  if (current !== serialized) {
    console.error(`  registry: ${registryPath} is stale; run node scripts/build-registry.mjs`);
    process.exit(1);
  }
} else {
  await writeFile(registryPath, serialized);
}

// A registry that lists nothing would publish silently; refuse, as the gate refuses an empty build.
if (items.length === 0) {
  console.error("  registry: no components found — refusing to emit an empty manifest");
  process.exit(1);
}

console.log(`  registry: ${items.length} item(s)`);
for (const item of items) {
  const deps = [...(item.dependencies ?? []), ...(item.registryDependencies ?? [])];
  console.log(`    ${item.name.padEnd(18)} ${deps.length ? deps.join(", ") : "no dependencies"}`);
}
