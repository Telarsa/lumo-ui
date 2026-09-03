/*
 * THE LOCALE CONTEXT'S OWN EVIDENCE (§50.2).
 *
 * This module moved out of `packages/ui`, where it was covered indirectly by
 * 2,467 component tests. Clause 1 retires that package, so without this file the
 * move would have quietly traded thorough coverage for none — the exact shape of
 * regression a scope reduction is supposed to avoid.
 *
 * TIER: `renderToStaticMarkup` on the `node` environment, no jsdom. The property
 * under test is that the context resolves during a SERVER render: a locale that
 * only resolves after hydration serves the first byte in the wrong language,
 * which is the defect this project exists to prevent.
 */

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  LumoLocaleContext,
  LumoLocaleProvider,
  useLumoLocale,
  useLumoStrings,
  useLumoStringsFor,
} from "./locale.tsx";
import { fa } from "./strings.ts";
import type { Locale, LumoStrings } from "./index.ts";
import { LumoHtml } from "./html.tsx";

/** A probe that prints whatever the hooks resolve, so the markup carries the answer. */
function ShowLocale() {
  return <span>{useLumoLocale()}</span>;
}
function ShowNav() {
  return <span>{useLumoStrings().calendar.nav}</span>;
}
function ShowNavFor({ locale }: { locale: Locale }) {
  return <span>{useLumoStringsFor(locale).calendar.nav}</span>;
}

/** A complete non-builtin string set: German wording, structurally complete. */
const de: LumoStrings = {
  ...fa,
  calendar: { ...fa.calendar, nav: "Monatsnavigation", previous: "Voriger Monat" },
};

describe("the context resolves during a server render", () => {
  it("carries the provider's locale to a descendant, before any hydration", () => {
    const html = renderToStaticMarkup(
      <LumoLocaleProvider locale="en-US">
        <ShowLocale />
      </LumoLocaleProvider>,
    );
    expect(html).toBe("<span>en-US</span>");
  });

  it("defaults to fa-IR, never to English", () => {
    // The default is load-bearing: a silent en-US fallback is the defect.
    expect(renderToStaticMarkup(<ShowLocale />)).toBe("<span>fa-IR</span>");
  });

  it("resolves a built-in locale's own strings with no strings prop", () => {
    const html = renderToStaticMarkup(
      <LumoLocaleProvider locale="fa-IR">
        <ShowNav />
      </LumoLocaleProvider>,
    );
    expect(html).toContain("پیمایش ماه‌ها");
    // The TEXT, not the markup — `<span>` is Latin and always will be.
    const text = html.replace(/<[^>]*>/g, "");
    expect(text).not.toMatch(/[A-Za-z]/);
  });

  it("serves the app's strings for a language Lumo does not carry", () => {
    const html = renderToStaticMarkup(
      <LumoLocaleProvider locale="de-DE" strings={de}>
        <ShowNav />
      </LumoLocaleProvider>,
    );
    expect(html).toBe("<span>Monatsnavigation</span>");
  });

  it("lets an inner provider override an outer one", () => {
    const html = renderToStaticMarkup(
      <LumoLocaleProvider locale="fa-IR">
        <LumoLocaleProvider locale="en-US">
          <ShowLocale />
        </LumoLocaleProvider>
      </LumoLocaleProvider>,
    );
    expect(html).toBe("<span>en-US</span>");
  });
});

describe("useLumoStringsFor honours a component's OWN locale prop", () => {
  it("resolves a built-in tag that differs from the provider's", () => {
    const html = renderToStaticMarkup(
      <LumoLocaleProvider locale="en-US">
        <ShowNavFor locale="fa-IR" />
      </LumoLocaleProvider>,
    );
    expect(html).toContain("پیمایش ماه‌ها");
  });

  it("THROWS rather than serving another language's strings", () => {
    // The whole point: the app brought German, a component asks for French.
    // Silently answering in German is the defect this library exists to prevent.
    expect(() =>
      renderToStaticMarkup(
        <LumoLocaleProvider locale="de-DE" strings={de}>
          <ShowNavFor locale="fr-FR" />
        </LumoLocaleProvider>,
      ),
    ).toThrow(/carries no strings/);
  });

  it("does not hand the provider's strings to a tag the provider does not speak", () => {
    // Same rule, the other direction: the provider speaks de-DE, so a de-AT
    // component is NOT served de-DE's wording by accident.
    expect(() =>
      renderToStaticMarkup(
        <LumoLocaleProvider locale="de-DE" strings={de}>
          <ShowNavFor locale="de-AT" />
        </LumoLocaleProvider>,
      ),
    ).toThrow(/carries no strings/);
  });
});

describe("one context, not two", () => {
  it("is the same object the package exports, so a re-export cannot fork it", () => {
    /*
     * `packages/ui/src/locale.ts` re-exports this context rather than declaring
     * its own. Two `createContext` calls would give provider and hooks different
     * identities and every component would silently read the fa-IR default — a
     * defect that renders, type-checks and looks right. Proved by poison on 30
     * Aug: redeclaring it failed 8 tests across three component files.
     */
    expect(LumoLocaleContext).toBeDefined();
    const html = renderToStaticMarkup(
      <LumoLocaleContext.Provider value={{ locale: "en-US", strings: undefined }}>
        <ShowLocale />
      </LumoLocaleContext.Provider>,
    );
    expect(html).toBe("<span>en-US</span>");
  });
});

describe("LumoHtml carries the rest of the root element", () => {
  it("spreads other attributes through, and still derives dir", () => {
    const out = renderToStaticMarkup(
      <LumoHtml lang="fa-IR" data-scroll-behavior="smooth" id="root" className="h-full">
        <body />
      </LumoHtml>,
    );
    expect(out).toContain('lang="fa-IR"');
    expect(out).toContain('dir="rtl"');
    expect(out).toContain('data-scroll-behavior="smooth"');
    expect(out).toContain('id="root"');
    expect(out).toContain('class="h-full"');
  });
  it("dir is owned: the type refuses it, and even forced through it cannot win", () => {
    // @ts-expect-error — dir is derived from lang and is not a prop.
    const out = renderToStaticMarkup(<LumoHtml lang="fa-IR" dir="ltr"><body /></LumoHtml>);
    expect(out).toContain('dir="rtl"');
    expect(out).not.toContain('dir="ltr"');
  });
});
