/**
 * THE GATE. Run this on a real device BEFORE any of `packages/native` is built.
 *
 * ═══ WHY THIS IS THE FIRST FILE AND NOT THE LAST ════════════════════════════
 *
 * Lumo's entire claim rests on three properties of a runtime's `Intl`:
 *
 *     direction   Intl.Locale("fa-IR").getTextInfo().direction === "rtl"
 *     digits      the -u-nu-arabext extension actually produces ۱۲۳
 *     calendar    the -u-ca-persian extension actually produces مرداد ۱۴۰۵
 *
 * On a browser these are Baseline and the library takes them for granted. On
 * React Native they are a QUESTION, and it is the question the whole spike
 * turns on rather than a detail to discover halfway through:
 *
 *   · Hermes shipped for years with `Intl` absent entirely.
 *   · Android builds can enable Intl backed by the platform's own ICU, whose
 *     completeness varies by OS version and by whether the app was built
 *     against a trimmed ICU.
 *   · iOS bridges to Foundation rather than to ICU proper.
 *   · A runtime can answer `Intl.DateTimeFormat` truthy and still IGNORE the
 *     `-u-ca-persian` extension, silently returning a GREGORIAN date. That is
 *     the failure this file exists to catch: it is not a crash, it is «۲۲
 *     ژوئیه ۲۰۲۴» for a day Iran calls «۱ مرداد ۱۴۰۳» — right script, right
 *     digits, wrong calendar, wrong year, and green on every other check.
 *
 * ═══ WHAT EACH OUTCOME MEANS FOR THE SPIKE ══════════════════════════════════
 *
 *   ALL THREE PASS      `@lumo-ui/core` runs unchanged on the device. The
 *                       shared-math plan holds: `formatNumber`, `formatDate`,
 *                       `direction` and `FORMAT_LOCALE` are the same code on
 *                       web and native, and only the COMPONENTS are
 *                       per-platform.
 *
 *   CALENDAR FAILS      The plan changes shape. `formatDate` needs a native
 *                       implementation backed by `@internationalized/date`,
 *                       which carries its own calendar arithmetic and has no
 *                       React and no Intl dependency for the conversion — it
 *                       is already a dependency here, and `calendar-datelib.ts`
 *                       already proves the pattern. Cost: real, bounded.
 *
 *   DIGITS FAIL         Worse, because digits are everywhere and `formatNumber`
 *                       is called per table cell. A hand-rolled numeral map is
 *                       possible (`input-otp.tsx` builds one by asking Intl,
 *                       which is exactly what would be unavailable) but a
 *                       hardcoded U+06F0–06F9 table contradicts the rule the
 *                       library states in `core/src/format.ts`. This outcome
 *                       needs a decision, not a workaround.
 *
 *   DIRECTION FAILS     Cheapest to fix and least likely: a two-entry table.
 *                       `direction()` asks the platform ONLY to avoid a stale
 *                       hand-kept map, and on a runtime that cannot answer, a
 *                       map is the honest fallback.
 *
 *   Intl ABSENT         The spike stops. A polyfill (`@formatjs/intl-*`) is
 *                       ~400KB before locale data and is the kind of dependency
 *                       whose bar is "owning it must fix a defect" — it would
 *                       need its own decision, recorded, before any component
 *                       work starts.
 *
 * ═══ HOW TO RUN IT ══════════════════════════════════════════════════════════
 *
 * It is deliberately dependency-free and framework-free — no React, no Expo, no
 * test runner — so it can be pasted into a bare RN app's entry file, run in a
 * Hermes REPL, or executed under Node for comparison:
 *
 *     node --experimental-strip-types packages/native/src/icu-probe.ts
 *
 * Node's output is the CONTROL, not the result. The result is the device's.
 */

export interface ProbeCheck {
  id: "intl-present" | "direction" | "digits" | "calendar" | "calendar-not-gregorian";
  pass: boolean;
  /** What the runtime actually produced. Recorded whether it passed or not. */
  actual: string;
  /** What a full-ICU runtime produces. */
  expected: string;
}

export interface ProbeResult {
  checks: ProbeCheck[];
  pass: boolean;
  /** A one-screen summary, for pasting into an issue or a commit message. */
  report: string;
}

/** A fixed instant: 2026-08-10, which Iran calls ۱۹ مرداد ۱۴۰۵. */
const INSTANT = new Date(Date.UTC(2026, 7, 10, 12, 0, 0));

/** The tag the library formats with. Not the bare `fa-IR`. */
const FORMAT_TAG = "fa-IR-u-ca-persian-nu-arabext";

const ARABEXT = /[۰-۹]/;
const LATIN_DIGIT = /[0-9]/;

export function probeIcu(): ProbeResult {
  const checks: ProbeCheck[] = [];
  const add = (
    id: ProbeCheck["id"],
    pass: boolean,
    actual: string,
    expected: string,
  ): void => {
    checks.push({ id, pass, actual, expected });
  };

  // 1. Is there an `Intl` at all, with the two constructors the library uses?
  const hasIntl =
    typeof Intl !== "undefined" &&
    typeof Intl.NumberFormat === "function" &&
    typeof Intl.DateTimeFormat === "function";
  add("intl-present", hasIntl, String(hasIntl), "true");
  if (!hasIntl) return finish(checks);

  // 2. Direction. `Intl.Locale.prototype.getTextInfo` is newer than the rest of
  //    Intl and is the most likely single member to be missing, so it is probed
  //    for EXISTENCE separately from its answer.
  let direction = "(no Intl.Locale.getTextInfo)";
  try {
    // Hermes (Expo Go, iOS 18.5, 16 Aug 2026) has no `Intl.Locale` AT ALL —
    // name that outcome rather than surfacing a raw TypeError.
    if (typeof Intl.Locale !== "function") throw new Error("no Intl.Locale");
    const locale = new Intl.Locale("fa-IR") as Intl.Locale & {
      getTextInfo?: () => { direction: string };
      textInfo?: { direction: string };
    };
    // Two spellings ship in the wild: the method (spec) and the property
    // (older V8). Accepting either is not sloppiness — a runtime that answers
    // through the property answers CORRECTLY, and rejecting it would fail the
    // gate on a spelling rather than on a capability.
    direction = locale.getTextInfo?.().direction ?? locale.textInfo?.direction ?? direction;
  } catch (error) {
    direction = `(threw: ${String(error)})`;
  }
  add("direction", direction === "rtl", direction, "rtl");

  // 3. Digits. The extension has to be HONOURED, not merely accepted.
  let digits = "(threw)";
  try {
    digits = new Intl.NumberFormat(FORMAT_TAG, { useGrouping: false }).format(1234);
  } catch (error) {
    digits = `(threw: ${String(error)})`;
  }
  add("digits", ARABEXT.test(digits) && !LATIN_DIGIT.test(digits), digits, "۱۲۳۴");

  // 4. Calendar. The month NAME, which is the only thing that distinguishes a
  //    Jalali date from a Gregorian one wearing Persian digits.
  let month = "(threw)";
  try {
    month = new Intl.DateTimeFormat(FORMAT_TAG, { month: "long" }).format(INSTANT);
  } catch (error) {
    month = `(threw: ${String(error)})`;
  }
  add("calendar", month === "مرداد", month, "مرداد");

  /*
   * 5. The check that catches the SILENT failure, and the reason this file is
   *    longer than "does Intl exist".
   *
   *    A runtime that ignores `-u-ca-persian` returns a Gregorian date in
   *    Persian script — «اوت» for August. That passes the digit check, passes
   *    the direction check, renders beautifully, and is 621 years wrong. So the
   *    year is asserted NEGATIVELY: a Jalali year can never equal a Gregorian
   *    one, which is a fact no formatting bug can fake.
   */
  let year = "(threw)";
  try {
    year = new Intl.DateTimeFormat(FORMAT_TAG, { year: "numeric" }).format(INSTANT);
  } catch (error) {
    year = `(threw: ${String(error)})`;
  }
  const gregorianYear = String(INSTANT.getUTCFullYear());
  const asLatin = year.replace(/[۰-۹]/g, (d) =>
    String(d.charCodeAt(0) - 0x06f0),
  );
  add(
    "calendar-not-gregorian",
    asLatin !== gregorianYear && asLatin === "1405",
    `${year} (→ ${asLatin})`,
    "۱۴۰۵ (→ 1405), and never 2026",
  );

  return finish(checks);
}

function finish(checks: ProbeCheck[]): ProbeResult {
  const pass = checks.every((c) => c.pass);
  const width = Math.max(...checks.map((c) => c.id.length));
  const report = [
    `lumo icu probe — ${pass ? "PASS" : "FAIL"}`,
    ...checks.map(
      (c) =>
        `  ${c.pass ? "ok  " : "FAIL"} ${c.id.padEnd(width)}  got ${JSON.stringify(c.actual)}` +
        (c.pass ? "" : `  want ${JSON.stringify(c.expected)}`),
    ),
  ].join("\n");
  return { checks, pass, report };
}

/*
 * Runs on import when executed directly, and stays silent when imported. A gate
 * nobody can run by accident is a gate nobody runs.
 */
if (typeof process !== "undefined" && process.argv?.[1]?.includes("icu-probe")) {
  // Printing is the whole point of this branch. `no-console` is deliberately not
  // configured (measured 12 Aug 2026: 34 hits, every one in a CLI or build script
  // whose job is to print), so the suppression that used to sit here named a rule
  // nothing ran — the same shape this file's own repository keeps tripping over.
  console.log(probeIcu().report);
}
