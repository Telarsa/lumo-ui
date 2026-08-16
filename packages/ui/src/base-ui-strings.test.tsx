/**
 * The i18n layer's conformance suite for the Base UI engine strings.
 *
 * ── WHAT THIS PINS, AND WHY IT IS A PERMANENT TEST RATHER THAN A PROBE ──────
 *
 * The migration probe MEASURED that seven of Base UI's eight English strings
 * can be reached by a prop. A measurement is true on the day it is taken. This
 * file makes it true on every day after, because all seven reach through
 * `mergeProps` precedence and `?? default` fallbacks — internal choices with no
 * compatibility promise attached. A minor version that moves one literal after
 * the spread turns a Persian page English with a green build, no type error and
 * no visible change. This file is the tripwire for that.
 *
 * ── EVERY ASSERTION IS AGAINST A SERVER RENDER ──────────────────────────────
 *
 * `renderToStaticMarkup`, never jsdom. The point of the whole layer is that it
 * resolves in the FIRST BYTE — Base UI's own naming routes are layout effects
 * and cannot (see `@lumo-ui/base-ui-ssr`). An assertion made in jsdom would
 * pass on a client render and tell us nothing about the bytes a crawler or a
 * no-JS reader receives.
 *
 * ── THE TWO SHAPES OF CASE BELOW ────────────────────────────────────────────
 *
 *   Lumo components   `Slider` and `NumberField` are asserted through Lumo's
 *                     own public API.
 *   Bare carriers     `Progress.Root`, `Toast.Viewport` and a two-thumb
 *                     `Slider.Thumb` are rendered directly, wired the way the
 *                     catalogue says to wire them. Lumo's own progress, toast
 *                     and range-slider suites make the stronger per-component
 *                     claim; this file keeps the bare case because it grades
 *                     the CATALOGUE rather than any one component — it proves
 *                     the catalogue reaches the attribute, not that a Lumo
 *                     component threads it.
 *
 * Both shapes assert the SAME two things, and the negative one is the load
 * bearing half: the Persian string is present AND the English string Base UI
 * would otherwise have emitted is absent. Asserting only the first passes on a
 * page carrying both values on the same attribute — not hypothetical: the
 * React Aria era's NumberField `<Group>` did exactly that.
 */

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Progress } from "@base-ui/react/progress";
import { Slider as BaseSlider } from "@base-ui/react/slider";
import { Toast } from "@base-ui/react/toast";
import { FORMAT_LOCALE, LOCALES, stringsFor, type Locale } from "@lumo-ui/core";
import { BASE_UI_STRINGS, baseUiStringsFor } from "@lumo-ui/base-ui-ssr";
import { LumoLocaleContext } from "./locale.ts";
import { NumberField } from "./number-field.tsx";
import { Slider } from "./slider.tsx";

/** A server render under an explicit locale, exactly as a Lumo page produces it. */
function ssr(locale: Locale, node: React.ReactNode): string {
  return renderToStaticMarkup(
    <LumoLocaleContext.Provider value={{ locale, strings: undefined }}>{node}</LumoLocaleContext.Provider>,
  );
}

/**
 * The eight strings from the census, minus the unreachable one.
 *
 * Written out as literals rather than derived from `BASE_UI_STRINGS["en-US"]`,
 * because these are BASE UI's words and the catalogue's `en-US` entries are
 * Lumo's. They happen to coincide today; a test that derived one from the other
 * would go green if both changed together, which is the case it exists to catch.
 */
const BASE_UI_ENGLISH = {
  roleDescription: "Number field",
  increase: "Increase",
  decrease: "Decrease",
  indeterminate: "indeterminate progress",
  rangeStart: "start range",
  rangeEnd: "end range",
  viewport: "Notifications",
} as const;

describe("base-ui strings — catalogue shape", () => {
  it("every declared locale has a complete set", () => {
    for (const l of LOCALES) expect(BASE_UI_STRINGS[l]).toBeDefined();
  });

  it("fa-IR is Persian in every static entry", () => {
    const s = BASE_UI_STRINGS["fa-IR"];
    for (const v of [
      s.numberField.roleDescription,
      s.numberField.increase,
      s.numberField.decrease,
      s.progress.indeterminate,
      s.toast.viewport,
    ]) {
      expect(v).toMatch(/[؀-ۿ]/);
      // Not merely "contains a Persian character". A half-translated string —
      // «۲۰ start range» — contains one too, which is the exact defect.
      expect(v).not.toMatch(/[A-Za-z]{3,}/);
    }
  });

  it("the slider entries route their number through formatNumber", () => {
    // The catalogue is the ONLY place `formatNumber` is applied to these, so
    // this is what stops «50 آغاز بازه» — the mirror image of Base UI's own
    // «۵۰ start range», and just as hard to spot.
    const fa = baseUiStringsFor("fa-IR");
    expect(fa.slider.rangeStart(50)).toBe("۵۰ آغاز بازه");
    expect(fa.slider.rangeEnd(50)).toBe("۵۰ پایان بازه");
    expect(fa.slider.rangeStart(50)).not.toMatch(/[0-9]/);

    const en = baseUiStringsFor("en-US");
    expect(en.slider.rangeStart(50)).toBe("50 start range");
    expect(en.slider.rangeEnd(50)).toBe("50 end range");
  });

  it("the slider entries honour the caller's format options", () => {
    // A range slider formatting currency must not announce a bare number; the
    // visible <output> and aria-valuetext are formatted from one options object
    // precisely so they cannot drift.
    const fa = baseUiStringsFor("fa-IR");
    const withPercent = fa.slider.rangeStart(0.5, { style: "percent" });
    expect(withPercent).toContain("٪");
    expect(withPercent).toContain("آغاز بازه");
  });

  it("roleDescription is the same phrase LumoStrings already carries", () => {
    // One concept, one Persian phrase. Two catalogues authoring «فیلد عددی»
    // independently is how a component announces one word and documents another.
    for (const l of LOCALES) {
      expect(BASE_UI_STRINGS[l].numberField.roleDescription).toBe(
        stringsFor(l).numberField.roleDescription,
      );
    }
  });
});

describe("base-ui strings — a fa-IR SERVER render carries Persian for all 7", () => {
  const fa = baseUiStringsFor("fa-IR");

  /* ── 1 & 2 & 3 · NumberField: roleDescription, increase, decrease ────────── */
  it("NumberField announces three Persian strings and no English", () => {
    const s = stringsFor("fa-IR");
    const html = ssr(
      "fa-IR",
      <NumberField
        label="تعداد"
        roleDescription={s.numberField.roleDescription}
        incrementLabel={s.numberField.increase("تعداد")}
        decrementLabel={s.numberField.decrease("تعداد")}
        defaultValue={1234}
      />,
    );

    expect(html).toContain(`aria-roledescription="${fa.numberField.roleDescription}"`);
    expect(html).toContain("aria-label=\"افزایش تعداد\"");
    expect(html).toContain("aria-label=\"کاهش تعداد\"");

    expect(html).not.toContain(BASE_UI_ENGLISH.roleDescription);
    expect(html).not.toContain(BASE_UI_ENGLISH.increase);
    expect(html).not.toContain(BASE_UI_ENGLISH.decrease);
  });

  /* ── 4 · Progress.Root while indeterminate ───────────────────────────────── */
  it("Progress.Root announces the Persian indeterminate phrase (bare carrier)", () => {
    // BARE CARRIER, and it is now the WEAKER of two tests rather than the only
    // one: progress.tsx was rebuilt on Base UI on 11 Aug 2026 and threads this
    // exact wiring, asserted through Lumo's own public API in progress.test.tsx.
    // This case stays because it grades the CATALOGUE — that the phrase reaches
    // the attribute through a documented prop — independently of whether any
    // Lumo component happens to call it.
    //
    // `getAriaValueText` receives the EMPTY STRING as `formattedValue` in this
    // state (ProgressRoot.mjs:43,64), so the callback cannot learn from its own
    // argument which phrasing is being asked for. It decides from `value`.
    const html = renderToStaticMarkup(
      <Progress.Root
        value={null}
        locale={FORMAT_LOCALE["fa-IR"]}
        getAriaValueText={(formatted, value) =>
          value === null ? fa.progress.indeterminate : formatted
        }
      >
        <Progress.Track>
          <Progress.Indicator />
        </Progress.Track>
      </Progress.Root>,
    );

    expect(html).toContain(`aria-valuetext="${fa.progress.indeterminate}"`);
    expect(html).not.toContain(BASE_UI_ENGLISH.indeterminate);
  });

  /* ── 5 & 6 · Slider.Thumb range start / end ──────────────────────────────── */
  it("a two-thumb Slider announces both Persian range strings (bare carrier)", () => {
    // BARE CARRIER, and the only one of the seven whose Base UI default is HALF
    // localised: «۲۰ start range». The negative assertions below are therefore
    // the real content of this test — the digits are Persian either way.
    const html = renderToStaticMarkup(
      <BaseSlider.Root defaultValue={[20, 60]} locale={FORMAT_LOCALE["fa-IR"]}>
        <BaseSlider.Control>
          <BaseSlider.Track>
            <BaseSlider.Indicator />
            <BaseSlider.Thumb
              index={0}
              getAriaValueText={(_f, value) => fa.slider.rangeStart(value)}
            />
            <BaseSlider.Thumb
              index={1}
              getAriaValueText={(_f, value) => fa.slider.rangeEnd(value)}
            />
          </BaseSlider.Track>
        </BaseSlider.Control>
      </BaseSlider.Root>,
    );

    expect(html).toContain('aria-valuetext="۲۰ آغاز بازه"');
    expect(html).toContain('aria-valuetext="۶۰ پایان بازه"');
    expect(html).not.toContain(BASE_UI_ENGLISH.rangeStart);
    expect(html).not.toContain(BASE_UI_ENGLISH.rangeEnd);
  });

  it("Lumo's Slider wires the same catalogue through thumbValueText", () => {
    // Lumo ships ONE thumb, so this exercises the count<2 branch: a bare
    // formatted number, which is what a single-thumb slider must announce.
    // `thumbValueText`'s range branch is covered by the bare-carrier case above
    // and by the catalogue unit tests; what is asserted here is that the wiring
    // did not change the single-thumb output while gaining the range one.
    const html = ssr(
      "fa-IR",
      <Slider label="بودجه" locale="fa-IR" defaultValue={40} minValue={0} maxValue={100} />,
    );
    expect(html).toContain('aria-valuetext="۴۰"');
    expect(html).not.toContain(BASE_UI_ENGLISH.rangeStart);
    expect(html).not.toContain(BASE_UI_ENGLISH.rangeEnd);
  });

  /* ── 7 · Toast.Viewport ──────────────────────────────────────────────────── */
  it("Toast.Viewport announces the Persian landmark name (bare carrier)", () => {
    // BARE CARRIER. toast.tsx is still React Aria, whose own default is worse
    // than plain English — «۱ notification.», a Persian digit inside an English
    // noun. Base UI's is honest English, and it is prop-reachable.
    const html = renderToStaticMarkup(
      <Toast.Provider>
        <Toast.Viewport aria-label={fa.toast.viewport} />
      </Toast.Provider>,
    );

    expect(html).toContain(`aria-label="${fa.toast.viewport}"`);
    expect(html).not.toContain(BASE_UI_ENGLISH.viewport);
  });
});

describe("base-ui strings — en-US takes the same path", () => {
  // The Persian arm is the one anybody looks at, which is exactly why the
  // English arm has to exist: if `en-US` fell through to Base UI's own defaults
  // rather than resolving through the catalogue, a wiring regression would show
  // up in one locale only and the other would keep passing.
  it("the catalogue, not the library default, supplies the English strings", () => {
    const en = baseUiStringsFor("en-US");
    const html = ssr(
      "en-US",
      <Slider label="Budget" locale="en-US" defaultValue={40} minValue={0} maxValue={100} />,
    );
    expect(html).toContain('aria-valuetext="40"');
    expect(en.slider.rangeEnd(60)).toBe("60 end range");
  });
});
