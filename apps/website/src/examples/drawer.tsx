import type { Locale } from "@lumo-ui/core";
import {
  Button,
  Dialog,
  DialogDescription,
  DialogHeading,
  DialogTrigger,
  Drawer,
  DrawerOverlay,
  Link,
} from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the drawer page. Contract: `_system/types.ts`.
 *
 * A SERVER module — every prop below is a string or a variant name, so the page
 * prerenders whole and there is no island.
 *
 * ── WHAT IS ON THE PAGE, AND WHAT IS NOT ────────────────────────────────────
 *
 * The buttons. A closed drawer renders `null`, so the panel's heading, its
 * links and its close control are ABSENT from the served bytes —
 * `packages/core/src/strings.ts` records that as a measurement error rather
 * than a caveat: a first-byte sweep scores a closed overlay clean whether it is
 * clean or not. Open one to see the part this component is actually about.
 *
 * ── AND THE PART IT IS ACTUALLY ABOUT IS THE MOTION ─────────────────────────
 *
 * `side` is `"start" | "end"` and there is no spelling of it that names a
 * physical edge, so there is no way to write a drawer that refuses to mirror.
 * That is the easy half. The hard half is that every drawer in every library
 * slides with `transform: translateX(-100%)`, and a CSS transform has NO
 * logical form — the x axis is physical in every writing mode. A drawer
 * anchored logically and animated with a transform mirrors its resting position
 * and not its motion, so under `dir="rtl"` it flies in ACROSS the page instead
 * of out of the edge it belongs to. It reads as an animation bug rather than a
 * direction bug, which is why it survives review.
 *
 * This one transitions `inset-inline-start` / `inset-inline-end`, which are
 * logical, so it leaves and re-enters the same edge it is anchored to in both
 * scripts with no `rtl:` variant and no `dir` inspection anywhere in the
 * component. Watch the entry on the Persian route and then on the English one:
 * the class string is identical.
 */

const t = {
  openMenu: { "fa-IR": "باز کردن منو", "en-US": "Open the menu" },
  navHeading: { "fa-IR": "بخش‌های حساب", "en-US": "Account sections" },
  close: { "fa-IR": "بستن", "en-US": "Close" },
  orders: { "fa-IR": "سفارش‌ها", "en-US": "Orders" },
  addresses: { "fa-IR": "نشانی‌ها", "en-US": "Addresses" },
  payments: { "fa-IR": "روش‌های پرداخت", "en-US": "Payment methods" },
  settings: { "fa-IR": "تنظیمات", "en-US": "Settings" },

  openFilters: { "fa-IR": "پالایه‌ها", "en-US": "Filters" },
  filtersHeading: { "fa-IR": "پالایش نتایج", "en-US": "Narrow the results" },
  filtersBody: {
    "fa-IR":
      "کشوی لبهٔ پایانی برای چیزی است که کنارِ محتوا می‌ماند و جایش را نمی‌گیرد — پالایه‌ها، جزئیات، یک پیش‌نمایش.",
    "en-US":
      "The trailing-edge drawer is for something that sits BESIDE the content rather than replacing it — filters, details, a preview.",
  },

  openSmall: { "fa-IR": "کشوی کوچک", "en-US": "Small drawer" },
  openLarge: { "fa-IR": "کشوی بزرگ", "en-US": "Large drawer" },
  smallHeading: { "fa-IR": "میان‌بُرها", "en-US": "Shortcuts" },
  smallBody: {
    "fa-IR": "برای فهرستی از پیوندها، باریک‌ترین عرض کافی است.",
    "en-US": "For a list of links, the narrowest width is enough.",
  },
  largeHeading: { "fa-IR": "جزئیات سفارش", "en-US": "Order details" },
  largeBody: {
    "fa-IR":
      "عرض هر سه اندازه با min نوشته شده، پس پنل هرگز از خودِ نمایشگر پهن‌تر نمی‌شود — و یک گوشیِ افقی «صفحهٔ کوچک» به حساب نمی‌آید.",
    "en-US":
      "All three widths are written with `min()`, so the panel never outgrows the viewport — and a phone in landscape is not a «small screen».",
  },

  openCart: { "fa-IR": "سبد خرید", "en-US": "Shopping cart" },
  cartHeading: { "fa-IR": "سبد خرید شما", "en-US": "Your cart" },
  cartBody: {
    "fa-IR":
      "این پوشش isDismissable گرفته است، پس کلیک روی پس‌زمینه می‌بندد. برای سبد خرید درست است و برای پرسشی که باید پاسخ داده شود نه.",
    "en-US":
      "This overlay takes `isDismissable`, so a click on the scrim closes it. Right for a cart, wrong for a question that has to be answered.",
  },
} satisfies Record<string, LocalizedText>;

function StartExample(l: Locale) {
  return (
    <DialogTrigger>
      <Button variant="outline">{t.openMenu[l]}</Button>
      <DrawerOverlay>
        <Drawer side="start" size="sm">
          <Dialog closeLabel={t.close[l]}>
            <DialogHeading>{t.navHeading[l]}</DialogHeading>
            <nav className="flex flex-col items-start gap-2">
              <Link href="#orders">{t.orders[l]}</Link>
              <Link href="#addresses">{t.addresses[l]}</Link>
              <Link href="#payments">{t.payments[l]}</Link>
              <Link href="#settings">{t.settings[l]}</Link>
            </nav>
          </Dialog>
        </Drawer>
      </DrawerOverlay>
    </DialogTrigger>
  );
}

function EndExample(l: Locale) {
  return (
    <DialogTrigger>
      <Button variant="outline">{t.openFilters[l]}</Button>
      <DrawerOverlay>
        <Drawer side="end" size="md">
          <Dialog closeLabel={t.close[l]}>
            <DialogHeading>{t.filtersHeading[l]}</DialogHeading>
            <DialogDescription>{t.filtersBody[l]}</DialogDescription>
          </Dialog>
        </Drawer>
      </DrawerOverlay>
    </DialogTrigger>
  );
}

function SizesExample(l: Locale) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <DialogTrigger>
        <Button variant="outline">{t.openSmall[l]}</Button>
        <DrawerOverlay>
          <Drawer side="start" size="sm">
            <Dialog closeLabel={t.close[l]}>
              <DialogHeading>{t.smallHeading[l]}</DialogHeading>
              <DialogDescription>{t.smallBody[l]}</DialogDescription>
            </Dialog>
          </Drawer>
        </DrawerOverlay>
      </DialogTrigger>
      <DialogTrigger>
        <Button variant="outline">{t.openLarge[l]}</Button>
        <DrawerOverlay>
          <Drawer side="end" size="lg">
            <Dialog closeLabel={t.close[l]}>
              <DialogHeading>{t.largeHeading[l]}</DialogHeading>
              <DialogDescription>{t.largeBody[l]}</DialogDescription>
            </Dialog>
          </Drawer>
        </DrawerOverlay>
      </DialogTrigger>
    </div>
  );
}

function DismissableExample(l: Locale) {
  return (
    <DialogTrigger>
      <Button variant="outline">{t.openCart[l]}</Button>
      <DrawerOverlay isDismissable>
        <Drawer side="end" size="md">
          <Dialog closeLabel={t.close[l]}>
            <DialogHeading>{t.cartHeading[l]}</DialogHeading>
            <DialogDescription>{t.cartBody[l]}</DialogDescription>
          </Dialog>
        </Drawer>
      </DrawerOverlay>
    </DialogTrigger>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "overlay",
    title: { "fa-IR": "کشو", "en-US": "Drawer" },
    intro: {
      "fa-IR":
        "مودالی که از یک لبهٔ درون‌خطی می‌آید. side فقط start و end دارد و هیچ املایی برای نام‌بردنِ یک لبهٔ فیزیکی ندارد، پس کشویی که آینه نشود نوشتنی نیست. سُرشِ خودش هم با inset-inline-* نوشته شده و نه با transform: تبدیل‌های سی‌اس‌اس شکل منطقی ندارند، پس کشویی که منطقی لنگر انداخته و با transform حرکت می‌کند، جای ایستادنش آینه می‌شود و حرکتش نه — و از عرض صفحه پرواز می‌کند به‌جای آنکه از لبهٔ خودش بیرون بیاید. در بایت اول فقط دکمهٔ بازکننده هست.",
      "en-US":
        "A modal that arrives from an INLINE edge. `side` is only `start` or `end` and has no spelling that names a physical edge, so a drawer that refuses to mirror is not writable. The slide itself is written with `inset-inline-*` rather than a transform: CSS transforms have no logical form, so a drawer anchored logically and animated with one mirrors its resting position and not its motion — and flies across the viewport instead of out of its own edge. Only the trigger is in the first byte.",
    },
    composition: [
      `<DialogTrigger>`,
      `  <Button>…</Button>                       ← all the first byte holds`,
      `  <DrawerOverlay isDismissable>            ← the scrim, and the portal boundary`,
      `    <Drawer side="start" size="md">        ← start | end. Never left | right.`,
      `      <Dialog closeLabel="…">              ← the ✕ needs a name in every language`,
      `        <DialogHeading>…</DialogHeading>       ← aria-labelledby`,
      `        <DialogDescription>…</DialogDescription>  ← aria-describedby`,
      `      </Dialog>`,
      `    </Drawer>`,
      `  </DrawerOverlay>`,
      `</DialogTrigger>`,
    ].join("\n"),
    parts: [
      {
        name: "Drawer",
        description: {
          "fa-IR":
            "خودِ پنل، و عنصری که role=\"dialog\" روی آن است. side یک اجتماعِ دوتایی است و همین اجتماع، اجرا کننده است: طراحی که پنل را در فارسی سمت راست می‌خواهد باید start بنویسد، که همان چیزی است که واقعاً منظورش است. کشیدگیِ عمودی روی محور بلوکی است و در هیچ حالتِ نوشتنِ افقی آینه نمی‌شود، پس تنها محورِ درون‌خطی است که کار دارد.",
          "en-US":
            "The panel itself, and the element that carries `role=\"dialog\"`. `side` is a two-value union and the union IS the enforcement: a designer who wants the panel on the right in Persian has to say `start`, which is what they actually mean. `inset-y-0` is on the block axis, which mirrors in no horizontal writing mode, so only the inline axis has work to do.",
        },
      },
      {
        name: "DrawerOverlay",
        description: {
          "fa-IR":
            "پس‌زمینهٔ تیره، و زیرِ موتورِ فعلی مرزِ پورتال هم هست. جدا از پنل است چون هر دو حالت‌های ورود و خروج خودشان را منتشر می‌کنند و پس‌زمینه باید محو شود در حالی که پنل سفر می‌کند — یک انیمیشنِ مشترک، محو را به مدتِ سُرش گره می‌زد. isDismissable از همین‌جا خوانده می‌شود؛ ولی جلوگیری از بستن با کلید گریز روی DialogTrigger است، چون صاحبِ وضعیت اوست.",
          "en-US":
            "The scrim, and — under the current engine — the portal boundary too. Separate from the panel because both publish their own enter and exit states and the scrim should cross-fade while the panel travels; one shared animation would tie the fade to the slide's duration. `isDismissable` is read from here — but holding Escape is `DialogTrigger`'s, because that is the state owner.",
        },
      },
      {
        name: "drawerVariants",
        description: {
          "fa-IR":
            "کلاس‌های پنل، و جایی که سُرش زندگی می‌کند. مسافتِ سفر عرضِ خودِ کشو است و نه صد درصد: درصد روی inset-inline-start نسبت به بلوکِ دربرگیرنده — یعنی نمایشگر — حل می‌شود، که پنلی بیست‌وچهار‌رِمی را وادار می‌کرد کلِ پهنای صفحه را طی کند و روی نمایشگر پهن دیر برسد.",
          "en-US":
            "The panel's classes, and where the slide lives. The travel distance is the drawer's own width rather than `100%`: a percentage on `inset-inline-start` resolves against the containing block — the viewport — which would make a 24rem panel travel the full screen width and arrive late on a wide monitor.",
        },
      },
      {
        name: "drawerOverlayVariants",
        description: {
          "fa-IR":
            "کلاس‌های پس‌زمینه. تنها یک محوشدنِ شفافیت است، و شفافیت جهت ندارد — پس اینجا هیچ چیزی برای آینه‌کردن نیست.",
          "en-US":
            "The scrim's classes. Only an opacity cross-fade, and opacity has no direction — so there is nothing here to mirror.",
        },
      },
      {
        name: "Dialog",
        description: {
          "fa-IR":
            "سطحِ محاوره درونِ پنل، با ✕ خودش. closeLabel اجباری است چون یک ✕ در هیچ زبانی نام نیست — همان دلیلی که IconButton برایش وجود دارد.",
          "en-US":
            "The dialog surface inside the panel, with its own ✕. `closeLabel` is required because an ✕ is not a name in any language — the same reason `IconButton` exists.",
        },
      },
      {
        name: "DialogDescription",
        description: {
          "fa-IR":
            "متن پشتیبانِ کشو، و همان رشته‌ای که پس از نام خوانده می‌شود. یک «p» دست‌نویس با همان کلاس‌ها دقیقاً همان‌طور دیده می‌شود و به هیچ‌کس اعلام نمی‌شود؛ این جزء شناسه‌اش را به aria-describedby پنجره می‌بندد.",
          "en-US":
            "The drawer's supporting prose, and the string read AFTER the name. A hand-written «p» with the same classes LOOKS identical and is announced to nobody; the part binds its id to the popup's aria-describedby.",
        },
      },
    ],
  },
  examples: [
    {
      id: "start-edge",
      title: { "fa-IR": "از لبه‌ای که خواندن از آن شروع می‌شود", "en-US": "From the edge reading starts at" },
      description: {
        "fa-IR":
          "side=\"start\" یعنی چپ در انگلیسی و راست در فارسی، از یک رشتهٔ کلاسِ یکسان. حاشیه‌اش border-e است، یعنی لبهٔ روبه‌محتوا، هرکدام از دو سمت که باشد. باز و بسته کنید و به مسیرِ حرکت نگاه کنید نه به جای ایستادن: پنل از همان لبه‌ای بیرون می‌رود که از آن آمده بود.",
        "en-US":
          "`side=\"start\"` is the left in English and the right in Persian, from one identical class string. Its border is `border-e` — the edge facing the content, whichever physical side that is. Open and close it and watch the PATH rather than the resting place: the panel leaves by the edge it arrived from.",
      },
      render: StartExample,
    },
    {
      id: "end-edge",
      title: { "fa-IR": "از لبهٔ پایانی", "en-US": "From the trailing edge" },
      description: {
        "fa-IR":
          "همان جزء با side=\"end\". هیچ کلاسِ دومی، هیچ نوعِ rtl:، و هیچ خواندنی از dir در کار نیست — تفاوت یک واژه است. اندازهٔ md عرضِ خوانایی برای فهرستی از پالایه‌هاست بی‌آنکه محتوای پشتش را کاملاً بپوشاند.",
        "en-US":
          "The same component with `side=\"end\"`. There is no second class, no `rtl:` variant and no reading of `dir` — the difference is one word. The `md` size is a readable width for a column of filters without covering the content behind it.",
      },
      render: EndExample,
    },
    {
      id: "sizes",
      title: { "fa-IR": "سه عرض، با یک سقف", "en-US": "Three widths, with one ceiling" },
      description: {
        "fa-IR":
          "هر سه اندازه با min نوشته شده‌اند و نه با یک نوعِ نقطه‌شکست، چون شرطِ واقعی «صفحه کوچک است» نیست بلکه «پنل نباید از نمایشگر پهن‌تر شود» است. عرض یک متغیرِ سفارشی است و مسافتِ سفر از همان متغیر مشتق می‌شود، پس اندازه و انیمیشن نمی‌توانند اختلاف پیدا کنند.",
        "en-US":
          "All three sizes are written with `min()` rather than a breakpoint variant, because the real condition is not «the screen is small» but «the panel must never exceed the viewport». The width is a custom property and the travel distance is derived from it, so the size and the animation cannot disagree.",
      },
      render: SizesExample,
    },
    {
      id: "dismissable",
      title: { "fa-IR": "کلیک روی پس‌زمینه، وقتی درست است", "en-US": "When the scrim should answer" },
      description: {
        "fa-IR":
          "پوشش isDismissable می‌گیرد و کلیک بیرون می‌بندد. نبودِ این ویژگی یعنی «بسته نمی‌شود»، که برای گفت‌وگوی هشدار پیش‌فرضِ درست است؛ برای سبدِ خرید که هر لحظه می‌شود رهایش کرد، درست همین است. کلید گریز در هر دو حالت می‌بندد، چون گریز کنشی صریح است.",
        "en-US":
          "The overlay takes `isDismissable` and an outside click closes it. Its ABSENCE means not dismissable, which is the right default for an alert dialog; for a cart you can abandon at any moment this is. Escape closes in both cases, because Escape is an explicit act.",
      },
      render: DismissableExample,
    },
  ],
};
