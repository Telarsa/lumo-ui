import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { stageDocuments } from "./grade-static.mjs";

function fixture(run) {
  const root = mkdtempSync(join(tmpdir(), "telarsa-website-gate-test-"));
  const source = join(root, "source");
  for (const locale of ["en", "fa"]) mkdirSync(join(source, locale), { recursive: true });
  writeFileSync(
    join(source, "index.html"),
    '<html lang="en" dir="ltr"><head><meta http-equiv="refresh" content="0;url=/en/"></head><body>Go</body></html>',
  );
  writeFileSync(
    join(source, "en/index.html"),
    '<html lang="en" dir="ltr"><body>English product page</body></html>',
  );
  writeFileSync(
    join(source, "fa/index.html"),
    '<html lang="fa" dir="rtl"><body>صفحهٔ محصول</body></html>',
  );
  try {
    run(root, source);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("root redirect and English homepage keep distinct bytes", () =>
  fixture((root, source) => {
    const target = join(root, "stage");
    const mappings = stageDocuments(source, target);
    assert.equal(mappings.length, 3);
    assert.equal(new Set(mappings.map((m) => m.destination)).size, 3);
    assert.match(readFileSync(join(target, "en/index.html"), "utf8"), /English product page/);
    assert.match(readFileSync(join(target, "en/__unlocalized__/index.html"), "utf8"), /http-equiv/);
  }));

test("real Lumo grader rejects an invalid English page even beside a root redirect", () =>
  fixture((root, source) => {
    const floors = join(root, "floors.json");
    writeFileSync(floors, JSON.stringify({ "@locales": ["en", "fa"], "@min-documents": 2 }));
    const script = join(dirname(fileURLToPath(import.meta.url)), "grade-static.mjs");
    const invoke = () =>
      spawnSync(process.execPath, [script, source, floors], { encoding: "utf8" });
    const good = invoke();
    assert.equal(good.status, 0, good.stdout + good.stderr);
    writeFileSync(
      join(source, "en/index.html"),
      '<html lang="fa" dir="rtl"><body>صفحهٔ محصول</body></html>',
    );
    const bad = invoke();
    assert.notEqual(bad.status, 0, "The English route must not disappear behind the redirect");
    assert.match(bad.stdout + bad.stderr, /lang-dir/);
  }));

test("missing localized homepage is a failure, not a smaller green corpus", () =>
  fixture((root, source) => {
    rmSync(join(source, "en/index.html"));
    assert.throws(
      () => stageDocuments(source, join(root, "stage")),
      /Missing exported en homepage/,
    );
  }));

test("declared extra locales retain their original route paths", () =>
  fixture((root, source) => {
    mkdirSync(join(source, "de"));
    writeFileSync(
      join(source, "de/index.html"),
      '<html lang="de" dir="ltr"><body>Produkt</body></html>',
    );
    const mappings = stageDocuments(source, join(root, "stage"), ["en", "de", "fa"]);
    assert(mappings.some((m) => m.source === "de/index.html" && m.destination === "de/index.html"));
  }));
