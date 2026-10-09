export interface Copy {
  description: string;
  skip: string;
  nav: { label: string; how: string; rules: string; docs: string; start: string };
  language: string;
  /** Accessible name per stored setting: the current mode, then what a press does. */
  theme: { system: string; light: string; dark: string };
  hero: { eyebrow: string; title: string; accent: string; lead: string; source: string; licence: string; version: string };
  figure: { title: string; contract: string; lint: string; html: string; result: string; caption: string; digits: string; calendar: string; names: string };
  features: { eyebrow: string; title: string; lead: string; items: readonly { title: string; body: string; detail: string }[] };
  workflow: { eyebrow: string; title: string; lead: string; steps: readonly { title: string; body: string }[]; install: string };
  rules: { eyebrow: string; title: string; lead: string; count: string; groups: readonly { title: string; body: string; ids: readonly string[] }[]; all: string };
  platforms: { eyebrow: string; title: string; web: { title: string; body: string; link: string }; mobile: { title: string; body: string; link: string } };
  questions: { title: string; items: readonly { question: string; answer: string }[] };
  closing: { title: string; lead: string; docs: string };
  footer: { by: string; lead: string; source: string; legal: string; privacy: string; licence: string };
}

export const copy = {
  en: {
    description: "A locale contract, RTL lint policy and served-HTML gate for Persian products built on shadcn/ui and Material/Flutter.",
    skip: "Skip to content",
    nav: { label: "Main navigation", how: "How it works", rules: "What it checks", docs: "Documentation", start: "Get started" },
    language: "Choose language",
    theme: { system: "Theme: follows system. Switch to light.", light: "Theme: light. Switch to dark.", dark: "Theme: dark. Switch to follow system." },
    hero: {
      eyebrow: "Correctness for Persian products",
      title: "Build the interface.",
      accent: "Check what reaches the reader.",
      lead: "Your components handle the interface. Lumo helps you catch the wrong digits, calendars, direction and accessible names in the output you actually ship.",
      source: "View the source", licence: "Open source · MIT", version: "Release",
    },
    figure: { title: "From your app to your reader", contract: "Locale contract", lint: "Source checks", html: "Built HTML", result: "Reader-ready output", caption: "Checks across your source and built output. Your components stay yours.", digits: "Native digits", calendar: "Reader’s calendar", names: "Named controls" },
    features: {
      eyebrow: "Keep your stack", title: "A correctness layer. Your own interface.",
      lead: "Keep building with the components your team knows. Lumo adds language contracts and checks where a translated label alone is not enough.",
      items: [
        { title: "Make locale explicit", body: "Derive direction from the reader’s language, format numbers for that locale and require the strings your controls announce.", detail: "A typed contract" },
        { title: "Catch defects in source", body: "Check for physical direction utilities, raw numeric children and an incorrectly declared document language before a build ships.", detail: "An RTL lint policy" },
        { title: "Grade the delivered output", body: "Read the built HTML for script, calendar and accessibility wiring defects. The check works without running a browser.", detail: "A served-byte gate" },
      ],
    },
    workflow: {
      eyebrow: "How it works", title: "Install. Connect. Check.", lead: "Start with the locale contract, then make the built output part of your release checks.",
      steps: [
        { title: "Pin the release", body: "Install the public GitHub package with pnpm. The version stays deliberate and repeatable." },
        { title: "Connect your locale", body: "Use the locale-aware document root and number formatter. Mark names and code that are genuinely Latin." },
        { title: "Check your build", body: "Give the static HTML to the gate with declared locales and reviewed floors. Fix its findings in your application." },
      ], install: "Install the public package",
    },
    rules: {
      eyebrow: "What it checks", title: "Small defects. Real consequences.", lead: "The gate checks concrete details that can survive an otherwise translated interface. Its report points to the rule and the affected output.", count: "served-HTML rules",
      groups: [
        { title: "Script and digits", body: "Visible text, announced names and numbers should use the reader’s script. Deliberate Latin exceptions are checked too.", ids: ["no-latin-digits", "native-script-name", "latn-island-purity"] },
        { title: "Direction and calendar", body: "The document’s language and direction must agree. A translated date must still be in the right calendar.", ids: ["lang-dir", "native-calendar"] },
        { title: "Names and references", body: "Controls need names, referenced labels need to exist and IDs need to be unique.", ids: ["named-controls", "resolved-idrefs", "unique-ids"] },
        { title: "Keyboard entry points", body: "Composite widgets need a usable tab stop in the HTML a reader receives, before hydration.", ids: ["composite-tab-stop", "composite-single-tab-stop"] },
      ], all: "Read the complete rule reference",
    },
    platforms: {
      eyebrow: "Web and mobile", title: "One language principle. Different platforms.",
      web: { title: "Your web components", body: "Use the locale contract and HTML gate with your application. Jalali calendar props fit shadcn’s existing Calendar; Base UI helpers address supported first-byte cases.", link: "Web setup" },
      mobile: { title: "Your Flutter application", body: "Keep Material’s widgets. Lumo UI Mobile carries the locale contract, generated language styles and its own semantics grader.", link: "Mobile guide" },
    },
    questions: { title: "Before you adopt it", items: [
      { question: "Will Lumo replace our components or visual design?", answer: "No. Your application owns its components and brand. Lumo supplies language contracts, helpers and checks; it is not a component library." },
      { question: "Is a green gate a complete accessibility review?", answer: "No. It proves the checks run against the supplied output. Keyboard interaction, assistive technology and broader accessibility still need their own testing." },
      { question: "Can we install it from npm?", answer: "Lumo is currently installed from its public GitHub repository using a pinned release tag and pnpm. The getting-started guide explains the required wiring." },
    ] },
    closing: { title: "Make language correctness part of your build.", lead: "Read the integration guide, connect the pieces you need and check what your readers receive.", docs: "Read the documentation" },
    footer: { by: "Built by Telarsa", lead: "The correctness layer for Persian products.", source: "Source on GitHub", legal: "Legal notice", privacy: "Privacy", licence: "Public library · MIT licence" },
  },
  de: {
    description: "Ein Sprachvertrag, RTL-Lint-Regeln und ein Gate für ausgeliefertes HTML persischer Produkte auf shadcn/ui und Material/Flutter.",
    skip: "Zum Inhalt springen",
    nav: { label: "Hauptnavigation", how: "So funktioniert es", rules: "Was geprüft wird", docs: "Dokumentation", start: "Erste Schritte" },
    language: "Sprache wählen", theme: { system: "Design: folgt dem System. Zu hell wechseln.", light: "Design: hell. Zu dunkel wechseln.", dark: "Design: dunkel. Wieder dem System folgen." },
    hero: { eyebrow: "Korrektheit für persische Produkte", title: "Die Oberfläche gestalten.", accent: "Prüfen, was Leser erhalten.", lead: "Ihre Komponenten gestalten die Oberfläche. Lumo hilft, falsche Ziffern, Kalender, Schreibrichtung und zugängliche Namen in der tatsächlich ausgelieferten Ausgabe zu erkennen.", source: "Quelltext ansehen", licence: "Open Source · MIT", version: "Version" },
    figure: { title: "Von Ihrer Anwendung zu Ihren Lesern", contract: "Sprachvertrag", lint: "Quelltextprüfung", html: "Erstelltes HTML", result: "Ausgabe für Ihre Leser", caption: "Prüfungen im Quelltext und in der Build-Ausgabe. Ihre Komponenten bleiben Ihre.", digits: "Native Ziffern", calendar: "Passender Kalender", names: "Benannte Elemente" },
    features: { eyebrow: "Ihre Werkzeuge behalten", title: "Eine Korrektheitsschicht. Ihre eigene Oberfläche.", lead: "Bauen Sie weiter mit den Komponenten, die Ihr Team kennt. Lumo ergänzt Sprachverträge und Prüfungen, wo eine übersetzte Beschriftung allein nicht genügt.", items: [
      { title: "Die Sprache ausdrücklich festlegen", body: "Leiten Sie die Schreibrichtung aus der Sprache ab, formatieren Sie Zahlen passend und verlangen Sie die Texte, die Ihre Elemente ansagen.", detail: "Ein typisierter Vertrag" },
      { title: "Fehler im Quelltext erkennen", body: "Prüfen Sie physische Richtungs-Utilities, rohe Zahlen im JSX und eine falsch deklarierte Dokumentsprache vor der Auslieferung.", detail: "RTL-Lint-Regeln" },
      { title: "Die ausgelieferte Ausgabe prüfen", body: "Lesen Sie das erstellte HTML auf Fehler in Schrift, Kalender und zugänglichen Verknüpfungen. Die Prüfung benötigt keinen Browser.", detail: "Ein Gate für ausgeliefertes HTML" },
    ] },
    workflow: { eyebrow: "So funktioniert es", title: "Installieren. Verbinden. Prüfen.", lead: "Beginnen Sie mit dem Sprachvertrag und machen Sie die Build-Ausgabe zu einem Teil Ihrer Freigabeprüfungen.", steps: [
      { title: "Die Version festschreiben", body: "Installieren Sie das öffentliche GitHub-Paket mit pnpm. So bleibt die Version bewusst gewählt und reproduzierbar." },
      { title: "Die Sprache verbinden", body: "Verwenden Sie die sprachabhängige Dokumentwurzel und Zahlenformatierung. Markieren Sie tatsächlich lateinische Namen und Code." },
      { title: "Den Build prüfen", body: "Übergeben Sie das statische HTML mit deklarierten Sprachen und geprüften Mindestwerten an das Gate. Beheben Sie Befunde in Ihrer Anwendung." },
    ], install: "Das öffentliche Paket installieren" },
    rules: { eyebrow: "Was geprüft wird", title: "Kleine Fehler. Spürbare Folgen.", lead: "Das Gate prüft konkrete Details, die in einer ansonsten übersetzten Oberfläche verbleiben können. Der Bericht nennt Regel und betroffene Ausgabe.", count: "Regeln für ausgeliefertes HTML", groups: [
      { title: "Schrift und Ziffern", body: "Sichtbare Texte, angesagte Namen und Zahlen sollen die Schrift der Leser verwenden. Bewusste lateinische Ausnahmen werden ebenfalls geprüft.", ids: ["no-latin-digits", "native-script-name", "latn-island-purity"] },
      { title: "Richtung und Kalender", body: "Dokumentsprache und Schreibrichtung müssen übereinstimmen. Ein übersetztes Datum muss trotzdem im passenden Kalender stehen.", ids: ["lang-dir", "native-calendar"] },
      { title: "Namen und Verweise", body: "Elemente brauchen Namen, referenzierte Beschriftungen müssen existieren und IDs müssen eindeutig sein.", ids: ["named-controls", "resolved-idrefs", "unique-ids"] },
      { title: "Einstieg mit der Tastatur", body: "Zusammengesetzte Widgets benötigen einen nutzbaren Tab-Stopp im ausgelieferten HTML, bereits vor der Hydration.", ids: ["composite-tab-stop", "composite-single-tab-stop"] },
    ], all: "Die vollständige Regelreferenz lesen" },
    platforms: { eyebrow: "Web und Mobil", title: "Ein Sprachprinzip. Verschiedene Plattformen.", web: { title: "Ihre Webkomponenten", body: "Verwenden Sie Sprachvertrag und HTML-Gate in Ihrer Anwendung. Jalali-Kalender-Props passen in den bestehenden Calendar von shadcn; Base-UI-Helfer behandeln unterstützte Fälle der ersten Ausgabe.", link: "Web-Einrichtung" }, mobile: { title: "Ihre Flutter-Anwendung", body: "Behalten Sie die Widgets von Material. Lumo UI Mobile liefert den Sprachvertrag, generierte Sprachstile und einen eigenen Semantikprüfer.", link: "Mobile-Anleitung" } },
    questions: { title: "Vor der Einführung", items: [
      { question: "Ersetzt Lumo unsere Komponenten oder unser Design?", answer: "Nein. Ihre Anwendung behält ihre Komponenten und Marke. Lumo liefert Sprachverträge, Hilfsfunktionen und Prüfungen; es ist keine Komponentenbibliothek." },
      { question: "Ist ein grünes Gate eine vollständige Barrierefreiheitsprüfung?", answer: "Nein. Es belegt die ausgeführten Prüfungen der übergebenen Ausgabe. Tastaturbedienung, assistive Technologien und weitere Aspekte der Barrierefreiheit brauchen eigene Tests." },
      { question: "Können wir Lumo über npm installieren?", answer: "Lumo wird derzeit mit pnpm aus dem öffentlichen GitHub-Repository über einen festgelegten Release-Tag installiert. Die Anleitung erklärt die nötige Einbindung." },
    ] },
    closing: { title: "Sprachliche Korrektheit im Build verankern.", lead: "Lesen Sie die Anleitung, verbinden Sie die benötigten Teile und prüfen Sie, was Ihre Leser erhalten.", docs: "Dokumentation lesen" },
    footer: { by: "Entwickelt von Telarsa", lead: "Die Korrektheitsschicht für persische Produkte.", source: "Quelltext auf GitHub", legal: "Impressum", privacy: "Datenschutz", licence: "Öffentliche Bibliothek · MIT-Lizenz" },
  },
  fa: {
    description: "قرارداد زبانی، سیاست بررسی راست‌به‌چپ و دروازهٔ بررسی خروجی HTML برای محصولات فارسی بر پایهٔ shadcn/ui و Material/Flutter.",
    skip: "پرش به محتوا",
    nav: { label: "ناوبری اصلی", how: "روش کار", rules: "چه چیزهایی بررسی می‌شود", docs: "مستندات", start: "شروع کنید" },
    language: "انتخاب زبان", theme: { system: "پوسته: مطابق سیستم. تغییر به روشن.", light: "پوسته: روشن. تغییر به تاریک.", dark: "پوسته: تاریک. بازگشت به پیروی از سیستم." },
    hero: { eyebrow: "درستی برای محصولات فارسی", title: "رابط را بسازید.", accent: "آنچه به خواننده می‌رسد را بررسی کنید.", lead: "کامپوننت‌های شما رابط را می‌سازند. لومو کمک می‌کند رقم، تقویم، جهت و نام دسترس‌پذیر نادرست را در خروجی‌ای پیدا کنید که واقعاً منتشر می‌کنید.", source: "دیدن کد منبع", licence: "متن‌باز · [[MIT]]", version: "نسخهٔ" },
    figure: { title: "از برنامهٔ شما تا خواننده", contract: "قرارداد زبان", lint: "بررسی سورس", html: "خروجی ساخت", result: "خروجی آمادهٔ خواننده", caption: "بررسی سورس و خروجی ساخت؛ کامپوننت‌ها همچنان متعلق به شما هستند.", digits: "ارقام بومی", calendar: "تقویم خواننده", names: "کنترل‌های نام‌دار" },
    features: { eyebrow: "ابزارهایتان را نگه دارید", title: "لایهٔ درستی؛ رابطی که خودتان می‌سازید.", lead: "با کامپوننت‌هایی ادامه دهید که تیم شما می‌شناسد. لومو قرارداد زبان و بررسی‌هایی را اضافه می‌کند که ترجمهٔ یک برچسب به‌تنهایی کافی نیست.", items: [
      { title: "زبان را صریح مشخص کنید", body: "جهت را از زبان خواننده به دست آورید، اعداد را متناسب با همان زبان قالب‌بندی کنید و متن‌های اعلانی کنترل‌ها را الزامی کنید.", detail: "قرارداد تایپ‌شده" },
      { title: "نقص را در سورس پیدا کنید", body: "کلاس‌های جهت فیزیکی، اعداد خام در فرزندان رابط و زبان نادرست سند را پیش از انتشار بررسی کنید.", detail: "سیاست بررسی راست‌به‌چپ" },
      { title: "خروجی منتشرشده را بسنجید", body: "خروجی ساخته‌شده را برای نقص خط، تقویم و ارتباط‌های دسترس‌پذیری بخوانید. این بررسی بدون اجرای مرورگر انجام می‌شود.", detail: "دروازهٔ خروجی منتشرشده" },
    ] },
    workflow: { eyebrow: "روش کار", title: "نصب کنید. متصل کنید. بررسی کنید.", lead: "از قرارداد زبان شروع کنید و سپس بررسی خروجی ساخت را به مرحلهٔ انتشار اضافه کنید.", steps: [
      { title: "نسخه را ثابت کنید", body: "بستهٔ عمومی گیت‌هاب را با ابزار نصب معرفی‌شده در مستندات نصب کنید. نسخه به‌صورت آگاهانه و تکرارپذیر انتخاب می‌شود." },
      { title: "زبان را متصل کنید", body: "ریشهٔ سند وابسته به زبان و قالب‌بندی اعداد را به کار بگیرید. نام‌ها و کدهایی را که واقعاً لاتین هستند مشخص کنید." },
      { title: "ساخت را بررسی کنید", body: "خروجی استاتیک را با زبان‌های اعلام‌شده و کف‌های بازبینی‌شده به دروازه بدهید. یافته‌ها را در برنامهٔ خود اصلاح کنید." },
    ], install: "نصب بستهٔ عمومی" },
    rules: { eyebrow: "چه چیزهایی بررسی می‌شود", title: "نقص‌های کوچک؛ پیامدهای واقعی.", lead: "دروازه جزئیاتی را بررسی می‌کند که ممکن است در یک رابط ترجمه‌شده باقی بمانند. گزارش، قانون و خروجی متأثر را مشخص می‌کند.", count: "قانون روی خروجی منتشرشده", groups: [
      { title: "خط و ارقام", body: "متن دیدنی، نام اعلانی و عدد باید به خط خواننده باشند. استثناهای عمدی لاتین هم بررسی می‌شوند.", ids: ["no-latin-digits", "native-script-name", "latn-island-purity"] },
      { title: "جهت و تقویم", body: "زبان و جهت سند باید هماهنگ باشند. تاریخ ترجمه‌شده هم باید در تقویم درست باشد.", ids: ["lang-dir", "native-calendar"] },
      { title: "نام‌ها و ارجاع‌ها", body: "کنترل به نام نیاز دارد؛ برچسب ارجاع‌شده باید وجود داشته باشد و شناسه‌ها باید یکتا باشند.", ids: ["named-controls", "resolved-idrefs", "unique-ids"] },
      { title: "ورود با صفحه‌کلید", body: "ویجت‌های ترکیبی به نقطهٔ ورود قابل‌استفاده در خروجی دریافتی نیاز دارند؛ حتی پیش از فعال‌شدن رابط.", ids: ["composite-tab-stop", "composite-single-tab-stop"] },
    ], all: "خواندن مرجع کامل قوانین" },
    platforms: { eyebrow: "وب و موبایل", title: "یک اصل زبانی؛ بسترهای متفاوت.", web: { title: "کامپوننت‌های وب شما", body: "قرارداد زبان و دروازهٔ خروجی را در برنامهٔ خود به کار بگیرید. تنظیمات تقویم جلالی با تقویم فعلی [[shadcn]] کار می‌کنند؛ ابزارهای [[Base UI]] موارد پشتیبانی‌شدهٔ خروجی اولیه را پوشش می‌دهند.", link: "راه‌اندازی وب" }, mobile: { title: "برنامهٔ فلاتر شما", body: "ویجت‌های متریال را نگه دارید. لومو موبایل قرارداد زبان، سبک‌های زبانی تولیدشده و بررسی‌کنندهٔ معنایی مستقل را فراهم می‌کند.", link: "راهنمای موبایل" } },
    questions: { title: "پیش از استفاده", items: [
      { question: "آیا لومو جای کامپوننت‌ها یا طراحی ما را می‌گیرد؟", answer: "خیر. کامپوننت‌ها و برند متعلق به برنامهٔ شما می‌مانند. لومو قرارداد زبان، ابزار کمکی و بررسی ارائه می‌کند؛ کتابخانهٔ کامپوننت نیست." },
      { question: "آیا دروازهٔ سبز، بررسی کامل دسترس‌پذیری است؟", answer: "خیر. فقط اجرای بررسی‌ها روی خروجی داده‌شده را اثبات می‌کند. تعامل صفحه‌کلید، فناوری‌های کمکی و دیگر جنبه‌های دسترس‌پذیری همچنان به آزمون مستقل نیاز دارند." },
      { question: "آیا می‌توان بسته را از رجیستری عمومی نصب کرد؟", answer: "لومو فعلاً از مخزن عمومی گیت‌هاب، با یک برچسب نسخهٔ ثابت و ابزار نصب معرفی‌شده در مستندات نصب می‌شود. راهنمای شروع، اتصال‌های لازم را توضیح می‌دهد." },
    ] },
    closing: { title: "درستی زبان را بخشی از ساخت کنید.", lead: "راهنمای اتصال را بخوانید، بخش‌های لازم را متصل کنید و آنچه خواننده دریافت می‌کند را بررسی کنید.", docs: "خواندن مستندات" },
    footer: { by: "ساختهٔ تلارسا", lead: "لایهٔ درستی برای محصولات فارسی.", source: "کد منبع در گیت‌هاب", legal: "اطلاعات حقوقی", privacy: "حریم خصوصی", licence: "کتابخانهٔ عمومی · پروانهٔ [[MIT]]" },
  },
} as const satisfies Record<import("./site").Locale, Copy>;
