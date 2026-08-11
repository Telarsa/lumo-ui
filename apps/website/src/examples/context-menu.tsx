import type { Locale } from "@lumo-ui/core";
import {
  Card,
  ContextMenu,
  ContextMenuTrigger,
  MenuItem,
  MenuSection,
  MenuSeparator,
} from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the context-menu page. Contract: `_system/types.ts`.
 *
 * A SERVER module: `onAction` is optional, so nothing on this page needs a
 * function prop and every example prerenders.
 *
 * ── THE SURFACES ARE THE EXAMPLES ───────────────────────────────────────────
 *
 * A closed menu renders `null`, so none of the item text below reaches the
 * served bytes — which `packages/core/src/strings.ts` records as a measurement
 * error rather than a footnote: a first-byte sweep scores an overlay's strings
 * clean whether they are or not. What you can see on this page is the
 * right-click SURFACE. That is honest, and it is also the part with a rule
 * attached: a context menu is a SHORTCUT surface by contract, so everything in
 * it must exist somewhere visible too — nobody discovers a menu that only
 * appears on right-click.
 *
 * ── WHAT THE NATIVE ENGINE DELETED ──────────────────────────────────────────
 *
 * The old build was three mechanisms held together by hand: a menu whose open
 * state was driven by `onContextMenu`, a portaled one-point `<div>` at the
 * pointer, and a context override that re-pointed the popover at it. Base UI's
 * anchor is a virtual object with a `getBoundingClientRect()`, so there is no
 * node in the document to position, query or tear down — and the two
 * unreachable English «Dismiss» sentinels went with it. An open Lumo context
 * menu now announces zero English.
 *
 * The trigger is `display: contents`, so the `<div>` Base UI renders adds
 * nothing to layout and nothing to the accessibility tree — the surface below
 * is laid out exactly as it would be without a menu on it.
 */

const t = {
  fileCard: { "fa-IR": "گزارش فروش فصل", "en-US": "Quarterly sales report" },
  fileHint: {
    "fa-IR": "روی این کارت راست‌کلیک کنید — یا کلید منو را بزنید.",
    "en-US": "Right-click this card — or press the menu key.",
  },
  duplicate: { "fa-IR": "رونوشت", "en-US": "Duplicate" },
  rename: { "fa-IR": "تغییر نام", "en-US": "Rename" },
  remove: { "fa-IR": "حذف", "en-US": "Delete" },
  menuName: { "fa-IR": "کارهای این پرونده", "en-US": "Actions on this file" },

  rowCard: { "fa-IR": "سمیرا محمدی", "en-US": "Samira Mohammadi" },
  rowHint: {
    "fa-IR": "فوکوس را با کلید تب اینجا بیاورید و شیفت و اف‌ده را بزنید.",
    "en-US": "Tab focus onto this row and press Shift and F-ten.",
  },
  profile: { "fa-IR": "دیدن نمایه", "en-US": "Open profile" },
  message: { "fa-IR": "فرستادن پیام", "en-US": "Send a message" },
  menuNamePerson: { "fa-IR": "کارهای این عضو", "en-US": "Actions on this member" },

  imageCard: { "fa-IR": "جلد کتاب", "en-US": "Book cover" },
  imageHint: {
    "fa-IR": "منویی با دو بخش نام‌دار و یک جداکننده.",
    "en-US": "A menu with two named sections and a rule between them.",
  },
  editSection: { "fa-IR": "ویرایش", "en-US": "Edit" },
  shareSection: { "fa-IR": "هم‌رسانی", "en-US": "Share" },
  crop: { "fa-IR": "برش", "en-US": "Crop" },
  replace: { "fa-IR": "جایگزینی", "en-US": "Replace" },
  copyLink: { "fa-IR": "رونوشت نشانی", "en-US": "Copy link" },
  sendEmail: { "fa-IR": "فرستادن با ایمیل", "en-US": "Send by email" },
  menuNameImage: { "fa-IR": "کارهای این تصویر", "en-US": "Actions on this image" },

  lockedCard: { "fa-IR": "قرارداد امضاشده", "en-US": "Signed contract" },
  lockedHint: {
    "fa-IR": "دو کار در دسترس نیستند و همچنان دیده می‌شوند.",
    "en-US": "Two actions are unavailable and are still shown.",
  },
  download: { "fa-IR": "دریافت نسخهٔ پی‌دی‌اف", "en-US": "Download the PDF" },
  menuNameLocked: { "fa-IR": "کارهای این سند", "en-US": "Actions on this document" },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <ContextMenuTrigger>
      <Card className="w-full max-w-sm p-4">
        <p className="text-sm font-medium text-fg">{t.fileCard[l]}</p>
        <p className="text-xs text-fg-muted">{t.fileHint[l]}</p>
      </Card>
      <ContextMenu aria-label={t.menuName[l]}>
        <MenuItem id="duplicate">{t.duplicate[l]}</MenuItem>
        <MenuItem id="rename">{t.rename[l]}</MenuItem>
        <MenuSeparator />
        <MenuItem id="remove">{t.remove[l]}</MenuItem>
      </ContextMenu>
    </ContextMenuTrigger>
  );
}

function KeyboardExample(l: Locale) {
  return (
    <ContextMenuTrigger>
      <Card className="w-full max-w-sm p-4">
        <button
          type="button"
          className="w-full rounded-sm text-start outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span className="block text-sm font-medium text-fg">{t.rowCard[l]}</span>
          <span className="block text-xs text-fg-muted">{t.rowHint[l]}</span>
        </button>
      </Card>
      <ContextMenu aria-label={t.menuNamePerson[l]}>
        <MenuItem id="profile">{t.profile[l]}</MenuItem>
        <MenuItem id="message">{t.message[l]}</MenuItem>
      </ContextMenu>
    </ContextMenuTrigger>
  );
}

function SectionsExample(l: Locale) {
  return (
    <ContextMenuTrigger>
      <Card className="w-full max-w-sm p-4">
        <p className="text-sm font-medium text-fg">{t.imageCard[l]}</p>
        <p className="text-xs text-fg-muted">{t.imageHint[l]}</p>
      </Card>
      <ContextMenu aria-label={t.menuNameImage[l]}>
        <MenuSection title={t.editSection[l]}>
          <MenuItem id="crop">{t.crop[l]}</MenuItem>
          <MenuItem id="replace">{t.replace[l]}</MenuItem>
        </MenuSection>
        <MenuSeparator />
        <MenuSection title={t.shareSection[l]}>
          <MenuItem id="copy-link">{t.copyLink[l]}</MenuItem>
          <MenuItem id="send-email">{t.sendEmail[l]}</MenuItem>
        </MenuSection>
      </ContextMenu>
    </ContextMenuTrigger>
  );
}

function DisabledExample(l: Locale) {
  return (
    <ContextMenuTrigger>
      <Card className="w-full max-w-sm p-4">
        <p className="text-sm font-medium text-fg">{t.lockedCard[l]}</p>
        <p className="text-xs text-fg-muted">{t.lockedHint[l]}</p>
      </Card>
      <ContextMenu aria-label={t.menuNameLocked[l]}>
        <MenuItem id="download">{t.download[l]}</MenuItem>
        <MenuItem id="rename" isDisabled>
          {t.rename[l]}
        </MenuItem>
        <MenuSeparator />
        <MenuItem id="remove" isDisabled>
          {t.remove[l]}
        </MenuItem>
      </ContextMenu>
    </ContextMenuTrigger>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "overlay",
    title: { "fa-IR": "منوی راست‌کلیک", "en-US": "Context menu" },
    intro: {
      "fa-IR":
        "منویی که با راست‌کلیک، لمس طولانی یا کلید منو باز می‌شود و لنگرش خودِ اشاره‌گر است. یک سطحِ میان‌بُر است، نه جای زندگیِ یک کار: هر چه درونش هست باید جای دیگری هم دیده شود، چون کسی منویی را کشف نمی‌کند که فقط با راست‌کلیک پیدا می‌شود. آنچه در بایت اول هست همان سطحی است که راست‌کلیک می‌کنید؛ منوی بسته null است و هیچ‌یک از نام‌های درونش در بایت‌های سرو‌شده نیست.",
      "en-US":
        "A menu opened by right-click, long-press or the menu key, anchored at the pointer itself. It is a SHORTCUT surface rather than the home of an action: everything in it has to be reachable somewhere visible too, because nobody discovers a menu that only appears on right-click. What exists in the first byte is the surface you right-click; a closed menu is `null`, and none of the names inside it are in the served bytes.",
    },
    composition: [
      `<ContextMenuTrigger>`,
      `  <Card>…the right-click surface…</Card>   ← display: contents, so no layout box`,
      `  <ContextMenu aria-label onAction>`,
      `    <MenuSection title>`,
      `      <MenuItem id isDisabled>…</MenuItem>`,
      `    </MenuSection>`,
      `    <MenuSeparator />`,
      `  </ContextMenu>`,
      `</ContextMenuTrigger>`,
    ].join("\n"),
    parts: [
      {
        name: "ContextMenuTrigger",
        description: {
          "fa-IR":
            "گیرندهٔ رویداد. راست‌کلیک و لمسِ طولانی هر دو از آنِ اوست، و کلیدِ منو و شیفت‌+اف‌ده را هم پاسخ می‌دهد — مرورگرها آن دو را به رویدادِ بومیِ contextmenu نگاشت می‌کنند، و برای محیط‌هایی که این کار را نمی‌کنند همان رویداد در مرکزِ عنصرِ فوکوس‌شده دوباره فرستاده می‌شود. یک مسیرِ بازکردن است، نه دو.",
          "en-US":
            "The event catcher. Right-click and long-press are both its own, and it answers the menu key and Shift+F10 too — browsers map those onto a native `contextmenu` event, and for the environments that do not, the same event is re-dispatched at the focused element's centre. One open path, not two.",
        },
      },
      {
        name: "ContextMenu",
        description: {
          "fa-IR":
            "پنل و فهرست، در هم آمیخته — چون پنل و فهرستِ یک منوی راست‌کلیک هرگز جور دیگری ترکیب نمی‌شوند، و جداکردنشان فقط اشتباهاتِ جای‌گیری را دوباره باز می‌کرد. هر دو نیمه از پرونده‌ی menu.tsx می‌آیند و نه از رونوشتی از آن، پس نمی‌توانند از منوی معمولی جدا بیفتند.",
          "en-US":
            "The panel and the list, fused — because a context menu's panel and list are never composed differently, and separating them here would only re-open the placement mistakes `menu.tsx` already closed. Both halves are `menu.tsx`'s own parts rather than context-menu copies of them, so they cannot drift from the plain menu.",
        },
      },
      {
        name: "MenuItem",
        description: {
          "fa-IR":
            "یک کار. id همان کلیدی است که به onAction می‌رسد. isDisabled مورد را نگه می‌دارد و از دسترس بیرون می‌برد، که با حذفِ آن یکی نیست: مورد نبودن یعنی کاربر نمی‌داند این کار وجود دارد.",
          "en-US":
            "One action. `id` is the key handed to `onAction`. `isDisabled` keeps the row and makes it unavailable, which is not the same as removing it: an absent row tells the reader the action does not exist.",
        },
      },
      {
        name: "MenuSection",
        description: {
          "fa-IR":
            "گروهی نام‌دار از کارها. عنوانش یک سرآیندِ واقعیِ گروه است و نه متنی خاکستری، پس صفحه‌خوان هنگام ورود و خروج از گروه می‌گوید در کجاست.",
          "en-US":
            "A named group of actions. Its title is a real group heading rather than grey text, so a screen reader says which group it is entering and leaving.",
        },
      },
      {
        name: "MenuSeparator",
        description: {
          "fa-IR":
            "خطِ بین دو دستهٔ کار. معناییِ آن جداکننده است، نه تزئین، و همین است که یک کارِ ویرانگر را از همسایه‌های بی‌خطرش جدا نگه می‌دارد.",
          "en-US":
            "The rule between two groups of actions. It is a semantic separator rather than decoration, which is what keeps a destructive action apart from its harmless neighbours.",
        },
      },
    ],
  },
  examples: [
    {
      id: "surface",
      title: { "fa-IR": "سطحی که راست‌کلیک می‌شود", "en-US": "The surface you right-click" },
      description: {
        "fa-IR":
          "کارت را راست‌کلیک کنید. چیزی که در چیدمان اضافه می‌شود صفر است: گیرندهٔ رویداد display: contents است، پس کارت دقیقاً همان‌جایی می‌نشیند که بدون منو می‌نشست. جدا کننده هم تزئین نیست — «حذف» را از دو کارِ بی‌خطرِ بالایش دور نگه می‌دارد.",
        "en-US":
          "Right-click the card. Nothing is added to the layout: the event catcher is `display: contents`, so the card sits exactly where it would with no menu on it. The separator is not decoration either — it keeps «حذف» away from the two harmless actions above it.",
      },
      render: BasicExample,
    },
    {
      id: "keyboard",
      title: { "fa-IR": "بدون اشاره‌گر", "en-US": "With no pointer at all" },
      description: {
        "fa-IR":
          "با کلید تب روی ردیف بایستید و شیفت‌+اف‌ده یا کلید منو را بزنید. منو در مرکزِ همان عنصرِ فوکوس‌شده باز می‌شود، چون صفحه‌کلید اشاره‌گری ندارد که مختصاتش را بدهد. این چیزی است که در هیچ نماگرفتی دیده نمی‌شود و دقیقاً همان چیزی است که یک سطحِ فقط‌راست‌کلیکی را از دسترس بیرون می‌برد وقتی نباشد.",
        "en-US":
          "Tab onto the row and press Shift+F10 or the menu key. The menu opens at the focused element's centre, because a keyboard has no pointer to give coordinates. None of that is visible in a screenshot, and its absence is exactly what puts a right-click-only surface out of reach.",
      },
      render: KeyboardExample,
    },
    {
      id: "sections",
      title: { "fa-IR": "دو دسته کار", "en-US": "Two groups of actions" },
      description: {
        "fa-IR":
          "بخش‌ها عنوان دارند و عنوان‌ها سرآیندِ گروه‌اند: صفحه‌خوان می‌گوید وارد «ویرایش» شدید و بعد وارد «هم‌رسانی»، به‌جای آنکه شش کار را پشت هم بخواند. جداکننده و بخش با هم می‌آیند چون هرکدام چیزِ دیگری می‌گویند — یکی مرز می‌کشد، دیگری نام می‌دهد.",
        "en-US":
          "Sections have titles and the titles are group headings: a screen reader says you have entered «ویرایش» and then «هم‌رسانی», instead of reading six actions in a row. The separator and the section appear together because they say different things — one draws a boundary, the other gives it a name.",
      },
      render: SectionsExample,
    },
    {
      id: "disabled",
      title: { "fa-IR": "کارهایی که در دسترس نیستند", "en-US": "Actions that are unavailable" },
      description: {
        "fa-IR":
          "دو مورد isDisabled می‌گیرند و همچنان در فهرست می‌مانند. اگر برداشته می‌شدند، خواننده می‌فهمید که چنین کاری اصلاً وجود ندارد — در حالی که واقعیت این است که وجود دارد و روی این سند بسته است. کلیدهای جهت از رویشان می‌پرند، پس هزینهٔ صفحه‌کلید ندارند.",
        "en-US":
          "Two rows take `isDisabled` and stay in the list. Removed, they would tell the reader the action does not exist — when the truth is that it exists and is closed on this document. Arrow keys skip them, so they cost the keyboard nothing.",
      },
      render: DisabledExample,
    },
  ],
};
