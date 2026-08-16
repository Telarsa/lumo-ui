import type { Locale, LumoNode } from "@lumo-ui/core";
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

const SECTIONS = ["status", "preview", "contract", "usage", "next"] as const;
type SectionId = (typeof SECTIONS)[number];

const USAGE = `import { LumoNativeProvider, Button, IconButton } from "@lumo-ui/native";
import { formatNumber } from "@lumo-ui/core";

export function App() {
  return (
    <LumoNativeProvider locale="fa-IR" fonts={{ persian: "Vazirmatn" }}>
      <Button onPress={save}>ذخیره</Button>
      <Button variant="outline">{\`\${formatNumber(3, "fa-IR")} مورد\`}</Button>
      <IconButton label="بستن"><CloseIcon /></IconButton>
    </LumoNativeProvider>
  );
}`;

const COPY: Record<Locale, { title: string; intro: string; heading: Record<SectionId, string>; body: Record<string, LumoNode>; frame: string }> = {
  "fa-IR": {
    title: "موبایل — React Native",
    intro: "همان قرارداد لومو روی React Native / Expo. آنچه امروز هست: پرووایدر و دکمه؛ آنچه هنوز نیست: اجرای روی دستگاه.",
    frame: "پیش‌نمایش دکمهٔ موبایل در مرورگر",
    heading: { status: "وضعیت", preview: "پیش‌نمایش", contract: "قرارداد", usage: "استفاده", next: "بعدی" },
    body: {
      status: (
        <>
          <Term>@lumo-ui/native</Term> یک بسته است با یک کامپوننت (<Term>Button</Term> و{" "}
          <Term>IconButton</Term>) و پرووایدرش. توکن‌هایش از همان <Term>tokens.css</Term> وب تولید
          می‌شوند (رنگ‌ها از oklch به hex، اندازه‌ها از rem به dp) و یک دروازه جلوی انحرافشان را
          می‌گیرد. اولین بایتش با همان چهارده قاعدهٔ وب نمره می‌گیرد — از راه{" "}
          <Term>react-native-web</Term>. آنچه هنوز انجام نشده و صادقانه می‌گوییم: پروب ICU که
          تعیین می‌کند <Term>@lumo-ui/core</Term> روی دستگاه بدون تغییر کار می‌کند یا نه، هنوز روی
          شبیه‌ساز یا دستگاه اجرا نشده. پیش‌نمایش زیر رندر مرورگر است، نه اجرای دستگاه.
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
      usage: <>نصب مثل بقیهٔ بسته‌های قرارداد: وابستگی گیت سنجاق‌شده به همان تگ، مسیر <Term>packages/native</Term>.</>,
      next: (
        <>
          اجرای پروب ICU روی شبیه‌ساز iOS و امولاتور اندروید (دو اجرای مسدودکننده در{" "}
          <Term>packages/native/README.md</Term>)؛ سپس یک کامپوننت حساس به جهت — <Term>Switch</Term>{" "}
          یا <Term>SegmentedControl</Term> — چون دکمه‌ای که رندر می‌شود چیزی دربارهٔ راست‌چینی ثابت
          نمی‌کند.
        </>
      ),
    },
  },
  "en-US": {
    title: "Mobile — React Native",
    intro: "Lumo's contract on React Native / Expo. What exists today: the provider and Button; what does not yet: a device run.",
    frame: "Mobile button preview in the browser",
    heading: { status: "Status", preview: "Preview", contract: "Contract", usage: "Usage", next: "Next" },
    body: {
      status: (
        <>
          <Term>@lumo-ui/native</Term> is a package with one component (<Term>Button</Term> and{" "}
          <Term>IconButton</Term>) and its provider. Its tokens are generated from the web&rsquo;s{" "}
          <Term>tokens.css</Term> (colours oklch → hex, sizes rem → dp) and a gate stops them
          drifting. Its first byte is graded by the same fourteen rules as the web — through{" "}
          <Term>react-native-web</Term>. What has not been done, stated plainly: the ICU probe that
          decides whether <Term>@lumo-ui/core</Term> runs unchanged on a device has not yet run on a
          simulator or a device. The preview below is a browser rendering, not a device run.
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
      usage: <>Installed like the other contract packages: a git dependency pinned to the same tag, path <Term>packages/native</Term>.</>,
      next: (
        <>
          Run the ICU probe on the iOS simulator and an Android emulator (the two blocking runs
          in <Term>packages/native/README.md</Term>); then one direction-sensitive component —{" "}
          <Term>Switch</Term> or <Term>SegmentedControl</Term> — because a button that renders
          proves nothing about right-to-left.
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
