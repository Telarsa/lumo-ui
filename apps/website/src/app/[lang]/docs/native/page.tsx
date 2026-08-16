import type { BuiltinLocale as Locale, LumoNode } from "@lumo-ui/core";
import { Frame } from "@lumo-ui/ui";
import { assertLocale, localeParams } from "@/lib/locale";
import { highlight } from "@/lib/highlight";
import { NativeButtonPreview } from "@/components/native-preview";
import { DocSection, DocsShell, P, Snippet, Term } from "../docs-shell";

/**
 * The mobile start. What is TRUE today, stated as such: `@lumo-ui/native` exists
 * with one component (Button) and its provider; its tokens are generated from
 * the web theme; its first byte is graded by the same gate through
 * react-native-web; the ICU probe that decides whether `@lumo-ui/core` runs
 * unchanged on a device (packages/native/README.md) has NOT been run on a
 * device yet. The preview below is a browser rendering.
 */
export const generateStaticParams = localeParams;

const SECTIONS = ["status", "preview", "device", "contract", "usage", "next"] as const;
type SectionId = (typeof SECTIONS)[number];

const USAGE = `import { LumoNativeProvider, Button, IconButton, Switch, TextField, Select } from "@lumo-ui/native";
import { formatNumber } from "@lumo-ui/core";

export function App() {
  return (
    <LumoNativeProvider locale="fa-IR" fonts={{ persian: "Vazirmatn" }}>
      <Button onPress={save}>ذخیره</Button>
      <Button variant="outline">{\`\${formatNumber(3, "fa-IR")} مورد\`}</Button>
      <IconButton label="بستن"><CloseIcon /></IconButton>
      <Switch isSelected={notify} onChange={setNotify}>اعلان‌ها</Switch>
      <TextField label="رایانامه" inputMode="email" value={email} onChange={setEmail} />
      <Select label="خدمت" placeholder="یک خدمت را انتخاب کنید" closeLabel="بستن" options={services} value={service} onChange={setService} />
    </LumoNativeProvider>
  );
}`;

const COPY: Record<Locale, { title: string; intro: string; heading: Record<SectionId, string>; body: Record<string, LumoNode>; frame: string; deviceFrame: string; deviceAlt: string }> = {
  "fa-IR": {
    title: "موبایل — React Native",
    intro: "همان قرارداد لومو روی React Native / Expo. آنچه امروز هست: پرووایدر، دکمه و کلید؛ پروب ICU یک بار روی شبیه‌ساز iOS اجرا شده است.",
    frame: "پیش‌نمایش کامپوننت‌های موبایل در مرورگر",
    deviceFrame: "عکس شبیه‌ساز iOS",
    deviceAlt: "عکس شبیه‌ساز iOS ۱۸٫۵: گزارش پروب ICU، دکمه‌های لومو در چهار گونه، و سه کلید با برچسب فارسی؛ چیدمان راست‌چین",
    heading: { status: "وضعیت", preview: "پیش‌نمایش در مرورگر", device: "روی دستگاه — و چطور می‌بینیدش", contract: "قرارداد", usage: "استفاده", next: "بعدی" },
    body: {
      status: (
        <>
          <Term>@lumo-ui/native</Term> یک بسته است با چهار کامپوننت (<Term>Button</Term> /{" "}
          <Term>IconButton</Term>، <Term>Switch</Term>، <Term>TextField</Term>، <Term>Select</Term>) و پرووایدرش. توکن‌هایش از همان <Term>tokens.css</Term> وب تولید
          می‌شوند (رنگ‌ها از oklch به hex، اندازه‌ها از rem به dp) و یک دروازه جلوی انحرافشان را
          می‌گیرد. اولین بایتش با همان چهارده قاعدهٔ وب نمره می‌گیرد — از راه{" "}
          <Term>react-native-web</Term>. پروب ICU یک بار روی شبیه‌ساز iOS ۱۸٫۵ (Hermes، Expo Go) اجرا
          شده: ارقام فارسی و تقویم جلالی درست بودند؛ این Hermes اصلاً <Term>Intl.Locale</Term> ندارد،
          پس جهت از جدول می‌آید (گزارش کامل در <Term>packages/native/README.md</Term>). اجرای
          نسخهٔ release و امولاتور اندروید هنوز باز است. پیش‌نمایش زیر رندر مرورگر است، نه اجرای دستگاه.
        </>
      ),
      preview: (
        <>
          همان کدی که روی گوشی اجرا می‌شود، اینجا از راه <Term>react-native-web</Term> در مرورگر رندر
          شده — و به یک <Term>{"<button>"}</Term> واقعی با نام و وضعیت تبدیل می‌شود، نه یک{" "}
          <Term>div</Term> بی‌نقش. جهت از زبان صفحه می‌آید؛ رقم‌ها از <Term>formatNumber</Term>.
        </>
      ),
      contract: (
        <>
          هر رشته‌ای که خوانده می‌شود پراپ اجباری است (<Term>label</Term> دکمهٔ آیکونی)؛ فرزند دکمه{" "}
          <Term>LumoNode</Term> است، پس عدد خام کامپایل نمی‌شود؛ <Term>dir</Term> وجود ندارد — جهت
          از <Term>locale</Term> پرووایدر مشتق می‌شود. آینه‌شدن چیدمان در React Native تصمیم اپ در
          زمان راه‌اندازی است (<Term>I18nManager</Term>)، نه کار کتابخانه در زمان رندر؛ لومو آن را
          صدا نمی‌زند و به‌جایش فاصله‌گذاری آغاز/پایان و جهت نوشتار متن را درست می‌کند.
        </>
      ),
      device: (
        <>
          دو راه برای دیدن کامپوننت‌های موبایل روی همین سایت هست و هر دو صادقانه نام‌گذاری شده‌اند.
          یک: پیش‌نمایش زندهٔ بالا — همان سورس React Native که روی گوشی اجرا می‌شود، در مرورگر شما از راه{" "}
          <Term>react-native-web</Term> رندر می‌شود؛ می‌توانید فشارش دهید، تایپ کنید، انتخاب کنید. دو: تصویر
          زیر — عکس واقعی از شبیه‌ساز iOS ۱۸٫۵ (Hermes، Expo Go) در تاریخ ۲۵ مرداد ۱۴۰۵، با{" "}
          <Term>I18nManager.forceRTL</Term> در آغاز اپ: ردیف‌ها از راست شروع می‌شوند، کلید کنار پایان خواندنی
          است، دستگیرهٔ روشن سمت چپ. رندر مرورگر «آنچه می‌سازد» را نشان می‌دهد؛ عکس دستگاه «آنچه واقعاً روی
          Hermes رخ داد» را — و همین تفاوت است که پروب ICU را لازم می‌کند.
        </>
      ),
      usage: <>نصب مثل بقیهٔ بسته‌های قرارداد: وابستگی گیت سنجاق‌شده به همان تگ، مسیر <Term>packages/native</Term>.</>,
      next: (
        <>
          اجرای release و امولاتور اندروید برای پروب ICU؛ کلید (<Term>Switch</Term>) اکنون هست و
          حساس به جهت است — دستگیرهٔ روشن در فارسی سمت چپ می‌نشیند، از راه ویژگی منطقی{" "}
          <Term>start</Term> که پلتفرم آینه می‌کند؛ بعدی فیلد متنی و انتخاب.
        </>
      ),
    },
  },
  "en-US": {
    title: "Mobile — React Native",
    intro: "Lumo's contract on React Native / Expo. What exists today: the provider, Button and Switch; the ICU probe has run once on the iOS simulator.",
    frame: "Mobile components preview in the browser",
    deviceFrame: "iOS simulator screenshot",
    deviceAlt: "iOS 18.5 simulator screenshot: the ICU probe report, Lumo buttons in four variants, and three switches with Persian labels; right-to-left layout",
    heading: { status: "Status", preview: "Preview in the browser", device: "On a device — and how you see it", contract: "Contract", usage: "Usage", next: "Next" },
    body: {
      status: (
        <>
          <Term>@lumo-ui/native</Term> is a package with four components (<Term>Button</Term> /{" "}
          <Term>IconButton</Term>, <Term>Switch</Term>, <Term>TextField</Term>, <Term>Select</Term>) and its provider. Its tokens are generated from the web&rsquo;s{" "}
          <Term>tokens.css</Term> (colours oklch → hex, sizes rem → dp) and a gate stops them
          drifting. Its first byte is graded by the same fourteen rules as the web — through{" "}
          <Term>react-native-web</Term>. The ICU probe has run once on the iOS 18.5 simulator (Hermes,
          Expo Go): Persian digits and the Jalali calendar were right; that Hermes has no{" "}
          <Term>Intl.Locale</Term> at all, so direction comes from the table (full report in{" "}
          <Term>packages/native/README.md</Term>). The release build and an Android emulator are still
          open. The preview below is a browser rendering, not a device run.
        </>
      ),
      preview: (
        <>
          The same source a phone runs, rendered here through <Term>react-native-web</Term> — and
          it becomes a real <Term>{"<button>"}</Term> with a name and a state, not a roleless{" "}
          <Term>div</Term>. Direction comes from the page&rsquo;s language; digits from{" "}
          <Term>formatNumber</Term>.
        </>
      ),
      contract: (
        <>
          Every announced string is a required prop (the icon button&rsquo;s <Term>label</Term>);
          a button&rsquo;s child is <Term>LumoNode</Term>, so a raw number does not compile; there
          is no <Term>dir</Term> — direction derives from the provider&rsquo;s <Term>locale</Term>.
          Layout mirroring on React Native is the app&rsquo;s decision at startup
          (<Term>I18nManager</Term>), not a library&rsquo;s at render time; Lumo does not call it
          and gets start/end spacing and text writing direction right instead.
        </>
      ),
      device: (
        <>
          There are two ways to see the mobile components on this site, and both are labelled for
          what they are. One: the live preview above — the same React Native source a phone runs,
          rendered in your browser through <Term>react-native-web</Term>; press, type, choose. Two:
          the image below — a real screenshot from the iOS 18.5 simulator (Hermes, Expo Go) on
          16 August 2026, with <Term>I18nManager.forceRTL</Term> at app start: rows begin at the
          right, the switch sits at the reading end, the ON thumb on the left. The browser rendering
          shows what the component builds; the device screenshot shows what actually happened on
          Hermes — and that difference is why the ICU probe exists.
        </>
      ),
      usage: <>Installed like the other contract packages: a git dependency pinned to the same tag, path <Term>packages/native</Term>.</>,
      next: (
        <>
          The release-build and Android-emulator probe runs; <Term>Switch</Term> exists now and is
          the direction-sensitive one — its ON thumb sits on the left in Persian, through the
          logical <Term>start</Term> style the platform mirrors; next a text field and a select.
        </>
      ),
    },
  },
};

export default async function NativePage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = assertLocale((await params).lang);
  const t = COPY[lang];
  const sections = SECTIONS.map((id) => ({ id, label: t.heading[id] }));
  const usageHtml = await highlight(USAGE, "tsx");
  return (
    <DocsShell lang={lang} slug="native" title={t.title} intro={t.intro} sections={sections}>
      <DocSection id="status" title={t.heading.status}>
        <P>{t.body.status}</P>
      </DocSection>
      <DocSection id="preview" title={t.heading.preview}>
        <P>{t.body.preview}</P>
        <Frame device="phone" label={t.frame}>
          <NativeButtonPreview locale={lang} />
        </Frame>
      </DocSection>
      <DocSection id="device" title={t.heading.device}>
        <P>{t.body.device}</P>
        <Frame device="phone" label={t.deviceFrame}>
          {/* A static evidence image on an unoptimised static export — a plain <img> on purpose. */}
          <img src="/native/ios-18-5-simulator-fa-2026-08-16.png" alt={t.deviceAlt} style={{ display: "block", width: "100%", height: "auto" }} />
        </Frame>
      </DocSection>
      <DocSection id="contract" title={t.heading.contract}>
        <P>{t.body.contract}</P>
      </DocSection>
      <DocSection id="usage" title={t.heading.usage}>
        <P>{t.body.usage}</P>
        <Snippet lang={lang} code={USAGE} html={usageHtml} />
      </DocSection>
      <DocSection id="next" title={t.heading.next}>
        <P>{t.body.next}</P>
      </DocSection>
    </DocsShell>
  );
}
