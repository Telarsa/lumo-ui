import type { Locale } from "@lumo-ui/core";
import { Filters, createFilter, type FilterField } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

const t = {
  region: { "fa-IR": "فیلترهای سفارش‌ها", "en-US": "Order filters" },
  add: { "fa-IR": "افزودن فیلتر", "en-US": "Add filter" },
  field: { "fa-IR": "فیلد", "en-US": "Field" },
  operator: { "fa-IR": "عملگر", "en-US": "Operator" },
  value: { "fa-IR": "مقدار", "en-US": "Value" },
  remove: { "fa-IR": "حذف فیلتر: {field}", "en-US": "Remove filter: {field}" },
  valueSuggestions: { "fa-IR": "مقدارهای موجود", "en-US": "Available values" },
  dismissSuggestions: { "fa-IR": "بستن پیشنهادها", "en-US": "Dismiss suggestions" },
  removeValue: { "fa-IR": "حذف مقدار: {value}", "en-US": "Remove value: {value}" },
  invalid: { "fa-IR": "برای این فیلتر مقدار انتخاب کنید", "en-US": "Choose a value for this filter" },
  status: { "fa-IR": "وضعیت", "en-US": "Status" },
  title: { "fa-IR": "عنوان", "en-US": "Title" },
  is: { "fa-IR": "برابر است", "en-US": "is" },
  isNot: { "fa-IR": "برابر نیست", "en-US": "is not" },
  contains: { "fa-IR": "شامل است", "en-US": "contains" },
  empty: { "fa-IR": "خالی است", "en-US": "is empty" },
  open: { "fa-IR": "باز", "en-US": "Open" },
  closed: { "fa-IR": "بسته", "en-US": "Closed" },
  titlePlaceholder: { "fa-IR": "عبارت را بنویسید", "en-US": "Enter a phrase" },
} satisfies Record<string, LocalizedText>;

function strings(l: Locale) {
  return {
    regionLabel: t.region[l], addFilter: t.add[l], fieldLabel: t.field[l],
    operatorLabel: t.operator[l], valueLabel: t.value[l],
    removeFilterTemplate: t.remove[l], valueSuggestionsLabel: t.valueSuggestions[l],
    dismissSuggestionsLabel: t.dismissSuggestions[l],
    removeValueTemplate: t.removeValue[l], invalidFilter: t.invalid[l],
  };
}

function fields(l: Locale): readonly FilterField[] {
  return [
    { id: "status", label: t.status[l], type: "select", operators: [
      { id: "is", label: t.is[l] }, { id: "is-not", label: t.isNot[l] },
    ], options: [{ value: "open", label: t.open[l] }, { value: "closed", label: t.closed[l] }] },
    { id: "title", label: t.title[l], type: "text", placeholder: t.titlePlaceholder[l], operators: [
      { id: "contains", label: t.contains[l] }, { id: "empty", label: t.empty[l], requiresValue: false },
    ] },
  ];
}

function ActiveQueryExample(l: Locale) {
  return <Filters fields={fields(l)} strings={strings(l)} defaultValue={[
    createFilter("status", "is", ["open"], "status-open"),
    createFilter("title", "contains", [l === "fa-IR" ? "گزارش" : "report"], "title-report"),
  ]} />;
}

function EmptyBuilderExample(l: Locale) {
  return <Filters fields={fields(l)} strings={strings(l)} />;
}

function NativeFormExample(l: Locale) {
  return <form><Filters fields={fields(l)} strings={strings(l)} name="filters" defaultValue={[
    createFilter("status", "is-not", ["closed"], "not-closed"),
  ]} /></form>;
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "سازندهٔ پرس‌وجوی نوع‌دار فیلد–عملگر–مقدار برای یک فهرست، کنترل‌شده یا ارسال‌شده از راه فرم بومی.",
        "en-US": "A typed field–operator–value query builder for a list, controlled or submitted through a native form.",
      },
      whenNot: {
        "fa-IR": "جعبهٔ جست‌وجو با بندهای ویرایش‌پذیر و نمای ذخیره‌شده — `PowerSearch`. یک عبارت جست‌وجو — `SearchField`. دو تا چهار نمای ثابت — `SegmentedControl`.",
        "en-US": "A search box with editable clauses and saved views — `PowerSearch`. One search term — `SearchField`. Two to four fixed views — `SegmentedControl`.",
      },
    },
    title: { "fa-IR": "فیلترها", "en-US": "Filters" },
    intro: {
      "fa-IR": "سازندهٔ عبارت فیلتر با فیلد، عملگر و مقدارِ نوع‌دار. مدل می‌تواند کنترل‌شده باشد یا به‌صورت JSON در یک فرم بومی ارسال شود.",
      "en-US": "A typed field–operator–value query builder. Its model can be controlled or serialized through a native form.",
    },
    tier: "form", isNew: true,
    composition: `<Filters fields={fields} strings={strings} name="filters" />`,
    parts: [
      { name: "Filters", description: { "fa-IR": "ناحیهٔ نام‌دارِ سازنده که بندها، اعتبارسنجی و ارسال فرم را مالک است.", "en-US": "The named builder region that owns clauses, validation, and form serialization." } },
      { name: "createFilter", description: { "fa-IR": "سازندهٔ یک بند با شناسهٔ پایدار، فیلد، عملگر و مقدارها.", "en-US": "Creates a clause with stable identity, field, operator, and values." } },
    ],
  },
  examples: [
    { id: "active-query", title: { "fa-IR": "پرس‌وجوی فعال", "en-US": "An active query" }, render: ActiveQueryExample },
    { id: "empty-builder", title: { "fa-IR": "شروع از صفر", "en-US": "Start empty" }, render: EmptyBuilderExample },
    { id: "native-form", title: { "fa-IR": "ارسال با فرم", "en-US": "Native form submission" }, render: NativeFormExample },
  ],
};
