/*
 * THE HELPER AND THE GATE MUST AGREE ON WHAT A LATIN RUN IS.
 *
 * `core`'s `isLatinRun` decides whether to mark a string `data-lumo-latn`; the
 * gate's `native-script-text` decides whether an UNMARKED string is a defect.
 * If the two tests diverge, a consumer either marks what the gate would have
 * passed (harmless) or fails to mark what the gate fails — the bug two
 * hand-copies shipped. This file makes the next divergence a failing test.
 *
 * No React here on purpose: the gate runs under plain Node. `core/src/latn.ts`
 * is the React-free half, and `latn.test.tsx` in core pins the exact bytes the
 * components emit — `<span data-lumo-latn="">…</span>` — so that is what is
 * written out here.
 */
import { describe, expect, it } from "vitest";
import { isLatinRun } from "../../core/src/latn.ts";
import { gradeHtml } from "./index.ts";

const page = (body: string) =>
  `<!doctype html><html lang="fa-IR" dir="rtl"><head><meta charset="utf-8"><title>آزمون</title></head><body>${body}</body></html>`;
const fired = (body: string, rule: string) =>
  gradeHtml("fa-IR/index.html", page(body)).filter((v) => v.rule === rule).length;
/** Exactly what `<Latn>` renders, per core's own test. */
const marked = (run: string) => `<span data-lumo-latn="">${run}</span>`;

const RUNS = ["Acme", "contact@example.com", "ISO 27001", "۹۰ Mt/year", "Mt/year"];

describe("core.isLatinRun agrees with the gate", () => {
  it.each(RUNS)("unmarked, the gate fails %s; marked as the helper would, it passes", (run) => {
    expect(fired(`<p>${run}</p>`, "native-script-text")).toBeGreaterThan(0);
    expect(isLatinRun(run)).toBe(true);
    expect(fired(`<p>${marked(run)}</p>`, "native-script-text")).toBe(0);
    expect(fired(`<p>${marked(run)}</p>`, "latn-island-purity")).toBe(0);
  });

  it("and a native string the helper leaves bare would FAIL purity if marked", () => {
    const native = "این یک جملهٔ فارسی است";
    expect(isLatinRun(native)).toBe(false);
    expect(fired(`<p>${marked(native)}</p>`, "latn-island-purity")).toBeGreaterThan(0);
  });

  it("the disagreement the copies shipped, pinned: digits are not letters", () => {
    // `\p{Script=Arabic}` alone says «۹۰ Mt/year» is native. The gate does not,
    // and now neither does the helper.
    expect(/\p{Script=Arabic}/u.test("۹۰ Mt/year")).toBe(true);
    expect(isLatinRun("۹۰ Mt/year")).toBe(true);
    expect(fired("<p>۹۰ Mt/year</p>", "native-script-text")).toBeGreaterThan(0);
  });
});
