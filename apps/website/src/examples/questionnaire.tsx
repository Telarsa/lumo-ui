import type { Locale } from "@lumo-ui/core";
import { Questionnaire, type QuestionnaireItem } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

const t = {
  progress: { "fa-IR": "پیشرفت پرسش‌نامه", "en-US": "Questionnaire progress" },
  progressText: { "fa-IR": "پرسش {current} از {total}", "en-US": "Question {current} of {total}" },
  previous: { "fa-IR": "قبلی", "en-US": "Previous" }, next: { "fa-IR": "بعدی", "en-US": "Next" },
  skip: { "fa-IR": "رد کردن", "en-US": "Skip" }, submit: { "fa-IR": "ثبت پاسخ‌ها", "en-US": "Submit answers" },
  scope: { "fa-IR": "دامنهٔ تغییر چیست؟", "en-US": "What is the change scope?" },
  scopeHelp: { "fa-IR": "یک گزینه را انتخاب کنید.", "en-US": "Choose one option." },
  required: { "fa-IR": "یک دامنه انتخاب کنید", "en-US": "Choose a scope" },
  component: { "fa-IR": "فقط کامپوننت", "en-US": "Only the component" },
  feature: { "fa-IR": "کل قابلیت", "en-US": "The complete feature" },
  checks: { "fa-IR": "کدام بررسی‌ها اجرا شوند؟", "en-US": "Which checks should run?" },
  tests: { "fa-IR": "آزمون‌ها", "en-US": "Tests" }, types: { "fa-IR": "بررسی نوع‌ها", "en-US": "Typecheck" },
} satisfies Record<string, LocalizedText>;

function strings(l: Locale) { return {
  progressLabel: t.progress[l], progressTemplate: t.progressText[l], previous: t.previous[l],
  next: t.next[l], skip: t.skip[l], submit: t.submit[l],
}; }

function items(l: Locale): readonly QuestionnaireItem[] { return [
  { id: "scope", title: t.scope[l], description: t.scopeHelp[l], required: true,
    requiredMessage: t.required[l], choices: [
      { value: "component", label: t.component[l], shortcut: "1" },
      { value: "feature", label: t.feature[l], shortcut: "2" },
    ] },
  { id: "checks", title: t.checks[l], multiple: true, allowSkip: true, choices: [
    { value: "tests", label: t.tests[l] }, { value: "types", label: t.types[l] },
  ] },
]; }

function RequiredFlowExample(l: Locale) {
  return <Questionnaire locale={l} items={items(l)} strings={strings(l)} />;
}

function ResumedFlowExample(l: Locale) {
  return <Questionnaire locale={l} items={items(l)} strings={strings(l)} defaultActiveId="checks"
    defaultValue={{ scope: ["feature"], checks: ["tests"] }} />;
}

function SingleQuestionExample(l: Locale) {
  return <Questionnaire locale={l} items={[items(l)[0]!]} strings={strings(l)}
    defaultValue={{ scope: ["component"] }} />;
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    title: { "fa-IR": "پرسش‌نامه", "en-US": "Questionnaire" },
    intro: {
      "fa-IR": "گردشِ پرسش‌به‌پرسش با پاسخ‌های تکی و چندتایی، اعتبارسنجی، ردکردن، پیشرفت، بازگشت و ارسالِ بومی فرم.",
      "en-US": "Question-by-question flow with single and multiple answers, validation, skipping, progress, resuming, and native form data.",
    },
    tier: "form", isNew: true,
    composition: `<Questionnaire locale={locale} items={items} strings={strings} />`,
    parts: [{ name: "Questionnaire", description: {
      "fa-IR": "پاسخ‌ها، پرسش فعال، اعتبارسنجی، پیشرفت، جابه‌جایی و ارسال را مالک است؛ بستن و ذخیره‌سازی بر عهدهٔ میزبان می‌ماند.",
      "en-US": "Owns answers, active item, validation, progress, navigation, and submission; dismissal and persistence stay host-owned.",
    } }],
  },
  examples: [
    { id: "required-flow", title: { "fa-IR": "گردش اجباری", "en-US": "Required flow" }, render: RequiredFlowExample },
    { id: "resume", title: { "fa-IR": "ادامه از پاسخ ذخیره‌شده", "en-US": "Resume saved answers" }, render: ResumedFlowExample },
    { id: "single-question", title: { "fa-IR": "یک پرسش", "en-US": "A single question" }, render: SingleQuestionExample },
  ],
};
