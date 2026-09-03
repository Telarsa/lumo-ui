/**
 * `lumo fix` — the two mechanical corrections every Persian catalogue needs,
 * as a tool instead of a throwaway script.
 *
 * Both existed as one-off Python on the day one production catalogue was first
 * graded: 8,807 ZWNJ breaks and 1,262 lines of digits, across 111 files. The
 * next consumer would have written them again. A correction the gate demands from every
 * consumer belongs beside the gate.
 *
 * DRY RUN BY DEFAULT. Nothing is written without `--write`, because the first
 * digit pass broke a build: it rewrote numeric literals inside MDX expressions
 * (`left: 84` became `left: ۸۴`, which is not a JavaScript number) and
 * the site emitted zero pages. The converter is brace-aware now, and the dry run
 * exists so the diff is read before it is applied.
 *
 *   --zwnj     «می کند» → «می‌کند»: the gate's own pattern, exactly.
 *              Safe on any text file; the pattern needs Persian letters on both sides.
 *   --digits   Latin → native digits in PROSE: lines that carry native text,
 *              markdown table rows, and display strings inside MDX expressions.
 *              Never code, never inline code, never a link target, never a
 *              numeric literal. `--locale fa` (default) or `ar`.
 *
 * U+200C is written as an escape throughout this file, never as a literal: an
 * invisible character in source is exactly the kind of thing a reviewer cannot
 * see and a tool rightly refuses.
 */
import { readFileSync, statSync, readdirSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";

const ZWNJ = "‌";
/** @type {Record<string, string>} */
const DIGITS = { fa: "۰۱۲۳۴۵۶۷۸۹", ar: "٠١٢٣٤٥٦٧٨٩" };
/** Letters of the reader's script — digits deliberately excluded, they are the thing being replaced. */
const NATIVE_LETTER = /(?=\p{L})\p{Script=Arabic}/u;
/** The gate's own `persian-zwnj` pattern: a standalone می/نمی joined to the next word by a SPACE. */
const BROKEN_ZWNJ = /(?<![\p{L}\p{M}‌])(ن?می) (?=[؀-ۿ])/gu;

/*
 * `.html` is content too. A static legal page — privacy, cookies, terms — is
 * often a raw HTML file the site imports with `?raw`, and it carries exactly
 * the prose this tool exists for. The first version skipped the extension and
 * left 79 ZWNJ breaks on six pages while reporting "0 would change".
 */
const ZWNJ_EXT = new Set([".md", ".mdx", ".html", ".json", ".ts", ".tsx", ".astro", ".yaml", ".yml", ".txt"]);
const DIGIT_EXT = new Set([".md", ".mdx", ".html", ".json"]);
/** Element spans whose text is code or style, not prose — skipped whole, like a fence. */
const OPAQUE_OPEN = /<(script|style|pre|code)\b/i;
const OPAQUE_CLOSE = /<\/(script|style|pre|code)\s*>/i;
const SKIP = new Set(["node_modules", ".git", "dist", ".next", ".astro", "build", "out"]);

/** @param {string} text */
export function fixZwnj(text) {
  return text.replace(BROKEN_ZWNJ, (_, m) => `${m}${ZWNJ}`);
}

/** @param {string} locale @returns {string} */
function digitsOf(locale) {
  const set = DIGITS[locale];
  if (!set) throw new Error(`--locale must be one of ${Object.keys(DIGITS).join(", ")}`);
  return set;
}

/** Digits, and the locale's separators, in a run of PROSE. */
/** @param {string} t @param {string} set */
function convertText(t, set) {
  return t
    .replace(/(?<=\d),(?=\d\d\d)/g, "٬")
    .replace(/(?<=\d)\.(?=\d)/g, "٫")
    .replace(/[0-9]/g, (d) => set.charAt(Number(d)));
}

/** Prose on one line: skip inline code, link targets and tags. */
/** @param {string} line @param {string} set */
function convertProse(line, set) {
  return line
    .split(/(`[^`]*`|\]\([^)]*\)|<[^>]*>)/)
    .map((p) => (p.startsWith("`") || p.startsWith("](") || p.startsWith("<") ? p : convertText(p, set)))
    .join("");
}

/**
 * Markdown/MDX, line by line, tracking fenced code and MDX expression depth.
 * Inside an expression, only QUOTED STRINGS convert — they are display copy —
 * and the code around them stays ASCII.
 */
/** @param {string} source @param {string} [locale] */
export function fixDigitsMarkdown(source, locale = "fa") {
  const set = digitsOf(locale);
  /** @type {string[]} */
  const out = [];
  let inFence = false, depth = 0;
  /** @type {string | null} */
  let opaque = null;
  for (const line of source.split("\n")) {
    if (/^\s*```/.test(line)) { inFence = !inFence; out.push(line); continue; }
    if (inFence) { out.push(line); continue; }
    // an open <script>/<style>/<pre>/<code> that does not close on the same line
    if (opaque) { out.push(line); if (new RegExp(`</${opaque}\\s*>`, "i").test(line)) opaque = null; continue; }
    const op = OPAQUE_OPEN.exec(line);
    if (op && !OPAQUE_CLOSE.test(line.slice(op.index))) { out.push(line); opaque = (op[1] ?? "").toLowerCase(); continue; }
    const isTableRow = /^\s*\|/.test(line);
    if (depth === 0 && !line.includes("{")) {
      out.push(NATIVE_LETTER.test(line) || isTableRow ? convertProse(line, set) : line);
      continue;
    }
    let res = "", buf = "", d = depth;
    /** @type {string | null} */
    let quote = null;
    const flush = () => { const s = buf; buf = ""; return d === 0 && (NATIVE_LETTER.test(s) || isTableRow) ? convertProse(s, set) : s; };
    for (const ch of line) {
      if (quote) {
        buf += ch;
        if (ch === quote) { res += NATIVE_LETTER.test(buf) ? convertText(buf, set) : buf; buf = ""; quote = null; }
        continue;
      }
      if ((ch === "'" || ch === '"') && d > 0) { res += flush(); quote = ch; buf = ch; continue; }
      if (ch === "{") { res += flush(); d += 1; res += ch; continue; }
      if (ch === "}") { res += flush(); d -= 1; res += ch; continue; }
      buf += ch;
    }
    res += quote ? buf : flush();
    depth = Math.max(0, d);
    out.push(res);
  }
  return out.join("\n");
}

/**
 * JSON catalogues: every string VALUE that carries native letters, converted IN
 * PLACE in the source text. Keys, structure, order and formatting are untouched
 * byte for byte.
 *
 * NOT `JSON.parse` → `JSON.stringify`. The first version did that, and the dry
 * run on a real catalogue showed it rewriting German files where nothing needed
 * converting: JavaScript hoists integer-like keys ("0", "420") to the front of
 * every object, so the round trip reordered keys in every file it touched. A
 * codemod that changes what it was not asked to change is not a codemod.
 */
/** @param {string} source @param {string} [locale] */
export function fixDigitsJson(source, locale = "fa") {
  const set = digitsOf(locale);
  /** @param {string} v */
  const convertValue = (v) => v.split(/(<[^>]*>)/).map((p) => (p.startsWith("<") ? p : convertText(p, set))).join("");
  // Every JSON string literal, with what follows it: a `:` means it was a key.
  return source.replace(/"((?:[^"\\]|\\.)*)"(\s*:)?/g, (/** @type {string} */ whole, /** @type {string} */ body, /** @type {string | undefined} */ colon) => {
    if (colon !== undefined) return whole;           // a key
    if (!NATIVE_LETTER.test(body)) return whole;      // not native prose
    return `"${convertValue(body)}"`;
  });
}

/** @param {string[]} paths @returns {Generator<string>} */
function* files(paths) {
  for (const p of paths) {
    const st = statSync(p);
    if (st.isFile()) { yield p; continue; }
    for (const name of readdirSync(p)) {
      if (SKIP.has(name)) continue;
      yield* files([join(p, name)]);
    }
  }
}

/**
 * @param {{ zwnj: boolean, digits: boolean, locale: string, write: boolean, paths: string[] }} o
 */
export function runFix(o) {
  /** @type {{ files: number, changed: number, zwnj: number, digitLines: number, samples: string[] }} */
  const report = { files: 0, changed: 0, zwnj: 0, digitLines: 0, samples: [] };
  for (const f of files(o.paths)) {
    const ext = extname(f);
    if (!ZWNJ_EXT.has(ext)) continue;
    const before = readFileSync(f, "utf8");
    let after = before;
    report.files += 1;
    if (o.zwnj) {
      report.zwnj += (after.match(BROKEN_ZWNJ) ?? []).length;
      after = fixZwnj(after);
    }
    if (o.digits && DIGIT_EXT.has(ext)) {
      const next = ext === ".json" ? fixDigitsJson(after, o.locale) : fixDigitsMarkdown(after, o.locale);
      if (next !== after) {
        const a = after.split("\n"), b = next.split("\n");
        let lines = 0;
        for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
          if (a[i] !== b[i]) {
            lines += 1;
            if (report.samples.length < 5) report.samples.push(`${f}\n    - ${(a[i] ?? "").trim().slice(0, 70)}\n    + ${(b[i] ?? "").trim().slice(0, 70)}`);
          }
        }
        report.digitLines += lines;
        after = next;
      }
    }
    if (after !== before) {
      report.changed += 1;
      if (o.write) writeFileSync(f, after);
    }
  }
  return report;
}
