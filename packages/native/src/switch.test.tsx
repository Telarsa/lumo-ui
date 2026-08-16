/**
 * The native Switch's first byte through react-native-web, graded by the same
 * rules — and the direction proof: the thumb's logical `start` offset, which
 * the platform mirrors, so ON is at the reading end in both scripts.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { gradeHtml } from "@lumo-ui/gate";
import { LumoNativeProvider } from "./provider.tsx";
import { Switch } from "./switch.tsx";

const page = (body: string, locale: "fa-IR" | "en-US") =>
  `<!doctype html><html lang="${locale}" dir="${locale === "fa-IR" ? "rtl" : "ltr"}"><head><title>${locale === "fa-IR" ? "کلید" : "Switch"}</title></head><body>${body}</body></html>`;

describe("native Switch — first byte", () => {
  it("is a named switch with a checked state, and its thumb sits at the logical START offset that ON needs", () => {
    const html = renderToStaticMarkup(
      <LumoNativeProvider locale="fa-IR">
        <Switch isSelected onChange={() => undefined}>اعلان‌ها</Switch>
        <Switch accessibilityLabel="حالت تاریک" />
        <Switch isDisabled description="در دسترس نیست">همگام‌سازی</Switch>
      </LumoNativeProvider>,
    );
    expect(html.match(/role="switch"/g)?.length).toBe(3);
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('aria-label="حالت تاریک"');
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain("اعلان‌ها");
    // ON: start offset 15 (md); react-native-web writes the logical property, which the page's dir resolves.
    expect(html).toMatch(/right:\s*15px/); // fa-IR: ON at the reading end = right
    expect(gradeHtml("fa-IR/native/switch.html", page(html, "fa-IR"))).toEqual([]);
  });
  it("uncontrolled: defaultSelected renders as checked; en-US grades clean too", () => {
    const html = renderToStaticMarkup(
      <LumoNativeProvider locale="en-US">
        <Switch defaultSelected>Notifications</Switch>
      </LumoNativeProvider>,
    );
    expect(html).toContain('aria-checked="true"');
    expect(gradeHtml("en-US/native/switch.html", page(html, "en-US"))).toEqual([]);
  });
  it("the thumb's logical `start` resolves by direction: ON is on the RIGHT under fa-IR and on the LEFT under en-US", () => {
    // react-native-web resolves start/end from the writing-direction context the
    // provider roots on web (a `dir` on its root View); on a device the platform
    // does it from the app's I18nManager decision. Same source of truth: the locale.
    const fa = renderToStaticMarkup(<LumoNativeProvider locale="fa-IR"><Switch isSelected>اعلان‌ها</Switch></LumoNativeProvider>);
    const en = renderToStaticMarkup(<LumoNativeProvider locale="en-US"><Switch isSelected>Notifications</Switch></LumoNativeProvider>);
    expect(fa).toMatch(/right:\s*15px/);
    expect(fa).not.toMatch(/left:\s*15px/);
    expect(en).toMatch(/left:\s*15px/);
    expect(fa).toContain('dir="rtl"');
  });
});
