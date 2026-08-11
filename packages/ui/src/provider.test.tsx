import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Slider, SliderThumb, SliderTrack } from "react-aria-components";
import { useDirection } from "@base-ui/react/direction-provider";
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

/* ════════════════════════════════════════════════════════════════════════════
 * THE BASE UI HALF
 *
 * Added with the Base UI `DirectionProvider`. Nothing above this line changed:
 * the React Aria assertions still measure the RAC half, which is still the
 * larger half of the library, and they are what will fail if `I18nProvider` is
 * removed before the last RAC import is.
 *
 * These cases cannot be written against markup, because `DirectionProvider`
 * renders no DOM at all — it is a context and nothing else. So the probe reads
 * the context the way Base UI's own components read it, through the public
 * `useDirection` hook, and prints it.
 * ═══════════════════════════════════════════════════════════════════════════ */

function DirectionProbe() {
  return <span data-probe={useDirection()} />;
}

function probeDirection(html: string): string {
  return (html.match(/data-probe="(\w+)"/) ?? ["", "(none)"])[1] as string;
}

describe("LumoProvider — direction reaches Base UI, derived from the locale", () => {
  it("without a provider Base UI defaults to ltr — on a Persian page too", () => {
    // The poison twin. `DirectionProvider.mjs:14` is `const { direction = 'ltr' }`,
    // so a Base UI application that forgets the provider gets LTR arrow keys and
    // LTR positioner sides with nothing in the served bytes to show for it.
    expect(probeDirection(renderToStaticMarkup(<DirectionProbe />))).toBe("ltr");
  });

  it("fa-IR yields rtl", () => {
    const html = renderToStaticMarkup(
      <LumoProvider locale="fa-IR">
        <DirectionProbe />
      </LumoProvider>,
    );
    expect(probeDirection(html)).toBe("rtl");
  });

  it("en-US yields ltr, so this is not a Persian-only patch", () => {
    const html = renderToStaticMarkup(
      <LumoProvider locale="en-US">
        <DirectionProbe />
      </LumoProvider>,
    );
    expect(probeDirection(html)).toBe("ltr");
  });

  it("the two locales genuinely differ (guards a vacuous pass)", () => {
    const fa = probeDirection(
      renderToStaticMarkup(
        <LumoProvider locale="fa-IR">
          <DirectionProbe />
        </LumoProvider>,
      ),
    );
    const en = probeDirection(
      renderToStaticMarkup(
        <LumoProvider locale="en-US">
          <DirectionProbe />
        </LumoProvider>,
      ),
    );
    expect(fa).not.toBe(en);
  });

  it("direction and locale cannot disagree: both halves see the same locale", () => {
    // The point of the rework. One prop in, and the RAC geometry and the Base UI
    // direction are two views of it — there is no second lever to set wrong.
    const html = renderToStaticMarkup(
      <LumoProvider locale="fa-IR">
        {thumb}
        <DirectionProbe />
      </LumoProvider>,
    );
    expect(offset(html)).toBe("left:60%");
    expect(probeDirection(html)).toBe("rtl");
  });

  it("LumoProvider exposes no `direction` prop to disagree with", () => {
    // A type-level assertion written as a runtime one so it lives in the suite:
    // @ts-expect-error `direction` is not a prop and must never become one.
    const bad = <LumoProvider locale="fa-IR" direction="ltr" />;
    expect(bad).toBeTruthy();
  });
});
