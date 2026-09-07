import { stringsFor, type LumoStrings } from "lumo-ui/core";
import type { SiteLocale } from "./locales";

// German is authored by this consumer; it is not a built-in Lumo locale.
const de: LumoStrings = {
  numberField: { decrease: label => `${label} verringern`, increase: label => `${label} erhöhen`, roleDescription: "Zahlenfeld" },
  dateField: { year: "Jahr", month: "Monat", day: "Tag", hour: "Stunde", minute: "Minute", second: "Sekunde", dayPeriod: "Tageshälfte", empty: "leer" },
  calendar: { nav: "Monatsnavigation", previous: "Voriger Monat", next: "Nächster Monat", monthDropdown: "Monat auswählen", yearDropdown: "Jahr auswählen", weekNumberHeader: "Kalenderwoche", week: "Woche", today: date => `Heute, ${date}` },
  tree: { expand: "Aufklappen", collapse: "Zuklappen" }, chart: { roleDescription: "Diagramm" },
  phoneInput: { countries: { IR: "Iran", AE: "Vereinigte Arabische Emirate", TR: "Türkei", IQ: "Irak", AF: "Afghanistan", DE: "Deutschland", GB: "Vereinigtes Königreich", US: "Vereinigte Staaten", CA: "Kanada" } },
};
export function siteStrings(locale: SiteLocale): LumoStrings {
  return locale === "de" ? de : stringsFor(locale === "fa" ? "fa-IR" : "en-US");
}
