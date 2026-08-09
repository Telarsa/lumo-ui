import { parseHTML } from "linkedom";
import { RULES, type Doc, type Rule, type Violation } from "./rules.ts";

export * from "./rules.ts";

/** Locales this gate knows how to grade, and the direction each must declare. */
const KNOWN: Record<string, "rtl" | "ltr"> = { "fa-IR": "rtl", "en-US": "ltr" };

/**
 * Derives the expected locale from a route path.
 *
 * Deliberately strict: an unrecognised first segment is an ERROR, not a skip.
 * Silently skipping unknown routes is how a gate ends up grading three pages out
 * of fifty-five and reporting green.
 */
export function localeForPath(path: string): { locale: string; direction: "rtl" | "ltr" } {
  const seg = path.replace(/^\.?\//, "").split("/")[0] ?? "";
  const match = Object.keys(KNOWN).find((l) => l === seg || l.split("-")[0] === seg);
  if (!match) {
    throw new Error(
      `Cannot derive a locale from route ${JSON.stringify(path)}. Every page must live ` +
        `under a locale segment (${Object.keys(KNOWN).join(", ")}) so the gate can grade it. ` +
        `An ungraded page is an unprotected page.`,
    );
  }
  return { locale: match, direction: KNOWN[match]! };
}

export function gradeHtml(path: string, html: string, rules: Rule[] = RULES): Violation[] {
  const { locale, direction } = localeForPath(path);
  const { document } = parseHTML(html);
  const doc: Doc = { path, document: document as unknown as Document, locale, direction };
  return rules.flatMap((r) => r.run(doc));
}

export function format(violations: Violation[]): string {
  if (!violations.length) return "  lumo-gate — clean";
  const byRule = new Map<string, Violation[]>();
  for (const v of violations) byRule.set(v.rule, [...(byRule.get(v.rule) ?? []), v]);
  const lines: string[] = [""];
  for (const [rule, vs] of byRule) {
    const why = RULES.find((r) => r.id === rule)?.because ?? "";
    lines.push(`  ${rule} — ${vs.length} violation${vs.length === 1 ? "" : "s"}`);
    if (why) lines.push(`    ${why.replace(/\s+/g, " ")}`);
    for (const v of vs.slice(0, 8)) {
      lines.push(`      ${v.path}: ${v.detail}`);
      if (v.snippet) lines.push(`        ${v.snippet}`);
    }
    if (vs.length > 8) lines.push(`      … and ${vs.length - 8} more`);
    lines.push("");
  }
  return lines.join("\n");
}
