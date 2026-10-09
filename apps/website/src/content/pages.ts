import type { Locale } from "./site";

interface MarketingPages {
  how: { title: string; lead: string; contract: string; contractBody: string; contractLink: string; lint: string; lintBody: string; lintLink: string; gate: string; gateBody: string; gateLink: string; next: string; nextBody: string; nextLink: string };
  checks: { title: string; lead: string; input: string; inputBody: string; output: string; outputBody: string; limit: string; limitBody: string; reference: string; calendar: string; calendarBody: string; calendarLink: string };
}

export const pages = {
  en: {
    how: {
      title: "Bring language correctness into your release.", lead: "Connect three small pieces to the application you already own: a locale contract, a source policy and a check of the HTML you deliver.",
      contract: "Start with the reader’s locale", contractBody: "Give the document a locale-aware root. Format displayed numbers deliberately, require the strings controls announce and mark genuinely Latin names and code. Your components and visual identity stay in your application.", contractLink: "Read the locale contract",
      lint: "Catch mistakes where they begin", lintBody: "Add Lumo’s RTL lint policy to your existing ESLint configuration. It flags physical direction utilities, raw numeric JSX children and a document root that bypasses the locale contract.", lintLink: "Connect the source policy",
      gate: "Check the build your reader receives", gateBody: "Run the gate against the generated HTML. Declare your locales and review the native-digit floors for your own pages. The report identifies the rule and affected file, so a finding leads back to a concrete fix.", gateLink: "Configure the HTML gate",
      next: "Take the first integration step.", nextBody: "The getting-started guide includes the installation, root wiring, formatter and release check. Add only the helpers your application needs.", nextLink: "Open the getting-started guide",
    },
    checks: {
      title: "Check the details translation can miss.", lead: "Lumo inspects the built HTML for concrete language and accessibility wiring defects. These are release checks you can reproduce and trace to a file.",
      input: "The input is your built HTML", inputBody: "The gate reads the bytes you supply, without starting a browser. Locale declarations and reviewed per-page floors tell it which script, direction and numeric content your application promises.",
      output: "The result points to the defect", outputBody: "A report names the failed rule and the affected output. Fix the application source, rebuild and grade again. A floor is a reviewed baseline for meaningful native numbers, not a number to lower until the build passes.",
      limit: "Keep interaction testing in the release", limitBody: "A green report proves these checks against the supplied output. It does not prove keyboard behaviour after hydration, screen-reader experience or complete accessibility. Test those in the actual application too.", reference: "Read every rule and its scope",
      calendar: "The calendar belongs to the reader", calendarBody: "A Persian label alone does not make a Gregorian date Jalali. The calendar guide includes a working picker and shows how locale-specific date props fit your existing component.", calendarLink: "Try the calendar example",
    },
  },
  de: {
    how: {
      title: "Sprachliche Korrektheit in die Freigabe integrieren.", lead: "Verbinden Sie drei kleine Teile mit Ihrer bestehenden Anwendung: einen Sprachvertrag, eine Quelltextprüfung und eine Prüfung des ausgelieferten HTML.",
      contract: "Mit der Sprache der Leser beginnen", contractBody: "Geben Sie dem Dokument eine sprachabhängige Wurzel. Formatieren Sie sichtbare Zahlen bewusst, verlangen Sie die angesagten Texte der Bedienelemente und markieren Sie tatsächlich lateinische Namen und Code. Komponenten und visuelle Identität bleiben in Ihrer Anwendung.", contractLink: "Den Sprachvertrag lesen",
      lint: "Fehler an ihrer Quelle erkennen", lintBody: "Ergänzen Sie Ihre bestehende ESLint-Konfiguration um Lumos RTL-Regeln. Sie erkennen physische Richtungs-Utilities, rohe Zahlen in JSX und eine Dokumentwurzel, die den Sprachvertrag umgeht.", lintLink: "Die Quelltextprüfung einbinden",
      gate: "Die Ausgabe für Ihre Leser prüfen", gateBody: "Prüfen Sie das erzeugte HTML mit dem Gate. Deklarieren Sie Ihre Sprachen und prüfen Sie die Mindestwerte nativer Ziffern für Ihre Seiten. Der Bericht nennt Regel und Datei und führt so zu einer konkreten Korrektur.", gateLink: "Das HTML-Gate konfigurieren",
      next: "Den ersten Integrationsschritt machen.", nextBody: "Die Anleitung enthält Installation, Dokumentwurzel, Zahlenformatierung und Freigabeprüfung. Ergänzen Sie nur die Hilfsfunktionen, die Ihre Anwendung benötigt.", nextLink: "Die Anleitung öffnen",
    },
    checks: {
      title: "Details prüfen, die Übersetzung allein übersieht.", lead: "Lumo untersucht das erzeugte HTML auf konkrete Fehler in Sprache und zugänglichen Verknüpfungen. Diese Freigabeprüfungen sind reproduzierbar und einer Datei zuzuordnen.",
      input: "Ihre HTML-Ausgabe ist die Eingabe", inputBody: "Das Gate liest die übergebenen Daten ohne Browser. Sprachdeklarationen und geprüfte Mindestwerte je Seite beschreiben die zugesagte Schrift, Richtung und numerischen Inhalte.",
      output: "Das Ergebnis zeigt den Fehler", outputBody: "Der Bericht nennt die fehlgeschlagene Regel und betroffene Ausgabe. Korrigieren Sie den Quelltext, erstellen Sie den Build erneut und prüfen Sie wieder. Mindestwerte sind geprüfte Baselines für sinnvolle native Zahlen und keine Werte, die für ein grünes Ergebnis gesenkt werden.",
      limit: "Interaktion bleibt Teil der Freigabeprüfung", limitBody: "Ein grüner Bericht belegt die ausgeführten Prüfungen der übergebenen Ausgabe. Er beweist weder Tastaturverhalten nach der Hydration noch Screenreader-Erfahrung oder vollständige Barrierefreiheit. Prüfen Sie diese Aspekte in der tatsächlichen Anwendung.", reference: "Alle Regeln und ihren Umfang lesen",
      calendar: "Der Kalender gehört zu den Lesern", calendarBody: "Eine persische Beschriftung macht ein gregorianisches Datum noch nicht zum Jalali-Datum. Die Kalenderanleitung enthält einen nutzbaren Picker und zeigt, wie sprachabhängige Props in Ihre bestehende Komponente passen.", calendarLink: "Das Kalenderbeispiel ausprobieren",
    },
  },
  fa: {
    how: {
      title: "درستی زبان را وارد فرایند انتشار کنید.", lead: "سه بخش کوچک را به برنامه‌ای که خودتان می‌سازید متصل کنید: قرارداد زبان، سیاست بررسی سورس و بررسی خروجی‌ای که به خواننده می‌رسد.",
      contract: "از زبان خواننده شروع کنید", contractBody: "ریشهٔ سند را وابسته به زبان کنید. اعداد دیدنی را آگاهانه قالب‌بندی کنید، متن‌های اعلانی کنترل‌ها را الزامی کنید و نام‌ها و کدهای واقعاً لاتین را مشخص کنید. کامپوننت‌ها و هویت بصری در برنامهٔ شما باقی می‌مانند.", contractLink: "خواندن قرارداد زبان",
      lint: "نقص را در نقطهٔ شروع پیدا کنید", lintBody: "سیاست راست‌به‌چپ لومو را به تنظیمات فعلی بررسی سورس اضافه کنید. کلاس‌های جهت فیزیکی، فرزندان عددی خام در رابط و ریشهٔ سندی که قرارداد زبان را دور می‌زند، شناسایی می‌شوند.", lintLink: "اتصال سیاست بررسی سورس",
      gate: "خروجی دریافتی خواننده را بررسی کنید", gateBody: "دروازه را روی خروجی ساخته‌شده اجرا کنید. زبان‌ها را اعلام و کف ارقام بومی صفحات خود را بازبینی کنید. گزارش، قانون و فایل متأثر را مشخص می‌کند تا هر یافته به اصلاحی مشخص برسد.", gateLink: "تنظیم دروازهٔ خروجی",
      next: "اولین گام اتصال را بردارید.", nextBody: "راهنمای شروع، نصب، اتصال ریشهٔ سند، قالب‌بندی عدد و بررسی انتشار را توضیح می‌دهد. فقط ابزارهایی را اضافه کنید که برنامهٔ شما نیاز دارد.", nextLink: "بازکردن راهنمای شروع",
    },
    checks: {
      title: "جزئیاتی را بررسی کنید که ترجمه جا می‌گذارد.", lead: "لومو خروجی ساخته‌شده را برای نقص‌های مشخص زبان و ارتباط‌های دسترس‌پذیری بررسی می‌کند. این بررسی‌های انتشار تکرارپذیرند و به یک فایل مشخص می‌رسند.",
      input: "ورودی، خروجی ساخته‌شدهٔ شماست", inputBody: "دروازه داده‌های دریافتی را بدون اجرای مرورگر می‌خواند. زبان‌های اعلام‌شده و کف‌های بازبینی‌شدهٔ هر صفحه، خط، جهت و محتوای عددی مورد انتظار برنامه را مشخص می‌کنند.",
      output: "نتیجه، محل نقص را نشان می‌دهد", outputBody: "گزارش نام قانون ناموفق و خروجی متأثر را مشخص می‌کند. سورس را اصلاح کنید، دوباره بسازید و بررسی را تکرار کنید. کف، مبنایی بازبینی‌شده برای اعداد بومی معنادار است؛ عددی نیست که برای قبولی کاهش بدهید.",
      limit: "بررسی تعامل را در انتشار نگه دارید", limitBody: "گزارش سبز، اجرای همین بررسی‌ها روی خروجی دریافتی را ثابت می‌کند. رفتار صفحه‌کلید پس از فعال‌شدن رابط، تجربهٔ صفحه‌خوان یا دسترس‌پذیری کامل را تضمین نمی‌کند. این موارد را در برنامهٔ واقعی هم آزمایش کنید.", reference: "خواندن همهٔ قوانین و دامنهٔ آن‌ها",
      calendar: "تقویم متعلق به خواننده است", calendarBody: "برچسب فارسی به‌تنهایی تاریخ میلادی را جلالی نمی‌کند. راهنمای تقویم، انتخابگر قابل‌استفاده دارد و نشان می‌دهد تنظیمات تاریخ وابسته به زبان چگونه به کامپوننت فعلی شما متصل می‌شوند.", calendarLink: "امتحان‌کردن نمونهٔ تقویم",
    },
  },
} as const satisfies Record<Locale, MarketingPages>;
