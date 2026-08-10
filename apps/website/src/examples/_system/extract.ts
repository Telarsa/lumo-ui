/**
 * Pure text mechanics for the example system: slicing an example's source out
 * of its file, and checking composition trees against the library's real
 * exports. No React, no fs — everything here takes strings, so the whole
 * failure surface is unit-testable without a build (see
 * `lib/examples-loader.test.ts`, which demonstrates every throw below).
 *
 * Every function that can fail THROWS, with the file and the rule in the
 * message. These run inside the page's server render, so a throw is a failed
 * `next build` — never a page with a missing code panel or a lying tree.
 */

/**
 * Slices the source of one example's render out of the file text.
 *
 * The convention it enforces is the contract in `_system/types.ts`:
 * `id: "<id>"` written literally exactly once, then a `render:` whose value
 * is recoverable from the text. Two value shapes are accepted:
 *
 *   1. CANONICAL — a bare identifier naming a top-level `function` declared in
 *      the same file. The whole declaration is the shown source, which is why
 *      the contract recommends it: the reader gets a complete, nameable
 *      function.
 *   2. An inline expression (an arrow, typically). The expression's own text,
 *      recovered by bracket matching, is the shown source. Supported so a
 *      file written against the loose early brief still builds; new files
 *      should prefer shape 1.
 *
 * Each step that cannot proceed THROWS naming the step, because "source
 * unavailable" with no reason is the failure mode this replaces.
 */
export function extractExampleSource(fileText: string, file: string, id: string): string {
  const needle = `id: "${id}"`;
  const at = fileText.indexOf(needle);
  if (at === -1) {
    throw new Error(
      `[examples] ${file}: example "${id}" — the literal ${needle} does not appear ` +
        `in the file. The contract requires each example's id written exactly that ` +
        `way so its source can be sliced; see examples/_system/types.ts.`,
    );
  }
  if (fileText.indexOf(needle, at + needle.length) !== -1) {
    throw new Error(
      `[examples] ${file}: example "${id}" — the literal ${needle} appears more ` +
        `than once, so the extractor cannot tell which entry is which. Ids must be ` +
        `unique and written once.`,
    );
  }

  // Bind `render:` to THIS entry: search only up to the next `id: "` (the next
  // example) so a missing render cannot silently borrow the neighbour's.
  const nextEntry = fileText.indexOf(`id: "`, at + needle.length);
  const entryEnd = nextEntry === -1 ? fileText.length : nextEntry;
  const renderAt = fileText.indexOf("render:", at);
  if (renderAt === -1 || renderAt >= entryEnd) {
    throw new Error(
      `[examples] ${file}: example "${id}" — no render: property in its entry. ` +
        `Write render: <Name> referencing a top-level function <Name>(l: Locale) ` +
        `declared in this file.`,
    );
  }

  /*
   * Recover the render VALUE's text: from after the colon to the first comma
   * or closing brace at bracket depth zero. Textual matching, naive on
   * purpose: render values hold JSX and locale lookups, not bracket-bearing
   * string literals — the contract (types.ts, rule 4) makes that a stated
   * requirement rather than a hope, and imbalance is a loud failure below.
   */
  let start = renderAt + "render:".length;
  while (start < entryEnd && /\s/.test(fileText[start] ?? "")) start++;
  let depth = 0;
  let end = -1;
  for (let i = start; i < entryEnd; i++) {
    const ch = fileText[i];
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    else if (ch === ")" || ch === "]" || ch === "}") {
      if (depth === 0) {
        end = i; // The enclosing object literal's own close: value ends here.
        break;
      }
      depth--;
    } else if (ch === "," && depth === 0) {
      end = i;
      break;
    }
  }
  if (end === -1) {
    throw new Error(
      `[examples] ${file}: example "${id}" — brackets never balance after ` +
        `render:. A bracket inside a string literal breaks the slicer; keep ` +
        `brackets out of literals in render values (contract rule 4).`,
    );
  }
  const value = fileText.slice(start, end).trim();

  /*
   * The silent-truncation guard the review demanded. The depth counter tracks
   * (), [] and {} — not <>, because `x < y` makes angle brackets uncountable —
   * so an inline value like `render: fn<A, B>(l)` used to slice at the comma
   * inside the GENERIC and ship half an expression as the example's "source",
   * silently. The rule now: an inline value must either be a bare identifier
   * (the named-function convention) or be WRAPPED in parentheses, so the
   * wrapping paren is the unambiguous bracket. Anything else throws with the
   * fix in the message.
   */
  if (value === "") {
    // The no-value case keeps its own, older error — reaching the ambiguity
    // guard with nothing to disambiguate produced a misleading message.
    throw new Error(
      `[examples] ${file}: example "${id}" — render has no value.`,
    );
  }
  const isBareIdentifier = /^[A-Za-z_$][\w$]*$/.test(value);
  if (!isBareIdentifier) {
    /**
     * Returns the index just past the balanced bracket group opening at `i`,
     * or -1. Only (), {} and [] count — the same alphabet the slicer used.
     */
    const groupEnd = (text: string, i: number): number => {
      const open = text[i];
      if (open !== "(" && open !== "{" && open !== "[") return -1;
      let d = 0;
      for (let j = i; j < text.length; j++) {
        const c = text[j];
        if (c === "(" || c === "{" || c === "[") d++;
        else if (c === ")" || c === "}" || c === "]") {
          d--;
          if (d === 0) return j + 1;
        }
      }
      return -1;
    };
    // Two unambiguous inline shapes are admitted:
    //   a. `( … )` — the whole value is one wrapped group;
    //   b. `(params) => ( … )` / `(params) => { … }` — an arrow whose BODY is
    //      one bracketed group ending exactly at the value's end. Ubiquitous
    //      as `render: (l) => ( <JSX/> )`, and safe: the body group's close is
    //      the end, so no invisible comma can have truncated it.
    // Anything else — `fn<A, B>(l)`, `(l) => x ? a : b` — throws.
    const wholeGroup = groupEnd(value, 0) === value.length;
    const arrowBody = (() => {
      const params = groupEnd(value, 0);
      if (params === -1) return false;
      const m = /^\s*=>\s*/.exec(value.slice(params));
      if (!m) return false;
      const bodyStart = params + m[0].length;
      return groupEnd(value, bodyStart) === value.length;
    })();
    if (!wholeGroup && !arrowBody) {
      throw new Error(
        `[examples] ${file}: example "${id}" — render is an inline expression ` +
          `whose end cannot be determined unambiguously (commas inside generics ` +
          `or comparisons are invisible to the slicer). Either name it as a ` +
          `top-level function (the convention) or wrap the whole value in ` +
          `parentheses: render: ((l) => …).`,
      );
    }
  }
  // Shape 2: an inline expression. Its own text is the shown source.
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value)) return value;

  // Shape 1: a named top-level function — slice the whole declaration.
  const name = value;
  const decl = new RegExp(`^(?:export )?function ${name}\\(`, "m").exec(fileText);
  if (!decl) {
    throw new Error(
      `[examples] ${file}: example "${id}" — render names "${name}" but no ` +
        `top-level "function ${name}(" declaration exists in the file. The shown ` +
        `source is that declaration; declare it or fix the reference.`,
    );
  }
  const open = fileText.indexOf("{", decl.index);
  if (open === -1) {
    throw new Error(
      `[examples] ${file}: example "${id}" — "function ${name}(" has no opening ` +
        `brace after it. The declaration is malformed.`,
    );
  }
  let braceDepth = 0;
  for (let i = open; i < fileText.length; i++) {
    const ch = fileText[i];
    if (ch === "{") braceDepth++;
    else if (ch === "}") {
      braceDepth--;
      if (braceDepth === 0) return fileText.slice(decl.index, i + 1);
    }
  }
  throw new Error(
    `[examples] ${file}: example "${id}" — braces never balance after ` +
      `"function ${name}(". A brace inside a string literal breaks the slicer; ` +
      `keep braces out of literals in render functions (contract rule 4).`,
  );
}

export interface ExportedNames {
  /** Every value export across the whole barrel. */
  all: ReadonlySet<string>;
  /** Value exports keyed by the module specifier they come from, e.g. "select.tsx". */
  byModule: ReadonlyMap<string, readonly string[]>;
}

/**
 * Parses the value exports out of `packages/ui/src/index.ts` SOURCE TEXT.
 *
 * Text, not a runtime import, deliberately: importing the barrel would pull
 * every client component into this server-only path just to learn their names,
 * and the barrel is exactly the flat re-export file this regex shape covers.
 * `export type { ... }` blocks do not match (the "type" keyword sits between
 * "export" and the brace), which is the point — the tree and the parts table
 * name PARTS, and a part is a value.
 */
export function parseExportedNames(indexSource: string): ExportedNames {
  const all = new Set<string>();
  const byModule = new Map<string, string[]>();
  const statement = /export\s*\{([^}]*)\}\s*from\s*["']\.\/([^"']+)["']/g;
  for (let m = statement.exec(indexSource); m !== null; m = statement.exec(indexSource)) {
    const body = m[1] ?? "";
    const moduleName = m[2] ?? "";
    const names: string[] = [];
    for (const raw of body.split(",")) {
      const entry = raw.trim();
      if (entry === "" || entry.startsWith("type ")) continue;
      const asMatch = /\bas\s+([A-Za-z_$][A-Za-z0-9_$]*)$/.exec(entry);
      const name = asMatch?.[1] ?? entry;
      names.push(name);
      all.add(name);
    }
    const existing = byModule.get(moduleName) ?? [];
    byModule.set(moduleName, [...existing, ...names]);
  }
  return { all, byModule };
}

/** Every capitalised JSX tag named in a composition tree, deduplicated. */
export function compositionTags(composition: string): string[] {
  const tags = new Set<string>();
  const tag = /<([A-Z][A-Za-z0-9]*)/g;
  for (let m = tag.exec(composition); m !== null; m = tag.exec(composition)) {
    if (m[1] !== undefined) tags.add(m[1]);
  }
  return [...tags];
}

/**
 * Fails the build when a composition tree or parts table names something the
 * library does not export. `where` names the offending field for the message.
 */
export function assertKnownParts(
  names: readonly string[],
  exported: ReadonlySet<string>,
  file: string,
  where: string,
): void {
  const unknown = names.filter((n) => !exported.has(n));
  if (unknown.length > 0) {
    throw new Error(
      `[examples] ${file}: ${where} names ${unknown.map((n) => `"${n}"`).join(", ")} ` +
        `but packages/ui/src/index.ts exports no such part. A tree that lies is ` +
        `worse than no tree — fix the name or export the part first.`,
    );
  }
}
