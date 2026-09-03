/*
 * GUESSING WHICH PATH SEGMENT IS A LOCALE HAS A FLOOR, AND `/pro` IS IT.
 *
 * `grade-app` decides whether `dist/pro.html` is the page `/pro` or the home
 * page of the locale `pro`. BCP-47's grammar accepts every well-formed 2-3
 * letter subtag, so `/how`, `/map`, `/job` and `/api` were once staged as their
 * own locales; §64 fixed that by also requiring the code to be ASSIGNED.
 *
 * `pro` IS assigned — Old Provençal. So a pricing page was staged as a locale
 * and then failed `lang-dir` for declaring `en` when the route "said" `pro`.
 * `/kept`, `/search` and `/offline` escape only by being longer than three
 * letters, which is luck, not a rule.
 *
 * Nothing in the PATH distinguishes a product route from a rare language. The
 * app knows, so `@locales` lets it say. Declared, the list is exhaustive and the
 * guess never runs; absent, behaviour is exactly as before.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const GRADE_APP = fileURLToPath(new URL("../../../scripts/grade-app.mjs", import.meta.url));

/** An English page, correctly declaring itself English. */
const EN = `<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8"><title>Pro</title>
</head><body><p>Pricing for teams.</p></body></html>`;

function run(files: Record<string, string>, floors?: unknown): { code: number; out: string } {
  const dir = mkdtempSync(join(tmpdir(), "lumo-locales-"));
  for (const [name, html] of Object.entries(files)) {
    const p = join(dir, name);
    mkdirSync(join(p, ".."), { recursive: true });
    writeFileSync(p, html);
  }
  const args = [GRADE_APP, dir, "en"];
  if (floors !== undefined) {
    const fp = join(dir, "floors.json");
    writeFileSync(fp, JSON.stringify(floors));
    args.push(fp);
  }
  try {
    return { code: 0, out: String(execFileSync(process.execPath, args, { stdio: "pipe" })) };
  } catch (error) {
    const e = error as { status: number; stdout: Buffer; stderr: Buffer };
    return { code: e.status, out: String(e.stdout) + String(e.stderr) };
  }
}

describe("@locales", () => {
  it("without it, /pro is mistaken for Old Provençal", () => {
    // The bug, pinned. If this ever passes, the guess got better and the
    // declaration became optional — worth knowing either way.
    const { out } = run({ "pro.html": EN, "en/a.html": EN });
    expect(out).toMatch(/expected "pro"/);
  });

  it("declared, /pro is a page and the run is clean", () => {
    const { code, out } = run({ "pro.html": EN, "en/a.html": EN }, { "@locales": ["en", "de", "fa"] });
    expect(out).not.toMatch(/expected "pro"/);
    expect(code).toBe(0);
  });

  it("a declared locale segment is still recognised as one", () => {
    // The anti-vacuity half: if @locales were simply ignored, `de/a.html` would
    // be staged under `en` and fail lang-dir for declaring German.
    const de = EN.replace('lang="en"', 'lang="de"');
    const { code } = run({ "de/a.html": de, "en/a.html": EN }, { "@locales": ["en", "de"] });
    expect(code).toBe(0);
  });

  it("and a segment OUTSIDE the declared list is staged under the default", () => {
    // `fa` is a real language, but this app does not serve it: the page is
    // graded as English, which is what the declaration says it is.
    const { code, out } = run({ "fa/a.html": EN, "en/a.html": EN }, { "@locales": ["en"] });
    expect(out).not.toMatch(/expected "fa"/);
    expect(code).toBe(0);
  });
});
