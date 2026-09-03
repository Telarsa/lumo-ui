/*
 * A REDIRECT IS NOT A PAGE — and the skip must not become a loophole.
 *
 * `grade-app` recognises Next's 3xx stubs from the `.meta` sidecar beside each
 * document. A static export has no sidecar: a host that cannot send a status
 * says the same thing with a zero-delay `<meta http-equiv="refresh">`, which is
 * what Astro emits for every configured redirect. Grading one fails `lang-dir`
 * for want of attributes a 445-byte `noindex` stub has no business carrying,
 * and the only available fix is to dress a redirect up as a page.
 *
 * The danger in any skip is that it grows into an exemption. These tests pin
 * both halves: the stub is skipped, and a page that merely CONTAINS a refresh —
 * or defers it — is still graded like anything else.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CLI = new URL("./cli.ts", import.meta.url).pathname;

/** Astro's own shape, reproduced from a consumer's `dist/index.html`. */
const STUB =
  `<!doctype html><title>Redirecting to: /en</title>` +
  `<meta http-equiv="refresh" content="0;url=/en">` +
  `<meta name="robots" content="noindex">` +
  `<body><a href="/en">Redirecting from <code>/index.html</code> to <code>/en</code></a></body>`;

/** A page with nothing wrong, so a run is never empty by accident. */
const CLEAN =
  `<!doctype html><html lang="fa-IR" dir="rtl"><head><meta charset="utf-8"><title>سلام</title>` +
  `</head><body><p>هیچ ایرادی ندارد.</p></body></html>`;

/** A page with a defect the gate must always catch: Latin digits in Persian. */
const DEFECTIVE =
  `<!doctype html><html lang="fa-IR" dir="rtl"><head><meta charset="utf-8"><title>آزمون</title>` +
  `</head><body><p>قیمت 1200 تومان است.</p></body></html>`;

function run(files: Record<string, string>): { code: number; out: string } {
  const dir = mkdtempSync(join(tmpdir(), "lumo-redirect-"));
  for (const [name, html] of Object.entries(files)) {
    const p = join(dir, name);
    mkdirSync(join(p, ".."), { recursive: true });
    writeFileSync(p, html);
  }
  try {
    const out = execFileSync(process.execPath, ["--experimental-strip-types", CLI, dir], {
      stdio: "pipe",
    });
    return { code: 0, out: String(out) };
  } catch (error) {
    const e = error as { status: number; stdout: Buffer; stderr: Buffer };
    return { code: e.status, out: String(e.stdout) + String(e.stderr) };
  }
}

describe("zero-delay redirect stubs", () => {
  it("are skipped rather than failed for missing lang and dir", () => {
    const { code } = run({ "index.html": STUB, "fa-IR/a.html": CLEAN });
    expect(code).toBe(0);
  });

  it("are named in the output — a silent skip is how a gate stops grading", () => {
    const { out } = run({ "index.html": STUB, "fa-IR/a.html": CLEAN });
    expect(out).toMatch(/skipped index\.html -> \/en/);
  });

  it("do NOT hide a real page: a DEFERRED refresh is still graded", () => {
    // The reader sees this one, so the gate must too. Five seconds is a page.
    //
    // The CLEAN page beside it is load-bearing. Without it, widening the skip to
    // accept any delay would skip the defective page, grade nothing, and trip
    // the all-skipped refusal — the run would fail for the wrong reason and this
    // test would pass while asserting nothing. Verified by poisoning: with the
    // delay check removed, this fails only because the clean page is here.
    const deferred = DEFECTIVE.replace("<head>", '<head><meta http-equiv="refresh" content="5;url=/en">');
    const { code } = run({
      "fa-IR/a.html": deferred,
      "fa-IR/ok.html": CLEAN,
    });
    expect(code).not.toBe(0);
  });

  it("do NOT hide a real page: a defect beside a stub still fails", () => {
    const { code } = run({ "index.html": STUB, "fa-IR/a.html": DEFECTIVE });
    expect(code).not.toBe(0);
  });

  it("and the gate still refuses a directory that is ONLY redirects", () => {
    // Nothing was graded, so the empty-directory refusal must still bite.
    const { code } = run({ "index.html": STUB, "de.html": STUB });
    expect(code).not.toBe(0);
  });
});
