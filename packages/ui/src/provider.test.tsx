import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Slider, SliderThumb, SliderTrack } from "react-aria-components";
import { LumoProvider } from "./provider.tsx";

/**
 * The defect this file pins is invisible to every other gate in the repo.
 *
 * React Aria resolves its locale from `useDefaultLocale()`, which reads
 * `navigator.language` and falls back to `'en-US'`. During server rendering
 * there is no `navigator`, so every React Aria component renders `en-US`/`ltr`
 * no matter what `<html lang dir>` says — and the result is valid HTML with
 * plausible inline styles, so `lumo-gate` (which grades attributes and text)
 * cannot see it.
 *
 * The site shipped without a provider for a day. A slider thumb at value 40 sat
 * at `left: 40%` instead of `left: 60%`: the mirror image of where it belongs,
 * on every Persian page.
 */

const thumb = (
  <Slider aria-label="قیمت" defaultValue={40}>
    <SliderTrack>
      <SliderThumb />
    </SliderTrack>
  </Slider>
);

/** The inline offset React Aria computes for the thumb. */
function offset(html: string): string {
  return (html.match(/(?:left|right|inset-inline-start)\s*:\s*[\d.]+%/) ?? ["(none)"])[0];
}

describe("LumoProvider — direction reaches React Aria's own geometry", () => {
  it("without a provider, React Aria measures from the LTR edge", () => {
    // Not an aspiration — this is what shipped, and it is why the provider is a
    // required component rather than a documented convention.
    expect(offset(renderToStaticMarkup(thumb))).toBe("left:40%");
  });

  it("with LumoProvider fa-IR, it measures from the RTL edge", () => {
    const html = renderToStaticMarkup(<LumoProvider locale="fa-IR">{thumb}</LumoProvider>);
    expect(offset(html)).toBe("left:60%");
  });

  it("en-US is unchanged, so the provider is not a Persian-only patch", () => {
    const html = renderToStaticMarkup(<LumoProvider locale="en-US">{thumb}</LumoProvider>);
    expect(offset(html)).toBe("left:40%");
  });

  it("the two locales genuinely differ (guards a vacuous pass)", () => {
    const fa = offset(renderToStaticMarkup(<LumoProvider locale="fa-IR">{thumb}</LumoProvider>));
    const en = offset(renderToStaticMarkup(<LumoProvider locale="en-US">{thumb}</LumoProvider>));
    expect(fa).not.toBe(en);
  });
});
