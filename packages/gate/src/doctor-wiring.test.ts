/*
 * `lumo doctor` CHECKS THE WIRING, NOT ONLY THE PIN.
 *
 * Every finding here is a CI failure that happened on the day a consumer took
 * Lumo as a private git dependency, and every one was visible in the working
 * tree before the push. The fixtures are those trees, reduced.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const MOD = fileURLToPath(new URL("../../../scripts/lib/doctor-wiring.mjs", import.meta.url));
const { checkWiring } = (await import(MOD)) as { checkWiring: (root: string) => Array<{ level: string; where: string; what: string }> };

const TOKEN_STEP = `      - run: git config --global url."https://x-access-token:\${{ secrets.LUMO_UI_TOKEN }}@github.com/Telarsa/lumo-ui".insteadOf "https://github.com/Telarsa/lumo-ui"\n`;

function consumer(opts: { transpile: boolean; tsExt: boolean; floors: "ok" | "missing" | "noMin" | "noLocales" | "beside"; token: "both" | "web-only" | "none"; shells: boolean; imports?: boolean; gate?: string }) {
  const root = mkdtempSync(join(tmpdir(), "lumo-doctor-"));
  mkdirSync(join(root, ".github", "workflows"), { recursive: true });
  writeFileSync(join(root, "package.json"), JSON.stringify({
    name: "consumer",
    dependencies: { "lumo-ui": "github:Telarsa/lumo-ui#v0.5.0" },
    scripts: {
      build: opts.shells ? "next build && node node_modules/lumo-ui/scripts/own-error-shells.mjs .next --error error-shell.html" : "next build",
      gate: opts.gate ?? (opts.floors === "missing" || opts.floors === "beside" ? "node node_modules/lumo-ui/scripts/grade-app.mjs .next/server/app en" : "node node_modules/lumo-ui/scripts/grade-app.mjs .next/server/app en gate.floors.json"),
    },
  }));
  writeFileSync(join(root, "next.config.ts"), opts.transpile ? 'export default { transpilePackages: ["lumo-ui"] }' : "export default {}");
  writeFileSync(join(root, "tsconfig.json"), JSON.stringify({ compilerOptions: opts.tsExt ? { allowImportingTsExtensions: true } : {} }));
  if (opts.floors === "ok" || opts.floors === "beside") writeFileSync(join(root, "gate.floors.json"), JSON.stringify({ "@min-documents": 10, "@locales": ["en", "fa"] }));
  if (opts.floors === "noMin") writeFileSync(join(root, "gate.floors.json"), JSON.stringify({ "@locales": ["en"] }));
  if (opts.floors === "noLocales") writeFileSync(join(root, "gate.floors.json"), JSON.stringify({ "@min-documents": 10 }));
  writeFileSync(join(root, "eslint.config.mjs"), 'import lumo from "lumo-ui/config/eslint"; export default [...lumo];');
  mkdirSync(join(root, "src"), { recursive: true });
  if (opts.imports !== false) writeFileSync(join(root, "src", "layout.tsx"), 'import { direction } from "lumo-ui/core";');
  const web = `  web:\n    steps:\n${opts.token !== "none" ? TOKEN_STEP : ""}      - run: pnpm install --frozen-lockfile\n`;
  const app = `  app:\n    steps:\n${opts.token === "both" ? TOKEN_STEP : ""}      - run: flutter pub get\n`;
  writeFileSync(join(root, ".github", "workflows", "ci.yml"), `name: CI\non: [push]\njobs:\n${web}${app}`);
  return root;
}

describe("checkWiring", () => {
  it("a correctly wired consumer has no findings", () => {
    expect(checkWiring(consumer({ transpile: true, tsExt: true, floors: "ok", token: "both", shells: true }))).toEqual([]);
  });

  it("reports the hard failures of first contact, by name", () => {
    const f = checkWiring(consumer({ transpile: false, tsExt: false, floors: "missing", token: "none", shells: false }));
    const hard = f.filter((x) => x.level === "hard").map((x) => x.what);
    expect(hard).toEqual(expect.arrayContaining([
      expect.stringMatching(/transpilePackages/),
      expect.stringMatching(/allowImportingTsExtensions/),
      expect.stringMatching(/no floors file/),
    ]));
  });

  it("asks for no credential: Lumo is a public dependency", () => {
    // It was private until 1.0.0, and a job that installed without the
    // credential died at "could not read Username for 'https://github.com'".
    // A public install needs none, so a workflow with no token is now correct
    // and the doctor must not demand a secret nobody needs.
    const f = checkWiring(consumer({ transpile: true, tsExt: true, floors: "ok", token: "none", shells: true }));
    expect(f).toEqual([]);
  });

  it("a floors file without @min-documents, and one without @locales, are each named", () => {
    expect(checkWiring(consumer({ transpile: true, tsExt: true, floors: "noMin", token: "both", shells: true })).map((x) => x.what)).toEqual([expect.stringMatching(/@min-documents/)]);
    expect(checkWiring(consumer({ transpile: true, tsExt: true, floors: "noLocales", token: "both", shells: true })).map((x) => x.what)).toEqual([expect.stringMatching(/@locales/)]);
  });

  it("missing error shells is advice, not a failure", () => {
    const f = checkWiring(consumer({ transpile: true, tsExt: true, floors: "ok", token: "both", shells: false }));
    expect(f).toEqual([expect.objectContaining({ level: "soft", what: expect.stringMatching(/error shells/) })]);
  });

  it("a grader-only consumer — no import of Lumo source — needs neither transpile nor the ts flag", () => {
    // Two consumers' web apps: they run Lumo's scripts and import none of
    // its modules. A finding there could never fail a build.
    expect(checkWiring(consumer({ transpile: false, tsExt: false, floors: "ok", token: "both", shells: true, imports: false }))).toEqual([]);
  });

  it("a gate script that only delegates to a workspace child is not a gate", () => {
    // A consumer's monorepo root: `pnpm --filter @app/website gate`.
    expect(checkWiring(consumer({ transpile: true, tsExt: true, floors: "missing", token: "both", shells: true, gate: "pnpm --filter @app/website gate" }))).toEqual([]);
  });

  it("a floors file the script reads from beside package.json counts", () => {
    // A consumer's served-byte grader passes gate.floors.json from inside the script.
    expect(checkWiring(consumer({ transpile: true, tsExt: true, floors: "beside", token: "both", shells: true, gate: "node scripts/grade-served.mjs" }))).toEqual([]);
  });

  it("a workspace root with a solution tsconfig is not blamed for a child's import", () => {
    // A consumer's monorepo: root package.json declares lumo-ui, root tsconfig is
    // `{ "files": [], "references": [...] }`, and the only import is in
    // apps/website, which carries the flag itself.
    const root = mkdtempSync(join(tmpdir(), "lumo-doctor-root-"));
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "root", dependencies: { "lumo-ui": "github:Telarsa/lumo-ui#v0.5.0" }, scripts: { gate: "pnpm --filter site gate" } }));
    writeFileSync(join(root, "tsconfig.json"), JSON.stringify({ files: [], references: [{ path: "./apps/site" }] }));
    mkdirSync(join(root, "apps", "site", "src"), { recursive: true });
    writeFileSync(join(root, "apps", "site", "package.json"), JSON.stringify({ name: "site", dependencies: { "lumo-ui": "github:Telarsa/lumo-ui#v0.5.0" }, scripts: { gate: "node node_modules/lumo-ui/scripts/grade-app.mjs .next/server/app en gate.floors.json" } }));
    writeFileSync(join(root, "apps", "site", "tsconfig.json"), JSON.stringify({ compilerOptions: { allowImportingTsExtensions: true } }));
    writeFileSync(join(root, "apps", "site", "gate.floors.json"), JSON.stringify({ "@min-documents": 3, "@locales": ["en", "fa"] }));
    writeFileSync(join(root, "apps", "site", "src", "a.tsx"), 'import { direction } from "lumo-ui/core";');
    expect(checkWiring(root)).toEqual([]);
  });
});
