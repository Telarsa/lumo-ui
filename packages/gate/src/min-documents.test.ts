/*
 * A BUILD THAT SHRANK HAS NOT GOT CLEANER.
 *
 * `cli.ts` already refused to report success on an empty directory — "a gate
 * that grades nothing and prints clean is worse than no gate". That caught the
 * total failure and missed the likelier one: a build that emits SOME of its
 * pages. The gate then grades what survived, finds it clean, and exits 0, while
 * the pages that would have failed are exactly the ones that never got built.
 *
 * This was found the hard way. A content edit in a consumer broke MDX parsing,
 * the build emitted zero pages, and an analysis run reported "0 violations".
 * The empty-directory guard above would have caught that one — but a build that
 * had emitted 100 of 598 pages would have gone green in CI.
 *
 * `@min-documents` is the committed expectation. These tests exist because a
 * guard that has never been shown to fail is not a guard.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CLI = fileURLToPath(new URL("./cli.ts", import.meta.url));

/** A clean Persian page: nothing here may fail a RULE, only the count guard. */
const PAGE = `<!doctype html><html lang="fa-IR" dir="rtl"><head><meta charset="utf-8">
<title>آزمون</title></head><body><p>این یک صفحهٔ آزمایشی است.</p></body></html>`;

function fixture(pages: number, floors?: unknown): { dir: string; floorsPath?: string } {
  const dir = mkdtempSync(join(tmpdir(), "lumo-mindocs-"));
  mkdirSync(join(dir, "fa"));
  for (let i = 0; i < pages; i += 1) {
    writeFileSync(join(dir, "fa", `p${String(i)}.html`), PAGE);
  }
  if (floors === undefined) return { dir };
  const floorsPath = join(dir, "floors.json");
  writeFileSync(floorsPath, JSON.stringify(floors));
  return { dir, floorsPath };
}

/** Exit code of a real CLI run — the only thing CI reads. */
function run(dir: string, floorsPath?: string): number {
  try {
    execFileSync(
      process.execPath,
      ["--experimental-strip-types", CLI, dir, ...(floorsPath ? [floorsPath] : [])],
      { stdio: "pipe" },
    );
    return 0;
  } catch (error) {
    return (error as { status: number }).status;
  }
}

describe("@min-documents", () => {
  it("passes when the build emitted at least the committed count", () => {
    const { dir, floorsPath } = fixture(3, { "@min-documents": 3 });
    expect(run(dir, floorsPath)).toBe(0);
  });

  it("FAILS when the build emitted fewer — the partial-build case", () => {
    // The whole point. Three clean pages, five expected: every rule is green
    // and the run must still be red, because two pages were never graded.
    const { dir, floorsPath } = fixture(3, { "@min-documents": 5 });
    expect(run(dir, floorsPath)).not.toBe(0);
  });

  it("names the shortfall, so the failure is actionable", () => {
    const { dir, floorsPath } = fixture(3, { "@min-documents": 5 });
    let stderr = "";
    try {
      execFileSync(process.execPath, ["--experimental-strip-types", CLI, dir, floorsPath!], {
        stdio: "pipe",
      });
    } catch (error) {
      stderr = String((error as { stderr: Buffer }).stderr);
    }
    expect(stderr).toMatch(/graded 3 document\(s\)/);
    expect(stderr).toMatch(/floor of 5/);
  });

  it("a floors file may declare ONLY the setting", () => {
    // An app with no number-dense route has no digit floor to write, and must
    // still be able to guard its page count. Before this, such a file was
    // rejected as "declares no floors".
    const { dir, floorsPath } = fixture(2, { "@min-documents": 2 });
    expect(run(dir, floorsPath)).toBe(0);
  });

  it("still refuses a floors file that declares nothing at all", () => {
    const { dir, floorsPath } = fixture(2, {});
    expect(run(dir, floorsPath)).not.toBe(0);
  });

  it("is optional: no floors file still grades and passes", () => {
    const { dir } = fixture(2);
    expect(run(dir)).toBe(0);
  });

  it("and the empty-directory refusal it generalises still holds", () => {
    const dir = mkdtempSync(join(tmpdir(), "lumo-mindocs-empty-"));
    expect(run(dir)).not.toBe(0);
  });
});
