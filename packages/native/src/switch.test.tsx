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
    // ON under fa-IR: the thumb rests at the reading start (right: 1px) and is carried −15 px to the end (left).
    expect(html).toMatch(/right:\s*1px/);
    expect(html).toMatch(/translateX\(-14px\)/);
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
  it("the thumb's side is a flex alignment (start = off, end = on), which the layout engine mirrors like every row", () => {
    const on = renderToStaticMarkup(<LumoNativeProvider locale="fa-IR"><Switch isSelected>اعلان‌ها</Switch></LumoNativeProvider>);
    const off = renderToStaticMarkup(<LumoNativeProvider locale="fa-IR"><Switch>اعلان‌ها</Switch></LumoNativeProvider>);
    expect(on).toMatch(/justify-content:\s*flex-end/);
    expect(off).toMatch(/justify-content:\s*flex-start/);
    expect(on).toContain('dir="rtl"');
  });
});});
