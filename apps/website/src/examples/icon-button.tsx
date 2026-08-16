import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { IconButton } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the icon-button page. Contract: `_system/types.ts` — each
 * render is a named top-level function so the loader can slice its source.
 *
 * `IconButton` lives in `packages/ui/src/button.tsx`, so `meta.sourceFile`
 * points the parts list and the source panel at that module rather than at a
 * `icon-button.tsx` that does not exist.
 */

const t = {
  more: { "fa-IR": "گزینه‌های بیشتر", "en-US": "More options" },
  remove: { "fa-IR": "حذف", "en-US": "Remove" },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <div className="flex items-center gap-3">
      <IconButton label={t.more[l]} variant="outline">
        <span aria-hidden="true">⋯</span>
      </IconButton>
      <IconButton label={t.remove[l]} variant="ghost">
        <span aria-hidden="true">×</span>
      </IconButton>
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "دکمه‌ای که فقط آیکون است و نامش ویژگی اجباری: بستن، ویرایش، بیشتر.",
        "en-US": "A button that is only an icon, with its name as a required prop: close, edit, more.",
      },
      whenNot: {
        "fa-IR": "دکمه‌ای با متن دیدنی — `Button`. آیکونی که فشرده می‌ماند — `IconToggle`. آیکون تزئینی در جعبهٔ رنگی — `IconTile`.",
        "en-US": "A button with visible text — `Button`. An icon that stays pressed — `IconToggle`. A decorative icon in a tinted square — `IconTile`.",
      },
    },
    title: { "fa-IR": "دکمهٔ آیکونی", "en-US": "Icon button" },
    intro: {
      "fa-IR": "دکمه‌ای که فقط آیکون دارد. چون آیکون نام نیست، ویژگی label اجباری است و کامپایلر آن را الزام می‌کند.",
      "en-US": "A button whose content is only an icon. Because an icon is not a name, the label prop is required and the compiler enforces it.",
    },
    tier: "form",
    sourceFile: "button.tsx",
    composition: [`<IconButton label="…">`, `  <svg aria-hidden="true" />`, `</IconButton>`].join(
      "\n",
    ),
    parts: [
      {
        name: "IconButton",
        description: {
          "fa-IR": "دکمهٔ فقط‌آیکونی؛ چون آیکون نام نیست، label اجباری است.",
          "en-US": "The icon-only button; label is required because an icon is not a name.",
        },
      },
    ],
  },
  examples: [
    {
      id: "basic",
      title: { "fa-IR": "پایه", "en-US": "Basic" },
      description: {
        "fa-IR": "IconButton نام را به‌صورت ویژگی اجباری می‌گیرد — کامپایلر جای مرورگر الزام می‌کند.",
        "en-US": "IconButton takes its name as a required prop — enforced by the compiler, not the reviewer.",
      },
      render: BasicExample,
    },
  ],
};
