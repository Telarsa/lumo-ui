import type { Locale } from "@lumo-ui/core";
import {
  DataGridAsyncIsland,
  DataGridIsland,
  DataGridTreeIsland,
  type DataGridIslandRow,
  type DataGridTreeIslandRow,
} from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the data-grid page. Contract: `_system/types.ts`.
 *
 * Islands, unavoidably: `useLumoTable` is a hook, and `pageLabel` and
 * `rangeLabel` are required FUNCTIONS. The copy lives here, in both locales.
 *
 * ── WHAT TO DO ON THIS PAGE ─────────────────────────────────────────────────
 *
 * Three behaviours, none of which a screenshot shows:
 *
 *  1. **Type in the search box.** The grid returns to page one. Filtering while
 *     on page four otherwise leaves the reader staring at an empty table with a
 *     pager insisting nothing is wrong.
 *  2. **Open «ستون‌ها» and hide columns.** The LAST visible one's toggle goes
 *     disabled. A grid with every column hidden has no cells, no row headers and
 *     no way back — the only control that could restore one is the control that
 *     destroyed it.
 *  3. **Change the rows-per-page.** Every figure on that footer is in the
 *     reader's own numerals, including the options in the select, which is the
 *     one place `LumoNode` cannot refuse a bare number: option text is not JSX
 *     children.
 *
 * ── THE RANGE READ-OUT IS A BIDI TRAP, AND THAT IS WHY IT IS A PROP ─────────
 *
 * «۱–۵ از ۱۲» is two Arabic-number runs with a neutral character between them.
 * Under the Unicode bidi algorithm a neutral between two AN runs inside an RTL
 * paragraph takes the PARAGRAPH's direction — so the dash can resolve
 * right-to-left and the range renders as «۵–۱»: the same numbers, reversed,
 * silently, and only in Persian. `rangeLabel` therefore hands the whole
 * sentence to the caller, who can place an isolate if their wording needs one.
 * This file assembles it from two words, which is honest for this phrasing and
 * is not a general licence — `demo-islands.tsx` says the same from its side.
 *
 * The public engine additionally enables logical start/end pinning, column and
 * row ordering, transactional cell editing, grouping/aggregation, native-table
 * virtualization and infinite loading. Those are orthogonal contracts rather
 * than a second monolithic grid component.
 */

const t = {
  gridLabel: { "fa-IR": "سفارش‌های اخیر", "en-US": "Recent orders" },
  searchLabel: { "fa-IR": "جست‌وجو در سفارش‌ها", "en-US": "Search the orders" },
  searchClear: { "fa-IR": "پاک کردن جست‌وجو", "en-US": "Clear the search" },
  searchPlaceholder: { "fa-IR": "نام یا شهر", "en-US": "Name or city" },
  columnsLabel: { "fa-IR": "ستون‌ها", "en-US": "Columns" },
  empty: {
    "fa-IR": "هیچ سفارشی با این جست‌وجو پیدا نشد.",
    "en-US": "No order matched that search.",
  },
  sortAsc: { "fa-IR": "صعودی مرتب شده", "en-US": "Sorted ascending" },
  sortDesc: { "fa-IR": "نزولی مرتب شده", "en-US": "Sorted descending" },
  pagerLabel: { "fa-IR": "صفحه‌بندی سفارش‌ها", "en-US": "Order pagination" },
  previous: { "fa-IR": "صفحهٔ قبل", "en-US": "Previous page" },
  next: { "fa-IR": "صفحهٔ بعد", "en-US": "Next page" },
  pageWord: { "fa-IR": "صفحهٔ", "en-US": "Page" },
  ofWord: { "fa-IR": "از", "en-US": "of" },
  pageSizeLabel: { "fa-IR": "تعداد ردیف در هر صفحه", "en-US": "Rows per page" },
  treeGridLabel: { "fa-IR": "سفارش‌ها و ارسال‌ها", "en-US": "Orders and shipments" },
  asyncGridLabel: { "fa-IR": "سفارش‌های راه دور", "en-US": "Remote orders" },
  loading: { "fa-IR": "در حال دریافت سفارش‌ها", "en-US": "Loading orders" },
  refreshing: { "fa-IR": "در حال تازه‌سازی سفارش‌ها", "en-US": "Refreshing orders" },
  loadingMore: {
    "fa-IR": "در حال دریافت سفارش‌های بیشتر",
    "en-US": "Loading more orders",
  },
  retry: { "fa-IR": "تلاش دوباره", "en-US": "Retry" },
  loadMore: { "fa-IR": "سفارش‌های بیشتر", "en-US": "Load more orders" },
  remoteError: {
    "fa-IR": "دریافت سفارش‌ها ناموفق بود",
    "en-US": "Orders could not be loaded",
  },

  colName: { "fa-IR": "مشتری", "en-US": "Customer" },
  colCity: { "fa-IR": "شهر", "en-US": "City" },
  colTotal: { "fa-IR": "مبلغ به تومان", "en-US": "Total in toman" },

  n1: { "fa-IR": "سمیرا محمدی", "en-US": "Samira Mohammadi" },
  n2: { "fa-IR": "رضا کریمی", "en-US": "Reza Karimi" },
  n3: { "fa-IR": "نگار احمدی", "en-US": "Negar Ahmadi" },
  n4: { "fa-IR": "پویا طاهری", "en-US": "Pouya Taheri" },
  n5: { "fa-IR": "مهسا حسینی", "en-US": "Mahsa Hosseini" },
  n6: { "fa-IR": "زهرا فرهادی", "en-US": "Zahra Farhadi" },
  n7: { "fa-IR": "امیر نوری", "en-US": "Amir Nouri" },
  n8: { "fa-IR": "لیلا صادقی", "en-US": "Leila Sadeghi" },
  n9: { "fa-IR": "کاوه رستمی", "en-US": "Kaveh Rostami" },
  n10: { "fa-IR": "شیرین بهرامی", "en-US": "Shirin Bahrami" },
  n11: { "fa-IR": "بهزاد مرادی", "en-US": "Behzad Moradi" },
  n12: { "fa-IR": "الهام قاسمی", "en-US": "Elham Ghasemi" },

  cTehran: { "fa-IR": "تهران", "en-US": "Tehran" },
  cMashhad: { "fa-IR": "مشهد", "en-US": "Mashhad" },
  cShiraz: { "fa-IR": "شیراز", "en-US": "Shiraz" },
  cTabriz: { "fa-IR": "تبریز", "en-US": "Tabriz" },
  cIsfahan: { "fa-IR": "اصفهان", "en-US": "Isfahan" },
  parentOrder: { "fa-IR": "سفارش عمدهٔ آفتاب", "en-US": "Aftab bulk order" },
  firstShipment: { "fa-IR": "ارسال نخست", "en-US": "First shipment" },
  secondShipment: { "fa-IR": "ارسال دوم", "en-US": "Second shipment" },
  otherOrder: { "fa-IR": "سفارش فروشگاه بهار", "en-US": "Bahar shop order" },
  expandParent: {
    "fa-IR": "باز کردن ارسال‌های سفارش آفتاب",
    "en-US": "Expand Aftab order shipments",
  },
  collapseParent: {
    "fa-IR": "بستن ارسال‌های سفارش آفتاب",
    "en-US": "Collapse Aftab order shipments",
  },
  expandUnused: { "fa-IR": "باز کردن ردیف", "en-US": "Expand row" },
  collapseUnused: { "fa-IR": "بستن ردیف", "en-US": "Collapse row" },
} satisfies Record<string, LocalizedText>;

/**
 * The rows. Fixed data, so the prerendered bytes are the same every build.
 *
 * `total` stays a NUMBER all the way to the cell, where the island runs it
 * through `formatNumber`. Pre-formatting it here would sort it as text, which
 * is the quiet way a «مبلغ» column orders ۹۰۰٬۰۰۰ above ۱٬۲۰۰٬۰۰۰.
 */
function rows(l: Locale): readonly DataGridIslandRow[] {
  return [
    { id: "1", name: t.n1[l], city: t.cTehran[l], total: 1_250_000 },
    { id: "2", name: t.n2[l], city: t.cMashhad[l], total: 480_000 },
    { id: "3", name: t.n3[l], city: t.cShiraz[l], total: 2_300_000 },
    { id: "4", name: t.n4[l], city: t.cTehran[l], total: 175_000 },
    { id: "5", name: t.n5[l], city: t.cTabriz[l], total: 940_000 },
    { id: "6", name: t.n6[l], city: t.cIsfahan[l], total: 3_100_000 },
    { id: "7", name: t.n7[l], city: t.cTehran[l], total: 620_000 },
    { id: "8", name: t.n8[l], city: t.cMashhad[l], total: 1_480_000 },
    { id: "9", name: t.n9[l], city: t.cShiraz[l], total: 260_000 },
    { id: "10", name: t.n10[l], city: t.cIsfahan[l], total: 5_750_000 },
    { id: "11", name: t.n11[l], city: t.cTabriz[l], total: 830_000 },
    { id: "12", name: t.n12[l], city: t.cTehran[l], total: 1_050_000 },
  ];
}

function columns(l: Locale) {
  return [
    { id: "name", label: t.colName[l] },
    { id: "city", label: t.colCity[l] },
    { id: "total", label: t.colTotal[l] },
  ];
}

function FullExample(l: Locale) {
  return (
    <DataGridIsland
      locale={l}
      rows={rows(l)}
      columns={columns(l)}
      label={t.gridLabel[l]}
      searchLabel={t.searchLabel[l]}
      searchClearLabel={t.searchClear[l]}
      searchPlaceholder={t.searchPlaceholder[l]}
      columnsLabel={t.columnsLabel[l]}
      emptyText={t.empty[l]}
      sortAscendingLabel={t.sortAsc[l]}
      sortDescendingLabel={t.sortDesc[l]}
      pagerLabel={t.pagerLabel[l]}
      previousLabel={t.previous[l]}
      nextLabel={t.next[l]}
      pageWord={t.pageWord[l]}
      ofWord={t.ofWord[l]}
      pageSizeLabel={t.pageSizeLabel[l]}
      pageSizes={[5, 10, 25]}
      pageSize={5}
    />
  );
}

function CompactExample(l: Locale) {
  return (
    <DataGridIsland
      locale={l}
      rows={rows(l).slice(0, 4)}
      columns={columns(l)}
      label={t.gridLabel[l]}
      searchLabel={t.searchLabel[l]}
      searchClearLabel={t.searchClear[l]}
      searchPlaceholder={t.searchPlaceholder[l]}
      columnsLabel={t.columnsLabel[l]}
      emptyText={t.empty[l]}
      sortAscendingLabel={t.sortAsc[l]}
      sortDescendingLabel={t.sortDesc[l]}
      pagerLabel={t.pagerLabel[l]}
      previousLabel={t.previous[l]}
      nextLabel={t.next[l]}
      pageWord={t.pageWord[l]}
      ofWord={t.ofWord[l]}
      pageSizeLabel={t.pageSizeLabel[l]}
      pageSize={10}
    />
  );
}

function treeRows(l: Locale): readonly DataGridTreeIslandRow[] {
  return [
    {
      id: "aftab",
      name: t.parentOrder[l],
      total: 2_400_000,
      expandLabel: t.expandParent[l],
      collapseLabel: t.collapseParent[l],
      children: [
        {
          id: "shipment-one",
          name: t.firstShipment[l],
          total: 1_400_000,
          expandLabel: t.expandUnused[l],
          collapseLabel: t.collapseUnused[l],
        },
        {
          id: "shipment-two",
          name: t.secondShipment[l],
          total: 1_000_000,
          expandLabel: t.expandUnused[l],
          collapseLabel: t.collapseUnused[l],
        },
      ],
    },
    {
      id: "bahar",
      name: t.otherOrder[l],
      total: 760_000,
      expandLabel: t.expandUnused[l],
      collapseLabel: t.collapseUnused[l],
    },
  ];
}

function TreeRowsExample(l: Locale) {
  return (
    <DataGridTreeIsland
      locale={l}
      label={t.treeGridLabel[l]}
      nameHeader={t.colName[l]}
      totalHeader={t.colTotal[l]}
      rows={treeRows(l)}
    />
  );
}

function AsyncRowsExample(l: Locale) {
  const all = rows(l).slice(0, 6);
  return (
    <DataGridAsyncIsland
      locale={l}
      label={t.asyncGridLabel[l]}
      nameHeader={t.colName[l]}
      pages={[all.slice(0, 3), all.slice(3)]}
      loadingText={t.loading[l]}
      refreshingText={t.refreshing[l]}
      loadingMoreText={t.loadingMore[l]}
      emptyText={t.empty[l]}
      retryLabel={t.retry[l]}
      loadMoreLabel={t.loadMore[l]}
      errorText={t.remoteError[l]}
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "مجموعه‌ای بزرگ که ویرایش سلولی، انتخاب چندگانه، منوی ستون، صفحه‌بندی و وضعیت غیرهمگام می‌خواهد و اعتبارسنجی هر سلول باید اعلام شود.",
        "en-US": "A large collection that needs cell editing, multi-selection, column menus, pagination and async state, where each cell's validation must be announced.",
      },
      whenNot: {
        "fa-IR": "صد ردیف خواندنی با چند ستون — `Table` ساده‌تر و سبک‌تر است. سلسله‌مراتب — `Tree`.",
        "en-US": "A hundred readable rows with a few columns — `Table` is simpler and lighter. A hierarchy — `Tree`.",
      },
    },
    tier: "data",
    isNew: true,
    title: { "fa-IR": "شبکهٔ داده", "en-US": "Data grid" },
    intro: {
      "fa-IR":
        "زینتِ دورِ یک جدول: جست‌وجو، نمایش و پنهان‌کردن ستون‌ها، صفحه‌بندی و حالتِ خالی. خودِ جدول همچنان Table است — نقش‌ها، تمرکزِ چرخشی و کلیدهای جهت‌دار همان‌جا می‌مانند — و این پرونده فقط چیزی را اضافه می‌کند که هیچ‌جای دیگر کتابخانه نبود: رابطِ کاربریِ پنهان‌کردن ستون، و خوانشِ بازه در پایین. آخرین ستونِ نمایان قابل پنهان‌کردن نیست، چون شبکه‌ای بدون هیچ ستون هیچ راهِ بازگشتی ندارد.",
      "en-US":
        "The chrome around a table: search, column visibility, paging and an empty state. The table itself is still Table — the roles, the roving focus and the direction-resolved arrows stay there — and this file adds only what the library did not have anywhere: a column-hiding UI, and the range read-out in the footer. The last visible column cannot be hidden, because a grid with no columns has no way back.",
    },
    composition: [
      `<DataGrid locale table>            ← carries locale + the useLumoTable instance`,
      `  <DataGridToolbar>`,
      `    <DataGridSearch label clearLabel />`,
      `    <DataGridColumnsMenu label columns />`,
      `  </DataGridToolbar>`,
      ``,
      `  <Table …>…</Table>                ← the grid itself, unchanged`,
      `  <DataGridEmpty>…</DataGridEmpty>  ← role="status", always mounted; only its text is conditional`,
      ``,
      `  <DataGridPagination`,
      `    label previousLabel nextLabel`,
      `    pageLabel rangeLabel            ← both FUNCTIONS of formatted strings`,
      `    pageSizeLabel pageSizes />`,
      `</DataGrid>`,
    ].join("\n"),
    parts: [
      {
        name: "DataGrid",
        description: {
          "fa-IR":
            "پوسته. عمداً landmark نیست و عمداً نامی ندارد: جدولِ درونش از پیش یک grid نام‌دار است و پیچیدنش در یک ناحیهٔ نام‌دار همان مجموعه را دو بار اعلام می‌کند.",
          "en-US":
            "The shell. Deliberately not a landmark and deliberately unnamed: the table inside is already a named grid, and wrapping it in a named region announces the same collection twice.",
        },
      },
      {
        name: "DataGridSearch",
        description: {
          "fa-IR":
            "فیلترِ سراسری. مقدارش را از خودِ انبارهٔ جدول می‌خواند نه از حالتِ خودش، و با هر کلید به صفحهٔ یک برمی‌گردد.",
          "en-US":
            "The global filter. It reads its value from the table's own store rather than from state of its own, and returns to page one on every keystroke.",
        },
      },
      {
        name: "DataGridColumnsMenu",
        description: {
          "fa-IR":
            "فهرستی از menuitemcheckbox — و نه یک Checkbox درونِ MenuItem، که دو کنترل اعلام می‌کند جایی که خواننده یکی دارد. نام ستون‌ها را فراخوان می‌دهد، چون سرستون یک LumoNode است و ممکن است آیکون باشد.",
          "en-US":
            "A list of menuitemcheckbox — not a Checkbox inside a MenuItem, which announces two controls where the reader has one. The caller supplies the column names, because a header is a LumoNode and may be an icon.",
        },
      },
      {
        name: "DataGridPagination",
        description: {
          "fa-IR":
            "خوانشِ بازه، انتخابگرِ تعداد ردیف، و خودِ صفحه‌شمار. تبدیلِ نمایهٔ صفر‌مبنای TanStack به شمارهٔ یک‌مبنای Pagination اینجا یک‌بار انجام می‌شود، نه در هر فراخوان.",
          "en-US":
            "The range read-out, the rows-per-page control and the pager. TanStack's 0-based index is converted to Pagination's 1-based number HERE, once, rather than being a rule every caller remembers.",
        },
      },
      {
        name: "DataGridEmpty",
        description: {
          "fa-IR":
            "وقتی چیزی پیدا نشد. role=\"status\" است چون خالی‌بودن نتیجهٔ آخرین کلیدِ خواننده در جست‌وجوست، و بدون ناحیهٔ زنده جدول بی‌صدا سفید می‌شود.",
          "en-US":
            "Shown when nothing matched. It is a role=\"status\" because emptiness is the RESULT of the reader's last keystroke, and without a live region the table just silently goes blank.",
        },
      },
    ],
  },
  examples: [
    {
      id: "full",
      title: { "fa-IR": "شبکهٔ کامل", "en-US": "The full grid" },
      description: {
        "fa-IR":
          "جست‌وجو کنید و ببینید به صفحهٔ یک برمی‌گردد. «ستون‌ها» را باز کنید و ستون‌ها را پنهان کنید تا آخرین ستونِ نمایان غیرفعال شود. تعداد ردیف را عوض کنید و بشمارید: هر رقمِ پایینِ جدول — بازه، شمارهٔ صفحه‌ها و گزینه‌های خودِ انتخابگر — با ارقام خواننده است.",
        "en-US":
          "Search and watch it return to page one. Open «Columns» and hide them until the last visible one's toggle goes disabled. Change the rows-per-page and count: every figure on that footer — the range, the page numbers and the select's own options — is in the reader's numerals.",
      },
      render: FullExample,
    },
    {
      id: "compact",
      title: { "fa-IR": "کوچک‌تر از یک صفحه", "en-US": "Smaller than one page" },
      description: {
        "fa-IR":
          "با چهار ردیف و ده‌تا در هر صفحه، صفحه‌شمار اصلاً کشیده نمی‌شود — زینتی که هرگز نمی‌تواند کاری بکند بهتر است نباشد — ولی خوانشِ بازه می‌ماند، چون هنوز چیزی برای گفتن دارد. جست‌وجویی بنویسید که به هیچ ردیفی نخورد تا حالتِ خالی اعلام شود.",
        "en-US":
          "With four rows and ten per page the pager is not drawn at all — chrome that can never do anything is better absent — but the range read-out stays, because it still has something to say. Type a search that matches nothing to hear the empty state announce itself.",
      },
      render: CompactExample,
    },
    {
      id: "tree-rows",
      title: { "fa-IR": "ردیف‌های درختی", "en-US": "Tree rows" },
      description: {
        "fa-IR":
          "یک سفارش مادر را باز و بسته کنید. جدول نقش treegrid، سطح هر ردیف و وضعیت بازشدن را اعلام می‌کند؛ تمرکز همچنان برای کل شبکه یک ایستگاه است و پیکانِ سمتِ پایانِ خط ردیف فارسی را باز می‌کند.",
        "en-US":
          "Expand and collapse the parent order. The table exposes treegrid, row level and expansion state; the whole grid still has one Tab stop, and the logical inline-end arrow opens the focused row.",
      },
      render: TreeRowsExample,
    },
    {
      id: "async-pages",
      title: { "fa-IR": "صفحه‌های راه دور", "en-US": "Remote pages" },
      description: {
        "fa-IR":
          "بارگذاری، لغو، جلوگیری از پاسخِ کهنه و ادغامِ صفحه‌ها از همان کنترل‌گرِ مشترکِ ListBox و VirtualList می‌آید. «سفارش‌های بیشتر» را بزنید: ردیف‌های کنونی هنگام دریافت می‌مانند و حالتِ مشغول روی خودِ پوسته اعلام می‌شود.",
        "en-US":
          "Loading, cancellation, stale-result rejection and page merging come from the same controller used by ListBox and VirtualList. Press “Load more orders”: existing rows remain during the request and busy state is announced on the shell itself.",
      },
      render: AsyncRowsExample,
    },
  ],
};
