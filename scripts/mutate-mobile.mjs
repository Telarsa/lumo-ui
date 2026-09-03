#!/usr/bin/env node

/**
 * MUTATION FLOOR FOR THE MOBILE LIBRARY.
 *
 * `packages/mobile` had 669 tests and no anti-vacuity guard of any kind, which
 * means nothing proved those tests assert anything. A test that pumps something
 * and checks nothing still passes, and passes forever.
 *
 * So: break one real promise in the source — a direction flipped, an epoch
 * shifted, a number left unformatted — and require the package's own tests to
 * FAIL. A mutant that survives is a test that was not watching. Source is
 * restored byte-for-byte in a finally block.
 *
 * SINCE §54 this covers the whole package rather than a sample of it — though
 * it did not until §58, because the scan was not recursive and the GRADER sat
 * in a subdirectory. The roster is gone; FIVE files can carry a promise, all
 * five have an
 * operator, and `PENDING_FLOOR` is 0. It earned its keep immediately: the
 * `scope.dart` operator flips `directionOf` from RTL to LTR, and every test in
 * the package passed — the library's first documented claim had no test in the
 * library. `test/scope_test.dart` is that mutant's headstone.
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
import { basename, join, resolve } from "node:path";

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
// RECURSIVE. It was not, and `lib/src/testing/semantics.dart` — 346 lines, the
// mobile counterpart of lumo-gate, the file that reads every consumer's screens
// — sat in the one subdirectory and was therefore neither BEHAVIOURAL nor
// PENDING. The startup guard below promises that "a family added tomorrow
// cannot fall silently into untested"; it could not see this one at all, and
// eleven hand-written operators against it found EIGHT survivors. Matching
// INFRASTRUCTURE on the basename keeps the generated files excluded either way.
const families = readdirSync(sourceDirectory, { recursive: true })
  .map(String)
  .filter((file) => file.endsWith(".dart") && !INFRASTRUCTURE.has(basename(file)))
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
  "jalali.dart": [
    "shift the Jalali epoch by a year — the calendar is the library's reason to exist",
    "final gy = jy + 621;",
    "final gy = jy + 622;",
  ],
  "format.dart": [
    "format numbers in English, so Persian digits come out Latin",
    "formatLocale(locale),",
    "'en',",
  ],
  "scope.dart": [
    "mirror every layout the wrong way — the library's first claim, in one line",
    // The ternary spans two lines since 0.4.10; the operator must match the
    // bytes in the file, or the floor reports "occurs 0 time(s)" and fails.
    "? TextDirection.rtl\n      : TextDirection.ltr",
    "? TextDirection.ltr\n      : TextDirection.rtl",
  ],
  "latn.dart": [
    "rename the island, so a consumer's declaration silently stops being honoured",
    "const kLumoLatnIsland = 'lumo-latn';",
    "const kLumoLatnIsland = 'lumo-latn-renamed';",
  ],
  "testing/semantics.dart": [
    "name every control by any labelled ancestor, not one drawn at the same rect",
    "namedByAncestor: named.any((a) => a.rect == globalRect),",
    "namedByAncestor: named.isNotEmpty,",
  ],
});

/**
 * Families with no operator yet. A ratchet, not a resting place: every entry is
 * a family whose tests are currently unproved against vacuity.
 * @type {readonly string[]}
 */
const PENDING = Object.freeze(families.filter((file) => !(file in BEHAVIOURAL)));

/** The most families allowed to be unproved. Measured, and may only fall. */
// Was 63, when there were 76 families. Every survivor now has an operator,
// including the grader itself, which the non-recursive scan used to hide.
const PENDING_FLOOR = 0;

const stale = Object.keys(BEHAVIOURAL).filter((file) => !families.includes(file));
if (stale.length > 0) {
  // §54 deleted 73 family files. An operator left pointing at one of them reads
  // as coverage and delivers none, which is the same failure the PENDING
  // ratchet exists to prevent — just spelled the other way round.
  console.error(`  mutation:mobile: ${String(stale.length)} operator(s) name a file that is gone: ${stale.join(", ")}`);
  process.exit(1);
}

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
 * Where a family's oracle is NOT `test/<family>_test.dart`.
 *
 * Empty since §54: every family has a `test/<family>_test.dart`.
 *
 * `format.dart` used to point at the barrel test, which retired with the widget
 * roster; it has its own file now. `latn.dart` nearly got an override pointing
 * at `readme_usage_test.dart`, on the reasoning that a constant has nothing to
 * assert — and that would have certified an unkillable mutant, because renaming
 * the constant renames its readers too. `latn_test.dart` pins the VALUE against
 * the web's `data-lumo-latn`, which is the half that cannot rename itself.
 * @type {Readonly<Record<string, string>>}
 */
const ORACLE = Object.freeze({
  // The grader lives one directory down; its tests do not.
  "testing/semantics.dart": "semantics_grader_test.dart",
});

/**
 * The source with every comment blanked to spaces of the same length, so
 * offsets still line up with the original.
 *
 * An operator is only meaningful against CODE. `format.dart`'s operator matched
 * a string inside a doc comment that quoted the very line it was meant to
 * change; the campaign dutifully mutated the comment, the tests dutifully
 * passed, and the report said "the family's test was not watching" — which was
 * false, and is the worst thing a verification tool can say. An unkillable
 * mutant must be a startup error, not a finding.
 *
 * @param {string} source
 * @returns {string}
 */
function codeOnly(source) {
  const blank = (/** @type {string} */ text) => text.replace(/[^\n]/g, " ");
  return source
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/\/\/[^\n]*/g, blank);
}

// Validate every operator against the real source BEFORE mutating anything.
/** @type {string[]} */
const invalid = [];
for (const [file, [, find]] of Object.entries(BEHAVIOURAL)) {
  const path = join(sourceDirectory, file);
  if (!families.includes(file)) {
    invalid.push(`${file}: no such family`);
    continue;
  }
  const source = readFileSync(path, "utf8");
  const code = codeOnly(source);
  const occurrences = code.split(find).length - 1;
  if (occurrences !== 1) {
    const inComments = source.split(find).length - 1 - occurrences;
    invalid.push(
      `${file}: "${find}" occurs ${String(occurrences)} time(s) in code, expected exactly 1` +
        (inComments > 0 ? ` (${String(inComments)} more in comments, which cannot be mutated)` : ""),
    );
  }
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
    // Splice at the offset found in the COMMENT-BLANKED source, so the edit
    // lands on the code even when the same text also appears in a comment
    // above it. `String.replace` takes the first occurrence, which is the
    // comment more often than one would guess.
    const at = codeOnly(original).indexOf(find);
    writeFileSync(path, original.slice(0, at) + replace + original.slice(at + find.length));
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
