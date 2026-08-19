#!/usr/bin/env node

/**
 * MUTATION FLOOR FOR THE MOBILE LIBRARY — the Dart counterpart of
 * `mutate-components.mjs`.
 *
 * `packages/mobile` had 669 tests and no anti-vacuity guard of any kind, which
 * means nothing proved those tests assert anything. A semantics test that pumps a
 * widget and checks nothing still passes, and passes forever.
 *
 * So: break one real promise in a family's source — a name dropped, a state
 * flipped, a number left unformatted — and require that family's own test to
 * FAIL. A mutant that survives is a test that was not watching. Source is
 * restored byte-for-byte in a finally block.
 *
 * Not in `verify`: one `flutter test` process per family. CI runs it as its own
 * job, beside `mutation:components`. Locally: `pnpm run mutation:mobile`.
 *
 * Every family is EITHER in `BEHAVIOURAL` with an operator that breaks a promise
 * on one line, OR in `PENDING` because nobody has written one yet. A family in
 * neither throws before the campaign starts, so a family added tomorrow cannot
 * fall silently into "untested". `PENDING` is a ratchet: it may only shrink.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { findFlutter, flutterRunner } from "./lib/flutter.mjs";

const repository = resolve(import.meta.dirname, "..");
const packageDirectory = join(repository, "packages/mobile");
const sourceDirectory = join(packageDirectory, "lib/src");

/** Family files — the generated token file is not a family. */
// Generated files and the style registry are INFRASTRUCTURE, not families —
// styles has its own generator gate and delivery test, and counting it here
// silently raised PENDING above its floor (the 18 Aug blind pass caught the
// campaign refusing to start because of exactly that).
const INFRASTRUCTURE = new Set(["tokens.g.dart", "styles.dart", "styles.g.dart"]);
const families = readdirSync(sourceDirectory)
  .filter((file) => file.endsWith(".dart") && !INFRASTRUCTURE.has(file))
  .sort();

/**
 * One operator per family: [why it matters, the exact source to find, what to
 * put there instead]. The `find` string must occur EXACTLY ONCE in the file —
 * checked before anything runs, so an ambiguous operator is a startup error and
 * never a silently-mutated wrong line.
 *
 * @type {Readonly<Record<string, readonly [string, string, string]>>}
 */
const BEHAVIOURAL = Object.freeze({
  "button.dart": ["drop the icon button's caller-authored name", "label: label,", "label: '',"],
  "switch.dart": ["report the switch as the opposite state", "toggled: isSelected,", "toggled: !isSelected,"],
  "checkbox.dart": [
    "report the checkbox as the opposite state",
    "checked: widget.isIndeterminate ? false : selected,",
    "checked: !selected,",
  ],
  "avatar.dart": ["paint the status dot without saying what it means", "label: statusLabel,", "label: '',"],
  "badge.dart": ["drop the badge's name", "label: label,", "label: '',"],
  "breadcrumbs.dart": ["drop the trail's name", "label: widget.label,", "label: '',"],
  "progress.dart": ["stop announcing progress as it changes", "liveRegion: true,", "liveRegion: false,"],
  "rating.dart": ["report every star as unselected", "checked: v.round() == position,", "checked: false,"],
  "steps.dart": [
    "print the step number as a raw Latin integer",
    "Text(formatNumber(index + 1, scope.locale, grouping: false)",
    "Text('${index + 1}'",
  ],
  "tabs.dart": ["drop the tab list's name", "label: widget.label,", "label: '',"],
  "toast.dart": ["drop the toast dismiss button's name", "label: toast.closeLabel,", "label: '',"],
  "jalali.dart": [
    "shift the Jalali epoch by a year — the calendar is the library's reason to exist",
    "final gy = jy + 621;",
    "final gy = jy + 622;",
  ],
  "format.dart": [
    "format numbers in the root locale, so Persian digits come out Latin",
    "NumberFormat.decimalPattern(formatLocale(locale))",
    "NumberFormat.decimalPattern('en')",
  ],
});

/**
 * Families with no operator yet. A ratchet, not a resting place: every entry is
 * a family whose tests are currently unproved against vacuity.
 * @type {readonly string[]}
 */
const PENDING = Object.freeze(families.filter((file) => !(file in BEHAVIOURAL)));

/** The most families allowed to be unproved. Measured, and may only fall. */
const PENDING_FLOOR = 63;

const unknown = families.filter((file) => !(file in BEHAVIOURAL) && !PENDING.includes(file));
if (unknown.length > 0) {
  throw new Error(`no mutation operator and no PENDING entry for: ${unknown.join(", ")}`);
}
if (PENDING.length > PENDING_FLOOR) {
  console.error(`  mutation:mobile: ${PENDING.length} families have no operator, above the floor of ${PENDING_FLOOR}.`);
  console.error("  Add an operator to BEHAVIOURAL for the new family, or raise the floor and say why.");
  process.exit(1);
}

/**
 * Where a family's oracle is NOT `test/<family>_test.dart`. `format.dart` has
 * no file of its own — its digit contract is asserted in the barrel test.
 * @type {Readonly<Record<string, string>>}
 */
const ORACLE = Object.freeze({
  "format.dart": "lumo_ui_mobile_test.dart",
});

// Validate every operator against the real source BEFORE mutating anything.
/** @type {string[]} */
const invalid = [];
for (const [file, [, find]] of Object.entries(BEHAVIOURAL)) {
  const path = join(sourceDirectory, file);
  if (!families.includes(file)) {
    invalid.push(`${file}: no such family`);
    continue;
  }
  const occurrences = readFileSync(path, "utf8").split(find).length - 1;
  if (occurrences !== 1) invalid.push(`${file}: "${find}" occurs ${String(occurrences)} time(s), expected exactly 1`);
  // The oracle file must EXIST before anything mutates: `flutter test` exits
  // nonzero on a missing file, and "nonzero = killed" would certify the mutant
  // on a typo. The 18 Aug review named this class; format.dart proved it.
  const oracle = ORACLE[file] ?? `${file.replace(/\.dart$/, "")}_test.dart`;
  if (!existsSync(join(packageDirectory, "test", oracle))) {
    invalid.push(`${file}: oracle test/${oracle} does not exist — a missing file would count as a kill`);
  }
}
if (invalid.length > 0) {
  console.error("  mutation:mobile: operators do not match the source:");
  for (const line of invalid) console.error(`    ${line}`);
  process.exit(1);
}

const sdk = findFlutter();
if (!sdk) {
  console.error("  mutation:mobile: no Flutter SDK found. Install it, or skip this job.");
  process.exit(1);
}
const run = flutterRunner(sdk, packageDirectory);

// THE CLEAN BASELINE. The oracle below reads "nonzero exit = killed", so
// without this, a pre-broken harness (missing package config, failing test,
// no pub get in CI) would falsely certify every mutant as killed. The blind
// pass of 18 Aug proved the hole; this closes it: the un-mutated suite must
// pass first, with pub get allowed, or the campaign refuses to certify.
console.log("  mutation:mobile: clean baseline (un-mutated suite must pass first)…");
if (run(["test", "--reporter", "failures-only"]) !== 0) {
  console.error("  mutation:mobile: the UN-MUTATED suite fails — a kill verdict would be meaningless. Fix the baseline first.");
  process.exit(1);
}

/** @type {Array<{ family: string; operator: string; status: "killed" | "survived" | "unobserved" }>} */
const results = [];
const entries = Object.entries(BEHAVIOURAL);
console.log(`  mutation:mobile: ${String(entries.length)} operator(s) over ${String(families.length)} family(ies)`);

for (const [file, [why, find, replace]] of entries) {
  const path = join(sourceDirectory, file);
  const testPath = join("test", ORACLE[file] ?? `${file.replace(/\.dart$/, "")}_test.dart`);
  const original = readFileSync(path, "utf8");
  let status = /** @type {"killed" | "survived" | "unobserved"} */ ("unobserved");
  try {
    writeFileSync(path, original.replace(find, replace));
    // The oracle is the family's OWN test file: a mutant killed by some other
    // family's test would say nothing about this one.
    status = run(["test", "--no-pub", "--reporter", "failures-only", testPath]) !== 0 ? "killed" : "survived";
  } finally {
    writeFileSync(path, original);
  }
  results.push({ family: file, operator: why, status });
  console.log(`    ${status === "killed" ? "killed  " : "SURVIVED"} ${file} — ${why}`);
}

const survived = results.filter((result) => result.status === "survived");
console.log(
  `  mutation:mobile: ${String(results.length - survived.length)}/${String(results.length)} killed; ` +
    `${String(PENDING.length)} family(ies) still have no operator (floor ${String(PENDING_FLOOR)})`,
);
if (survived.length > 0) {
  console.error("  mutation:mobile: these mutants survived — the family's test was not watching:");
  for (const result of survived) console.error(`    ${result.family} — ${result.operator}`);
  process.exit(1);
}
