/**
 * Five vocabularies for one idea, and the sweep that keeps it at one.
 *
 * ── WHAT THIS FILE IS FOR ──────────────────────────────────────────────────
 *
 * `state-vocabulary.test.tsx` asks whether a rule can FIRE — is the selector
 * one the engine writes, on the element we think. `theme-vocabulary.test.tsx`
 * asks whether the value it sets is REAL — does the theme publish that colour,
 * and is it a different colour from the one beside it. Both are about a single
 * rule being correct.
 *
 * This file asks a question neither can: are all ninety-four components saying
 * the same thing the same way. Measured on 12 Aug 2026, before this pass, they
 * were not — and none of it was a bug in any individual component, which is
 * exactly why nothing caught it:
 *
 *     press       5 spellings   active:bg-surface-sunken ×13 · active:brightness-95 ×4
 *                               active:translate-y-px ×4 · active:bg-accent/10 ×5
 *                               active:opacity-90/80 ×2
 *     focus       5 mechanisms  the global rule · FOCUS_RING_SELF · three re-typed
 *                               copies of it · hardcoded outline-accent ×3 ·
 *                               focus-as-fill ×3 (+ has-[select:…] in calendar)
 *     disabled    3 opacities   opacity-50 ×39 · opacity-60 ×1 · opacity-40 ×4
 *     elevation   5 rungs       shadow-sm/xs/md/lg/xl/2xl, none of them a token
 *     scrim       0 tokens      bg-black/50, twice
 *
 * A designer reads that as "grown, not designed", and it is the single largest
 * thing keeping this library looking like an internal tool. It is also the
 * class of drift a reviewer cannot see: every one of those lines is defensible
 * on the day it is written, in the file it is written in.
 *
 * ── WHY IT READS THE DIRECTORY ─────────────────────────────────────────────
 *
 * The same argument `state-vocabulary.test.tsx`'s own sweep makes at the bottom
 * of that file, and it is not a style preference — it is the finding. Both of
 * the dead `data-hovered:` rules it eventually caught were in components nobody
 * had put on a list (`sidebar.variants.ts`, `bubble.tsx`), because a suite that
 * checks what someone remembered to add checks the components nobody forgot.
 * A vocabulary rule is the most list-vulnerable kind there is: the whole defect
 * is a component that did its own thing, which is by definition the component
 * that is not in your list.
 *
 * So every assertion here enumerates `src/`, and a component added tomorrow is
 * covered without anyone editing this file.
 *
 * ── THE UNIT IS A CLASS STRING, NOT A LINE AND NOT A FILE ──────────────────
 *
 * `chunks()` below reassembles the `"…" + "…" + "…"` concatenations this
 * library writes its cva bases as, and treats each run as one class string.
 * That matters for the `cursor-not-allowed` rule in particular: whether
 * `pointer-events-none` kills a cursor rule depends on the two being on the
 * SAME ELEMENT, and a per-file check reports `autocomplete.tsx` as dead when
 * the two utilities are on the input and on a list row respectively. Measured:
 * a per-file check calls 13 of the 18 sites dead; the per-string check calls 2.
 * The looser test would have deleted eleven live rules.
 */

import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const SRC = import.meta.dirname;

/** Blanks comments, preserving offsets so a reported line number is real. */
function code(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/^\s*\/\/.*$/gm, (m) => " ".repeat(m.length));
}

interface Chunk {
  readonly file: string;
  readonly line: number;
  readonly text: string;
}

/**
 * Every class string in a source file.
 *
 * A "class string" is a run of double-quoted literals joined by `+` and nothing
 * else — which is how every `cva()` base and every multi-line `cn()` argument in
 * this library is written. Adjacent literals separated by a comma are two
 * arguments to `cn()` and land on the same element too, so they are joined as
 * well; that is deliberate and it is why `tag.tsx`'s five-argument `cn()` is
 * read as one element's classes.
 */
function chunks(file: string, source: string): Chunk[] {
  const out: Chunk[] = [];
  const literal = /"((?:[^"\\]|\\.)*)"/g;
  let parts: string[] = [];
  let start = 0;
  let previousEnd = -1;
  let match: RegExpExecArray | null;
  const flush = () => {
    if (parts.length > 0) {
      out.push({ file, line: source.slice(0, start).split("\n").length, text: parts.join(" ") });
    }
  };
  while ((match = literal.exec(source)) !== null) {
    const gap = previousEnd < 0 ? null : source.slice(previousEnd, match.index);
    if (parts.length > 0 && gap !== null && /^\s*[+,]\s*$/.test(gap)) {
      parts.push(match[1] as string);
    } else {
      flush();
      parts = [match[1] as string];
      start = match.index;
    }
    previousEnd = literal.lastIndex;
  }
  flush();
  return out;
}

const FILES = readdirSync(SRC).filter(
  (f) => (f.endsWith(".tsx") || f.endsWith(".ts")) && !f.includes(".test."),
);

const ALL: Chunk[] = FILES.flatMap((f) => chunks(f, code(readFileSync(`${SRC}/${f}`, "utf8"))));

/** Class tokens across the whole directory, with where each one came from. */
function tokensMatching(pattern: RegExp): Map<string, string[]> {
  const found = new Map<string, string[]>();
  for (const chunk of ALL) {
    for (const token of chunk.text.split(/\s+/)) {
      if (token === "" || !pattern.test(token)) continue;
      const where = found.get(token) ?? [];
      where.push(`${chunk.file}:${chunk.line}`);
      found.set(token, where);
    }
  }
  return found;
}

/** Renders a `token → sites` map compactly enough to read in a failure. */
function report(found: Map<string, string[]>): string {
  return [...found]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([token, where]) => `\n    ${token} ×${where.length}  ${where.slice(0, 6).join(" ")}`)
    .join("");
}

describe("the sweep is not vacuous", () => {
  /*
   * Every assertion below is of the form "the set of X is exactly {y}", and an
   * empty set satisfies most of them trivially. If the directory filter, the
   * comment stripper or the chunker ever breaks, this is the test that says so
   * rather than nine green ones over nothing.
   */
  it("reads the whole component directory", () => {
    expect(FILES.length).toBeGreaterThan(80);
  });

  it("finds class strings in it", () => {
    expect(ALL.length).toBeGreaterThan(300);
  });

  it("keeps concatenated class strings together", () => {
    // The property the `cursor-not-allowed` rule depends on. `button.variants.ts`
    // writes its base as five joined literals; if the chunker regressed to
    // per-literal, this would be false and that rule would silently start
    // grading the wrong thing.
    const button = ALL.filter((c) => c.file === "button.variants.ts");
    expect(button.some((c) => /inline-flex/.test(c.text) && /data-disabled:/.test(c.text))).toBe(
      true,
    );
  });

  it("strips comments, so prose about a retired spelling cannot fail a rule", () => {
    // Every rule below forbids a string, and the arguments for forbidding it
    // quote the string. `button.variants.ts` names all four press candidates in
    // its header; if comments leaked, the file that explains the rule would be
    // the file that breaks it.
    const stripped = code(readFileSync(`${SRC}/button.variants.ts`, "utf8"));
    expect(readFileSync(`${SRC}/button.variants.ts`, "utf8")).toContain("active:opacity-80");
    expect(stripped).not.toContain("active:opacity-80");
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * 1. ONE PRESS
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("press", () => {
  /**
   * The one treatment, and the one exemption composed with it.
   *
   * `not-aria-[haspopup]` is not a second vocabulary — it is the SAME utility
   * under a variant that excludes overlay triggers, because Base UI anchors a
   * panel to its trigger's box and a held trigger would drag the panel with it.
   * Written as an explicit pair rather than a regex so that adding a third
   * spelling is a decision somebody has to make here, in front of this comment.
   */
  const ALLOWED = new Set([
    "active:translate-y-px",
    "active:not-aria-[haspopup]:translate-y-px",
  ]);

  it("has exactly one spelling across the whole directory", () => {
    const found = tokensMatching(/(^|:)active:/);
    const strays = [...found].filter(([token]) => !ALLOWED.has(token));
    expect(
      strays.map(([t, w]) => `${t} (${w.join(" ")})`),
      `a second press vocabulary. The library had five; the argument for the one ` +
        `it kept, and the measurements that eliminated the other four, are in ` +
        `button.variants.ts's header.${report(found)}`,
    ).toEqual([]);
  });

  it("both allowed spellings are actually in use, so the pair is not aspirational", () => {
    const found = tokensMatching(/(^|:)active:/);
    for (const spelling of ALLOWED) {
      expect(found.has(spelling), `${spelling} is allowed and unused — delete it`).toBe(true);
    }
  });

  it("reaches meaningfully more than the fifteen it started at", () => {
    // A floor, not a target. It exists so that "one spelling" cannot be
    // satisfied by deleting the press from everything except `button`, which is
    // the cheapest way to pass the assertion above.
    const sites = [...tokensMatching(/(^|:)active:/).values()].flat();
    expect(sites.length).toBeGreaterThanOrEqual(20);
  });

  it("no component invents a press out of the properties press used to be made of", () => {
    /*
     * The four rejected candidates by NAME, so a revert fails saying which one
     * it is rather than "a second spelling". These are the utilities that
     * cannot appear under `active:` — the bare forms are all legitimate
     * elsewhere (`hover:brightness-95` is `button`'s critical hover, plain
     * `opacity-*` is everywhere).
     */
    const rejected = /(^|:)active:(bg-|brightness-|opacity-|decoration-|text-|border-|ring-)/;
    const found = tokensMatching(rejected);
    expect(
      [...found.keys()],
      `these are the shapes the five vocabularies were made of: a FILL that has ` +
        `to beat its own hover on the same declaration, a FILTER that needs ` +
        `something bright to dim, and an OPACITY that dims the label with it`,
    ).toEqual([]);
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * 2. ONE FOCUS MECHANISM
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("focus", () => {
  /**
   * The whole mechanism is `theme.css`'s `:where([data-lumo]):focus-visible`,
   * plus `FOCUS_RING_SELF` for the controls whose visible box is not the focus
   * stop. A component states neither: it wears `data-lumo`, or it imports the
   * constant.
   *
   * So the enforceable claim is that the STRING `focus-visible:` appears in
   * exactly one file — the one that defines the constant. Three components had
   * re-typed that constant character for character, and three more had
   * hardcoded `outline-2 outline-accent`; all six were in `@layer utilities`,
   * which the built stylesheet orders BEFORE `lumo.components`, so all six were
   * inert. A second mechanism that cannot fire is still a second mechanism —
   * it is what a reader copies from.
   */
  const HOME = "form.tsx";

  it("only one file writes a focus-visible rule at all", () => {
    const offenders = ALL.filter((c) => c.file !== HOME && c.text.includes("focus-visible:"));
    expect(
      offenders.map((c) => `${c.file}:${c.line}`),
      `a focus ring outside ${HOME}. There is one ring: theme.css's ` +
        `:where([data-lumo]):focus-visible, with FOCUS_RING_SELF for controls ` +
        `whose visible box is not the focus stop. A component either carries ` +
        `data-lumo or imports the constant.`,
    ).toEqual([]);
  });

  it("and that file writes exactly the two declarations, from the sys tokens", () => {
    const ring = ALL.filter((c) => c.file === HOME && c.text.includes("focus-visible:"));
    expect(ring.length, "FOCUS_RING_SELF is gone or has been split").toBe(1);
    expect(ring[0]!.text).toContain("var(--lumo-sys-focus-width)");
    expect(ring[0]!.text).toContain("var(--lumo-sys-focus)");
    expect(ring[0]!.text).toContain("var(--lumo-sys-focus-offset)");
  });

  it("no ring is drawn from --color-accent", () => {
    /*
     * Named separately from the rule above because it is the one that would
     * have broken a real brand rather than merely duplicated a rule.
     * `--lumo-sys-focus` and `--lumo-sys-accent` are independent tokens; three
     * components rang themselves with `outline-accent`, so a brand that moved
     * its focus colour and not its accent would have shipped two ring colours
     * on one page. It could not, only because the layer order made those rules
     * inert — which is luck, not design.
     */
    const found = tokensMatching(/outline-(accent|critical|positive|caution|fg|border)/);
    expect([...found.keys()], `a focus ring drawn from a non-focus token${report(found)}`).toEqual(
      [],
    );
  });

  it("no component substitutes a FILL for the ring", () => {
    /*
     * `menubar` rang with `focus-visible:bg-surface-hover`; `table`'s column
     * resizer and `resizable`'s divider with `focus-visible:bg-accent`. The
     * last two are the instructive pair: `bg-accent` was ALSO their
     * `data-resizing` fill, so a focused handle and a handle mid-drag were the
     * same pixel — two states, one appearance, on a control whose only job is
     * to report which one it is in.
     *
     * ── AND WHY THIS IS `focus-visible:` AND NOT `focus:` ────────────────────
     *
     * Scoped to the modality-filtered state on purpose, because plain `:focus`
     * fills and borders are a DIFFERENT affordance and flattening them here
     * would delete three correct rules. `autocomplete.tsx` and
     * `phone-input.tsx` move a BORDER on `:focus` — "this field is the one you
     * are typing into", which a mouse user needs and `:focus-visible` would
     * withhold from them; `list-box.tsx` fills on `:focus` because DOM focus IS
     * its collection cursor, the same job `data-highlighted` does in a menu.
     * None of the three is a WCAG 2.4.7 indicator, and each of them says so on
     * the line above itself. The indicator is the ring, the ring is
     * modality-filtered, and that is the vocabulary this rule holds to one.
     */
    const found = tokensMatching(/(^|:)focus-visible:(bg|text|border)-/);
    expect([...found.keys()], `focus-as-fill${report(found)}`).toEqual([]);
  });

  it("every proxy-focus component uses the marker rather than its own :has()", () => {
    // `calendar.variants.ts` had `has-[select:focus-visible]:outline-accent` —
    // a fifth mechanism AND the wrong token. theme.css's proxy rule covers the
    // shape; the component states the marker and nothing else.
    const found = tokensMatching(/has-\[[^\]]*focus/);
    expect([...found.keys()], `a hand-rolled proxy-focus ring${report(found)}`).toEqual([]);
    expect(
      ALL.some((c) => /(^|\s)lumo-proxy-focus(\s|$)/.test(c.text)),
      "nothing uses the proxy-focus marker — either the calendar regressed or " +
        "the marker's class spelling can be deleted from theme.css",
    ).toBe(true);
  });

  it("an offset that differs is a variable, not a second rule", () => {
    // toggle-group needs an INSET ring: its group clips items with
    // `overflow-hidden`. It sets the variable the one rule already reads.
    // Anything else here would be a rule competing with theme.css.
    // `form.tsx` is excluded because FOCUS_RING_SELF legitimately READS the
    // variable; everywhere else, mentioning it may only mean SETTING it.
    const found = tokensMatching(/--lumo-sys-focus-offset/);
    const setters = [...found].filter(([, where]) => !where.every((w) => w.startsWith(HOME)));
    expect(setters.length, "nothing overrides the focus offset").toBeGreaterThan(0);
    for (const [token] of setters) {
      expect(token, `${token} is not a plain custom-property assignment`).toMatch(
        /^\[--lumo-sys-focus-offset:.+\]$/,
      );
    }
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * 3. ONE DISABLED TREATMENT
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("disabled", () => {
  it("dims to exactly one opacity", () => {
    const found = tokensMatching(/disabled:opacity-/);
    const values = new Set([...found.keys()].map((t) => t.replace(/^.*opacity-/, "")));
    expect(
      [...values].sort(),
      `three values shipped: opacity-50 on 39 sites, opacity-60 on the field ` +
        `wrapper, opacity-40 on the steppers and three calendar strings. Each ` +
        `was a local judgement about how dim ONE control looked, which is an ` +
        `argument for moving the value everywhere or nowhere.${report(found)}`,
    ).toEqual(["50"]);
  });

  it("is stated on all three of the attribute spellings the engines use", () => {
    // Not a style rule — a coverage one. `data-disabled` is Base UI's,
    // `:disabled` is the platform's on a real `<button>`/`<input>`, and
    // `aria-disabled` is pagination's on an `<a>`, which has no disabled state
    // at all. All three exist in the tree and all three must dim the same.
    const found = tokensMatching(/disabled:opacity-/);
    const prefixes = new Set([...found.keys()].map((t) => t.slice(0, t.indexOf(":"))));
    expect([...prefixes].sort()).toEqual(["aria-disabled", "data-disabled", "disabled"]);
  });

  it("no cursor rule sits on an element that cannot be hit-tested", () => {
    /*
     * `cursor: not-allowed` needs a pointer to resolve against the element, and
     * `pointer-events: none` guarantees one never does. A rule in that position
     * is a declaration nothing can reach.
     *
     * The audit put this at 13 of 18 sites. Measured per CLASS STRING rather
     * than per file it is 2 — `calendar.variants.ts`'s day button and
     * `rating.tsx`'s item, both of which wrote the pair on one element. The
     * other sixteen sit on labels and inputs that stay hit-testable, and eleven
     * of the audit's thirteen were two utilities on two different elements in
     * one file. Both were removed; this keeps them gone and keeps the live ones.
     */
    const dead = ALL.filter(
      (c) => /cursor-not-allowed/.test(c.text) && /(^|:)pointer-events-none/.test(c.text),
    );
    expect(
      dead.map((c) => `${c.file}:${c.line}`),
      "cursor-not-allowed on an element that also sets pointer-events-none",
    ).toEqual([]);
    // And the live ones survive, or this rule has been "passed" by deletion.
    expect(ALL.filter((c) => /cursor-not-allowed/.test(c.text)).length).toBeGreaterThan(10);
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * 4. THREE ELEVATION TIERS, AND NO FOURTH
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("elevation", () => {
  const TIERS = new Set(["shadow-raised", "shadow-overlay", "shadow-modal"]);

  /**
   * `kbd.tsx`'s keycap bevel: `shadow-[inset_0_-1px_0_0_var(--color-border)]`.
   *
   * Excluded with a reason rather than folded into a tier, because it is not
   * elevation at all — it is a 1px inner edge drawn from `--color-border`, on
   * the block axis, to make a `<kbd>` read as a physical key. It participates
   * in no ladder, it separates the element from nothing, and there is exactly
   * one of it. Inventing a fourth token for one bevel would be the same move
   * that produced five overlay rungs.
   */
  const BEVEL = "shadow-[inset_0_-1px_0_0_var(--color-border)]";

  it("uses only the three tokens", () => {
    const found = tokensMatching(/(^|:)shadow-/);
    const strays = [...found].filter(([token]) => {
      const bare = token.slice(token.lastIndexOf(":") + 1);
      return bare !== BEVEL && !TIERS.has(bare);
    });
    expect(
      strays.map(([t, w]) => `${t} (${w.join(" ")})`),
      `Tailwind's default ramp is unreachable by a brand — nothing in ` +
        `packages/theme declares --shadow-*, so a rung like shadow-lg is a ` +
        `constant. Twelve overlays sat on five of them. tokens.css argues which ` +
        `tier a surface belongs to; it is a question about what the element has ` +
        `to be separated from, not about how big the shadow looks.${report(found)}`,
    ).toEqual([]);
  });

  it("all three tiers are in use", () => {
    const found = tokensMatching(/(^|:)shadow-/);
    const used = new Set([...found.keys()].map((t) => t.slice(t.lastIndexOf(":") + 1)));
    for (const tier of TIERS) {
      expect(used.has(tier), `${tier} is declared in the theme and used by nothing`).toBe(true);
    }
  });

  it("the two tooltips are on the same rung", () => {
    /*
     * The finding in one assertion. `tooltip.tsx` was `shadow-md` and
     * `chart.variants.ts`'s tooltip was `shadow-xl` — two components solving
     * the same problem three rungs apart, which is what "five elevations"
     * actually looks like from the inside. Neither was wrong on its own day.
     */
    const rung = (file: string) => {
      const chunk = ALL.find((c) => c.file === file && /(^|\s)shadow-\S/.test(c.text));
      return /(?:^|\s)(shadow-\S+)/.exec(chunk?.text ?? "")?.[1];
    };
    expect(rung("tooltip.tsx")).toBe("shadow-overlay");
    expect(rung("chart.variants.ts")).toBe("shadow-overlay");
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * 5. NO UNTOKENISED COLOUR
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("the scrim, and the colours nothing publishes", () => {
  it("no component paints its own scrim", () => {
    const found = tokensMatching(/(^|:)(bg|text|border|outline|ring|fill|stroke)-(black|white)(\/|$)/);
    expect(
      [...found.keys()],
      `bg-black/50 in dialog.tsx and drawer.tsx were the only two untokenised ` +
        `colours in the library, and a per-call-site alpha is how two overlays ` +
        `drift apart. The token is --lumo-sys-scrim, and it is theme-aware: ` +
        `0.5 on light, 0.72 on dark, both measured in tokens.css.${report(found)}`,
    ).toEqual([]);
    expect(
      ALL.filter((c) => /(^|\s)bg-scrim(\s|$)/.test(c.text)).length,
      "nothing uses bg-scrim — the two overlays lost their backdrop",
    ).toBe(2);
  });

  it("no component writes a literal colour of any kind", () => {
    /*
     * The wider property `theme-vocabulary.test.tsx` measured as already held
     * and this pins: an exhaustive sweep for hex, `rgb()`, `hsl()` and `oklch()`
     * across the 94 components returned zero USAGES and only prose. The scrim
     * was the exception that sweep did not cover, because `black` is a Tailwind
     * keyword rather than a literal.
     */
    const found = tokensMatching(/#[0-9a-fA-F]{3,8}$|\b(rgb|rgba|hsl|hsla|oklch)\(/);
    expect([...found.keys()], `a literal colour in a class string${report(found)}`).toEqual([]);
  });
});
