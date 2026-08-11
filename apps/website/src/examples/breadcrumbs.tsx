import type { Locale } from "@lumo-ui/core";
import { Breadcrumb, Breadcrumbs, Link } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the breadcrumbs page. Contract: `_system/types.ts`.
 *
 * A SERVER module, and `breadcrumbs.tsx` no longer carries `"use client"`
 * either. That is the win the rewrite was for: a trail of links is a picture of
 * the route — nothing is pressable, nothing holds state, nothing subscribes — so
 * a page header now renders its breadcrumbs on the server and the reader pays no
 * hydration for the one part of the page that is pure navigation.
 *
 * The separator is the detail worth stopping on, and it is not CSS. The default
 * `›` (U+203A) carries the Unicode `Bidi_Mirrored` property, so the text engine
 * itself draws it as `‹` when the resolved direction is RTL. The trail therefore
 * points from the root toward the current page in both scripts with no `rtl:`
 * variant and no transform. An SVG chevron cannot do that, and neither can `/`.
 *
 * `label` is required, and the file's own header records why the failure mode
 * INVERTED rather than went away: React Aria used to hard-default the trail's
 * name to the English "Breadcrumbs", which a gate can catch and a reviewer can
 * see. An unlabelled trail now leaks no string, shows nothing, and passes every
 * count — which is the worse of the two.
 */

const t = {
  trailLabel: { "fa-IR": "مسیر صفحه", "en-US": "Breadcrumb trail" },
  navLabel: { "fa-IR": "مسیر رسیدن به این صفحه", "en-US": "The path to this page" },

  home: { "fa-IR": "خانه", "en-US": "Home" },
  shop: { "fa-IR": "فروشگاه", "en-US": "Shop" },
  appliances: { "fa-IR": "لوازم خانگی", "en-US": "Home appliances" },
  kettle: { "fa-IR": "کتری برقی پارس‌آوند", "en-US": "Pars-Avand electric kettle" },

  account: { "fa-IR": "حساب کاربری", "en-US": "Account" },
  orders: { "fa-IR": "سفارش‌ها", "en-US": "Orders" },
  orderDetail: { "fa-IR": "جزئیات سفارش", "en-US": "Order details" },
  invoice: { "fa-IR": "فاکتور", "en-US": "Invoice" },

  archive: { "fa-IR": "بایگانی", "en-US": "Archive" },
} satisfies Record<string, LocalizedText>;

function TrailExample(l: Locale) {
  return (
    <Breadcrumbs label={t.trailLabel[l]}>
      <Breadcrumb id="home">
        <Link href="#example-trail" variant="subtle" size="sm">
          {t.home[l]}
        </Link>
      </Breadcrumb>
      <Breadcrumb id="shop">
        <Link href="#example-trail" variant="subtle" size="sm">
          {t.shop[l]}
        </Link>
      </Breadcrumb>
      <Breadcrumb id="appliances">
        <Link href="#example-trail" variant="subtle" size="sm">
          {t.appliances[l]}
        </Link>
      </Breadcrumb>
      {/* No link on the last crumb: it is the page the reader is already on. */}
      <Breadcrumb id="kettle">{t.kettle[l]}</Breadcrumb>
    </Breadcrumbs>
  );
}

function LandmarkExample(l: Locale) {
  return (
    // The <nav> is the landmark; only ONE of the two carries a name.
    <nav aria-label={t.navLabel[l]}>
      <Breadcrumbs label={t.trailLabel[l]}>
        <Breadcrumb id="account">
          <Link href="#example-landmark" variant="subtle" size="sm">
            {t.account[l]}
          </Link>
        </Breadcrumb>
        <Breadcrumb id="orders">
          <Link href="#example-landmark" variant="subtle" size="sm">
            {t.orders[l]}
          </Link>
        </Breadcrumb>
        <Breadcrumb id="detail">{t.orderDetail[l]}</Breadcrumb>
      </Breadcrumbs>
    </nav>
  );
}

function SeparatorExample(l: Locale) {
  return (
    <div className="flex flex-col gap-3">
      <Breadcrumbs label={t.trailLabel[l]}>
        <Breadcrumb id="home">{t.home[l]}</Breadcrumb>
        <Breadcrumb id="shop">{t.shop[l]}</Breadcrumb>
        <Breadcrumb id="appliances">{t.appliances[l]}</Breadcrumb>
      </Breadcrumbs>
      {/* Also a mirrored pair (U+00BB / U+00AB), so it stays correct. */}
      <Breadcrumbs label={t.trailLabel[l]}>
        <Breadcrumb id="home" separator="»">
          {t.home[l]}
        </Breadcrumb>
        <Breadcrumb id="shop" separator="»">
          {t.shop[l]}
        </Breadcrumb>
        <Breadcrumb id="appliances">{t.appliances[l]}</Breadcrumb>
      </Breadcrumbs>
    </div>
  );
}

function CurrentOverrideExample(l: Locale) {
  return (
    <Breadcrumbs label={t.trailLabel[l]}>
      <Breadcrumb id="account">
        <Link href="#example-current-crumb" variant="subtle" size="sm">
          {t.account[l]}
        </Link>
      </Breadcrumb>
      {/* Stated explicitly: this is the page, even though it is not last. */}
      <Breadcrumb id="orders" isCurrent>
        {t.orders[l]}
      </Breadcrumb>
      <Breadcrumb id="archive" isDisabled>
        {t.archive[l]}
      </Breadcrumb>
      <Breadcrumb id="invoice">
        <Link href="#example-current-crumb" variant="subtle" size="sm">
          {t.invoice[l]}
        </Link>
      </Breadcrumb>
    </Breadcrumbs>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "navigation",
    title: { "fa-IR": "مسیر راهنما", "en-US": "Breadcrumbs" },
    intro: {
      "fa-IR":
        "مسیر رسیدن به این صفحه. این جزء به هیچ موتوری نیاز نداشت و همین اندازه‌گیری است: فهرست، نشانه‌گذاری است؛ «آخرین فرزند» یک شمارش است؛ و نام انگلیسیِ پیش‌فرض به‌جای بازنویسی‌شدن، اصلاً وجود ندارد. label اجباری مانده، چون شکل شکست وارونه شده: مسیرِ بی‌نام دیگر انگلیسی نیست، بی‌نام است — و آن بدترِ آن دو است، چون هیچ رشته‌ای بیرون نمی‌دهد، چیزی روی صفحه نشان نمی‌دهد و از هر شمارشی سالم رد می‌شود. جداکنندهٔ پیش‌فرض هم خودش قرینه می‌شود، چون نویسه‌ای است با ویژگی یونیکدیِ آینه‌ای.",
      "en-US":
        "The trail to this page. This component needed no engine at all, and that is the measurement: the list is markup, \"last child\" is a count, and the English default name is GONE rather than overridden. label stays required because the failure mode inverted: an unlabelled trail is now anonymous rather than English — the worse of the two, because it leaks no string, shows nothing on screen and passes every count. The default separator mirrors itself, being a character with the Unicode mirrored property.",
    },
    composition: [
      `<Breadcrumbs label>            ← an <ol> with the name on it; renders no <nav></nav>`,
      `  <Breadcrumb id separator isCurrent isDisabled>`,
      `    <Link href>                ← every crumb but the last`,
      `  </Breadcrumb>`,
      `  <Breadcrumb>plain text</Breadcrumb>   ← the last: the page you are on`,
      `</Breadcrumbs>`,
    ].join("\n"),
    parts: [
      {
        name: "Breadcrumbs",
        description: {
          "fa-IR":
            "خودِ «ol» و نام آن. تنها همین را رندر می‌کند: اگر نشانهٔ «nav» می‌خواهید، خودتان دورش بپیچید و پوشش را بی‌نام بگذارید — دو نیای نام‌دار، نام مسیر را دو بار می‌خوانند. آخرین خرده را همین‌جا علامت می‌زند، چون یک خرده همسایه‌هایش را نمی‌بیند و بافتِ ری‌اکت این پرونده را دوباره به کلاینت می‌بُرد.",
          "en-US":
            "The «ol» itself and its name. It renders only that: if you want a «nav» landmark, wrap it yourself and leave the wrapper unlabelled — two labelled ancestors announce the trail's name twice. The last crumb is marked HERE, because a crumb cannot see its siblings and a React context would put this file back on the client.",
        },
      },
      {
        name: "Breadcrumb",
        description: {
          "fa-IR":
            "یک خرده، یعنی یک «li». جداکننده روی خردهٔ پایانی رسم نمی‌شود بدون آنکه کسی بداند کدام خرده آخر است، و aria-hidden است چون نقطه‌گذاری میان پیوندهاست نه محتوا. اگر جداکننده را عوض می‌کنید، با نویسه‌ای آینه‌ای عوض کنید وگرنه همان ایرادی برمی‌گردد که این پیش‌فرض برای نبودنش هست.",
          "en-US":
            "One crumb, i.e. one «li». The separator is not drawn on the last crumb without anybody having to know which one that is, and it is aria-hidden because it is punctuation between links rather than content. If you override it, override it with another MIRRORED character or you have reintroduced the bug the default exists to avoid.",
        },
      },
    ],
  },
  examples: [
    {
      id: "trail",
      title: { "fa-IR": "یک مسیر کامل", "en-US": "A full trail" },
      description: {
        "fa-IR":
          "روی مسیر فارسی جهت پیکان‌ها را ببینید: همان نویسه است و هیچ کلاسی عوض نشده — موتور متن آن را وارونه رسم می‌کند، چون نویسه یکی از دو نیمهٔ یک جفت آینه‌ای یونیکد است. خردهٔ آخر پیوند ندارد، چون پیوند به صفحه‌ای که همین حالا رویش هستید ایستگاهی است که به هیچ‌جا نمی‌رود.",
        "en-US":
          "Watch the arrows on the fa route: it is the same character and no class changed — the text engine draws it reversed, because the character is one half of a Unicode mirroring pair. The last crumb carries no link, because a link to the page you are already on is a stop that goes nowhere.",
      },
      render: TrailExample,
    },
    {
      id: "landmark",
      title: { "fa-IR": "نشانهٔ ناوبری", "en-US": "The navigation landmark" },
      description: {
        "fa-IR":
          "جزء تنها «ol» را می‌سازد و «nav» را عمداً نمی‌سازد، چون نشانه تصمیمِ صفحه است نه تصمیمِ مسیر. اینجا پوشش نام دارد و خودِ فهرست هم نام دارد — دقیقاً همان چیزی که نباید. در کاربرد واقعی یکی از این دو نام را بردارید، وگرنه صفحه‌خوان نام مسیر را دو بار می‌گوید.",
        "en-US":
          "The component renders only the «ol» and deliberately not the «nav», because the landmark is the page's decision rather than the trail's. Here the wrapper is named AND the list is named — precisely what should not happen. In real use drop one of the two names, or a screen reader says the trail's name twice.",
      },
      render: LandmarkExample,
    },
    {
      id: "separator",
      title: { "fa-IR": "جداکنندهٔ جایگزین", "en-US": "Replacing the separator" },
      description: {
        "fa-IR":
          "هر دو مسیر درست‌اند، چون هر دو نویسه ویژگی آینه‌ای دارند. یک اسلش یا یک شورون اس‌وی‌جی این کار را نمی‌کند: اولی بی‌آینه است و کنار متن فارسی به سمت غلط تکیه می‌دهد، و دومی برای درست‌شدن به یک تبدیل مقیاس نیاز دارد که کسی باید یادش بماند.",
        "en-US":
          "Both trails are correct, because both characters carry the mirroring property. A slash or an SVG chevron does not: the first is unmirrored and leans the wrong way against Persian text, and the second needs a scale transform somebody has to remember.",
      },
      render: SeparatorExample,
    },
    {
      id: "current-crumb",
      title: { "fa-IR": "وقتی صفحهٔ جاری آخرین نیست", "en-US": "When the current page is not last" },
      description: {
        "fa-IR":
          "به‌طور پیش‌فرض آخرین خرده صفحهٔ جاری است، اما isCurrent صریح بر آن پیشی می‌گیرد — مسیری که خرده‌های بعدی هم دارد غیرعادی است، ولی نامعتبر نیست، و زیر پا گذاشتنِ قصدِ فراخوان هرگز پیش‌فرض درستی نیست. خردهٔ غیرفعال فقط ظاهر را عوض می‌کند: خرده یک کنترل نیست.",
        "en-US":
          "By default the last crumb is the current page, but an explicit isCurrent wins — a trail with crumbs after the current one is unusual and not illegal, and overriding a caller's stated intent is never the right default. A disabled crumb changes styling only: a crumb is not a control.",
      },
      render: CurrentOverrideExample,
    },
  ],
};
