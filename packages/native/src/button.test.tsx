/**
 * The native Button's first byte — rendered through react-native-web to static
 * markup and graded by the same 14 served-HTML rules every web component meets.
 * A browser rendering is NOT a device run (that is the ICU probe's job); what it
 * proves is the CONTRACT: role, name, disabled state, Persian text, formatted
 * digits, direction from the locale.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { formatNumber } from "@lumo-ui/core";
import { gradeHtml } from "@lumo-ui/gate";
import { Text } from "react-native";
import { Button, IconButton } from "./button.tsx";
import { LumoNativeProvider } from "./provider.tsx";
import { ACHROMATIC, darkColours, lightColours, oklch, control } from "./tokens.ts";

const page = (body: string, locale: "fa-IR" | "en-US" = "fa-IR") =>
  `<!doctype html><html lang="${locale}" dir="${locale === "fa-IR" ? "rtl" : "ltr"}"><head><title>${locale === "fa-IR" ? "دکمه" : "Button"}</title></head><body>${body}</body></html>`;

describe("native Button — first byte under fa-IR (react-native-web rendering)", () => {
  const html = renderToStaticMarkup(
    <LumoNativeProvider locale="fa-IR">
      <Button onPress={() => undefined}>ذخیره</Button>
      <Button variant="outline" isDisabled>
        {`${formatNumber(3, "fa-IR")} مورد`}
      </Button>
      <IconButton label="بستن">
        <Text>✕</Text>
      </IconButton>
    </LumoNativeProvider>,
  );

  it("renders a real button role, the Persian label as its name, and disabled as an announced state", () => {
    expect(html.match(/role="button"/g)?.length).toBe(3);
    expect(html).toContain("ذخیره");
    expect(html).toMatch(/aria-disabled="true"/);
    expect(html).toContain('aria-label="بستن"');
    expect(html).not.toMatch(/\b[0-9]+ مورد/); // digits went through formatNumber
    expect(html).toContain("۳ مورد");
  });

  it("carries the writing direction of the locale on its text", () => {
    expect(html).toMatch(/direction:\s*rtl|writing-direction|dir="rtl"|unicode-bidi/);
  });

  it("passes the served-HTML gate with zero violations", () => {
    const violations = gradeHtml("fa-IR/native/button.html", page(html)).map((v) => `${v.rule}: ${v.detail}`);
    expect(violations).toEqual([]);
  });

  it("under en-US the same tree is ltr and still a named button", () => {
    const en = renderToStaticMarkup(
      <LumoNativeProvider locale="en-US">
        <Button>Save</Button>
      </LumoNativeProvider>,
    );
    expect(en).toContain('role="button"');
    expect(en).toContain("Save");
    expect(gradeHtml("en-US/native/button.html", page(en, "en-US"))).toEqual([]);
  });
});

describe("native tokens — derived from tokens.css, not typed by hand", () => {
  it("achromatic neutrals resolve to greys; light and dark differ; a brand hue tints the accent only", () => {
    expect(oklch(0.985, 0, 0)).toBe("#fafafa");
    expect(oklch(0.145, 0, 0)).toBe("#0a0a0a");
    const light = lightColours(ACHROMATIC), dark = darkColours(ACHROMATIC);
    expect(light.fg).not.toBe(dark.fg);
    expect(light.bg).not.toBe(dark.bg);
    const branded = lightColours({ ...ACHROMATIC, hue: 30, chroma: 0.19 });
    expect(branded.accent).not.toBe(light.accent);
    expect(branded.fg).toBe(light.fg);
  });
  it("control heights are the web's control scale at density 0.9", () => {
    expect(control).toEqual({ sm: 29, md: 36, lg: 44 });
  });
});
