#!/usr/bin/env node
/**
 * gate:flutter-contract — the mobile counterpart of `gate:props`.
 *
 * `flutter analyze` grades Dart. `flutter test` grades behaviour. Neither can
 * see the three defects this library exists to prevent, because all three are
 * VALID Dart that compiles, analyses and passes a test written by the same
 * hand that introduced them:
 *
 *   english-default     an announced string with an English default value —
 *                       the defect the whole library is an argument against
 *                       (rule 1: every announced string is REQUIRED).
 *   english-literal     a user-facing string literal in Latin letters: a name,
 *                       hint or tooltip the consumer's locale never reaches.
 *   physical-direction  `left`/`right` where the inline axis was meant — the
 *                       silent RTL defect a screenshot cannot show (rule 2).
 *   material-english-route
 *                       a Material route helper (`showModalBottomSheet`,
 *                       `showMenu`, `showDialog`, `showDatePicker`,
 *                       `showTimePicker`) — each names its own route and
 *                       barrier from `MaterialLocalizations` («Dialog»,
 *                       «Dismiss»), English that no parameter of ours reaches.
 *                       Lumo ships its own routes for exactly this reason.
 *
 * Grading Dart source with regular expressions is crude, and this file says so
 * out loud: comments, doc comments and `assert(...)` messages are stripped
 * first (an assert talks to the developer, not the reader), string literals are
 * then read only in positions that reach a person. A line may opt out with
 *
 *     // lumo-gate-allow: <rule-id> — <a reason of at least 12 characters>
 *
 * which is the point: an exemption is a sentence someone signed, not a flag.
 *
 * Usage: `node scripts/flutter-contract-gate.mjs` grades `packages/mobile/lib`.
 *        `--self-test` grades `packages/mobile/gate_fixtures/` instead and
 *        requires every poison file to fail with the rule its header names —
 *        a rule that quietly stops biting is worse than no rule, because it is
 *        trusted.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const LIB = join(ROOT, "packages", "mobile", "lib");
const FIXTURES = join(ROOT, "packages", "mobile", "gate_fixtures");

/** Parameter names that name or describe something a person hears or reads. */
const ANNOUNCED = /^(.*Label|label|hint|message|description|placeholder|title|text|tooltip|semanticLabel|errorMessage|helperText)$/;

/** A run of Latin letters long enough to be a word rather than a code or tag. */
const LATIN_WORD = /[A-Za-z]{3,}/;

/**
 * Interpolations are CODE, not copy: `'${formatNumber(n, locale)}'` contains
 * Latin letters and no English. Strip `${…}` (balanced) and `$identifier`
 * before asking whether a literal contains words a reader would hear.
 */
function copyOf(/** @type {string} */ literal) {
  let out = "";
  for (let i = 0; i < literal.length; i++) {
    if (literal[i] === "\\") { i++; continue; }
    if (literal[i] !== "$") { out += literal[i]; continue; }
    if (literal[i + 1] === "{") {
      let depth = 0;
      let j = i + 1;
      for (; j < literal.length; j++) {
        if (literal[j] === "{") depth++;
        else if (literal[j] === "}") { depth--; if (depth === 0) break; }
      }
      i = j;
      continue;
    }
    let j = i + 1;
    while (j < literal.length && /[A-Za-z0-9_.]/.test(literal[j] ?? "")) j++;
    i = j - 1;
  }
  return out;
}

/** Named arguments whose value is spoken or shown verbatim. */
const USER_FACING_ARG =
  /\b(label|accessibilityLabel|semanticLabel|hint|message|tooltip|barrierLabel|placeholder|description|errorMessage|helperText|title|closeLabel|confirmLabel|cancelLabel|removeLabel|clearLabel|openLabel|dismissLabel|senderLabel|statusLabel|valueLabel|emptyLabel|overflowLabel|browseLabel|externalLabel|countryLabel|searchLabel|clearAllLabel|previousLabel|nextLabel|slideLabel|doneLabel|currentLabel|upcomingLabel|completedLabel|todayLabel|previousMonthLabel|nextMonthLabel|incrementLabel|decrementLabel|starLabel|cellLabel|maxFilesLabel|dateLabel|timeLabel)\s*:\s*(['"])((?:\\.|(?!\2)[^\\])*)\2/g;

/** `Text('…')` — the most direct way to put words on a screen. */
const TEXT_WIDGET = /\bText\(\s*(['"])((?:\\.|(?!\1)[^\\])*)\1/g;

/** A default value on a named parameter: `this.label = 'Close'`. */
const DEFAULTED_PARAM = /\bthis\.([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(['"])((?:\\.|(?!\2)[^\\])*)\2/g;
/** …and the plain form: `String label = 'Close'`. */
const DEFAULTED_TYPED = /\bString\??\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(['"])((?:\\.|(?!\2)[^\\])*)\2/g;

/** Physical geometry, where the logical form exists and was meant. */
const PHYSICAL = [
  [/\bEdgeInsets\.only\([^)]*\b(left|right)\s*:/g, "EdgeInsets.only(left:/right:) → EdgeInsetsDirectional.only(start:/end:)"],
  [/\bEdgeInsets\.fromLTRB\(/g, "EdgeInsets.fromLTRB → EdgeInsetsDirectional.fromSTEB"],
  [/\bAlignment\.(centerLeft|centerRight|topLeft|topRight|bottomLeft|bottomRight)\b/g, "Alignment.<physical> → AlignmentDirectional.<logical>"],
  [/\bPositioned\((?![^)]*\bdirectional\b)[^)]*\b(left|right)\s*:/g, "Positioned(left:/right:) → PositionedDirectional(start:/end:)"],
  [/\bTextAlign\.(left|right)\b/g, "TextAlign.left/right → TextAlign.start/end"],
  [/\bBorderRadius\.only\([^)]*\b(topLeft|topRight|bottomLeft|bottomRight)\s*:/g, "BorderRadius.only(<physical>) → BorderRadiusDirectional.only(<logical>)"],
  [/\bBorderRadius\.horizontal\(\s*(left|right)\s*:/g, "BorderRadius.horizontal(left:/right:) → BorderRadiusDirectional.horizontal(start:/end:)"],
];

/** Material route helpers that name themselves from `MaterialLocalizations`. */
const MATERIAL_ROUTES = /\bshow(ModalBottomSheet|Menu|Dialog|DatePicker|DateRangePicker|TimePicker|Search)\s*[(<]/g;

const RULES = ["english-default", "english-literal", "physical-direction", "material-english-route"];

/** Remove line and block comments, keeping newlines so line numbers survive. */
function stripComments(/** @type {string} */ src) {
  let out = "";
  let i = 0;
  let mode = "code"; // code | line | block | string
  let quote = "";
  while (i < src.length) {
    const c = src[i];
    const next = src[i + 1];
    if (mode === "code") {
      if (c === "/" && next === "/") { mode = "line"; out += "  "; i += 2; continue; }
      if (c === "/" && next === "*") { mode = "block"; out += "  "; i += 2; continue; }
      if (c === "'" || c === '"') { mode = "string"; quote = c; out += c; i++; continue; }
      out += c; i++; continue;
    }
    if (mode === "line") {
      if (c === "\n") { mode = "code"; out += c; } else out += " ";
      i++; continue;
    }
    if (mode === "block") {
      if (c === "*" && next === "/") { mode = "code"; out += "  "; i += 2; continue; }
      out += c === "\n" ? c : " "; i++; continue;
    }
    // inside a string literal — copy verbatim, honouring escapes
    if (c === "\\") { out += src.slice(i, i + 2); i += 2; continue; }
    if (c === quote) { mode = "code"; }
    out += c; i++;
  }
  return out;
}

/** Blank out `assert( … )` calls: their messages address the developer. */
function stripAsserts(/** @type {string} */ src) {
  let out = src;
  for (;;) {
    const at = out.indexOf("assert(");
    if (at < 0) return out;
    let depth = 0;
    let i = at + "assert".length;
    for (; i < out.length; i++) {
      if (out[i] === "(") depth++;
      else if (out[i] === ")") { depth--; if (depth === 0) { i++; break; } }
    }
    const blanked = out.slice(at, i).replace(/[^\n]/g, " ");
    out = out.slice(0, at) + blanked + out.slice(i);
  }
}

/** `// lumo-gate-allow: <rule> — <reason>` on the line or the line before it. */
function allowedAt(/** @type {string[]} */ rawLines, /** @type {number} */ lineNo, /** @type {string} */ rule) {
  const check = (/** @type {string | undefined} */ line) => {
    if (!line) return false;
    const m = /lumo-gate-allow:\s*([a-z-]+)\s*[—-]\s*(.+)$/.exec(line);
    return !!m && m[1] === rule && (m[2] ?? "").trim().length >= 12;
  };
  return check(rawLines[lineNo - 1]) || check(rawLines[lineNo - 2]);
}

/** @typedef {{ file: string; line: number; rule: string; detail: string }} Violation */

/** Grade one Dart source. @returns {Violation[]} */
export function gradeDart(/** @type {string} */ file, /** @type {string} */ source) {
  const rawLines = source.split("\n");
  const code = stripAsserts(stripComments(source));
  /** @type {Violation[]} */
  const found = [];
  const lineOf = (/** @type {number} */ index) => code.slice(0, index).split("\n").length;
  const add = (/** @type {string} */ rule, /** @type {number} */ index, /** @type {string} */ detail) => {
    const line = lineOf(index);
    if (allowedAt(rawLines, line, rule)) return;
    found.push({ file, line, rule, detail });
  };

  for (const re of [DEFAULTED_PARAM, DEFAULTED_TYPED]) {
    re.lastIndex = 0;
    for (let m; (m = re.exec(code)); ) {
      const [name, value] = [m[1] ?? "", m[3] ?? ""];
      if (ANNOUNCED.test(name) && LATIN_WORD.test(copyOf(value))) {
        add("english-default", m.index, `${name} defaults to "${value}" — an announced string is REQUIRED, never defaulted`);
      }
    }
  }

  USER_FACING_ARG.lastIndex = 0;
  for (let m; (m = USER_FACING_ARG.exec(code)); ) {
    const value = m[3] ?? "";
    if (LATIN_WORD.test(copyOf(value))) add("english-literal", m.index, `${(m[1] ?? "")}: "${value}" is a hard-coded Latin string a consumer's locale cannot reach`);
  }

  TEXT_WIDGET.lastIndex = 0;
  for (let m; (m = TEXT_WIDGET.exec(code)); ) {
    const value = m[2] ?? "";
    if (LATIN_WORD.test(copyOf(value))) add("english-literal", m.index, `Text("${value}") puts a hard-coded Latin string on the screen`);
  }

  MATERIAL_ROUTES.lastIndex = 0;
  for (let m; (m = MATERIAL_ROUTES.exec(code)); ) {
    add("material-english-route", m.index, `show${m[1]} names its route and barrier from MaterialLocalizations — use Lumo's own route (showLumoSheet / showLumoSheetRoute / showLumoPopover / showLumoDialog / LumoDateField / LumoTimeField)`);
  }

  for (const [re, detail] of PHYSICAL) {
    /** @type {RegExp} */ (re).lastIndex = 0;
    for (let m; (m = /** @type {RegExp} */ (re).exec(code)); ) add("physical-direction", m.index, String(detail));
  }

  return found;
}

function dartFilesIn(/** @type {string} */ dir) {
  /** @type {string[]} */
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...dartFilesIn(p));
    else if (name.endsWith(".dart")) out.push(p);
  }
  return out;
}

function grade(/** @type {string} */ dir) {
  /** @type {Violation[]} */
  const all = [];
  for (const file of dartFilesIn(dir)) {
    // The generated token file is not hand-written source; it is graded by gate:flutter-tokens.
    if (file.endsWith(".g.dart")) continue;
    all.push(...gradeDart(relative(ROOT, file), readFileSync(file, "utf8")));
  }
  return all;
}

const selfTest = process.argv.includes("--self-test");

if (selfTest) {
  // Every rule must reject its own poison. A rule with no fixture fails here
  // rather than shipping ungraded.
  const files = readdirSync(FIXTURES).filter((f) => f.endsWith(".bad.dart"));
  const covered = files.map((f) => f.replace(".bad.dart", "")).sort();
  /** @type {string[]} */
  const problems = [];
  if (JSON.stringify(covered) !== JSON.stringify([...RULES].sort())) {
    problems.push(`poison fixtures ${JSON.stringify(covered)} do not match the rules ${JSON.stringify([...RULES].sort())}`);
  }
  for (const f of files) {
    const rule = f.replace(".bad.dart", "");
    const v = gradeDart(f, readFileSync(join(FIXTURES, f), "utf8"));
    if (!v.some((x) => x.rule === rule)) problems.push(`${f}: rule "${rule}" did NOT fire on its poison — the rule has lost its teeth`);
  }
  // The good fixture must stay clean, or the gate is crying wolf.
  const good = readFileSync(join(FIXTURES, "good.dart"), "utf8");
  const noise = gradeDart("good.dart", good);
  if (noise.length) problems.push(`good.dart is clean Dart but the gate flagged it: ${noise.map((n) => `${n.rule} @${n.line}`).join(", ")}`);
  if (problems.length) {
    console.error("  flutter-contract self-test FAILED:");
    for (const p of problems) console.error(`    ${p}`);
    process.exit(1);
  }
  console.log(`  flutter-contract: self-test passed (${RULES.length} rules, each rejected by its poison; good.dart clean)`);
  process.exit(0);
}

const violations = grade(LIB);
if (violations.length) {
  console.error(`  flutter-contract: ${violations.length} violation(s) — the mobile contract is the spec, fix the source (or justify one line with "// lumo-gate-allow: <rule> — <reason>")`);
  for (const v of violations) console.error(`    ${v.file}:${v.line}  [${v.rule}]  ${v.detail}`);
  process.exit(1);
}
console.log(`  flutter-contract: ${RULES.join(", ")} — 0 violations across packages/mobile/lib`);
