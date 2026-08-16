import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import {
  SkeletonAvatar,
  SkeletonCard,
  SkeletonForm,
  SkeletonTable,
  SkeletonText,
  Spinner,
} from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the skeleton-presets page. Contract: `_system/types.ts`.
 *
 * A SERVER module, and `skeleton-presets.tsx` carries no `"use client"` either
 * — which matters more here than almost anywhere: the single most common render
 * site for these is a server `loading.tsx`, where a client directive would be
 * actively wrong.
 *
 * ── THESE ARE THE MOLECULES, NOT THE ATOM ───────────────────────────────────
 *
 * `skeleton.tsx` ships the bar. These are the shapes a real screen actually
 * loses while it loads — a paragraph, a feed row, a card, a form, a table — so
 * a `loading.tsx` reads as a preview of the page rather than as one grey block.
 *
 * ── NO STRINGS, AND THAT IS A DECISION ──────────────────────────────────────
 *
 * Everywhere else in this library an announced string is a required prop. A
 * skeleton is the one component with nothing to announce: it is a PICTURE of
 * pending content rather than the pending state itself. So every preset renders
 * `aria-hidden="true"` on its root and takes no text at all — which is also
 * what keeps the HTML gate quiet about them: the gate grades visible text and
 * spoken attributes, and these have neither. The loading STATE is the
 * consumer's to announce, on the element that owns it, and the last example
 * here is the one that says so properly.
 *
 * ── EVERY DIMENSION IS COPIED FROM WHAT IT STANDS IN FOR ────────────────────
 *
 * The whole worth of a skeleton is that nothing jumps when the data lands. So
 * the avatar uses the avatar's own size scale, the form uses the form's field
 * gaps and the shared `md` control height, the card wears the card's outlined
 * border and section padding, and the table restates the header band, row rule
 * and cell padding — restates rather than imports, because the table is a
 * client module and a server module must not reach into one for its classes.
 *
 * Widths that "vary" are DETERMINISTIC — a cycle over the index, never
 * `Math.random()` — because these render on the server and a hydration diff is
 * a worse defect than a repeating pattern.
 */

const t = {
  loadingOrders: { "fa-IR": "در حال بارگذاری سفارش‌ها…", "en-US": "Loading the orders…" },
} satisfies Record<string, LocalizedText>;

function TextExample(_l: Locale) {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <SkeletonText />
      <SkeletonText lines={5} />
    </div>
  );
}

function AvatarExample(_l: Locale) {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <SkeletonAvatar size="lg" />
      <SkeletonAvatar size="sm" lines={1} />
      <SkeletonAvatar size="xl" lines={0} />
    </div>
  );
}

function CardExample(_l: Locale) {
  return (
    <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
      <SkeletonCard />
      <SkeletonCard hasMedia={false} lines={4} />
    </div>
  );
}

function FormExample(_l: Locale) {
  return (
    <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-4">
      <SkeletonForm fields={4} />
    </div>
  );
}

function BusyTableExample(l: Locale) {
  return (
    <div
      aria-busy="true"
      className="flex w-full max-w-2xl flex-col gap-3 rounded-lg border border-border bg-surface p-4"
    >
      {/*
       * The blocks below say nothing at all. This line does: one named live
       * region, on the container that is actually pending.
       */}
      <Spinner size="sm" label={t.loadingOrders[l]} showLabel />
      <SkeletonTable rows={5} columns={4} />
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "جانگهدارهای آمادهٔ یک صفحهٔ واقعی هنگام بارگذاری: پاراگراف، ردیف خوراک، کارت، فرم، جدول.",
        "en-US": "The composed placeholders of a real screen while it loads: a paragraph, a feed row, a card, a form, a table.",
      },
      whenNot: {
        "fa-IR": "یک شکل سفارشی — `Skeleton`. عملیاتی در جریان با نامی که خوانده شود — `Spinner`. وقتی چیزی برای نمایش نیست — `EmptyState`.",
        "en-US": "One custom shape — `Skeleton`. An operation in flight with a spoken name — `Spinner`. Nothing to show at all — `EmptyState`.",
      },
    },
    tier: "feedback",
    title: { "fa-IR": "قالب‌های آماده", "en-US": "Skeleton presets" },
    intro: {
      "fa-IR":
        "قالب‌های ترکیبی: شکل‌هایی که یک صفحهٔ واقعی هنگام بارگذاری از دست می‌دهد — یک بند، یک ردیفِ خوراک، یک کارت، یک فرم، یک جدول. هیچ‌کدام رشته‌ای نمی‌گیرند و همه aria-hidden اند، چون یک قالب تصویرِ محتوای در راه است و نه خودِ حالتِ در‌راه‌بودن؛ حالت را باید روی همان ناحیه‌ای اعلام کنید که جایگزین می‌شود. هر اندازه‌ای که اینجا هست از همان جزئی رونویسی شده که جایش را می‌گیرد، و عرض‌هایی که «متغیر»‌اند قطعی‌اند و نه تصادفی — این‌ها روی سرور رندر می‌شوند و اختلافِ هیدراسیون از یک الگوی تکراری بدتر است.",
      "en-US":
        "Composed placeholders: the shapes a real screen actually loses while it loads — a paragraph, a feed row, a card, a form, a table. None takes a string and all are `aria-hidden`, because a skeleton is a PICTURE of pending content rather than the pending state itself; announce the state on the region being replaced. Every dimension here is copied from the component it stands in for, and the widths that «vary» are deterministic rather than random — these render on the server, and a hydration diff is a worse defect than a repeating pattern.",
    },
    composition: [
      `<SkeletonText lines={3} />`,
      `<SkeletonAvatar size="md" lines={2} />     ← 0 for the bare circle`,
      `<SkeletonCard hasMedia lines={2} />`,
      `<SkeletonForm fields={3} hasAction />`,
      `<SkeletonTable rows={4} columns={4} />`,
      ``,
      `Announce the STATE separately: aria-busy on the region,`,
      `plus a <Spinner label="…" showLabel /> beside it.`,
    ].join("\n"),
    parts: [
      {
        name: "SkeletonText",
        description: {
          "fa-IR":
            "یک بند: چند سطرِ تمام‌عرض که آخرینش کوتاه بریده می‌شود. بندِ واقعی هم سطر آخرش کوتاه است، و همین یک جزئیات است که پشته‌ای از میله‌ها را از یک جدولِ خاکستری جدا می‌کند.",
          "en-US":
            "A paragraph: full-width lines with the last one cut short. A real paragraph's last line is short too, and that one detail is what separates a stack of bars from a grey table.",
        },
      },
      {
        name: "SkeletonAvatar",
        description: {
          "fa-IR":
            "دایره‌ای هم‌اندازهٔ آواتارِ واقعی، با سطرهای کوتاهِ کنارش. با صفر سطر، فقط دایره می‌ماند. مقیاسِ اندازه‌اش رونوشتِ همان مقیاسی است که آواتار دارد، پس وقتی تصویر می‌رسد هیچ‌چیز نمی‌پرد — که تمامِ ارزشِ یک قالب همین است.",
          "en-US":
            "A circle the size of the real avatar, with the short lines that usually follow it. With zero lines only the circle remains. Its size scale is a copy of the avatar's own, so nothing jumps when the portrait lands — which is a skeleton's entire worth.",
        },
      },
      {
        name: "SkeletonCard",
        description: {
          "fa-IR":
            "پوستهٔ خط‌دارِ کارت با بخش‌های هم‌بالشتکِ آن، حاویِ یک مستطیلِ رسانه، یک سطرِ عنوان و بدنه‌ای کوتاه. مستطیل نسبت‌ابعاد می‌گیرد و نه ارتفاعِ ثابت، چون ارتفاعِ ثابت لحظه‌ای که نسبتِ تصویرِ واقعی برنده شود می‌پرد.",
          "en-US":
            "The card's outlined shell with its own section padding, holding a media rectangle, a heading line and a short body. The rectangle takes an aspect ratio rather than a fixed height, because a fixed height jumps the moment the real image's ratio wins.",
        },
      },
      {
        name: "SkeletonForm",
        description: {
          "fa-IR":
            "جفت‌های برچسب و ورودی روی همان ریتمی که فرم دارد، و هر ورودی به ارتفاعِ کنترلِ متوسط — همان ارتفاعی که هر کنترلِ واقعیِ md در این کتابخانه دارد. عرضِ برچسب‌ها قطعی می‌چرخد تا ستون شبیه یک مُهرِ تکرارشده نشود.",
          "en-US":
            "Label-and-input pairs on the form's own rhythm, with each input at the medium control height — the height every real `md` control in this library shares. The label widths cycle deterministically so the column does not read as one repeated stamp.",
        },
      },
      {
        name: "SkeletonTable",
        description: {
          "fa-IR":
            "نمای جدول، بازنویسی‌شده و نه وارد‌شده: جدول یک ماژولِ کلاینت است و یک ماژولِ سروری نباید برای کلاس‌هایش داخلش دست ببرد. ستون‌ها از یک سبکِ درون‌خطی می‌آیند چون یک کلاس نمی‌تواند شمارشِ زمانِ اجرا بگیرد، و همان الگو در هر سطر تکرار می‌شود تا سرآیند و بدنه هم‌تراز بمانند. عرضِ سلول‌ها روی مجموعِ سطر و ستون می‌چرخد، پس شبکه مثل داده می‌درخشد و نه مثل کاغذدیواری.",
          "en-US":
            "The table's look, RESTATED rather than imported: the table is a client module and a server module must not reach into one for its classes. The column tracks come from an inline style because a class cannot take a runtime count, and the same tracks repeat per row so the header and body stay aligned. Cell widths cycle on row plus column, so the grid shimmers like data rather than like wallpaper.",
        },
      },
      {
        name: "Spinner",
        description: {
          "fa-IR":
            "جایی که خبرِ «در حال بارگذاری» واقعاً زندگی می‌کند. قالب‌ها ساکت‌اند و باید باشند؛ این یکی نام دارد و همان است که یک صفحه‌خوان می‌شنود.",
          "en-US":
            "Where the «loading» fact actually lives. The placeholders are silent and should be; this one has a name, and it is what a screen reader hears.",
        },
      },
    ],
  },
  examples: [
    {
      id: "text",
      title: { "fa-IR": "بندی که مثل بند می‌خواند", "en-US": "A paragraph that reads like one" },
      description: {
        "fa-IR":
          "سطر آخر کوتاه می‌شود و همین تفاوتِ یک بندِ در‌راه با یک دیوارِ خاکستری است. تعداد سطرها یک ویژگی است، پس یک چکیده و یک مقالهٔ کامل همان جزء‌اند با یک عدد متفاوت. هیچ‌کدام از این‌ها در درختِ دسترس‌پذیری دیده نمی‌شوند.",
        "en-US":
          "The last line is shortened, and that is the difference between a pending paragraph and a grey wall. The line count is a prop, so a summary and a full article are the same component with one number between them. None of this appears in the accessibility tree.",
      },
      render: TextExample,
    },
    {
      id: "avatar-rows",
      title: { "fa-IR": "ردیفِ خوراک، در سه حالت", "en-US": "The feed row, three ways" },
      description: {
        "fa-IR":
          "دایره اندازه‌اش را از مقیاسِ خودِ آواتار می‌گیرد و نه از یک عددِ دلبخواه، پس وقتی تصویر می‌رسد ردیف تکان نمی‌خورد. با صفر سطر فقط دایره می‌ماند، برای جایی که تنها یک تصویر جای خالی دارد. فاصله‌ها با gap اند و نه با حاشیهٔ فیزیکی، پس ردیف در فارسی از راست شروع می‌شود بدون هیچ کلاسِ دومی.",
        "en-US":
          "The circle takes its size from the avatar's own scale rather than from an arbitrary number, so the row does not shift when the portrait lands. With zero lines only the circle remains, for a place where an image is the only gap. The spacing is a `gap` rather than a physical margin, so the row starts from the right in Persian with no second class.",
      },
      render: AvatarExample,
    },
    {
      id: "cards",
      title: { "fa-IR": "کارت با رسانه و بدون آن", "en-US": "A card with media and without" },
      description: {
        "fa-IR":
          "مستطیلِ رسانه نسبتِ ابعاد می‌گیرد و نه ارتفاعِ ثابت: ارتفاعِ ثابت لحظه‌ای که تصویرِ واقعی نسبتِ خودش را تحمیل کند شبکه را می‌پراند — و پراندنِ چیدمان دقیقاً همان چیزی است که قالب برای جلوگیری از آن گذاشته شده. کارتِ دوم رسانه ندارد و به‌جایش بدنهٔ بلندتری می‌گیرد.",
        "en-US":
          "The media rectangle takes an ASPECT RATIO rather than a fixed height: a fixed height jumps the grid the moment the real image imposes its own — and jumping the layout is exactly what the placeholder was put there to prevent. The second card has no media and takes a longer body instead.",
      },
      render: CardExample,
    },
    {
      id: "form",
      title: { "fa-IR": "فرمی که بعد از رسیدن جابه‌جا نمی‌شود", "en-US": "A form that does not shift on arrival" },
      description: {
        "fa-IR":
          "فاصلهٔ درونِ یک فیلد و فاصلهٔ میان فیلدها هر دو از ریتمِ خودِ فرم برداشته شده‌اند و هر ورودی به ارتفاعِ کنترلِ متوسط است. برای همین وقتی فیلدهای واقعی می‌آیند هیچ سطری بالا و پایین نمی‌رود — تنها آزمونی که یک قالب باید از آن سربلند بیرون بیاید.",
        "en-US":
          "The gap inside a field and the gap between fields are both taken from the form's own rhythm, and every input is at the medium control height. So when the real fields arrive no row moves up or down — the only test a placeholder has to pass.",
      },
      render: FormExample,
    },
    {
      id: "busy-table",
      title: { "fa-IR": "کسی که این را می‌شنود", "en-US": "The reader who hears this" },
      description: {
        "fa-IR":
          "جدولِ بالا برای یک صفحه‌خوان اصلاً وجود ندارد و همین درست است، چون محتوا نیست. خبرِ «در حال بارگذاری» جای دیگری زندگی می‌کند: aria-busy روی ناحیه‌ای که جایگزین می‌شود و یک Spinner با نامِ نوشته‌شده کنارش. عرضِ سلول‌ها هم روی مجموعِ سطر و ستون می‌چرخد و نه تصادفی، پس بایت‌های سرو‌شده در هر ساخت یکی‌اند.",
        "en-US":
          "The table above does not exist for a screen reader at all, and that is correct, because it is not content. The «loading» fact lives somewhere else: `aria-busy` on the region being replaced and one `Spinner` with a written name beside it. The cell widths also cycle on row plus column rather than randomly, so the served bytes are identical on every build.",
      },
      render: BusyTableExample,
    },
  ],
};
