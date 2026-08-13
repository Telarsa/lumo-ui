import type { Locale } from "@lumo-ui/core";
import { HeatmapChart } from "@lumo-ui/ui";
import type { ComponentExamples } from "./_system/types";

const copy = {
  label: { "fa-IR": "شدت فروش فصلی", "en-US": "Quarterly sales intensity" },
  caption: { "fa-IR": "داده‌های شدت فروش فصلی", "en-US": "Quarterly sales intensity data" },
  quarter: { "fa-IR": "فصل", "en-US": "Quarter" },
  team: { "fa-IR": "تیم", "en-US": "Team" },
  sales: { "fa-IR": "فروش", "en-US": "Sales" },
  spring: { "fa-IR": "بهار", "en-US": "Spring" },
  summer: { "fa-IR": "تابستان", "en-US": "Summer" },
  core: { "fa-IR": "هسته", "en-US": "Core" },
  cloud: { "fa-IR": "ابر", "en-US": "Cloud" },
} as const;

function MatrixExample(l: Locale) {
  return <HeatmapChart locale={l} label={copy.label[l]} dataCaption={copy.caption[l]} xAxisLabel={copy.quarter[l]} yAxisLabel={copy.team[l]} valueLabel={copy.sales[l]} data={[
    { id: "core-spring", x: copy.spring[l], y: copy.core[l], value: 72 },
    { id: "core-summer", x: copy.summer[l], y: copy.core[l], value: 88 },
    { id: "cloud-spring", x: copy.spring[l], y: copy.cloud[l], value: 94 },
    { id: "cloud-summer", x: copy.summer[l], y: copy.cloud[l], value: 63 },
  ]} />;
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    isNew: true,
    tier: "data",
    title: { "fa-IR": "نمودار نقشهٔ گرمایی", "en-US": "Heatmap chart" },
    intro: { "fa-IR": "یک ماتریس برچسب‌دار با رنگ کمّی، محورهای محلی و جدول معنایی کامل در HTML اولیه.", "en-US": "A labelled quantitative-color matrix with localized axes and a complete semantic table in the initial HTML." },
    composition: "<HeatmapChart locale label dataCaption xAxisLabel yAxisLabel valueLabel data />",
    parts: [{ name: "HeatmapChart", description: { "fa-IR": "ماتریس سطح‌بالا؛ هندسه، راهنمای رنگ و جدول دسترس‌پذیر را یکجا نگه می‌دارد.", "en-US": "The high-level matrix that keeps geometry, color legend, and accessible data together." } }],
  },
  examples: [{ id: "matrix", title: { "fa-IR": "شدت فصلی", "en-US": "Quarterly intensity" }, render: MatrixExample }],
};
