/**
 * Counts the state-selector rewrites the Base UI migration required, per
 * component, by comparing the React Aria baseline against the rewritten file.
 *
 *   node experiments/harness/count-state-selectors.mjs
 *
 * A "state selector" is a Tailwind utility whose variant chain contains at
 * least one INTERACTION-STATE condition — an engine-published `data-*` state, or
 * one of the platform pseudo-classes the migration moves those states onto.
 * Structural variants (`sm:`, `motion-reduce:`, `placeholder:`, `[&_svg]:`) and
 * non-state data variants (`data-[orientation=…]`, the size variant) are not
 * counted: nothing about them changes with the engine.
 *
 * Both sides are read from source rather than from a render, because a render
 * shows only the variants that were exercised. Counting the source counts what
 * an engineer actually has to edit, which is the number this round is for.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** Variant conditions that depend on the interaction ENGINE. */
const STATE_CONDITION =
  /^(group-|peer-)?(data-(hovered|selected|pressed|checked|unchecked|indeterminate|focused|focus-visible|focus-within|invalid|disabled|entering|exiting|starting-style|ending-style|open|closed|popup-open|highlighted|dragging|placeholder|active|filled|readonly|required)|hover|active|focus|focus-visible|focus-within)(\/[a-z-]+)?$/;

/** The same, spelled as an arbitrary attribute selector. */
const ARBITRARY_STATE = /^(group-|peer-)?data-\[(placement|side|align)=/;

/**
 * Pull every whitespace-separated class token out of a file's double-quoted
 * string literals. Comment text is excluded so a header that NAMES a selector
 * is not counted as a use of it.
 */
function classTokens(source) {
  const withoutBlockComments = source.replace(/\/\*[\s\S]*?\*\//g, " ");
  const withoutLineComments = withoutBlockComments.replace(/(^|\s)\/\/[^\n]*/g, " ");
  const tokens = [];
  for (const match of withoutLineComments.matchAll(/"([^"\\]*)"/g)) {
    for (const token of match[1].split(/\s+/)) {
      if (token.length > 0) tokens.push(token);
    }
  }
  return tokens;
}

/** Does this utility's variant chain contain an interaction-state condition? */
function stateConditions(token) {
  // Split on ':' but not inside [...] — arbitrary values contain colons.
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
  // `current` is the utility itself; `parts` are the variants.
  return parts.filter((p) => STATE_CONDITION.test(p) || ARBITRARY_STATE.test(p));
}

/**
 * `FOCUS_RING` and `FOCUS_RING_SELF` are constants, not literals, so a census
 * that reads only string literals would score the WCAG 2.4.7 ring as zero
 * selectors in switch.tsx and checkbox.tsx — the two components where losing it
 * was the headline defect. Both are inlined before counting, from the form.tsx
 * of the matching arm.
 */
function inlineFocusRing(source, arm) {
  const formSource = readFileSync(
    arm === "baseline"
      ? resolve(ROOT, "experiments/baseline-variants/form.tsx")
      : resolve(ROOT, "packages/ui/src/form.tsx"),
    "utf8",
  );
  const literalOf = (name) => {
    const match = formSource.match(new RegExp(`export const ${name} =\\s*([\\s\\S]*?);`));
    if (!match) return "";
    return [...match[1].matchAll(/"([^"]*)"/g)].map((m) => m[1]).join(" ");
  };
  // Import statements name the constant without USING it. Left in, they double
  // the ring's count in switch.tsx and checkbox.tsx — an inflation of exactly
  // the number this round exists to publish, so it is stripped first.
  const withoutImports = source.replace(/^import[\s\S]*?from\s+"[^"]*";\s*$/gm, " ");
  return withoutImports
    .replace(/\bFOCUS_RING_SELF\b(?!\s*=)/g, `"${literalOf("FOCUS_RING_SELF")}"`)
    .replace(/\bFOCUS_RING\b(?!\s*=|_SELF)/g, `"${literalOf("FOCUS_RING")}"`);
}

function census(file, arm) {
  const source = inlineFocusRing(readFileSync(file, "utf8"), arm);
  const utilities = [];
  for (const token of classTokens(source)) {
    const conditions = stateConditions(token);
    if (conditions.length > 0) utilities.push({ token, conditions });
  }
  return utilities;
}

/**
 * The thirteen. `sources` is every file the component's state selectors live
 * in — the `.tsx`, plus its `*.variants.ts` where one exists. The baseline
 * shares the variants files (the experiment froze them byte-identical), so both
 * arms read the same second file and the diff is honest.
 */
const COMPONENTS = {
  button: { base: ["button.tsx"], now: ["button.tsx"], shared: ["button.variants.ts"] },
  toggle: { base: ["toggle.tsx"], now: ["toggle.tsx"], shared: ["toggle.variants.ts"] },
  switch: { base: ["switch.tsx"], now: ["switch.tsx"], shared: [] },
  checkbox: { base: ["checkbox.tsx"], now: ["checkbox.tsx"], shared: [] },
  tabs: { base: ["tabs.tsx"], now: ["tabs.tsx"], shared: [] },
  slider: { base: ["slider.tsx"], now: ["slider.tsx"], shared: [] },
  "number-field": { base: ["number-field.tsx"], now: ["number-field.tsx"], shared: [] },
  select: { base: ["select.tsx"], now: ["select.tsx"], shared: [] },
  menu: { base: ["menu.tsx"], now: ["menu.tsx"], shared: [] },
  combobox: { base: ["combobox.tsx"], now: ["combobox.tsx"], shared: [] },
  dialog: { base: ["dialog.tsx"], now: ["dialog.tsx"], shared: [] },
  popover: { base: ["popover.tsx"], now: ["popover.tsx"], shared: [] },
  tooltip: { base: ["tooltip.tsx"], now: ["tooltip.tsx"], shared: [] },
};

const report = {};
for (const [name, spec] of Object.entries(COMPONENTS)) {
  const baseline = [
    ...spec.base.flatMap((f) => census(resolve(ROOT, "experiments/baseline-rac", f), "baseline")),
    // The variants files were frozen for the experiment, so the CURRENT file is
    // not a valid baseline for them — read them from git's HEAD instead.
    ...spec.shared.flatMap((f) => census(resolve(ROOT, "experiments/baseline-variants", f), "baseline")),
  ];
  const now = [
    ...spec.now.flatMap((f) => census(resolve(ROOT, "packages/ui/src", f), "now")),
    ...spec.shared.flatMap((f) => census(resolve(ROOT, "packages/ui/src", f), "now")),
  ];
  const baseTokens = baseline.map((u) => u.token).sort();
  const nowTokens = now.map((u) => u.token).sort();
  const unchanged = [];
  const remaining = [...nowTokens];
  for (const t of baseTokens) {
    const i = remaining.indexOf(t);
    if (i >= 0) {
      unchanged.push(t);
      remaining.splice(i, 1);
    }
  }
  report[name] = {
    baseline_state_utilities: baseTokens.length,
    current_state_utilities: nowTokens.length,
    carried_over_unchanged: unchanged.length,
    rewritten: baseTokens.length - unchanged.length,
    added: remaining.length,
    baseline_tokens: baseTokens,
    current_tokens: nowTokens,
  };
}

const counts = Object.values(report).map((r) => r.rewritten);
const sorted = [...counts].sort((a, b) => a - b);
const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
const median =
  sorted.length % 2 === 1
    ? sorted[(sorted.length - 1) / 2]
    : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;

console.log(JSON.stringify({ per_component: report, total: counts.reduce((a, b) => a + b, 0), mean, median, max: Math.max(...counts), min: Math.min(...counts) }, null, 2));
