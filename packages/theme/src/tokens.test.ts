import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const TOKENS_ONLY = readFileSync(join(import.meta.dirname, "tokens.css"), "utf8");
const SCRIPT = readFileSync(join(import.meta.dirname, "script.css"), "utf8");
// tokens.css + script.css: the Persian typography block moved to its opt-in file on 16 Aug 2026; the pins below still read one text.
const TOKENS = TOKENS_ONLY + "\n" + SCRIPT;
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
  /* The scrim is a translucent BLACK, and this matrix's arithmetic cannot see
     through alpha — the same limitation tokens.css states about Nova's
     10%/15%-white dark borders. Crossing it with the five grounds would either
     throw in `refColour` (which parses `oklch(L C H)` and not `oklch(L C H / A)`)
     or, worse, quietly grade the un-composited black and report a comfortable
     21:1 for a colour nobody ever sees at full strength.
     It is not unmeasured, it is measured somewhere the sweep cannot go: the
     `the scrim` block below composites it onto each theme's page ground by hand
     and asserts the resulting ratios. Deleting this line is how a future reader
     is forced to notice that. */
  "--lumo-sys-scrim": "translucent; composited and measured in `the scrim` below",
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
    /*
     * `shadow` joins radius/focus-width/focus-offset/font in the filter because
     * a `--lumo-sys-shadow-*` is not a colour: its value is a box-shadow LIST,
     * so `resolvesTo` cannot resolve it and there is no single mark to grade
     * against a ground. Its own assertions are in `the elevation ramp` below,
     * and they are about alpha ordering and about the one number that decides
     * how the dark ramp is built.
     */
    const colours = Object.keys(LIGHT).filter(
      (k) => !/radius|focus-width|focus-offset|font|shadow/.test(k),
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

describe("tokens — status text on its OWN tint", () => {
  /*
   * The chips: `bg-positive/10 text-positive` (badge, tag, alert). The swept
   * matrix grades status text on the plain surfaces; the browser evidence job
   * (axe in Chromium, 15 Aug 2026) measured the chip ground — the token at 10%
   * composited over the surface — at 4.47 / 4.25 / 4.43 for positive / critical
   * / caution in light. Browsers composite alpha in GAMMA sRGB, not linear, so
   * the blend below does too; that is why the 0.970 "wash" model above passed
   * what axe failed.
   */
  const toGamma = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
  const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const tint = (mark: [number, number, number], ground: [number, number, number], alpha: number) =>
    mark.map((c, i) => toLinear(alpha * toGamma(c) + (1 - alpha) * toGamma(ground[i]!))) as [number, number, number];

  const cases = THEMES.flatMap(([themeName]) =>
    STATUS_GROUNDS.flatMap((status) => SURFACES.map((surface) => [themeName, status, surface] as const)),
  );

  it.each(cases)("%s: %s on its own 10% tint over %s", (themeName, status, surface) => {
    const theme = THEMES.find(([n]) => n === themeName)![1];
    const mark = colourOf(theme, status);
    const ground = tint(mark, colourOf(theme, surface), 0.1);
    const r = ratio(mark, ground);
    expect(r, `${status} on its own 10% tint over ${surface} is ${r.toFixed(2)}:1, needs 4.5:1`).toBeGreaterThanOrEqual(4.5);
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

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * THE SCRIM AND THE ELEVATION RAMP
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Both are new on 12 Aug 2026 and both replace something that was NOT a token:
 * `bg-black/50`, written twice, the only two untokenised colours in the
 * library; and twelve overlays spread across five rungs of Tailwind's default
 * shadow ramp, which a brand cannot reach at all.
 *
 * They get their own block rather than a row in the matrix above because the
 * matrix grades an opaque mark against an opaque ground, and neither of these
 * is that. A scrim is translucent by definition — its whole job is to change
 * what is behind it — and a shadow is a list of four numbers and a colour. So
 * the arithmetic is done here, explicitly, on the composite.
 */
describe("the scrim", () => {
  /** Alpha out of `oklch(L C H / A)`, from the committed CSS. */
  function scrimAlpha(ref: string): number {
    const decl = new RegExp(`--${ref}:\\s*([^;]+);`).exec(CSS)?.[1]?.trim();
    if (decl === undefined) throw new Error(`--${ref} not found`);
    const a = /oklch\(\s*0\s+0\s+0\s*\/\s*([\d.]+)\s*\)/.exec(decl)?.[1];
    if (a === undefined) throw new Error(`--${ref} is not a black with an alpha: ${decl}`);
    return Number(a);
  }

  /** Black at `alpha` over a linear-light colour. Black contributes nothing. */
  function dim(c: [number, number, number], alpha: number): [number, number, number] {
    return [c[0] * (1 - alpha), c[1] * (1 - alpha), c[2] * (1 - alpha)];
  }

  const LIGHT_ALPHA = scrimAlpha("lumo-ref-scrim");
  const DARK_ALPHA = scrimAlpha("lumo-ref-scrim-dark");

  it("is a token at all — no component may paint its own", () => {
    // The defect this replaces, named so a revert fails by name: `bg-black/50`
    // in dialog.tsx and drawer.tsx. `system-vocabulary.test.ts` holds the
    // component half; this holds the theme half.
    expect(LIGHT).toHaveProperty("--lumo-sys-scrim");
    expect(DARK_MEDIA["--lumo-sys-scrim"]).not.toBe(LIGHT["--lumo-sys-scrim"]);
  });

  it("light keeps exactly the alpha `bg-black/50` had, so no light pixel moved", () => {
    /*
     * This is the assertion that makes the change reviewable. Tokenising a
     * value and CHANGING it in the same edit means every reviewer has to take
     * the new number on trust; keeping 0.5 means the light theme is provably
     * byte-identical and only the dark theme needs judging.
     */
    expect(LIGHT_ALPHA).toBe(0.5);
  });

  it("light: the modal reads clearly off the page it dims", () => {
    const page = colourOf(LIGHT, "--lumo-sys-bg");
    const modal = colourOf(LIGHT, "--lumo-sys-surface");
    const r = ratio(modal, dim(page, LIGHT_ALPHA));
    // 1.99:1 as committed. A floor rather than an equality, so a brand that
    // darkens its page cannot silently collapse the modal into it.
    expect(r, `modal on the dimmed page is ${r.toFixed(3)}:1`).toBeGreaterThan(1.8);
  });

  it("dark: raising the alpha CANNOT separate the modal from the page, and the number says so", () => {
    /*
     * The measurement that decided the dark value, kept as an assertion because
     * it is counter-intuitive and the wrong fix is very cheap to reach for. The
     * dark page is already Y 0.00305, so a black scrim has nothing to remove:
     * going from 0.50 to 0.80 alpha moves the modal-vs-page ratio from 1.138:1
     * to 1.158:1. Two hundredths.
     *
     * If someone later "fixes" a flat-looking dark modal by pushing the alpha
     * up, this test does not fail — it is not a floor. It is here so the next
     * reader finds the number before spending the alpha. The floor that DOES
     * fail is the next test.
     */
    const page = colourOf(DARK_MEDIA, "--lumo-sys-bg");
    const modal = colourOf(DARK_MEDIA, "--lumo-sys-surface");
    const at = (a: number) => ratio(modal, dim(page, a));
    expect(at(0.8) - at(0.5), "the alpha bought more than 0.05 of ratio").toBeLessThan(0.05);
    // And the separation that actually does the work is the surface step, which
    // exists with no scrim at all.
    expect(ratio(modal, page), "dark surface no longer steps off dark bg").toBeGreaterThan(1.1);
  });

  it("dark: the scrim is sized to suppress the brightest thing on the page", () => {
    /*
     * What the dark alpha IS for. The only loud things on a dark page are
     * accent fills, imagery and media; the accent is the one this file can
     * measure. At `brand-400` (Y 0.7838) an unscrimmed accent button reads
     * 8.9:1 against the modal that is supposed to have taken over the screen.
     * 0.72 brings it to 4.60:1 — still visible, no longer competing.
     */
    const accent = colourOf(DARK_MEDIA, "--lumo-sys-accent");
    const modal = colourOf(DARK_MEDIA, "--lumo-sys-surface");
    const behind = ratio(modal, dim(accent, DARK_ALPHA));
    expect(
      behind,
      `a dark accent fill behind the scrim reads ${behind.toFixed(2)}:1 against the modal`,
    ).toBeLessThan(5.5);
    // Not so dark that the page stops existing: a scrim that hides the context
    // entirely is a page transition, not a modal.
    expect(DARK_ALPHA).toBeLessThan(0.85);
    expect(DARK_ALPHA).toBeGreaterThan(LIGHT_ALPHA);
  });
});

describe("the elevation ramp", () => {
  /** Every alpha in a shadow list, in order. */
  function alphas(ref: string): number[] {
    const decl = new RegExp(`--${ref}:\\s*([^;]+);`).exec(CSS)?.[1];
    if (decl === undefined) throw new Error(`--${ref} not found in tokens.css`);
    const found = [...decl.matchAll(/oklch\(\s*0\s+0\s+0\s*\/\s*([\d.]+)\s*\)/g)].map((m) =>
      Number(m[1]),
    );
    if (found.length === 0) throw new Error(`--${ref} declares no shadow colour: ${decl}`);
    return found;
  }

  /** The geometry of a shadow list, with the colours removed. */
  function geometry(ref: string): string {
    const decl = new RegExp(`--${ref}:\\s*([^;]+);`).exec(CSS)?.[1];
    if (decl === undefined) throw new Error(`--${ref} not found in tokens.css`);
    return decl.replace(/oklch\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
  }

  const TIERS = ["raised", "overlay", "modal"] as const;

  it("there are three tiers and each is published to Tailwind", () => {
    // Three, not five. The count IS the fix: twelve overlays sat on five rungs
    // of Tailwind's ramp because no rung meant anything.
    for (const tier of TIERS) {
      expect(TOKENS, `--lumo-sys-shadow-${tier} is missing`).toContain(
        `--lumo-sys-shadow-${tier}:`,
      );
      expect(THEME, `--shadow-${tier} is not bridged`).toContain(
        `--shadow-${tier}: var(--lumo-sys-shadow-${tier})`,
      );
    }
    // And no fourth appears without this test being read.
    const declared = [...CSS.matchAll(/--lumo-sys-shadow-([\w-]+):/g)].map((m) => m[1]);
    expect([...new Set(declared)].sort()).toEqual(["modal", "overlay", "raised"]);
  });

  it("is a ladder: each tier is strictly heavier than the one below", () => {
    /*
     * The property a set of names cannot carry on its own. `md` sat above `lg`
     * for the chart tooltip and below it for the popover in the ramp this
     * replaces, and nothing could have reported that, because "md" and "lg" do
     * not claim an order relative to which SURFACE they are on.
     */
    for (const theme of ["", "-dark"]) {
      const total = TIERS.map(
        (t) => [t, alphas(`lumo-ref-shadow-${t}${theme}`).reduce((a, b) => a + b, 0)] as const,
      );
      for (let i = 1; i < total.length; i++) {
        const [name, a] = total[i]!;
        const [prev, pa] = total[i - 1]!;
        expect(
          a,
          `${name}${theme} (Σα ${a.toFixed(2)}) is not heavier than ${prev}${theme} (Σα ${pa.toFixed(2)})`,
        ).toBeGreaterThan(pa);
      }
    }
  });

  it("light and dark share GEOMETRY and differ only in alpha", () => {
    /*
     * A shadow that changes shape with the theme is two elevation systems
     * wearing one set of names. The only thing the ground legitimately changes
     * is how much of the shadow survives it, which is the alpha.
     */
    for (const tier of TIERS) {
      expect(geometry(`lumo-ref-shadow-${tier}`), `${tier} changes shape on dark`).toBe(
        geometry(`lumo-ref-shadow-${tier}-dark`),
      );
    }
  });

  it("the dark ramp is heavier, and the reason it cannot simply be heavier still", () => {
    /*
     * ── THE NUMBER THAT SHAPED THE DARK RAMP ─────────────────────────────────
     *
     * A black shadow on the dark page is close to a no-op, and the instinct on
     * seeing a flat dark overlay is to raise the alpha. Measured against
     * `--lumo-sys-bg` (L 0.145, Y 0.00305):
     *
     *     α 0.10 → 1.006:1     α 0.40 → 1.024:1     α 0.60 → 1.036:1
     *
     * The quietest hairline this theme ships ON PURPOSE is 1.15:1. So even at
     * 60% black the shadow is several times quieter than a rule chosen for
     * being nearly invisible, and no alpha under 1.0 reaches it. Dark elevation
     * is carried by the lighter surface and by `border-border`; the ramp below
     * is raised because it does real work over `surface-hover`, imagery and
     * accent fills, not over the page.
     *
     * This assertion pins the finding rather than the ramp: if the ceiling ever
     * stops being a ceiling, the whole dark design decision is worth re-opening.
     */
    const page = colourOf(DARK_MEDIA, "--lumo-sys-bg");
    const ceiling = ratio(page, [page[0] * 0.4, page[1] * 0.4, page[2] * 0.4]); // α = 0.6
    expect(
      ceiling,
      `60% black over the dark page reaches ${ceiling.toFixed(3)}:1 — if this ever exceeds ` +
        `the 1.15:1 hairline, dark elevation can be a shadow after all`,
    ).toBeLessThan(1.15);

    for (const tier of TIERS) {
      const light = alphas(`lumo-ref-shadow-${tier}`).reduce((a, b) => a + b, 0);
      const dark = alphas(`lumo-ref-shadow-${tier}-dark`).reduce((a, b) => a + b, 0);
      expect(dark, `${tier} is no heavier on dark`).toBeGreaterThan(light);
      // Not opaque: past ~0.7 per layer the shadow reads as a black halo on a
      // page that had nothing bright on it, and it swallows the modal's own edge.
      for (const a of alphas(`lumo-ref-shadow-${tier}-dark`)) expect(a).toBeLessThanOrEqual(0.7);
    }
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
    expect(rules).toMatch(
      /:where\(\[data-lumo-proxy-focus\], \.lumo-proxy-focus\):has\(\s*> :is\(input, select\):focus-visible\s*\)/,
    );
    /*
     * `select` joined `input` on 12 Aug 2026, when the calendar's caption
     * dropdown turned out to be the same defect in a different element — a
     * real `<select class="opacity-0">` over a painted `aria-hidden` span. It
     * had solved it locally with `has-[select:focus-visible]:outline-accent`,
     * which was a fifth focus mechanism reading the wrong token.
     *
     * Widening the CHILD cannot recreate the double-ring bug, and this is the
     * assertion that says why: what made the broken rule structural was the
     * `[data-lumo]` subject, which every field root carries. No `:has()` rule
     * may hang off it, whatever the child.
     */
    expect(rules).not.toMatch(/:where\(\[data-lumo\]\):has\(/);
  });

  it("still draws the same ring as the ordinary rule", () => {
    // Two rules, one appearance. A separate treatment for hidden-control
    // components would make focus mean two different things on one page.
    const rings = THEME.match(/outline: var\(--lumo-sys-focus-width\) solid var\(--lumo-sys-focus\)/g);
    expect(rings?.length).toBe(2);
  });
});
