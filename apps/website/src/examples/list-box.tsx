import type { Locale } from "@lumo-ui/core";
import { ListBox, ListBoxItem } from "@lumo-ui/ui";
import { AsyncListBoxIsland } from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the list-box page. Contract: `_system/types.ts`.
 *
 * A SERVER module: selection is uncontrolled on this page, so nothing needs a
 * function prop and every option's text is in the served bytes.
 *
 * ── THIS IS THE ONE COMPONENT THAT DID NOT MOVE ENGINES, AND WHY ────────────
 *
 * There is no listbox primitive in the Base UI half of the library — the
 * upstream issue asking for one is still open — and this component owns none of
 * the ARIA it needs. Every line of `list-box.tsx` is a class string, a prop
 * rename or a comment; the engine underneath supplies `role="listbox"`,
 * `role="option"`, `aria-selected`, `aria-multiselectable`, ONE tab stop with a
 * roving tabindex, arrow keys resolved against the document direction,
 * typeahead with a collator that treats ی and ي as equal, the selection model,
 * and Home/End/PageUp/PageDown with shift-ranges. That is a state machine, not
 * a composition, so the recommendation is to wait rather than to own it.
 *
 * ── WHY IT EXISTS SEPARATELY FROM Select AND ComboBox ───────────────────────
 *
 * Both of those wrap a listbox and bind it to a popover, so the listbox is
 * unreachable outside the overlay. The master pane of a list/detail screen is a
 * listbox in every sense that matters and had to be built from `<Button>` rows
 * instead — which works and is announced, and loses two things no CSS can
 * recover: fifty buttons are fifty tab stops, and typing «س» jumps to nothing.
 *
 * ── AND ONE FIRST-BYTE FIX WORTH KNOWING ABOUT ──────────────────────────────
 *
 * Each option's text is wrapped in the engine's own `Text` part rather than a
 * `<span>`. Its option hook mints a label id and points `aria-labelledby` at
 * it, and it only CLEARS an unclaimed id inside a layout effect — which never
 * runs on a server. Measured in the prerendered bytes: `aria-labelledby` on
 * every option pointing at an element that does not exist. That is a dangling
 * idref, `lumo-gate` fails a build over exactly it, and it went unnoticed for
 * so long because Select's and ComboBox's listboxes live inside popovers, which
 * render `null` during SSR.
 */

const t = {
  cities: { "fa-IR": "شهر مقصد", "en-US": "Destination city" },
  tehran: { "fa-IR": "تهران", "en-US": "Tehran" },
  isfahan: { "fa-IR": "اصفهان", "en-US": "Isfahan" },
  shiraz: { "fa-IR": "شیراز", "en-US": "Shiraz" },
  tabriz: { "fa-IR": "تبریز", "en-US": "Tabriz" },
  mashhad: { "fa-IR": "مشهد", "en-US": "Mashhad" },
  yazd: { "fa-IR": "یزد", "en-US": "Yazd" },

  channels: { "fa-IR": "کانال‌های اعلام", "en-US": "Notification channels" },
  email: { "fa-IR": "ایمیل", "en-US": "Email" },
  sms: { "fa-IR": "پیامک", "en-US": "SMS" },
  push: { "fa-IR": "اعلان درون‌برنامه", "en-US": "In-app push" },
  phone: { "fa-IR": "تماس تلفنی", "en-US": "Phone call" },

  plans: { "fa-IR": "طرح اشتراک", "en-US": "Subscription plan" },
  free: { "fa-IR": "رایگان", "en-US": "Free" },
  team: { "fa-IR": "تیمی", "en-US": "Team" },
  business: { "fa-IR": "سازمانی", "en-US": "Business" },
  enterprise: { "fa-IR": "سازمانی بزرگ — به‌زودی", "en-US": "Enterprise — coming soon" },

  inbox: { "fa-IR": "صندوق پیام‌ها", "en-US": "Message inbox" },
  msgOne: { "fa-IR": "سمیرا محمدی — دربارهٔ فاکتور", "en-US": "Samira Mohammadi — about the invoice" },
  msgTwo: { "fa-IR": "پشتیبانی — پرونده بسته شد", "en-US": "Support — your case was closed" },
  msgThree: { "fa-IR": "انبار تهران — کالا رسید", "en-US": "Tehran warehouse — the goods arrived" },
  msgFour: { "fa-IR": "حسابداری — یادآوری پرداخت", "en-US": "Accounting — a payment reminder" },
  msgFive: { "fa-IR": "کامیاب نظری — بازبینی طراحی", "en-US": "Kamyab Nazari — design review" },
  remote: { "fa-IR": "مخزن‌های دور", "en-US": "Remote repositories" },
  failed: { "fa-IR": "دریافت مخزن‌ها ناموفق بود", "en-US": "Repositories could not be loaded" },
  retry: { "fa-IR": "تلاش دوباره", "en-US": "Retry" },
  noRepos: { "fa-IR": "مخزنی پیدا نشد", "en-US": "No repositories found" },
  lumo: { "fa-IR": "لومو", "en-US": "Lumo" },
  gate: { "fa-IR": "دروازه", "en-US": "Gate" },
} satisfies Record<string, LocalizedText>;

function SingleExample(l: Locale) {
  return (
    <ListBox
      label={t.cities[l]}
      selectionMode="single"
      defaultSelectedKeys={["isfahan"]}
      className="max-w-xs rounded-md border border-border bg-surface"
    >
      <ListBoxItem id="tehran">{t.tehran[l]}</ListBoxItem>
      <ListBoxItem id="isfahan">{t.isfahan[l]}</ListBoxItem>
      <ListBoxItem id="shiraz">{t.shiraz[l]}</ListBoxItem>
      <ListBoxItem id="tabriz">{t.tabriz[l]}</ListBoxItem>
      <ListBoxItem id="mashhad">{t.mashhad[l]}</ListBoxItem>
      <ListBoxItem id="yazd">{t.yazd[l]}</ListBoxItem>
    </ListBox>
  );
}

function MultipleExample(l: Locale) {
  return (
    <ListBox
      label={t.channels[l]}
      selectionMode="multiple"
      defaultSelectedKeys={["email", "push"]}
      className="max-w-xs rounded-md border border-border bg-surface"
    >
      <ListBoxItem id="email">{t.email[l]}</ListBoxItem>
      <ListBoxItem id="sms">{t.sms[l]}</ListBoxItem>
      <ListBoxItem id="push">{t.push[l]}</ListBoxItem>
      <ListBoxItem id="phone">{t.phone[l]}</ListBoxItem>
    </ListBox>
  );
}

function DisabledExample(l: Locale) {
  return (
    <ListBox
      label={t.plans[l]}
      selectionMode="single"
      defaultSelectedKeys={["team"]}
      disabledKeys={["enterprise"]}
      className="max-w-xs rounded-md border border-border bg-surface"
    >
      <ListBoxItem id="free">{t.free[l]}</ListBoxItem>
      <ListBoxItem id="team">{t.team[l]}</ListBoxItem>
      <ListBoxItem id="business">{t.business[l]}</ListBoxItem>
      <ListBoxItem id="enterprise">{t.enterprise[l]}</ListBoxItem>
    </ListBox>
  );
}

function MasterPaneExample(l: Locale) {
  return (
    <ListBox
      label={t.inbox[l]}
      selectionMode="single"
      defaultSelectedKeys={["two"]}
      className="max-h-48 max-w-sm rounded-md border border-border bg-surface"
    >
      <ListBoxItem id="one">{t.msgOne[l]}</ListBoxItem>
      <ListBoxItem id="two">{t.msgTwo[l]}</ListBoxItem>
      <ListBoxItem id="three">{t.msgThree[l]}</ListBoxItem>
      <ListBoxItem id="four">{t.msgFour[l]}</ListBoxItem>
      <ListBoxItem id="five">{t.msgFive[l]}</ListBoxItem>
    </ListBox>
  );
}

function AsyncExample(l: Locale) {
  return (
    <AsyncListBoxIsland
      label={t.remote[l]}
      errorText={t.failed[l]}
      retryLabel={t.retry[l]}
      emptyText={t.noRepos[l]}
      items={[
        { id: "lumo", label: t.lumo[l] },
        { id: "gate", label: t.gate[l] },
      ]}
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "data",
    title: { "fa-IR": "فهرست انتخابی", "en-US": "List box" },
    intro: {
      "fa-IR":
        "فهرستی که انتخاب می‌شود، بدون پاپ‌اور و بدون بازکننده — و همین نبودِ پاپ‌اور دلیلِ وجودش است. Select و ComboBox هر دو یک فهرست را در یک لایهٔ شناور می‌بندند، پس پنلِ اصلیِ یک صفحهٔ فهرست‌وجزئیات ناچار از ردیف‌های دکمه‌ای ساخته می‌شد: پنجاه دکمه یعنی پنجاه ایستِ تب، و تایپِ «س» به هیچ‌جا نمی‌پرد. اینجا کلِ فهرست یک ایست است، کلیدهای جهت میان گزینه‌ها می‌روند و تایپ به اولین گزینهٔ هم‌آغاز می‌پرد. label اجباری است: یک role=\"listbox\" بی‌نام یک ایستِ تب است که «فهرست انتخابی» می‌گوید و هیچ.",
      "en-US":
        "A list you select from, with no popover and no trigger — and that absence is the whole reason it exists. `Select` and `ComboBox` both bind a listbox inside a floating layer, so the master pane of a list/detail screen had to be built from button rows: fifty buttons are fifty tab stops, and typing «س» jumps nowhere. Here the whole list is ONE stop, arrow keys move between options, and typing jumps to the first option that starts with it. `label` is required: an unnamed `role=\"listbox\"` is a tab stop that announces «list box» and nothing else.",
    },
    composition: [
      `<ListBox label selectionMode selectedKeys defaultSelectedKeys`,
      `         disabledKeys onSelectionChange>`,
      `  <ListBoxItem id textValue isDisabled>…</ListBoxItem>`,
      `</ListBox>`,
    ].join("\n"),
    parts: [
      {
        name: "ListBox",
        description: {
          "fa-IR":
            "خودِ فهرست. یک ایستِ تب برای همه‌اش، با فوکوسِ گردان روی گزینه‌ها و کلیدهای جهت که از جهتِ خودِ سند حل می‌شوند. روی یک صفحهٔ فارسی هیچ رشتهٔ انگلیسی‌ای منتشر نمی‌کند — این اندازه‌گیری شده، و دو رشتهٔ انگلیسیِ ComboBox از قلابِ آن می‌آید و نه از این فهرست. پس نقصِ ممکن اینجا نشت نیست، بی‌نامی است.",
          "en-US":
            "The list itself. One tab stop for all of it, with roving focus over the options and arrow keys resolved against the document's own direction. On a Persian page it emits no English string at all — that was measured, and the ComboBox's two English labels come from its own hook rather than from this list. So the defect available here is not a leak; it is anonymity.",
        },
      },
      {
        name: "ListBoxItem",
        description: {
          "fa-IR":
            "یک گزینه. متنش با text-start می‌نشیند و علامتِ انتخاب با ms-auto به لبهٔ پایانی می‌رود — راست در انگلیسی، چپ در فارسی. علامت رندر می‌شود و به پس‌زمینهٔ رنگی بسنده نمی‌شود، چون رنگ به‌تنهایی ویژگیِ تمایزدهنده نیست؛ و aria-hidden است، چون انتخاب پیش‌تر به‌صورت aria-selected در درخت هست.",
          "en-US":
            "One option. Its text sits with `text-start` and the selection mark is pushed to the trailing edge with `ms-auto` — right in English, left in Persian. The mark is rendered rather than left to the background tint, because colour alone is not a distinguishing feature; and it is `aria-hidden`, because selection is already in the tree as `aria-selected`.",
        },
      },
      {
        name: "listBoxVariants",
        description: {
          "fa-IR":
            "جعبهٔ فهرست. overflow-auto دارد، پس سقفِ ارتفاع را با یک کلاس می‌گذارید و فهرست درونِ خودش می‌پیماید بدون آنکه ایستِ تبِ دومی بسازد.",
          "en-US":
            "The list's box. It carries `overflow-auto`, so a height cap is one class and the list scrolls inside itself without creating a second tab stop.",
        },
      },
      {
        name: "listBoxItemVariants",
        description: {
          "fa-IR":
            "کلاس‌های یک گزینه، شاملِ حالت‌های نگه‌داشتن، فوکوس، انتخاب و ازکارافتاده. گزینهٔ ازکارافتاده رویدادِ اشاره‌گر نمی‌گیرد و کلیدهای جهت هم از رویش می‌پرند، پس هزینهٔ صفحه‌کلیدش صفر است در حالی که هنوز دیده می‌شود.",
          "en-US":
            "One option's classes, including the hovered, focused, selected and disabled states. A disabled option takes no pointer events and arrow keys skip it, so it costs the keyboard nothing while remaining visible.",
        },
      },
    ],
  },
  examples: [
    {
      id: "single",
      title: { "fa-IR": "یک ایست، شش گزینه", "en-US": "One stop, six options" },
      description: {
        "fa-IR":
          "با کلید تب یک بار وارد شوید و بعد با کلیدهای جهت بگردید — نه شش بار تب. حالا «ش» را تایپ کنید: به شیراز می‌پرد، با تطبیقی که ی و ي را یکی می‌گیرد. هیچ‌کدام از این دو در نماگرفت دیده نمی‌شود و هر دو همان چیزی‌اند که یک ردیفِ دکمه‌ای از دست می‌دهد.",
        "en-US":
          "Tab in ONCE and then arrow through — not six tabs. Now type «ش»: it jumps to Shiraz, with a comparison that treats ی and ي as the same letter. Neither behaviour is visible in a screenshot, and both are what a row of buttons loses.",
      },
      render: SingleExample,
    },
    {
      id: "multiple",
      title: { "fa-IR": "چند انتخاب هم‌زمان", "en-US": "Several chosen at once" },
      description: {
        "fa-IR":
          "selectionMode=\"multiple\" فهرست را aria-multiselectable می‌کند، که همان چیزی است که به خواننده می‌گوید انتخابِ دوم انتخابِ اول را برنمی‌دارد — تفاوتی که تیکِ کنارِ ردیف‌ها به‌تنهایی نمی‌گوید. با شیفت‌+کلید جهت هم می‌شود بازه گرفت.",
        "en-US":
          "`selectionMode=\"multiple\"` makes the list `aria-multiselectable`, which is what tells a reader that a second choice does not replace the first — a difference the ticks beside the rows do not carry on their own. Shift with an arrow key selects a range.",
      },
      render: MultipleExample,
    },
    {
      id: "disabled",
      title: { "fa-IR": "گزینه‌ای که هست و انتخاب نمی‌شود", "en-US": "An option that exists and cannot be chosen" },
      description: {
        "fa-IR":
          "کلیدِ ازکارافتاده روی خودِ فهرست نوشته می‌شود و نه روی گزینه، چون معمولاً همان‌جایی است که داده‌اش هست. ردیف می‌ماند و کم‌رنگ می‌شود: برداشتنش به خواننده می‌گفت چنین طرحی وجود ندارد، در حالی که وجود دارد و برای این حساب باز نیست.",
        "en-US":
          "The disabled key is written on the LIST rather than on the option, because that is usually where the data lives. The row stays and dims: removing it would tell the reader that no such plan exists, when it does and is simply not open to this account.",
      },
      render: DisabledExample,
    },
    {
      id: "master-pane",
      title: { "fa-IR": "پنلِ اصلیِ یک صفحهٔ دو‌ستونی", "en-US": "The master pane of a two-column screen" },
      description: {
        "fa-IR":
          "همان چیزی که این جزء برای آن ساخته شده: فهرستی که می‌پیماید و یک ایستِ تب دارد، پس یک خواننده با صفحه‌کلید به‌جای رد‌شدن از پنج پیام، با یک تب به ستونِ جزئیات می‌رسد. سقفِ ارتفاع یک کلاس است و پیمایش درونِ همان جعبه می‌ماند.",
        "en-US":
          "The thing this component was built for: a list that scrolls and takes one tab stop, so a keyboard reader reaches the detail column with a single Tab instead of walking five messages. The height cap is one class and the scrolling stays inside that box.",
      },
      render: MasterPaneExample,
    },
    {
      id: "async",
      title: { "fa-IR": "خطا و بازیابیِ دور", "en-US": "Remote error and recovery" },
      description: {
        "fa-IR":
          "خطا و دکمهٔ تلاش دوباره بیرونِ role=listbox هستند، پس صفحه‌خوان آن‌ها را با گزینهٔ انتخابی اشتباه نمی‌گیرد. پس از بازیابی، گزینه‌های واقعی با همان مدلِ صفحه‌کلید وارد می‌شوند.",
        "en-US":
          "The error and retry action sit outside `role=listbox`, so assistive technology cannot mistake them for selectable options. After recovery, real options enter with the same keyboard model.",
      },
      render: AsyncExample,
    },
  ],
};
