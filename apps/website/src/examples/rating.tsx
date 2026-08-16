import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { RatingInputIsland, RatingSummaryIsland } from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the rating page. Contract: `_system/types.ts`.
 *
 * Islands, unavoidably: `valueLabel` and `starLabel` are required FUNCTIONS, and
 * a function cannot cross into the server payload. The copy lives HERE, in both
 * locales; the island only assembles the closures.
 *
 * ── THIS IS THE COMPONENT THE `LumoNode` RULE WAS WRITTEN FOR ───────────────
 *
 * …in the one shape the rule cannot reach on its own. Nothing here renders a
 * number as text — the stars are glyphs — so `<Rating value={4} />` would
 * type-check, render five plausible stars, and announce **"4 of 5"** on a page
 * whose every visible digit is Persian. `LumoNode` guards CHILDREN; an
 * accessible name is not a child.
 *
 * So the names are composed from a required function that receives an ALREADY
 * FORMATTED string. Two of them, because the two announcements are genuinely
 * different sentences: «۴٫۵ از ۵» for the whole widget, «۳ ستاره» for one
 * option. Functions rather than format strings, because Persian word order is
 * not English word order with the words swapped — «۴ از ۵»، «امتیاز ۴ از ۵» and
 * «۴ ستاره از ۵» are all correct in different contexts and the library cannot
 * pick. What it CAN guarantee is that whatever the consumer writes receives «۴»
 * and never `4`.
 *
 * ── AND ONE THING THAT WAS FREE AND IS NOT ANY MORE ─────────────────────────
 *
 * Arrow-key direction used to be resolved against the document, so on a Persian
 * page ArrowLeft moved toward HIGHER ratings with no configuration at all. The
 * current engine resolves it against its own direction context, which reports
 * left-to-right when nothing mounts one — and the Lumo provider does not. So the
 * arrow keys run left-to-right across a right-to-left row of stars. The stars
 * still LOOK right, which is exactly what makes it worth writing down.
 */

const t = {
  ofWord: { "fa-IR": "از", "en-US": "of" },
  starWord: { "fa-IR": "ستاره", "en-US": "star" },

  productScore: { "fa-IR": "امتیاز این کالا", "en-US": "This product's score" },
  yourScore: { "fa-IR": "امتیاز شما", "en-US": "Your score" },
  courierScore: { "fa-IR": "امتیاز پیک", "en-US": "The courier's score" },
  frozenScore: { "fa-IR": "امتیاز ثبت‌شدهٔ شما", "en-US": "Your submitted score" },
} satisfies Record<string, LocalizedText>;

function SummaryExample(l: Locale) {
  return <RatingSummaryIsland locale={l} value={4.5} ofWord={t.ofWord[l]} />;
}

function InteractiveExample(l: Locale) {
  return (
    <RatingInputIsland
      locale={l}
      label={t.yourScore[l]}
      starWord={t.starWord[l]}
      defaultValue={3}
      size="lg"
    />
  );
}

function TenPointExample(l: Locale) {
  return (
    <RatingSummaryIsland locale={l} value={8} maxValue={10} size="sm" ofWord={t.ofWord[l]} />
  );
}

function EmptyExample(l: Locale) {
  return <RatingInputIsland locale={l} label={t.courierScore[l]} starWord={t.starWord[l]} />;
}

function DisabledExample(l: Locale) {
  return (
    <RatingInputIsland
      locale={l}
      label={t.frozenScore[l]}
      starWord={t.starWord[l]}
      defaultValue={4}
      isDisabled
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "امتیازی از چند ستاره: کنار محصول (تصویری از یک عدد) یا داده‌شده از سوی خواننده (یک گروه رادیویی).",
        "en-US": "A score out of stars: shown beside a product (a picture of a number) or given by the reader (a radio group).",
      },
      whenNot: {
        "fa-IR": "یکی از چند گزینهٔ برچسب‌دار — `RadioGroup`. کمیتی در یک بازه — `Meter`. عددی تایپ‌شده — `NumberField`.",
        "en-US": "One of a few labelled options — `RadioGroup`. A quantity within a range — `Meter`. A number typed — `NumberField`.",
      },
    },
    tier: "form",
    title: { "fa-IR": "امتیاز", "en-US": "Rating" },
    intro: {
      "fa-IR":
        "ستاره‌ها متن ندارند، پس نامشان باید ساخته شود — و از عددی که پیش‌تر قالب‌بندی شده، تا «۳ ستاره» شنیده شود و رقم لاتین اصلاً در دسترس نباشد. دو حالت هم دو ویجتِ متفاوت‌اند که شبیه هم به نظر می‌رسند و نه یک ویجت با یک پرچم: امتیازی که کنارِ یک کالا چاپ شده یک تصویر از یک عدد است — یک اعلام، بدون ایست تبی، بدون پیمایشِ پنج‌تایی در اطلاعاتی که انتخاب نیست — و امتیازی که خودتان می‌دهید یک گروه رادیویی است. برای همین اِی‌پی‌آی یک اجتماعِ تفکیک‌شده است و رشته‌های اجباریِ هر حالت دقیقاً همان‌هایی‌اند که همان حالت اعلام می‌کند.",
      "en-US":
        "A star has no text, so its name has to be COMPOSED — and from an already-formatted number, so «۳ ستاره» is what is announced and a Latin digit is never in scope. The two modes are two different widgets that happen to look alike rather than one widget with a flag: a rating printed beside a product is a PICTURE of a number — one announcement, no tab stop, no five-way navigation through information that is not a choice — while a rating you give is a radio group. That is why the API is a discriminated union and each mode's required strings are exactly the strings it announces.",
    },
    composition: [
      `<Rating isReadOnly value maxValue locale`,
      `  valueLabel={(v, max) => …} />        ← role="img", ONE announcement`,
      ``,
      `<Rating label locale maxValue`,
      `  starLabel={(v) => …}                 ← role="radiogroup", one name per star`,
      `  value defaultValue onChange isDisabled name size />`,
    ].join("\n"),
    parts: [
      {
        name: "Rating",
        description: {
          "fa-IR":
            "هر دو حالت، پشتِ یک نام. حالتِ فقط‌خواندنی یک نقشِ تصویر با یک جملهٔ نوشته‌شده است و ستاره‌هایش از درختِ دسترس‌پذیری بیرون‌اند، پس ویجت دقیقاً یک بار اعلام می‌شود و نه به‌صورت ده گرافیکِ تودرتو. حالتِ تعاملی یک گروه رادیویی است، چون پنج ستاره با یکی انتخاب‌شده واقعاً یک گروه رادیویی است — و گفتنِ همین، بیشترِ قراردادِ صفحه‌کلید و صفحه‌خوان را رایگان می‌دهد.",
          "en-US":
            "Both modes behind one name. The read-only one is a `role=\"img\"` with an authored sentence and its stars are hidden, so the widget is announced exactly once rather than as ten nested graphics. The interactive one is a radio group, because five stars with one chosen genuinely IS a radio group — and saying so gets most of the keyboard and screen-reader contract for free.",
        },
      },
      {
        name: "ratingStarVariants",
        description: {
          "fa-IR":
            "یک ستارهٔ تعاملی، که خودش عنصرِ فوکوس‌پذیر هم هست. هر انتخابگرِ همسایه اینجا باید دوباره هدف‌گیری می‌شد و نه فقط تغییرِ نام، چون این موتور کنارِ هر ستاره یک ورودیِ پنهان می‌سازد: آن ورودی جعبهٔ یک‌درصدیِ واقعی در گوشهٔ صفحه است، پس یک انتخابگرِ hover ساده اشاره‌گرِ ساکنِ آن گوشه را به روشن‌کردنِ همهٔ ستاره‌ها تعبیر می‌کرد.",
          "en-US":
            "One interactive star, which is also its own focusable element. Every sibling selector here had to be RE-TARGETED rather than renamed, because this engine renders a hidden input beside each star: that input is a real one-pixel box in the corner of the page, so a naive `~:hover` would read a pointer resting there as lighting every star.",
        },
      },
      {
        name: "ratingVariants",
        description: {
          "fa-IR":
            "ردیفِ ستاره‌ها. پُرشدن در جهتِ خواندن پیش می‌رود بی‌هیچ کدِ آینه‌کننده: ستارهٔ پنج‌پر حولِ محورِ عمودی متقارن است، پس خودِ نگاره آینه نمی‌خواهد، و ردیف با جریانِ عادی همان جهت را می‌گیرد. مقدارهای کسری هم یک ردیفِ دوم را با شروعِ درون‌خطی و اندازهٔ درون‌خطی می‌برند، پس برش از لبهٔ خواندنِ خواننده باز می‌شود.",
          "en-US":
            "The row of stars. The fill runs in the reading direction with no mirroring code: a five-pointed star is symmetric about its vertical axis so the GLYPH needs none, and the row takes the direction from normal flow. Fractional values clip a duplicate row with a logical inline-start and inline-size, so the clip opens from the reader's leading edge.",
        },
      },
      {
        name: "ratingButtonVariants",
        description: {
          "fa-IR":
            "بالشتکِ دورِ نگاره. به‌جای فاصله روی ردیف، بالشتک به خودِ ستاره تعلق دارد تا ناحیه‌های لمسی به هم بچسبند و نواری مرده بینشان نماند — نواری که ردیف را hover کند و هیچ ستاره‌ای را نه، همهٔ ستاره‌ها را یک لحظه خالی نشان می‌داد.",
          "en-US":
            "The padding around the glyph. Rather than a gap on the row, the padding belongs to the STAR, so the hit areas touch and there is no dead strip between them — a strip where the row is hovered and no star is would blink every star empty.",
        },
      },
    ],
  },
  examples: [
    {
      id: "summary",
      title: { "fa-IR": "امتیازِ چاپ‌شده", "en-US": "A printed score" },
      description: {
        "fa-IR":
          "یک ویجتِ فقط‌خواندنی که به‌جای پنج کنترل یک بار اعلام می‌شود، و مقدارِ کسری از لبهٔ خواندن بریده می‌شود — در فارسی از راست. با کلید تب رد شوید و ببینید هیچ ایستی اینجا نیست: یک تصویر از یک عدد ایستِ تبی نمی‌گیرد.",
        "en-US":
          "A read-only widget that announces ONCE instead of as five controls, with the fractional value clipped from the reading edge — the right in Persian. Tab past it and watch: there is no stop here, because a picture of a number does not take one.",
      },
      render: SummaryExample,
    },
    {
      id: "interactive",
      title: { "fa-IR": "امتیازی که می‌دهید", "en-US": "A score you give" },
      description: {
        "fa-IR":
          "با کلید تب وارد شوید: ایست روی ستارهٔ انتخاب‌شده می‌افتد و نه روی اولی، و همان در بایتِ اول هم هست — بدون آن، هر ستاره منفی‌یک می‌گرفت و کلِ کنترل تا رسیدنِ جاوااسکریپت با تب دست‌نیافتنی بود. اشاره‌گر را روی ستاره‌های پایین‌تر ببرید: پیش‌نمایش، امتیازِ بالاترِ قبلی را روشن نگه نمی‌دارد، چون دو قاعده‌ای که هرگز هم‌زمان نمی‌خورند به ترتیبِ آبشار نیاز ندارند.",
        "en-US":
          "Tab in: the stop lands on the CHOSEN star rather than the first, and it is already there in the first byte — without which every star would serve minus one and the whole control would be unreachable by Tab until JavaScript arrived. Hover a lower star: the preview does not leave the previous higher score lit behind it, because two rules that can never both match need no cascade order to resolve.",
      },
      render: InteractiveExample,
    },
    {
      id: "ten-point",
      title: { "fa-IR": "مقیاس ده‌تایی", "en-US": "A ten-point scale" },
      description: {
        "fa-IR":
          "بیشینه یک ویژگی است و نه یک ثابت، و همان عدد است که به جملهٔ اعلام‌شده هم می‌رسد — قالب‌بندی‌شده. همین است که «۸ از ۱۰» را بیان‌پذیر و شکلِ لاتینِ همان را ناممکن می‌کند: هیچ مسیری از یک عددِ خام به آن رشته وجود ندارد.",
        "en-US":
          "The maximum is a prop rather than a constant, and it is the same number that reaches the announced sentence — formatted. That is what makes «۸ از ۱۰» expressible and «8 از 10» impossible: there is no path from a raw number to that string.",
      },
      render: TenPointExample,
    },
    {
      id: "empty",
      title: { "fa-IR": "بدون انتخاب", "en-US": "Nothing chosen yet" },
      description: {
        "fa-IR":
          "گروهی که هنوز مقدار ندارد باید همچنان با کلید تب دست‌یافتنی باشد، پس ایست به ستارهٔ اول می‌رسد و هیچ ستاره‌ای علامتِ انتخاب نمی‌گیرد. اولین کلیدِ جهت هم همان‌جا انتخاب می‌کند: در یک گروه رادیویی، حرکت و انتخاب یک کارند.",
        "en-US":
          "A group with no value yet still has to be Tab-reachable, so the stop falls on the first star and none is marked chosen. The first arrow press also selects: in a radio group, moving and choosing are one action.",
      },
      render: EmptyExample,
    },
    {
      id: "disabled",
      title: { "fa-IR": "امتیازِ قفل‌شده", "en-US": "A locked score" },
      description: {
        "fa-IR":
          "امتیازِ ثبت‌شده‌ای که دیگر عوض نمی‌شود ولی هنوز یک کنترل است: کم‌رنگ می‌شود، رویدادِ اشاره‌گر نمی‌گیرد و همچنان نام دارد. اگر فقط یک تصویر بود، حالتِ فقط‌خواندنیِ بالا شکلِ درست‌ترش بود — تفاوتِ «نمی‌توانید عوضش کنید» و «این اصلاً انتخاب نیست».",
        "en-US":
          "A submitted score that can no longer change but is still a CONTROL: it dims, takes no pointer events and keeps its name. If it were merely a picture, the read-only mode above would be the right shape — the difference between «you cannot change this» and «this was never a choice».",
      },
      render: DisabledExample,
    },
  ],
};
