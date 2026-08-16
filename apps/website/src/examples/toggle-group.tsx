import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { AlignCenter, AlignJustify, AlignRight, Bold, Italic, Underline } from "lucide-react";
import { ToggleButton, ToggleButtonGroup } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the toggle-group page. Contract: `_system/types.ts` —
 * each render is a named top-level function so the loader can slice its source.
 *
 * A server module: every prop below is a string, so the group, every
 * `aria-pressed` and the pre-hydration tab stop are in the served bytes.
 *
 * ── THE ONE THING THAT GOT WORSE, STATED ON THE PAGE RATHER THAN BURIED ─────
 *
 * Under the previous engine a single-selection toggle group emitted
 * `role="radiogroup"` with `role="radio"` children. This engine emits
 * `role="group"` and leaves every child an `aria-pressed` button, in single AND
 * multiple mode alike, with no prop that changes it. Passing `role="radiogroup"`
 * from outside would be WORSE than the gap: `aria-pressed` on a `role="radio"`
 * is an invalid combination and the children have no `aria-checked` to supply
 * instead.
 *
 * So this component keeps the engine's semantics — a toggle GROUP genuinely is a
 * group of toggles, and multiple selection was always its main mode — and
 * `segmented-control.tsx` was moved onto the radio group instead, because there
 * the radio semantics are the entire reason the component exists. **If you want
 * "exactly one of these", that is the component to reach for.**
 *
 * ── AND THE MOST DANGEROUS RENAME IN THE WHOLE MIGRATION LIVES HERE ─────────
 *
 * The two engines spend the SAME WORD on OPPOSITE states: the previous one
 * called the persistent ON state `data-selected` and the transient pointer-down
 * `data-pressed`; this one calls the persistent ON state `data-pressed` and has
 * no attribute at all for pointer-down. Every other rename in the migration
 * fails loudly — the selector stops matching and the style disappears. This one
 * fails QUIETLY in both directions: left alone the ON state never paints, and
 * "fixed" with the old meaning in mind you get a control that flashes under the
 * finger and forgets, which reviews as working.
 */

const t = {
  formatting: { "fa-IR": "قالب‌بندی متن", "en-US": "Text formatting" },
  bold: { "fa-IR": "پررنگ", "en-US": "Bold" },
  italic: { "fa-IR": "کج", "en-US": "Italic" },
  underline: { "fa-IR": "زیرخط‌دار", "en-US": "Underlined" },

  resultView: { "fa-IR": "نمای نتایج", "en-US": "Results view" },
  listView: { "fa-IR": "فهرست", "en-US": "List" },
  gridView: { "fa-IR": "شبکه", "en-US": "Grid" },
  boardView: { "fa-IR": "تخته", "en-US": "Board" },

  alignment: { "fa-IR": "تراز پاراگراف", "en-US": "Paragraph alignment" },
  alignStart: { "fa-IR": "تراز از ابتدای خط", "en-US": "Align to the start of the line" },
  alignCenter: { "fa-IR": "تراز وسط", "en-US": "Align centre" },
  alignJustify: { "fa-IR": "تراز از دو طرف", "en-US": "Justify" },

  panels: { "fa-IR": "پنل‌های باز", "en-US": "Open panels" },
  outline: { "fa-IR": "فهرست مطالب", "en-US": "Outline" },
  comments: { "fa-IR": "دیدگاه‌ها", "en-US": "Comments" },
  history: { "fa-IR": "تاریخچهٔ ویرایش", "en-US": "Edit history" },
} satisfies Record<string, LocalizedText>;

function MultipleExample(l: Locale) {
  return (
    <ToggleButtonGroup
      selectionMode="multiple"
      aria-label={t.formatting[l]}
      defaultSelectedKeys={["bold", "underline"]}
    >
      <ToggleButton id="bold">{t.bold[l]}</ToggleButton>
      <ToggleButton id="italic">{t.italic[l]}</ToggleButton>
      <ToggleButton id="underline">{t.underline[l]}</ToggleButton>
    </ToggleButtonGroup>
  );
}

function SingleExample(l: Locale) {
  return (
    <ToggleButtonGroup
      selectionMode="single"
      aria-label={t.resultView[l]}
      defaultSelectedKeys={["grid"]}
      disallowEmptySelection
    >
      <ToggleButton id="list">{t.listView[l]}</ToggleButton>
      <ToggleButton id="grid">{t.gridView[l]}</ToggleButton>
      <ToggleButton id="board">{t.boardView[l]}</ToggleButton>
    </ToggleButtonGroup>
  );
}

function IconsExample(l: Locale) {
  return (
    <ToggleButtonGroup
      selectionMode="single"
      aria-label={t.alignment[l]}
      defaultSelectedKeys={["start"]}
      disallowEmptySelection
    >
      <ToggleButton id="start" size="sm" aria-label={t.alignStart[l]}>
        <AlignRight aria-hidden="true" />
      </ToggleButton>
      <ToggleButton id="centre" size="sm" aria-label={t.alignCenter[l]}>
        <AlignCenter aria-hidden="true" />
      </ToggleButton>
      <ToggleButton id="justify" size="sm" aria-label={t.alignJustify[l]}>
        <AlignJustify aria-hidden="true" />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

function VerticalExample(l: Locale) {
  return (
    <ToggleButtonGroup
      selectionMode="multiple"
      orientation="vertical"
      aria-label={t.panels[l]}
      defaultSelectedKeys={["outline"]}
    >
      <ToggleButton id="outline">{t.outline[l]}</ToggleButton>
      <ToggleButton id="comments">{t.comments[l]}</ToggleButton>
      <ToggleButton id="history">{t.history[l]}</ToggleButton>
    </ToggleButtonGroup>
  );
}

function StandaloneExample(l: Locale) {
  return (
    <div className="flex items-center gap-2">
      <ToggleButton defaultSelected aria-label={t.bold[l]}>
        <Bold aria-hidden="true" />
      </ToggleButton>
      <ToggleButton aria-label={t.italic[l]}>
        <Italic aria-hidden="true" />
      </ToggleButton>
      <ToggleButton aria-label={t.underline[l]}>
        <Underline aria-hidden="true" />
      </ToggleButton>
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "نواری از دکمه‌ها که هرکدام روشن یا خاموش‌اند، تکی یا چندتایی: ضخیم/مورب/زیرخط، ترازبندی.",
        "en-US": "A strip of buttons that are each on or off, single or multiple: bold/italic/underline, alignment.",
      },
      whenNot: {
        "fa-IR": "دقیقاً یکی از دو تا چهار، هرگز هیچ‌کدام — `SegmentedControl`. فشارهای جداگانه — `ButtonGroup`. یک دکمهٔ تنها — `Toggle`. یک تنظیم — `Switch`.",
        "en-US": "Exactly one of two to four, never none — `SegmentedControl`. Separate presses — `ButtonGroup`. One button on its own — `Toggle`. A setting — `Switch`.",
      },
    },
    tier: "form",
    title: { "fa-IR": "گروه دکمهٔ حالتی", "en-US": "Toggle group" },
    intro: {
      "fa-IR":
        "نواری از دکمه‌هایی که هرکدام روشن یا خاموش‌اند. گِردیِ گوشه‌ها به گروه سپرده شده و نه به اولین و آخرین فرزند: قاعدهٔ رایج در فارسی دو گوشهٔ اشتباه را گِرد می‌کند، و شکلِ منطقی‌اش هم فقط برای نوارِ افقی درست است — گروه را عمودی کنید و دوباره دو گوشهٔ اشتباه گِرد می‌شوند. یک گِردیِ یکنواخت روی ظرف به‌علاوهٔ برشِ سرریز در هر دو جهت و هر دو راستا درست می‌ماند. خطهای جداکننده هم روی لبهٔ شروعِ خواندنِ هر دکمه‌اند، پس در فارسی سمت راستِ هر دکمه می‌افتند.",
      "en-US":
        "A strip of buttons that are each on or off. The corner radius belongs to the GROUP rather than to the first and last child: the usual rule rounds the wrong two corners in Persian, and even its logical spelling is right only for a horizontal strip — rotate the group and it rounds the wrong two again. One uniform radius on the container plus a clip is correct in both directions AND both orientations. The dividers sit on each button's reading-start edge, so in Persian they fall to its right.",
    },
    composition: [
      `<ToggleButtonGroup`,
      `  selectionMode="single" | "multiple"   ← does NOT change the group's role`,
      `  aria-label                            ← names the group`,
      `  defaultSelectedKeys selectedKeys onSelectionChange`,
      `  disallowEmptySelection                ← honoured by cancelling the un-press`,
      `  orientation isDisabled>`,
      ``,
      `  <ToggleButton id size aria-label isDisabled>…</ToggleButton>`,
      `</ToggleButtonGroup>`,
    ].join("\n"),
    parts: [
      {
        name: "ToggleButtonGroup",
        description: {
          "fa-IR":
            "خودِ گروه. selectionMode روی «چند» نگاشت می‌شود ولی نقشِ گروه را عوض نمی‌کند — سرآیندِ همین پرونده می‌گوید آن باخت کجاست و چرا وردکردنش از خودِ شکاف بدتر بود. ایستِ تبی هم پیش از هیدراسیون به اولین دکمهٔ فشرده داده می‌شود، وگرنه هیچ‌جای نوار tabindex صفر ندارد.",
          "en-US":
            "The group itself. `selectionMode` maps onto the engine's multiple flag but does not change the group's ROLE — this file's header says where that loss is and why overriding it would be worse than the gap. The pre-hydration tab stop is given to the first pressed button, without which nothing in the strip carries a zero tabindex.",
        },
      },
      {
        name: "ToggleButton",
        description: {
          "fa-IR":
            "یک دکمه، که مستقل هم کار می‌کند. id همیشه کلیدِ انتخاب است و هرگز به دام نمی‌رسد — این یک تغییرِ اِی‌پی‌آی است و نوشته شده: پیش‌تر همین ویژگی بیرون از گروه شناسهٔ دام بود. نام‌گذاری با aria-label انجام می‌شود.",
          "en-US":
            "One button, usable standalone as well. `id` is ALWAYS the selection key and never reaches the DOM — a recorded API change: the same prop used to be a DOM id outside a group. Naming goes through `aria-label`.",
        },
      },
      {
        name: "toggleButtonVariants",
        description: {
          "fa-IR":
            "شکلِ یک دکمه. حالتِ روشن از data-pressed خوانده می‌شود، که دقیقاً واژه‌ای است که موتور قبلی برای حالتِ گذرای فشردنِ انگشت به کار می‌برد — خطرناک‌ترین تغییرِ نامِ کلِ مهاجرت، چون در هر دو جهت بی‌صدا شکست می‌خورد. از پرونده‌ای بدون «use client» می‌آید (toggle-group.variants.ts)، پس یک مؤلفهٔ سروری هم می‌تواند صدایش کند.",
          "en-US":
            "One button's shape. The ON state is read from `data-pressed`, which is exactly the word the previous engine spent on the TRANSIENT pointer-down state — the most dangerous rename in the whole migration, because it fails quietly in both directions. It comes from a directive-free module (`toggle-group.variants.ts`), so a server component can call it.",
        },
      },
      {
        name: "toggleButtonGroupVariants",
        description: {
          "fa-IR":
            "نوار. جداکننده‌ها با حاشیهٔ لبهٔ شروعِ درون‌خطی کشیده می‌شوند، پس خط بین دکمه‌ها به ترتیبِ خواندن می‌افتد؛ شکلِ فیزیکی‌اش در فارسی یک خط بیرونِ اولین دکمه می‌گذارد و پیش از آخرین هیچ.",
          "en-US":
            "The strip. The dividers are drawn with an inline-start border, so the rule falls between items in READING order; the physical spelling puts one hairline outside the first item in Persian and none before the last.",
        },
      },
    ],
  },
  examples: [
    {
      id: "multiple",
      title: { "fa-IR": "چند انتخاب — حالتِ اصلی", "en-US": "Multiple selection — the main mode" },
      description: {
        "fa-IR":
          "هر دکمه مستقل روشن و خاموش می‌شود و aria-pressed همین را می‌گوید. اینجا نقشِ «گروه» درست است: سه ویژگیِ ناوابسته‌اند و انتخابِ یکی هیچ‌کدامِ دیگر را برنمی‌دارد.",
        "en-US":
          "Each button turns on and off independently and `aria-pressed` says exactly that. Here the group role is CORRECT: these are three independent properties and choosing one un-chooses nothing.",
      },
      render: MultipleExample,
    },
    {
      id: "single",
      title: { "fa-IR": "یک انتخاب، و باختی که پنهان نشده", "en-US": "Single selection, and an unhidden loss" },
      description: {
        "fa-IR":
          "این کار می‌کند و به گوش درست اعلام نمی‌شود: سه دکمه با aria-pressed مثل سه کلیدِ مستقل شنیده می‌شوند و هیچ‌چیز نمی‌گوید انتخابِ یکی دیگری را برمی‌دارد. برای «دقیقاً یکی از این‌ها» سراغ کنترل بخش‌بندی‌شده بروید. disallowEmptySelection ولی واقعاً محترم شمرده می‌شود — با لغوکردنِ رویدادِ خالی‌شدن، نه با نگه‌داشتنِ نسخهٔ دومی از انتخاب.",
        "en-US":
          "This works and is announced wrongly: three `aria-pressed` buttons are heard as three independent switches, with nothing saying that choosing one un-chooses the others. For «exactly one of these», reach for the segmented control. `disallowEmptySelection` IS honoured, though — by cancelling the emptying event rather than by keeping a second copy of the selection.",
      },
      render: SingleExample,
    },
    {
      id: "icon-only",
      title: { "fa-IR": "دکمه‌های آیکونی", "en-US": "Icon-only buttons" },
      description: {
        "fa-IR":
          "هیچ کلاسِ جداگانه‌ای برای دکمهٔ آیکونی وجود ندارد و هیچ جزءِ دومی هم: aria-label همان ویژگی‌ای است که دکمهٔ آیکونیِ خودِ کتابخانه اجباری‌اش می‌کند، و اختراعِ املای دومی برای همان چیز فقط اجازه می‌داد دو تا از هم دور بیفتند. آیکونِ تراز از ابتدای خط عمداً به راست اشاره می‌کند: «ابتدا» در فارسی راست است.",
        "en-US":
          "There is no separate class for an icon toggle and no second component either: `aria-label` is the same prop the library's own icon button makes required, and inventing a second spelling of it would only let the two drift. The start-alignment icon deliberately points right: «start» is the right in Persian.",
      },
      render: IconsExample,
    },
    {
      id: "vertical",
      title: { "fa-IR": "عمودی", "en-US": "Vertical" },
      description: {
        "fa-IR":
          "همان گروه، چرخیده. تنها چیزی که در سی‌اس‌اس عوض می‌شود محورِ جداکننده‌هاست، چون گِردی از اول به ظرف سپرده شده بود: با قاعدهٔ فرزندِ اول و آخر، همین چرخش دو گوشهٔ اشتباه را گِرد می‌کرد.",
        "en-US":
          "The same group, rotated. The only thing that changes in CSS is the dividers' axis, because the radius was given to the container from the start: with a first-and-last-child rule, this very rotation would round the wrong two corners.",
      },
      render: VerticalExample,
    },
    {
      id: "standalone",
      title: { "fa-IR": "تک‌تک، بدون گروه", "en-US": "Standalone, with no group" },
      description: {
        "fa-IR":
          "دکمهٔ حالتی بیرون از گروه هم کار می‌کند و حالتِ خودش را نگه می‌دارد. تفاوتش در فوکوس است: دکمهٔ تنها خودش یک ایست تبی است و tabindex صفر را همان بایتِ اول می‌فرستد، در حالی که همان دکمه درون گروه منفی‌یک می‌فرستد و مرکب مالکِ تنها ایست می‌شود.",
        "en-US":
          "A toggle works outside a group and keeps its own state. The difference is FOCUS: a standalone toggle is its own tab stop and serves a zero tabindex in the first byte, while the same toggle inside a group serves minus one and the composite owns the single stop.",
      },
      render: StandaloneExample,
    },
  ],
};
