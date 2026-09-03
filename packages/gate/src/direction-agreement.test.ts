/*
 * THE TWO ANSWERS TO ONE QUESTION MUST MATCH.
 *
 * `LumoHtml` writes `dir` from `core`'s `direction()`. `lang-dir` then reads
 * that attribute back and compares it against the gate's own profile. If the
 * two derive direction differently, the gate fails a page Lumo itself rendered
 * — and it did, for four tags:
 *
 *   ku        core ltr, gate rtl   (bare `ku` is Kurmanji, Latin script)
 *   az-Arab   core rtl, gate ltr   ┐ the table is keyed by PRIMARY SUBTAG, so
 *   pa-Arab   core rtl, gate ltr   │ its `az-arab`/`pa-arab`/`uz-arab` entries
 *   uz-Arab   core rtl, gate ltr   ┘ were unreachable
 *
 * Neither side was asked to change its mind: both now ask the platform, which
 * is what every other field of the gate's derived profile already did. This
 * file exists so the next divergence is a failing test rather than a consumer
 * discovering it.
 */
import { describe, expect, it } from "vitest";
import { direction } from "../../core/src/index.ts";
import { gradingFor, knownLocales } from "./index.ts";

/*
 * RTL languages, the Arabic-script variants of otherwise-LTR languages (the
 * class that was broken), and enough LTR tags that a rule of "always rtl" would
 * fail too.
 */
const TAGS = [
  "fa", "fa-IR", "ar", "ar-SA", "ar-EG", "he", "iw", "ur", "ps", "sd", "ug", "yi",
  "ckb", "dv", "nqo", "syr", "ks",
  "ku", "az", "az-Arab", "pa", "pa-Arab", "uz", "uz-Arab", "prs",
  "en", "en-US", "de", "de-CH", "fr", "ru", "zh", "zh-Hant-TW", "ja", "ko", "hi", "th", "tr", "pt-BR",
];

describe("core and the gate agree on direction", () => {
  it.each(TAGS)("%s", (tag) => {
    expect(gradingFor(tag).direction, `the gate and core disagree on ${tag}`).toBe(
      direction(tag as Parameters<typeof direction>[0]),
    );
  });

  it("including every locale the gate lists as built-in", () => {
    for (const tag of knownLocales()) {
      expect(gradingFor(tag).direction, `built-in ${tag}`).toBe(
        direction(tag as Parameters<typeof direction>[0]),
      );
    }
  });

  it("and the check itself can fail — rtl and ltr are both really produced", () => {
    // A test that only ever compares two constants proves nothing. Both
    // answers must appear in the set above, or this file is vacuous.
    const seen = new Set(TAGS.map((t) => gradingFor(t).direction));
    expect(seen).toEqual(new Set(["rtl", "ltr"]));
  });
});
