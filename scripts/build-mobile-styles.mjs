#!/usr/bin/env node
/**
 * packages/mobile/lib/src/styles.g.dart (Lumo UI Mobile) is GENERATED from the
 * declarations in packages/mobile/lib/src/styles.dart: one `_$Lumo…Style` mixin
 * per family carrying `copyWith`, `merge`, `lerp`, `==` and `hashCode`, and the
 * same for `LumoStyles` itself.
 *
 * WHY A GENERATOR. `ThemeExtension` requires `copyWith` and `lerp`. This library
 * has 76 family files; per-family style objects therefore mean 76 × 5 mechanical
 * methods over roughly a thousand fields, every one of them a place to forget a
 * field — and a forgotten field in `copyWith` is SILENT: the override simply
 * never arrives, and the widget keeps drawing what it drew. Dart has no
 * reflection, and `build_runner` + `freezed` would be a runtime dependency
 * (AGENTS.md: ask first). So the mechanical half is emitted here, and
 * `gate:mobile-styles` fails when the committed file drifts — the same shape as
 * `gate:flutter-tokens`.
 *
 * AND IT IS THE APPEARANCE-ONLY RULE'S ENFORCER. A style object must never be
 * able to remove an announced string, flip direction, or change a semantic role.
 * That is not asked for in a comment: this generator can emit `lerp` ONLY for
 * the types in `APPEARANCE` below, and a field of any other type FAILS THE BUILD
 * naming the field and the reason. `String` has no interpolation, so a name can
 * never live in a style object; `Widget` has none, so a slot cannot; `IconData`,
 * `bool`, `TextDirection`, `SemanticsRole` and function types are refused BY
 * NAME, with the reason, because someone will eventually try.
 *
 * The parser is deliberately narrow, in the house style: it reads exactly the
 * shape `styles.dart` is written in and throws on anything else rather than
 * guessing.
 *
 *     class LumoStyles extends ThemeExtension<LumoStyles> with _$LumoStyles {…}
 *     class Lumo<Family>Style with _$Lumo<Family>Style {…}
 *     final <Type>? <name>;              a family style — every field NULLABLE
 *     final Lumo<Family>Style <name>;    LumoStyles — every field NON-null
 *
 * Usage: `node scripts/build-mobile-styles.mjs`         writes styles.g.dart
 *        `node scripts/build-mobile-styles.mjs --check` fails when it is stale
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC_REL = "packages/mobile/lib/src/styles.dart";
const OUT_REL = "packages/mobile/lib/src/styles.g.dart";
const SRC = join(ROOT, SRC_REL);
const OUT = join(ROOT, OUT_REL);

const source = await readFile(SRC, "utf8");

/** Comments and string literals blanked, byte positions and newlines kept, so brace matching and the field regex see CODE only. */
function mask(/** @type {string} */ src) {
  const out = src.split("");
  const blank = (/** @type {number} */ a, /** @type {number} */ b) => {
    for (let k = a; k < Math.min(b, src.length); k++) if (src[k] !== "\n") out[k] = " ";
  };
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (c === "/" && n === "/") {
      const end = src.indexOf("\n", i);
      blank(i, end < 0 ? src.length : end);
      i = end < 0 ? src.length : end;
      continue;
    }
    if (c === "/" && n === "*") {
      const end = src.indexOf("*/", i + 2);
      if (end < 0) throw new Error(`${SRC_REL}: unterminated block comment`);
      blank(i, end + 2);
      i = end + 2;
      continue;
    }
    if (c === "'" || c === '"') {
      let j = i + 1;
      while (j < src.length && src[j] !== c) j += src[j] === "\\" ? 2 : 1;
      blank(i, j + 1);
      i = j + 1;
      continue;
    }
    i++;
  }
  return out.join("");
}

const M = mask(source);

/** Index of the `}` matching the `{` at `open`. */
function matchBrace(/** @type {number} */ open) {
  let depth = 0;
  for (let i = open; i < M.length; i++) {
    if (M[i] === "{") depth++;
    else if (M[i] === "}" && --depth === 0) return i;
  }
  throw new Error(`${SRC_REL}: unbalanced braces from offset ${open}`);
}

/** @typedef {{ name: string, type: string }} Field */

/** The `final <Type> <name>;` declarations at the top level of one class body. */
function fieldsIn(/** @type {number} */ open, /** @type {string} */ className) {
  const close = matchBrace(open);
  /** @type {Field[]} */
  const fields = [];
  for (const m of M.slice(open + 1, close).matchAll(/(?:^|\n)[ \t]*final\s+([^;{}=]+?)[ \t]+([A-Za-z_$][\w$]*)\s*;/g)) {
    fields.push({ type: (m[1] ?? "").replace(/\s+/g, " ").trim(), name: m[2] ?? "" });
  }
  if (fields.length === 0) throw new Error(`class ${className} declares no fields — nothing to generate`);
  return fields;
}

/*
 * ── the appearance allow-list ────────────────────────────────────────────────
 *
 * THE one definition of what a style object may carry, and the reason it is
 * expressed as "which types can be interpolated" rather than as a line in a
 * review checklist: a type that is not here cannot be lerped, so the generator
 * cannot emit the `ThemeExtension`, so the library does not build. The rule
 * cannot be forgotten, because nothing ships without passing through it.
 *
 * Each entry says how to interpolate, compare and hash one field.
 */

/**
 * @typedef {object} Interp
 * @property {(a: string, b: string) => string} lerp   how to interpolate two field reads
 * @property {(a: string, b: string) => string} eq     how to compare them
 * @property {(f: string) => string} hash              how to fold one into a hash
 */

/** @satisfies {Record<string, Interp>} */
const APPEARANCE = {
  Color: { lerp: (a, b) => `Color.lerp(${a}, ${b}, t)`, eq: (a, b) => `${a} == ${b}`, hash: (f) => f },
  double: { lerp: (a, b) => `lerpDouble(${a}, ${b}, t)`, eq: (a, b) => `${a} == ${b}`, hash: (f) => f },
  FontWeight: { lerp: (a, b) => `FontWeight.lerp(${a}, ${b}, t)`, eq: (a, b) => `${a} == ${b}`, hash: (f) => f },
  TextStyle: { lerp: (a, b) => `TextStyle.lerp(${a}, ${b}, t)`, eq: (a, b) => `${a} == ${b}`, hash: (f) => f },
  EdgeInsetsGeometry: { lerp: (a, b) => `EdgeInsetsGeometry.lerp(${a}, ${b}, t)`, eq: (a, b) => `${a} == ${b}`, hash: (f) => f },
  BorderRadiusGeometry: { lerp: (a, b) => `BorderRadiusGeometry.lerp(${a}, ${b}, t)`, eq: (a, b) => `${a} == ${b}`, hash: (f) => f },
  // `IconThemeData.lerp` answers two nulls with an all-null OBJECT rather than
  // null, which would turn "nothing set" into "everything set to nothing" the
  // first time a theme animated. Guarded, so absence survives interpolation.
  IconThemeData: { lerp: (a, b) => `_lerpIconTheme(${a}, ${b}, t)`, eq: (a, b) => `${a} == ${b}`, hash: (f) => f },
  // A duration has no sensible half-way value while the thing it times runs, so it snaps.
  Duration: { lerp: (a, b) => `(t < 0.5 ? ${a} : ${b})`, eq: (a, b) => `${a} == ${b}`, hash: (f) => f },
  "List<BoxShadow>": { lerp: (a, b) => `BoxShadow.lerpList(${a}, ${b}, t)`, eq: (a, b) => `listEquals(${a}, ${b})`, hash: (f) => `${f} == null ? null : Object.hashAll(${f}!)` },
};

/** Types someone will reach for, refused BY NAME so the failure teaches rather than merely stopping. */
const REFUSED = {
  String: "a style object may not carry COPY. Every announced string in this library is a REQUIRED parameter of the widget (rule 1); a theme that could supply one could also supply an English one, or supply none at all.",
  Widget: "a style object may not carry a SLOT. A widget arriving from a theme is content nobody at the call site declared, and content carries semantics.",
  IconData: "a style object may not carry a GLYPH. `Icons.chevron_right` carries `matchTextDirection`; an arbitrary IconData does not — this is the silent RTL defect with a config file in front of it. Expose the colour and the size instead.",
  bool: "a style object may not carry a SWITCH. Switches turn things off, including things a reader needs. Express the difference as a value, or as a variant enum on the widget where the call site can see it.",
  TextDirection: "direction is DERIVED from the locale in this library and there is no `dir` anywhere. A style object may not be the exception.",
  TextAlign: "alignment on the inline axis follows direction. `TextAlign.start` is the library's, and the widget already writes it.",
  Alignment: "physical alignment mirrors wrongly. `AlignmentDirectional` is the library's, and it is the widget's decision, not the theme's.",
  EdgeInsets: "use `EdgeInsetsGeometry`, so a directional value fits — the physical type cannot express start and end.",
  BorderRadius: "use `BorderRadiusGeometry`, so a directional radius fits.",
  SemanticsRole: "a role is what a control IS. A theme may not change it.",
  Function: "a callback in a style object can return anything, including a name or a widget, which is every rule above at once.",
};

/** How to interpolate, compare, hash and merge one field — or a build failure with the reason. */
function kindOf(/** @type {Field} */ field, /** @type {string} */ className) {
  const fail = (/** @type {string} */ why) => {
    throw new Error(`${className}.${field.name} is \`${field.type}\` — ${why}`);
  };
  if (!field.type.endsWith("?")) {
    fail("a style field is an OVERRIDE and must be nullable, so that «not set» can mean «keep the value the widget already had». Add the `?`.");
  }
  const bare = field.type.slice(0, -1).trim();

  for (const [name, why] of Object.entries(REFUSED)) {
    if (bare === name || bare.startsWith(`${name}<`) || / Function\b/.test(bare)) fail(why);
  }

  // A per-step / per-variant table: the keys are one of the library's own enums,
  // the values a colour or a length. A key the map omits keeps the library's.
  const table = /^Map<\s*(Lumo[\w$]*)\s*,\s*(Color|double)\s*>$/.exec(bare);
  if (table) {
    const [, key, value] = table;
    return {
      lerp: (/** @type {string} */ a, /** @type {string} */ b) => `_lerpMap<${key}, ${value}>(${a}, ${b}, t, ${value === "Color" ? "Color.lerp" : "lerpDouble"})`,
      eq: (/** @type {string} */ a, /** @type {string} */ b) => `mapEquals(${a}, ${b})`,
      hash: (/** @type {string} */ f) => `_hashMap(${f})`,
      merge: (/** @type {string} */ a, /** @type {string} */ b) => `(${a} == null && ${b} == null) ? null : <${key}, ${value}>{...?${a}, ...?${b}}`,
    };
  }

  const known = APPEARANCE[/** @type {keyof typeof APPEARANCE} */ (bare)];
  if (known === undefined) {
    fail(
      `not an appearance type. A style object carries APPEARANCE ONLY — it must never be able to remove an announced string, flip direction, or change a semantic role — and that is enforced HERE, by this list, because a type that cannot be interpolated cannot ship inside a ThemeExtension. Allowed: ${Object.keys(APPEARANCE).join(", ")}, or Map<Lumo…, Color|double>. If this genuinely is appearance, add it to APPEARANCE with its lerp, and say in the commit why it cannot carry meaning.`,
    );
  }
  return { ...known, merge: (/** @type {string} */ a, /** @type {string} */ b) => `${b} ?? ${a}` };
}

/**
 * Read the declarations and emit the file. It THROWS a sentence a person can act
 * on; the caller turns that into one line on stderr and a non-zero exit, the way
 * every other generator in `scripts/` reports.
 */
function build() {
  /** @type {Array<{ name: string, fields: Array<Field & { kind: ReturnType<typeof kindOf> }> }>} */
  const families = [];
  for (const m of M.matchAll(/\bclass\s+(Lumo[\w$]*Style)\s+with\s+_\$\1\s*\{/g)) {
    const name = m[1] ?? "";
    const fields = fieldsIn((m.index ?? 0) + (m[0] ?? "").length - 1, name).map((f) => ({ ...f, kind: kindOf(f, name) }));
    families.push({ name, fields });
  }
  if (families.length === 0) throw new Error(`${SRC_REL}: no \`class Lumo…Style with _$Lumo…Style\` found — has the shape changed?`);

  const root = /\bclass\s+LumoStyles\s+extends\s+ThemeExtension<LumoStyles>\s+with\s+_\$LumoStyles\s*\{/.exec(M);
  if (root === null) throw new Error(`${SRC_REL}: LumoStyles must be declared \`class LumoStyles extends ThemeExtension<LumoStyles> with _$LumoStyles\``);
  const rootFields = fieldsIn(root.index + root[0].length - 1, "LumoStyles");
  const declared = new Set(families.map((f) => f.name));
  for (const f of rootFields) {
    if (!declared.has(f.type)) {
      throw new Error(`LumoStyles.${f.name} is \`${f.type}\`, which is not a family style class in this file (${[...declared].join(", ")}). LumoStyles is the REGISTRY: one non-nullable field per family, defaulted to that family's empty style.`);
    }
  }
  const orphans = families.filter((f) => !rootFields.some((r) => r.type === f.name)).map((f) => f.name);
  if (orphans.length > 0) {
    throw new Error(`${orphans.join(", ")} declared but not registered on LumoStyles — a style object nothing can reach is a style object nobody can use.`);
  }

  const familyMixin = (/** @type {(typeof families)[number]} */ { name, fields }) => `mixin _$${name} {\n${fields.map((f) => `  ${f.type} get ${f.name};`).join("\n")}\n\n  /// This style with the given fields replaced. A null argument KEEPS the\n  /// current value — \`copyWith\` cannot clear a field; construct a fresh style\n  /// for that.\n  ${name} copyWith({\n${fields.map((f) => `    ${f.type} ${f.name},`).join("\n")}\n  }) =>\n      ${name}(\n${fields.map((f) => `        ${f.name}: ${f.name} ?? this.${f.name},`).join("\n")}\n      );\n\n  /// \`other\`'s set fields win; the rest stay this object's. A per-step or\n  /// per-variant table merges KEY BY KEY, so a theme that moves one step and a\n  /// call site that moves another both take effect; every other field replaces.\n  ${name} merge(${name}? other) => other == null\n      ? copyWith()\n      : ${name}(\n${fields.map((f) => `          ${f.name}: ${f.kind.merge(f.name, `other.${f.name}`)},`).join("\n")}\n        );\n\n  /// Interpolate towards \`other\` — what \`ThemeData.lerp\` calls when a theme\n  /// animates between two schemes. A field with no half-way value snaps at\n  /// t = 0.5 rather than inventing one.\n  ${name} lerp(${name} other, double t) => ${name}(\n${fields.map((f) => `        ${f.name}: ${f.kind.lerp(f.name, `other.${f.name}`)},`).join("\n")}\n      );\n\n  @override\n  bool operator ==(Object other) =>\n      identical(this, other) ||\n      other is ${name} &&\n${fields.map((f) => `          ${f.kind.eq(f.name, `other.${f.name}`)}`).join(" &&\n")};\n\n  @override\n  int get hashCode => Object.hashAll([\n${fields.map((f) => `        ${f.kind.hash(f.name)},`).join("\n")}\n      ]);\n}`;

  const generated = `// GENERATED by scripts/build-mobile-styles.mjs (lumo-ui) from packages/mobile/lib/src/styles.dart — do not edit.\n//\n// The mechanical half of the per-widget customisation surface: \`copyWith\`,\n// \`merge\`, \`lerp\`, \`==\` and \`hashCode\` for every family style, and the same for\n// \`LumoStyles\`. Written once here so that adding a family costs a style class\n// and one registry line, not five more methods nobody re-reads. The generator is\n// also where the APPEARANCE-ONLY rule lives: it can emit \`lerp\` only for types\n// that carry no meaning, so a field that could reach a name, a role or the\n// direction fails the BUILD rather than the review.\npart of 'styles.dart';\n\n${families.map(familyMixin).join("\n\n")}\n\nmixin _\$LumoStyles on ThemeExtension<LumoStyles> {\n${rootFields.map((f) => `  ${f.type} get ${f.name};`).join("\n")}\n\n  @override\n  LumoStyles copyWith({${rootFields.map((f) => `${f.type}? ${f.name}`).join(", ")}}) => LumoStyles(${rootFields.map((f) => `${f.name}: ${f.name} ?? this.${f.name}`).join(", ")});\n\n  @override\n  LumoStyles lerp(covariant LumoStyles? other, double t) => other == null ? copyWith() : LumoStyles(${rootFields.map((f) => `${f.name}: ${f.name}.lerp(other.${f.name}, t)`).join(", ")});\n\n  @override\n  bool operator ==(Object other) => identical(this, other) || other is LumoStyles && ${rootFields.map((f) => `other.${f.name} == ${f.name}`).join(" && ")};\n\n  @override\n  int get hashCode => Object.hashAll([${rootFields.map((f) => f.name).join(", ")}]);\n}\n\n/// Two per-step tables interpolated key by key. A key only ONE side carries has\n/// nothing to interpolate against, so it SNAPS at the half-way point: fading a\n/// value towards a default the other side never named draws a colour that is in\n/// neither theme.\nMap<K, V>? _lerpMap<K, V>(Map<K, V>? a, Map<K, V>? b, double t, V? Function(V?, V?, double) lerp) {\n  if (a == null && b == null) return null;\n  final out = <K, V>{};\n  for (final key in <K>{...?a?.keys, ...?b?.keys}) {\n    final x = a?[key];\n    final y = b?[key];\n    final v = x == null || y == null ? (t < 0.5 ? x : y) : lerp(x, y, t);\n    if (v != null) out[key] = v;\n  }\n  return out;\n}\n\n/// Order-independent, because a table's order is not part of its meaning.\nint? _hashMap<K, V>(Map<K, V>? map) => map == null ? null : Object.hashAllUnordered(map.entries.map((e) => Object.hash(e.key, e.value)));\n\n/// \`IconThemeData.lerp\` answers two nulls with an all-null OBJECT rather than\n/// null, which would turn «nothing set» into «everything set to nothing» the\n/// first time a theme animated.\nIconThemeData? _lerpIconTheme(IconThemeData? a, IconThemeData? b, double t) => a == null && b == null ? null : IconThemeData.lerp(a, b, t);\n`;

  return { generated, summary: `${families.length} family style(s), ${families.reduce((n, f) => n + f.fields.length, 0)} field(s)` };
}

let built;
try {
  built = build();
} catch (error) {
  console.error(`  mobile-styles: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

if (process.argv.includes("--check")) {
  const current = await readFile(OUT, "utf8").catch(() => "");
  if (current !== built.generated) {
    console.error(`  mobile-styles: ${OUT_REL} is stale; run node scripts/build-mobile-styles.mjs`);
    process.exit(1);
  }
  console.log(`  mobile-styles: ${built.summary} checked — appearance only`);
} else {
  await writeFile(OUT, built.generated);
  console.log(`  mobile-styles: wrote ${OUT_REL} (${built.summary})`);
}
