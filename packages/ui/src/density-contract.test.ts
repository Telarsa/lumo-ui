import { readFileSync, readdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const SRC = dirname(fileURLToPath(import.meta.url));

/**
 * Blanks comments while preserving offsets, using the TypeScript scanner so a
 * `"/*"` inside a string literal (file-upload's MIME matching) is not mistaken
 * for a comment opener — the regex this replaced swallowed 3 KB of JSX that way.
 */
function code(source: string): string {
  const out = source.split("");
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.JSX, source);
  let kind = scanner.scan();
  while (kind !== ts.SyntaxKind.EndOfFileToken) {
    if (kind === ts.SyntaxKind.SingleLineCommentTrivia || kind === ts.SyntaxKind.MultiLineCommentTrivia) {
      for (let i = scanner.getTokenStart(); i < scanner.getTokenEnd(); i++) {
        if (out[i] !== "\n") out[i] = " ";
      }
    }
    kind = scanner.scan();
  }
  return out.join("");
}

function hardcodedTallGeometry(file: string, source: string): string[] {
  const found = new Set<string>();
  for (const match of code(source).matchAll(/\b(?:min-h|h)-(10|11|12)\b/g)) {
    found.add(`${file}:h-${match[1]}`);
  }
  return [...found];
}

function oversizedIcons(file: string, source: string): string[] {
  const found = new Set<string>();
  const clean = code(source);
  const selector = /\[&[^\]]*svg[^\]]*\]:size-([5-9]|1[0-2])\b/g;
  const direct = /<[A-Z][\w.]*[^>\n]*className="[^"]*\bsize-([5-9]|1[0-2])\b[^>\n]*>/g;
  for (const pattern of [selector, direct]) {
    for (const match of clean.matchAll(pattern)) found.add(`${file}:size-${match[1]}`);
  }
  return [...found];
}

const sources = readdirSync(SRC)
  .filter(
    (file) => (file.endsWith(".tsx") || file.endsWith(".ts")) && !file.includes(".test."),
  )
  .map((file) => [file, readFileSync(`${SRC}/${file}`, "utf8")] as const);

describe("library-wide compact density contract", () => {
  it("finds a hard-coded tall control mutation", () => {
    expect(hardcodedTallGeometry("mutant.tsx", '<button className="h-10" />')).toEqual([
      "mutant.tsx:h-10",
    ]);
    expect(
      hardcodedTallGeometry("control.tsx", '<button className="h-control-md" />'),
    ).toEqual([]);
  });

  it("keeps hard-coded tall geometry limited to reviewed data-layout exceptions", () => {
    expect(sources.flatMap(([file, source]) => hardcodedTallGeometry(file, source)).sort()).toEqual([
      "event-calendar.variants.ts:h-12",
      "gantt.variants.ts:h-10",
    ]);
  });

  it("finds an oversized control-icon mutation", () => {
    expect(oversizedIcons("mutant.tsx", 'const c = "[&_svg]:size-5"')).toEqual([
      "mutant.tsx:size-5",
    ]);
    expect(oversizedIcons("control.tsx", 'const c = "[&_svg]:size-4"')).toEqual([]);
  });

  it("keeps icons above 16px limited to reviewed content and hierarchy roles", () => {
    expect(sources.flatMap(([file, source]) => oversizedIcons(file, source)).sort()).toEqual([
      "attachment.tsx:size-5",
      "empty-state.tsx:size-5",
      "file-upload.tsx:size-8",
      "rating.tsx:size-5",
      "rating.tsx:size-6",
    ]);
  });
});
