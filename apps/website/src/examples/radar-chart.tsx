import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { RadarChart } from "@lumo-ui/ui";
import type { ComponentExamples } from "./_system/types";

const c = {
  label: { "fa-IR": "نمایهٔ قابلیت محصول", "en-US": "Product capability profile" },
  caption: { "fa-IR": "داده‌های قابلیت محصول", "en-US": "Product capability data" },
  dimension: { "fa-IR": "قابلیت", "en-US": "Capability" },
  lumo: { "fa-IR": "لومو", "en-US": "Lumo" },
  peer: { "fa-IR": "رقیب", "en-US": "Peer" },
  access: { "fa-IR": "دسترسی‌پذیری", "en-US": "Accessibility" },
  rtl: { "fa-IR": "راست‌به‌چپ", "en-US": "RTL" },
  ssr: { "fa-IR": "رندر سرور", "en-US": "SSR" },
} as const;

function ProfileExample(l: Locale) {
  return <RadarChart locale={l} label={c.label[l]} dataCaption={c.caption[l]} dimensionLabel={c.dimension[l]} maxValue={100} series={[
    { key: "lumo", label: c.lumo[l], color: "var(--color-accent)" },
    { key: "peer", label: c.peer[l], color: "var(--color-info)" },
  ]} data={[
    { dimension: c.access[l], lumo: 96, peer: 74 },
    { dimension: c.rtl[l], lumo: 99, peer: 61 },
    { dimension: c.ssr[l], lumo: 95, peer: 68 },
  ]} />;
}

export const EXAMPLES: ComponentExamples = {
  meta: { usage: { when: { "fa-IR": "مقایسهٔ نیم‌رخ‌ها روی مجموعه‌ای ثابت از محورها: مهارت‌ها، امتیازها، پوشش قابلیت‌ها.", "en-US": "Comparing profiles over a fixed set of axes: skills, scores, feature coverage." }, whenNot: { "fa-IR": "مقدارها در گذر زمان — `ChartContainer`. ماتریس — `HeatmapChart`. فقط اعداد — `Table`.", "en-US": "Values over time — `ChartContainer`. A matrix — `HeatmapChart`. Just numbers — `Table`." } }, isNew: true, tier: "data", title: { "fa-IR": "نمودار راداری", "en-US": "Radar chart" }, intro: { "fa-IR": "مقایسهٔ چند نمایه روی دامنه‌ای صریح؛ هر مقدار در جدول سرورشده هم می‌آید.", "en-US": "Compare profiles over an explicit domain; every value also appears in the server-rendered table." }, composition: "<RadarChart locale label dataCaption dimensionLabel maxValue series data />", parts: [{ name: "RadarChart", description: { "fa-IR": "نمایهٔ قطبی سطح‌بالا با چند سری و راهنمای مشترک.", "en-US": "A high-level polar profile with multiple series and one shared legend." } }] },
  examples: [{ id: "profile", title: { "fa-IR": "نمایهٔ مقایسه‌ای", "en-US": "Comparative profile" }, render: ProfileExample }],
};
