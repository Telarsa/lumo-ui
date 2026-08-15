import ts from "typescript";

/**
 * The source with every comment blanked to spaces (newlines kept, so line
 * numbers survive). Token-stream based: a regex stripper once mistook the
 * `"/*"` accept-pattern string literal in `file-upload.tsx` for a comment.
 */
export function code(source: string): string {
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
