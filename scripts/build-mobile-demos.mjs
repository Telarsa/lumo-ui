#!/usr/bin/env node
/**
 * apps/website/src/lib/mobile-demos.generated.json — the manifest the docs site
 * reads to know WHICH demos a component's Mobile page shows, what to call them,
 * and what Dart to print beside the running widget.
 *
 * Generated from `apps/mobile-gallery/lib/demos/*.dart`, which is the same
 * source the Flutter gallery builds and runs. That is the point: the code on
 * the page and the code in the canvas are one file, so a snippet cannot rot
 * into something that no longer compiles.
 *
 * Per demo file:
 *   - `const demos = <String, WidgetBuilder>{ '<slug>-<n>': builder, … }`
 *     registers the ids the gallery can render.
 *   - `const demoMeta = { '<slug>-<n>': { 'title': {…}, 'description': {…} } }`
 *     carries each demo's localized title and description, in EVERY locale.
 *   - `const copy = { 'key': {'fa-IR': …, 'en-US': …} }` carries the strings the
 *     demo RENDERS, and the demo reads them as `t['key']`.
 *   - `// BEGIN <id>` … `// END <id>` brackets the Dart a reader should copy.
 *
 * The `source` in the manifest is emitted ONCE PER LOCALE, with every `t['key']`
 * replaced by that locale's literal. The English page therefore prints English
 * Dart and the Persian page Persian Dart, and neither mentions the `t` table a
 * reader pasting the snippet would not have. Inside a string interpolation the
 * substitution is raw, so `'${t['remove']} $name'` emits as `'Remove $name'`.
 *
 * It THROWS — never degrades — on: a registered demo with no markers, markers
 * with no registration, a missing locale, a duplicate id, a demo file missing
 * from `demos/all.dart`, an id that is not `<slug>-<n>`, a slug `catalog.json`
 * does not have, a `t['key']` with no copy entry, a copy entry no demo uses, or
 * a Latin digit in a title (a title becomes the iframe's `title` attribute,
 * where the page cannot island it away from `no-latin-digits`).
 *
 * `--check` fails when the committed JSON is stale, which is what
 * `pnpm run gate:mobile-demos` runs.
 *
 * Generated files are never hand-edited (AGENTS.md rule 6).
 */

import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const DEMOS_DIR = join(ROOT, "apps/mobile-gallery/lib/demos");
const REGISTRY = join(DEMOS_DIR, "all.dart");
const OUT = join(ROOT, "apps/website/src/lib/mobile-demos.generated.json");
const LOCALES = ["fa-IR", "en-US"];
const ID = /^([a-z0-9]+(?:-[a-z0-9]+)*)-([1-9][0-9]*)$/;
const LATIN_DIGIT = /[0-9]/;

/**
 * A Dart map literal parsed into plain data: string keys, and values that are
 * either strings or nested maps of the same shape.
 * @typedef {string | DartMap} DartValue
 * @typedef {{ [key: string]: DartValue }} DartMap
 */

/**
 * One demo, ready to write out. `ordinal` is kept from the parse so ordering
 * never has to re-run the id regex and re-handle its null.
 * @typedef {object} Demo
 * @property {string} id
 * @property {string} slug
 * @property {number} ordinal
 * @property {string} where
 * @property {Record<string, string>} title
 * @property {Record<string, string>} description
 * @property {Record<string, string>} source
 */

/** Every failure here is a build failure, with the file and the id in it. */
class DemoError extends Error {}

/**
 * @param {string} message
 * @returns {never}
 */
function fail(message) {
  throw new DemoError(message);
}

/** @param {DartValue | undefined} node @returns {DartMap | undefined} */
const asMap = (node) => (node !== undefined && typeof node !== "string" ? node : undefined);

/** @param {DartValue | undefined} node @returns {string | undefined} */
const asString = (node) => (typeof node === "string" ? node : undefined);

/**
 * A Dart string literal, single- or double-quoted, with `\'` style escapes.
 * @param {string} src @param {number} at @param {string} where
 * @returns {{ value: string, end: number }}
 */
function readDartString(src, at, where) {
  const quote = src[at];
  let out = "";
  let i = at + 1;
  while (i < src.length) {
    const ch = src[i];
    if (ch === "\\") {
      const next = src[i + 1];
      out += next === "n" ? "\n" : next === "t" ? "\t" : next;
      i += 2;
      continue;
    }
    if (ch === quote) return { value: out, end: i + 1 };
    out += ch;
    i += 1;
  }
  return fail(`${where}: unterminated string literal at offset ${at}`);
}

/**
 * Parse the `{ … }` Dart map literal starting at `at`. Keys are always string
 * literals. Values are strings or nested maps, except in `identifiers` mode —
 * the `demos` registry, whose values are function tear-offs the JSON never
 * carries, so only the keys are read.
 * @param {string} src @param {number} at @param {string} where
 * @param {boolean} [identifiers]
 * @returns {{ value: DartMap, end: number }}
 */
function readDartMap(src, at, where, identifiers = false) {
  if (src[at] !== "{") fail(`${where}: expected a map literal at offset ${at}`);
  /** @type {DartMap} */
  const out = {};
  let i = at + 1;
  const skip = () => {
    for (;;) {
      while (i < src.length && /\s/.test(src[i] ?? "")) i += 1;
      if (src.startsWith("//", i)) {
        while (i < src.length && src[i] !== "\n") i += 1;
        continue;
      }
      return;
    }
  };
  for (;;) {
    skip();
    if (src[i] === "}") return { value: out, end: i + 1 };
    if (i >= src.length) fail(`${where}: unterminated map literal`);
    if (src[i] !== "'" && src[i] !== '"') fail(`${where}: map keys must be string literals (offset ${i})`);
    const key = readDartString(src, i, where);
    i = key.end;
    skip();
    if (src[i] !== ":") fail(`${where}: expected ':' after key "${key.value}"`);
    i += 1;
    skip();
    if (identifiers) {
      const ident = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*/.exec(src.slice(i));
      if (ident === null) fail(`${where}: "${key.value}" must map to a builder function, not an expression`);
      else {
        out[key.value] = ident[0];
        i += ident[0].length;
      }
    } else if (src[i] === "'" || src[i] === '"') {
      const value = readDartString(src, i, where);
      out[key.value] = value.value;
      i = value.end;
    } else if (src[i] === "{") {
      const value = readDartMap(src, i, `${where} › ${key.value}`, identifiers);
      out[key.value] = value.value;
      i = value.end;
    } else {
      fail(`${where}: "${key.value}" is neither a string nor a map`);
    }
    skip();
    if (src[i] === ",") i += 1;
  }
}

/**
 * @param {string} src @param {RegExp} opener @param {string} where
 * @param {boolean} [identifiers]
 * @returns {DartMap | undefined}
 */
function mapAfter(src, opener, where, identifiers = false) {
  const match = opener.exec(src);
  if (match === null) return undefined;
  const brace = src.indexOf("{", match.index + match[0].length - 1);
  if (brace === -1) fail(`${where}: no map literal follows`);
  return readDartMap(src, brace, where, identifiers).value;
}

/**
 * Read a `{'fa-IR': …, 'en-US': …}` table, insisting on every served locale and
 * refusing any locale this site does not serve. No locale ever degrades to
 * another: a missing translation is a red build, not a silent Persian string on
 * an English page.
 * @param {DartValue | undefined} node @param {string} what @param {string} where
 * @returns {Record<string, string>}
 */
function localized(node, what, where) {
  const table = asMap(node);
  if (table === undefined) fail(`${where}: ${what} is not a locale map`);
  /** @type {Record<string, string>} */
  const out = {};
  for (const locale of LOCALES) {
    const value = asString(table?.[locale]);
    if (value === undefined || value.trim() === "") {
      fail(`${where}: ${what} is missing a ${locale} string — no locale degrades to another`);
    } else {
      out[locale] = value;
    }
  }
  for (const locale of Object.keys(table ?? {})) {
    if (!LOCALES.includes(locale)) fail(`${where}: ${what} names locale "${locale}", which this site does not serve`);
  }
  return out;
}

/** Escape a copy string for the inside of a single-quoted Dart literal. */
const escapeDart = (/** @type {string} */ value) =>
  value.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\$/g, "\\$").replace(/\n/g, "\\n");

/** Trim a common leading indent off every non-blank line. @param {string[]} lines */
function dedent(lines) {
  const indents = lines.filter((l) => l.trim() !== "").map((l) => (l.match(/^\s*/) ?? [""])[0].length);
  const cut = indents.length === 0 ? 0 : Math.min(...indents);
  return lines
    .map((l) => l.slice(cut))
    .join("\n")
    .replace(/\s+$/, "");
}

/**
 * The Dart between `// BEGIN <id>` and `// END <id>`, dedented. A slice that is
 * one `return <expr>;` statement is unwrapped, so the manifest carries the
 * expression a reader pastes into their own `build`, not the demo's plumbing.
 * @param {string} src @param {string} id @param {string} where
 * @returns {string}
 */
function slice(src, id, where) {
  const begin = new RegExp(`^[ \\t]*// BEGIN ${id}[ \\t]*$`, "m").exec(src);
  const end = new RegExp(`^[ \\t]*// END ${id}[ \\t]*$`, "m").exec(src);
  if (begin === null) return fail(`${where}: "${id}" is registered but has no "// BEGIN ${id}" marker`);
  if (end === null) return fail(`${where}: "${id}" has a "// BEGIN" marker but no "// END ${id}"`);
  if (end.index < begin.index) fail(`${where}: "${id}" ends before it begins`);
  const body = src.slice(begin.index + begin[0].length, end.index);
  const source = dedent(body.split("\n").filter((l, i, all) => !(l.trim() === "" && (i === 0 || i === all.length - 1))));
  if (source.trim() === "") fail(`${where}: "${id}" brackets nothing`);
  const single = /^return\s([\s\S]*);$/.exec(source);
  if (single === null) return source;
  const inner = single[1] ?? "";
  // Only unwrap when the `return` really is the whole slice: a `;` at column
  // zero anywhere else means several statements, and cutting them would ship a
  // snippet that does not compile.
  if (/^\S.*;\s*$/m.test(inner.split("\n").slice(0, -1).join("\n"))) return source;
  return dedent(inner.split("\n"));
}

/**
 * Resolve a slice into one locale's copy-pasteable Dart. `${t['key']}` inside a
 * string is substituted RAW so the result is one literal rather than a literal
 * nested in a literal; a bare `t['key']` becomes a quoted literal.
 * @param {string} source @param {Record<string, Record<string, string>>} copy
 * @param {string} locale @param {string} where @param {string} id
 * @returns {string}
 */
function resolve(source, copy, locale, where, id) {
  /** @param {string} key @returns {string} */
  const lookup = (key) => {
    const entry = copy[key];
    if (entry === undefined) fail(`${where}: "${id}" reads t['${key}'], which the copy table does not have`);
    return entry?.[locale] ?? "";
  };
  const interpolated = source.replace(/\$\{t\[(['"])([^'"\]]+)\1\]\}/g, (_all, _q, key) => escapeDart(lookup(key)));
  const resolved = interpolated.replace(/\bt\[(['"])([^'"\]]+)\1\]/g, (_all, _q, key) => `'${escapeDart(lookup(key))}'`);
  const leftover = /\bt\[/.exec(resolved);
  if (leftover !== null) {
    fail(`${where}: "${id}" indexes the copy table with something other than a string literal — the snippet could not be resolved`);
  }
  return resolved;
}

const catalog = JSON.parse(await readFile(join(ROOT, "catalog.json"), "utf8"));
/** @type {Set<string>} */
const slugs = new Set(catalog.items.map((/** @type {{ name: string }} */ item) => item.name));

const files = (await readdir(DEMOS_DIR)).filter((f) => f.endsWith(".dart") && f !== "all.dart").sort();
if (files.length === 0) fail("apps/mobile-gallery/lib/demos has no demo files");

const registrySource = await readFile(REGISTRY, "utf8");
for (const file of files) {
  if (!registrySource.includes(`'${file}'`)) {
    fail(`apps/mobile-gallery/lib/demos/all.dart does not import ${file} — the gallery would never render it`);
  }
}

/** @type {Map<string, Demo>} */
const byId = new Map();

for (const file of files) {
  const where = `apps/mobile-gallery/lib/demos/${file}`;
  const src = await readFile(join(DEMOS_DIR, file), "utf8");
  const registered = mapAfter(src, /const\s+demos\s*=\s*(?:<[^{]*>)?\s*\{/, `${where} › demos`, true);
  const meta = mapAfter(src, /const\s+demoMeta\s*=\s*(?:<[^{]*>)?\s*\{/, `${where} › demoMeta`);
  if (registered === undefined) fail(`${where}: no \`const demos = <String, WidgetBuilder>{…}\``);
  if (meta === undefined) fail(`${where}: no \`const demoMeta = {…}\``);

  // A file whose demos render no words at all — a skeleton, an icon tile — is
  // allowed to have no copy table. Anything it then reads as t['…'] fails below.
  const rawCopy = mapAfter(src, /const\s+copy\s*=\s*(?:<[^{]*>)?\s*\{/, `${where} › copy`) ?? {};
  /** @type {Record<string, Record<string, string>>} */
  const copy = {};
  for (const key of Object.keys(rawCopy)) {
    copy[key] = localized(rawCopy[key], `copy['${key}']`, where);
  }

  // Usage is counted across the WHOLE file, not just the marked slices: a
  // removable demo resolves its labels once in `didChangeDependencies`, which
  // is plumbing that deliberately sits outside the snippet a reader copies.
  /** @type {Set<string>} */
  const usedCopy = new Set();
  for (const use of src.matchAll(/\bt\[(['"])([^'"\]]+)\1\]/g)) {
    const key = use[2];
    if (key !== undefined) usedCopy.add(key);
  }

  for (const id of Object.keys(registered ?? {})) {
    const already = byId.get(id);
    if (already !== undefined) fail(`${where}: "${id}" is already registered in ${already.where}`);
    const parsed = ID.exec(id);
    if (parsed === null) {
      fail(`${where}: "${id}" is not <slug>-<n>`);
      continue;
    }
    const [, slug = "", ordinalText = "0"] = parsed;
    const ordinal = Number(ordinalText);
    if (!slugs.has(slug)) fail(`${where}: "${id}" names slug "${slug}", which catalog.json does not have`);

    const entry = asMap(meta?.[id]);
    if (entry === undefined) {
      fail(`${where}: "${id}" is registered but has no demoMeta entry`);
      continue;
    }
    const title = localized(entry.title, `"${id}" title`, where);
    const description = localized(entry.description, `"${id}" description`, where);

    // A title becomes the iframe's `title` attribute, which the page cannot
    // wrap in a Latin island — so a Latin digit there fails no-latin-digits on
    // the served HTML. Descriptions are safe; they get islanded.
    for (const locale of LOCALES) {
      const heading = title[locale] ?? "";
      if (LATIN_DIGIT.test(heading)) {
        fail(`${where}: "${id}" has a Latin digit in its ${locale} title ("${heading}") — a title cannot be islanded`);
      }
    }

    const raw = slice(src, id, where);
    /** @type {Record<string, string>} */
    const source = {};
    for (const locale of LOCALES) source[locale] = resolve(raw, copy, locale, where, id);

    byId.set(id, { id, slug, ordinal, where, title, description, source });
  }

  for (const id of Object.keys(meta ?? {})) {
    if (registered?.[id] === undefined) fail(`${where}: demoMeta describes "${id}", which \`demos\` does not register`);
  }
  for (const marker of src.matchAll(/^[ \t]*\/\/ BEGIN ([a-z0-9-]+)[ \t]*$/gm)) {
    const marked = marker[1] ?? "";
    if (registered?.[marked] === undefined) {
      fail(`${where}: "// BEGIN ${marked}" brackets a demo \`demos\` does not register`);
    }
  }
  for (const key of Object.keys(copy)) {
    if (!usedCopy.has(key)) fail(`${where}: copy['${key}'] is translated but nothing in the file reads it — dead copy drifts`);
  }
}

/** @type {Map<string, Demo[]>} */
const bySlug = new Map();
for (const demo of byId.values()) {
  const list = bySlug.get(demo.slug);
  if (list === undefined) bySlug.set(demo.slug, [demo]);
  else list.push(demo);
}
for (const list of bySlug.values()) list.sort((a, b) => a.ordinal - b.ordinal);

/** @type {Record<string, Array<{ id: string, title: Record<string, string>, description: Record<string, string>, source: Record<string, string> }>>} */
const slugsOut = {};
for (const slug of [...bySlug.keys()].sort()) {
  slugsOut[slug] = (bySlug.get(slug) ?? []).map(({ id, title, description, source }) => ({ id, title, description, source }));
}

const manifest = {
  version: 2,
  locales: LOCALES,
  generatedFrom: ["apps/mobile-gallery/lib/demos/*.dart"],
  slugs: slugsOut,
};
const next = `${JSON.stringify(manifest, null, 2)}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(OUT, "utf8").catch(() => "");
  if (current !== next) {
    console.error("  mobile-demos: apps/website/src/lib/mobile-demos.generated.json is stale; run node scripts/build-mobile-demos.mjs");
    process.exit(1);
  }
  console.log(`  mobile-demos: ${byId.size} demo(s) across ${bySlug.size} slug(s) checked, in ${LOCALES.join(" and ")}`);
} else {
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, next);
  console.log(`  mobile-demos: ${byId.size} demo(s) across ${bySlug.size} slug(s) from ${files.length} file(s), in ${LOCALES.join(" and ")}`);
}
