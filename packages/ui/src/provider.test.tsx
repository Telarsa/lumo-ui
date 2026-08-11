import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useDirection } from "@base-ui/react/direction-provider";
import { LumoProvider } from "./provider.tsx";

/**
 * The defect this file pins is invisible to every other gate in the repo.
 *
 * An engine that resolves its own locale from the BROWSER renders `ltr` on a
 * server, whatever `<html lang dir>` says — and the result is valid HTML with
 * plausible inline geometry, so `lumo-gate`, which grades attributes and text,
 * cannot see it. The site shipped that way for a day: a slider thumb at value
 * 40 sat at `left: 40%` instead of `left: 60%`, the mirror image of where it
 * belongs, on every Persian page.
 *
 * That was React Aria reading `navigator.language` with no `navigator` present.
 * Those assertions lived here until 12 Aug 2026 and were removed with the
 * engine — `provider.tsx`'s header keeps the measurement, because the SHAPE of
 * the defect outlives the library that had it and Base UI's own
 * `DirectionProvider` defaults to `ltr` for the same class of reason.
 *
 * What remains is the guarantee that survived the migration: one prop in,
 * direction DERIVED, and no second lever that can disagree with it.
 */


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

  it("derives direction from the locale, with no second lever to set wrong", () => {
    /*
     * This used to render a React Aria Slider BESIDE the direction probe and
     * assert both halves agreed — the point being that one prop fed two
     * engines. There is no second engine now: `list-box` and `tree` were the
     * last components reading RAC's locale, so `LumoProvider` stopped rendering
     * `<I18nProvider>` on 12 Aug 2026 and the assertion has one half left.
     *
     * What it still guards is the thing that mattered: direction is DERIVED,
     * so there is nothing to set inconsistently. The test below pins that
     * `direction` is not a prop and must never become one.
     */
    const html = renderToStaticMarkup(
      <LumoProvider locale="fa-IR">
        <DirectionProbe />
      </LumoProvider>,
    );
    expect(probeDirection(html)).toBe("rtl");
  });

  it("LumoProvider exposes no `direction` prop to disagree with", () => {
    // A type-level assertion written as a runtime one so it lives in the suite:
    // @ts-expect-error `direction` is not a prop and must never become one.
    const bad = <LumoProvider locale="fa-IR" direction="ltr" />;
    expect(bad).toBeTruthy();
  });
});
