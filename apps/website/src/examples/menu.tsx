import type { Locale } from "@lumo-ui/core";
import { MenuChoiceIsland } from "@/components/demo-islands";
import {
  Button,
  Kbd,
  Menu,
  MenuItem,
  MenuPopover,
  MenuSection,
  MenuSeparator,
  MenuTrigger,
  SubmenuTrigger,
} from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the menu page. Contract: `_system/types.ts` — each
 * render is a named top-level function so the loader can slice its source.
 *
 * Like every overlay, the first byte holds the trigger; the popover exists
 * only after it opens (demos.tsx's header records why).
 */

const t = {
  actions: { "fa-IR": "کنش‌ها", "en-US": "Actions" },
  duplicate: { "fa-IR": "تکثیر", "en-US": "Duplicate" },
  rename: { "fa-IR": "تغییر نام", "en-US": "Rename" },
  remove: { "fa-IR": "حذف", "en-US": "Remove" },
  editSection: { "fa-IR": "ویرایش", "en-US": "Edit" },
  dangerSection: { "fa-IR": "ناحیهٔ خطر", "en-US": "Danger zone" },
  share: { "fa-IR": "هم‌رسانی", "en-US": "Share" },
  viaEmail: { "fa-IR": "با ایمیل", "en-US": "Via email" },
  copyLink: { "fa-IR": "کپی پیوند", "en-US": "Copy the link" },
  exportPdf: { "fa-IR": "خروجی پی‌دی‌اف", "en-US": "Export as PDF" },
  save: { "fa-IR": "ذخیره", "en-US": "Save" },
  print: { "fa-IR": "چاپ", "en-US": "Print" },
  publish: { "fa-IR": "انتشار", "en-US": "Publish" },
  awaitingReview: { "fa-IR": "در انتظار بازبینی", "en-US": "Awaiting review" },
  view: { "fa-IR": "نمایش", "en-US": "View" },
  sortBy: { "fa-IR": "ترتیب نمایش", "en-US": "Sort order" },
  newest: { "fa-IR": "جدیدترین", "en-US": "Newest first" },
  oldest: { "fa-IR": "قدیمی‌ترین", "en-US": "Oldest first" },
  byName: { "fa-IR": "بر پایهٔ نام", "en-US": "By name" },
  columns: { "fa-IR": "ستون‌ها", "en-US": "Columns" },
  columnDate: { "fa-IR": "تاریخ", "en-US": "Date" },
  columnOwner: { "fa-IR": "مالک", "en-US": "Owner" },
  columnSize: { "fa-IR": "اندازه", "en-US": "Size" },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <MenuTrigger>
      <Button variant="outline">{t.actions[l]}</Button>
      <MenuPopover>
        <Menu>
          <MenuItem id="duplicate">{t.duplicate[l]}</MenuItem>
          <MenuItem id="rename">{t.rename[l]}</MenuItem>
          <MenuItem id="remove">{t.remove[l]}</MenuItem>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  );
}

function SectionsExample(l: Locale) {
  return (
    <MenuTrigger>
      <Button variant="outline">{t.actions[l]}</Button>
      <MenuPopover>
        <Menu>
          <MenuSection title={t.editSection[l]}>
            <MenuItem id="duplicate">{t.duplicate[l]}</MenuItem>
            <MenuItem id="rename">{t.rename[l]}</MenuItem>
          </MenuSection>
          <MenuSeparator />
          <MenuSection title={t.dangerSection[l]}>
            <MenuItem id="remove">{t.remove[l]}</MenuItem>
          </MenuSection>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  );
}

function SubmenuExample(l: Locale) {
  return (
    <MenuTrigger>
      <Button variant="outline">{t.actions[l]}</Button>
      <MenuPopover>
        <Menu>
          <MenuItem id="duplicate">{t.duplicate[l]}</MenuItem>
          <SubmenuTrigger>
            <MenuItem id="share">{t.share[l]}</MenuItem>
            <MenuPopover>
              <Menu>
                <MenuItem id="email">{t.viaEmail[l]}</MenuItem>
                <MenuItem id="link">{t.copyLink[l]}</MenuItem>
                <MenuItem id="pdf">{t.exportPdf[l]}</MenuItem>
              </Menu>
            </MenuPopover>
          </SubmenuTrigger>
          <MenuSeparator />
          <MenuItem id="remove">{t.remove[l]}</MenuItem>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  );
}

function ShortcutsExample(l: Locale) {
  return (
    <MenuTrigger>
      <Button variant="outline">{t.actions[l]}</Button>
      <MenuPopover>
        <Menu>
          <MenuItem id="save" textValue={t.save[l]}>
            <span className="flex w-full items-center justify-between gap-6">
              {t.save[l]}
              <Kbd keys={["Ctrl", "S"]} />
            </span>
          </MenuItem>
          <MenuItem id="print" textValue={t.print[l]}>
            <span className="flex w-full items-center justify-between gap-6">
              {t.print[l]}
              <Kbd keys={["Ctrl", "P"]} />
            </span>
          </MenuItem>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  );
}

function DisabledItemExample(l: Locale) {
  return (
    <MenuTrigger>
      <Button variant="outline">{t.actions[l]}</Button>
      <MenuPopover>
        <Menu>
          <MenuItem id="duplicate">{t.duplicate[l]}</MenuItem>
          <MenuItem id="publish" isDisabled textValue={t.publish[l]}>
            <span className="flex w-full items-center justify-between gap-6">
              {t.publish[l]}
              <span className="text-xs text-fg-subtle">{t.awaitingReview[l]}</span>
            </span>
          </MenuItem>
          <MenuItem id="remove">{t.remove[l]}</MenuItem>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  );
}

/**
 * The two selectable item kinds together, because telling them apart is the
 * lesson. Both are controlled-only, so the state lives in an island.
 */
function SelectionExample(l: Locale) {
  return (
    <MenuChoiceIsland
      menuLabel={t.view[l]}
      triggerText={t.view[l]}
      sortLabel={t.sortBy[l]}
      sortOptions={[
        { value: "newest", text: t.newest[l] },
        { value: "oldest", text: t.oldest[l] },
        { value: "name", text: t.byName[l] },
      ]}
      columnsLabel={t.columns[l]}
      columns={[
        { value: "date", text: t.columnDate[l] },
        { value: "owner", text: t.columnOwner[l] },
        { value: "size", text: t.columnSize[l] },
      ]}
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    composition: [
      `<MenuTrigger>`,
      `  <Button>…</Button>`,
      `  <MenuPopover>`,
      `    <Menu>`,
      `      <MenuSection title="…">`,
      `        <MenuItem id="…">…</MenuItem>`,
      `      </MenuSection>`,
      `      <MenuSeparator />`,
      `      <MenuRadioGroup label="…" value="…">`,
      `        <MenuRadioItem value="…">…</MenuRadioItem>`,
      `      </MenuRadioGroup>`,
      `      <MenuCheckboxItem isSelected>…</MenuCheckboxItem>`,
      `      <SubmenuTrigger>`,
      `        <MenuItem id="…">…</MenuItem>`,
      `        <MenuPopover>`,
      `          <Menu>…</Menu>`,
      `        </MenuPopover>`,
      `      </SubmenuTrigger>`,
      `    </Menu>`,
      `  </MenuPopover>`,
      `</MenuTrigger>`,
    ].join("\n"),
    parts: [
      {
        name: "MenuTrigger",
        description: {
          "fa-IR": "جفت‌کنندهٔ دکمه و منو؛ باز و بسته شدن را مدیریت می‌کند.",
          "en-US": "Pairs the button with the menu and owns the open state.",
        },
      },
      {
        name: "MenuPopover",
        description: {
          "fa-IR": "لایهٔ شناور منو با جای‌گیری منطقی.",
          "en-US": "The menu's floating layer, logically placed.",
        },
      },
      {
        name: "Menu",
        description: {
          "fa-IR": "خود فهرست؛ ناوبری پیکانی و تایپ‌یاب فارسی را موتور بیس‌یوآی می‌دهد.",
          "en-US": "The list itself; arrow navigation and Persian typeahead come from the Base UI engine.",
        },
      },
      {
        name: "MenuItem",
        description: {
          "fa-IR": "یک کنش؛ فرزند غیررشته‌ای textValue می‌خواهد تا تایپ‌یاب نشکند.",
          "en-US": "One action; non-string children need a textValue so typeahead keeps working.",
        },
      },
      {
        name: "MenuSection",
        description: {
          "fa-IR": "گروه عنوان‌دار؛ عنوان از راه Header به aria-labelledby گروه وصل می‌شود.",
          "en-US": "A titled group; the title wires into the group's aria-labelledby through Header.",
        },
      },
      {
        name: "MenuSeparator",
        description: {
          "fa-IR": "جداکنندهٔ میان گروه‌ها.",
          "en-US": "The rule between groups.",
        },
      },
      {
        name: "MenuRadioGroup",
        description: {
          "fa-IR":
            "«یکی از این‌ها»؛ نامش الزامی است چون گزینه‌ها به‌تنهایی نمی‌گویند پاسخ کدام پرسش‌اند.",
          "en-US":
            "The one-of-these group; its name is required because the options alone never say which question they answer.",
        },
      },
      {
        name: "MenuRadioItem",
        description: {
          "fa-IR": "یک انتخاب انحصاری با نقش menuitemradio؛ نشانگرش عنصر است، نه شبه‌عنصر.",
          "en-US":
            "One exclusive choice with role menuitemradio; its indicator is an element, not a pseudo-element.",
        },
      },
      {
        name: "MenuCheckboxItem",
        description: {
          "fa-IR": "کلید دو‌حالته درون منو با نقش menuitemcheckbox؛ فقط کنترل‌شده.",
          "en-US": "A toggle inside the menu with role menuitemcheckbox; controlled only.",
        },
      },
      {
        name: "SubmenuTrigger",
        description: {
          "fa-IR": "زیرمنو؛ پیکانش نویسهٔ قرینه‌شونده است و در فارسی خودش برمی‌گردد.",
          "en-US": "The submenu; its arrow is a bidi-mirrored character that flips itself in Persian.",
        },
      },
    ],
  },
  examples: [
    {
      id: "basic",
      title: { "fa-IR": "پایه", "en-US": "Basic" },
      description: {
        "fa-IR": "سه کنش پشت یک دکمه؛ منو با پیکان و تایپ‌یاب فارسی ناوبری می‌شود.",
        "en-US": "Three actions behind one button; the menu navigates by arrows and Persian typeahead.",
      },
      render: BasicExample,
    },
    {
      id: "sections",
      title: { "fa-IR": "بخش‌ها", "en-US": "Sections" },
      description: {
        "fa-IR": "گروه‌های عنوان‌دار با جداکننده؛ عنوان گروه واقعاً به گروه وصل است، نه فقط بالای آن.",
        "en-US": "Titled groups with separators; the title is truly wired to the group, not just above it.",
      },
      render: SectionsExample,
    },
    {
      id: "submenu",
      title: { "fa-IR": "زیرمنو", "en-US": "Submenu" },
      description: {
        "fa-IR": "زیرمنو در فارسی از سمت درست باز می‌شود و پیکانش قرینه است.",
        "en-US": "The submenu opens from the correct side in Persian, and its arrow mirrors.",
      },
      render: SubmenuExample,
    },
    {
      id: "shortcuts",
      title: { "fa-IR": "میان‌برها", "en-US": "Shortcuts" },
      description: {
        "fa-IR": "میان‌بر با Kbd در لبهٔ پایانی؛ چون فرزند دیگر رشته نیست، textValue آمده است.",
        "en-US": "The shortcut sits at the inline end via Kbd; children are no longer a string, so textValue appears.",
      },
      render: ShortcutsExample,
    },
    {
      id: "selection",
      title: { "fa-IR": "انتخاب در منو", "en-US": "Selection in a menu" },
      description: {
        "fa-IR":
          "بالا یک پرسش با یک پاسخ، پایین چند کلید مستقل؛ هر دو یک تورفتگی دارند و دو چیز متفاوت اعلام می‌کنند.",
        "en-US":
          "One question with one answer above, independent switches below; the two share an inset and announce different things.",
      },
      render: SelectionExample,
    },
    {
      id: "disabled-item",
      title: { "fa-IR": "گزینهٔ غیرفعال", "en-US": "Disabled item" },
      description: {
        "fa-IR": "کنش غیرفعال در فهرست می‌ماند و دلیلش را کنار خودش می‌گوید.",
        "en-US": "A disabled action stays listed and states its reason beside itself.",
      },
      render: DisabledItemExample,
    },
  ],
};
