/*
 * `lumo fix` MUST NOT BREAK THE THING IT FIXES.
 *
 * The first digit pass ever run rewrote numeric literals inside MDX expressions
 * and the build emitted zero pages. These fixtures are that file, reduced, plus
 * every other place a digit must NOT change: a fence, inline code, a link, a
 * tag, a JSON key. And the places it MUST: prose with Persian letters, a table
 * row of nothing but figures, a display string inside an expression.
 *
 * U+200C appears only as an escape here, for the same reason as in fix.mjs.
 */
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const MOD = fileURLToPath(new URL("../../../scripts/lib/fix.mjs", import.meta.url));
const { fixZwnj, fixDigitsMarkdown, fixDigitsJson } = (await import(MOD)) as {
  fixZwnj: (s: string) => string;
  fixDigitsMarkdown: (s: string, l?: string) => string;
  fixDigitsJson: (s: string, l?: string) => string;
};
const Z = "‌";

describe("--zwnj", () => {
  it("joins the prefix with U+200C, and only the prefix", () => {
    expect(fixZwnj("این کار می شود و نمی کند")).toBe(`این کار می${Z}شود و نمی${Z}کند`);
  });
  it("leaves an already-joined word alone", () => {
    expect(fixZwnj(`می${Z}افتد`)).toBe(`می${Z}افتد`);
  });
  it("is the gate's own pattern: the month May before a year also joins, as the gate would flag it", () => {
    // The gate cannot tell «می ۲۰۲۴» (May) from a prefix and reports it; the
    // fix mirrors the gate rather than out-guessing it. A real May date is a
    // native-calendar finding to begin with — under Jalali it does not occur.
    expect(fixZwnj("۱ می ۲۰۲۴")).toBe(`۱ می${Z}۲۰۲۴`);
  });
});

describe("--digits on markdown", () => {
  it("converts prose that carries Persian letters, with the locale's separators", () => {
    expect(fixDigitsMarkdown("حدود 2,800 کیلومتر و 15.9 درجه")).toBe("حدود ۲٬۸۰۰ کیلومتر و ۱۵٫۹ درجه");
  });
  it("converts a table row of nothing but figures — it is content", () => {
    expect(fixDigitsMarkdown("| 1 | 970.87 | 1,030.00 |")).toBe("| ۱ | ۹۷۰٫۸۷ | ۱٬۰۳۰٫۰۰ |");
  });
  it("leaves a line with no Persian alone — an id, an untranslated string, frontmatter", () => {
    expect(fixDigitsMarkdown("updated: 2026-08-31\nid: tool-42")).toBe("updated: 2026-08-31\nid: tool-42");
  });
  it("never touches a fence, inline code, a link target or a tag", () => {
    const src = "```js\nconst n = 42;\n```\nقیمت `42` ریال [اینجا](/x/42) <a href=\"/p/42\">۴۲</a> است 42";
    expect(fixDigitsMarkdown(src)).toBe("```js\nconst n = 42;\n```\nقیمت `42` ریال [اینجا](/x/42) <a href=\"/p/42\">۴۲</a> است ۴۲");
  });
  it("THE BUG: inside an MDX expression, strings convert and numeric literals do not", () => {
    const src = [
      "<Compare",
      "  right={{ label: 'قیمت با حاشیه 40 درصد' }}",
      "  rows={[",
      "    { label: 'سود', left: 24, right: 40, precision: 2 },",
      "    { label: 'حاشیه', left: 28.57, right: 40, format: 'percent' },",
      "  ]}",
      "/>",
    ].join("\n");
    const out = fixDigitsMarkdown(src);
    expect(out).toContain("'قیمت با حاشیه ۴۰ درصد'");
    expect(out).toContain("left: 24, right: 40, precision: 2");
    expect(out).toContain("left: 28.57, right: 40, format: 'percent'");
  });
  it("supports Arabic-Indic digits for ar", () => {
    expect(fixDigitsMarkdown("نحو 25 عاماً", "ar")).toBe("نحو ٢٥ عاماً");
  });
});

describe("--digits on html content files", () => {
  it("converts the prose of a raw legal page and leaves script, style and attributes alone", () => {
    // One consumer imports content/pages/fa/*.html with `?raw`; the first version
    // skipped the extension and reported "0 would change" over 79 breaks.
    const src = [
      '<h1 class="p-2">سیاست کوکی‌ها</h1>',
      "<p>ما 12 کوکی برای 30 روز نگه می داریم.</p>",
      "<script>",
      "  const days = 30;",
      "</script>",
      "<style>.x { width: 12px }</style>",
      "<pre>",
      "  ۲ نمونه: 12",
      "</pre>",
      '<a href="/fa/page/2">صفحهٔ 2</a>',
    ].join("\n");
    const out = fixDigitsMarkdown(src);
    expect(out).toContain("ما ۱۲ کوکی برای ۳۰ روز نگه می داریم.");
    expect(out).toContain("const days = 30;");
    expect(out).toContain(".x { width: 12px }");
    expect(out).toContain("  ۲ نمونه: 12");
    expect(out).toContain('href="/fa/page/2">صفحهٔ ۲</a>');
    expect(out).toContain('class="p-2"');
  });
});

describe("--digits on json", () => {
  it("is BYTE-FOR-BYTE a no-op on a file with nothing to convert — even with integer-like keys", () => {
    // The first version parsed and re-serialised, and JavaScript hoists "0"
    // and "420" to the front of an object: every German catalogue "changed".
    const src = '{\n  "auto": "Wählen Sie",\n  "420": "4:2:0 – halbe",\n  "-0.75": "0,75 kg"\n}\n';
    expect(fixDigitsJson(src)).toBe(src);
  });
  it("never converts a KEY, even a native one", () => {
    const src = '{ "۱۲ ماه": "12 ماه", "12 months": "12 months" }';
    expect(fixDigitsJson(src)).toBe('{ "۱۲ ماه": "۱۲ ماه", "12 months": "12 months" }');
  });
  it("preserves escapes and formatting around a converted value", () => {
    const src = '{\n\t"a": "گفت: \\"12\\" بار",\n\t"b":   "x"\n}';
    expect(fixDigitsJson(src)).toBe('{\n\t"a": "گفت: \\"۱۲\\" بار",\n\t"b":   "x"\n}');
  });
  it("converts native-bearing values only, keeps keys, ids and markup", () => {
    const src = '{\n  "a": "۲ روز",\n  "b": "حدود 80 درصد",\n  "c": "Soorstraße 86, Berlin",\n  "d": "<b>1,100</b> هکتار",\n  "n": 42\n}\n';
    expect(fixDigitsJson(src)).toBe('{\n  "a": "۲ روز",\n  "b": "حدود ۸۰ درصد",\n  "c": "Soorstraße 86, Berlin",\n  "d": "<b>۱٬۱۰۰</b> هکتار",\n  "n": 42\n}\n');
  });
});
