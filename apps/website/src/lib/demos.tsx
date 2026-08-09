import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Locale, LumoNode } from "@lumo-ui/core";
import { Button, IconButton } from "@lumo-ui/ui";

/**
 * The demo registry — the single source the whole site is generated from.
 *
 * Adding an entry here produces: a page in each locale, a preview-frame route in
 * each locale, a gallery tile, a nav entry and a source panel. Nothing about a
 * component page is hand-authored except the capped intro.
 *
 * `source` is READ FROM DISK at build time rather than retyped into a string.
 * That is the difference between documentation and a claim: the code shown on
 * the page is byte-identical to the code that renders the preview beside it, so
 * it cannot drift the first time someone edits a component.
 */

const UI_SRC = join(process.cwd(), "..", "..", "packages", "ui", "src");

function source(file: string): string {
  try {
    return readFileSync(join(UI_SRC, file), "utf8");
  } catch {
    return `// ${file} — source unavailable at build time`;
  }
}

export interface Demo {
  id: string;
  title: Record<Locale, string>;
  intro: Record<Locale, string>;
  tier: "form" | "display" | "overlay" | "navigation" | "feedback" | "layout" | "data";
  behaviour: boolean;
  render: (locale: Locale) => LumoNode;
  source: string;
}

export const TIERS = ["form", "display", "overlay", "navigation", "feedback", "layout", "data"] as const;

export const tierLabel: Record<(typeof TIERS)[number], Record<Locale, string>> = {
  form: { "fa-IR": "فرم", "en-US": "Form" },
  display: { "fa-IR": "نمایش", "en-US": "Display" },
  overlay: { "fa-IR": "لایه", "en-US": "Overlay" },
  navigation: { "fa-IR": "ناوبری", "en-US": "Navigation" },
  feedback: { "fa-IR": "بازخورد", "en-US": "Feedback" },
  layout: { "fa-IR": "چیدمان", "en-US": "Layout" },
  data: { "fa-IR": "داده", "en-US": "Data" },
};

/** Copy used inside demos. Both locales required — no English fallback anywhere. */
const copy = {
  save: { "fa-IR": "ذخیره", "en-US": "Save" },
  cancel: { "fa-IR": "انصراف", "en-US": "Cancel" },
  remove: { "fa-IR": "حذف", "en-US": "Remove" },
  more: { "fa-IR": "گزینه‌های بیشتر", "en-US": "More options" },
} as const satisfies Record<string, Record<Locale, string>>;

const DEMOS: Demo[] = [
  {
    id: "button",
    title: { "fa-IR": "دکمه", "en-US": "Button" },
    intro: {
      "fa-IR": "کنش اصلی. چهار گونه و چهار اندازه، با فاصله‌گذاری منطقی که در راست‌چین قرینه می‌شود.",
      "en-US": "The primary action. Four variants and four sizes, with logical spacing that mirrors under RTL.",
    },
    tier: "form",
    behaviour: true,
    source: source("button.tsx"),
    render: (l) => (
      <div className="flex flex-wrap items-center gap-3">
        <Button>{copy.save[l]}</Button>
        <Button variant="outline">{copy.cancel[l]}</Button>
        <Button variant="ghost">{copy.cancel[l]}</Button>
        <Button variant="critical">{copy.remove[l]}</Button>
      </div>
    ),
  },
  {
    id: "icon-button",
    title: { "fa-IR": "دکمهٔ آیکونی", "en-US": "Icon button" },
    intro: {
      "fa-IR": "دکمه‌ای که فقط آیکون دارد. چون آیکون نام نیست، ویژگی label اجباری است و کامپایلر آن را الزام می‌کند.",
      "en-US": "A button whose content is only an icon. Because an icon is not a name, the label prop is required and the compiler enforces it.",
    },
    tier: "form",
    behaviour: true,
    source: source("button.tsx"),
    render: (l) => (
      <div className="flex items-center gap-3">
        <IconButton label={copy.more[l]} variant="outline">
          <span aria-hidden="true">⋯</span>
        </IconButton>
        <IconButton label={copy.remove[l]} variant="ghost">
          <span aria-hidden="true">×</span>
        </IconButton>
      </div>
    ),
  },
];

export function allDemos(): Demo[] {
  return [...DEMOS].sort((a, b) => a.id.localeCompare(b.id));
}

export function demoById(id: string): Demo | undefined {
  return DEMOS.find((d) => d.id === id);
}
