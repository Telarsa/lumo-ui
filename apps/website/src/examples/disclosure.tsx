import type { Locale } from "@lumo-ui/core";
import {
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  DisclosureTrigger,
} from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the disclosure page. Contract: `_system/types.ts`.
 *
 * A SERVER module: expansion is uncontrolled here, so nothing needs a function
 * prop and every example prerenders — including, in the last one, the collapsed
 * panel's own text.
 *
 * ── IT IS AN ACCORDION UNDERNEATH, AND THE PANEL'S ROLE DECIDED THAT ────────
 *
 * The engine ships a collapsible primitive too, and it is the obvious mapping
 * for a lone `<Disclosure>`. It is the wrong one, and the difference is exactly
 * one attribute pair. Measured, both open:
 *
 *     collapsible  <button aria-controls aria-expanded>
 *                  <div id>                        ← no role, no name
 *
 *     accordion    <h3><button aria-controls aria-expanded id="T"></h3>
 *                  <div id role="region" aria-labelledby="T">
 *
 * A collapsible's panel is an anonymous generic. A screen-reader user who
 * expands a section and then navigates INTO it has left the trigger behind and
 * has nothing telling them which section they are in — the panel is not a
 * landmark, is not named, and does not appear in a rotor. So EVERY disclosure
 * here is an accordion root, including a lone one.
 *
 * ── THE CHEVRON TURNS A HALF TURN, NOT A QUARTER ────────────────────────────
 *
 * The usual affordance is a chevron pointing along the inline axis when
 * collapsed and rotating 90° down when expanded. That is a direction bug twice
 * over: the resting glyph points at a physical side, and `rotate-90` turns the
 * same way regardless of script — so a mirrored resting state and an unmirrored
 * rotation disagree. A down-chevron flipped 180° has neither problem: 180° is
 * its own mirror image, and a down/up pair lives entirely on the block axis.
 */

const t = {
  shipping: { "fa-IR": "هزینهٔ ارسال چطور حساب می‌شود؟", "en-US": "How is shipping calculated?" },
  shippingBody: {
    "fa-IR":
      "بر پایهٔ وزن مرسوله و مقصد آن. برای سفارش‌های بالای پانصد هزار تومان ارسال درون‌شهری رایگان است.",
    "en-US":
      "By the parcel's weight and its destination. In-city delivery is free on orders above five hundred thousand toman.",
  },

  returns: { "fa-IR": "بازگشت کالا", "en-US": "Returning an item" },
  returnsBody: {
    "fa-IR":
      "کالای بازنشده تا هفت روز پس از تحویل بازگشتنی است. هزینهٔ بازگشت بر عهدهٔ فروشنده است اگر کالا معیوب باشد.",
    "en-US":
      "An unopened item can be returned within seven days of delivery. The seller pays the return cost if the item is faulty.",
  },
  warranty: { "fa-IR": "گارانتی", "en-US": "Warranty" },
  warrantyBody: {
    "fa-IR":
      "گارانتی یک‌ساله فقط ایرادهای ساخت را می‌پوشاند و شامل آسیب ناشی از استفاده نمی‌شود.",
    "en-US":
      "The one-year warranty covers manufacturing faults only and excludes damage from use.",
  },
  invoice: { "fa-IR": "فاکتور رسمی", "en-US": "A formal invoice" },
  invoiceBody: {
    "fa-IR":
      "فاکتور رسمی را می‌توانید هنگام ثبت سفارش درخواست کنید؛ پس از ارسال دیگر صادر نمی‌شود.",
    "en-US":
      "A formal invoice can be requested at checkout; it cannot be issued after dispatch.",
  },

  network: { "fa-IR": "شبکه", "en-US": "Network" },
  networkBody: {
    "fa-IR": "نشانی سرور، درگاه و گواهی. تغییرشان سرویس را از نو راه‌اندازی می‌کند.",
    "en-US": "The server address, the port and the certificate. Changing any of them restarts the service.",
  },
  storage: { "fa-IR": "ذخیره‌سازی", "en-US": "Storage" },
  storageBody: {
    "fa-IR": "مسیر پشتیبان‌ها و بازهٔ نگهداری. فضای کم‌شده در همان صفحه گزارش می‌شود.",
    "en-US": "The backup path and the retention window. Remaining space is reported on the same screen.",
  },
  security: { "fa-IR": "امنیت", "en-US": "Security" },
  securityBody: {
    "fa-IR": "ورود دو‌مرحله‌ای و فهرست نشست‌های باز.",
    "en-US": "Two-step sign-in and the list of open sessions.",
  },

  legalTitle: { "fa-IR": "شرایط بازپرداخت", "en-US": "Refund terms" },
  legalBody: {
    "fa-IR":
      "این پاسخ حتی وقتی بسته است در بایت اول سرو می‌شود، پس جست‌وجوی درون‌صفحهٔ مرورگر پیدایش می‌کند و خودش بازش می‌کند — و موتور جست‌وجو هم می‌تواند نمایه‌اش کند.",
    "en-US":
      "This answer is served in the first byte even while collapsed, so the browser's own find-in-page locates it and expands it — and a search engine can index it.",
  },
} satisfies Record<string, LocalizedText>;

function SingleExample(l: Locale) {
  return (
    <div className="w-full max-w-md">
      <Disclosure id="shipping" defaultExpanded>
        <DisclosureTrigger>{t.shipping[l]}</DisclosureTrigger>
        <DisclosurePanel>{t.shippingBody[l]}</DisclosurePanel>
      </Disclosure>
    </div>
  );
}

function AccordionExample(l: Locale) {
  return (
    <DisclosureGroup className="w-full max-w-md" defaultExpandedKeys={["returns"]}>
      <Disclosure id="returns">
        <DisclosureTrigger>{t.returns[l]}</DisclosureTrigger>
        <DisclosurePanel>{t.returnsBody[l]}</DisclosurePanel>
      </Disclosure>
      <Disclosure id="warranty">
        <DisclosureTrigger>{t.warranty[l]}</DisclosureTrigger>
        <DisclosurePanel>{t.warrantyBody[l]}</DisclosurePanel>
      </Disclosure>
      <Disclosure id="invoice">
        <DisclosureTrigger>{t.invoice[l]}</DisclosureTrigger>
        <DisclosurePanel>{t.invoiceBody[l]}</DisclosurePanel>
      </Disclosure>
    </DisclosureGroup>
  );
}

function MultipleExample(l: Locale) {
  return (
    <DisclosureGroup
      allowsMultipleExpanded
      className="w-full max-w-md"
      defaultExpandedKeys={["network", "storage"]}
    >
      <Disclosure id="network">
        <DisclosureTrigger level={2}>{t.network[l]}</DisclosureTrigger>
        <DisclosurePanel>{t.networkBody[l]}</DisclosurePanel>
      </Disclosure>
      <Disclosure id="storage">
        <DisclosureTrigger level={2}>{t.storage[l]}</DisclosureTrigger>
        <DisclosurePanel>{t.storageBody[l]}</DisclosurePanel>
      </Disclosure>
      <Disclosure id="security" isDisabled>
        <DisclosureTrigger level={2}>{t.security[l]}</DisclosureTrigger>
        <DisclosurePanel>{t.securityBody[l]}</DisclosurePanel>
      </Disclosure>
    </DisclosureGroup>
  );
}

function KeepMountedExample(l: Locale) {
  return (
    <div className="w-full max-w-md">
      <Disclosure id="refunds">
        <DisclosureTrigger>{t.legalTitle[l]}</DisclosureTrigger>
        <DisclosurePanel keepMounted="until-found">{t.legalBody[l]}</DisclosurePanel>
      </Disclosure>
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "display",
    title: { "fa-IR": "بخش تاشو", "en-US": "Disclosure" },
    intro: {
      "fa-IR":
        "بخشی که باز و بسته می‌شود، و آکاردئونی که چندتایشان را گروه می‌کند. حتی یک بخشِ تنها هم ریشهٔ آکاردئون خودش را می‌سازد، و این یک ترفند نیست بلکه تنها راهی است که پنل نقشِ ناحیه و نامی از سرآیندش بگیرد — بدون آن، کسی که وارد پنل می‌شود ماشه را پشت سر گذاشته و هیچ‌چیز نمی‌گوید در کدام بخش است. سرآیند تزئین نیست: همان است که بخش را وارد فهرست عناوین سند می‌کند.",
      "en-US":
        "A section that opens and closes, and the accordion that groups several. Even a lone section builds its own accordion root, and that is not a trick but the only way its panel gets a region role and a name from its heading — without which a reader who navigates INTO the panel has left the trigger behind and has nothing saying which section they are in. The heading is not decoration: it is what puts the section in the document outline.",
    },
    composition: [
      `<DisclosureGroup allowsMultipleExpanded defaultExpandedKeys>`,
      `  <Disclosure id isDisabled>`,
      `    <DisclosureTrigger level={2}>…</DisclosureTrigger>  ← a real heading`,
      `    <DisclosurePanel keepMounted="until-found">…</DisclosurePanel>`,
      `  </Disclosure>`,
      `</DisclosureGroup>`,
      ``,
      `A LONE <Disclosure> needs no group — it renders its own root.`,
    ].join("\n"),
    parts: [
      {
        name: "DisclosureGroup",
        description: {
          "fa-IR":
            "دارندهٔ حالتِ باز و بسته برای چند بخش. allowsMultipleExpanded صریح پاس داده می‌شود و نه به پیش‌فرضِ موتور سپرده، چون پیش‌فرضِ یک موتور عددی است که در انتشار اصلاحی جابه‌جا می‌شود — و اگر وارونه می‌بود، هر آکاردئونِ تک‌بازِ هر پروژه‌ای بی‌صدا چندباز می‌شد. کلیدها همان کلیدهای Disclosure اند و به‌عنوان شناسهٔ DOM بازنشر نمی‌شوند، وگرنه دو آکاردئون با بخش‌های هم‌نام شناسهٔ تکراری می‌ساختند.",
          "en-US":
            "Owns the expansion state for several sections. `allowsMultipleExpanded` is passed explicitly rather than left to the engine's default, because an engine default is a value that moves in a patch release — and an inverted one would have silently turned every single-open accordion in every project into a multi-open one. The keys are the `Disclosure` ids and are NOT republished as DOM ids, or two accordions offering the same section would emit duplicates.",
        },
      },
      {
        name: "Disclosure",
        description: {
          "fa-IR":
            "یک بخش. اگر درون گروه باشد فقط یک موردِ آکاردئون است و اگر تنها باشد ریشهٔ خودش را هم می‌سازد — و این را از یک context می‌فهمد و نه از نوعِ فرزندش. تشخیص از روی نوعِ فرزند در jsdom کار می‌کند و به‌محضِ اینکه یک جزءِ سروری درخت را بسازد بی‌صدا از کار می‌افتد.",
          "en-US":
            "One section. Inside a group it is only an accordion item; alone it renders its own root too — and it learns which from a CONTEXT rather than from its child's type. Detecting it by child type passes jsdom and quietly fails the moment a SERVER component composes the tree.",
        },
      },
      {
        name: "DisclosureTrigger",
        description: {
          "fa-IR":
            "سرآیند و دکمه‌اش. پیش‌فرض سطح سه است، همان سطحی که ساختِ پیشین داشت، و سطحِ دیگر یک بازنویسیِ عنصر است — پس حالتِ رایج عنصرِ خودِ موتور را سرو می‌کند و هیچ‌چیز شبیه‌سازی نمی‌شود. متن به لبهٔ خواندن می‌چسبد و چِوِرون با ms-auto به لبهٔ پایانی رانده می‌شود.",
          "en-US":
            "The heading and its button. It defaults to level three — the level the previous build defaulted to — and another level is an element override, so the common case serves the engine's own element and nothing is cloned. The label hugs the reading edge and the chevron is pushed to the trailing one with `ms-auto`.",
        },
      },
      {
        name: "DisclosurePanel",
        description: {
          "fa-IR":
            "خودِ بخش، با نقشِ ناحیه و نامی که به ماشه اشاره می‌کند. keepMounted آن را بسته ولی حاضر در بایت اول می‌گذارد و until-found اجازه می‌دهد جست‌وجوی خودِ مرورگر بازش کند. روشن نیست، چون روشن‌کردنش چیزی را که هر مصرف‌کننده امروز سرو می‌کند عوض می‌کند.",
          "en-US":
            "The section itself, with a region role and a name pointing back at the trigger. `keepMounted` puts it in the first byte behind `hidden`, and `\"until-found\"` lets the browser's own find-in-page reveal it. It is off by default, because switching it on changes what every existing consumer ships in their first byte.",
        },
      },
      {
        name: "disclosureChevronVariants",
        description: {
          "fa-IR":
            "چرخشِ نگاره. نیم‌دور و نه ربع‌دور: صد و هشتاد درجه آینهٔ خودش است و جفتِ بالا/پایین کاملاً روی محور بلوکی زندگی می‌کند، پس در فارسی و انگلیسی یکسان خوانده می‌شود. قاعده روی گروهِ نام‌دارِ خودِ ماشه نشسته و نه دو سطح بالاتر، چون انتخابگری که مجبور باشد دو پله بپرد همان است که در بازآرایی تصادفی زنده می‌ماند.",
          "en-US":
            "The glyph's rotation. A HALF turn rather than a quarter: 180° is its own mirror image and an up/down pair lives entirely on the block axis, so it reads identically in Persian and English. The rule sits on the trigger's own named group rather than two levels up, because a selector that has to hop two levels is the kind that survives a refactor by accident.",
        },
      },
    ],
  },
  examples: [
    {
      id: "single",
      title: { "fa-IR": "یک بخش، و باز هم یک ناحیه", "en-US": "One section, and still a region" },
      description: {
        "fa-IR":
          "بخشِ تنها هم ریشهٔ خودش را می‌سازد، پس پنلش نقشِ ناحیه دارد و نامش از همان سرآیند می‌آید. بازش کنید و بعد با کلید فوکوس وارد متن شوید: صفحه‌خوان نام بخش را می‌گوید، چون پنل چیزی بیش از یک div است. با آن نگاشتِ ساده‌ترِ موتور، اینجا سکوت بود.",
        "en-US":
          "A lone section builds its own root, so its panel has a region role and takes its name from that heading. Expand it, then move focus into the text: a screen reader says the section's name, because the panel is more than a `div`. With the engine's more obvious mapping there would be silence here.",
      },
      render: SingleExample,
    },
    {
      id: "accordion",
      title: { "fa-IR": "یکی باز، بقیه بسته", "en-US": "One open, the rest closed" },
      description: {
        "fa-IR":
          "گروهِ بدون allowsMultipleExpanded یکی‌یکی باز می‌شود و کلیدِ باز از defaultExpandedKeys می‌آید. سه سرآیند سه ورودیِ واقعی در فهرست عناوین‌اند، پس یک خوانندهٔ صفحه‌خوان می‌تواند میان پرسش‌ها بپرد بی‌آنکه پاسخ‌ها را رد کند — که همان کاری است که یک تیترِ خاکستریِ ساده نمی‌کند.",
        "en-US":
          "A group with no `allowsMultipleExpanded` opens one at a time, and the open key comes from `defaultExpandedKeys`. The three headings are three real outline entries, so a screen-reader user can jump between the questions without walking the answers — which a grey styled title does not offer.",
      },
      render: AccordionExample,
    },
    {
      id: "multiple",
      title: { "fa-IR": "چند باز، و یکی که باز نمی‌شود", "en-US": "Several open, and one that will not" },
      description: {
        "fa-IR":
          "allowsMultipleExpanded دو بخش را هم‌زمان باز نگه می‌دارد، و سطحِ دو روی ماشه‌ها سرآیندها را یک پله بالاتر می‌برد تا زیرِ عنوانِ همین صفحه بنشینند — یک بازنویسیِ عنصر که همهٔ ویژگی‌های داده‌ای‌اش را نگه می‌دارد. بخشِ سوم isDisabled است: ماشه‌اش می‌ماند و کم‌رنگ می‌شود، پس خواننده می‌داند چنین بخشی هست و اکنون بسته است.",
        "en-US":
          "`allowsMultipleExpanded` keeps two sections open at once, and `level={2}` lifts the headings one step so they sit under this page's own title — an element override that keeps every data attribute. The third section is `isDisabled`: its trigger stays and dims, so the reader knows the section exists and is currently closed to them.",
      },
      render: MultipleExample,
    },
    {
      id: "keep-mounted",
      title: { "fa-IR": "پاسخی که بسته هم سرو می‌شود", "en-US": "An answer served while collapsed" },
      description: {
        "fa-IR":
          "keepMounted=\"until-found\" پنل را پشتِ hidden در بایت اول می‌گذارد. عبارتی از متنِ پاسخ را با جست‌وجوی درون‌صفحهٔ مرورگر بجویید: خودِ مرورگر بخش را باز می‌کند، بدون یک خط جاوااسکریپت. برای پرسش‌های پرتکرار همین است که نمایه‌شدن را ممکن می‌کند — پاسخی که در بایت‌های سرو‌شده نباشد پاسخی است که هیچ موتور جست‌وجویی نمی‌بیند.",
        "en-US":
          "`keepMounted=\"until-found\"` puts the panel in the first byte behind `hidden`. Search for a phrase from the answer with the browser's own find-in-page: the browser expands the section itself, with no JavaScript at all. For an FAQ that is what makes it indexable — an answer absent from the served bytes is an answer no search engine sees.",
      },
      render: KeepMountedExample,
    },
  ],
};
