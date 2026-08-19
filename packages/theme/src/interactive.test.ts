import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const HERE = import.meta.dirname;
const read = (f: string) => readFileSync(join(HERE, f), "utf8");

const INTERACTIVE = read("interactive.css");
const TOKENS = read("tokens.css");
const THEME = read("theme.css");
const SCRIPT = read("script.css");

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * THE POINTER AFFORDANCE, AND THE TWO WAYS IT COULD GO WRONG
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `interactive.css` restores what Tailwind v4's Preflight dropped: a hand
 * cursor on things you click. It is one short file, so the risk is not that
 * the rules are complicated — it is that the file drifts out of the shape that
 * makes it SAFE.
 *
 * Two failure modes, one test each:
 *
 *   1. It stops being opt-in. If tokens.css or theme.css ever `@import` it,
 *      every EMBEDDED consumer silently inherits a cursor rule on its host's
 *      buttons. That is the exact class of regression the first consumer trial
 *      caught with `script.css` (46 English pages changed height because an
 *      unscoped `:lang(fa)` rule reached the host). The `@import` assertion
 *      below is the poison fixture for it.
 *
 *   2. It stops being a default. If the rules leave `@layer lumo.reset` — the
 *      lowest-ranked layer — or grow an `!important`, a consumer can no longer
 *      override them with ordinary CSS, and a library that cannot be overridden
 *      on a cursor is a library that will be forked over one.
 */

describe("interactive.css — it is a default, not a decree", () => {
  it("writes only into lumo.reset, the lowest-ranked layer", () => {
    const layers = [...INTERACTIVE.matchAll(/@layer\s+([\w.]+)\s*\{/g)].map((m) => m[1]);
    expect(layers, "the file should open exactly one layer").toEqual(["lumo.reset"]);

    // lumo.reset must still be FIRST in the declared order, or "lowest-ranked"
    // is no longer true and this file starts winning fights it should lose.
    const order = TOKENS.match(/@layer\s+([\w.,\s]+);/)?.[1];
    expect(order, "tokens.css must declare the layer order").toBeTruthy();
    expect(order!.split(",").map((s) => s.trim())[0]).toBe("lumo.reset");
  });

  it("never uses !important", () => {
    // Comments are stripped first: the file's own prose explains why it does
    // NOT use `!important`, and a naive read would flag its own argument.
    expect(INTERACTIVE.replace(/\/\*[\s\S]*?\*\//g, "")).not.toMatch(/!\s*important/);
  });

  it("has no rule outside the layer block", () => {
    const withoutComments = INTERACTIVE.replace(/\/\*[\s\S]*?\*\//g, "");
    const outside = withoutComments.replace(/@layer\s+[\w.]+\s*\{[\s\S]*\}/, "").trim();
    expect(outside, `stray rule outside the layer: ${outside}`).toBe("");
  });
});

describe("interactive.css — it stays opt-in", () => {
  it("is not imported by tokens.css, theme.css or script.css", () => {
    for (const [name, css] of [["tokens.css", TOKENS], ["theme.css", THEME], ["script.css", SCRIPT]] as const) {
      expect(css, `${name} must not pull interactive.css in — embedded consumers would inherit it`)
        .not.toMatch(/interactive\.css/);
    }
  });

  it("is published under its own export so a consumer must ask for it", async () => {
    const pkg = JSON.parse(readFileSync(join(HERE, "..", "package.json"), "utf8")) as {
      exports: Record<string, string>;
    };
    expect(pkg.exports["./interactive.css"]).toBe("./src/interactive.css");
  });
});

describe("interactive.css — it covers what a click actually lands on", () => {
  const body = INTERACTIVE.replace(/\/\*[\s\S]*?\*\//g, "");

  it("names the elements a consumer writes by hand", () => {
    for (const sel of ["button", "summary", "select", 'input[type="checkbox"]', 'input[type="radio"]', 'input[type="range"]']) {
      expect(body, `missing ${sel}`).toContain(sel);
    }
  });

  it("names the composed roles, because a div with a role owes the same affordance", () => {
    for (const role of ["button", "tab", "switch", "option", "menuitem"]) {
      expect(body, `missing [role="${role}"]`).toContain(`[role="${role}"]`);
    }
  });

  it("does NOT claim a text field — a caret is not a hand", () => {
    expect(body).not.toMatch(/input\[type="text"\]/);
    expect(body).not.toMatch(/\btextarea\b/);
  });

  it("gives disabled and aria-disabled controls the default cursor back", () => {
    expect(body).toMatch(/button:disabled/);
    expect(body).toMatch(/\[aria-disabled="true"\]/);
    // the reversal must be `default`, not `not-allowed`: `pointer-events` is how
    // Lumo blocks interaction, and a cursor that never hit-tests is theatre.
    const tail = body.slice(body.indexOf("button:disabled"));
    expect(tail).toMatch(/cursor:\s*default/);
  });
});
