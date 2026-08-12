import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const TOKENS = readFileSync(join(import.meta.dirname, "tokens.css"), "utf8");
const THEME = readFileSync(join(import.meta.dirname, "theme.css"), "utf8");

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * THE CONTRAST GATE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This exists because a shipped brand token failed it. `--lumo-brand-text` was
 * `#5c7a1c`, measured at 4.93:1 — **against white**. The ground it actually sits
 * on is the paper `#f2efe8`, where it is 4.30:1 and fails AA. The brand doc
 * cited 4.72:1, matching neither. Three numbers, none of them the real one.
 *
 * So contrast is computed here against the token's OWN background rather than
 * against an assumed white, and it is computed from the committed CSS rather
 * than from a spreadsheet that can drift from it.
 *
 * ── WHY IT IS A SWEEP AND NOT A LIST, AS OF 12 AUGUST 2026 ─────────────────
 *
 * The method above was right and the coverage was not. Until this commit the
 * file asserted SEVEN hand-written pairs, all against the page ground, and
 * three blockers lived in the gaps between them:
 *
 *   B1  `fg-subtle` failed AA on every ground in both themes — 3.98:1 light on
 *       the 0.970 wash, 3.49:1 dark on `surface-hover`. It is placeholders,
 *       calendar weekday headers, breadcrumb separators, empty-state copy and
 *       sidebar group headings: 51 component sites.
 *   B2  `fg-muted` passed on the page (4.53:1) and failed everywhere else
 *       (4.34:1 light on the wash; 4.49:1 dark on `surface-hover`, missing AA
 *       by one hundredth).
 *   B3  dark `border` and dark `surface-hover` were the same ramp step. 1.00:1.
 *       1,888 elements combined them; every bordered control lost its outline
 *       the instant it was hovered.
 *
 * Not one of those was a mistake in the arithmetic. Each was a pair nobody
 * thought to write down, which is the failure mode a sample HAS — a sample can
 * only ever be as complete as the imagination of whoever wrote it, and the
 * whole point of a token system is that a value is reused in places its author
 * never enumerated. Light `fg-muted` was reviewed, measured, and documented at
 * 4.53:1 by someone who had genuinely checked; they checked the page, and the
 * token also paints on the wash.
 *
 * So the list is gone. The matrix below is generated from the committed CSS by
 * crossing every mark token with every ground it is PERMITTED to sit on, in all
 * three theme states. The permission table is the one thing still written by
 * hand, and it is deliberately generous: a ground goes in the list unless there
 * is a reason it cannot occur, never merely because no component does it today.
 *
 * Current size: 3 theme states × 62 pairs. Adding a sys colour with no entry in
 * the permission table fails `every sys colour is classified`, so the matrix
 * cannot silently stop covering something.
 */

// ── OKLCH → sRGB, enough of it to compute luminance ────────────────────────

function oklchToLinearSrgb(L: number, C: number, hDeg: number): [number, number, number] {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** Relative luminance per WCAG 2.x, from linear-light sRGB. */
function luminance([r, g, b]: [number, number, number]): number {
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  return 0.2126 * clamp(r) + 0.7152 * clamp(g) + 0.0722 * clamp(b);
}

function hexToLinear(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const to = (i: number) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return [to(0), to(2), to(4)];
}

function ratio(a: [number, number, number], b: [number, number, number]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

// ── reading the committed CSS ──────────────────────────────────────────────

/*
 * Comments are stripped before ANY parsing. This file's prose quotes token
 * declarations while explaining them, and a parser that reads its own
 * explanation would resolve a token to whatever the last comment happened to
 * mention. Same technique, same reason, as the proxy-focus check at the bottom.
 */
const CSS = TOKENS.replace(/\/\*[\s\S]*?\*\//g, "");

/** Resolves a `ref` token to linear sRGB, following `oklch(L C H)` or a hex literal. */
function refColour(name: string): [number, number, number] {
  const decl = new RegExp(`--${name}:\\s*([^;]+);`).exec(CSS)?.[1]?.trim();
  if (!decl) throw new Error(`token --${name} not found in tokens.css`);

  if (decl.startsWith("#")) return hexToLinear(decl);

  // A component may be `var(--x)`, which contains its own `)` — so match either
  // a bare number or a complete var() call rather than "anything up to a paren".
  const PART = String.raw`(?:var\(--[\w-]+\)|[\d.]+)`;
  const ok = new RegExp(`oklch\\(\\s*(${PART})\\s+(${PART})\\s+(${PART})\\s*\\)`).exec(decl);
  if (!ok) throw new Error(`token --${name} is not a literal colour: ${decl}`);

  const [, Lraw, c, h] = ok;
  // Chroma and hue may be var() references into the brand knobs; resolve one level.
  const resolve = (v: string): number => {
    if (!v.startsWith("var(")) return Number(v);
    const inner = v.slice(4, -1).trim();
    const found = new RegExp(`${inner}:\\s*([\\d.]+)`).exec(CSS)?.[1];
    if (found === undefined) throw new Error(`cannot resolve ${v}`);
    return Number(found);
  };

  return oklchToLinearSrgb(resolve(Lraw!), resolve(c!), resolve(h!));
}

/** The body of the rule whose selector text starts at `marker`, by brace matching. */
function ruleBody(marker: string): string {
  const at = CSS.indexOf(marker);
  if (at < 0) throw new Error(`selector not found in tokens.css: ${marker}`);
  const open = CSS.indexOf("{", at);
  let depth = 0;
  for (let i = open; i < CSS.length; i++) {
    if (CSS[i] === "{") depth++;
    else if (CSS[i] === "}" && --depth === 0) return CSS.slice(open + 1, i);
  }
  throw new Error(`unbalanced braces after ${marker}`);
}

/** sys token → the `ref` token it points at, for one theme state. */
function sysMap(marker: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of ruleBody(marker).matchAll(/(--lumo-sys-[\w-]+):\s*([^;]+);/g)) {
    out[m[1]!] = m[2]!.trim();
  }
  return out;
}

const LIGHT_SELECTOR = ':root,\n  [data-theme="light"]';
const DARK_MEDIA_SELECTOR = ':root:not([data-theme="light"])';
const DARK_ATTR_SELECTOR = '[data-theme="dark"] {';

const LIGHT = sysMap(LIGHT_SELECTOR);
/*
 * A dark block declares only what it CHANGES; anything it omits is inherited
 * from the light block, which is the whole reason `accent-mark` has one value
 * in three theme states. Merging light underneath is therefore not a
 * convenience, it is what the browser does, and a matrix built on the dark
 * block alone would silently skip every token dark does not restate.
 */
const DARK_MEDIA = { ...LIGHT, ...sysMap(DARK_MEDIA_SELECTOR) };
const DARK_ATTR = { ...LIGHT, ...sysMap(DARK_ATTR_SELECTOR) };

const THEMES = [
  ["light", LIGHT],
  ["dark (prefers-color-scheme)", DARK_MEDIA],
  ["dark ([data-theme])", DARK_ATTR],
] as const;

/** The `ref` token (or hex literal) a sys token resolves to, as an identity string. */
function resolvesTo(theme: Record<string, string>, sys: string): string {
  const v = theme[sys];
  if (v === undefined) throw new Error(`${sys} is not declared in this theme state`);
  if (v.startsWith("#")) return v;
  const m = /var\((--lumo-ref-[\w-]+)\)/.exec(v);
  if (!m) throw new Error(`${sys} does not resolve to a ref token: ${v}`);
  return m[1]!;
}

function colourOf(theme: Record<string, string>, sys: string): [number, number, number] {
  const id = resolvesTo(theme, sys);
  return id.startsWith("#") ? hexToLinear(id) : refColour(id.slice(2));
}

// ── the permission table ───────────────────────────────────────────────────

/*
 * The five grounds. In LIGHT they collapse to three distinct values (0.985 /
 * 0.970 / white) and in DARK to three (0.145 / 0.205 / 0.269), which is why the
 * page-only sample looked adequate for so long: two thirds of the grounds a
 * token can land on were never measured.
 */
const SURFACES = [
  "--lumo-sys-bg",
  "--lumo-sys-bg-subtle",
  "--lumo-sys-surface",
  "--lumo-sys-surface-hover",
  "--lumo-sys-surface-sunken",
] as const;

const ACCENT_GROUNDS = ["--lumo-sys-accent", "--lumo-sys-accent-hover"] as const;
const STATUS_GROUNDS = [
  "--lumo-sys-positive",
  "--lumo-sys-critical",
  "--lumo-sys-caution",
] as const;

type Klass = "text" | "ui" | "decorative";

/** 4.5 for text, 3 for non-text UI, and a floor that only catches aliasing. */
const FLOOR: Record<Klass, number> = {
  /*
   * WCAG 2.2 SC 1.4.3, the 4.5:1 arm. The 3:1 large-text arm is NOT used
   * anywhere in this matrix, and that is a decision rather than an oversight: a
   * token does not know what size it will be set at. `fg-subtle` is a
   * placeholder at 14px on one component and a 30px empty-state line on
   * another, and grading it as large text would licence the small use. A
   * component that genuinely wants the large-text allowance has to state it,
   * and none currently does.
   */
  text: 4.5,
  /* WCAG 2.2 SC 1.4.11 — the boundary of a control, and the focus indicator. */
  ui: 3,
  /*
   * NOT a visibility standard, and it must not be read as one. The quietest
   * hairline this ramp ships is light `border` on `bg-subtle` at 1.15:1, which
   * has been reviewed and is intended; a floor above that would fail the
   * shipped design, and a decorative rule has no WCAG requirement to appeal to.
   * 1.1 sits just under it so that the assertion still FIRES on the one thing
   * that is unambiguously wrong — a mark collapsed onto its own ground, which
   * measures exactly 1.00:1 — and reports a ratio alongside the identity check
   * below. B3 is the case in point.
   */
  decorative: 1.1,
};

/*
 * mark token → [the grounds it may be painted on, its class].
 *
 * Written generously on purpose. `fg-subtle` on `surface-hover` had no component
 * doing it on one line of source the day this was written, and it is in the list
 * anyway, because a subtle caption inside a row that highlights on hover is one
 * `<div>` away and nothing would report it. The rule for adding a ground is "is
 * there a reason this cannot happen", not "does something do it today".
 */
const PERMITTED: Record<string, readonly [readonly string[], Klass]> = {
  "--lumo-sys-fg": [SURFACES, "text"],
  "--lumo-sys-fg-muted": [SURFACES, "text"],
  "--lumo-sys-fg-subtle": [SURFACES, "text"],
  "--lumo-sys-accent": [SURFACES, "text"],
  "--lumo-sys-positive": [SURFACES, "text"],
  "--lumo-sys-critical": [SURFACES, "text"],
  "--lumo-sys-caution": [SURFACES, "text"],

  /* Both of these are labels ON the accent fill — `accent-fg` from the token
     bridge, `fg-on-accent` from the components. They are never painted on a
     surface, so measuring them there would be meaningless, and the identity
     check below would fire on light `fg-on-accent` ≡ `bg` for no reason: both
     are neutral-50 and they never meet. */
  "--lumo-sys-accent-fg": [ACCENT_GROUNDS, "text"],
  "--lumo-sys-fg-on-accent": [ACCENT_GROUNDS, "text"],

  "--lumo-sys-border": [SURFACES, "decorative"],
  "--lumo-sys-border-strong": [SURFACES, "decorative"],
  "--lumo-sys-border-control": [SURFACES, "ui"],
  /* The ring is drawn just outside the control, so the ground it must separate
     itself from is the page or panel behind it, not the control's own fill. */
  "--lumo-sys-focus": [SURFACES, "ui"],

  /* The label on a solid status fill: `bg-critical text-bg` on the destructive
     button and the solid badge. So `bg` is a MARK here as well as a ground, and
     this row is the reason the matrix is keyed by pair rather than by token. */
  "--lumo-sys-bg": [STATUS_GROUNDS, "text"],
};

/*
 * Sys colour tokens that are grounds only, or are excluded with a reason.
 * Anything not in here and not in PERMITTED fails `every sys colour is
 * classified`, so the sweep cannot quietly stop covering a new token.
 */
const GROUND_ONLY = new Set<string>([
  "--lumo-sys-bg-subtle",
  "--lumo-sys-surface",
  "--lumo-sys-surface-hover",
  "--lumo-sys-surface-sunken",
  "--lumo-sys-accent-hover",
]);

const EXCLUDED: Record<string, string> = {
  /* Swept across ui/, blocks/ and the site on 12 Aug 2026: one usage,
     `bg-accent-mark` on a 16px decorative square, no text on or beside it.
     Neither 4.5:1 nor 3:1 applies to it and inventing a floor would be a number
     with nothing behind it. A second usage means re-measuring, and deleting the
     line below is how that gets noticed. */
  "--lumo-sys-accent-mark": "single decorative usage, no adjacent text",
};

// ── the assertions ─────────────────────────────────────────────────────────

describe("tokens — the file is real", () => {
  it("declares the three tiers", () => {
    // Guards a vacuous pass: if the file moved or emptied, every ratio below
    // would throw rather than silently pass, but this says so plainly.
    expect(TOKENS).toContain("--lumo-ref-");
    expect(TOKENS).toContain("--lumo-sys-");
    expect(TOKENS.length).toBeGreaterThan(2000);
  });

  it("declares the layer order before any rule uses it", () => {
    const layerLine = TOKENS.indexOf("@layer lumo.reset");
    expect(layerLine).toBeGreaterThanOrEqual(0);
    expect(layerLine).toBeLessThan(TOKENS.indexOf("@layer lumo.ref {"));
  });

  it("parsed all three theme states, and each one is substantial", () => {
    // Without this, a selector rename would empty a theme map and every pair
    // built from it would silently vanish from the sweep — a green run over
    // nothing, which is the exact shape of failure this file exists to prevent.
    for (const [name, theme] of THEMES) {
      expect(Object.keys(theme).length, `${name} resolved almost nothing`).toBeGreaterThan(15);
    }
  });
});

describe("the ramp", () => {
  const steps = [...CSS.matchAll(/--lumo-ref-neutral-(\d+):\s*oklch\(([\d.]+)/g)].map(
    (m) => [Number(m[1]), Number(m[2])] as const,
  );

  it("is strictly monotone in lightness", () => {
    expect(steps.length).toBeGreaterThan(10);
    for (let i = 1; i < steps.length; i++) {
      const [n, L] = steps[i]!;
      const [pn, pL] = steps[i - 1]!;
      expect(L, `neutral-${n} (L ${L}) is not darker than neutral-${pn} (L ${pL})`).toBeLessThan(
        pL,
      );
      expect(n).toBeGreaterThan(pn);
    }
  });

  it("has no dead steps — every rung is read by some sys token", () => {
    /*
     * The ramp's header claims one role per step. This is the half of that claim
     * a machine can check, and it is the half that rots: splitting a step to fix
     * a contrast failure leaves the old value behind, defended by a comment
     * describing a role nothing performs any more. The 500 step was exactly that
     * for one commit while B1 was being fixed.
     */
    const referenced = new Set(
      [...CSS.matchAll(/--lumo-sys-[\w-]+:\s*var\((--lumo-ref-neutral-\d+)\)/g)].map((m) => m[1]!),
    );
    for (const [n] of steps) {
      expect(referenced.has(`--lumo-ref-neutral-${n}`), `neutral-${n} is declared but unused`).toBe(
        true,
      );
    }
  });
});

describe("tokens — every sys colour is classified", () => {
  /*
   * The sweep's own coverage gate. A token that is neither a mark with permitted
   * grounds, nor a declared ground, nor explicitly excluded with a reason, is a
   * token nobody has thought about — which is precisely how B1 and B2 survived
   * three reviews.
   */
  it("no sys colour escapes the matrix", () => {
    const colours = Object.keys(LIGHT).filter(
      (k) => !/radius|focus-width|focus-offset|font/.test(k),
    );
    expect(colours.length).toBeGreaterThan(15);
    for (const c of colours) {
      const known = c in PERMITTED || GROUND_ONLY.has(c) || c in EXCLUDED;
      expect(known, `${c} is in neither PERMITTED, GROUND_ONLY nor EXCLUDED`).toBe(true);
    }
  });
});

describe("tokens — the swept contrast matrix", () => {
  const pairs: Array<[string, string, string, string, Klass]> = [];
  for (const [themeName] of THEMES) {
    for (const [mark, [grounds, klass]] of Object.entries(PERMITTED)) {
      for (const ground of grounds) {
        pairs.push([themeName, mark, ground, `${themeName} · ${mark} on ${ground}`, klass]);
      }
    }
  }

  it("sweeps every theme state, not just one", () => {
    // 3 states × 62 pairs. A drop here means a theme block stopped parsing.
    expect(pairs.length).toBe(62 * 3);
  });

  it.each(pairs)("%s", (themeName, mark, ground, _label, klass) => {
    const theme = THEMES.find(([n]) => n === themeName)![1];
    const min = FLOOR[klass];
    const r = ratio(colourOf(theme, mark), colourOf(theme, ground));
    expect(
      r,
      `${mark} on ${ground} in ${themeName} is ${r.toFixed(2)}:1, needs ${min}:1 (${klass})`,
    ).toBeGreaterThanOrEqual(min);
  });
});

describe("tokens — no mark resolves to the ground it sits on", () => {
  /*
   * B3 in one assertion, and the reason it is separate from the ratio sweep:
   * 1.00:1 fails the decorative floor too, but it fails with a NUMBER, and a
   * number invites the fix of nudging the value until the number passes. Naming
   * the aliased pair says what is actually wrong — two token names, one value,
   * so one of them is a lie the source cannot show. Dark `border` and dark
   * `surface-hover` were both `var(--lumo-ref-neutral-800)`, written eight
   * lines apart, reading as two independent decisions.
   *
   * This is the THIRD such collision in this codebase. It only checks marks
   * against their PERMITTED grounds, because aliases between two grounds are
   * deliberate and documented (light `bg-subtle` ≡ `surface-hover` ≡
   * `surface-sunken`; dark `bg` ≡ `surface-sunken`), as is `accent` ≡ `focus`
   * on dark — a focus ring is meant to be the accent colour.
   */
  const cases: Array<[string, string, string]> = [];
  for (const [themeName] of THEMES) {
    for (const [mark, [grounds]] of Object.entries(PERMITTED)) {
      for (const ground of grounds) {
        cases.push([`${themeName} · ${mark} vs ${ground}`, mark, ground]);
      }
    }
  }

  it.each(cases)("%s", (label, mark, ground) => {
    const theme = THEMES.find(([n]) => label.startsWith(n))![1];
    const a = resolvesTo(theme, mark);
    const b = resolvesTo(theme, ground);
    expect(a, `${mark} and ${ground} are both ${a} — two names, one value`).not.toBe(b);
  });
});

describe("tokens — the ladders the names promise", () => {
  /*
   * A ratio floor cannot express "these two are different enough to read as two
   * things". An ORDERING can, without inventing a delta: if `fg` is not more
   * contrasted than `fg-muted`, and `fg-muted` than `fg-subtle`, then the tier
   * the names describe does not exist, whatever each one measures alone. This is
   * what stops a future AA fix from converging `muted` and `subtle` onto the
   * same value to clear the sweep — which very nearly happened while B1 and B2
   * were being fixed, because on the 0.970 wash the window for a token that is
   * both lighter than `muted` and above 4.5:1 was 0.005 wide in L.
   */
  const ladders: Array<[string, readonly string[]]> = [
    ["text", ["--lumo-sys-fg", "--lumo-sys-fg-muted", "--lumo-sys-fg-subtle"]],
    ["border", ["--lumo-sys-border-control", "--lumo-sys-border-strong", "--lumo-sys-border"]],
  ];

  const cases = THEMES.flatMap(([themeName]) =>
    ladders.flatMap(([name, rungs]) =>
      SURFACES.map((g) => [`${themeName} · ${name} ladder on ${g}`, themeName, rungs, g] as const),
    ),
  );

  it.each(cases)("%s", (_label, themeName, rungs, ground) => {
    const theme = THEMES.find(([n]) => n === themeName)![1];
    const bg = colourOf(theme, ground);
    const measured = rungs.map((t) => [t, ratio(colourOf(theme, t), bg)] as const);
    for (let i = 1; i < measured.length; i++) {
      const [name, r] = measured[i]!;
      const [prev, pr] = measured[i - 1]!;
      expect(
        r,
        `${name} (${r.toFixed(2)}:1) is not quieter than ${prev} (${pr.toFixed(2)}:1) on ${ground}`,
      ).toBeLessThan(pr);
    }
  });
});

describe("tokens — the three theme states stay in step", () => {
  /*
   * `[data-theme="dark"]` restates the media-query block verbatim, because an
   * explicit choice has to win inside a light document and a media query cannot
   * express that. Duplicated values drift: a token fixed in one block and
   * forgotten in the other ships a stale explicit-dark theme that nobody sees
   * unless they toggle, on a machine whose OS is set the other way.
   */
  it("the two dark blocks resolve identically, token for token", () => {
    const keys = new Set([...Object.keys(DARK_MEDIA), ...Object.keys(DARK_ATTR)]);
    for (const k of keys) {
      expect(DARK_ATTR[k], `${k} differs between the two dark blocks`).toBe(DARK_MEDIA[k]);
    }
  });

  it("light is genuinely a different theme, not a copy", () => {
    // Guards the opposite vacuous pass: if the dark selector stopped matching,
    // DARK_* would be LIGHT and every dark assertion above would grade light.
    expect(resolvesTo(DARK_MEDIA, "--lumo-sys-bg")).not.toBe(resolvesTo(LIGHT, "--lumo-sys-bg"));
    expect(resolvesTo(DARK_ATTR, "--lumo-sys-fg")).not.toBe(resolvesTo(LIGHT, "--lumo-sys-fg"));
  });
});

describe("theme — the Tailwind bridge stays in sync", () => {
  it("every mapped colour resolves to a token that exists", () => {
    const mapped = [...THEME.matchAll(/--color-[\w-]+:\s*var\((--lumo-sys-[\w-]+)\)/g)].map(
      (m) => m[1]!,
    );
    expect(mapped.length).toBeGreaterThan(10);
    for (const name of mapped) {
      expect(TOKENS, `${name} is mapped in theme.css but absent from tokens.css`).toContain(
        `${name}:`,
      );
    }
  });
});

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * PERSIAN TYPOGRAPHY — B4 AND B5
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Both defects had one cause: a `:lang(fa)` declaration that INHERITS, against
 * a Tailwind utility that writes the same property directly on the element.
 * Inheritance does not compete in the cascade — anything that reaches the
 * element wins over anything inherited into it, whatever the layer. So both
 * rules were correct, documented, reviewed, and inert.
 *
 * These are SOURCE assertions, and the honest limitation is that a source
 * assertion cannot prove a computed value. What proves it is the built
 * stylesheet plus the layer order in it, checked by hand at the commit: the
 * export orders `@layer properties, theme, base, components, utilities,
 * lumo.reset … lumo.script`, so `lumo.script` outranks `utilities`, and
 * `.text-sm` reads `var(--tw-leading, var(--text-sm--line-height))` with
 * `--tw-leading` unset. What these tests CAN do is stop a revert to either
 * broken shape, and each names the broken shape explicitly so that reverting
 * fails by name rather than by ratio.
 */
describe("theme — Persian typography is scoped to language, not direction", () => {
  const scriptBlock = CSS.slice(CSS.indexOf("@layer lumo.script"));

  it("uses :lang(fa) and never [dir=rtl] for script rules", () => {
    // Persian inside an English page is still Persian. A [dir=rtl] selector
    // misses it, leaving tracking applied and Arabic-script joins severed.
    expect(TOKENS).toContain(":lang(fa)");
    expect(scriptBlock).not.toMatch(/\[dir\s*[~^$*|]?=/);
  });

  it("resets letter-spacing and disables synthesised faces", () => {
    expect(scriptBlock).toContain("letter-spacing: normal");
    expect(scriptBlock).toContain("font-synthesis: none");
  });

  it("B4 · sets the leading through the utility's own fallback variable", () => {
    /*
     * `line-height` alone is the shape that shipped inert for months: it is
     * inherited, and `.text-sm` sets line-height ON the element. Overriding
     * `--tw-leading` is the obvious second guess and is ALSO inert — Tailwind v4
     * emits `@property --tw-leading { inherits: false }`, so a value set on
     * :root reaches no descendant. `--text-*--line-height` is an unregistered
     * theme variable, so it inherits, and it is the fallback arm of the
     * utility's own var() — which is why an explicit `leading-*` still wins.
     */
    expect(scriptBlock).toContain("--text-sm--line-height:");
    expect(scriptBlock).toContain("--text-xs--line-height:");
    expect(scriptBlock).not.toContain("--tw-leading");

    // Every size Tailwind ships, or Persian falls back to the Latin ratio on
    // whichever one was forgotten — the same partial coverage as B5's blacklist.
    for (const size of ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"]) {
      expect(scriptBlock, `--text-${size}--line-height is missing`).toContain(
        `--text-${size}--line-height:`,
      );
    }
  });

  it("B5 · the tracking guard is a whitelist, not a list of names", () => {
    /*
     * The blacklist named `.tracking-wide` and `.tracking-widest` and let
     * `tracking-tight` through to 270 Persian elements. Naming the old shape
     * here means a revert to it fails; the substring selector is what makes the
     * rule fail CLOSED for names that do not exist yet.
     */
    expect(scriptBlock).toContain('[class*="tracking-"]');
    expect(scriptBlock).not.toContain(".tracking-wide");
    expect(scriptBlock).not.toContain(".tracking-widest");
    // The one legitimate exemption: a Latin island is not Arabic script.
    expect(scriptBlock).toContain("data-lumo-latn");
  });
});

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * THE FOCUS RING, AND THE ONE TIME IT PAINTED THE WRONG BOX
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `theme.css` carries a second focus rule for controls whose real focus stop is
 * hidden inside the box you actually see — Base UI's `Slider.Thumb` holds an
 * `<input type="range">` clipped to nothing, so the ordinary
 * `[data-lumo]:focus-visible` rule matches something with no painted area.
 *
 * That rule shipped as `:where([data-lumo]):has(> input:focus-visible)`, which
 * ALSO describes every text field on the site: `BaseField.Root` carries
 * `data-lumo` and the `<input>` is its direct child, so focusing one drew a
 * second ring around the label, the control and the description together. It
 * was reported from the built site — "black lines all around it" — and no test
 * saw it, because no test existed. This is that test.
 *
 * It is a SOURCE assertion rather than a rendered one on purpose: `:has()`
 * support in jsdom is a moving target, and a test that silently stops
 * evaluating the selector would report green for the same reason the rule
 * shipped. Asserting the selector's SHAPE cannot go quiet.
 */
describe("the proxy-focus ring", () => {
  it("is opt-in, never structural", () => {
    /*
     * Comments stripped first. Without that, this fails on the docblock in
     * `theme.css` that QUOTES the broken selector while explaining it — the
     * assertion matching its own explanation. That is the second time this
     * session a source-shape check caught its own reflection (the first was
     * the landing page's `formatNumber` guard), which is worth noting as a
     * property of the technique rather than a one-off: a check that forbids a
     * string also forbids describing it, and the description is the thing
     * that stops the bug coming back.
     */
    const rules = THEME.replace(/\/\*[\s\S]*?\*\//g, "");
    // The broad form is the bug. Naming it here means a revert to it fails.
    expect(rules).not.toContain(":where([data-lumo]):has(> input:focus-visible)");
    expect(rules).toContain(":where([data-lumo-proxy-focus]):has(> input:focus-visible)");
  });

  it("still draws the same ring as the ordinary rule", () => {
    // Two rules, one appearance. A separate treatment for hidden-control
    // components would make focus mean two different things on one page.
    const rings = THEME.match(/outline: var\(--lumo-sys-focus-width\) solid var\(--lumo-sys-focus\)/g);
    expect(rings?.length).toBe(2);
  });
});
