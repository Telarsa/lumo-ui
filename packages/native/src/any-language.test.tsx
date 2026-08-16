/**
 * Any language on native — the same rule as the web (decision §28): the
 * provider takes any BCP-47 tag; direction, digits and text alignment follow it;
 * every announced string is the app's own prop. German (ltr, Latin digits) and
 * Egyptian Arabic (rtl, Arabic-Indic digits) through react-native-web, graded.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { formatNumber } from "@lumo-ui/core";
import { gradeHtml } from "@lumo-ui/gate";
import { Button } from "./button.tsx";
import { LumoNativeProvider } from "./provider.tsx";
import { Select } from "./select.tsx";
import { Switch } from "./switch.tsx";
import { TextField } from "./text-field.tsx";

const page = (body: string, lang: string, dir: "rtl" | "ltr", title: string) =>
  `<!doctype html><html lang="${lang}" dir="${dir}"><head><title>${title}</title></head><body>${body}</body></html>`;

describe("native — any language", () => {
  it("German: ltr, Latin digits, German strings only; graded clean", () => {
    const html = renderToStaticMarkup(
      <LumoNativeProvider locale="de">
        <Button>{`${formatNumber(3, "de")} Einträge speichern`}</Button>
        <Switch defaultSelected description="Neuigkeiten sofort senden">Benachrichtigungen</Switch>
        <TextField label="Vollständiger Name" description="Wie im Ausweis" />
        <Select label="Leistung" placeholder="Leistung wählen" closeLabel="Schließen" options={[{ id: "web", label: "Web" }]} />
      </LumoNativeProvider>,
    );
    expect(html).toContain("3 Einträge speichern");
    expect(html).toContain('dir="ltr"');
    expect(html).toMatch(/left:\s*15px/); // the ON thumb at the reading end
    expect(html).toMatch(/text-align:\s*left/);
    expect(html).not.toMatch(/[۰-۹٠-٩]/);
    expect(gradeHtml("de/native/index.html", page(html, "de", "ltr", "Formular"))).toEqual([]);
  });
  it("Egyptian Arabic: rtl, Arabic-Indic digits from formatNumber, Arabic strings only; graded clean", () => {
    const html = renderToStaticMarkup(
      <LumoNativeProvider locale="ar-EG">
        <Button>{`حفظ ${formatNumber(3, "ar-EG")} عناصر`}</Button>
        <Switch defaultSelected description="أرسل الأخبار فور وصولها">الإشعارات</Switch>
        <TextField label="الاسم الكامل" description="كما في البطاقة" />
        <Select label="الخدمة" placeholder="اختر خدمة" closeLabel="إغلاق" options={[{ id: "web", label: "ويب" }]} />
      </LumoNativeProvider>,
    );
    expect(html).toContain("حفظ ٣ عناصر");
    expect(html).toContain('dir="rtl"');
    expect(html).toMatch(/right:\s*15px/);
    expect(html).toMatch(/text-align:\s*right/);
    expect(html).not.toMatch(/\b3\b/);
    expect(gradeHtml("ar-EG/native/index.html", page(html, "ar-EG", "rtl", "نموذج"))).toEqual([]);
  });
});
