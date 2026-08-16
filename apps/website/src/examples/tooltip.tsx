import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { Button, IconButton, Tooltip, TooltipTrigger } from "@lumo-ui/ui";
import { BellIcon, LinkIcon, Trash2Icon } from "lucide-react";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the tooltip page. Contract: `_system/types.ts`.
 *
 * A SERVER module — nothing here takes a function prop.
 *
 * ── WHY THE PAGE SHOWS BUTTONS ──────────────────────────────────────────────
 *
 * A closed tooltip renders `null`. So the descriptions below are absent from
 * the served bytes, which `packages/core/src/strings.ts` records as a real
 * measurement error rather than a footnote: a first-byte string sweep scores an
 * overlay clean whether it is or not. Hover or Tab to a control to see one.
 *
 * ── A TOOLTIP IS A DESCRIPTION, NEVER A NAME ────────────────────────────────
 *
 * That is the rule this whole page exists to make visible, and it is why NO
 * prop in the component is called `label`. An icon-only trigger still needs its
 * own name — `IconButton`'s `label` — and the tooltip adds a sentence beside
 * it. A control whose only name is its tooltip is a control that is nameless
 * for anyone who never hovers, which is everyone using a keyboard reader.
 *
 * ── THE ATTRIBUTE THAT IS THERE ONLY WHILE THE PANEL IS ─────────────────────
 *
 * The engine underneath emits no `role="tooltip"`, no `id` and no
 * `aria-describedby` at all — measured, and confirmed against its source: the
 * only `aria-*` anywhere in its tooltip module is an `aria-hidden` on the
 * arrow. So the tooltip was visible text that assistive technology was never
 * pointed at, and it produced ZERO English, which is why every string-counting
 * measurement scored it clean while a screen-reader user got nothing.
 *
 * This component states the role and wires the id — but only WHILE OPEN. An
 * unconditional `aria-describedby` would point at an element that does not
 * exist in the first byte, which is a dangling idref: trading a missing
 * relationship for a broken one is not a fix.
 *
 * ── AND TWO PROPS THAT ARE ACCEPTED AND INERT ───────────────────────────────
 *
 * `delay` and `closeDelay` on the trigger. The engine has no per-tooltip delay:
 * it lives on an app-level provider whose whole purpose is that a set of
 * tooltips SHARE one. Honouring a per-tooltip delay would mean wrapping each
 * trigger in its own provider, which defeats the grouping and changes hover-out
 * behaviour between neighbours. They are dropped, and said so.
 */

const t = {
  deleteRow: { "fa-IR": "حذف", "en-US": "Delete" },
  deleteRowTip: { "fa-IR": "این ردیف را از فهرست بردار", "en-US": "Remove this row from the list" },

  copyLink: { "fa-IR": "رونوشت نشانی", "en-US": "Copy link" },
  copyLinkTip: {
    "fa-IR": "نشانی عمومی این گزارش را در حافظه می‌گذارد",
    "en-US": "Puts the report's public address on the clipboard",
  },

  notify: { "fa-IR": "اعلان‌ها", "en-US": "Notifications" },
  notifyTip: {
    "fa-IR": "پیام‌های خوانده‌نشده و هشدارهای سامانه",
    "en-US": "Unread messages and system warnings",
  },

  export: { "fa-IR": "برون‌بری", "en-US": "Export" },
  exportTip: {
    "fa-IR": "پرونده در قالب سی‌اس‌وی ساخته می‌شود",
    "en-US": "The file is produced as CSV",
  },

  archive: { "fa-IR": "بایگانی", "en-US": "Archive" },
  archiveTip: {
    "fa-IR": "این جای‌گیری روی محور بلوکی است و در هر دو خط یکسان می‌ماند",
    "en-US": "This placement is on the block axis and is identical in both scripts",
  },
  publish: { "fa-IR": "انتشار", "en-US": "Publish" },
  publishTip: {
    "fa-IR": "این یکی روی محور درون‌خطی است و با زبان جابه‌جا می‌شود",
    "en-US": "This one is on the inline axis and moves with the language",
  },

  locked: { "fa-IR": "ویرایش قفل است", "en-US": "Editing is locked" },
  lockedTip: {
    "fa-IR": "این راهنما هرگز باز نمی‌شود",
    "en-US": "This tooltip never opens",
  },
} satisfies Record<string, LocalizedText>;

function IconExample(l: Locale) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <TooltipTrigger>
        <IconButton label={t.deleteRow[l]} variant="outline">
          <Trash2Icon aria-hidden="true" />
        </IconButton>
        <Tooltip>{t.deleteRowTip[l]}</Tooltip>
      </TooltipTrigger>
      <TooltipTrigger>
        <IconButton label={t.copyLink[l]} variant="outline">
          <LinkIcon aria-hidden="true" />
        </IconButton>
        <Tooltip>{t.copyLinkTip[l]}</Tooltip>
      </TooltipTrigger>
      <TooltipTrigger>
        <IconButton label={t.notify[l]} variant="outline">
          <BellIcon aria-hidden="true" />
        </IconButton>
        <Tooltip>{t.notifyTip[l]}</Tooltip>
      </TooltipTrigger>
    </div>
  );
}

function TextTriggerExample(l: Locale) {
  return (
    <TooltipTrigger>
      <Button variant="outline">{t.export[l]}</Button>
      <Tooltip>{t.exportTip[l]}</Tooltip>
    </TooltipTrigger>
  );
}

function PlacementExample(l: Locale) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <TooltipTrigger>
        <Button variant="outline">{t.archive[l]}</Button>
        <Tooltip placement="bottom">{t.archiveTip[l]}</Tooltip>
      </TooltipTrigger>
      <TooltipTrigger>
        <Button variant="outline">{t.publish[l]}</Button>
        <Tooltip placement="end">{t.publishTip[l]}</Tooltip>
      </TooltipTrigger>
    </div>
  );
}

function DisabledExample(l: Locale) {
  return (
    <TooltipTrigger isDisabled>
      <Button variant="outline" isDisabled>
        {t.locked[l]}
      </Button>
      <Tooltip>{t.lockedTip[l]}</Tooltip>
    </TooltipTrigger>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "نام یا توضیح کوتاه یک کنترل بدون برچسب دیده‌شدنی (دکمهٔ آیکونی) که با شناور شدن یا فوکوس می‌آید. محتوا متن ساده است.",
        "en-US": "The name or a short description of a control without a visible label (an icon button), shown on hover or focus. Plain text only.",
      },
      whenNot: {
        "fa-IR": "محتوا تعامل دارد یا بلند است — `Popover` یا `HoverCard`. اطلاعات مهم که همیشه باید دیده شود — برچسب یا `Description` واقعی.",
        "en-US": "The content is interactive or long — `Popover` or `HoverCard`. Information that must always be visible — a real label or `Description`.",
      },
    },
    tier: "overlay",
    title: { "fa-IR": "راهنمای ابزار", "en-US": "Tooltip" },
    intro: {
      "fa-IR":
        "جمله‌ای کوتاه که با نگه‌داشتنِ اشاره‌گر یا رسیدنِ فوکوس ظاهر می‌شود. توضیح است و هرگز نام — به همین دلیل هیچ ویژگی‌ای در این جزء label نام ندارد و دکمهٔ نگاره‌ای همچنان نامِ خودش را لازم دارد. موتورِ زیرین اینجا هیچ نقشی و هیچ ارجاعی منتشر نمی‌کند، پس این پرونده role را می‌گوید و شناسه را وصل می‌کند — اما تنها وقتی که راهنما باز است، وگرنه ارجاع به عنصری اشاره می‌کرد که در بایت اول وجود ندارد. راهنمای بسته null است.",
      "en-US":
        "A short sentence that appears on hover or focus. It is a DESCRIPTION and never a name — which is why no prop here is called `label` and an icon-only button still needs its own. The engine underneath publishes no role and no reference at all, so this file states the `role` and wires the id — but only WHILE OPEN, or the reference would point at an element that is not in the first byte. A closed tooltip is `null`.",
    },
    composition: [
      `<TooltipTrigger isDisabled>`,
      `  <IconButton label="حذف">…</IconButton>   ← the NAME lives here`,
      `  <Tooltip placement="top">…</Tooltip>     ← the DESCRIPTION lives here`,
      `</TooltipTrigger>`,
      ``,
      `delay / closeDelay are accepted and INERT — see the file header.`,
    ].join("\n"),
    parts: [
      {
        name: "TooltipTrigger",
        description: {
          "fa-IR":
            "دارندهٔ حالتِ نگه‌داشتن و فوکوس. هیچ DOM ای رندر نمی‌کند و className نمی‌گیرد. فرزندِ اولش به‌عنوان لنگر بالا برده می‌شود و aria-describedby را می‌گیرد — که تنها هنگام باز بودن روی آن می‌نشیند، پس نه در بایت اول هست و نه آویزان می‌ماند. isDisabled کلِ راهنما را خاموش می‌کند و کنترل سرِ جایش می‌ماند.",
          "en-US":
            "Owns the hover and focus state. It renders no DOM and takes no `className`. Its first child is lifted into the anchor and receives `aria-describedby` — present only while open, so it is neither in the first byte nor dangling. `isDisabled` switches the whole tooltip off and leaves the control alone.",
        },
      },
      {
        name: "Tooltip",
        description: {
          "fa-IR":
            "خودِ سطح، که role=\"tooltip\" و شناسه را همین‌جا اعلام می‌کند. جای‌گیری‌اش منطقی است و پیش‌فرضش بالاست — روی محور بلوکی، پس در هر دو خط یکسان. offset و crossOffset به موتور پاس داده می‌شوند.",
          "en-US":
            "The surface itself, which declares `role=\"tooltip\"` and its id here. Its placement is logical and defaults to `top` — on the block axis, so identical in both scripts. `offset` and `crossOffset` are handed to the engine.",
        },
      },
      {
        name: "tooltipVariants",
        description: {
          "fa-IR":
            "سطحِ وارونه: bg-fg روی text-bg، نه یک خاکستریِ ثابت — پس راهنما در هر دو پوسته نقطهٔ مقابلِ صفحه می‌ماند بدون هیچ نوعِ dark:. جابه‌جاییِ کوچکِ ورود روی محور بلوکی است و آینه نمی‌شود.",
          "en-US":
            "An inverted surface: `bg-fg` on `text-bg` rather than a hardcoded slate — so the tooltip stays the opposite of the page in both themes with no `dark:` variant. The small entry offset is on the block axis and does not mirror.",
        },
      },
      {
        name: "IconButton",
        description: {
          "fa-IR":
            "دکمه‌ای که تنها یک نگاره است، و رایج‌ترین لنگرِ راهنما. label اش نام است و راهنما توضیح: اگر نامِ کنترل را در راهنما بگذارید، برای کسی که هرگز نگه نمی‌دارد کنترل بی‌نام است.",
          "en-US":
            "A button that is only a glyph, and the commonest tooltip anchor. Its `label` is the NAME and the tooltip is the description: put the control's name in the tooltip and the control is nameless for anyone who never hovers.",
        },
      },
    ],
  },
  examples: [
    {
      id: "icon-controls",
      title: { "fa-IR": "نام روی دکمه، توضیح در راهنما", "en-US": "The name on the button, the description in the tip" },
      description: {
        "fa-IR":
          "هر سه دکمه label خودشان را دارند، پس صفحه‌خوان «حذف، دکمه» می‌گوید و راهنما جملهٔ دومی است که با aria-describedby به آن اضافه می‌شود. با کلید تب میانشان بروید: راهنما با فوکوس هم باز می‌شود، نه فقط با اشاره‌گر — و اگر نامِ دکمه‌ها را برمی‌داشتیم، سه دکمهٔ بی‌نام می‌ماند که قاعدهٔ named-controls را می‌شکند.",
        "en-US":
          "All three buttons carry their own `label`, so a screen reader says «حذف، button» and the tooltip is a SECOND sentence added through `aria-describedby`. Tab between them: the tip opens on focus too, not only on hover — and had the labels been left off, three nameless buttons would fail `named-controls`.",
      },
      render: IconExample,
    },
    {
      id: "text-trigger",
      title: { "fa-IR": "راهنما روی دکمهٔ متنی", "en-US": "A tip on a button that already has words" },
      description: {
        "fa-IR":
          "دکمه نامش را از متنِ خودش دارد، پس راهنما چیزی می‌گوید که متن نمی‌گوید — قالبِ برون‌بری. راهنمایی که فقط نامِ دکمه را تکرار کند دو بار خوانده می‌شود و چیزی اضافه نمی‌کند.",
        "en-US":
          "The button's name is its own text, so the tip says what the text does not — the export format. A tip that merely repeats the button's name is read twice and adds nothing.",
      },
      render: TextTriggerExample,
    },
    {
      id: "placement",
      title: { "fa-IR": "دو محور، دو رفتار", "en-US": "Two axes, two behaviours" },
      description: {
        "fa-IR":
          "اولی bottom است: روی محور بلوکی، پس در فارسی و انگلیسی دقیقاً یک‌جا می‌افتد. دومی end است: روی محور درون‌خطی، پس در انگلیسی سمت راستِ دکمه می‌نشیند و در فارسی سمت چپش. هیچ املای فیزیکی‌ای در دسترس نیست — نوع، هر رشته‌ای را که left یا right دارد کنار گذاشته.",
        "en-US":
          "The first is `bottom`: on the block axis, so it lands in exactly the same place in both scripts. The second is `end`: on the inline axis, so it sits to the right of the button in English and to its left in Persian. No physical spelling is available — the type excludes every string containing `left` or `right`.",
      },
      render: PlacementExample,
    },
    {
      id: "disabled",
      title: { "fa-IR": "کنترلی که هیچ راهنمایی ندارد", "en-US": "A control with no tip at all" },
      description: {
        "fa-IR":
          "isDisabled روی بازکننده راهنما را خاموش می‌کند و دکمه سرِ جایش می‌ماند. توجه کنید که دکمه نامِ خودش را همچنان دارد: راهنمای خاموش نباید کنترل را بی‌نام کند، و این دقیقاً همان چیزی است که وقتی نام در راهنما زندگی می‌کرد اتفاق می‌افتاد.",
        "en-US":
          "`isDisabled` on the trigger switches the tip off and leaves the button where it was. Note that the button still has its own name: switching a tip off must not make a control nameless, which is exactly what happened when the name lived in the tip.",
      },
      render: DisabledExample,
    },
  ],
};
