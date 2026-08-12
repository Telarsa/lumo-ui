import type { Locale } from "@lumo-ui/core";
import {
  Button,
  IconButton,
  Popover,
  PopoverDescription,
  PopoverTrigger,
  Separator,
} from "@lumo-ui/ui";
import { InfoIcon } from "lucide-react";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the popover page. Contract: `_system/types.ts`.
 *
 * A SERVER module — nothing here needs a function prop, so every example
 * prerenders.
 *
 * ── WHAT THE PAGE CAN SHOW ──────────────────────────────────────────────────
 *
 * The triggers. A closed popover renders `null`, so every string inside one is
 * absent from the served bytes; `packages/core/src/strings.ts` records that as
 * a real measurement error, because a first-byte sweep scores an overlay clean
 * whether it is or not. Press a button to see the panel.
 *
 * ── THE ONE THING WORTH READING THIS PAGE FOR ───────────────────────────────
 *
 * `placement` is a CLOSED, LOGICAL union: the physical spellings are SUBTRACTED
 * from the type with a template-literal `Exclude`, so `"bottom left"` is not
 * discouraged — it does not compile. There is no way to write a popover that
 * refuses to mirror, which is the same property `drawer.tsx`'s `side` has and
 * the property Base UI's own `swipeDirection` does not.
 *
 * ── AND THE ONE THING THAT WOULD OTHERWISE BE INVISIBLE ─────────────────────
 *
 * The panel is a `role="dialog"` and the engine gives it NO accessible name: an
 * unnamed dialog is announced as bare "dialog", which is the same class of
 * defect as an unnamed checkbox and leaks no English, so it is invisible to
 * every string count. This component points the panel's `aria-labelledby` at
 * the TRIGGER, so the name is the trigger's visible text — unless the caller
 * names the panel explicitly, in which case relabelling would be the one way to
 * make things worse.
 */

const t = {
  moreOptions: { "fa-IR": "گزینه‌های بیشتر", "en-US": "More options" },
  optionsBody: {
    "fa-IR":
      "پنل نامِ خودش را از متنِ همین دکمه می‌گیرد، پس صفحه‌خوان «گزینه‌های بیشتر، محاوره» می‌گوید و نه فقط «محاوره».",
    "en-US":
      "The panel takes its name from this button's own text, so a screen reader says «More options, dialog» rather than bare «dialog».",
  },

  columns: { "fa-IR": "ستون‌ها", "en-US": "Columns" },
  columnsBody: {
    "fa-IR":
      "این پنل bottom start گرفته است: در فارسی از لبهٔ راست هم‌تراز می‌شود و در انگلیسی از لبهٔ چپ، با همان یک رشته.",
    "en-US":
      "This panel takes `bottom start`: it aligns to the right edge in Persian and the left in English, from the same one string.",
  },
  topEnd: { "fa-IR": "بالا، لبهٔ پایانی", "en-US": "Top, trailing edge" },
  topEndBody: {
    "fa-IR": "top end روی محور بلوکی است و هم‌ترازی‌اش روی محور درون‌خطی.",
    "en-US": "`top end` sits on the block axis and aligns along the inline one.",
  },
  inlineStart: { "fa-IR": "کنارِ آغاز", "en-US": "Beside the start" },
  inlineStartBody: {
    "fa-IR":
      "start یک ضلعِ درون‌خطی است و در موتور یک عضوِ واقعیِ اجتماع، نه ترجمه‌ای که این پرونده انجام دهد.",
    "en-US":
      "`start` is an inline SIDE, and a genuine union member in the engine rather than a translation this file performs.",
  },

  whatIsThis: { "fa-IR": "این چیست", "en-US": "What is this" },
  glossaryName: { "fa-IR": "توضیح این اصطلاح", "en-US": "About this term" },
  glossaryBody: {
    "fa-IR":
      "این پنل aria-label خودش را دارد، پس نامِ دکمه را نمی‌گیرد. برای دکمه‌ای که تنها یک نگاره است همین درست است: «این چیست» نامِ درستی برای یک پنلِ واژه‌نامه نیست.",
    "en-US":
      "This panel carries its own `aria-label`, so it does not take the button's name. For an icon-only trigger that is right: «What is this» is not a good name for a glossary panel.",
  },

  share: { "fa-IR": "هم‌رسانی", "en-US": "Share" },
  shareHeading: { "fa-IR": "هم‌رسانی این گزارش", "en-US": "Share this report" },
  shareCopy: { "fa-IR": "رونوشت نشانی", "en-US": "Copy link" },
  shareEmail: { "fa-IR": "فرستادن با ایمیل", "en-US": "Send by email" },
  shareEmbed: { "fa-IR": "کدِ جاسازی", "en-US": "Embed code" },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <PopoverTrigger>
      <Button variant="outline">{t.moreOptions[l]}</Button>
      <Popover className="max-w-xs">
        <PopoverDescription>{t.optionsBody[l]}</PopoverDescription>
      </Popover>
    </PopoverTrigger>
  );
}

function PlacementExample(l: Locale) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <PopoverTrigger>
        <Button variant="outline">{t.columns[l]}</Button>
        <Popover placement="bottom start" className="max-w-xs">
          <PopoverDescription>{t.columnsBody[l]}</PopoverDescription>
        </Popover>
      </PopoverTrigger>
      <PopoverTrigger>
        <Button variant="outline">{t.topEnd[l]}</Button>
        <Popover placement="top end" className="max-w-xs">
          <PopoverDescription>{t.topEndBody[l]}</PopoverDescription>
        </Popover>
      </PopoverTrigger>
      <PopoverTrigger>
        <Button variant="outline">{t.inlineStart[l]}</Button>
        <Popover placement="start" className="max-w-xs">
          <PopoverDescription>{t.inlineStartBody[l]}</PopoverDescription>
        </Popover>
      </PopoverTrigger>
    </div>
  );
}

function NamedExample(l: Locale) {
  return (
    <PopoverTrigger>
      <IconButton label={t.whatIsThis[l]} variant="ghost">
        <InfoIcon aria-hidden="true" />
      </IconButton>
      <Popover aria-label={t.glossaryName[l]} className="max-w-xs">
        <PopoverDescription>{t.glossaryBody[l]}</PopoverDescription>
      </Popover>
    </PopoverTrigger>
  );
}

function UnpaddedExample(l: Locale) {
  return (
    <PopoverTrigger>
      <Button variant="outline">{t.share[l]}</Button>
      <Popover padded={false} className="w-56">
        <PopoverDescription className="px-4 pt-3 pb-2 text-xs font-medium">
          {t.shareHeading[l]}
        </PopoverDescription>
        <Separator />
        <div className="flex flex-col p-1">
          <button
            type="button"
            className="rounded-sm px-3 py-2 text-start text-sm text-fg outline-none hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t.shareCopy[l]}
          </button>
          <button
            type="button"
            className="rounded-sm px-3 py-2 text-start text-sm text-fg outline-none hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t.shareEmail[l]}
          </button>
          <button
            type="button"
            className="rounded-sm px-3 py-2 text-start text-sm text-fg outline-none hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t.shareEmbed[l]}
          </button>
        </div>
      </Popover>
    </PopoverTrigger>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "overlay",
    title: { "fa-IR": "پاپ‌اور", "en-US": "Popover" },
    intro: {
      "fa-IR":
        "سطحی شناور که به یک کنترل لنگر انداخته و با فشردنِ آن باز می‌شود. جای‌گیری‌اش یک اجتماعِ بستهٔ منطقی است و املاهای فیزیکی از خودِ نوع کم شده‌اند: «bottom left» ناپسند نیست، کامپایل نمی‌شود. پنل یک محاوره است و موتور هیچ نامی به آن نمی‌دهد، پس این جزء aria-labelledby را به دکمه وصل می‌کند مگر آنکه خودتان نامش را بنویسید. در بایت اول فقط دکمه هست؛ پنلِ بسته null است و رشته‌هایش اصلاً سرو نمی‌شوند.",
      "en-US":
        "A floating surface anchored to a control and opened by pressing it. Its placement is a CLOSED, logical union with the physical spellings subtracted from the type: «bottom left» is not discouraged, it does not compile. The panel is a dialog and the engine gives it no name, so this component points `aria-labelledby` at the trigger unless you write a name yourself. Only the trigger is in the first byte; a closed panel is `null` and its strings are never served.",
    },
    composition: [
      `<PopoverTrigger>`,
      `  <Button>…</Button>                     ← names the panel, unless you override it`,
      `  <Popover`,
      `    placement="bottom start"             ← logical ONLY. No left, no right.`,
      `    padded={false}                       ← for a panel that owns its own layout`,
      `    aria-label="…"                       ← wins over the trigger's text`,
      `    offset crossOffset>`,
      `    <PopoverDescription>…</PopoverDescription>   ← the string read AFTER the name`,
      `  </Popover>`,
      `</PopoverTrigger>`,
    ].join("\n"),
    parts: [
      {
        name: "PopoverTrigger",
        description: {
          "fa-IR":
            "دارندهٔ حالت. هیچ DOM ای رندر نمی‌کند، پس className هم نمی‌گیرد. فرزندِ اولش به‌عنوان دکمهٔ بازکننده بالا برده می‌شود و شناسه‌ای می‌گیرد که پنل با آن نام می‌گیرد — همان شناسه در بایت اول هم حاضر است، پس ارجاع هرگز آویزان نمی‌ماند.",
          "en-US":
            "Owns the state. It renders no DOM and therefore takes no `className`. Its first child is lifted into the trigger and given the id the panel is named by — an id that is present in the first byte too, so the reference can never dangle.",
        },
      },
      {
        name: "Popover",
        description: {
          "fa-IR":
            "خودِ سطح. placement تنها ویژگیِ جهت‌دارِ آن است و منطقی است؛ offset و crossOffset روی محورِ بلوکی و درون‌خطی می‌نشینند و هر دو به موتور پاس داده می‌شوند. padded={false} بالشتک را برمی‌دارد برای پنلی که خودش چیدمانش را دارد.",
          "en-US":
            "The surface itself. `placement` is its only directional prop and it is logical; `offset` and `crossOffset` land on the block and inline axes and are both handed to the engine. `padded={false}` removes the padding for a panel that owns its own layout.",
        },
      },
      {
        name: "PopoverDescription",
        description: {
          "fa-IR":
            "متنِ همراهِ پنل، و رشته‌ای که صفحه‌خوان پس از نام می‌خواند. پنل aria-describedby را از همین جزء می‌گیرد؛ یک <p> دست‌ساز با همان ظاهر برای هیچ‌کس خوانده نمی‌شود. برای محتوای بلوکی render={<div />} بدهید.",
          "en-US":
            "The panel's supporting prose, and the string a screen reader reads after the name. The panel takes its `aria-describedby` from this part; a hand-rolled <p> that looks identical is announced to nobody. Pass `render={<div />}` for block content.",
        },
      },
      {
        name: "popoverVariants",
        description: {
          "fa-IR":
            "کلاس‌های سطح، به‌همراه گذارِ ورود و خروج. جابه‌جاییِ کوچکِ ورود روی محورِ بلوکی است و در هیچ حالتِ نوشتنِ افقی آینه نمی‌شود؛ روی محورِ درون‌خطی عمداً هیچ قاعده‌ای نیست، چون آنجا آینه می‌شد.",
          "en-US":
            "The surface's classes, plus the enter and exit transition. The small entry offset is on the BLOCK axis and mirrors in no horizontal writing mode; there is deliberately no rule on the inline axis, because that one would.",
        },
      },
      {
        name: "IconButton",
        description: {
          "fa-IR":
            "دکمه‌ای که تنها یک نگاره است و برای همین label اجباری دارد. وقتی چنین دکمه‌ای بازکنندهٔ یک پنل باشد، نامِ ارث‌بردهٔ پنل نامِ دکمه است — که معمولاً همان چیزی نیست که پنل هست، و همان‌جاست که aria-label روی پنل ارزش دارد.",
          "en-US":
            "A button that is only a glyph, which is why its `label` is required. When such a button opens a panel, the panel's inherited name is the button's — usually not what the panel IS, which is exactly where an `aria-label` on the panel earns its place.",
        },
      },
      {
        name: "Separator",
        description: {
          "fa-IR":
            "خطِ میان سرآیند و فهرستِ کارها در پنلِ بی‌بالشتک. تزئینی است و از درختِ دسترس‌پذیری بیرون می‌ماند مگر آنکه چیزی برای گفتن داشته باشد.",
          "en-US":
            "The rule between the heading and the action list in the unpadded panel. It is decorative and stays out of the accessibility tree unless it has something to say.",
        },
      },
    ],
  },
  examples: [
    {
      id: "named-by-trigger",
      title: { "fa-IR": "نامی که از دکمه می‌آید", "en-US": "The name that comes from the trigger" },
      description: {
        "fa-IR":
          "پنل هیچ نامی از موتور نمی‌گیرد و یک محاورهٔ بی‌نام «محاوره» اعلام می‌شود و بس — نقصی که هیچ واژهٔ انگلیسی‌ای بیرون نمی‌دهد و برای همین از هر شمارشِ رشته‌ای جان سالم به در می‌برد. اینجا aria-labelledby به دکمه اشاره می‌کند و ارجاع نمی‌تواند آویزان بماند، چون دکمه هر وقت پنل هست هم هست.",
        "en-US":
          "The panel gets no name from the engine, and an unnamed dialog announces as «dialog» and nothing more — a defect that leaks no English and therefore survives every string count. Here `aria-labelledby` points at the trigger, and the reference cannot dangle because the trigger is in the document whenever the panel is.",
      },
      render: BasicExample,
    },
    {
      id: "placement",
      title: { "fa-IR": "سه جای‌گیری، هیچ‌کدام فیزیکی", "en-US": "Three placements, none physical" },
      description: {
        "fa-IR":
          "هر سه رشته منطقی‌اند و چهارمی وجود ندارد: نوع، هر املایی را که left یا right در آن باشد کنار گذاشته است. زیرِ پوسته این‌ها به یک ضلع و یک هم‌ترازی ترجمه می‌شوند و ضلعِ درون‌خطی خودش عضوی از اجتماعِ موتور است، پس ترجمه در جهتی که اهمیت دارد چیزی از دست نمی‌دهد.",
        "en-US":
          "All three strings are logical and there is no fourth kind: the type excludes every spelling containing `left` or `right`. Underneath they translate to a side and an alignment, and the inline side is itself a union member in the engine, so the translation loses nothing in the direction that matters.",
      },
      render: PlacementExample,
    },
    {
      id: "own-name",
      title: { "fa-IR": "وقتی نامِ دکمه نامِ پنل نیست", "en-US": "When the trigger's name is not the panel's" },
      description: {
        "fa-IR":
          "بازکننده یک نگاره است، پس نامِ ارث‌بردهٔ پنل «این چیست» می‌شد. aria-label روی پنل بر آن می‌چربد و نام‌گذاریِ خودکار کنار می‌رود — که تنها راهی است که این سازوکار می‌توانست اوضاع را بدتر کند، و برای همین صریحاً بررسی می‌شود.",
        "en-US":
          "The trigger is a glyph, so the panel's inherited name would have been «What is this». An `aria-label` on the panel wins and the automatic naming stands down — which is the one way this mechanism could have made things worse, and is why it is checked for explicitly.",
      },
      render: NamedExample,
    },
    {
      id: "unpadded",
      title: { "fa-IR": "پنلی که چیدمانِ خودش را دارد", "en-US": "A panel that owns its layout" },
      description: {
        "fa-IR":
          "با padded={false} بالشتک برداشته می‌شود تا ردیف‌های کارها از لبه تا لبه پررنگ شوند و جداکننده هم تا لبه برسد. متنِ هر ردیف text-start است و نه text-left — همان یک کلاس در هر دو خط، و املای فیزیکی‌اش رایج‌ترین نقصِ راست‌به‌چپِ فهرست‌های شناور است.",
        "en-US":
          "`padded={false}` removes the padding so the action rows can highlight edge to edge and the rule can reach both edges. Each row's text is `text-start` rather than `text-left` — one class in both scripts, and the physical spelling of that line is the commonest right-to-left defect in floating lists.",
      },
      render: UnpaddedExample,
    },
  ],
};
