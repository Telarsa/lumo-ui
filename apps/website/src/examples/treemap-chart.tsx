import type { Locale } from "@lumo-ui/core";
import { TreemapChart } from "@lumo-ui/ui";
import type { ComponentExamples } from "./_system/types";

const c = {
  label: { "fa-IR": "سهم محصول", "en-US": "Product share" }, caption: { "fa-IR": "داده‌های سهم محصول", "en-US": "Product share data" },
  parent: { "fa-IR": "والد", "en-US": "Parent" }, value: { "fa-IR": "سهم", "en-US": "Share" },
  root: { "fa-IR": "محصول", "en-US": "Product" }, ui: { "fa-IR": "رابط", "en-US": "Interface" }, data: { "fa-IR": "داده", "en-US": "Data" }, tools: { "fa-IR": "ابزار", "en-US": "Tools" },
} as const;
function ShareExample(l: Locale) { return <TreemapChart locale={l} label={c.label[l]} dataCaption={c.caption[l]} parentLabel={c.parent[l]} valueLabel={c.value[l]} data={[
  { id: "root", parentId: null, label: c.root[l], value: 0 }, { id: "ui", parentId: "root", label: c.ui[l], value: 52 }, { id: "data", parentId: "root", label: c.data[l], value: 31 }, { id: "tools", parentId: "root", label: c.tools[l], value: 17 },
]} />; }
export const EXAMPLES: ComponentExamples = { meta: { isNew: true, tier: "data", title: { "fa-IR": "نمودار درختی", "en-US": "Treemap chart" }, intro: { "fa-IR": "سلسله‌مراتب را به مساحت تبدیل می‌کند، بدون تغییر دادن ردیف‌های ورودی.", "en-US": "Turns hierarchy into proportional area without mutating the authored rows." }, composition: "<TreemapChart locale label dataCaption parentLabel valueLabel data />", parts: [{ name: "TreemapChart", description: { "fa-IR": "چیدمان سلسله‌مراتبی پاسخ‌گو با برچسب‌های درون سلول.", "en-US": "A responsive hierarchical layout with fitted in-cell labels." } }] }, examples: [{ id: "share", title: { "fa-IR": "ترکیب محصول", "en-US": "Product composition" }, render: ShareExample }] };
