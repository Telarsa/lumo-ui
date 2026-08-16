import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import {
  PowerSearch,
  createFilter,
  type PowerSearchField,
  type PowerSearchStrings,
} from "@lumo-ui/ui";
import {
  PowerSearchDataGridIsland,
  type PowerSearchDataGridRow,
} from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

const t = {
  title: { "fa-IR": "جست‌وجوی پیشرفته", "en-US": "Power search" },
  intro: {
    "fa-IR":
      "جست‌وجوی فیلدمحور با بندهای ویرایش‌پذیر، ویرایشگرهای نوع‌دار، نماهای ذخیره‌شده و همان مدل پرس‌وجویی که جدول داده اجرا می‌کند.",
    "en-US":
      "Field-aware search with editable clauses, typed editors, saved views, and the same query model executed by DataGrid.",
  },
  region: { "fa-IR": "جست‌وجوی سفارش‌ها", "en-US": "Search orders" },
  add: { "fa-IR": "افزودن فیلتر", "en-US": "Add a filter" },
  placeholder: { "fa-IR": "نام فیلد را بنویسید", "en-US": "Type a field name" },
  suggestions: { "fa-IR": "فیلدهای سفارش", "en-US": "Order fields" },
  noFields: { "fa-IR": "فیلدی پیدا نشد", "en-US": "No fields found" },
  edit: { "fa-IR": "ویرایش فیلتر: {field}", "en-US": "Edit filter: {field}" },
  remove: { "fa-IR": "حذف فیلتر: {field}", "en-US": "Remove filter: {field}" },
  field: { "fa-IR": "فیلد", "en-US": "Field" },
  operator: { "fa-IR": "عملگر", "en-US": "Operator" },
  value: { "fa-IR": "مقدار", "en-US": "Value" },
  valueSuggestions: { "fa-IR": "مقدارهای موجود", "en-US": "Available values" },
  dismissSuggestions: { "fa-IR": "بستن پیشنهادها", "en-US": "Dismiss suggestions" },
  removeValue: { "fa-IR": "حذف مقدار: {value}", "en-US": "Remove value: {value}" },
  apply: { "fa-IR": "اعمال", "en-US": "Apply" },
  cancel: { "fa-IR": "انصراف", "en-US": "Cancel" },
  invalid: { "fa-IR": "برای این فیلتر مقدار انتخاب کنید", "en-US": "Choose a value for this filter" },
  views: { "fa-IR": "نمای ذخیره‌شده", "en-US": "Saved view" },
  chooseView: { "fa-IR": "انتخاب نما", "en-US": "Choose a view" },
  results: { "fa-IR": "{count} نتیجه", "en-US": "{count} results" },
  overflow: { "fa-IR": "نمایش {count} فیلتر دیگر", "en-US": "Show {count} more filters" },
  collapse: { "fa-IR": "نمایش فیلترهای کمتر", "en-US": "Show fewer filters" },
  token: {
    "fa-IR": "{field}، {operator}، {value}",
    "en-US": "{field}, {operator}, {value}",
  },
  empty: { "fa-IR": "بدون مقدار", "en-US": "No value" },
  valueSeparator: { "fa-IR": "، ", "en-US": ", " },
  groupLabelTemplate: { "fa-IR": "گروه {combinator}", "en-US": "{combinator} group" },
  andLabel: { "fa-IR": "همه", "en-US": "All" },
  orLabel: { "fa-IR": "هرکدام", "en-US": "Any" },
  addGroup: { "fa-IR": "افزودن گروه", "en-US": "Add group" },
  removeGroup: { "fa-IR": "حذف گروه", "en-US": "Remove group" },
  status: { "fa-IR": "وضعیت", "en-US": "Status" },
  total: { "fa-IR": "مبلغ", "en-US": "Total" },
  due: { "fa-IR": "سررسید", "en-US": "Due date" },
  archived: { "fa-IR": "بایگانی", "en-US": "Archived" },
  owner: { "fa-IR": "مالک", "en-US": "Owner" },
  is: { "fa-IR": "برابر است", "en-US": "is" },
  atLeast: { "fa-IR": "حداقل", "en-US": "at least" },
  on: { "fa-IR": "در تاریخ", "en-US": "on" },
  any: { "fa-IR": "یکی از", "en-US": "is any of" },
  emptyOperator: { "fa-IR": "خالی است", "en-US": "is empty" },
  open: { "fa-IR": "باز", "en-US": "Open" },
  closed: { "fa-IR": "بسته", "en-US": "Closed" },
  yes: { "fa-IR": "بله", "en-US": "Yes" },
  no: { "fa-IR": "خیر", "en-US": "No" },
  sara: { "fa-IR": "سارا", "en-US": "Sara" },
  navid: { "fa-IR": "نوید", "en-US": "Navid" },
  openView: { "fa-IR": "سفارش‌های باز", "en-US": "Open orders" },
  reviewView: { "fa-IR": "نیازمند بررسی", "en-US": "Needs review" },
  remoteStatus: { "fa-IR": "نتیجه‌ها به‌روز هستند", "en-US": "Results are up to date" },
  localGrid: { "fa-IR": "اجرای محلی در جدول داده", "en-US": "Local DataGrid execution" },
  remoteGrid: { "fa-IR": "آداپتور راه دورِ لغوشدنی", "en-US": "Abortable remote adapter" },
  gridLabel: { "fa-IR": "نتیجه‌های سفارش", "en-US": "Order results" },
  customer: { "fa-IR": "مشتری", "en-US": "Customer" },
  city: { "fa-IR": "شهر", "en-US": "City" },
  loading: { "fa-IR": "در حال دریافت نتیجه‌ها", "en-US": "Loading results" },
  refreshing: { "fa-IR": "در حال تازه‌سازی نتیجه‌ها", "en-US": "Refreshing results" },
  loadingMore: { "fa-IR": "در حال دریافت نتیجه‌های بیشتر", "en-US": "Loading more results" },
  noResults: { "fa-IR": "نتیجه‌ای پیدا نشد", "en-US": "No results found" },
  retry: { "fa-IR": "تلاش دوباره", "en-US": "Retry" },
  more: { "fa-IR": "نتیجه‌های بیشتر", "en-US": "More results" },
  remoteError: { "fa-IR": "دریافت نتیجه‌ها ناموفق بود", "en-US": "Results could not be loaded" },
  tehran: { "fa-IR": "تهران", "en-US": "Tehran" },
  shiraz: { "fa-IR": "شیراز", "en-US": "Shiraz" },
  tabriz: { "fa-IR": "تبریز", "en-US": "Tabriz" },
  samira: { "fa-IR": "سمیرا", "en-US": "Samira" },
  nima: { "fa-IR": "نیما", "en-US": "Nima" },
  negar: { "fa-IR": "نگار", "en-US": "Negar" },
} satisfies Record<string, LocalizedText>;

function strings(l: Locale): PowerSearchStrings {
  return {
    regionLabel: t.region[l],
    inputLabel: t.add[l],
    inputPlaceholder: t.placeholder[l],
    suggestionsLabel: t.suggestions[l],
    noFields: t.noFields[l],
    editFilterTemplate: t.edit[l],
    removeFilterTemplate: t.remove[l],
    fieldLabel: t.field[l],
    operatorLabel: t.operator[l],
    valueLabel: t.value[l],
    valueSuggestionsLabel: t.valueSuggestions[l],
    dismissSuggestionsLabel: t.dismissSuggestions[l],
    removeValueTemplate: t.removeValue[l],
    apply: t.apply[l],
    cancel: t.cancel[l],
    invalidFilter: t.invalid[l],
    savedViewsLabel: t.views[l],
    savedViewsPlaceholder: t.chooseView[l],
    resultCountTemplate: t.results[l],
    overflowTemplate: t.overflow[l],
    collapseFilters: t.collapse[l],
    tokenTemplate: t.token[l],
    emptyValue: t.empty[l],
    valueSeparator: t.valueSeparator[l],
    groupLabelTemplate: t.groupLabelTemplate[l],
    andLabel: t.andLabel[l],
    orLabel: t.orLabel[l],
    addGroup: t.addGroup[l],
    removeGroup: t.removeGroup[l],
  };
}

function fields(l: Locale): readonly PowerSearchField[] {
  return [
    {
      id: "status",
      label: t.status[l],
      type: "select",
      operators: [
        { id: "is", label: t.is[l] },
        { id: "empty", label: t.emptyOperator[l], requiresValue: false },
      ],
      options: [
        { value: "open", label: t.open[l] },
        { value: "closed", label: t.closed[l] },
      ],
    },
    {
      id: "total",
      label: t.total[l],
      type: "number",
      min: 0,
      step: 10,
      operators: [{ id: "gte", label: t.atLeast[l] }],
    },
    {
      id: "due",
      label: t.due[l],
      type: "date",
      operators: [{ id: "on", label: t.on[l] }],
    },
    {
      id: "archived",
      label: t.archived[l],
      type: "boolean",
      trueLabel: t.yes[l],
      falseLabel: t.no[l],
      operators: [{ id: "is", label: t.is[l] }],
    },
    {
      id: "owner",
      label: t.owner[l],
      type: "multiselect",
      operators: [{ id: "any", label: t.any[l] }],
      options: [
        { value: "sara", label: t.sara[l] },
        { value: "navid", label: t.navid[l] },
      ],
    },
  ];
}

function TypedQueryExample(l: Locale) {
  return (
    <PowerSearch
      fields={fields(l)}
      strings={strings(l)}
      resultCount={new Intl.NumberFormat(l).format(18)}
      defaultValue={[
        createFilter("status", "is", ["open"], "status-open"),
        createFilter("total", "gte", ["250"], "total-250"),
      ]}
    />
  );
}

function SavedViewsExample(l: Locale) {
  return (
    <PowerSearch
      fields={fields(l)}
      strings={strings(l)}
      maxVisibleFilters={2}
      resultCount={new Intl.NumberFormat(l).format(7)}
      status={{ kind: "success", text: t.remoteStatus[l] }}
      savedViews={[
        {
          id: "open",
          label: t.openView[l],
          query: [createFilter("status", "is", ["open"], "view-open")],
        },
        {
          id: "review",
          label: t.reviewView[l],
          query: [
            createFilter("status", "is", ["open"], "view-review-status"),
            createFilter("total", "gte", ["500"], "view-review-total"),
            createFilter("archived", "is", ["false"], "view-review-archive"),
          ],
        },
      ]}
    />
  );
}

function ReadOnlyExample(l: Locale) {
  return (
    <PowerSearch
      fields={fields(l)}
      strings={strings(l)}
      readOnly
      resultCount={new Intl.NumberFormat(l).format(3)}
      defaultValue={[
        createFilter("owner", "any", ["sara", "navid"], "owners"),
        createFilter("due", "on", ["2026-08-13"], "due"),
      ]}
    />
  );
}

function gridFields(l: Locale): readonly PowerSearchField[] {
  return fields(l).filter((field) => field.id === "status" || field.id === "total");
}

function gridRows(l: Locale): readonly PowerSearchDataGridRow[] {
  return [
    { id: "one", name: t.samira[l], city: t.tehran[l], total: 800, status: "open" },
    { id: "two", name: t.nima[l], city: t.shiraz[l], total: 300, status: "closed" },
    { id: "three", name: t.negar[l], city: t.tabriz[l], total: 1_200, status: "open" },
  ];
}

function gridLabels(l: Locale) {
  return {
    gridLabel: t.gridLabel[l],
    nameHeader: t.customer[l],
    cityHeader: t.city[l],
    totalHeader: t.total[l],
    loadingText: t.loading[l],
    refreshingText: t.refreshing[l],
    loadingMoreText: t.loadingMore[l],
    emptyText: t.noResults[l],
    retryLabel: t.retry[l],
    loadMoreLabel: t.more[l],
    errorText: t.remoteError[l],
  };
}

function LocalDataGridExample(l: Locale) {
  return (
    <PowerSearchDataGridIsland
      mode="local"
      locale={l}
      fields={gridFields(l)}
      strings={strings(l)}
      rows={gridRows(l)}
      labels={gridLabels(l)}
      defaultQuery={[createFilter("status", "is", ["open"], "local-open")]}
    />
  );
}

function RemoteDataGridExample(l: Locale) {
  return (
    <PowerSearchDataGridIsland
      mode="remote"
      locale={l}
      fields={gridFields(l)}
      strings={strings(l)}
      rows={gridRows(l)}
      labels={gridLabels(l)}
      defaultQuery={[createFilter("total", "gte", ["500"], "remote-total")]}
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "جست‌وجوی فیلدآگاه: بندهای ویرایش‌پذیر، ویرایشگرهای نوع‌دار، نماهای ذخیره‌شده — همان پرس‌وجویی که `DataGrid` اجرا می‌کند.",
        "en-US": "Field-aware search: editable clauses, typed editors, saved views — the same query `DataGrid` executes.",
      },
      whenNot: {
        "fa-IR": "سازندهٔ ردیف‌های فیلد–عملگر–مقدار در یک فرم — `Filters`. یک عبارت — `SearchField`. کنش‌ها — `Command`.",
        "en-US": "A builder of field–operator–value rows in a form — `Filters`. One term — `SearchField`. Actions — `Command`.",
      },
    },
    title: t.title,
    intro: t.intro,
    tier: "form",
    isNew: true,
    composition: `<PowerSearch fields={fields} strings={strings} value={query} />`,
    parts: [
      {
        name: "PowerSearch",
        description: {
          "fa-IR": "انتخاب‌گر فیلد، بندهای ویرایش‌پذیر و نماهای ذخیره‌شده را روی مدل مشترک پرس‌وجو قرار می‌دهد.",
          "en-US": "Places field typeahead, editable clauses, and saved views over the shared query model.",
        },
      },
    ],
  },
  examples: [
    { id: "typed-query", title: { "fa-IR": "بندهای نوع‌دار", "en-US": "Typed clauses" }, render: TypedQueryExample },
    { id: "saved-views", title: { "fa-IR": "نما و سرریز", "en-US": "Views and overflow" }, render: SavedViewsExample },
    { id: "read-only", title: { "fa-IR": "فقط‌خواندنی", "en-US": "Read only" }, render: ReadOnlyExample },
    { id: "local-data-grid", title: t.localGrid, render: LocalDataGridExample },
    { id: "remote-data-grid", title: t.remoteGrid, render: RemoteDataGridExample },
  ],
};
