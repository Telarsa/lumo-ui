import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const TOKENS = readFileSync(join(import.meta.dirname, "tokens.css"), "utf8");
const THEME = readFileSync(join(import.meta.dirname, "theme.css"), "utf8");

/**
 * The contrast gate.
 *
 * This exists because a shipped brand token failed it. `--lumo-brand-text` was
 * `#5c7a1c`, measured at 4.93:1 — **against white**. The ground it actually sits
 * on is the paper `#f2efe8`, where it is 4.30:1 and fails AA. The brand doc
 * cited 4.72:1, matching neither. Three numbers, none of them the real one.
 *
 * So contrast is computed here against the token's OWN background rather than
 * against an assumed white, and it is computed from the committed CSS rather
 * than from a spreadsheet that can drift from it.
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

/** Resolves a token to linear sRGB, following `oklch(L C H)` or a hex literal. */
function token(name: string): [number, number, number] {
  const decl = new RegExp(`--${name}:\\s*([^;]+);`).exec(TOKENS)?.[1]?.trim();
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
    const found = new RegExp(`${inner.replace(/[-]/g, "\\-")}:\\s*([\\d.]+)`).exec(TOKENS)?.[1];
    if (found === undefined) throw new Error(`cannot resolve ${v}`);
    return Number(found);
  };

  return oklchToLinearSrgb(resolve(Lraw!), resolve(c!), resolve(h!));
}

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
});

describe("tokens — text meets WCAG AA on its own ground", () => {
  const cases: Array<[string, string, string, number]> = [
    // [ label, foreground token, background token, minimum ]
    ["body text on page", "lumo-ref-neutral-950", "lumo-ref-neutral-50", 4.5],
    ["muted text on page", "lumo-ref-neutral-600", "lumo-ref-neutral-50", 4.5],
    ["body text on surface", "lumo-ref-neutral-950", "lumo-ref-neutral-50", 4.5],
    ["accent text on page", "lumo-ref-brand-700", "lumo-ref-neutral-50", 4.5],
    ["dark body on dark page", "lumo-ref-neutral-50", "lumo-ref-neutral-950", 4.5],
    ["dark muted on dark page", "lumo-ref-neutral-400", "lumo-ref-neutral-950", 4.5],
    ["dark accent on dark page", "lumo-ref-brand-400", "lumo-ref-neutral-950", 4.5],
  ];

  it.each(cases)("%s", (_label, fg, bg, min) => {
    const r = ratio(token(fg), token(bg));
    expect(r, `${fg} on ${bg} is ${r.toFixed(2)}:1, needs ${min}:1`).toBeGreaterThanOrEqual(min);
  });
});

describe("tokens — control boundaries meet WCAG 1.4.11 (3:1)", () => {
  it("border-control is distinguishable from the surface it sits on", () => {
    // The reason --lumo-sys-border and --lumo-sys-border-control are separate
    // tokens: a decorative hairline has no contrast requirement, a form-control
    // boundary has 3:1. Collapsing them forces every rule to be too dark.
    const r = ratio(token("lumo-ref-neutral-400"), token("lumo-ref-neutral-50"));
    expect(r, `control border is ${r.toFixed(2)}:1, needs 3:1`).toBeGreaterThanOrEqual(3);
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

describe("theme — Persian typography is scoped to language, not direction", () => {
  it("uses :lang(fa) and never [dir=rtl] for script rules", () => {
    // Persian inside an English page is still Persian. A [dir=rtl] selector
    // misses it, leaving tracking applied and Arabic-script joins severed.
    expect(TOKENS).toContain(":lang(fa)");
    const scriptBlock = TOKENS.slice(TOKENS.indexOf("@layer lumo.script"));
    expect(scriptBlock).not.toMatch(/\[dir\s*[~^$*|]?=/);
  });

  it("resets letter-spacing and disables synthesised faces", () => {
    const scriptBlock = TOKENS.slice(TOKENS.indexOf("@layer lumo.script"));
    expect(scriptBlock).toContain("letter-spacing: normal");
    expect(scriptBlock).toContain("font-synthesis: none");
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
