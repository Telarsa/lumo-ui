import type { Locale } from "@lumo-ui/core";
import {
  Menu,
  MenuItem,
  MenuPopover,
  MenuSection,
  MenuSeparator,
  MenuTrigger,
  Menubar,
  MenubarButton,
} from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the menubar page. Contract: `_system/types.ts` — each
 * render is a named top-level function so the loader can slice its source.
 *
 * No `onAction` anywhere: these render in a server module and a function
 * cannot cross the boundary — the same reason the menu page's demos omit it.
 */

const t = {
  bar: { "fa-IR": "نوار منو", "en-US": "Menubar" },
  file: { "fa-IR": "پرونده", "en-US": "File" },
  newDoc: { "fa-IR": "سند تازه", "en-US": "New document" },
  open: { "fa-IR": "باز کردن…", "en-US": "Open…" },
  save: { "fa-IR": "ذخیره", "en-US": "Save" },
  edit: { "fa-IR": "ویرایش", "en-US": "Edit" },
  undo: { "fa-IR": "واگرد", "en-US": "Undo" },
  redo: { "fa-IR": "ازنو", "en-US": "Redo" },
  cut: { "fa-IR": "بریدن", "en-US": "Cut" },
  copyAction: { "fa-IR": "رونوشت", "en-US": "Copy" },
  paste: { "fa-IR": "چسباندن", "en-US": "Paste" },
  view: { "fa-IR": "نما", "en-US": "View" },
  zoomIn: { "fa-IR": "بزرگ‌نمایی", "en-US": "Zoom in" },
  zoomOut: { "fa-IR": "کوچک‌نمایی", "en-US": "Zoom out" },
  fullscreen: { "fa-IR": "تمام‌صفحه", "en-US": "Full screen" },
  history: { "fa-IR": "تاریخچه", "en-US": "History" },
  clipboard: { "fa-IR": "بریده‌دان", "en-US": "Clipboard" },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <Menubar label={t.bar[l]}>
      <MenuTrigger>
        <MenubarButton>{t.file[l]}</MenubarButton>
        <MenuPopover>
          <Menu>
            <MenuItem id="new">{t.newDoc[l]}</MenuItem>
            <MenuItem id="open">{t.open[l]}</MenuItem>
            <MenuSeparator />
            <MenuItem id="save">{t.save[l]}</MenuItem>
          </Menu>
        </MenuPopover>
      </MenuTrigger>
      <MenuTrigger>
        <MenubarButton>{t.edit[l]}</MenubarButton>
        <MenuPopover>
          <Menu>
            <MenuItem id="undo">{t.undo[l]}</MenuItem>
            <MenuItem id="redo" isDisabled>
              {t.redo[l]}
            </MenuItem>
          </Menu>
        </MenuPopover>
      </MenuTrigger>
      <MenuTrigger>
        <MenubarButton>{t.view[l]}</MenubarButton>
        <MenuPopover>
          <Menu>
            <MenuItem id="zin">{t.zoomIn[l]}</MenuItem>
            <MenuItem id="zout">{t.zoomOut[l]}</MenuItem>
            <MenuSeparator />
            <MenuItem id="full">{t.fullscreen[l]}</MenuItem>
          </Menu>
        </MenuPopover>
      </MenuTrigger>
    </Menubar>
  );
}

function SectionsExample(l: Locale) {
  return (
    <Menubar label={t.bar[l]}>
      <MenuTrigger>
        <MenubarButton>{t.edit[l]}</MenubarButton>
        <MenuPopover>
          <Menu>
            <MenuSection title={t.history[l]}>
              <MenuItem id="undo2">{t.undo[l]}</MenuItem>
              <MenuItem id="redo2" isDisabled>
                {t.redo[l]}
              </MenuItem>
            </MenuSection>
            <MenuSeparator />
            <MenuSection title={t.clipboard[l]}>
              <MenuItem id="cut2">{t.cut[l]}</MenuItem>
              <MenuItem id="copy2">{t.copyAction[l]}</MenuItem>
              <MenuItem id="paste2">{t.paste[l]}</MenuItem>
            </MenuSection>
          </Menu>
        </MenuPopover>
      </MenuTrigger>
    </Menubar>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "ردیفی افقی از منوها مثل برنامه‌های دسکتاپ: پرونده، ویرایش، نما.",
        "en-US": "A horizontal row of menus like a desktop application: File, Edit, View.",
      },
      whenNot: {
        "fa-IR": "یک منو پشت یک دکمه — `Menu`. ناوبری سایت با پنل محتوا — `NavigationMenu`. دکمه‌ها به‌جای منو، با یک ایست تبی — `Toolbar`.",
        "en-US": "One menu behind one button — `Menu`. Site navigation with content panels — `NavigationMenu`. Buttons rather than menus, under one Tab stop — `Toolbar`.",
      },
    },
    // Page identity — the catalog builds the page from these three fields (see lib/catalog.ts).
    tier: "navigation",
    title: { "fa-IR": "میلهٔ منو", "en-US": "Menubar" },
    intro: { "fa-IR": "ردیفی افقی از منوها با پیمایش پیکانی. روی نقش واقعی menubar از Base UI؛ هر دکمه یک منو باز می‌کند و پیکان‌ها بین منوها می‌گردند.", "en-US": "A horizontal row of menus with arrow-key roving. On Base UI's real role=menubar: each button opens a menu and the arrows rove between menus." },
    isNew: true,
    composition: [
      `<Menubar label="…">`,
      `  <MenuTrigger>`,
      `    <MenubarButton>…</MenubarButton>`,
      `    <MenuPopover>`,
      `      <Menu>…</Menu>`,
      `    </MenuPopover>`,
      `  </MenuTrigger>`,
      `</Menubar>`,
    ].join("\n"),
    parts: [
      {
        name: "Menubar",
        description: {
          "fa-IR": "ردیف افقی منوها: یک ایست تب نام‌دار با نقش صادقانهٔ toolbar؛ پیکان‌ها با جهت سند حل می‌شوند.",
          "en-US": "The horizontal row of menus: one named Tab stop, honestly role=toolbar; arrows resolve against the document direction.",
        },
      },
      {
        name: "MenubarButton",
        description: {
          "fa-IR": "دکمهٔ یک منو در ردیف؛ فرزند نخست MenuTrigger می‌شود و باز شدن با پیکانِ پایین را از همان‌جا می‌گیرد.",
          "en-US": "One menu's trigger in the row; goes as MenuTrigger's first child and inherits ArrowDown-to-open from it.",
        },
      },
      {
        name: "MenuTrigger",
        description: {
          "fa-IR": "مالک حالت باز/بستهٔ هر منو — همان menu.tsx، تا منوهای نوار با منوی تکی یکی بمانند.",
          "en-US": "Owns each menu's open state — menu.tsx's own, so menubar menus and the standalone menu never drift.",
        },
      },
    ],
  },
  examples: [
    {
      id: "basic",
      title: { "fa-IR": "نوار منوی برنامه", "en-US": "An application menubar" },
      description: {
        "fa-IR": "سه منو در یک ردیف؛ در فارسی پیکانِ چپ به دکمهٔ بعدی می‌رود و پیکانِ پایین منو را باز می‌کند.",
        "en-US": "Three menus in one row; in Persian, ArrowLeft moves to the next trigger and ArrowDown opens it.",
      },
      render: BasicExample,
    },
    {
      id: "sections",
      title: { "fa-IR": "با بخش‌های نام‌دار", "en-US": "With named sections" },
      description: {
        "fa-IR": "بخش‌ها از MenuSection می‌آیند و سرصفحه‌شان نام گروه را به درخت دسترس‌پذیری هم می‌دهد.",
        "en-US": "Sections come from MenuSection, whose header also names the group in the accessibility tree.",
      },
      render: SectionsExample,
    },
  ],
};
