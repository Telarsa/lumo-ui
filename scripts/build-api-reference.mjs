#!/usr/bin/env node
/**
 * Generates the component prop reference from the exported TypeScript API.
 *
 * The website's hand-authored API table describes parts and intent. This file
 * supplies the other half mechanically: every exported `*Props` type, every
 * usable Lumo-authored property on it, its resolved type, and whether omission
 * is legal. Reading through the checker means inherited shared behavior is
 * included while React's generic DOM event catalogue is not repeated on every
 * component page.
 */

import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import ts from "typescript";

const ROOT = new URL("..", import.meta.url).pathname;
const UI_ROOT = join(ROOT, "packages", "ui");
const CORE_SRC = join(ROOT, "packages", "core", "src");
const UI_SRC = join(UI_ROOT, "src");
const INDEX = join(UI_SRC, "index.ts");
const outputFlag = process.argv.indexOf("--api");
const OUTPUT =
  outputFlag === -1 ? join(ROOT, "api-reference.json") : process.argv[outputFlag + 1];
if (OUTPUT === undefined) {
  console.error("  api-reference: --api requires a path");
  process.exit(2);
}
const checkOnly = process.argv.includes("--check");

const configFile = ts.readConfigFile(join(UI_ROOT, "tsconfig.json"), ts.sys.readFile);
if (configFile.error !== undefined) {
  throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, "\n"));
}
const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, UI_ROOT);
const program = ts.createProgram(config.fileNames, config.options);
const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length > 0) {
  throw new Error(
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (file) => file,
      getCurrentDirectory: () => ROOT,
      getNewLine: () => "\n",
    }),
  );
}
const checker = program.getTypeChecker();
const indexFile = program.getSourceFile(INDEX);
if (indexFile === undefined) throw new Error(`api-reference: cannot read ${INDEX}`);

/** @type {Map<string, string[]>} */
const propsByModule = new Map();
for (const statement of indexFile.statements) {
  if (
    !ts.isExportDeclaration(statement) ||
    statement.moduleSpecifier === undefined ||
    !ts.isStringLiteral(statement.moduleSpecifier) ||
    statement.exportClause === undefined ||
    !ts.isNamedExports(statement.exportClause)
  ) {
    continue;
  }
  const specifier = statement.moduleSpecifier.text;
  if (!specifier.startsWith("./")) continue;
  const moduleName = specifier.slice(2);
  const names = statement.exportClause.elements
    .filter((element) => statement.isTypeOnly || element.isTypeOnly)
    .map((element) => element.name.text)
    .filter((name) => name.endsWith("Props"));
  if (names.length === 0) continue;
  propsByModule.set(moduleName, [...(propsByModule.get(moduleName) ?? []), ...names]);
}

/** @param {ts.Symbol} symbol */
function isLumoAuthored(symbol) {
  return (symbol.getDeclarations() ?? []).some((declaration) => {
    const file = resolve(declaration.getSourceFile().fileName);
    return file.startsWith(UI_SRC) || file.startsWith(CORE_SRC);
  });
}

/** @param {ts.Type} type */
function isOnlyUndefined(type) {
  if ((type.flags & ts.TypeFlags.Undefined) !== 0) return true;
  return type.isUnion() && type.types.every((member) => (member.flags & ts.TypeFlags.Undefined) !== 0);
}

/*
 * Undocumented props, split by WHO owes the documentation.
 *
 * The old single filler — "Inherited DOM or shared Lumo prop." — was applied
 * to 1,191 of 2,520 props, and for Lumo-authored ones it was simply false:
 * `MultiSelectProps.maxValues` is not inherited from anything. An inherited
 * external prop legitimately points at the platform's documentation; a
 * Lumo-authored prop with no docblock is documentation DEBT, named as such
 * and counted, so the number can only be ratcheted down (see the check
 * against `api-docs.floor.json` below).
 */
let undocumentedLumoProps = 0;
/*
 * House-vocabulary names whose meaning is a LIBRARY RULE, not a per-component
 * decision — so one sentence is accurate at every declaration site. Only
 * names with genuinely uniform semantics belong here: `children` is absent
 * because several components take render-prop children, and `value`/`size`/
 * `variant` are absent because they mean different things per component.
 * A prop's own docblock always wins; this is the fallback.
 */
const HOUSE_VOCABULARY = new Map([
  ["className", "Additional classes merged onto the component's root element."],
  ["isDisabled", "Disables the control: it cannot be interacted with and is announced as disabled."],
  ["locale", "The BCP-47 locale this component renders in. Drives direction, calendar system, and digit shaping."],
  ["ref", "A ref to the component's root element."],
  ["aria-controls", "Standard ARIA attribute, forwarded to the element that carries the role."],
  ["aria-haspopup", "Standard ARIA attribute, forwarded to the element that carries the role."],
  ["aria-expanded", "Standard ARIA attribute, forwarded to the element that carries the role."],
  ["aria-disabled", "Standard ARIA attribute, forwarded to the element that carries the role."],
  ["aria-pressed", "Standard ARIA attribute, forwarded to the element that carries the role."],
  ["aria-current", "Standard ARIA attribute, forwarded to the element that carries the role."],
  ["aria-describedby", "Standard ARIA attribute, forwarded to the element that carries the role."],
  ["aria-label", "Standard ARIA attribute, forwarded to the element that carries the role."],
  ["aria-labelledby", "Standard ARIA attribute, forwarded to the element that carries the role."],
  ["aria-details", "Standard ARIA attribute, forwarded to the element that carries the role."],
  ["aria-activedescendant", "Standard ARIA attribute, forwarded to the element that carries the role."],
  ["aria-autocomplete", "Standard ARIA attribute, forwarded to the element that carries the role."],
  ["description", "Help text rendered under the field and linked to it via aria-describedby."],
  ["placeholder", "Text shown in the empty control before the reader enters or picks a value."],
  ["formAction", "Standard form-submission override, forwarded to the underlying control."],
  ["formEncType", "Standard form-submission override, forwarded to the underlying control."],
  ["formMethod", "Standard form-submission override, forwarded to the underlying control."],
  ["formNoValidate", "Standard form-submission override, forwarded to the underlying control."],
  ["formTarget", "Standard form-submission override, forwarded to the underlying control."],
]);
/** @param {ts.Symbol} symbol @param {string} typeText */
function descriptionOf(symbol, typeText) {
  /*
   * The public description is the docblock's FIRST PARAGRAPH — the summary,
   * by JSDoc convention. Later paragraphs are engineering notes for the next
   * maintainer ("Redeclared from the variants because the checker loses…",
   * the upstream-issue reasoning behind `dismissLabel`) and the reevaluation
   * found them rendered verbatim into the docs table. Accurate, but not
   * documentation. Line breaks inside the paragraph collapse to spaces.
   */
  const full = ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();
  const own = full.split(/\n\s*\n/)[0]?.replace(/\s*\n\s*/g, " ").trim() ?? "";
  if (own.length > 0) return own;
  if (isLumoAuthored(symbol)) {
    const shared = HOUSE_VOCABULARY.get(symbol.name);
    if (shared !== undefined) return shared;
    // Plain `children: LumoNode` is house vocabulary too, but ONLY at that
    // exact type: render-prop children ((item) => LumoNode) and constrained
    // unions mean something component-specific and stay counted as debt.
    if (symbol.name === "children" && /^LumoNode( \| undefined)?$/.test(typeText)) {
      return "The content this component renders.";
    }
    undocumentedLumoProps += 1;
    return "Lumo prop — docblock pending.";
  }
  return "Inherited from the DOM surface of the element this component renders.";
}

/** @type {Record<string, Array<{name: string, props: Array<{name: string, type: string, required: boolean}>}>>} */
const modules = {};
for (const [moduleName, propsNames] of [...propsByModule].sort(([a], [b]) => a.localeCompare(b))) {
  const sourcePath = join(UI_SRC, moduleName);
  const sourceFile = program.getSourceFile(sourcePath);
  const moduleSymbol = sourceFile === undefined ? undefined : checker.getSymbolAtLocation(sourceFile);
  if (sourceFile === undefined || moduleSymbol === undefined) {
    throw new Error(`api-reference: cannot resolve exported module ${moduleName}`);
  }
  const exports = checker.getExportsOfModule(moduleSymbol);
  const groups = [];
  for (const propsName of [...new Set(propsNames)].sort()) {
    const symbol = exports.find((candidate) => candidate.name === propsName);
    if (symbol === undefined) {
      throw new Error(`api-reference: ${moduleName} does not export ${propsName}`);
    }
    const declaration = symbol.getDeclarations()?.[0];
    if (declaration === undefined) continue;
    const type = checker.getDeclaredTypeOfSymbol(symbol);
    const props = checker
      .getPropertiesOfType(type)
      .filter(isLumoAuthored)
      .map((prop) => {
        const propDeclaration = prop.getDeclarations()?.[0] ?? declaration;
        const propType = checker.getTypeOfSymbolAtLocation(prop, propDeclaration);
        return { prop, propDeclaration, propType };
      })
      .filter(({ propType }) => !isOnlyUndefined(propType))
      .map(({ prop, propDeclaration, propType }) => {
        const typeText = checker.typeToString(
          propType,
          propDeclaration,
          ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope,
        );
        return {
          name: prop.name,
          type: typeText,
          required: (prop.flags & ts.SymbolFlags.Optional) === 0,
          description: descriptionOf(prop, typeText),
        };
      })
      .sort((a, b) => Number(b.required) - Number(a.required) || a.name.localeCompare(b.name));
    if (props.length > 0) groups.push({ name: propsName, props });
  }
  if (groups.length > 0) modules[moduleName] = groups;
}

const generated = `${JSON.stringify({ version: 1, modules }, null, 2)}\n`;

/*
 * The documentation-debt ratchet. `api-docs.floor.json` holds the highest
 * tolerated count of Lumo-authored props without a docblock. Adding an
 * undocumented prop fails the build; documenting props lets the floor be
 * lowered, and lowering it is a reviewed line in the diff — the same
 * one-way arrangement the digit floors use.
 */
const FLOOR_PATH = join(ROOT, "api-docs.floor.json");
const floor = JSON.parse(await readFile(FLOOR_PATH, "utf8"));
if (undocumentedLumoProps > floor.maxUndocumentedLumoProps) {
  console.error(
    `  api-reference: ${undocumentedLumoProps} Lumo-authored props lack a docblock, ` +
      `above the floor of ${floor.maxUndocumentedLumoProps}. Document the new ones.`,
  );
  process.exit(1);
}
console.log(
  `  api-reference: ${undocumentedLumoProps}/${floor.maxUndocumentedLumoProps} undocumented Lumo props (ratchet)`,
);

if (checkOnly) {
  const existing = await readFile(OUTPUT, "utf8").catch(() => "");
  if (existing !== generated) {
    console.error("  api-reference: stale — run `node scripts/build-api-reference.mjs`");
    process.exit(1);
  }
  console.log(`  api-reference: ${Object.keys(modules).length} module(s) checked`);
} else {
  await writeFile(OUTPUT, generated);
  console.log(`  api-reference: wrote ${Object.keys(modules).length} module(s)`);
}
