#!/usr/bin/env node
/**
 * packages/native/src/tokens.ts is GENERATED from packages/theme/src/tokens.css:
 * the same `--lumo-sys-*` semantic tokens, resolved to values React Native can
 * use (hex colours from oklch, dp from rem at 16px, the density and radius
 * knobs at their defaults), for the light scheme and the dark scheme. Native
 * has no cascade to resolve `var()` at runtime, so this script resolves it at
 * build time — and `gate:native-tokens` fails when the committed file drifts
 * from the CSS, the same shape as `gate:catalog`. Brand knobs (hue, chroma)
 * become a runtime `brand` argument, because a native app cannot override a
 * CSS custom property either.
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const css = (await readFile(join(ROOT, "packages/theme/src/tokens.css"), "utf8")).replace(/\/\*[\s\S]*?\*\//g, "");

/** Declarations inside the first `{…}` after `marker` (searched from `after`), as name → raw value. */
function block(/** @type {string} */ marker, /** @type {string} */ after = "") {
  const start = after === "" ? 0 : css.indexOf(after);
  if (start < 0) throw new Error(`tokens.css: ${after} not found`);
  const at = css.indexOf(marker, start);
  if (at < 0) throw new Error(`tokens.css: ${marker} not found`);
  const open = css.indexOf("{", at);
  let depth = 0, i = open;
  for (; i < css.length; i++) { if (css[i] === "{") depth++; else if (css[i] === "}" && --depth === 0) break; }
  /** @type {Map<string, string>} */
  const out = new Map();
  for (const m of css.slice(open + 1, i).matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) out.set(m[1] ?? "", (m[2] ?? "").trim());
  return out;
}

const REF = block(":root", "@layer lumo.ref");
const SYS_LIGHT = block(":root", "@layer lumo.sys");
// The dark scheme: the `[data-theme="dark"]` block carries the same declarations as the media query.
const SYS_DARK = block('[data-theme="dark"]');

const KNOBS = { "--lumo-ref-hue-brand": "0", "--lumo-ref-chroma-brand": "0", "--lumo-ref-hue-neutral": "0", "--lumo-ref-chroma-neutral": "0", "--lumo-ref-radius-scale": "1", "--lumo-ref-density": "0.9" };
for (const [k, v] of Object.entries(KNOBS)) if (REF.get(k) !== v) throw new Error(`tokens.css knob ${k} is ${REF.get(k)}, expected ${v} — update KNOBS`);

/** Resolve `var()` references through sys → ref, brand knobs left symbolic.
 * @param {string} value @param {Map<string, string>} sys @param {number} [depth] @returns {string} */
function resolve(value, sys, depth = 0) {
  if (depth > 12) throw new Error(`cycle resolving ${value}`);
  return value.replace(/var\((--[a-z0-9-]+)\)/g, (_, name) => {
    if (name in KNOBS) return `{${name}}`;
    const v = sys.get(name) ?? REF.get(name);
    if (v === undefined) throw new Error(`unresolved ${name}`);
    return resolve(v, sys, depth + 1);
  });
}

/** oklch(L C h) → #rrggbb (sRGB, gamut-clipped). Achromatic knobs make this exact for the neutral ramp. */
function oklchToHex(/** @type {number} */ L, /** @type {number} */ C, /** @type {number} */ h) {
  const a = C * Math.cos((h * Math.PI) / 180), b = C * Math.sin((h * Math.PI) / 180);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b, m_ = L - 0.1055613458 * a - 0.0638541728 * b, s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  const srgb = lin.map((c) => { const v = Math.min(1, Math.max(0, c)); return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055; });
  return "#" + srgb.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
}

/** A resolved colour → JS source: a hex string, or a call for brand-dependent ramps. */
function colour(/** @type {string} */ resolved) {
  const m = /^oklch\(\s*([\d.]+)\s+(\{--lumo-ref-chroma-(?:brand|neutral)\}|[\d.]+)\s+(\{--lumo-ref-hue-(?:brand|neutral)\}|[\d.]+)\s*\)$/.exec(resolved);
  if (m) {
    const L = Number(m[1]);
    if (m[2] === "{--lumo-ref-chroma-brand}") return `oklch(${L}, brand.chroma, brand.hue)`;
    if (m[2] === "{--lumo-ref-chroma-neutral}") return `oklch(${L}, brand.neutralChroma, brand.neutralHue)`;
    return JSON.stringify(oklchToHex(L, Number(m[2]), Number(m[3])));
  }
  if (/^#[0-9a-f]{6}$/i.test(resolved)) return JSON.stringify(resolved.toLowerCase());
  throw new Error(`cannot express colour: ${resolved}`);
}

const COLOURS = ["bg", "bg-subtle", "surface", "surface-hover", "surface-sunken", "fg", "fg-muted", "fg-subtle", "fg-on-accent", "border", "border-strong", "border-control", "accent", "accent-hover", "accent-fg", "positive", "critical", "caution", "focus"];
const camel = (/** @type {string} */ s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

function scheme(/** @type {Map<string, string>} */ sys) {
  return COLOURS.map((name) => {
    const raw = sys.get(`--lumo-sys-${name}`);
    if (raw === undefined) throw new Error(`--lumo-sys-${name} missing`);
    return `    ${camel(name)}: ${colour(resolve(raw, sys))},`;
  }).join("\n");
}

/** rem × 16 → dp; `round(calc(2.5rem * density), 1px)` and `max(…)` handled at the default density. */
function dp(/** @type {string} */ raw) {
  const r = resolve(raw, SYS_LIGHT).replace(/\{--lumo-ref-radius-scale\}/g, "1").replace(/\{--lumo-ref-density\}/g, "0.9");
  /** @param {string} e @returns {number} */
  const evalCss = (e) => {
    let s = e;
    for (let i = 0; i < 6; i++) {
      s = s.replace(/round\(([^()]*(?:\([^()]*\))*[^()]*),\s*1px\)/g, (_, inner) => `${Math.round(evalCss(inner))}px`);
      s = s.replace(/max\(([^()]*)\)/g, (_, inner) => `${Math.max(...inner.split(",").map((/** @type {string} */ x) => evalCss(x)))}px`);
      s = s.replace(/calc\(([^()]*)\)/g, (_, inner) => `${evalCss(inner)}px`);
    }
    return Number(s.replace(/([\d.]+)rem/g, (_, n) => String(Number(n) * 16)).replace(/px/g, "").split(/\s*\*\s*/).reduce((a, b) => a * Number(b), 1));
  };
  return evalCss(r);
}

const out = `/* GENERATED by scripts/build-native-tokens.mjs from packages/theme/src/tokens.css — do not edit.
 * The same \`--lumo-sys-*\` semantic tokens as the web theme, resolved for React
 * Native: hex colours (oklch → sRGB) for the light and dark schemes, dp for
 * radii and control heights (rem × 16 at the default density 0.9 and radius
 * scale 1). Brand hue/chroma are the one runtime knob, as on the web. */

/** The web theme's ref-tier knobs: \`--lumo-ref-{hue,chroma}-brand\` and \`-neutral\`. Default achromatic, as on the web. */
export interface LumoBrand {
  hue: number;
  chroma: number;
  neutralHue: number;
  neutralChroma: number;
}
export const ACHROMATIC: LumoBrand = { hue: 0, chroma: 0, neutralHue: 0, neutralChroma: 0 };

/** oklch(L C h) → #rrggbb (sRGB, gamut-clipped) — the ramp's lightness is fixed; a brand turns only hue and chroma. */
export function oklch(L: number, C: number, h: number): string {
  const a = C * Math.cos((h * Math.PI) / 180);
  const b = C * Math.sin((h * Math.PI) / 180);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return (
    "#" +
    lin
      .map((c) => {
        const v = Math.min(1, Math.max(0, c));
        const srgb = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
        return Math.round(srgb * 255).toString(16).padStart(2, "0");
      })
      .join("")
  );
}

export interface LumoSchemeColours {
${COLOURS.map((n) => `  ${camel(n)}: string;`).join("\n")}
}

export function lightColours(brand: LumoBrand = ACHROMATIC): LumoSchemeColours {
  return {
${scheme(SYS_LIGHT)}
  };
}

export function darkColours(brand: LumoBrand = ACHROMATIC): LumoSchemeColours {
  return {
${scheme(SYS_DARK)}
  };
}

/** Radii in dp (web: --lumo-sys-radius-*). */
export const radius = { sm: ${dp("var(--lumo-ref-radius-sm)")}, md: ${dp("var(--lumo-ref-radius-md)")}, lg: ${dp("var(--lumo-ref-radius-lg)")} } as const;
/** Control heights in dp at the default density (web: --lumo-ref-control-*). */
export const control = { sm: ${dp("var(--lumo-ref-control-sm)")}, md: ${dp("var(--lumo-ref-control-md)")}, lg: ${dp("var(--lumo-ref-control-lg)")} } as const;
/** Focus ring (web: --lumo-sys-focus-width / -offset). */
export const focus = { width: ${parseInt(SYS_LIGHT.get("--lumo-sys-focus-width") ?? "2")}, offset: ${parseInt(SYS_LIGHT.get("--lumo-sys-focus-offset") ?? "2")} } as const;
`;

const OUT = join(ROOT, "packages/native/src/tokens.ts");
if (process.argv.includes("--check")) {
  const current = await readFile(OUT, "utf8").catch(() => "");
  if (current !== out) { console.error("  native-tokens: packages/native/src/tokens.ts is stale; run node scripts/build-native-tokens.mjs"); process.exit(1); }
  console.log(`  native-tokens: ${COLOURS.length} colours × 2 schemes, radius/control/focus checked`);
} else {
  await writeFile(OUT, out);
  console.log(`  native-tokens: wrote packages/native/src/tokens.ts (${COLOURS.length} colours × 2 schemes)`);
}
