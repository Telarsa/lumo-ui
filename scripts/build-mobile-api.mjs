#!/usr/bin/env node
/**
 * Generates the MOBILE prop reference — `mobile-api-reference.json` — from the
 * Dart sources of Lumo UI Mobile (`packages/mobile/lib/src/*.dart`), so a
 * component page's **Mobile** tab shows the same generated props table its Web
 * sibling shows. The web half is `scripts/build-api-reference.mjs`, which reads
 * the TypeScript CHECKER; this half has no checker to lean on.
 *
 * **This file parses Dart with regular expressions, and that is crude.** There
 * is no Dart analyser in this Node toolchain, and adding one would be a runtime
 * dependency (AGENTS.md: ask first). So the parser is deliberately narrow and
 * deliberately COWARDLY: it recognises exactly the shapes this library actually
 * writes —
 *
 *     class LumoX extends StatelessWidget|StatefulWidget { … }   a widget
 *     class LumoY { … }                                          a data class a widget takes
 *     const LumoX({super.key, required this.a, this.b = v})      the unnamed constructor
 *     final <Type> <name>;                                       the field the parameter initialises
 *     /// …                                                      the docblock above either
 *
 * — and anything it cannot read with confidence it OMITS and reports on stderr
 * rather than guessing. A missing row is a gap someone can see; a wrong type in
 * a props table is a lie the reader has no way to catch. Every omission is
 * printed under `skipped:` at the end of a build; read them.
 *
 * What it deliberately does not do:
 *   - named constructors (`LumoBadge.dot`, `LumoDescription.widget`) — the
 *     contract's shape is one entry per class, keyed by the class name;
 *   - positional parameters — this library has none, so the shape is unwritten;
 *   - `super.key` — Flutter's, on every widget, and no more this library's prop
 *     than React's `key` is;
 *   - anything in `*.g.dart` (generated: `tokens.g.dart` is graded by
 *     `gate:flutter-tokens`).
 *
 * ANNOUNCED STRINGS. Rule 1 — every announced string is a REQUIRED prop — is
 * what this library is an argument for, so the table must be able to MARK those
 * props. A prop is announced when its NAME is in the announced family and its
 * TYPE is a String (or a `String Function(…)`, the "the app formats it" seam).
 * The name pattern is copied verbatim from `ANNOUNCED` in
 * `scripts/flutter-contract-gate.mjs` — the gate that fails a build over the
 * same family. The two definitions must stay identical; they are NOT imported
 * across, because the gate must stay a self-contained grader. If you change one
 * regex, change the other in the same commit.
 *
 * Usage: `node scripts/build-mobile-api.mjs`         writes mobile-api-reference.json
 *        `node scripts/build-mobile-api.mjs --check` fails when the committed
 *                                                    file is stale (gate:mobile-api)
 */
import { readdirSync, readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC_REL = "packages/mobile/lib/src";
const SRC = join(ROOT, SRC_REL);
const OUT =
  (process.argv.includes("--out") && process.argv[process.argv.indexOf("--out") + 1]) ||
  join(ROOT, "mobile-api-reference.json");

/** Everything this run could not read confidently. Printed at the end, never silent. */
/** @type {string[]} */
const skipped = [];
const skip = (/** @type {string} */ what) => skipped.push(what);

/*
 * ── the announced family ─────────────────────────────────────────────────────
 * KEEP IDENTICAL to `ANNOUNCED` in scripts/flutter-contract-gate.mjs (which
 * points back here). Parameter names that name or describe something a person
 * hears or reads.
 */
const ANNOUNCED = /^(.*Label|label|hint|message|description|placeholder|title|text|tooltip|semanticLabel|errorMessage|helperText)$/;

/**
 * Blank out comments and string literals, keeping every byte position and every
 * newline, so brace/paren matching and structural regexes see CODE only. The
 * original source is what gets sliced for text; the mask is only ever used to
 * find boundaries.
 */
function maskSource(/** @type {string} */ src) {
  const out = src.split("");
  const blank = (/** @type {number} */ a, /** @type {number} */ b) => {
    for (let k = a; k < Math.min(b, src.length); k++) if (src[k] !== "\n") out[k] = " ";
  };
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (c === "/" && n === "/") {
      let j = i;
      while (j < src.length && src[j] !== "\n") j++;
      blank(i, j);
      i = j;
      continue;
    }
    if (c === "/" && n === "*") {
      let j = i + 2;
      while (j < src.length && !(src[j] === "*" && src[j + 1] === "/")) j++;
      blank(i, j + 2);
      i = j + 2;
      continue;
    }
    // A raw string (`r'…'`) has no escapes and no interpolation.
    const raw = c === "r" && (n === "'" || n === '"');
    const q = raw ? n : c;
    if (q === "'" || q === '"') {
      let j = raw ? i + 1 : i;
      const triple = src.slice(j, j + 3) === q.repeat(3);
      const close = triple ? q.repeat(3) : q;
      j += close.length;
      while (j < src.length) {
        if (!raw && src[j] === "\\") { j += 2; continue; }
        if (!raw && src[j] === "$" && src[j + 1] === "{") {
          // Interpolated code: skip to the matching brace so a quote inside it
          // cannot end the literal early.
          let depth = 0;
          j += 1;
          for (; j < src.length; j++) {
            if (src[j] === "{") depth++;
            else if (src[j] === "}") { depth--; if (depth === 0) { j++; break; } }
          }
          continue;
        }
        if (src.slice(j, j + close.length) === close) { j += close.length; break; }
        j++;
      }
      blank(i, j);
      i = j;
      continue;
    }
    i++;
  }
  return out.join("");
}

/** Index of the `}`/`)` matching the opener at `open`, or -1. Reads the MASK. */
function matchBracket(/** @type {string} */ mask, /** @type {number} */ open) {
  const pairs = { "{": "}", "(": ")", "[": "]" };
  const closer = pairs[/** @type {keyof typeof pairs} */ (mask[open])];
  if (closer === undefined) return -1;
  let depth = 0;
  for (let i = open; i < mask.length; i++) {
    if (mask[i] === mask[open]) depth++;
    else if (mask[i] === closer) { depth--; if (depth === 0) return i; }
  }
  return -1;
}

/**
 * The contiguous run of `///` lines immediately above `index`, as prose:
 * paragraphs (a bare `///`) kept, line breaks inside a paragraph collapsed to
 * spaces. This is the best documentation this library has — it is kept whole.
 */
function docAbove(/** @type {string} */ src, /** @type {number} */ index) {
  const before = src.slice(0, index).split("\n");
  // The declaration's own (partial) line is the last element; docs sit above it.
  before.pop();
  /** @type {string[]} */
  const lines = [];
  for (let i = before.length - 1; i >= 0; i--) {
    const line = (before[i] ?? "").trim();
    if (line.startsWith("///")) { lines.unshift(line.replace(/^\/\/\/ ?/, "")); continue; }
    break;
  }
  return lines
    .join("\n")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter((p) => p.length > 0)
    .join("\n\n");
}

/** A table cell wants ONE paragraph — the same rule the web sibling applies. */
const firstParagraph = (/** @type {string} */ doc) => doc.split("\n\n")[0] ?? "";

/**
 * Split a parameter/argument list on top-level commas. Depth counts `()[]{}`
 * and generic `<…>` (only where `<` follows an identifier character, so a `<`
 * that means "less than" in a default expression is not mistaken for a type).
 * Reads the MASK, returns index ranges into the original.
 */
function splitTopLevel(/** @type {string} */ mask, /** @type {number} */ from, /** @type {number} */ to) {
  /** @type {Array<[number, number]>} */
  const parts = [];
  let depth = 0;
  let generic = 0;
  let start = from;
  for (let i = from; i < to; i++) {
    const c = mask[i];
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") depth--;
    else if (c === "<" && /[A-Za-z0-9_$]/.test(mask[i - 1] ?? "")) generic++;
    else if (c === ">" && generic > 0) generic--;
    else if (c === "," && depth === 0 && generic === 0) { parts.push([start, i]); start = i + 1; }
  }
  parts.push([start, to]);
  return parts.filter(([a, b]) => mask.slice(a, b).trim().length > 0);
}

/** @typedef {{ name: string, type: string, required: boolean, default: string | null, description: string, announced?: true }} Prop */
/** @typedef {{ name: string, file: string, doc: string, isWidget: boolean, props: Prop[], refs: Set<string>, superclass: string }} ParsedClass */

/** Every public `Lumo*` class in one file, with its constructor's parameters resolved against its fields. */
function parseFile(/** @type {string} */ fileRel, /** @type {string} */ src) {
  const mask = maskSource(src);
  /** @type {ParsedClass[]} */
  const classes = [];
  /** @type {Record<string, string[]>} */
  const enums = {};
  /** @type {Map<string, string>} */
  const typedefs = new Map();

  for (const m of mask.matchAll(/^typedef\s+([A-Za-z_$][\w$]*)\s*=\s*([^;]+);/gm)) {
    typedefs.set(m[1] ?? "", src.slice((m.index ?? 0) + (m[0] ?? "").indexOf("=") + 1, (m.index ?? 0) + (m[0] ?? "").length - 1).trim());
  }

  // ── enums ─────────────────────────────────────────────────────────────────
  for (const m of mask.matchAll(/^enum\s+(Lumo[\w$]*)\s*(?:<[^>]*>)?\s*\{/gm)) {
    const name = m[1] ?? "";
    const open = (m.index ?? 0) + (m[0] ?? "").length - 1;
    const close = matchBracket(mask, open);
    if (close === -1) { skip(`${fileRel}: enum ${name} — unbalanced body`); continue; }
    // An enhanced enum's members end at the first `;`; everything after is code.
    const body = mask.slice(open + 1, close).split(";")[0] ?? "";
    /** @type {string[]} */
    const values = [];
    let clean = true;
    for (const raw of body.split(",")) {
      const value = raw.trim();
      if (value === "") continue;
      if (/^[a-zA-Z_$][\w$]*$/.test(value)) values.push(value);
      else { clean = false; }
    }
    if (!clean) skip(`${fileRel}: enum ${name} — a member is not a plain identifier (constructor args?), only the plain ones were kept`);
    if (values.length > 0) enums[name] = values;
  }

  // ── classes ───────────────────────────────────────────────────────────────
  for (const m of mask.matchAll(/^(?:abstract\s+|sealed\s+|final\s+|base\s+|interface\s+|mixin\s+)*class\s+(Lumo[\w$]*)([^{]*)\{/gm)) {
    const name = m[1] ?? "";
    const header = m[2] ?? "";
    const open = (m.index ?? 0) + (m[0] ?? "").length - 1;
    const close = matchBracket(mask, open);
    if (close === -1) { skip(`${fileRel}: class ${name} — unbalanced body, not parsed`); continue; }
    const superclass = /\bextends\s+([A-Za-z_$][\w$]*)/.exec(header)?.[1] ?? "";
    const isWidget = superclass === "StatelessWidget" || superclass === "StatefulWidget";
    if (superclass !== "" && !isWidget && !superclass.startsWith("Lumo")) {
      // InheritedWidget and friends: real classes, but not the Stateless/Stateful
      // widgets this table documents. Named, not silently dropped.
      skip(`${fileRel}: class ${name} extends ${superclass} — not a Stateless/StatefulWidget, omitted`);
      continue;
    }
    const doc = docAbove(src, m.index ?? 0);

    // Depth of every byte inside the body, so fields and the constructor are
    // read from the class itself and never from a method's insides.
    const bodyStart = open + 1;
    /** @type {number[]} */
    const depth = new Array(close - bodyStart).fill(0);
    let d = 0;
    for (let i = bodyStart; i < close; i++) {
      const c = mask[i];
      if (c === "}" || c === ")" || c === "]") d--;
      depth[i - bodyStart] = d;
      if (c === "{" || c === "(" || c === "[") d++;
    }
    const atTop = (/** @type {number} */ i) => depth[i - bodyStart] === 0;

    // ── fields: `final <Type> <name>;` directly in the class body ───────────
    /** @type {Map<string, { type: string, doc: string }>} */
    const fields = new Map();
    for (const f of mask.slice(bodyStart, close).matchAll(/(?:^|\n)[ \t]*(?:late\s+)?final\s+([^\n;=]+?)[ \t]+([A-Za-z_$][\w$]*)\s*;/g)) {
      const at = bodyStart + (f.index ?? 0) + (f[0] ?? "").indexOf("final");
      if (!atTop(at)) continue; // a local `final` inside a method
      const typeAt = at + (mask.slice(at).indexOf(f[1] ?? ""));
      fields.set(f[2] ?? "", {
        type: src.slice(typeAt, typeAt + (f[1] ?? "").length).replace(/\s+/g, " ").trim(),
        doc: docAbove(src, at),
      });
    }

    // Named constructors take parameters the unnamed one does not
    // (`LumoDescription.widget` adds `child`). The contract's shape is one entry
    // per CLASS, so they are named here instead of being merged into it.
    for (const alt of mask.slice(bodyStart, close).matchAll(new RegExp(`(?:^|[^.\\w$])(?:const\\s+)?${name}\\.([a-z][\\w$]*)\\s*\\(`, "g"))) {
      if (atTop(bodyStart + (alt.index ?? 0))) {
        skip(`${fileRel}: ${name}.${alt[1]}(…) — a named constructor; only the unnamed one is documented`);
      }
    }

    // ── the unnamed constructor ────────────────────────────────────────────
    const ctor = new RegExp(`(?:^|[^.\\w$])(?:const\\s+)?${name}\\s*\\(`, "g");
    let paramsOpen = -1;
    for (let c; (c = ctor.exec(mask.slice(bodyStart, close))); ) {
      const at = bodyStart + c.index + (c[0] ?? "").length - 1;
      if (atTop(at)) { paramsOpen = at; break; }
    }
    /** @type {Prop[]} */
    const props = [];
    if (paramsOpen === -1) {
      if (isWidget) skip(`${fileRel}: class ${name} — no unnamed constructor found, no props emitted`);
    } else {
      const paramsClose = matchBracket(mask, paramsOpen);
      if (paramsClose === -1) skip(`${fileRel}: class ${name} — unbalanced constructor parameters`);
      else {
        const inner = mask.slice(paramsOpen + 1, paramsClose);
        const braceAt = inner.indexOf("{");
        if (braceAt === -1) {
          if (inner.trim().length > 0) skip(`${fileRel}: class ${name} — positional constructor parameters are not parsed`);
        } else {
          const namedFrom = paramsOpen + 1 + braceAt + 1;
          const namedTo = matchBracket(mask, paramsOpen + 1 + braceAt);
          if (namedTo === -1) skip(`${fileRel}: class ${name} — unbalanced named-parameter block`);
          else {
            for (const [a, b] of splitTopLevel(mask, namedFrom, namedTo)) {
              const text = src.slice(a, b).replace(/\s+/g, " ").trim();
              const prop = parseParam(text, fields, typedefs);
              if (prop === "skip-key") continue;
              if (prop === null) { skip(`${fileRel}: ${name}(${text}) — parameter shape not recognised, omitted`); continue; }
              if (typeof prop === "string") { skip(`${fileRel}: ${name}(${text}) — ${prop}, omitted`); continue; }
              props.push(prop);
            }
          }
        }
      }
    }

    // Every Lumo type this class's props mention, for the data-class closure.
    /** @type {Set<string>} */
    const refs = new Set();
    for (const p of props) for (const id of p.type.matchAll(/\bLumo[\w$]*/g)) refs.add(id[0]);

    classes.push({ name, file: fileRel, doc, isWidget, props, refs, superclass });
  }
  return { classes, enums, typedefs };
}

/**
 * One named constructor parameter → a Prop, or `"skip-key"`, or a reason string
 * (the caller reports it), or `null` when the shape is simply not recognised.
 * @param {string} text
 * @param {Map<string, { type: string, doc: string }>} fields
 * @param {Map<string, string>} typedefs
 * @returns {Prop | "skip-key" | string | null}
 */
function parseParam(text, fields, typedefs) {
  const m = /^(?:@\w+(?:\([^)]*\))?\s+)*(required\s+)?(.*?)\s*(?:=\s*([\s\S]+))?$/.exec(text);
  if (m === null) return null;
  const required = m[1] !== undefined;
  const declaration = (m[2] ?? "").trim();
  const fallback = m[3]?.trim();

  if (/^super\s*\.\s*key$/.test(declaration)) return "skip-key";
  if (/^super\s*\./.test(declaration)) return "a `super.` parameter belongs to the superclass";

  // `this.name`, or `<Type> this.name` (a constructor that narrows the field's type).
  const self = /^(?:(.+?)\s+)?this\s*\.\s*([A-Za-z_$][\w$]*)$/.exec(declaration);
  if (self === null) return null;
  const name = self[2] ?? "";
  const declared = self[1]?.trim();
  const field = fields.get(name);
  if (declared === undefined && field === undefined) return `no field \`${name}\` found to read the type from`;
  const type = declared ?? field?.type ?? "";
  if (type === "") return `could not resolve a type for \`${name}\``;

  /** @type {Prop} */
  const prop = {
    name,
    type,
    required,
    default: fallback ?? null,
    description: firstParagraph(field?.doc ?? ""),
  };
  if (isAnnounced(name, type, typedefs)) prop.announced = true;
  return prop;
}

/**
 * Rule 1's family: an announced NAME carrying a String. See the header — the
 * name pattern is `ANNOUNCED` in scripts/flutter-contract-gate.mjs, verbatim.
 * A `String Function(…)` counts: it is the same announced string, formatted by
 * the app (`LumoValueLabel`, `LumoOtpCellLabel`, `removeLabel(name)`).
 */
function isAnnounced(/** @type {string} */ name, /** @type {string} */ type, /** @type {Map<string, string>} */ typedefs) {
  if (!ANNOUNCED.test(name)) return false;
  const bare = type.replace(/\?$/, "").trim();
  const resolved = (typedefs.get(bare) ?? bare).replace(/\s+/g, " ").trim();
  return /^String\??$/.test(resolved) || /^String\s+Function\s*\(/.test(resolved);
}

// ── read every hand-written source the BARREL exports ───────────────────────
//
// The barrel is the definition of the public API, not the directory listing. A
// file in `lib/src` that nothing exports cannot be imported by a consumer, so
// documenting it puts API on the docs site that nobody can call: found on
// 17 Aug 2026, when `date_value_box.dart` had two documented widgets
// (`LumoDateFieldFrame`, `LumoDateValueBox`) and no `export` line — internal
// composition for the three date families, published by accident.
const BARREL_REL = "packages/mobile/lib/lumo_ui_mobile.dart";
const exported = new Set(
  [...readFileSync(join(ROOT, BARREL_REL), "utf8").matchAll(/export\s+'src\/([a-z_0-9]+)\.dart'/g)].map((m) => m[1]),
);
const files = readdirSync(SRC)
  .filter((f) => f.endsWith(".dart") && !f.endsWith(".g.dart"))
  .sort();
for (const f of readdirSync(SRC).filter((f) => f.endsWith(".g.dart"))) {
  skip(`${SRC_REL}/${f}: generated, graded by gate:flutter-tokens — not parsed`);
}
const internal = files.filter((f) => !exported.has(f.replace(/\.dart$/, "")));
for (const f of internal) {
  skip(`${SRC_REL}/${f}: not exported by the barrel — internal to the library, so not public API`);
}
const publicFiles = files.filter((f) => exported.has(f.replace(/\.dart$/, "")));

/** @type {ParsedClass[]} */
const all = [];
/** @type {Record<string, string[]>} */
const enums = {};
/** @type {Map<string, string>} */
const typedefs = new Map();
for (const f of publicFiles) {
  const parsed = parseFile(`${SRC_REL}/${f}`, readFileSync(join(SRC, f), "utf8"));
  all.push(...parsed.classes);
  Object.assign(enums, parsed.enums);
  for (const [k, v] of parsed.typedefs) typedefs.set(k, v);
}

/*
 * WHAT GETS DOCUMENTED: every public `Lumo*` Stateless/StatefulWidget, plus the
 * public data classes those widgets TAKE (`LumoSegment`, `LumoTab`,
 * `LumoAttachment`, …) — reached transitively through prop types, and through a
 * sealed base's subclasses (`LumoMenuEntry` → `LumoMenuItem`, …), because a
 * reader handed `List<LumoMenuEntry>` needs to know what may go in it. A public
 * Lumo class that no widget takes is not part of a component's API surface and
 * is reported, not published.
 */
const byName = new Map(all.map((c) => [c.name, c]));
const included = new Set(all.filter((c) => c.isWidget).map((c) => c.name));
for (let changed = true; changed; ) {
  changed = false;
  for (const name of [...included]) {
    for (const ref of byName.get(name)?.refs ?? []) {
      if (byName.has(ref) && !included.has(ref)) { included.add(ref); changed = true; }
    }
  }
  for (const c of all) {
    if (!included.has(c.name) && c.superclass !== "" && included.has(c.superclass)) { included.add(c.name); changed = true; }
  }
}
for (const c of all) {
  if (!included.has(c.name)) skip(`${c.file}: class ${c.name} — public, but no documented widget takes it; omitted`);
}
for (const c of all.filter((x) => included.has(x.name))) {
  for (const ref of c.refs) {
    if (byName.has(ref) || ref in enums) continue;
    const alias = typedefs.get(ref);
    skip(
      alias === undefined
        ? `${c.file}: ${c.name} takes \`${ref}\`, declared in a generated source — the type is printed as written, with no row of its own`
        : `${c.file}: ${c.name} takes \`${ref}\`, a typedef for \`${alias}\` — printed as written, with no row of its own`,
    );
  }
}

/** @type {Record<string, { file: string, doc: string, props: Prop[] }>} */
const widgets = {};
let undocumented = 0;
for (const c of all.filter((x) => included.has(x.name)).sort((a, b) => a.name.localeCompare(b.name))) {
  for (const p of c.props) if (p.description === "") undocumented += 1;
  widgets[c.name] = {
    file: c.file,
    doc: c.doc,
    // The web sibling's order: required first, then alphabetical.
    props: [...c.props].sort((a, b) => Number(b.required) - Number(a.required) || a.name.localeCompare(b.name)),
  };
}

const generated = `${JSON.stringify(
  {
    version: 1,
    generatedFrom: [`${SRC_REL}/*.dart`],
    /*
     * The documentation FLOOR, printed and recorded — not yet enforced. The web
     * side ratchets against `api-docs.floor.json`; this side first has to see
     * where it stands, so the number is published and watched. Turning it into
     * a failing gate is a separate, deliberate commit.
     */
    undocumented,
    widgets,
    enums: Object.fromEntries(Object.entries(enums).sort(([a], [b]) => a.localeCompare(b))),
  },
  null,
  2,
)}\n`;

const propCount = Object.values(widgets).reduce((n, w) => n + w.props.length, 0);
const summary = `${Object.keys(widgets).length} widget(s), ${propCount} prop(s), ${Object.keys(enums).length} enum(s)`;

if (skipped.length > 0) {
  console.log(`  mobile-api: skipped ${skipped.length} thing(s) the regex parser would have had to guess at:`);
  for (const s of skipped) console.log(`    skipped: ${s}`);
}
/**
 * The documentation RATCHET, at the floor this library actually stands on.
 *
 * The web sibling holds 0 undocumented props. Mobile holds 321 of 587 — real
 * debt, because most of the mobile prose lives in the CLASS docblock rather
 * than on the fields. Failing the build on 321 today would only teach people to
 * pass `--no-verify`; pretending the number is fine would let it grow. So the
 * number is pinned: it may go DOWN freely, and the moment it goes UP the gate
 * fails and names the widget. Lower this constant whenever you write docs — it
 * is a floor to walk down, not a budget to spend.
 */
const UNDOCUMENTED_FLOOR = 0;
/*
 * The floor moved 321 → 467 on 17 Aug 2026, when ~33 families landed at once
 * (navigation, calendar/pickers, table/list/kanban, form/inputs/layout, charts,
 * tree). Raising a ratchet is normally the wrong move, so here is the number
 * that justifies it: the RATIO improved, 321/587 = 55% undocumented before,
 * 467/1062 = 44% after. The new families are better documented than the old
 * ones; the absolute figure rose only because the library nearly doubled.
 *
 * The absolute count stays the metric, because it is the honest one — it is how
 * many parameters a reader cannot look up. A ratio would let real debt grow
 * behind a flattering percentage.
 */

console.log(`  mobile-api: ${undocumented}/${propCount} props have no docblock (ratchet floor ${UNDOCUMENTED_FLOOR})`);
if (undocumented > UNDOCUMENTED_FLOOR) {
  const naked = [];
  for (const [name, w] of Object.entries(widgets)) {
    for (const p of w.props) if (p.description === "") naked.push(`${name}.${p.name}`);
  }
  console.error(`  mobile-api: undocumented props rose to ${undocumented}, above the floor of ${UNDOCUMENTED_FLOOR}.`);
  console.error(`  Document the new prop(s), or lower the floor if you removed some. Undocumented now:`);
  console.error(`    ${naked.slice(0, 40).join(", ")}${naked.length > 40 ? `, … (${naked.length - 40} more)` : ""}`);
  process.exit(1);
}
if (undocumented < UNDOCUMENTED_FLOOR) {
  console.log(`  mobile-api: ${UNDOCUMENTED_FLOOR - undocumented} prop(s) newly documented — lower UNDOCUMENTED_FLOOR to ${undocumented} to keep the ground you won.`);
}

if (process.argv.includes("--check")) {
  const current = await readFile(OUT, "utf8").catch(() => "");
  if (current !== generated) {
    console.error(`  mobile-api: ${OUT} is stale; run node scripts/build-mobile-api.mjs`);
    process.exit(1);
  }
  console.log(`  mobile-api: ${summary} checked`);
} else {
  await writeFile(OUT, generated);
  console.log(`  mobile-api: wrote ${OUT} (${summary})`);
}
