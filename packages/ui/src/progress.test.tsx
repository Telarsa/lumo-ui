/**
 * EXPERIMENT (branch `experiment/base-ui`). ProgressBar and Meter on Base UI.
 *
 * Every assertion is against `renderToStaticMarkup`. That is not a stylistic
 * choice: two of the three defects this file pins — the missing accessible name
 * and the wrongly-localed `aria-valuetext` — SELF-HEAL on hydration, so a jsdom
 * mount observes the fixed tree and passes with or without the fix. The bytes
 * are the only tier that can see them. `@lumo-ui/base-ui-ssr`'s README states
 * the same rule for the same reason.
 *
 * Each positive case has a POISON TWIN asserting that bare Base UI is still
 * broken in the way the wrapper compensates for. When a twin goes red the bug
 * is fixed upstream and the workaround should be DELETED, not maintained.
 */

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { render, screen } from "@testing-library/react";
import { Progress as BaseProgress } from "@base-ui/react/progress";
import { formatNumber } from "@lumo-ui/core";
import { baseUiStringsFor } from "@lumo-ui/base-ui-ssr";
import { Meter, ProgressBar } from "./progress.tsx";

const fa = baseUiStringsFor("fa-IR");

/** The English literal Base UI emits at `progress/root/ProgressRoot.mjs:42`. */
const BASE_UI_ENGLISH_INDETERMINATE = "indeterminate progress";

/** The id an `aria-labelledby` points at, or `null` when nothing is wired. */
function labelledBy(html: string): string | null {
  return (html.match(/aria-labelledby="([^"]+)"/) ?? [null, null])[1] ?? null;
}

function valueText(html: string): string | null {
  return (html.match(/aria-valuetext="([^"]*)"/) ?? [null, null])[1] ?? null;
}

describe("ProgressBar — the accessible name is in the first byte", () => {
  it("names the progressbar at SSR, and the target element is really there", () => {
    const html = renderToStaticMarkup(
      <ProgressBar label="بارگذاری پرونده" locale="fa-IR" value={45} />,
    );
    expect(html).toContain('role="progressbar"');

    const id = labelledBy(html);
    expect(id).not.toBeNull();
    // A dangling idref is a different defect, not a fix. Assert the element the
    // reference points at exists in the SAME bytes.
    expect(html).toContain(`id="${id as string}"`);
    expect(html).toContain("بارگذاری پرونده");
  });

  it("POISON TWIN — bare Base UI serves the bar with no name at all", () => {
    // `Progress.Label` publishes its id through `useRegisteredLabelId`, a layout
    // effect, so `aria-labelledby` is undefined during a server render. If this
    // assertion ever fails, Base UI has fixed it and `useFieldWiring` should be
    // removed from progress.tsx.
    const html = renderToStaticMarkup(
      <BaseProgress.Root value={45}>
        <BaseProgress.Label>بارگذاری پرونده</BaseProgress.Label>
        <BaseProgress.Track>
          <BaseProgress.Indicator />
        </BaseProgress.Track>
      </BaseProgress.Root>,
    );
    expect(html).toContain('role="progressbar"');
    expect(labelledBy(html)).toBeNull();
    expect(html).not.toContain("aria-label=");
  });

  it("the name is present whether or not the value is shown", () => {
    // The label element and its id are identical in both branches; only its
    // classes differ. Turning `showValue` on cannot change what is announced.
    const hidden = renderToStaticMarkup(
      <ProgressBar label="بارگذاری" locale="fa-IR" value={45} />,
    );
    const shown = renderToStaticMarkup(
      <ProgressBar label="بارگذاری" locale="fa-IR" value={45} showValue />,
    );
    expect(labelledBy(hidden)).not.toBeNull();
    expect(labelledBy(shown)).not.toBeNull();
    expect(hidden).toContain("sr-only");
    expect(shown).not.toContain("sr-only");
  });
});

describe("ProgressBar — the announced number is Persian", () => {
  it("clamps one value for geometry, visible text, and ARIA", () => {
    render(
      <ProgressBar
        label="بارگذاری"
        locale="fa-IR"
        value={150}
        maxValue={100}
        formatOptions={{ style: "decimal" }}
        showValue
      />,
    );
    const progress = screen.getByRole("progressbar");
    expect(progress.getAttribute("aria-valuenow")).toBe("100");
    expect(progress.getAttribute("aria-valuetext")).toContain("۱۰۰");
    expect(progress.textContent).toContain("۱۰۰");
    expect(progress.textContent).not.toContain("۱۵۰");
  });

  it("rejects an inverted range instead of rendering contradictory semantics", () => {
    expect(() =>
      render(
        <ProgressBar label="بارگذاری" locale="fa-IR" minValue={100} maxValue={0} />,
      ),
    ).toThrow(RangeError);
  });
  it("aria-valuetext carries arabext digits, not Latin ones", () => {
    const html = renderToStaticMarkup(
      <ProgressBar label="بارگذاری" locale="fa-IR" value={45} />,
    );
    expect(valueText(html)).toBe(formatNumber(0.45, "fa-IR", { style: "percent" }));
    expect(valueText(html)).toMatch(/[۰-۹]/);
    expect(valueText(html)).not.toMatch(/[0-9]/);
  });

  it("what is SEEN and what is ANNOUNCED are the same string", () => {
    const html = renderToStaticMarkup(
      <ProgressBar label="بارگذاری" locale="fa-IR" value={45} showValue />,
    );
    const announced = valueText(html) as string;
    // `Progress.Value` is aria-hidden, so it can only be found in the text.
    expect(html).toContain(`>${announced}<`);
  });

  it("en-US is unchanged, so this is not a Persian-only patch", () => {
    const html = renderToStaticMarkup(
      <ProgressBar label="Uploading" locale="en-US" value={45} />,
    );
    expect(valueText(html)).toBe("45%");
  });

  it("a non-percent formatOptions formats the RAW value, not the fraction", () => {
    // The trap in the file header: Base UI's own `format` prop would have been
    // applied to the clamped value and produced «۴٬۵۰۰٪» for the percent case.
    // This asserts the two styles diverge exactly where they should.
    const html = renderToStaticMarkup(
      <ProgressBar
        label="دانلود"
        locale="fa-IR"
        value={45}
        formatOptions={{ style: "unit", unit: "megabyte" }}
      />,
    );
    expect(valueText(html)).toBe(
      formatNumber(45, "fa-IR", { style: "unit", unit: "megabyte" }),
    );
  });
});

describe("ProgressBar — the indeterminate phrase comes from the catalogue", () => {
  it("announces the Persian phrase and not Base UI's English literal", () => {
    const html = renderToStaticMarkup(
      <ProgressBar label="در حال پردازش" locale="fa-IR" isIndeterminate />,
    );
    expect(valueText(html)).toBe(fa.progress.indeterminate);
    expect(html).not.toContain(BASE_UI_ENGLISH_INDETERMINATE);
  });

  it("POISON TWIN — bare Base UI announces the English literal", () => {
    const html = renderToStaticMarkup(
      <BaseProgress.Root value={null}>
        <BaseProgress.Track>
          <BaseProgress.Indicator />
        </BaseProgress.Track>
      </BaseProgress.Root>,
    );
    expect(html).toContain(BASE_UI_ENGLISH_INDETERMINATE);
  });

  it("drives the pulse from Base UI's own attribute, not a computed class", () => {
    const html = renderToStaticMarkup(
      <ProgressBar label="در حال پردازش" locale="fa-IR" isIndeterminate />,
    );
    expect(html).toContain("data-indeterminate");
    expect(html).toContain("data-indeterminate:animate-pulse");
  });

  it("shows no figure at all while indeterminate", () => {
    const html = renderToStaticMarkup(
      <ProgressBar label="در حال پردازش" locale="fa-IR" isIndeterminate showValue />,
    );
    // A percentage of an unknown duration is a fiction; RAC omitted it too.
    expect(html).not.toMatch(/[۰-۹]+٪/);
  });
});

describe("Meter", () => {
  it("clamps one value for geometry, visible text, and ARIA", () => {
    render(
      <Meter
        label="فضای مصرف‌شده"
        locale="fa-IR"
        value={150}
        maxValue={100}
        formatOptions={{ style: "decimal" }}
        showValue
      />,
    );
    const meter = screen.getByRole("meter");
    expect(meter.getAttribute("aria-valuenow")).toBe("100");
    expect(meter.getAttribute("aria-valuetext")).toContain("۱۰۰");
    expect(meter.textContent).toContain("۱۰۰");
    expect(meter.textContent).not.toContain("۱۵۰");
  });

  it("rejects an inverted range instead of rendering contradictory semantics", () => {
    expect(() =>
      render(<Meter label="فضا" locale="fa-IR" minValue={100} maxValue={0} />),
    ).toThrow(RangeError);
  });

  it("is a role=meter with a first-byte name and a Persian value", () => {
    const html = renderToStaticMarkup(
      <Meter label="فضای مصرف‌شده" locale="fa-IR" value={92} showValue />,
    );
    expect(html).toContain('role="meter"');
    const id = labelledBy(html);
    expect(id).not.toBeNull();
    expect(html).toContain(`id="${id as string}"`);
    expect(valueText(html)).toBe(formatNumber(0.92, "fa-IR", { style: "percent" }));
    expect(valueText(html)).not.toMatch(/[0-9]/);
  });

  it("POISON TWIN — bare Base UI's meter formats with the RUNTIME locale", () => {
    // The defect stated as a number. Base UI's default path is
    // `formatNumber(percentage/100, locale, {style:'percent'})` with `locale`
    // defaulting to the runtime's — so on a CI machine set to en-US a Persian
    // page announces Latin digits, and nothing in the markup says so.
    const html = renderToStaticMarkup(
      <BaseProgress.Root value={92}>
        <BaseProgress.Track>
          <BaseProgress.Indicator />
        </BaseProgress.Track>
      </BaseProgress.Root>,
    );
    expect(valueText(html)).toMatch(/[0-9]/);
  });
});
