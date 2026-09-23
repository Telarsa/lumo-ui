/*
 * `lumo doctor` CHECKS THE WIRING, NOT ONLY THE PIN.
 *
 * Every finding here is a CI failure that happened on the day a consumer took
 * Lumo as a private git dependency, and every one was visible in the working
 * tree before the push. The fixtures are those trees, reduced.
 */
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const MOD = fileURLToPath(new URL("../../../scripts/lib/doctor-wiring.mjs", import.meta.url));
const REPO = fileURLToPath(new URL("../../../", import.meta.url));
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
    // A consumer's served-byte grader passes gate.floors.json from inside the
    // script. The script itself was missing from this fixture until 23 Sep
    // 2026, when the doctor started reading what a gate runs: the consumer this
    // came from spawns `lumo-cli.mjs gate` with path segments, as here.
    const root = consumer({ transpile: true, tsExt: true, floors: "beside", token: "both", shells: true, gate: "pnpm run build && node scripts/grade-served.mjs" });
    mkdirSync(join(root, "scripts"));
    writeFileSync(join(root, "scripts", "grade-served.mjs"), 'spawn(process.execPath, [join("node_modules", "lumo-ui", "scripts", "lumo-cli.mjs"), "gate", stage, floors]);');
    expect(checkWiring(root)).toEqual([]);
  });

  it("a gate that never runs Lumo is reported as ungraded, not as missing a floors file", () => {
    // Observed on a consumer's console app: `pnpm build && node
    // scripts/grade-served.mjs`, a script of its own assertions with no Lumo in
    // it. The doctor failed it for "no floors file", a file nothing would read,
    // and so never said the true thing: Lumo grades none of its pages. The build
    // owning its error shells must not count as grading, which is why this
    // fixture keeps `own-error-shells` (Lumo's, but not the grader) in `build`.
    const root = consumer({ transpile: true, tsExt: true, floors: "missing", token: "both", shells: true, gate: "pnpm build && node scripts/grade-served.mjs" });
    mkdirSync(join(root, "scripts"));
    writeFileSync(join(root, "scripts", "grade-served.mjs"), 'import assert from "node:assert/strict"; assert.match(html, /dir="rtl"/);');
    const f = checkWiring(root);
    expect(f.filter((x) => x.level === "hard")).toEqual([]);
    expect(f).toEqual([expect.objectContaining({ level: "soft", what: expect.stringMatching(/no call to Lumo's grader was found in what this gate runs/) })]);
  });

  it("still holds a floors file beside package.json to its settings when no grader call is found", () => {
    // The trace cannot follow every route to Lumo (a test runner importing
    // `lumo-ui/gate`, say). A floors file on disk says something reads it, so
    // an untraced gate does not switch its check off.
    const root = consumer({ transpile: true, tsExt: true, floors: "noMin", token: "both", shells: true, gate: "node scripts/grade-served.mjs" });
    mkdirSync(join(root, "scripts"));
    writeFileSync(join(root, "scripts", "grade-served.mjs"), 'import assert from "node:assert/strict"; assert.match(html, /dir="rtl"/);');
    expect(checkWiring(root)).toEqual([
      expect.objectContaining({ level: "soft", what: expect.stringMatching(/no call to Lumo's grader was found/) }),
      expect.objectContaining({ level: "hard", what: expect.stringMatching(/@min-documents/) }),
    ]);
  });

  it("does not take a route list handed to a local grader for its floors file", () => {
    // Observed on a consumer's console app, 23 Sep 2026: its gate hands a
    // route list to a script that runs `grade-app` and reads gate.floors.json
    // from beside package.json itself. The doctor read the route list as the
    // floors file and failed it twice for settings a route list never has.
    const root = consumer({ transpile: true, tsExt: true, floors: "beside", token: "both", shells: true, gate: "node scripts/grade-served.mjs apps/console 3110 fa-IR gate.routes.json" });
    mkdirSync(join(root, "scripts"));
    writeFileSync(join(root, "scripts", "grade-served.mjs"), 'spawnSync(process.execPath, [join(root, "node_modules/lumo-ui/scripts/grade-app.mjs"), stage, "fa-IR", join(app, "gate.floors.json")]);');
    writeFileSync(join(root, "gate.routes.json"), JSON.stringify(["/", "/issues", "/this-route-does-not-exist"]));
    expect(checkWiring(root)).toEqual([]);
  });

  it("takes the floors file from the command segment that grades, not from an earlier one", () => {
    // One line, two JSON arguments: the tsconfig belongs to `tsc`, the floors
    // file to the gate. The first `.json` on the line used to win.
    const root = consumer({ transpile: true, tsExt: true, floors: "ok", token: "both", shells: true, gate: "tsc -p tsconfig.json && lumo gate out gate.floors.json" });
    expect(checkWiring(root)).toEqual([]);
  });

  it("follows a gate into the package's own scripts, and reads the floors from the grader's command", () => {
    // `tsc -p tsconfig.json` in the build step must not be taken for the floors file.
    const base = { transpile: true, tsExt: true, token: "both" as const, shells: true, gate: "pnpm run build && pnpm run grade" };
    const graded = consumer({ ...base, floors: "ok" });
    const pkgPath = join(graded, "package.json");
    const withScripts = (floorsName: string) => {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { scripts: Record<string, string> };
      pkg.scripts.build = "tsc -p tsconfig.json && next build && node node_modules/lumo-ui/scripts/own-error-shells.mjs .next --error error-shell.html";
      pkg.scripts.grade = `lumo gate out ${floorsName}`;
      writeFileSync(pkgPath, JSON.stringify(pkg));
    };
    withScripts("gate.floors.json");
    expect(checkWiring(graded)).toEqual([]);
    withScripts("gate.served.floors.json");
    expect(checkWiring(graded).map((x) => x.what)).toEqual([expect.stringMatching(/missing or unparsable/)]);
  });

  it("a static export is not told to own a server build's error shells", () => {
    // Observed on two consumers with `output: "export"`: the doctor advised
    // `own-error-shells .next`, which rewrites `.next/server`. An export has no
    // server and its 404 documents are in `out/`, graded by the gate itself.
    const root = consumer({ transpile: true, tsExt: true, floors: "ok", token: "both", shells: false });
    writeFileSync(join(root, "next.config.ts"), 'export default { output: "export", transpilePackages: ["lumo-ui"] }');
    expect(checkWiring(root)).toEqual([]);
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

/*
 * The lint policy, read the way ESLint reads it.
 *
 * Observed on three configs in one consumer: each spread Lumo's policy and then
 * declared its own `no-restricted-syntax` for the same files. ESLint applies
 * the later options INSTEAD of Lumo's, so all five of Lumo's selectors were
 * off, while the import the doctor looked for was right there and it passed.
 * These fixtures give the consumer a real ESLint and a real `lumo-ui` (linked
 * to this checkout), because the whole point is what ESLint computes.
 *
 * Without an ESLint to ask, the doctor stays silent on this question rather
 * than guessing; every fixture above has none, which is that case.
 */
describe("the lint policy is checked in effect, not by its import", () => {
  const ESLINT_DIR = realpathSync(dirname(createRequire(join(REPO, "package.json")).resolve("eslint/package.json")));
  const OWN_BAN = '{ selector: "JSXAttribute[name.name=\'dangerouslySetInnerHTML\']", message: "No raw HTML." }';

  function linted(config: string) {
    const root = consumer({ transpile: true, tsExt: true, floors: "ok", token: "none", shells: true });
    mkdirSync(join(root, "node_modules"));
    symlinkSync(ESLINT_DIR, join(root, "node_modules", "eslint"), "dir");
    symlinkSync(realpathSync(REPO), join(root, "node_modules", "lumo-ui"), "dir");
    writeFileSync(join(root, "eslint.config.mjs"), config);
    return root;
  }

  it("reports a config whose own no-restricted-syntax replaces Lumo's selectors", () => {
    const root = linted(
      'import lumo from "lumo-ui/config/eslint";\n' +
      `export default [...lumo, { files: ["**/*.{ts,tsx}"], rules: { "no-restricted-syntax": ["error", ${OWN_BAN}] } }];\n`,
    );
    expect(checkWiring(root)).toEqual([
      expect.objectContaining({ level: "soft", where: "eslint.config.mjs", what: expect.stringMatching(/5 of its 5 selectors are not in effect for src\/layout\.tsx/) }),
    ]);
  }, 30_000);

  it("accepts the same config once Lumo's selectors are merged into its own", () => {
    const root = linted(
      'import lumo, { lumoRules } from "lumo-ui/config/eslint";\n' +
      `export default [...lumo, { files: ["**/*.{ts,tsx}"], rules: { "no-restricted-syntax": ["error", ...lumoRules["no-restricted-syntax"].slice(1), ${OWN_BAN}] } }];\n`,
    );
    expect(checkWiring(root)).toEqual([]);
  }, 30_000);

  it("measures the app against the selectors of the lumo-ui it installed, not this checkout's", () => {
    // `lumo doctor --to <app>` can run from a checkout at another version than
    // the app's pin. Measured against this checkout, a correctly wired app on
    // an older or newer policy would have every selector reported missing.
    const root = consumer({ transpile: true, tsExt: true, floors: "ok", token: "none", shells: true });
    const pinned = join(root, "node_modules", "lumo-ui");
    mkdirSync(pinned, { recursive: true });
    symlinkSync(ESLINT_DIR, join(root, "node_modules", "eslint"), "dir");
    writeFileSync(join(pinned, "package.json"), JSON.stringify({ name: "lumo-ui", type: "module", exports: { "./config/eslint": "./lumo.mjs" } }));
    writeFileSync(join(pinned, "lumo.mjs"),
      'export const lumoRules = { "no-restricted-syntax": ["error", { selector: "JSXOpeningElement[name.name=\'html\']", message: "Use LumoHtml." }] };\n' +
      'export default [{ files: ["**/*.{ts,tsx,js,jsx,mjs}"], rules: lumoRules }];\n');
    writeFileSync(join(root, "eslint.config.mjs"), 'import lumo from "lumo-ui/config/eslint";\nexport default [...lumo];\n');
    expect(checkWiring(root)).toEqual([]);
    writeFileSync(join(root, "eslint.config.mjs"),
      'import lumo from "lumo-ui/config/eslint";\n' +
      `export default [...lumo, { files: ["**/*.{ts,tsx}"], rules: { "no-restricted-syntax": ["error", ${OWN_BAN}] } }];\n`);
    expect(checkWiring(root)).toEqual([
      expect.objectContaining({ level: "soft", what: expect.stringMatching(/1 of its 1 selectors are not in effect/) }),
    ]);
  }, 30_000);
});
