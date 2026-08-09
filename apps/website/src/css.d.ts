/**
 * Side-effect CSS imports.
 *
 * The workspace tsconfig sets `verbatimModuleSyntax`, under which TypeScript
 * refuses a side-effect import it has no declaration for. Next normally supplies
 * this through its own ambient types; declaring it here keeps the strict setting
 * — which is what makes the LumoNode and exactOptionalPropertyTypes guarantees
 * possible — rather than loosening the whole project to import a stylesheet.
 */
declare module "*.css";
