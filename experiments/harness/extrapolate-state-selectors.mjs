/**
 * Extrapolates the migration's state-selector cost from the thirteen measured
 * components to all 77 in the registry.
 *
 *   node experiments/harness/extrapolate-state-selectors.mjs
 *
 * ── WHY THIS IS NOT `mean × 77` ─────────────────────────────────────────────
 *
 * The thirteen were chosen as the core INTERACTIVE set, so they are the
 * state-heaviest components in the library by construction. Multiplying their
 * mean by 77 would price a `badge` and a `spinner` at five selector rewrites
 * each, which would be a fabricated number wearing a decimal point.
 *
 * Instead this script MEASURES the state-selector population of all 77 — the
 * same census, same regexes, run over every registry `ui` item — and applies
 * only the one thing the thirteen actually establish: the RATE at which a
 * React Aria state selector survives the engine swap unchanged. Presentational
 * components fall out at zero on their own, because they have no state
 * selectors to count.
 *
 * The thirteen are read from the React Aria BASELINE, not from their rewritten
 * form, so the population is uniformly pre-migration.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = resolve(ROOT, "packages/ui/src");
const BASELINE = resolve(ROOT, "experiments/baseline-rac");

const STATE_CONDITION =
  /^(group-|peer-)?(data-(hovered|selected|pressed|checked|unchecked|indeterminate|focused|focus-visible|focus-within|invalid|disabled|entering|exiting|starting-style|ending-style|open|closed|popup-open|highlighted|dragging|placeholder|active|filled|readonly|required)|hover|active|focus|focus-visible|focus-within)(\/[a-z-]+)?$/;
const ARBITRARY_STATE = /^(group-|peer-)?data-\[(placement|side|align)=/;

/**
 * Comments and imports NAME a selector or a constant without USING it. Both are
 * removed before anything is counted — a header paragraph explaining why the
 * focus ring moved must not be scored as a second focus ring.
 */
function strip(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|\s)\/\/[^\n]*/g, " ")
    .replace(/^import[\s\S]*?from\s+"[^"]*";\s*$/gm, " ");
}

function classTokens(stripped) {
  const tokens = [];
  for (const match of stripped.matchAll(/"([^"\\]*)"/g)) {
    for (const token of match[1].split(/\s+/)) if (token.length > 0) tokens.push(token);
  }
  return tokens;
}

function isState(token) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const ch of token) {
    if (ch === "[") depth += 1;
    else if (ch === "]") depth -= 1;
    if (ch === ":" && depth === 0) {
      parts.push(current);
      current = "";
    } else current += ch;
  }
  return parts.some((p) => STATE_CONDITION.test(p) || ARBITRARY_STATE.test(p));
}

/** The shared focus-ring constant, counted as the two utilities it expands to. */
const FOCUS_RING_UTILITIES = 2;

function countFor(name) {
  // The thirteen rebuilt components are read from the React Aria baseline so
  // the whole population is pre-migration.
  const measured = existsSync(resolve(BASELINE, `${name}.tsx`));
  const dir = measured ? BASELINE : SRC;
  const files = [`${name}.tsx`, `${name}.variants.ts`]
    .map((f) => resolve(measured && f.endsWith(".variants.ts") ? resolve(ROOT, "experiments/baseline-variants") : dir, f))
    .filter((f) => existsSync(f));
  if (files.length === 0) return null;
  let count = 0;
  for (const file of files) {
    const source = strip(readFileSync(file, "utf8"));
    count += classTokens(source).filter(isState).length;
    // `FOCUS_RING` is a constant, so the census cannot see it as a literal.
    const uses = (source.match(/\bFOCUS_RING(_SELF)?\b/g) ?? []).length;
    count += uses * FOCUS_RING_UTILITIES;
  }
  return { measured, files: files.length, state_utilities: count };
}

const registry = JSON.parse(readFileSync(resolve(ROOT, "registry.json"), "utf8"));
const uiItems = registry.items.filter((i) => (i.type ?? "").includes("ui")).map((i) => i.name);

const perComponent = {};
const missing = [];
for (const name of uiItems) {
  const result = countFor(name);
  if (result === null) missing.push(name);
  else perComponent[name] = result;
}

const MEASURED_THIRTEEN = [
  "button", "switch", "checkbox", "toggle", "select", "menu", "combobox",
  "dialog", "popover", "tooltip", "tabs", "slider", "number-field",
];

// The rate, from the measured thirteen only.
const measuredBaseline = MEASURED_THIRTEEN.reduce((sum, n) => sum + (perComponent[n]?.state_utilities ?? 0), 0);
const MEASURED_REWRITTEN = 67; // count-state-selectors.mjs, run on the same tree
const rate = MEASURED_REWRITTEN / measuredBaseline;

const populationTotal = Object.values(perComponent).reduce((s, c) => s + c.state_utilities, 0);
const remainderTotal = populationTotal - measuredBaseline;

const withState = Object.entries(perComponent).filter(([, c]) => c.state_utilities > 0);
const zeroState = Object.entries(perComponent).filter(([, c]) => c.state_utilities === 0);

/**
 * The date family is broken out rather than folded in. Base UI ships no
 * calendar, date-field or time-field primitive at all — verified in
 * base-vega-coverage.json, `the_date_family.base_ui_proper_primitives: 0` — so
 * its selectors are not MIGRATED, they are written from scratch alongside an
 * interaction layer that does not exist yet. Counting them as renames would
 * quietly price the library's largest unknown at a few find-and-replaces.
 */
const DATE_FAMILY = [
  "calendar", "range-calendar", "date-field", "date-picker", "date-range-picker", "time-field",
];
const dateFamilyTotal = DATE_FAMILY.reduce((s, n) => s + (perComponent[n]?.state_utilities ?? 0), 0);
const remainderExDates = remainderTotal - dateFamilyTotal;

console.log(
  JSON.stringify(
    {
      registry_ui_items: uiItems.length,
      resolved: Object.keys(perComponent).length,
      unresolved: missing,
      components_with_at_least_one_state_selector: withState.length,
      components_with_none: zeroState.length,
      state_utilities_all_77: populationTotal,
      state_utilities_measured_13: measuredBaseline,
      state_utilities_remaining_64: remainderTotal,
      measured_rewrites_13: MEASURED_REWRITTEN,
      survival_rate_unchanged: Number((1 - rate).toFixed(4)),
      rewrite_rate: Number(rate.toFixed(4)),
      projected_rewrites_remaining_64: Math.round(remainderTotal * rate),
      projected_rewrites_all_77: MEASURED_REWRITTEN + Math.round(remainderTotal * rate),
      date_family: {
        components: DATE_FAMILY,
        state_utilities: dateFamilyTotal,
        note:
          "Base UI ships zero primitives for this family. These selectors are " +
          "not migrated, they are authored fresh next to an interaction layer " +
          "nobody has built. Excluded from the migratable figure below.",
      },
      state_utilities_remaining_64_excluding_dates: remainderExDates,
      projected_rewrites_all_77_excluding_dates:
        MEASURED_REWRITTEN + Math.round(remainderExDates * rate),
      per_component: Object.fromEntries(
        Object.entries(perComponent).sort((a, b) => b[1].state_utilities - a[1].state_utilities),
      ),
    },
    null,
    2,
  ),
);
