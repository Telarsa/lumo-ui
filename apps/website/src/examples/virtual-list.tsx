import type { Locale } from "@lumo-ui/core";
import { VirtualListIsland } from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the virtual-list page. Contract: `_system/types.ts`.
 *
 * ISLANDS: `children` is a FUNCTION of a row index. A static child list is not
 * a smaller version of that — it is a list that is never virtualised, which
 * renders and type-checks and silently does nothing. The copy lives HERE.
 *
 * ═══ THE DEFECT VIRTUALISATION INTRODUCES ═══════════════════════════════════
 *
 * A screen reader computes a list's size FROM THE DOM. Virtualise ten thousand
 * rows and the DOM holds twelve, so the reader announces «۱ از ۱۲» on a list of
 * ten thousand — confidently, wrongly, and identically in every language. There
 * is no visual symptom whatsoever. `aria-setsize` and `aria-posinset` are the
 * fix, and they are emitted by the component from `count` and the row's TRUE
 * index rather than left to the caller, because an affordance a caller has to
 * remember on every row is one that is eventually forgotten on one row.
 *
 * Both carry integers, and integers in ARIA attributes are announced in the
 * READER's own language. So `count` is emitted raw and deliberately never goes
 * through `formatNumber`: a Persian digit in `aria-setsize` is not a
 * localisation, it is an invalid attribute value. The opposite of
 * `aria-valuetext`, which is prose and must be formatted. Getting it backwards
 * is silent in both directions.
 *
 * ═══ THE THREE DEFECTS THAT REPLACED A DEPENDENCY ═══════════════════════════
 *
 * This was `@tanstack/react-virtual` until 11 Aug 2026, and the arithmetic is
 * now Lumo's. Not because that library is bad — it is very good — but because a
 * virtualiser is arithmetic, the arithmetic is small, and the parts Lumo needs
 * are the parts where a general-purpose library leaves a configuration hole a
 * Persian page falls through. Three holes, closed by DELETING the option rather
 * than setting it correctly:
 *
 *  1. Measurements were cached by INDEX. Sort a list and every measured height
 *     stays at its old position, so a two-line row moving from index 3 to 40
 *     leaves its height behind — a scrollbar that drifts and rows that jump,
 *     correcting itself as each row re-measures, which is why it reads as jank
 *     rather than as a bug. Here the cache is keyed by the row's own identity.
 *  2. The scroller arrived as a GETTER. Written the obvious way at the call
 *     site that is a new function every render, so any effect depending on it
 *     re-subscribes its scroll listener and rebuilds its observer per render —
 *     in the one component whose whole purpose is to avoid per-row work. A ref
 *     is stable by construction.
 *  3. `isRtl` defaulted to FALSE, and the offset was read as
 *     `scrollLeft * (isRtl ? -1 : 1)`. A horizontal list in a Persian document
 *     therefore read the sign wrong and rendered the window from the wrong end
 *     of the data — while looking, to anyone who does not read Persian, like a
 *     list that starts somewhere odd. This reads `Math.abs(scrollLeft)` and
 *     takes no direction option at all, which is correct for strictly more
 *     browsers than the signed form.
 */

const t = {
  orders: { "fa-IR": "فهرست سفارش‌ها", "en-US": "Order list" },
  orderWord: { "fa-IR": "سفارش", "en-US": "Order" },

  audit: { "fa-IR": "رد پای تغییرات", "en-US": "Audit trail" },
  eventWord: { "fa-IR": "رویداد", "en-US": "Event" },

  frames: { "fa-IR": "نوار قاب‌ها", "en-US": "Frame strip" },
  frameWord: { "fa-IR": "قاب", "en-US": "Frame" },

  threads: { "fa-IR": "گفت‌وگوها", "en-US": "Conversations" },
  threadWord: { "fa-IR": "گفت‌وگو", "en-US": "Conversation" },
  remote: { "fa-IR": "نتایج دور", "en-US": "Remote results" },
  resultWord: { "fa-IR": "نتیجه", "en-US": "Result" },
  loaded: { "fa-IR": "تعداد بارگذاری‌شده", "en-US": "Loaded" },
} satisfies Record<string, LocalizedText>;

function CorpusExample(l: Locale) {
  return (
    <VirtualListIsland
      locale={l}
      label={t.orders[l]}
      rowWord={t.orderWord[l]}
      count={10000}
      rowSize={44}
      initialSize={320}
      className="h-80 max-w-md rounded-md border border-border bg-surface"
      itemClassName="border-be border-border"
    />
  );
}

function FirstByteExample(l: Locale) {
  return (
    <VirtualListIsland
      locale={l}
      label={t.audit[l]}
      rowWord={t.eventWord[l]}
      count={500}
      rowSize={36}
      initialSize={180}
      className="h-45 max-w-md rounded-md border border-border bg-surface"
      itemClassName="border-be border-border"
    />
  );
}

function HorizontalExample(l: Locale) {
  return (
    <VirtualListIsland
      locale={l}
      label={t.frames[l]}
      rowWord={t.frameWord[l]}
      orientation="horizontal"
      count={2000}
      rowSize={128}
      initialSize={480}
      className="h-24 max-w-2xl rounded-md border border-border bg-surface"
      itemClassName="w-32 border-e border-border"
    />
  );
}

function EstimatesExample(l: Locale) {
  return (
    <VirtualListIsland
      locale={l}
      label={t.threads[l]}
      rowWord={t.threadWord[l]}
      count={4000}
      rowSize={40}
      varyingSizes
      gap={8}
      initialSize={320}
      className="h-80 max-w-md rounded-md border border-border bg-surface p-2"
      itemClassName="rounded-md border border-border bg-surface-sunken"
    />
  );
}

function InfiniteExample(l: Locale) {
  return (
    <VirtualListIsland
      locale={l}
      label={t.remote[l]}
      rowWord={t.resultWord[l]}
      count={40}
      loadToCount={120}
      loadedWord={t.loaded[l]}
      rowSize={44}
      initialSize={240}
      className="h-60 max-w-md rounded-md border border-border bg-surface"
      itemClassName="border-be border-border"
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "data",
    isNew: true,
    title: { "fa-IR": "فهرست مجازی", "en-US": "Virtual list" },
    intro: {
      "fa-IR":
        "فهرستی که به‌جای کلِ داده یک پنجره را رندر می‌کند. نقصی که خودِ مجازی‌سازی می‌سازد این است: صفحه‌خوان اندازهٔ فهرست را از DOM حساب می‌کند، پس ده هزار ردیف که دوازده‌تا در سند دارند «۱ از ۱۲» اعلام می‌شوند — با اطمینان، اشتباه، و بدون هیچ نشانهٔ دیداری. aria-setsize و aria-posinset درمانِ آن‌اند و خودِ این جزء منتشرشان می‌کند و نه فراخواننده. هر دو عددِ خام‌اند و عمداً قالب‌بندی نمی‌شوند: رقم فارسی در aria-setsize بومی‌سازی نیست، مقدارِ نامعتبر است. کلِ اسکرولر یک ایستِ تب دارد و ردیف‌ها فوکوس‌پذیر نیستند.",
      "en-US":
        "A list that renders a WINDOW instead of a corpus. The defect virtualisation introduces is this: a screen reader computes a list's size from the DOM, so ten thousand rows with twelve in the document announce «۱ از ۱۲» — confidently, wrongly, and with no visual symptom at all. `aria-setsize` and `aria-posinset` are the fix and this component emits them rather than the caller. Both are RAW integers and deliberately not formatted: a Persian digit in `aria-setsize` is not a localisation, it is an invalid attribute value. The scroller is one tab stop and the rows are not focusable.",
    },
    composition: [
      `<VirtualList`,
      `  label locale                    ← direction is derived; there is no isRtl prop`,
      `  count estimateSize`,
      `  initialSize                     ← REQUIRED: the viewport the SERVER lays out against`,
      `  overscan orientation gap getItemKey`,
      `  className itemClassName>`,
      `  {(index) => …}                  ← called with the row's TRUE index`,
      `</VirtualList>`,
    ].join("\n"),
    parts: [
      {
        name: "VirtualList",
        description: {
          "fa-IR":
            "کلِ جزء: نقش‌ها، نام، ایستِ تب و هر ویژگیِ aria از آنِ اوست و قلابِ حساب فقط پنجره‌ای از شاخص‌ها و جابه‌جایی‌ها را می‌دهد. label اجباری است چون خودِ اسکرولر tabIndex صفر می‌گیرد — یک ناحیهٔ پیمایش‌پذیر که از صفحه‌کلید رسیدنی نباشد از صفحه‌کلید پیمایش‌پذیر هم نیست — و عنصرِ فوکوس‌پذیرِ بی‌نام فقط نقشش را اعلام می‌کند. دقیقاً یک ایست برای کلِ فهرست وجود دارد: ده هزار ردیفِ فوکوس‌پذیر یک تلهٔ صفحه‌کلید با گام‌های اضافه است.",
          "en-US":
            "The whole component: the roles, the name, the tab stop and every `aria-*` attribute belong to it, while the arithmetic hook supplies only a window of indices and offsets. `label` is required because the scroller itself carries `tabIndex={0}` — a scrollable region that cannot be reached from the keyboard cannot be scrolled from it — and a focusable element with no name announces its role and nothing else. There is exactly ONE stop for the whole list: ten thousand focusable rows is a keyboard trap with extra steps.",
        },
      },
      {
        name: "virtualListVariants",
        description: {
          "fa-IR":
            "جعبهٔ پیمایش. در حالت عمودی فقط محور بلوکی می‌پیماید و محور درون‌خطی بریده می‌شود: فهرستی که تصادفی به پهلو بلغزد فهرستی است که در راست‌به‌چپ جایش را گم می‌کند، چون موتورهای مرورگر دربارهٔ علامتِ scrollLeft با هم اختلاف دارند.",
          "en-US":
            "The scroll box. In the vertical case only the block axis scrolls and the inline one is clipped: a list that can slide sideways by accident is a list that loses its place under RTL, where browser engines disagree about the SIGN of `scrollLeft`.",
        },
      },
      {
        name: "virtualListItemVariants",
        description: {
          "fa-IR":
            "جای‌گیریِ یک ردیف. لنگرِ درون‌خطی منطقی است و نه چپِ فیزیکی — همین است که ردیف را در هر دو خط به لبهٔ آغازِ خواندن می‌چسباند؛ املای فیزیکی هر ردیفِ یک فهرستِ فارسی را به لبهٔ چپ می‌برد و لبهٔ پایانی را ناهموار می‌گذارد، که شبیه ایرادِ سبک‌دهی است و ایرادِ جهت است. لنگرِ بالا فیزیکی است و درست، چون محور بلوکی آینه نمی‌شود.",
          "en-US":
            "One row's placement. `start-0` rather than `left-0` — that is what pins a row to the reading START in both scripts; the physical utility would pin every row of a Persian list to the left edge and leave the trailing one ragged, which looks like a styling bug and is a direction bug. `top-0` is physical and correct, because the block axis does not mirror.",
        },
      },
      {
        name: "virtualMirror",
        description: {
          "fa-IR":
            "علامتِ جابه‌جایی، که تنها کمیّتِ واقعاً فیزیکیِ اینجاست: سی‌اس‌اس شکلِ منطقیِ transform ندارد، پس یک فهرستِ افقی در سندِ راست‌به‌چپ به یک translateX منفی نیاز دارد. از locale مشتق می‌شود و در یک ماژولِ بدون دستورِ کلاینت زندگی می‌کند، پس یک جزءِ سروری که همین فهرست را قاب می‌گیرد می‌تواند دربارهٔ همان جهت استدلال کند بی‌آنکه به مرزِ کلاینت کشیده شود.",
          "en-US":
            "The transform's sign, which is the one genuinely physical quantity here: CSS has no logical form for a transform, so a horizontal list in an RTL document needs a NEGATED `translateX`. It is derived from `locale` and lives in a directive-free module, so a server component framing the same list can reason about the same direction without being pulled across the client boundary.",
        },
      },
    ],
  },
  examples: [
    {
      id: "corpus",
      title: { "fa-IR": "ده هزار ردیف، دوازده در سند", "en-US": "Ten thousand rows, twelve in the document" },
      description: {
        "fa-IR":
          "شمارش را همان‌طور که هست بشمارید: در بازرس چند ردیف بیشتر نمی‌بینید، ولی هر ردیف aria-setsize ده هزار دارد و aria-posinset شاخصِ واقعیِ خودش. بدون آن دو، صفحه‌خوان اندازهٔ پنجره را اعلام می‌کند و هیچ‌چیز روی صفحه نمی‌گوید که اشتباه است. با کلید تب هم وارد شوید: یک ایست برای کلِ فهرست، و کلیدهای جهت پیمایش می‌کنند.",
        "en-US":
          "Count what is actually there: the inspector shows a handful of rows, but each one carries `aria-setsize` of ten thousand and its own true `aria-posinset`. Without the pair, a screen reader announces the size of the WINDOW and nothing on screen says it is wrong. Tab in as well: one stop for the whole list, and the arrow keys scroll it.",
      },
      render: CorpusExample,
    },
    {
      id: "first-byte",
      title: { "fa-IR": "چیزی که سرور می‌تواند بچیند", "en-US": "What a server can lay out" },
      description: {
        "fa-IR":
          "هیچ‌چیز روی سرور یک نمایشگر را اندازه نمی‌گیرد، پس یک مجازی‌ساز که به حال خود رها شود پنجرهٔ خالی برمی‌گرداند و این جزء یک فهرستِ خالی سرو می‌کند — نقطهٔ کورِ صفحه‌شکلی که دروازه سبز می‌بیند، چون متنی نیست، پس رقم لاتینی نیست، پس سبز. initialSize همان نمایشگرِ قطعی است که رندرِ اول رویش می‌چیند، و اجباری است چون پیش‌فرضش صفر می‌شد و صفر تا وقتی کسی بایت‌ها را نخواند از پاسخِ درست جدا نیست. عدد یک طول است و نه شمارشِ ردیف.",
        "en-US":
          "Nothing measures a viewport on a server, so a virtualiser left alone returns an empty window and this component serves an EMPTY list — a page-shaped blind spot the gate grades as a vacuous pass: no text, therefore no Latin digits, therefore green. `initialSize` is the deterministic viewport the first render lays out against, and it is required rather than defaulted because the default would be zero, and zero is indistinguishable from a correct answer until someone reads the bytes. The number is a LENGTH, not a row count.",
      },
      render: FirstByteExample,
    },
    {
      id: "horizontal",
      title: { "fa-IR": "محوری که علامت دارد", "en-US": "The axis that has a sign" },
      description: {
        "fa-IR":
          "یک فهرستِ عمودی هیچ کارِ جهتی ندارد؛ افقی همهٔ کار را دارد. آفستِ پیمایش با قدرِ مطلق خوانده می‌شود و نه با علامتی که یک پرچم تعیینش کند — درست برای دو مدل از سه مدلِ مرورگری و بی‌نیاز از هر پرچمی — و علامتِ transform جداگانه از locale مشتق می‌شود، چون transform واقعاً فیزیکی است. روی مسیر فارسی از راست شروع کنید و به چپ بکشید: پنجره از همان انتهایی می‌آید که باید.",
        "en-US":
          "A vertical list needs no direction work; a horizontal one needs all of it. The scroll offset is read as an ABSOLUTE value rather than with a sign a flag decides — correct for two of the three browser models and needing no flag at all — and the transform's sign is derived separately from `locale`, because a transform genuinely is physical. On the Persian route start at the right and drag left: the window comes from the end it should.",
      },
      render: HorizontalExample,
    },
    {
      id: "estimates",
      title: { "fa-IR": "تخمینی که تابع است", "en-US": "An estimate that is a function" },
      description: {
        "fa-IR":
          "اینجا اندازهٔ ردیف تابعی از شاخص است و نه یک ثابت، پس ردیف‌ها بلندی‌های متفاوت دارند و نوار پیمایش پیش از سوارشدنِ آن‌ها هم درست است. ردیف‌ها که سوار شوند اندازه‌گیریِ واقعی جای تخمین را می‌گیرد، و چون حافظهٔ اندازه‌ها با هویتِ خودِ ردیف کلید خورده و نه با جایش، مرتب‌کردنِ فهرست ارتفاعِ یک ردیف را پشتِ سر جا نمی‌گذارد. gap هم بخشی از همان حساب است و نه یک فاصلهٔ سی‌اس‌اسی، چون سی‌اس‌اس آن را به مجازی‌ساز نمی‌گوید.",
        "en-US":
          "Here a row's size is a function of the index rather than a constant, so the rows have different heights and the scrollbar is right before any of them mount. Once they do, real measurement replaces the estimate — and because the measurement cache is keyed by the row's own identity rather than by its position, sorting the list does not leave a row's height behind. The `gap` is part of the same arithmetic rather than a CSS gap, because CSS does not tell the virtualiser about it.",
      },
      render: EstimatesExample,
    },
    {
      id: "infinite",
      title: { "fa-IR": "بارگذاری با رسیدن به پایان", "en-US": "Load on end reached" },
      description: {
        "fa-IR":
          "وقتی پنجره به آستانهٔ پایان می‌رسد، برای همان اندازهٔ داده فقط یک بار درخواست می‌دهد. با بزرگ‌شدن مجموعه دوباره مسلح می‌شود؛ رندرِ دوباره با همان شمار هرگز درخواست را تکرار نمی‌کند.",
        "en-US":
          "When the window reaches the end threshold it requests once for that corpus size. Growing the collection rearms it; rerendering the same count never repeats the request.",
      },
      render: InfiniteExample,
    },
  ],
};
