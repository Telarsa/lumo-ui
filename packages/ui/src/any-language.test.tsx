/**
 * ANY LANGUAGE (decision §28). Lumo carries strings for `fa-IR` and `en-US`; a
 * consumer's German or Arabic app brings its own, complete, through
 * `LumoProvider`'s `strings`, and every component then announces THOSE words —
 * never English, never Persian — while digits, calendar and direction come
 * from the tag through `Intl` and `direction()`. This file is the proof: a
 * German set and an Arabic set, written here in full, and the served markup
 * of the components that hold announced strings of their own (NumberField,
 * Calendar, DateField, Tree, PhoneInput). The last test is the refusal: a
 * language without strings throws at render, loudly, instead of falling back.
 */

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CalendarDate } from "@internationalized/date";
import { LumoHtml, direction, formatNumber } from "@lumo-ui/core";
import { gradeHtml } from "../../gate/src/index.ts";
import { Calendar } from "./calendar.tsx";
import { DateField } from "./date-field.tsx";
import type { LumoAppStrings } from "./locale.ts";
import { NumberField } from "./number-field.tsx";
import { PhoneInput } from "./phone-input.tsx";
import { LumoProvider } from "./provider.tsx";
import { Tree, TreeItem } from "./tree.tsx";

/** German — every key, no English. `LumoAppStrings` makes a missing one a compile error. */
const de: LumoAppStrings = {
  numberField: {
    decrease: (l) => `${l} verringern`,
    increase: (l) => `${l} erhöhen`,
    roleDescription: "Zahlenfeld",
  },
  dateField: {
    year: "Jahr",
    month: "Monat",
    day: "Tag",
    hour: "Stunde",
    minute: "Minute",
    second: "Sekunde",
    dayPeriod: "Tageshälfte",
    empty: "Leer",
  },
  calendar: {
    nav: "Monatsnavigation",
    previous: "Zum vorigen Monat",
    next: "Zum nächsten Monat",
    monthDropdown: "Monat wählen",
    yearDropdown: "Jahr wählen",
    weekNumberHeader: "Kalenderwoche",
    week: "Woche",
    today: (date) => `Heute, ${date}`,
  },
  tree: { expand: "Aufklappen", collapse: "Zuklappen" },
  chart: { roleDescription: "Diagramm" },
  phoneInput: {
    countries: { IR: "Iran", AE: "Vereinigte Arabische Emirate", TR: "Türkei", IQ: "Irak", AF: "Afghanistan", DE: "Deutschland", GB: "Vereinigtes Königreich", US: "Vereinigte Staaten", CA: "Kanada" },
  },
  engine: {
    numberField: { roleDescription: "Zahlenfeld", increase: "Erhöhen", decrease: "Verringern" },
    progress: { indeterminate: "unbestimmter Fortschritt" },
    slider: { rangeStart: (v) => `${v} Bereichsanfang`, rangeEnd: (v) => `${v} Bereichsende` },
    toast: { viewport: "Benachrichtigungen" },
  },
};

/** Arabic (Egypt) — every key, no English, no Persian. */
const ar: LumoAppStrings = {
  numberField: {
    decrease: (l) => `إنقاص ${l}`,
    increase: (l) => `زيادة ${l}`,
    roleDescription: "حقل رقمي",
  },
  dateField: {
    year: "السنة",
    month: "الشهر",
    day: "اليوم",
    hour: "الساعة",
    minute: "الدقيقة",
    second: "الثانية",
    dayPeriod: "صباحًا أو مساءً",
    empty: "فارغ",
  },
  calendar: {
    nav: "التنقل بين الشهور",
    previous: "الشهر السابق",
    next: "الشهر التالي",
    monthDropdown: "اختيار الشهر",
    yearDropdown: "اختيار السنة",
    weekNumberHeader: "رقم الأسبوع",
    week: "الأسبوع",
    today: (date) => `اليوم، ${date}`,
  },
  tree: { expand: "توسيع", collapse: "طي" },
  chart: { roleDescription: "مخطط" },
  phoneInput: {
    countries: { IR: "إيران", AE: "الإمارات", TR: "تركيا", IQ: "العراق", AF: "أفغانستان", DE: "ألمانيا", GB: "المملكة المتحدة", US: "الولايات المتحدة", CA: "كندا" },
  },
  engine: {
    numberField: { roleDescription: "حقل رقمي", increase: "زيادة", decrease: "إنقاص" },
    progress: { indeterminate: "تقدم غير محدد" },
    slider: { rangeStart: (v) => `${v} بداية النطاق`, rangeEnd: (v) => `${v} نهاية النطاق` },
    toast: { viewport: "الإشعارات" },
  },
};

const TODAY = new CalendarDate(2026, 8, 16);

/** The five components with announced strings of their own, under one locale, as a whole served document. */
function page(locale: string, strings: LumoAppStrings, t: {
  count: string; date: string; files: string; folder: string; file: string; phone: string; country: string; calendar: string;
}) {
  return renderToStaticMarkup(
    <LumoHtml lang={locale}>
      <body>
        <LumoProvider locale={locale} strings={strings}>
          <NumberField
            label={t.count}
            roleDescription={strings.numberField.roleDescription}
            incrementLabel={strings.numberField.increase(t.count)}
            decrementLabel={strings.numberField.decrease(t.count)}
            defaultValue={1234}
          />
          <Calendar label={t.calendar} locale={locale} today={TODAY} defaultMonth={TODAY} />
          <DateField label={t.date} />
          <Tree label={t.files} selectionMode="single">
            <TreeItem id="folder" textValue={t.folder} title={t.folder}>
              <TreeItem id="file" textValue={t.file} title={t.file} />
            </TreeItem>
          </Tree>
          <PhoneInput label={t.phone} countryLabel={t.country} locale={locale} defaultCountry="DE" value="+4915112345678" />
        </LumoProvider>
      </body>
    </LumoHtml>,
  );
}

const spoken = (html: string) =>
  [...html.matchAll(/(?:aria-label|aria-roledescription|aria-valuetext)="([^"]*)"/g)].map((m) => m[1] as string);

/**
 * Grades a whole document with the gate, when the gate grades that language.
 * The gate is being opened to every tag by a parallel change; until it lands,
 * "No grading rules for locale" is the one message that means "not yet", and
 * only that one is skipped. Anything else is a real finding.
 */
function grade(path: string, html: string): readonly string[] | "pending-gate" {
  try {
    return gradeHtml(path, html).map((v) => `${v.rule}: ${v.detail ?? ""}`);
  } catch (error) {
    if (error instanceof Error && /No grading rules for locale/.test(error.message)) return "pending-gate";
    throw error;
  }
}

describe("a German app: its own strings, Latin digits, ltr — nothing of Lumo's two languages", () => {
  const html = page("de", de, {
    count: "Anzahl", date: "Reisedatum", files: "Projektdateien", folder: "Dokumente", file: "Bericht", phone: "Mobilnummer", country: "Land", calendar: "Reisedatum",
  });

  it("announces the German words the app brought, in every family", () => {
    // NumberField: the roleDescription prop and the two stepper names.
    expect(html).toContain('aria-roledescription="Zahlenfeld"');
    expect(html).toContain('aria-label="Anzahl erhöhen"');
    expect(html).toContain('aria-label="Anzahl verringern"');
    // Calendar chrome, from `LumoStrings["calendar"]`.
    expect(html).toContain('aria-label="Monatsnavigation"');
    expect(html).toContain('aria-label="Zum vorigen Monat"');
    expect(html).toContain('aria-label="Zum nächsten Monat"');
    expect(html).toContain("Heute, ");
    // DateField segments, from `LumoStrings["dateField"]`.
    expect(html).toContain('aria-label="Jahr"');
    expect(html).toContain('aria-label="Monat"');
    expect(html).toContain('aria-label="Tag"');
    expect(html).toContain('aria-valuetext="Leer"');
    // Tree marker, from `LumoStrings["tree"]` (a collapsed parent says "expand").
    expect(html).toContain('aria-label="Aufklappen"');
    // PhoneInput country name, from `LumoStrings["phoneInput"].countries`.
    expect(html).toContain("Deutschland +49");
  });

  it("says nothing in English or Persian in any announced string", () => {
    const heard = spoken(html);
    expect(heard.length).toBeGreaterThan(10);
    for (const word of ["Expand", "Collapse", "Empty", "Number field", "Today", "Month navigation", "Germany", "Increase", "Decrease"]) {
      expect(heard, `English "${word}" leaked into an announced string`).not.toContain(word);
    }
    // No Arabic-script character anywhere: Persian did not leak either.
    expect(html).not.toMatch(/\p{Script=Arabic}/u);
  });

  it("formats in Latin digits and derives ltr from the tag", () => {
    expect(direction("de")).toBe("ltr");
    expect(html).toContain('<html lang="de" dir="ltr"');
    // Base UI's number field serves the value formatted for `de`: a Latin "1.234".
    expect(html).toContain('value="1.234"');
    // The calendar's grid states its direction from the same tag.
    expect(html).toContain('dir="ltr"');
    // No Persian digit anywhere in the German page.
    expect(html).not.toMatch(/[۰-۹]/);
    expect(formatNumber(1234, "de")).toBe("1.234");
  });

  it("passes the gate as a German page (or the gate is not there yet)", () => {
    const result = grade("de/any-language.html", html);
    if (result === "pending-gate") return; // see `grade`
    // Every rule, not a subset: a well-formed German page has nothing for the gate to say.
    expect(result).toEqual([]);
  });
});

describe("an Arabic (ar-EG) app: its own strings, Arabic-Indic digits, rtl", () => {
  const html = page("ar-EG", ar, {
    count: "العدد", date: "تاريخ السفر", files: "ملفات المشروع", folder: "المستندات", file: "التقرير", phone: "رقم الجوال", country: "الدولة", calendar: "تاريخ السفر",
  });

  it("announces the Arabic words the app brought", () => {
    expect(html).toContain('aria-roledescription="حقل رقمي"');
    expect(html).toContain('aria-label="زيادة العدد"');
    expect(html).toContain('aria-label="التنقل بين الشهور"');
    expect(html).toContain('aria-label="السنة"');
    expect(html).toContain('aria-valuetext="فارغ"');
    expect(html).toContain('aria-label="توسيع"');
    expect(html).toContain("ألمانيا +");
  });

  it("formats in Arabic-Indic digits from `formatNumber` and derives rtl from the tag", () => {
    expect(direction("ar-EG")).toBe("rtl");
    expect(html).toContain('<html lang="ar-EG" dir="rtl"');
    // The digits `Intl` gives Egypt's Arabic: ٠–٩ (U+0660–U+0669), not Persian ۰–۹ and not Latin.
    const arabicIndic = formatNumber(1234, "ar-EG");
    expect(arabicIndic).toMatch(/^[٠-٩][٠-٩٬,]*$/u);
    expect(html).toContain(`value="${arabicIndic}"`);
    expect(html).toContain("+٤٩");
    // The calendar's day cells carry the same digits.
    expect(html).toMatch(/[٠-٩]/u);
    expect(html).not.toMatch(/[۰-۹]/u);
  });

  it("says nothing in English or Persian in any announced string", () => {
    const heard = spoken(html);
    expect(heard.length).toBeGreaterThan(10);
    // The one exception is the "+" dial code inside the phone input's Latin island; every other announced string is Arabic script.
    for (const s of heard) {
      expect(s, `English or Persian leaked into ${JSON.stringify(s)}`).not.toMatch(/[A-Za-z]{2,}|[۰-۹]/u);
    }
  });

  it("passes the gate as an Arabic page (or the gate is not there yet)", () => {
    const result = grade("ar-EG/any-language.html", html);
    if (result === "pending-gate") return; // see `grade`
    // Every rule: direction, digits, script of every announced string, calendar, ids.
    expect(result).toEqual([]);
  });
});

describe("the refusal: a language without strings does not render", () => {
  it("throws 'Lumo carries no strings' instead of announcing another language", () => {
    // `strings` is REQUIRED by the type for a non-built-in tag; a JavaScript caller
    // (or a cast) that omits it hits the runtime wall in the first component that asks.
    const Bare = LumoProvider as unknown as (props: { locale: string; children: React.ReactNode }) => React.ReactElement;
    expect(() =>
      renderToStaticMarkup(
        <Bare locale="de">
          <DateField label="Reisedatum" />
        </Bare>,
      ),
    ).toThrow(/Lumo carries no strings for "de"/);
    expect(() =>
      renderToStaticMarkup(
        <Bare locale="de">
          <Tree label="Dateien"><TreeItem id="a" textValue="a" title="a" /></Tree>
        </Bare>,
      ),
    ).toThrow(/Lumo carries no strings for "de"/);
    // A component with its OWN `locale` prop asks the same question of THAT tag.
    expect(() =>
      renderToStaticMarkup(<Calendar label="Reisedatum" locale="de" today={TODAY} />),
    ).toThrow(/Lumo carries no strings for "de"/);
    // …and never borrows another language's set: the provider speaks German, the calendar asks for French.
    expect(() =>
      renderToStaticMarkup(
        <LumoProvider locale="de" strings={de}>
          <Calendar label="Date" locale="fr" today={TODAY} />
        </LumoProvider>,
      ),
    ).toThrow(/Lumo carries no strings for "fr"/);
    // A built-in tag under a foreign provider still resolves itself.
    expect(
      renderToStaticMarkup(
        <LumoProvider locale="de" strings={de}>
          <Calendar label="تاریخ" locale="fa-IR" today={TODAY} />
        </LumoProvider>,
      ),
    ).toContain('aria-label="پیمایش ماه‌ها"');
  });
});
