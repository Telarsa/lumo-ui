import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { test } from "node:test";

const app = resolve(import.meta.dirname, "..");
const snapshotPath = "docs/public-docs-snapshot.json";
const snapshot = JSON.parse(readFileSync(resolve(app, snapshotPath), "utf8"));

test("a late source adaptation failure leaves every destination and snapshot unchanged", () => {
  const temp = mkdtempSync(resolve(tmpdir(), "lumo-docs-drift-"));
  try {
    const source = resolve(temp, "source");
    const target = resolve(temp, "target");
    mkdirSync(source, { recursive: true });
    mkdirSync(resolve(target, "scripts"), { recursive: true });
    copyFileSync(resolve(app, "scripts/sync-public-docs.mjs"), resolve(target, "scripts/sync-public-docs.mjs"));
    const originalSnapshot = readFileSync(resolve(app, snapshotPath));
    mkdirSync(resolve(target, "docs"), { recursive: true });
    writeFileSync(resolve(target, snapshotPath), originalSnapshot);
    const destinationBytes = new Map();
    for (const file of snapshot.files) {
      const destination = resolve(target, file.destination);
      const marker = Buffer.from(`preserve existing ${file.destination}\n`);
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, marker);
      destinationBytes.set(destination, marker);
    }
    // These first three sources satisfy their real adaptations. The fourth
    // has a missing section, so failure occurs after several prepared pages.
    // Synthetic source keeps the test independent of checkout history/depth.
    const fixtures = {
      "src/app/[locale]/docs/page.tsx": "export const docs = true;\n",
      "src/app/[locale]/docs/layout.tsx": 'const shell = <div className="shell docs" />;\n',
      "src/app/[locale]/docs/getting-started/page.tsx": [
        "<Section title={t.s1}>", "<Section title={t.s2}>", "<Section title={t.s3}>", "<Section title={t.s4}>",
        "lumo gate ./out gate.floors.json", "pnpm add -D ${INSTALL_SPEC}",
      ].join("\n"),
      "src/app/[locale]/docs/contract/page.tsx": "<Section>\n",
    };
    for (const [path, content] of Object.entries(fixtures)) {
      const sourceFile = resolve(source, "apps/website", path);
      mkdirSync(dirname(sourceFile), { recursive: true });
      writeFileSync(sourceFile, content);
    }
    writeFileSync(resolve(source, "package.json"), '{"version":"1.0.0"}\n');
    execFileSync("git", ["-C", source, "init", "--quiet"]);
    execFileSync("git", ["-C", source, "add", "."]);
    execFileSync("git", ["-C", source, "-c", "user.name=Docs fixture", "-c", "user.email=fixture@example.invalid", "-c", "core.hooksPath=/dev/null", "commit", "--quiet", "-m", "Fixture with late drift"]);
    const run = spawnSync(process.execPath, [resolve(target, "scripts/sync-public-docs.mjs"), "HEAD", source], { encoding: "utf8" });
    assert.notEqual(run.status, 0);
    assert.match(run.stderr, /Original section count changed.*docs\/contract\/page\.tsx/);
    for (const [destination, bytes] of destinationBytes) assert.deepEqual(readFileSync(destination), bytes, destination);
    assert.deepEqual(readFileSync(resolve(target, snapshotPath)), originalSnapshot, "snapshot remains unchanged");
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});
