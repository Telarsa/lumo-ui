import type { Locale } from "@lumo-ui/core";
import { PaginationExampleIsland } from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the pagination page. Contract: `_system/types.ts`.
 *
 * ISLANDS, and for two required FUNCTIONS rather than one: `onPageChange`, and
 * `pageLabel`. The copy lives HERE in both locales; the island only assembles
 * the closures and holds the current page.
 *
 * ── EVERY VISIBLE THING IN THIS COMPONENT IS A NUMBER ───────────────────────
 *
 * Which is its whole risk profile. `<button>{page}</button>` type-checks under
 * an ordinary `ReactNode`, renders, looks right in review, and ships `1 2 3`
 * into a page whose every other number is `۱ ۲ ۳` — the exact shape of the
 * measured defect that produced `LumoNode`. So no number reaches JSX
 * unformatted: `formatNumber(n, locale)` runs once per cell and the result is a
 * string by the time it is a child.
 *
 * ── AND SO IS THE ACCESSIBLE NAME, WHICH IS EASIER TO MISS ──────────────────
 *
 * `aria-label` is not visible text, so `LumoNode` cannot reach it. A page
 * button named «صفحه 3» is Latin-digit output no reviewer sees and `lumo-gate`
 * fails the build over. `pageLabel` therefore receives the ALREADY-FORMATTED
 * string, so a closure that interpolates «صفحه» in front of it cannot be wrong:
 * there is no raw number in scope. The function form is also what lets Persian
 * word order be authored rather than assembled: «صفحه ۳» and «برگهٔ ۳» are both
 * fine and neither is a template the library could pick.
 *
 * ── THE PAGER ITSELF NEEDS NO CLIENT ────────────────────────────────────────
 *
 * The class definitions and the page-window arithmetic live in a
 * directive-free module, so a server-rendered listing can render the identical
 * pager as real `<a href>` links. The `"use client"` on `pagination.tsx` is
 * `onPageChange`'s, and nothing else's.
 */

const t = {
  results: { "fa-IR": "صفحه‌بندی نتایج", "en-US": "Results pagination" },
  previous: { "fa-IR": "صفحهٔ قبل", "en-US": "Previous page" },
  next: { "fa-IR": "صفحهٔ بعد", "en-US": "Next page" },
  pageWord: { "fa-IR": "صفحهٔ", "en-US": "Page" },

  archive: { "fa-IR": "صفحه‌بندی بایگانی", "en-US": "Archive pagination" },
  sheetWord: { "fa-IR": "برگهٔ", "en-US": "Sheet" },

  invoices: { "fa-IR": "صفحه‌بندی فاکتورها", "en-US": "Invoice pagination" },
  compact: { "fa-IR": "صفحه‌بندی فشرده", "en-US": "Compact pagination" },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <PaginationExampleIsland
      locale={l}
      count={8}
      defaultPage={3}
      label={t.results[l]}
      previousLabel={t.previous[l]}
      nextLabel={t.next[l]}
      pageWord={t.pageWord[l]}
    />
  );
}

function GapsExample(l: Locale) {
  return (
    <PaginationExampleIsland
      locale={l}
      count={140}
      defaultPage={64}
      label={t.archive[l]}
      previousLabel={t.previous[l]}
      nextLabel={t.next[l]}
      pageWord={t.sheetWord[l]}
    />
  );
}

function SiblingsExample(l: Locale) {
  return (
    <PaginationExampleIsland
      locale={l}
      count={140}
      defaultPage={64}
      siblingCount={2}
      label={t.invoices[l]}
      previousLabel={t.previous[l]}
      nextLabel={t.next[l]}
      pageWord={t.pageWord[l]}
    />
  );
}

function EdgeExample(l: Locale) {
  return (
    <PaginationExampleIsland
      locale={l}
      count={12}
      defaultPage={1}
      size="sm"
      label={t.compact[l]}
      previousLabel={t.previous[l]}
      nextLabel={t.next[l]}
      pageWord={t.pageWord[l]}
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "navigation",
    title: { "fa-IR": "صفحه‌بندی", "en-US": "Pagination" },
    intro: {
      "fa-IR":
        "انتخابگر صفحه، که هرچه در آن دیده می‌شود یک عدد است — و همین نمای خطرش را می‌سازد: یک عددِ برهنه در جی‌اس‌ایکس کامپایل می‌شود، درست به نظر می‌رسد و رقم لاتین را کنار ارقام فارسیِ بقیهٔ صفحه می‌نشاند. نامِ دکمه‌ها هم همین‌طور، و آن یکی سخت‌تر دیده می‌شود چون aria-label متنِ دیدنی نیست. برای همین pageLabel یک تابع است که رشتهٔ از‌پیش‌قالب‌بندی‌شده می‌گیرد: هیچ عددِ خامی در دسترسش نیست تا اشتباه شود. پنج رشتهٔ اجباری‌اش همان شش رشتهٔ انگلیسیِ نسخه‌های بالادست‌اند، با پیش‌فرض‌های برداشته‌شده.",
      "en-US":
        "A page selector in which every visible thing is a NUMBER — which is its whole risk profile: a bare number in JSX compiles, looks right, and ships Latin digits into a page whose every other figure is Persian. The buttons' NAMES are the same problem and harder to see, because `aria-label` is not visible text. So `pageLabel` is a function that receives an already-formatted string: there is no raw number in scope for it to get wrong. Its five required strings are upstream's six English ones with the defaults removed.",
    },
    composition: [
      `<Pagination`,
      `  locale page count onPageChange`,
      `  label            ← names the <nav>. Two unnamed pagers is worse than one.`,
      `  previousLabel nextLabel`,
      `  pageLabel={(formatted) => …}   ← receives «۳», never 3`,
      `  siblingCount size />`,
    ].join("\n"),
    parts: [
      {
        name: "Pagination",
        description: {
          "fa-IR":
            "کلِ صفحه‌بند: یک nav نام‌دار حاویِ یک ul واقعی. فهرست‌بودن رایگان نیست — صفحه‌خوان پیش از راه‌رفتن روی سلول‌ها «فهرست، هفت مورد» می‌گوید، که تفاوتِ دانستن و حدس‌زدنِ درازای نتایج است. locale اجباری است و نه از یک context: یک context پیش‌فرض دارد و صفحه‌ای که فراهم‌کننده را جا انداخته با اطمینان در سیستمِ عددیِ اشتباه رندر می‌شود، بی‌آنکه چیزی قرمز شود.",
          "en-US":
            "The whole pager: a named `<nav>` holding a real `<ul>`. Being a list is not free — a screen reader announces «list, 7 items» before walking the cells, which is the difference between knowing how far the results go and guessing. `locale` is required rather than taken from a context: a context would have a default, and a page that forgot the provider would render confidently in the wrong numbering system with nothing red anywhere.",
        },
      },
      {
        name: "paginationRange",
        description: {
          "fa-IR":
            "حسابِ پنجرهٔ صفحه‌ها، در یک ماژولِ بدون دستورِ کلاینت. همان تابعی است که یک فهرستِ سروری هم صدا می‌زند تا همین صفحه‌بند را از پیوندهای واقعیِ href بسازد — پس اِعمالِ «use client» روی این جزء تنها بابتِ onPageChange است.",
          "en-US":
            "The page-window arithmetic, in a directive-free module. It is the same function a server-rendered listing calls to build this identical pager out of real `<a href>` links — so the `\"use client\"` on the component is `onPageChange`'s alone.",
        },
      },
      {
        name: "paginationItemVariants",
        description: {
          "fa-IR":
            "خانهٔ یک صفحه. مربع است به‌طور ساختاری — کمینهٔ عرض برابرِ ارتفاع — پس صفحهٔ دو‌رقمی خانه را از همسایه‌اش پهن‌تر نمی‌کند و ردیف نمی‌پرد. حالتِ «صفحهٔ فعلی» را aria-current اعلام می‌کند و رنگ فقط تکرارش می‌کند؛ رنگ به‌تنهایی برای کسی که آن را نمی‌بیند هیچ نگفته.",
          "en-US":
            "One page's cell. It is square by construction — a minimum width equal to the height — so a two-digit page does not make its cell wider than a one-digit neighbour and jump the row. The current page is announced by `aria-current` and the fill merely repeats it; colour alone says nothing to anyone who cannot see it.",
        },
      },
      {
        name: "paginationGapVariants",
        description: {
          "fa-IR":
            "علامتِ حذف میان دو گروهِ عدد. aria-hidden است چون خوانده‌شدنش «نقطه نقطه نقطه» میان دو شماره است؛ و صفحه‌هایی که پنهان می‌کند بی‌راه نمی‌مانند، چون حسابِ پنجره همیشه اولین و آخرین صفحه را در ردیف نگه می‌دارد.",
          "en-US":
            "The elision mark between two groups of numbers. It is `aria-hidden` because read aloud it is «dot dot dot» between two page numbers; and the pages it hides stay reachable, because the window arithmetic always keeps the first and last page in the row.",
        },
      },
      {
        name: "paginationVariants",
        description: {
          "fa-IR":
            "چیدمانِ ردیف. نگاره‌های قبلی و بعدی جفتِ آینه‌شوندهٔ یونیکد‌اند، پس سرِ پیکان با جهتِ حل‌شده برمی‌گردد؛ و چون یک ردیفِ فلکس از direction پیروی می‌کند، خودِ دکمه هم جابه‌جا می‌شود. هر دو، از هیچ‌چیز جز جریانِ عادی و یک کدنقطه.",
          "en-US":
            "The row's layout. The previous and next glyphs are Unicode's mirrored pair, so the arrowhead flips with the resolved direction; and because a flex row follows `direction`, the control MOVES too. Both, from nothing but normal flow and one codepoint each.",
        },
      },
    ],
  },
  examples: [
    {
      id: "basic",
      title: { "fa-IR": "پنج رشته که پیش‌فرض ندارند", "en-US": "Five strings with no defaults" },
      description: {
        "fa-IR":
          "روی مسیر فارسی هر خانه رقم فارسی دارد و نامِ اعلام‌شده‌اش هم — «صفحهٔ ۳» و نه شکلِ لاتینِ همان. عدد یک بار قالب‌بندی می‌شود و همان یک رشته هم به سلول می‌رود و هم به نام، پس آن دو نمی‌توانند از هم فاصله بگیرند. با کلید تب جلو بروید و ببینید دکمهٔ «قبل» روی صفحهٔ اول از کار افتاده است و نه ناپدید.",
        "en-US":
          "On the Persian route every cell carries a Persian digit and so does its announced name — «صفحهٔ ۳» rather than «صفحهٔ 3». The number is formatted ONCE and the same string reaches both the cell and the name, so the two cannot drift. Tab through and note that «previous» on page one is disabled rather than absent.",
      },
      render: BasicExample,
    },
    {
      id: "gaps",
      title: { "fa-IR": "صد و چهل صفحه در یک ردیف", "en-US": "A hundred and forty pages in one row" },
      description: {
        "fa-IR":
          "پنجره تا می‌شود و دو علامتِ حذف ظاهر می‌شوند، ولی اولین و آخرین صفحه همیشه در ردیف می‌مانند — پس «برو به آخر» همیشه یک کلیک است و هرگز حدس. علامت‌های حذف aria-hidden اند و برای صفحه‌خوان اصلاً وجود ندارند.",
        "en-US":
          "The window folds and two elision marks appear, but the first and last page always stay in the row — so «jump to the end» is always one click and never a guess. The marks are `aria-hidden` and do not exist for a screen reader at all.",
      },
      render: GapsExample,
    },
    {
      id: "siblings",
      title: { "fa-IR": "همسایه‌های بیشتر، همان ردیف", "en-US": "More neighbours, the same row" },
      description: {
        "fa-IR":
          "siblingCount تعداد صفحه‌های هر طرفِ صفحهٔ فعلی است و پیش‌فرضش یک است. اینجا دو است، پس ردیف پهن‌تر می‌شود و پرش‌های کوچک را ارزان‌تر می‌کند — همان صفحه‌بندِ نمونهٔ بالا، با یک عددِ متفاوت و بدون هیچ کلاسِ تازه‌ای.",
        "en-US":
          "`siblingCount` is how many pages sit on each side of the current one, and it defaults to one. Here it is two, so the row grows wider and makes small jumps cheaper — the same pager as above, with one different number and no new class.",
      },
      render: SiblingsExample,
    },
    {
      id: "compact",
      title: { "fa-IR": "لبهٔ ردیف، در اندازهٔ کوچک", "en-US": "The edge of the row, in the small size" },
      description: {
        "fa-IR":
          "روی صفحهٔ اول دکمهٔ «قبل» از کار افتاده است و همچنان در ترتیبِ سند می‌ماند، پس ردیف عرضش را نگه می‌دارد و هیچ‌چیز جابه‌جا نمی‌شود وقتی به صفحهٔ دوم می‌روید. حالتِ ازکارافتاده هم از یک ویژگیِ داده‌ای سبک می‌گیرد و نه فقط از ویژگیِ بومی، وگرنه آن قاعده در سکوت از دست می‌رفت.",
        "en-US":
          "On page one the «previous» control is disabled and still occupies the row, so the row keeps its width and nothing shifts when you move to page two. The disabled state is styled off a data attribute rather than the native one alone — a bare `<button disabled>` would have silently dropped that rule.",
      },
      render: EdgeExample,
    },
  ],
};
