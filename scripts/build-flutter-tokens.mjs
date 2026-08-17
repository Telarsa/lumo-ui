#!/usr/bin/env node
/**
 * packages/mobile/lib/src/tokens.g.dart (Lumo UI Mobile) is GENERATED from packages/theme/src/tokens.css:
 * the same `--lumo-sys-*` semantic tokens, resolved to values Flutter can
 * use (hex colours from oklch, dp from rem at 16px, the density and radius
 * knobs at their defaults), for the light scheme and the dark scheme. Flutter
 * has no cascade to resolve `var()` at runtime, so this script resolves it at
 * build time — and `gate:flutter-tokens` fails when the committed file drifts
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


/**
 * `--lumo-ref-shadow-*` → a Dart `List<BoxShadow>`.
 *
 * The CSS form is `<x> <y> <blur> <spread> oklch(0 0 0 / <a>)`, repeated. Only
 * the alpha varies between the ramps, so the parse is deliberately narrow and
 * throws on anything it does not recognise rather than emitting a wrong shadow.
 */
function shadowLayers(/** @type {string} */ token) {
  const raw = REF.get(token);
  if (raw === undefined) throw new Error(`tokens.css: ${token} not found`);
  const layers = [];
  // `px` is optional: CSS writes a zero offset as a bare `0`.
  const len = String.raw`(-?[\d.]+)(?:px)?`;
  const layer = new RegExp(`${len}\\s+${len}\\s+${len}\\s+${len}\\s+oklch\\(0 0 0 / ([\\d.]+)\\)`, "g");
  for (const m of raw.matchAll(layer)) {
    const [, x, y, blur, spread, alpha] = m;
    layers.push(`BoxShadow(color: Color(0x${Math.round(Number(alpha) * 255).toString(16).padStart(2, "0").toUpperCase()}000000), offset: Offset(${Number(x)}, ${Number(y)}), blurRadius: ${Number(blur)}, spreadRadius: ${Number(spread)})`);
  }
  if (layers.length === 0) throw new Error(`tokens.css: ${token} matched no shadow layer — the CSS shape changed`);
  return layers;
}

/** One tier's Dart getter, both schemes. */
function shadowTier(/** @type {string} */ name, /** @type {string} */ token) {
  const light = shadowLayers(token).map((l) => `        ${l},`).join("\n");
  const dark = shadowLayers(`${token}-dark`).map((l) => `        ${l},`).join("\n");
  return `  /// ${name} — the web's \`${token}\`. The DARK ramp is not the light one
  /// re-tinted: a black shadow on a dark page is arithmetically almost a no-op,
  /// so the alphas are separately chosen (tokens.css says why at length).
  static List<BoxShadow> ${name}(Brightness brightness) => brightness == Brightness.dark
      ? const [
${dark}
        ]
      : const [
${light}
        ];
`;
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

/** A resolved colour → DART source: a Color literal, or a call for brand-dependent ramps. */
function colour(/** @type {string} */ resolved) {
  const m = /^oklch\(\s*([\d.]+)\s+(\{--lumo-ref-chroma-(?:brand|neutral)\}|[\d.]+)\s+(\{--lumo-ref-hue-(?:brand|neutral)\}|[\d.]+)\s*\)$/.exec(resolved);
  if (m) {
    const L = Number(m[1]);
    if (m[2] === "{--lumo-ref-chroma-brand}") return `oklch(${L}, brand.chroma, brand.hue)`;
    if (m[2] === "{--lumo-ref-chroma-neutral}") return `oklch(${L}, brand.neutralChroma, brand.neutralHue)`;
    return dartColor(oklchToHex(L, Number(m[2]), Number(m[3])));
  }
  if (/^#[0-9a-f]{6}$/i.test(resolved)) return dartColor(resolved.toLowerCase());
  // oklch with alpha (the scrim): hex plus an alpha byte, which React Native accepts (#rrggbbaa).
  const a = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\/\s*([\d.]+)\s*\)$/.exec(resolved);
  if (a) return dartColor(oklchToHex(Number(a[1]), Number(a[2]), Number(a[3])), Math.round(Number(a[4]) * 255));
  throw new Error(`cannot express colour: ${resolved}`);
}

const COLOURS = ["bg", "bg-subtle", "surface", "surface-hover", "surface-sunken", "fg", "fg-muted", "fg-subtle", "fg-on-accent", "border", "border-strong", "border-control", "accent", "accent-hover", "accent-fg", "positive", "critical", "caution", "focus", "scrim"];
const camel = (/** @type {string} */ s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/** `#rrggbb` (+ alpha byte) → `Color(0xAARRGGBB)`. */
function dartColor(/** @type {string} */ hex, alpha = 255) {
  return `Color(0x${alpha.toString(16).padStart(2, "0").toUpperCase()}${hex.slice(1).toUpperCase()})`;
}
function scheme(/** @type {Map<string, string>} */ sys) {
  return COLOURS.map((name) => {
    const raw = sys.get(`--lumo-sys-${name}`);
    if (raw === undefined) throw new Error(`--lumo-sys-${name} missing`);
    return `      ${camel(name)}: ${colour(resolve(raw, sys))},`;
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

const out = `// GENERATED by scripts/build-flutter-tokens.mjs (lumo-ui) from packages/theme/src/tokens.css — do not edit.
// The same \`--lumo-sys-*\` semantic tokens as the web theme and the React Native
// package, resolved for Flutter: Colors (oklch → sRGB) for the light and dark
// schemes, logical pixels for radii and control heights (rem × 16 at density 0.9,
// radius scale 1). Brand hue/chroma are the one runtime knob, as everywhere.
import 'dart:math' as math;
import 'dart:ui' show Brightness, Color, Offset;
// BoxShadow is painting's, not dart:ui's — the elevation tiers below need it.
import 'package:flutter/painting.dart' show BoxShadow;

/// The web theme's ref-tier knobs. Default achromatic, as on the web.
class LumoBrand {
  const LumoBrand({this.hue = 0, this.chroma = 0, this.neutralHue = 0, this.neutralChroma = 0});
  final double hue;
  final double chroma;
  final double neutralHue;
  final double neutralChroma;
  static const achromatic = LumoBrand();
}

/// oklch(L C h) → sRGB Color (gamut-clipped). The ramp's lightness is fixed; a brand turns hue and chroma.
Color oklch(double l, double c, double h) {
  final a = c * math.cos(h * math.pi / 180);
  final b = c * math.sin(h * math.pi / 180);
  final l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  final m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  final s_ = l - 0.0894841775 * a - 1.291485548 * b;
  final l3 = l_ * l_ * l_, m3 = m_ * m_ * m_, s3 = s_ * s_ * s_;
  final lin = [
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  ];
  int channel(double v) {
    final x = v.clamp(0.0, 1.0);
    final srgb = x <= 0.0031308 ? 12.92 * x : 1.055 * math.pow(x, 1 / 2.4) - 0.055;
    return (srgb * 255).round();
  }
  return Color.fromARGB(255, channel(lin[0]), channel(lin[1]), channel(lin[2]));
}

/// The semantic palette of one scheme (\`--lumo-sys-*\`).
class LumoSchemeColours {
  const LumoSchemeColours({
${COLOURS.map((n) => `    required this.${camel(n)},`).join("\n")}
  });
${COLOURS.map((n) => `  final Color ${camel(n)};`).join("\n")}

  /// A consumer's palette: on the web the \`--lumo-sys-*\` tier is what a
  /// consumer overrides (custom properties); here it is this method on the
  /// generated defaults, handed to \`LumoScope(light:, dark:)\`.
  LumoSchemeColours copyWith({
${COLOURS.map((n) => `    Color? ${camel(n)},`).join("\n")}
  }) =>
      LumoSchemeColours(
${COLOURS.map((n) => `        ${camel(n)}: ${camel(n)} ?? this.${camel(n)},`).join("\n")}
      );

  @override
  bool operator ==(Object other) =>
      other is LumoSchemeColours &&
${COLOURS.map((n) => `      other.${camel(n)} == ${camel(n)}`).join(" &&\n")};

  @override
  int get hashCode => Object.hashAll([${COLOURS.map((n) => camel(n)).join(", ")}]);
}

LumoSchemeColours lightColours([LumoBrand brand = LumoBrand.achromatic]) => LumoSchemeColours(
${scheme(SYS_LIGHT)}
    );

LumoSchemeColours darkColours([LumoBrand brand = LumoBrand.achromatic]) => LumoSchemeColours(
${scheme(SYS_DARK)}
    );

/// Radii in logical pixels (web: --lumo-sys-radius-*).
class LumoRadius {
  static const double sm = ${dp("var(--lumo-ref-radius-sm)")};
  static const double md = ${dp("var(--lumo-ref-radius-md)")};
  static const double lg = ${dp("var(--lumo-ref-radius-lg)")};
}
/// Control heights at the default density (web: --lumo-ref-control-*).
class LumoControl {
  static const double sm = ${dp("var(--lumo-ref-control-sm)")};
  static const double md = ${dp("var(--lumo-ref-control-md)")};
  static const double lg = ${dp("var(--lumo-ref-control-lg)")};
}
/// Focus ring (web: --lumo-sys-focus-width / -offset).
class LumoFocus {
  static const double width = ${parseInt(SYS_LIGHT.get("--lumo-sys-focus-width") ?? "2")};
  static const double offset = ${parseInt(SYS_LIGHT.get("--lumo-sys-focus-offset") ?? "2")};
}
/// Elevation (web: --lumo-sys-shadow-raised / -overlay / -modal).
///
/// The tier is NOT "how big" — it is what the shadow has to separate the
/// surface from. Before this existed every mobile widget hand-picked a
/// shadow, and the hand-picked ones were the same in both schemes, which on
/// dark is close to painting nothing.
class LumoShadow {
${shadowTier("raised", "--lumo-ref-shadow-raised")}
${shadowTier("overlay", "--lumo-ref-shadow-overlay")}
${shadowTier("modal", "--lumo-ref-shadow-modal")}}
`;

const OUT = (process.argv.includes("--out") && process.argv[process.argv.indexOf("--out") + 1]) || join(ROOT, "packages", "mobile", "lib", "src", "tokens.g.dart");
if (process.argv.includes("--check")) {
  const current = await readFile(OUT, "utf8").catch(() => "");
  if (current !== out) { console.error(`  flutter-tokens: ${OUT} is stale; run node scripts/build-flutter-tokens.mjs`); process.exit(1); }
  console.log(`  flutter-tokens: ${COLOURS.length} colours × 2 schemes checked`);
} else {
  await writeFile(OUT, out);
  console.log(`  flutter-tokens: wrote ${OUT} (${COLOURS.length} colours × 2 schemes)`);
}
