#!/usr/bin/env node
/**
 * THE MEASUREMENT HARNESS. Run it, do not read numbers off it.
 *
 *   node experiments/harness/measure.mjs                       # impl = react-aria
 *   node experiments/harness/measure.mjs --impl base-ui        # the later phase
 *   node experiments/harness/measure.mjs --skip-tests --skip-bundle   # fast pass
 *
 * Writes `experiments/measurements/<impl>.json`. Every later phase reruns THIS
 * file against its own `specimens.<impl>.tsx` and `ledger.<impl>.json`; if the
 * harness is edited between phases the comparison stops being a comparison, so
 * changes here must be re-run against every impl that already has a file.
 *
 * ── WHY IT IS SHAPED LIKE THIS ──────────────────────────────────────────────
 *
 * **The gate rules are imported, never reimplemented.** `packages/gate/src` is
 * the project's definition of a defect. A harness with its own copy of "what a
 * dangling idref is" would measure the harness. `gradeHtml` is called with the
 * real `RULES` array, over a real `<html lang dir>` document, so `lang-dir` is
 * exercised too rather than being quietly skipped.
 *
 * **It measures the SERVED BYTES.** Everything here runs through
 * `renderToStaticMarkup` under `I18nProvider` (via `LumoProvider`) at
 * `fa-IR-u-ca-persian-nu-arabext`. That is the tier where this project's defect
 * ledger lives: a crawler, a no-JS reader and the first paint all see exactly
 * this. It is also the tier where React Aria's `useSlot`/`useSlotId` pattern
 * misbehaves, because the layout effect that corrects a slot id never runs on a
 * server. See `limitations` in the output for what this tier structurally
 * cannot see — an overlay's own subtree is portalled and renders `null`, so its
 * internals are NOT in these counts, and `packages/ui/src/overlays.test.tsx` is
 * the tier that covers them.
 *
 * **Every measurement has a control.** `specimens.<impl>.tsx` exports the wrapped
 * components AND a `BARE` arm composing the same thirteen straight out of the
 * library. "Zero English leaks" from the wrapper alone is a number with no
 * denominator; beside the bare arm it becomes a statement about what the wrapper
 * is holding shut.
 *
 * **Nothing is written into the working tree.** Generated entries go to a temp
 * directory created under `packages/ui/node_modules`, which is gitignored and
 * removed on exit. That location is not arbitrary: it is the only place where a
 * bare specifier resolves to exactly what `packages/ui` sees, so the size
 * numbers measure the ESM builds a consumer's bundler would take rather than the
 * CJS builds `require.resolve` would have handed an alias map.
 *
 * **The bundler is rolldown, not esbuild.** Stated plainly because the brief
 * assumed esbuild: esbuild is NOT installed in this workspace at any depth.
 * Vite 8 ships rolldown as its bundler and that is what is reachable, so that is
 * what is used, at `platform: "browser"`, `minify: true`, react/react-dom and
 * the JSX runtime external, output gzipped at default level. Each component is
 * bundled twice — alone, and again as part of a twelve-component bundle that
 * omits it — so the report can give both the standalone cost and the MARGINAL
 * cost of adding it to a project that already has the others. A Base UI run must
 * use the same settings or requirement 6 ends up comparing bundlers.
 *
 * **The run refuses to produce numbers it cannot back.** A poison specimen with
 * a planted defect of every graded kind is rendered and graded first; unless all
 * five rules fire, the harness aborts rather than reporting a clean sweep it may
 * simply have been blind to. The correcting-line ledger is re-validated against
 * the source the same way, and a drifted entry is fatal.
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../..");

// ── arguments ───────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const value = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const IMPL = value("impl", "react-aria");
const OUT = resolve(REPO, value("out", `experiments/measurements/${IMPL}.json`));
const SKIP_TESTS = flag("skip-tests");
const SKIP_BUNDLE = flag("skip-bundle");

const SPECIMENS_FILE = join(HERE, `specimens.${IMPL}.tsx`);
const LEDGER_FILE = join(HERE, `ledger.${IMPL}.json`);
for (const f of [SPECIMENS_FILE, LEDGER_FILE]) {
  if (!existsSync(f)) die(`Missing ${f}. Every impl needs a specimens file and a correcting-line ledger.`);
}

function die(message) {
  console.error(`\n  measure.mjs — ${message}\n`);
  process.exit(1);
}
const log = (...a) => console.error("  ·", ...a);

/** A version, without assuming a package exports its own package.json —
 *  `@internationalized/date` does not, and a thrown error there would take the
 *  whole run down over a provenance field. */
function pkgVersion(id) {
  try {
    return uiRequire(`${id}/package.json`).version;
  } catch {}
  try {
    let dir = dirname(uiRequire.resolve(id));
    for (let i = 0; i < 8; i++) {
      const p = join(dir, "package.json");
      if (existsSync(p)) {
        const json = JSON.parse(readFileSync(p, "utf8"));
        if (json.name === id) return json.version;
      }
      dir = dirname(dir);
    }
  } catch {}
  return null;
}

/** A package's ESM entry, read from its own `exports` map. `require.resolve`
 *  would answer with the CJS build, which is a different module graph. */
function esmEntry(id) {
  let dir = dirname(uiRequire.resolve(id));
  for (let i = 0; i < 8; i++) {
    const p = join(dir, "package.json");
    if (existsSync(p)) {
      const json = JSON.parse(readFileSync(p, "utf8"));
      if (json.name === id) {
        const dot = json.exports?.["."];
        const rel = (typeof dot === "string" ? dot : dot?.import ?? dot?.module ?? dot?.default) ?? json.module ?? json.main;
        if (!rel) die(`${id} has no resolvable ESM entry.`);
        return join(dir, rel);
      }
    }
    dir = dirname(dir);
  }
  die(`Could not find the package root for ${id}.`);
}

function sha256(text) {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

// ── module resolution, all of it up front ───────────────────────────────────
/**
 * Deliberately explicit. The harness lives outside every package, so nothing
 * bare resolves from here; resolving through `packages/ui/package.json` is what
 * makes the measurement use the SAME dependency instances the library uses,
 * patches and all.
 */
const uiRequire = createRequire(join(REPO, "packages/ui/package.json"));
const gateRequire = createRequire(join(REPO, "packages/gate/package.json"));

/**
 * The generated entry files are written INSIDE `packages/ui/node_modules`, and
 * that is a deliberate choice rather than an accident of convenience.
 *
 * An alias map from bare specifier to absolute path was the obvious
 * alternative, and it is wrong for the size measurement: `require.resolve` picks
 * the `require` condition, so `react-aria-components` would resolve to its CJS
 * build and every gzip figure would be measuring how badly CJS tree-shakes. From
 * a directory under `packages/ui/node_modules`, Node's own lookup finds exactly
 * the packages `packages/ui` sees, and rolldown applies the same `exports`
 * conditions a consumer's bundler would. The directory is removed on exit, and
 * `node_modules` is gitignored, so nothing lands in the working tree.
 */
const WORK_PARENT = join(REPO, "packages/ui/node_modules");
if (!existsSync(WORK_PARENT)) die(`${WORK_PARENT} does not exist — run pnpm install first.`);

/** rolldown, reached the only way it is reachable here: vitest → vite → rolldown. */
const rolldownPath = createRequire(createRequire(uiRequire.resolve("vitest")).resolve("vite")).resolve("rolldown");
const { rolldown } = await import(rolldownPath);
const ROLLDOWN_VERSION = createRequire(rolldownPath)("rolldown/package.json").version;

/** The REAL gate. Node strips the types; the rules are the shipped ones. */
const gate = await import(join(REPO, "packages/gate/src/index.ts"));
const { parseHTML } = await import(gateRequire.resolve("linkedom"));

const WORK = mkdtempSync(join(WORK_PARENT, `.lumo-measure-${IMPL}-`));
process.on("exit", () => {
  try {
    rmSync(WORK, { recursive: true, force: true });
  } catch {}
});

// ── 0. bundle the specimens so they can be imported and rendered ────────────
async function bundleSpecimens() {
  const entry = join(WORK, "runtime.tsx");
  writeFileSync(
    entry,
    [
      `import { renderToStaticMarkup } from "react-dom/server";`,
      `import { Poison, SPECIMEN_META, mount, mountBare, suppliedStrings } from ${JSON.stringify(SPECIMENS_FILE)};`,
      `export { SPECIMEN_META, suppliedStrings };`,
      `export function ssr(name, ctx) { return renderToStaticMarkup(mount(name, ctx)); }`,
      `export function ssrBare(name, ctx) { return renderToStaticMarkup(mountBare(name, ctx)); }`,
      `export function ssrPoison() { return renderToStaticMarkup(Poison()); }`,
      ``,
    ].join("\n"),
  );
  const bundle = await rolldown({
    input: entry,
    platform: "node",
    /*
     * Two aliases, both only for the runtime bundle, both because the specimens
     * file sits outside every package and has no `node_modules` above it:
     *
     *   react/jsx-runtime      injected by the automatic JSX transform
     *   the UI library itself  imported by the bare control arm
     *
     * Both are pinned to the exact modules `packages/ui` resolves — the react
     * the components run on, and the library's own ESM entry (its `exports`
     * map's `import` condition, NOT `require.resolve`'s CJS, so the bare arm
     * and the wrapped arm share one instance rather than two).
     *
     * The size bundles take no alias at all: react is external there, and the
     * generated entries live under `packages/ui/node_modules`, where the bare
     * specifiers resolve on their own.
     */
    resolve: {
      alias: {
        "react/jsx-runtime": uiRequire.resolve("react/jsx-runtime"),
        "react-aria-components": esmEntry("react-aria-components"),
      },
    },
  });
  await bundle.write({ dir: join(WORK, "runtime"), format: "esm", entryFileNames: "[name].mjs" });
  await bundle.close?.();
  return import(join(WORK, "runtime", "runtime.mjs"));
}

log(`bundling specimens.${IMPL}.tsx …`);
const runtime = await bundleSpecimens();
const META = runtime.SPECIMEN_META;
const COMPONENTS = Object.keys(META);
log(`${COMPONENTS.length} specimens: ${COMPONENTS.join(", ")}`);

/**
 * The poison pass. Graded under a fa-IR route with a deliberately wrong
 * `<html lang="en" dir="ltr">`, so `lang-dir` fires alongside the other four.
 * Nothing downstream is allowed to run if this does not go fully red.
 */
const poisonDoc =
  `<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8"><title>poison</title></head>` +
  `<body>${runtime.ssrPoison()}</body></html>`;
const poisonViolations = gate.gradeHtml("fa-IR/poison.html", poisonDoc, gate.RULES);
const poisonFired = [...new Set(poisonViolations.map((v) => v.rule))].sort();
const poisonMissing = gate.RULES.map((r) => r.id).filter((id) => !poisonFired.includes(id));
if (poisonMissing.length) {
  die(
    `the poison specimen did not trip ${poisonMissing.join(", ")}.\n` +
      `    Every number in this report is a claim that a defect was looked for and not found.\n` +
      `    If the harness cannot see a planted defect, it cannot support that claim, so the run stops.`,
  );
}
log(`poison specimen trips ${poisonFired.length}/${gate.RULES.length} rules`);

// ── the render matrix ───────────────────────────────────────────────────────
/**
 * Four renders per component, and each one answers a different question:
 *
 *   fa/closed  the served bytes of the default state          → requirements 1,2
 *   fa/open    the served bytes with every overlay forced open → requirement 1,2
 *   fa/rtl     identical to fa/closed, kept as the RTL arm     → requirement 3
 *   en/ltr     same STRINGS, opposite direction                → requirement 3
 *
 * The last pair holds the words fixed (`strings: "fa-IR"` in both) so the diff
 * shows mirroring rather than translation. Without that, every attribute
 * carrying a Persian noun would count as a direction delta.
 */
function renderAll(name) {
  const opens = META[name].opens;
  const states = { closed: { locale: "fa-IR", strings: "fa-IR", open: false } };
  if (opens) states.open = { locale: "fa-IR", strings: "fa-IR", open: true };
  const out = {};
  for (const [state, ctx] of Object.entries(states)) {
    out[state] = { ctx, html: runtime.ssr(name, ctx), supplied: runtime.suppliedStrings(name, ctx) };
  }
  const rtlCtx = { locale: "fa-IR", strings: "fa-IR", open: opens };
  const ltrCtx = { locale: "en-US", strings: "fa-IR", open: opens };
  out.rtl = { ctx: rtlCtx, html: runtime.ssr(name, rtlCtx), supplied: runtime.suppliedStrings(name, rtlCtx) };
  out.ltr = { ctx: ltrCtx, html: runtime.ssr(name, ltrCtx), supplied: runtime.suppliedStrings(name, ltrCtx) };
  // The control arm: the library on its own, same locale, no corrections.
  out.bare = { ctx: rtlCtx, html: runtime.ssrBare(name, rtlCtx), supplied: [] };
  return out;
}

/** A whole document, because `lang-dir` grades `<html>` and a fragment has none. */
function document_(html, { locale, direction }) {
  return (
    `<!doctype html><html lang="${locale}" dir="${direction}">` +
    `<head><meta charset="utf-8"><title>${locale}</title></head>` +
    `<body><div dir="${direction}">${html}</div></body></html>`
  );
}
const DIRECTION = { "fa-IR": "rtl", "en-US": "ltr" };

// ── 1. SSR defects, graded by the shipped rules ─────────────────────────────
const RULE_FIELD = {
  "resolved-idrefs": "dangling_idrefs",
  "named-controls": "unnamed_controls",
  "no-latin-aria": "latin_aria",
  "no-latin-digits": "latin_digits",
  "lang-dir": "lang_dir",
};

function ssrDefects(name, renders) {
  const perState = {};
  for (const state of ["closed", "open", "bare"]) {
    if (!renders[state]) continue;
    const { locale } = renders[state].ctx;
    const path = `${locale}/${name}--${state}.html`;
    const doc = document_(renders[state].html, { locale, direction: DIRECTION[locale] });
    const violations = gate.gradeHtml(path, doc, gate.RULES);
    const counts = { dangling_idrefs: 0, unnamed_controls: 0, latin_aria: 0, latin_digits: 0, lang_dir: 0 };
    for (const v of violations) counts[RULE_FIELD[v.rule]] += 1;
    perState[state] = {
      counts,
      total: violations.length,
      violations: violations.map((v) => ({ rule: v.rule, detail: v.detail, snippet: v.snippet ?? null })),
    };
  }
  // `worst_case` is over the WRAPPED states only. The bare arm is the control
  // and is reported beside it, never folded into Lumo's own number.
  const worst = { dangling_idrefs: 0, unnamed_controls: 0, latin_aria: 0, latin_digits: 0, lang_dir: 0 };
  for (const [state, s] of Object.entries(perState)) {
    if (state === "bare") continue;
    for (const k of Object.keys(worst)) worst[k] = Math.max(worst[k], s.counts[k]);
  }
  return {
    by_state: perState,
    worst_case: worst,
    total_worst_case: Object.values(worst).reduce((a, b) => a + b, 0),
    bare_library: perState.bare?.counts ?? null,
    bare_library_total: perState.bare ? perState.bare.total : null,
  };
}

// ── 2. English leaks, with every string attributed ──────────────────────────
/**
 * Mirrors `packages/gate/src/rules.ts`'s own `SPOKEN` list. It is duplicated
 * rather than imported because the gate does not export it; the AUTHORITATIVE
 * count of speakable English is requirement 1's `latin_aria`, produced by the
 * real rule. This section exists to attribute each string, which the rule does
 * not do.
 */
const SPOKEN_ATTRS = ["aria-label", "aria-roledescription", "aria-valuetext", "aria-description", "aria-placeholder", "aria-keyshortcuts", "title"];
const LATIN_WORD = /[A-Za-z]{3,}/;
const NON_TEXT = new Set(["SCRIPT", "STYLE", "TEMPLATE", "NOSCRIPT"]);

function harvest(html) {
  const { document } = parseHTML(`<!doctype html><html><body>${html}</body></html>`);
  const aria = [];
  for (const el of Array.from(document.querySelectorAll("*"))) {
    for (const attr of Array.from(el.attributes ?? [])) {
      if (!attr.name.startsWith("aria-") && attr.name !== "title") continue;
      aria.push({ attr: attr.name, value: attr.value ?? "", spoken: SPOKEN_ATTRS.includes(attr.name), tag: el.tagName.toLowerCase() });
    }
  }
  const text = [];
  const walk = (node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === 3) {
        if (child.data.trim()) text.push(child.data.trim());
      } else if (child.nodeType === 1 && !NON_TEXT.has(child.tagName)) {
        walk(child);
      }
    }
  };
  walk(document.body);
  return { aria, text };
}

/**
 * One rendered string → where it came from.
 *
 * Order matters and is not arbitrary. A prop is checked FIRST because several
 * of Lumo's Persian strings are byte-identical to the patched bundle's — the
 * ComboBox passes «نمایش پیشنهادها» and the patch supplies «نمایش پیشنهادها» —
 * and crediting the patch for a string the component passed would make the
 * patch look load-bearing where it is only a backstop. Where both routes exist
 * the record says so, rather than picking a winner silently.
 */
/** Does a rendered string carry a patched TEMPLATE's literal segments, in order? */
function matchTemplate(valueText, templates) {
  for (const t of templates) {
    let at = 0;
    let ok = true;
    for (const seg of t.segments) {
      const i = valueText.indexOf(seg, at);
      if (i < 0) {
        ok = false;
        break;
      }
      at = i + seg.length;
    }
    if (ok) return { patch: t.patch, bundle: t.bundle, key: t.key, match: t.match };
  }
  return null;
}

function attribute(valueText, supplied, patchIndex, attr, spoken) {
  const patched = patchIndex.byValue.get(valueText) ?? matchTemplate(valueText, patchIndex.templates);
  const prop = supplied.find((s) => s.value === valueText);
  if (prop) {
    return { attribution: "lumo-prop", source: null, absent_would_be: prop.absent, upstream_english: prop.upstreamEnglish ?? null, also_supplied_by_patch: patched };
  }
  if (patched) return { attribution: "lumo-patch", source: patched };
  if (LATIN_WORD.test(valueText)) {
    // `aria-hidden="true"`, `aria-haspopup="listbox"` and an idref are Latin and
    // are not English PROSE. Calling them leaks would drown the real ones.
    if (!spoken) return { attribution: "aria-token", source: null };
    const en = patchIndex.byEnglish.get(valueText);
    // A patched key whose ENGLISH value still shows up means the patch exists
    // and does not reach this render — a different fact from "never patched".
    return { attribution: en ? "english-despite-patch" : "english-upstream", source: en ?? null };
  }
  return { attribution: "authored-content", source: null };
}

function englishLeaks(name, renders, patchIndex) {
  const perState = {};
  for (const state of ["closed", "open", "bare"]) {
    if (!renders[state]) continue;
    const { supplied, html } = renders[state];
    const { aria, text } = harvest(html);
    const records = [];
    for (const a of aria) {
      if (!a.value) continue;
      records.push({ where: "aria", attr: a.attr, spoken: a.spoken, tag: a.tag, value: a.value, latin: LATIN_WORD.test(a.value), ...attribute(a.value, supplied, patchIndex, a.attr, a.spoken) });
    }
    for (const t of text) {
      records.push({ where: "text", attr: null, spoken: true, tag: null, value: t, latin: LATIN_WORD.test(t), ...attribute(t, supplied, patchIndex, null, true) });
    }
    const spokenRecords = records.filter((r) => r.spoken);
    const englishNow = spokenRecords.filter((r) => r.latin);
    const fromPatch = spokenRecords.filter((r) => r.attribution === "lumo-patch");
    const fromProps = spokenRecords.filter((r) => r.attribution === "lumo-prop");
    // Only the props whose ABSENCE would be English count toward the
    // without-props figure. The rest would leave a control unnamed, which is a
    // different defect and gets its own number.
    const propsHoldingBackEnglish = fromProps.filter((r) => r.absent_would_be === "english");
    const propsPreventingUnnamed = fromProps.filter((r) => r.absent_would_be === "unnamed");
    perState[state] = {
      // The literal reading of the brief: EVERY aria-* value matching the
      // regex, enumerated tokens and idrefs included. Kept because it is what
      // was asked for, reported apart because `aria-hidden="true"` and
      // `aria-labelledby="react-aria-_R_1_"` are not English leaks.
      latin_in_any_aria_value: records.filter((r) => r.where === "aria" && r.latin).length,
      english_with_patches: englishNow.length,
      english_without_patches: englishNow.length + fromPatch.length,
      english_without_required_props: englishNow.length + propsHoldingBackEnglish.length,
      controls_that_would_be_unnamed_without_required_props: propsPreventingUnnamed.length,
      attributed: {
        "lumo-prop": fromProps.map((r) => ({ value: r.value, absent_would_be: r.absent_would_be, upstream_english: r.upstream_english, also_supplied_by_patch: r.also_supplied_by_patch })),
        "lumo-patch": fromPatch.map((r) => ({ value: r.value, ...r.source })),
        "english-upstream": englishNow.filter((r) => r.attribution === "english-upstream").map((r) => ({ where: r.where, attr: r.attr, value: r.value })),
        "english-despite-patch": englishNow.filter((r) => r.attribution === "english-despite-patch").map((r) => ({ where: r.where, attr: r.attr, value: r.value, ...r.source })),
      },
      records,
    };
  }
  return perState;
}

// ── 3. RTL, and who resolves it ─────────────────────────────────────────────
const PHYSICAL_CSS = /(^|[^-])\b(left|right|margin-left|margin-right|padding-left|padding-right|border-left|border-right|transform)\b/;
const LOGICAL_CSS = /\b(inset-inline|margin-inline|padding-inline|border-inline|inline-size)/;

/** Utility censuses. String matching over the source, not a CSS parse — stated
 *  as such because a Tailwind arbitrary value could in principle fool it. */
const LOGICAL_UTIL = /(^|[\s"'`:[])-?(ms|me|ps|pe|start|end|mis|mie|pis|pie|mbs|mbe|border-s|border-e|rounded-ss|rounded-se|rounded-es|rounded-ee)-|text-start|text-end|inset-inline/g;
const PHYSICAL_UTIL = /(^|[\s"'`:[])-?(ml|mr|pl|pr|left|right|border-l|border-r|rounded-tl|rounded-tr|rounded-bl|rounded-br|translate-x)-|text-left|text-right/g;

function elementsOf(html) {
  const { document } = parseHTML(`<!doctype html><html><body>${html}</body></html>`);
  const out = [];
  const walk = (node, path) => {
    let i = 0;
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType !== 1) continue;
      const p = `${path}>${child.tagName.toLowerCase()}[${i++}]`;
      const attrs = {};
      for (const a of Array.from(child.attributes ?? [])) attrs[a.name] = a.value ?? "";
      out.push({ path: p, tag: child.tagName.toLowerCase(), attrs });
      if (!NON_TEXT.has(child.tagName)) walk(child, p);
    }
  };
  walk(document.body, "body");
  return out;
}

function rtlDeltas(name, renders, sources) {
  const rtl = elementsOf(renders.rtl.html);
  const ltr = elementsOf(renders.ltr.html);
  const deltas = [];
  const structurallyIdentical = rtl.length === ltr.length && rtl.every((e, i) => ltr[i] && ltr[i].tag === e.tag);
  const n = Math.min(rtl.length, ltr.length);
  for (let i = 0; i < n; i++) {
    const a = rtl[i];
    const b = ltr[i];
    const keys = new Set([...Object.keys(a.attrs), ...Object.keys(b.attrs)]);
    for (const k of keys) {
      // React Aria's generated ids differ per render tree; they are noise here.
      if (k === "id" || k === "aria-labelledby" || k === "aria-describedby" || k === "aria-controls" || k === "for" || k === "htmlFor") continue;
      const av = a.attrs[k];
      const bv = b.attrs[k];
      if (av === bv) continue;
      const physical = (av ?? "") + (bv ?? "");
      deltas.push({
        element: a.path,
        attr: k,
        rtl: av ?? null,
        ltr: bv ?? null,
        /*
         * Not every locale delta is a DIRECTION delta. `aria-valuetext="۴۰"`
         * against `"40"` is the numbering system, which changes with the locale
         * and would change with it in a left-to-right locale too. Folding the
         * digits apart keeps requirement 3 about mirroring.
         */
        nature: foldDigits(av ?? "") === foldDigits(bv ?? "") ? "number-format" : k === "class" || k === "style" || k === "dir" ? "direction" : "other",
        /*
         * Who resolved this?
         *   class  — Lumo wrote it. A class delta would mean Lumo branched on
         *            direction in JS instead of using a logical utility.
         *   style  — React Aria computed it during render, from useLocale().
         *   other  — an attribute the library varies (dir, data-*).
         */
        owner: k === "class" ? "lumo" : k === "style" ? "library" : "library",
        css_axis: k === "style" ? (PHYSICAL_CSS.test(physical) ? "physical" : LOGICAL_CSS.test(physical) ? "logical" : "other") : null,
      });
    }
  }
  const src = sources[name];
  return {
    structurally_identical: structurallyIdentical,
    element_count: { rtl: rtl.length, ltr: ltr.length },
    // The headline: how many bytes of the rendered markup change with
    // direction, and who wrote them.
    class_deltas: deltas.filter((d) => d.attr === "class").length,
    style_deltas: deltas.filter((d) => d.attr === "style").length,
    other_attr_deltas: deltas.filter((d) => d.attr !== "class" && d.attr !== "style").length,
    library_physical_css_deltas: deltas.filter((d) => d.css_axis === "physical").length,
    number_format_deltas: deltas.filter((d) => d.nature === "number-format").length,
    deltas,
    /*
     * The static half. A zero class-delta only means direction is not resolved
     * in JS; it does not by itself prove the CSS is direction-correct. The
     * census counts the logical utilities that do that work, and the physical
     * ones that would defeat it.
     */
    static_census: {
      // CODE ONLY. Running this over the whole file counted the prose: these
      // components explain at length why `translate-x` and `left`/`right` are
      // wrong, and every one of those sentences scored as a physical utility.
      // Switch reported two physical utilities and has none.
      logical_utilities: countMatches(src.code, LOGICAL_UTIL),
      physical_inline_utilities: countMatches(src.code, PHYSICAL_UTIL),
      logical_css_properties_in_inline_styles: countMatches(src.code, /insetInline|inlineSize|marginInline|paddingInline/g),
      note: "String census over the component's CODE lines (comments excluded), not a CSS parse. Block-axis physical utilities (top-*, -mb-px, border-b) are correct in both scripts and are deliberately NOT counted as physical-inline.",
    },
  };
}

/** Persian and Arabic-Indic digits → Latin, so "۴۰" and "40" compare equal. */
function foldDigits(s) {
  return s.replace(/[۰-۹]/g, (d) => String(d.codePointAt(0) - 0x06f0)).replace(/[٠-٩]/g, (d) => String(d.codePointAt(0) - 0x0660));
}

function countMatches(text, re) {
  return (text.match(new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g")) ?? []).length;
}

// ── 4. wrapper lines, and the correcting/styling split ──────────────────────
/**
 * One pass over a file, tagging each line.
 *
 * `styling` and `plumbing` are decided MECHANICALLY — a line inside a `cva(…)`
 * call or carrying a `className`/`cn(` is styling; an import or a bare
 * re-export is plumbing — so the only judgement in the whole split lives in the
 * ledger, where it is written down and re-validated.
 */
function classify(src) {
  const out = [];
  let inBlockComment = false;
  let cvaDepth = 0;
  let inImport = false;
  for (const raw of src.split("\n")) {
    const t = raw.trim();
    let kind;
    if (inBlockComment) {
      kind = "comment";
      if (t.includes("*/")) inBlockComment = false;
    } else if (t === "") {
      kind = "blank";
    } else if (t.startsWith("//")) {
      kind = "comment";
    } else if (t.startsWith("/*") || t.startsWith("{/*")) {
      kind = "comment";
      if (!t.includes("*/")) inBlockComment = true;
    } else {
      kind = "code";
    }

    let styling = false;
    let plumbing = false;
    if (kind === "code") {
      const opens = (t.match(/\(/g) ?? []).length;
      const closes = (t.match(/\)/g) ?? []).length;
      if (cvaDepth > 0) {
        styling = true;
        cvaDepth = Math.max(0, cvaDepth + opens - closes);
      } else if (/\bcva\(/.test(t)) {
        styling = true;
        cvaDepth = Math.max(0, opens - closes);
      }
      if (/className[=:]|\bcn\(/.test(t)) styling = true;

      if (inImport) {
        plumbing = true;
        if (t.includes(";")) inImport = false;
      } else if (/^import\b/.test(t) || /^export\s+\*/.test(t) || /^export\s+(type\s+)?\{[^}]*\}/.test(t)) {
        plumbing = true;
        if (!t.includes(";")) inImport = true;
      }
    }
    out.push({ text: t, kind, styling, plumbing });
  }
  return out;
}

function wrapperLines(name, ledger, sources) {
  const files = sources[name].files;
  const entries = (ledger.components[name]?.corrections ?? []).map((c) => ({ ...c, found: 0, at: [] }));

  /** Every line of every file the component owns, in one addressable list. */
  const all = [];
  const perFile = [];
  for (const f of files) {
    const src = readFileSync(join(REPO, f), "utf8");
    const tagged = classify(src);
    // `wc -l` counts newlines; a trailing newline must not become a line.
    const wc = src.split("\n").length - (src.endsWith("\n") ? 1 : 0);
    const t = { file: f, wc_l: wc, code: 0, comment: 0, blank: 0 };
    tagged.forEach((line, i) => {
      if (i < wc) t[line.kind] += 1;
      all.push({ ...line, file: f, line: i + 1 });
    });
    perFile.push(t);
  }

  /*
   * The ledger, re-validated. A judgement that has drifted off the code is
   * worse than no judgement — it reads as evidence and is not — so a mismatch
   * aborts the whole run rather than warning.
   */
  const problems = [];
  for (const e of entries) {
    const want = e.text.trim();
    for (const line of all) {
      if (line.kind !== "code" || line.text !== want) continue;
      line.correcting = e.kind;
      e.found += 1;
      e.at.push(`${line.file}:${line.line}`);
    }
    if (e.found !== e.occurrences) {
      problems.push(`${name}: ${JSON.stringify(e.text)} expected ${e.occurrences} occurrence(s), found ${e.found}`);
    }
  }
  if (problems.length) {
    die(`the correcting-line ledger no longer matches the source:\n    ${problems.join("\n    ")}\n\n    Fix ledger.${IMPL}.json, or the split it produces is fiction.`);
  }

  /*
   * Buckets, in precedence order, so they sum to `code` exactly:
   *   correcting > plumbing > styling > invariant > structure
   */
  const bucket = { correcting: 0, imports_exports: 0, styling: 0, lumo_invariant_lumonode: 0, structure: 0 };
  for (const line of all) {
    if (line.kind !== "code") continue;
    if (line.correcting) bucket.correcting += 1;
    else if (line.plumbing) bucket.imports_exports += 1;
    else if (line.styling) bucket.styling += 1;
    else if (/\bLumoNode\b/.test(line.text)) bucket.lumo_invariant_lumonode += 1;
    else bucket.structure += 1;
  }

  const byKind = {};
  for (const e of entries) byKind[e.kind] = (byKind[e.kind] ?? 0) + e.found;

  return {
    files: perFile,
    wc_l: perFile.reduce((a, f) => a + f.wc_l, 0),
    code: perFile.reduce((a, f) => a + f.code, 0),
    comment: perFile.reduce((a, f) => a + f.comment, 0),
    blank: perFile.reduce((a, f) => a + f.blank, 0),
    split: bucket,
    correcting_by_kind: byKind,
    correcting_lines: entries.map((e) => ({ text: e.text, kind: e.kind, why: e.why, occurrences: e.found, at: e.at })),
  };
}

// ── 5. the existing conformance suites ──────────────────────────────────────
/**
 * The mapping is DERIVED, not hand-written: every `*.test.tsx` in
 * `packages/ui/src` that imports `./<name>.tsx` is a suite for that component.
 * A hand-written list is a list that stops being true.
 *
 * Note the overlap. `overlays.test.tsx` alone covers five of the thirteen, so
 * per-component pass counts are NOT additive — the same 8 tests are attributed
 * to combobox, dialog, menu, select and tabs. The union totals are reported
 * separately, and they are the number to compare against a Base UI run.
 */
function testMapping() {
  const dir = join(REPO, "packages/ui/src");
  const files = readdirSync(dir);
  const testFiles = files.filter((f) => f.endsWith(".test.tsx") || f.endsWith(".test.ts"));

  /** Local `./x.tsx` imports of any file in the package, one hop. */
  const importsOf = (file) => {
    const src = readFileSync(join(dir, file), "utf8");
    return [...src.matchAll(/from "\.\/([A-Za-z0-9._-]+\.tsx?)"/g)].map((m) => m[1]);
  };
  /** …closed transitively, so a suite that renders a Select is credited with
   *  exercising the Popover that Select composes. */
  const reach = (file, seen = new Set()) => {
    for (const dep of importsOf(file)) {
      if (seen.has(dep) || !files.includes(dep)) continue;
      seen.add(dep);
      reach(dep, seen);
    }
    return seen;
  };
  const reachable = Object.fromEntries(testFiles.map((t) => [t, reach(t)]));

  const map = {};
  for (const name of COMPONENTS) {
    const target = basename(META[name].file);
    const needle = `from "./${target}"`;
    const direct = testFiles.filter((t) => readFileSync(join(dir, t), "utf8").includes(needle));
    map[name] = {
      direct,
      // A suite that never names the component but renders it through another
      // one. Reported apart because it exercises the composition, not the
      // component's own contract — it is not a conformance bar.
      indirect: testFiles.filter((t) => !direct.includes(t) && reachable[t].has(target)),
    };
  }
  return map;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function runTests(map) {
  const union = [...new Set(Object.values(map).flatMap((m) => m.direct))].sort();
  // coverage.test.ts enumerates the FILESYSTEM rather than an import list, so
  // every component has cases in it whether or not anybody wrote it a suite.
  if (existsSync(join(REPO, "packages/ui/src/coverage.test.ts"))) union.push("coverage.test.ts");
  const outFile = join(WORK, "vitest.json");
  const args = ["--filter", "@lumo-ui/ui", "exec", "vitest", "run", "--no-file-parallelism", "--reporter=json", `--outputFile=${outFile}`, ...union.map((f) => `src/${f}`)];
  log(`vitest: ${union.length} files …`);
  const proc = spawnSync("pnpm", args, { cwd: REPO, encoding: "utf8", timeout: 600_000 });
  if (!existsSync(outFile)) {
    return { ran: false, reason: `vitest produced no report (exit ${proc.status})`, stderr: (proc.stderr ?? "").slice(-2000), command: `pnpm ${args.join(" ")}` };
  }
  const report = JSON.parse(readFileSync(outFile, "utf8"));
  const byFile = {};
  for (const suite of report.testResults) {
    const f = basename(suite.name);
    byFile[f] = {
      status: suite.status,
      tests: suite.assertionResults.map((a) => ({ name: a.fullName, status: a.status })),
      passed: suite.assertionResults.filter((a) => a.status === "passed").length,
      failed: suite.assertionResults.filter((a) => a.status === "failed").length,
      total: suite.assertionResults.length,
    };
  }
  const coverageCases = byFile["coverage.test.ts"]?.tests ?? [];
  const per = {};
  for (const [name, m] of Object.entries(map)) {
    const suites = m.direct.filter((f) => byFile[f]);
    const passed = suites.reduce((a, f) => a + byFile[f].passed, 0);
    const failed = suites.reduce((a, f) => a + byFile[f].failed, 0);
    /*
     * `coverage.test.ts` parametrises over the filesystem, so its case titles
     * are `"<file> is exported from the barrel"`. Matching by bare substring was
     * wrong and quietly generous: `select.tsx` also matched `native-select.tsx`,
     * `menu.tsx` matched `context-menu.tsx` and `navigation-menu.tsx`, and three
     * components were credited with two or three times the cases they have.
     */
    const own = coverageCases.filter((t) => new RegExp(`(^|[\\s>])${escapeRe(basename(META[name].file))}(\\s|$)`).test(t.name));
    per[name] = {
      suites: m.direct,
      indirect_suites: m.indirect,
      dedicated_suite: m.direct.some((f) => f.startsWith(`${name}.test.`)),
      has_behavioural_suite: m.direct.length > 0,
      passed,
      failed,
      total: passed + failed,
      coverage_cases: { passed: own.filter((t) => t.status === "passed").length, failed: own.filter((t) => t.status !== "passed").length, total: own.length },
      command: m.direct.length ? `pnpm --filter @lumo-ui/ui exec vitest run ${m.direct.map((f) => `src/${f}`).join(" ")}` : null,
    };
  }
  return {
    ran: true,
    union_files: union,
    union: { total: report.numTotalTests, passed: report.numPassedTests, failed: report.numFailedTests, green: report.success === true },
    per_component: per,
    by_file: Object.fromEntries(Object.entries(byFile).map(([f, v]) => [f, { status: v.status, passed: v.passed, failed: v.failed, total: v.total }])),
    failures: Object.entries(byFile).flatMap(([f, v]) => v.tests.filter((t) => t.status !== "passed").map((t) => ({ file: f, test: t.name, status: t.status }))),
    command: `pnpm ${args.join(" ")}`,
    components_without_a_behavioural_suite: Object.entries(per).filter(([, v]) => !v.has_behavioural_suite).map(([n]) => n),
    note: "Per-component counts OVERLAP: a shared suite (overlays.test.tsx covers five components) is attributed to each of them. Use `union` for a total. `components_without_a_behavioural_suite` is the list that matters for the comparison — for those, the only thing running against a replacement is coverage.test.ts, which checks wiring and English defaults rather than behaviour.",
  };
}

// ── 6. bundle weight ────────────────────────────────────────────────────────
const EXTERNAL = ["react", "react-dom", "react-dom/server", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"];

async function measureBundle(label, importPaths) {
  const entry = join(WORK, `size-${label}.tsx`);
  writeFileSync(entry, importPaths.map((p) => `export * from ${JSON.stringify(p)};`).join("\n") + "\n");
  const bundle = await rolldown({
    input: entry,
    external: EXTERNAL,
    // `browser`, because the number that matters is what a consumer's bundler
    // ships. It also selects the ESM builds through `exports`, which is what
    // makes tree-shaking meaningful.
    platform: "browser",
  });
  const result = await bundle.generate({ format: "esm", minify: true });
  await bundle.close?.();
  const chunk = result.output.find((o) => o.type === "chunk");
  const code = Buffer.from(chunk.code, "utf8");
  const modules = chunk.modules ? Object.keys(chunk.modules).length : (chunk.moduleIds ?? []).length;
  return { minified_bytes: code.length, gzip_bytes: gzipSync(code).length, modules };
}

// ── patches ─────────────────────────────────────────────────────────────────
/**
 * Parses the two patch files rather than the installed node_modules, because
 * the patch is the artefact this project OWNS and must re-apply on every
 * upgrade. `byValue` maps a Persian string back to the bundle+key that supplies
 * it, which is how a rendered «بستن» is told apart from a rendered «بستن» that
 * a component passed as a prop.
 */
function readPatches() {
  const dir = join(REPO, "patches");
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".patch")) : [];
  const index = { byValue: new Map(), byEnglish: new Map(), templates: [] };
  const patches = [];
  for (const file of files) {
    const raw = readFileSync(join(dir, file), "utf8");
    const bundles = {};
    let registriesTouched = 0;
    let current = null;
    for (const line of raw.split("\n")) {
      const m = line.match(/^diff --git a\/(\S+) b\/(\S+)$/);
      if (m) {
        const path = m[2];
        const fa = path.match(/intl\/(?:([\w-]+)\/)?fa-IR\.mjs$/);
        current = fa ? { bundle: fa[1] ?? "(root)", path, keys: {}, functions: [], templates: [] } : null;
        if (current) bundles[current.bundle] = current;
        if (/intlStrings\.mjs$/.test(path)) registriesTouched += 1;
        continue;
      }
      if (!current || !line.startsWith("+") || line.startsWith("+++")) continue;
      const body = line.slice(1).trim();
      const kv = body.match(/^"([^"]+)":\s*`([^`]*)`,?$/);
      if (kv) {
        current.keys[kv[1]] = kv[2];
        continue;
      }
      const fn = body.match(/^"([^"]+)":\s*\(/);
      if (fn) {
        current.functions.push(fn[1]);
        /*
         * A function-valued bundle entry cannot be matched by exact value:
         * `decrease` is `` (args)=>`کاهش ${args.fieldLabel}` `` and what lands in
         * the markup is «کاهش تعداد». Without this the numberfield keys — the
         * ones the most-corrected component in the set depends on — would score
         * as unused. So the template's LITERAL segments are kept and matched in
         * order, which is enough to identify the key and honest about being a
         * heuristic (`match: "template"` on every hit).
         */
        const tpl = body.match(/`([^`]*)`/);
        if (tpl) {
          const segments = tpl[1].split(/\$\{[^}]*\}/).map((s) => s.trim()).filter((s) => s.length >= 2);
          if (segments.join("").length >= 3) current.templates.push({ key: fn[1], segments });
        }
      }
    }
    patches.push({ file: `patches/${file}`, bytes: statSync(join(dir, file)).size, fa_bundles_added: Object.keys(bundles).length, intl_registries_touched: registriesTouched, bundles });
    for (const [bundleName, b] of Object.entries(bundles)) {
      for (const [k, v] of Object.entries(b.keys)) if (v) index.byValue.set(v, { patch: `patches/${file}`, bundle: bundleName, key: k, match: "exact" });
      for (const t of b.templates) index.templates.push({ patch: `patches/${file}`, bundle: bundleName, key: t.key, segments: t.segments, match: "template" });
    }
  }
  return { patches, index };
}

/** English side of the same keys, read from the INSTALLED package so a leak
 *  that survives the patch can be named rather than merely counted. */
function loadEnglishForPatchedKeys(patchInfo, index) {
  const racMain = uiRequire.resolve("react-aria-components");
  let root = dirname(racMain);
  while (root !== dirname(root) && basename(root) !== "react-aria-components") root = dirname(root);
  const reactAriaDir = join(dirname(root), "react-aria");
  let found = 0;
  for (const p of patchInfo) {
    for (const [bundleName, b] of Object.entries(p.bundles)) {
      const base = p.file.includes("react-aria-components") ? join(root, "dist/private/intl") : join(reactAriaDir, "dist/private/intl");
      const file = bundleName === "(root)" ? join(base, "en-US.mjs") : join(base, bundleName, "en-US.mjs");
      if (!existsSync(file)) continue;
      const src = readFileSync(file, "utf8");
      for (const key of Object.keys(b.keys)) {
        const m = src.match(new RegExp(`"${key}":\\s*\`([^\`]*)\``));
        if (m && m[1]) {
          index.byEnglish.set(m[1], { patch: p.file, bundle: bundleName, key, english: m[1], persian: b.keys[key] });
          found += 1;
        }
      }
    }
  }
  return { english_values_resolved: found, react_aria_dir_found: existsSync(reactAriaDir) };
}

// ── run ─────────────────────────────────────────────────────────────────────
const { patches, index: patchIndex } = readPatches();
const englishInfo = loadEnglishForPatchedKeys(patches, patchIndex);

const sources = {};
for (const name of COMPONENTS) {
  const files = [META[name].file, META[name].variantsFile].filter(Boolean);
  const texts = files.map((f) => readFileSync(join(REPO, f), "utf8"));
  sources[name] = {
    files,
    combined: texts.join("\n"),
    code: texts.flatMap((t) => classify(t).filter((l) => l.kind === "code").map((l) => l.text)).join("\n"),
  };
}
const ledger = JSON.parse(readFileSync(LEDGER_FILE, "utf8"));

log("rendering …");
const renders = {};
for (const name of COMPONENTS) renders[name] = renderAll(name);

/**
 * Provenance. `experiments/baseline-rac/` holds snapshots of these thirteen
 * files; a later phase overwrites `packages/ui/src` and the snapshots become the
 * only record of what was measured here. Checking them now means a re-run after
 * the source has moved reports the drift instead of quietly measuring something
 * else under the same filename.
 */
function provenance(name) {
  const src = join(REPO, META[name].file);
  const snap = join(REPO, "experiments/baseline-rac", basename(META[name].file));
  const srcText = readFileSync(src, "utf8");
  if (!existsSync(snap)) return { snapshot: null, identical: null, sha256: sha256(srcText) };
  const snapText = readFileSync(snap, "utf8");
  return {
    snapshot: `experiments/baseline-rac/${basename(META[name].file)}`,
    identical: snapText === srcText,
    sha256: sha256(srcText),
    snapshot_sha256: sha256(snapText),
  };
}

const components = {};
for (const name of COMPONENTS) {
  const r = renders[name];
  const leaks = englishLeaks(name, r, patchIndex);
  const wrapped = Object.entries(leaks).filter(([s]) => s !== "bare").map(([, v]) => v);
  components[name] = {
    file: META[name].file,
    variants_file: META[name].variantsFile,
    provenance: provenance(name),
    opens: META[name].opens,
    open_state_reached: META[name].opens ? r.open.html !== r.closed.html : null,
    rendered_bytes: Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v.html.length])),
    ssr_defects: ssrDefects(name, r),
    english_leaks: leaks,
    /*
     * The headline pair for requirement 2, wrapped arm only, worst state.
     * `bare_library` beside it is the same count for the library composed
     * directly — the denominator without which "0" says nothing.
     */
    english_summary: {
      with_patches: Math.max(...wrapped.map((s) => s.english_with_patches)),
      without_patches: Math.max(...wrapped.map((s) => s.english_without_patches)),
      without_required_props: Math.max(...wrapped.map((s) => s.english_without_required_props)),
      controls_that_would_be_unnamed_without_required_props: Math.max(...wrapped.map((s) => s.controls_that_would_be_unnamed_without_required_props)),
      bare_library: leaks.bare ? leaks.bare.english_with_patches : null,
      bare_library_without_patches: leaks.bare ? leaks.bare.english_without_patches : null,
      bare_library_strings: leaks.bare ? leaks.bare.attributed["english-upstream"].concat(leaks.bare.attributed["english-despite-patch"]) : null,
      bare_library_supplied_by_patch: leaks.bare ? leaks.bare.attributed["lumo-patch"] : null,
    },
    rtl: rtlDeltas(name, r, sources),
    wrapper_lines: wrapperLines(name, ledger, sources),
  };
}

if (!SKIP_BUNDLE) {
  log("bundling for size …");
  for (const name of COMPONENTS) {
    components[name].bundle = await measureBundle(name, [join(REPO, META[name].file)]);
  }
  var allBundle = await measureBundle("all", COMPONENTS.map((n) => join(REPO, META[n].file)));
  /*
   * The standalone figure is what one component costs a project that imports
   * nothing else, and it is dominated by the slice of the library that comes
   * with it. The MARGINAL figure is what it costs a project that already has the
   * other twelve — measured, not estimated, by bundling the other twelve and
   * subtracting. Both are reported because a design system is bought whole and
   * used piecemeal, and the two numbers differ by an order of magnitude.
   */
  for (const name of COMPONENTS) {
    const others = COMPONENTS.filter((n) => n !== name).map((n) => join(REPO, META[n].file));
    const without = await measureBundle(`without-${name}`, others);
    components[name].bundle.marginal_gzip_bytes = allBundle.gzip_bytes - without.gzip_bytes;
    components[name].bundle.marginal_minified_bytes = allBundle.minified_bytes - without.minified_bytes;
    components[name].bundle.marginal_modules = allBundle.modules - without.modules;
  }
} else {
  for (const name of COMPONENTS) components[name].bundle = { skipped: true };
}

let tests = { ran: false, reason: "--skip-tests" };
const mapping = testMapping();
if (!SKIP_TESTS) tests = runTests(mapping);
for (const name of COMPONENTS) {
  components[name].conformance = tests.ran ? tests.per_component[name] : { ...mapping[name], skipped: true };
}

/*
 * Which of the thirteen actually render a patched string.
 *
 * Two answers, and they differ, which is the point. The WRAPPED arm shows what
 * the patch is doing for the shipped components; the BARE arm shows what it
 * would be doing if the required props were not already closing the same leaks.
 * A component that appears only in the bare list is one where the patch is a
 * backstop rather than the fix.
 */
for (const name of COMPONENTS) {
  const collect = (states, mode) => {
    const deps = new Map();
    for (const state of states) {
      for (const rec of components[name].english_leaks[state]?.records ?? []) {
        if (mode === "patch" && rec.attribution === "lumo-patch") {
          deps.set(`${rec.source.bundle}.${rec.source.key}`, { ...rec.source, value: rec.value, state, where: rec.where, attr: rec.attr });
        }
        /*
         * A prop-supplied string is only credited to the patch when the prop
         * exists BECAUSE upstream would otherwise be English there. Without that
         * guard the match is a coincidence detector: the patched `tag` bundle
         * spells `removeButtonLabel` «حذف», which is also the perfectly ordinary
         * word an IconButton's `label` uses, and Button and Tooltip both showed
         * up as depending on a tag bundle they never touch.
         */
        if (mode === "prop" && rec.attribution === "lumo-prop" && rec.also_supplied_by_patch && rec.absent_would_be === "english") {
          deps.set(`${rec.also_supplied_by_patch.bundle}.${rec.also_supplied_by_patch.key}`, { ...rec.also_supplied_by_patch, value: rec.value, state, where: rec.where, attr: rec.attr, upstream_english: rec.upstream_english });
        }
      }
    }
    return [...deps.values()];
  };
  // Strings the patch actually put in the served bytes …
  components[name].depends_on_patched_strings = collect(["closed", "open"], "patch");
  // … and the keys a required prop is already closing, which the patch would
  // have closed too. The second list is why the first can be empty.
  components[name].patched_keys_also_closed_by_a_required_prop = collect(["closed", "open"], "prop");
  components[name].bare_library_uses_patched_strings = collect(["bare"], "patch");
}

const totals = {
  components: COMPONENTS.length,
  ssr_defects: COMPONENTS.reduce((a, n) => a + components[n].ssr_defects.total_worst_case, 0),
  dangling_idrefs: COMPONENTS.reduce((a, n) => a + components[n].ssr_defects.worst_case.dangling_idrefs, 0),
  unnamed_controls: COMPONENTS.reduce((a, n) => a + components[n].ssr_defects.worst_case.unnamed_controls, 0),
  latin_aria: COMPONENTS.reduce((a, n) => a + components[n].ssr_defects.worst_case.latin_aria, 0),
  latin_digits: COMPONENTS.reduce((a, n) => a + components[n].ssr_defects.worst_case.latin_digits, 0),
  bare_library_ssr_defects: COMPONENTS.reduce((a, n) => a + (components[n].ssr_defects.bare_library_total ?? 0), 0),
  english_with_patches: COMPONENTS.reduce((a, n) => a + components[n].english_summary.with_patches, 0),
  english_without_patches: COMPONENTS.reduce((a, n) => a + components[n].english_summary.without_patches, 0),
  english_without_required_props: COMPONENTS.reduce((a, n) => a + components[n].english_summary.without_required_props, 0),
  controls_that_would_be_unnamed_without_required_props: COMPONENTS.reduce((a, n) => a + components[n].english_summary.controls_that_would_be_unnamed_without_required_props, 0),
  bare_library_english: COMPONENTS.reduce((a, n) => a + (components[n].english_summary.bare_library ?? 0), 0),
  bare_library_english_without_patches: COMPONENTS.reduce((a, n) => a + (components[n].english_summary.bare_library_without_patches ?? 0), 0),
  wc_l: COMPONENTS.reduce((a, n) => a + components[n].wrapper_lines.wc_l, 0),
  code_lines: COMPONENTS.reduce((a, n) => a + components[n].wrapper_lines.code, 0),
  styling_lines: COMPONENTS.reduce((a, n) => a + components[n].wrapper_lines.split.styling, 0),
  correcting_lines: COMPONENTS.reduce((a, n) => a + components[n].wrapper_lines.split.correcting, 0),
  class_deltas_under_direction: COMPONENTS.reduce((a, n) => a + components[n].rtl.class_deltas, 0),
  style_deltas_under_direction: COMPONENTS.reduce((a, n) => a + components[n].rtl.style_deltas, 0),
  gzip_bytes_sum: SKIP_BUNDLE ? null : COMPONENTS.reduce((a, n) => a + components[n].bundle.gzip_bytes, 0),
  gzip_bytes_all_thirteen_together: SKIP_BUNDLE ? null : allBundle.gzip_bytes,
  gzip_bytes_marginal_sum: SKIP_BUNDLE ? null : COMPONENTS.reduce((a, n) => a + components[n].bundle.marginal_gzip_bytes, 0),
};

/*
 * NON-VACUITY. Every rule in this repo carries a poison fixture because "a rule
 * that has never been observed failing is decoration"; the same applies to a
 * harness. This records which gate rules were observed FIRING somewhere in this
 * run — wrapped arm or bare arm — so a green column can be told apart from a
 * column that was never exercised by this corpus.
 */
const rulesObserved = new Set();
for (const name of COMPONENTS) {
  for (const state of Object.values(components[name].ssr_defects.by_state)) {
    for (const v of state.violations) rulesObserved.add(v.rule);
  }
}
const selfCheck = {
  poison_specimen: {
    fired: poisonFired,
    violations: poisonViolations.length,
    note: "A planted-defect render graded by the same code path as every component. All five rules must fire or the run aborts — which is what makes a zero elsewhere in this file mean 'looked for and absent' rather than 'never looked'.",
  },
  gate_rules_available: gate.RULES.map((r) => r.id),
  gate_rules_observed_firing: [...rulesObserved].sort(),
  gate_rules_never_observed: gate.RULES.map((r) => r.id).filter((id) => !rulesObserved.has(id)),
  note: "`gate_rules_never_observed` scored zero on every arm of the real corpus. The poison specimen proves the harness CAN trip each of them, so those zeros are genuine absences rather than unexercised checks. `lang-dir` will always sit here: the harness writes the document wrapper itself, so a component cannot fail it.",
  ledger_entries_validated: COMPONENTS.reduce((a, n) => a + components[n].wrapper_lines.correcting_lines.length, 0),
  specimens_rendered: COMPONENTS.length * 5,
};

const out = {
  impl: IMPL,
  generated_at: new Date().toISOString(),
  harness: {
    entry: "experiments/harness/measure.mjs",
    specimens: `experiments/harness/specimens.${IMPL}.tsx`,
    ledger: `experiments/harness/ledger.${IMPL}.json`,
    rerun: `node experiments/harness/measure.mjs --impl ${IMPL}`,
    node: process.version,
    bundler: `rolldown@${ROLLDOWN_VERSION} (via vite; esbuild is not installed in this workspace)`,
    gate: "packages/gate/src/index.ts — the shipped RULES, imported, not reimplemented",
    render: "renderToStaticMarkup under LumoProvider → I18nProvider locale=fa-IR-u-ca-persian-nu-arabext",
    parser: "linkedom, the same parser packages/gate uses",
  },
  versions: Object.fromEntries(
    ["react", "react-dom", "react-aria-components", "@internationalized/date", "class-variance-authority"].map((id) => [id, pkgVersion(id)]),
  ),
  limitations: [
    "SERVED BYTES ONLY. Every overlay in React Aria portals its content and renders null on the server, so a forced-open Select/Menu/Dialog/Popover/Tooltip contributes its TRIGGER's changed attributes and nothing else. Defects inside an overlay's own subtree (RAC's two unreachable DismissButtons, the listbox's aria-label) are NOT in these counts. packages/ui/src/overlays.test.tsx is the tier that covers them and it pins those numbers already.",
    "ComboBox cannot be forced open at all: react-stately 3.49.0 nulls isOpen/defaultOpen inside useComboBoxState (dist/private/combobox/useComboBoxState.mjs:121). Its open render is byte-identical to its closed one and `open_state_reached` says so.",
    "The RTL pass changes the LOCALE, which is the only lever that reaches a server render. A `dir` attribute cannot change server output — it is resolved by CSS at paint time — so a zero class-delta is the expected result for logical utilities, not a null result. The static census is the other half of that answer.",
    "The English-leak attribution is a string match against the patch's own fa-IR values and the specimen's declared props. A Persian string that a component hardcodes and that also happens to be a patched value would be misattributed; none of the thirteen do this, and `supplied` is checked first so props always win.",
    "Utility censuses are string matches over source, not a CSS parse.",
    "Five of the thirteen — switch, checkbox, popover, tooltip, number-field — have NO test file that imports them, so `conformance.per_component` reports 0/0 for them and the only thing that would run against a replacement is coverage.test.ts, which checks wiring and English defaults rather than behaviour. `components_without_a_behavioural_suite` names them. Treating their green as a passed conformance bar would be the vacuous pass this project's gate rules exist to prevent.",
  ],
  self_check: selfCheck,
  totals,
  patches: {
    files: patches.map((p) => ({ file: p.file, bytes: p.bytes, fa_bundles_added: p.fa_bundles_added, intl_registries_touched: p.intl_registries_touched, bundles: Object.fromEntries(Object.entries(p.bundles).map(([n, b]) => [n, { keys: Object.keys(b.keys).length, constant_keys: b.keys, function_keys: b.functions }])) })),
    total_fa_bundles: patches.reduce((a, p) => a + p.fa_bundles_added, 0),
    total_bytes: patches.reduce((a, p) => a + p.bytes, 0),
    english_lookup: englishInfo,
    components_depending_on_a_patched_string: COMPONENTS.filter((n) => components[n].depends_on_patched_strings.length > 0),
    components_where_a_required_prop_already_closes_a_patched_key: COMPONENTS.filter((n) => components[n].patched_keys_also_closed_by_a_required_prop.length > 0),
    components_where_the_BARE_library_renders_a_patched_string: COMPONENTS.filter((n) => components[n].bare_library_uses_patched_strings.length > 0),
    keys_reached_by_this_thirteen: [...new Set(COMPONENTS.flatMap((n) => [...components[n].depends_on_patched_strings, ...components[n].patched_keys_also_closed_by_a_required_prop, ...components[n].bare_library_uses_patched_strings].map((d) => `${d.bundle}.${d.key}`)))].sort(),
  },
  conformance: tests,
  bundle_all_thirteen_together: SKIP_BUNDLE ? null : allBundle,
  components,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
log(`wrote ${OUT.replace(REPO + "/", "")}`);
console.log(
  JSON.stringify(
    {
      impl: IMPL,
      ssr_defects: totals.ssr_defects,
      english_with_patches: totals.english_with_patches,
      english_without_patches: totals.english_without_patches,
      correcting_lines: totals.correcting_lines,
      styling_lines: totals.styling_lines,
      class_deltas_under_direction: totals.class_deltas_under_direction,
      style_deltas_under_direction: totals.style_deltas_under_direction,
      tests: tests.ran ? tests.union : "skipped",
      gzip_bytes_sum: totals.gzip_bytes_sum,
    },
    null,
    2,
  ),
);
