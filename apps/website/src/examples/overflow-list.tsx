import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { OverflowListIsland } from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

const t = {
  edit: { "fa-IR": "ویرایش", "en-US": "Edit" },
  save: { "fa-IR": "ذخیره", "en-US": "Save" },
  share: { "fa-IR": "هم‌رسانی", "en-US": "Share" },
  duplicate: { "fa-IR": "تکثیر", "en-US": "Duplicate" },
  archive: { "fa-IR": "بایگانی", "en-US": "Archive" },
  remove: { "fa-IR": "حذف", "en-US": "Delete" },
  more: { "fa-IR": "بیشتر", "en-US": "more" },
} satisfies Record<string, LocalizedText>;

function actions(l: Locale): readonly string[] {
  return [t.edit[l], t.save[l], t.share[l], t.duplicate[l], t.archive[l], t.remove[l]];
}

function TrailingExample(l: Locale) {
  return <OverflowListIsland locale={l} items={actions(l)} moreWord={t.more[l]} />;
}

function LeadingExample(l: Locale) {
  return (
    <OverflowListIsland
      locale={l}
      items={actions(l)}
      moreWord={t.more[l]}
      collapseFrom="start"
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "ردیفی از کنش‌ها که هرچه جا شود نگه می‌دارد و بقیه را به یک کنترل سرریز می‌سپارد: نوار ابزار، نوار زبانه، ردیف برچسب.",
        "en-US": "A row of actions that keeps what fits and hands the rest to an overflow control: toolbars, tab strips, tag rows.",
      },
      whenNot: {
        "fa-IR": "نواری که خواننده ورق می‌زند — `Carousel`. نوار ابزار گروه‌بندی‌شده با کلیدهای جهت — `Toolbar`. تراشه‌هایی که به خط بعد می‌شکنند — `TagGroup`.",
        "en-US": "A strip the reader pages through — `Carousel`. A grouped toolbar with arrow keys — `Toolbar`. Chips that wrap — `TagGroup`.",
      },
    },
    tier: "layout",
    isNew: true,
    title: { "fa-IR": "فهرست سرریز", "en-US": "Overflow list" },
    intro: {
      "fa-IR":
        "یک ردیف که به اندازهٔ ظرفش عمل‌ها را نگه می‌دارد و باقی را به یک کنترلِ سرریزِ نوشته‌شده از سوی فراخواننده می‌سپارد. شمارِ اولیه اجباری است تا پاسخِ سرور تصادفی نباشد؛ سپس ResizeObserver هم کوچک‌شدن و هم بازگشتِ جا را اندازه می‌گیرد.",
      "en-US":
        "A row that keeps as many actions as its container can hold and hands the rest to a caller-authored overflow control. The initial count is required so the server response is deliberate; ResizeObserver then measures both shrink and grow-back.",
    },
    composition: [
      `<OverflowList items getKey initialVisibleItems`,
      `              minVisibleItems maxVisibleItems collapseFrom`,
      `              renderItem renderOverflow />`,
    ].join("\n"),
    parts: [
      {
        name: "OverflowList",
        description: {
          "fa-IR":
            "مالکِ اندازه‌گیری و پنجرهٔ دیداری. هر آیتم دقیقاً یک بار در DOM است؛ آیتمِ بیرون‌افتاده inert و بیرون از درخت دسترس‌پذیری می‌شود ولی برای بازگشتِ جا اندازه‌پذیر می‌ماند.",
          "en-US":
            "Owns measurement and the visible window. Every item exists exactly once in the DOM; an overflowed item becomes inert and leaves the accessibility tree while remaining measurable for grow-back.",
        },
      },
      {
        name: "fitOverflowItems",
        description: {
          "fa-IR": "حساب خالصِ جاگیری که پهنای نشانگر، فاصله و کران‌های دیداری را هم می‌شمارد.",
          "en-US": "Pure fitting arithmetic that includes indicator width, gaps and visible bounds.",
        },
      },
    ],
  },
  examples: [
    {
      id: "trailing",
      title: { "fa-IR": "جمع‌شدن از پایان", "en-US": "Collapse from the end" },
      description: {
        "fa-IR": "عمل‌های نخست ثابت می‌مانند و عمل‌های پایانی زیر کنترلِ بیشتر جمع می‌شوند.",
        "en-US": "The first actions stay anchored while trailing actions move behind the overflow control.",
      },
      render: TrailingExample,
    },
    {
      id: "leading",
      title: { "fa-IR": "جمع‌شدن از آغاز", "en-US": "Collapse from the start" },
      description: {
        "fa-IR": "برای دنباله‌هایی مانند مسیر مرحله‌ای، تازه‌ترین آیتم‌ها می‌مانند و آغاز زیر نشانگر می‌رود.",
        "en-US": "For sequences such as step trails, the newest items remain while the beginning moves behind the indicator.",
      },
      render: LeadingExample,
    },
  ],
};
