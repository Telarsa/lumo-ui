/**
 * TypeScript-AST readers shared by the build scripts.
 *
 * `importSpecifiers` lived twice — byte-for-byte, in `build-registry.mjs` and
 * `smoke-consumer.mjs` — and the two answer questions that MUST agree: the
 * registry declares what a consumer will need to install, and the smoke test
 * checks that a consumer given exactly that can build. Two copies of the parser
 * behind those two answers is the one place a drift would be silent, because
 * each side would still be internally consistent.
 */
import ts from "typescript";

/**
 * Every module specifier a source file really imports — `import`, `export … from`,
 * and dynamic `import()`.
 *
 * Parsed, never matched with a regular expression: prose and examples inside
 * comments are not imports, and a docblock that says `import { Button } from
 * "@lumo-ui/ui"` must not add a dependency to anything.
 *
 * @param {string} source
 * @param {string} fileName
 * @returns {string[]}
 */
export const importSpecifiers = (source, fileName) => {
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
