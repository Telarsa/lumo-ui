import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { Bold, Italic, Link2, Redo2, Trash2, Underline, Undo2 } from "lucide-react";
import { IconButton, ToggleButton, Toolbar, ToolbarItem, ToolbarSeparator } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the toolbar page. Contract: `_system/types.ts` — each
 * render is a named top-level function so the loader can slice its source.
 *
 * A server module: every prop below is a string, so the `role="toolbar"`, its
 * name, its orientation and the pre-hydration tab stops are in the served bytes.
 *
 * ── THE ONE THING TO DO ON THIS PAGE ────────────────────────────────────────
 *
 * Tab into a toolbar and then use the ARROW KEYS. The whole toolbar is one Tab
 * stop — that is what `role="toolbar"` means — and moving between its controls
 * is the arrow keys' job. On the Persian route, ArrowLeft moves to the NEXT
 * control: the composite resolves the key against direction, which is the
 * behaviour a hand-written `switch (e.key)` gets wrong and no screenshot shows.
 *
 * ── AND THE THING THAT CHANGED, WHICH FAILS SILENTLY ────────────────────────
 *
 * The previous engine DISCOVERED its focusable descendants — any button, any
 * link, anything tabbable — and drove the roving tabindex over whatever it
 * found. This engine's toolbar is a composite, and a composite has a REGISTRY:
 * only declared children register themselves. Measured, bare library, two plain
 * `<button>` children: no tabindex, no registration, and the arrow keys do
 * nothing. The toolbar still LOOKS right, still announces «toolbar», still has
 * one visible name — and the one behaviour it exists to provide is gone.
 *
 * That is why `ToolbarItem` is an API part rather than a comment, and why the
 * second example below shows the failure side by side with the fix.
 */

const t = {
  formatting: { "fa-IR": "قالب‌بندی متن", "en-US": "Text formatting" },
  bold: { "fa-IR": "پررنگ", "en-US": "Bold" },
  italic: { "fa-IR": "کج", "en-US": "Italic" },
  underline: { "fa-IR": "زیرخط‌دار", "en-US": "Underlined" },
  insertLink: { "fa-IR": "درج پیوند", "en-US": "Insert a link" },

  registration: { "fa-IR": "ثبت در نوار ابزار", "en-US": "Toolbar registration" },
  registered: { "fa-IR": "ثبت‌شده", "en-US": "Registered" },
  unregistered: { "fa-IR": "ثبت‌نشده", "en-US": "Not registered" },

  history: { "fa-IR": "تاریخچهٔ ویرایش", "en-US": "Edit history" },
  undo: { "fa-IR": "واگرد", "en-US": "Undo" },
  redo: { "fa-IR": "ازنو", "en-US": "Redo" },
  remove: { "fa-IR": "حذف بلوک", "en-US": "Delete the block" },

  blockActions: { "fa-IR": "کارهای بلوک", "en-US": "Block actions" },
} satisfies Record<string, LocalizedText>;

function FormattingExample(l: Locale) {
  return (
    <Toolbar label={t.formatting[l]}>
      <ToolbarItem>
        <ToggleButton size="sm" aria-label={t.bold[l]} defaultSelected>
          <Bold aria-hidden="true" />
        </ToggleButton>
      </ToolbarItem>
      <ToolbarItem>
        <ToggleButton size="sm" aria-label={t.italic[l]}>
          <Italic aria-hidden="true" />
        </ToggleButton>
      </ToolbarItem>
      <ToolbarItem>
        <ToggleButton size="sm" aria-label={t.underline[l]}>
          <Underline aria-hidden="true" />
        </ToggleButton>
      </ToolbarItem>
      <ToolbarSeparator />
      <ToolbarItem>
        <IconButton label={t.insertLink[l]} variant="ghost" size="sm">
          <Link2 aria-hidden="true" />
        </IconButton>
      </ToolbarItem>
    </Toolbar>
  );
}

function RegistrationExample(l: Locale) {
  return (
    <Toolbar label={t.registration[l]}>
      <ToolbarItem>
        <IconButton label={`${t.undo[l]} — ${t.registered[l]}`} variant="ghost" size="sm">
          <Undo2 aria-hidden="true" />
        </IconButton>
      </ToolbarItem>
      <ToolbarItem>
        <IconButton label={`${t.redo[l]} — ${t.registered[l]}`} variant="ghost" size="sm">
          <Redo2 aria-hidden="true" />
        </IconButton>
      </ToolbarItem>
      <ToolbarSeparator />
      {/*
       * DELIBERATELY NOT a `ToolbarItem`, and deliberately exempted from
       * `composite-single-tab-stop`.
       *
       * This example demonstrates the defect that rule grades: an unwrapped
       * child renders, is named, is not in the composite, and takes a Tab stop
       * of its own. The extra stop IS the lesson, so it cannot be removed — and
       * it must not be left ungraded quietly either. `data-lumo-extra-tab-stop`
       * discounts exactly ONE control from this toolbar's count: the rest of
       * the strip is still graded, and a second unregistered control here would
       * still fail the build. Verified by deleting the attribute and watching
       * `gate:html` report this toolbar at 2 stops, in both locales.
       *
       * This is the rule's only exemption anywhere in the repository, and the
       * rule's docblock in `packages/gate/src/rules.ts` justifies it by name.
       */}
      <IconButton
        label={`${t.remove[l]} — ${t.unregistered[l]}`}
        variant="ghost"
        size="sm"
        data-lumo-extra-tab-stop=""
      >
        <Trash2 aria-hidden="true" />
      </IconButton>
    </Toolbar>
  );
}

function VerticalExample(l: Locale) {
  return (
    <Toolbar label={t.blockActions[l]} orientation="vertical" className="w-fit">
      <ToolbarItem>
        <IconButton label={t.undo[l]} variant="ghost" size="sm">
          <Undo2 aria-hidden="true" />
        </IconButton>
      </ToolbarItem>
      <ToolbarItem>
        <IconButton label={t.redo[l]} variant="ghost" size="sm">
          <Redo2 aria-hidden="true" />
        </IconButton>
      </ToolbarItem>
      <ToolbarSeparator />
      <ToolbarItem>
        <IconButton label={t.remove[l]} variant="ghost" size="sm">
          <Trash2 aria-hidden="true" />
        </IconButton>
      </ToolbarItem>
    </Toolbar>
  );
}

function GroupsExample(l: Locale) {
  return (
    <Toolbar label={t.history[l]}>
      <ToolbarItem>
        <ToggleButton size="sm" aria-label={t.bold[l]}>
          <Bold aria-hidden="true" />
        </ToggleButton>
      </ToolbarItem>
      <ToolbarItem>
        <ToggleButton size="sm" aria-label={t.italic[l]}>
          <Italic aria-hidden="true" />
        </ToggleButton>
      </ToolbarItem>
      <ToolbarSeparator />
      <ToolbarItem>
        <IconButton label={t.undo[l]} variant="ghost" size="sm">
          <Undo2 aria-hidden="true" />
        </IconButton>
      </ToolbarItem>
      <ToolbarItem>
        <IconButton label={t.redo[l]} variant="ghost" size="sm">
          <Redo2 aria-hidden="true" />
        </IconButton>
      </ToolbarItem>
      <ToolbarSeparator />
      <ToolbarItem>
        <IconButton label={t.remove[l]} variant="ghost" size="sm">
          <Trash2 aria-hidden="true" />
        </IconButton>
      </ToolbarItem>
    </Toolbar>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "گروهی از کنترل‌ها در یک ایست تبی که با کلیدهای جهت پیموده می‌شوند: ابزارهای ویرایشگر، کنش‌های جدول.",
        "en-US": "A group of controls in one Tab stop, navigated with the arrow keys: an editor's tools, a table's actions.",
      },
      whenNot: {
        "fa-IR": "دکمه‌های چسبیده با ایست‌های جداگانه — `ButtonGroup`. منوها در یک ردیف — `Menubar`. کنش‌هایی که سرریز می‌کنند — `OverflowList`.",
        "en-US": "Buttons joined visually with separate stops — `ButtonGroup`. Menus in a row — `Menubar`. Actions that overflow — `OverflowList`.",
      },
    },
    tier: "navigation",
    title: { "fa-IR": "نوار ابزار", "en-US": "Toolbar" },
    intro: {
      "fa-IR":
        "گروهی از کنترل‌ها که با هم یک ایست تبی می‌شوند و با کلیدهای جهت پیموده می‌شوند. نامش اجباری است و دلیلش همان جمع‌شدنِ ایست است: نوار ابزارِ بی‌نام یک ایست است که فقط «نوار ابزار» اعلام می‌شود، و صفحه‌ای با سه‌تا از آن‌ها سه ایستِ یکسان ارائه می‌کند. هیچ موتوری اینجا واژهٔ انگلیسی نشت نمی‌دهد؛ نوار ابزار فقط بی‌نام می‌رسد، که سکوت است نه اشتباه — و همین آن را سخت‌تر برای دیدن می‌کند.",
      "en-US":
        "A group of controls that collapse into a single Tab stop and are navigated with the arrow keys. Its name is required, and the reason IS that collapse: an unnamed toolbar is a stop that announces «toolbar» and nothing else, and a page with three of them offers three identical stops. Neither engine leaks English here; a toolbar simply arrives unnamed, which is silence rather than a mistake — and that makes it harder to see.",
    },
    composition: [
      `<Toolbar label orientation>`,
      `  <ToolbarItem>…one control…</ToolbarItem>   ← enrols it in the roving tabindex`,
      `  <ToolbarSeparator />                       ← derives its own perpendicular`,
      `  <ToolbarItem>…one control…</ToolbarItem>`,
      `</Toolbar>`,
    ].join("\n"),
    parts: [
      {
        name: "Toolbar",
        description: {
          "fa-IR":
            "خودِ نوار. orientation هم مصرف می‌شود و هم فرستاده می‌شود: موتور آن را برای انتخابِ کلیدهای جهت و برای مشتق‌کردنِ راستایِ عمودِ جداکننده لازم دارد، و شکلِ ظاهری برای انتخابِ محورِ چیدمان.",
          "en-US":
            "The toolbar itself. `orientation` is both consumed and forwarded: the engine needs it to choose which arrow keys move focus AND to derive the separator's perpendicular, and the styling needs it to choose the flex axis.",
        },
      },
      {
        name: "ToolbarItem",
        description: {
          "fa-IR":
            "یک کنترل را در چرخشِ فوکوسِ نوار ثبت می‌کند. جزءِ تازه‌ای است که موتور تحمیل کرده — آنجا که پیش‌تر کشف بود حالا فهرستِ ثبت است — و هیچ عنصری از خودش نمی‌سازد: فرزند پذیرفته می‌شود نه پیچیده. ایستِ تبی را هم در بایتِ اول روی هر عضو می‌گذارد و پس از سوارشدن پس می‌گیرد، چون یک صفرِ ثابت روی عنصرِ سوارشده می‌ماند و یک ایست را به چند ایست تبدیل می‌کند.",
          "en-US":
            "Enrols one control in the toolbar's roving tabindex. A NEW part forced by the engine — where there used to be discovery there is now a registry — and it renders no element of its own: the child is adopted rather than wrapped. It also serves the tab stop on every member in the first byte and withdraws it once mounted, because a CONSTANT zero survives onto the mounted element and turns one Tab stop into N.",
        },
      },
      {
        name: "ToolbarSeparator",
        description: {
          "fa-IR":
            "خطِ جداکننده، و با از دست دادنِ یک خط درست‌تر شد: راستای اعلام‌شده‌اش دیگر دستی نوشته نمی‌شود، بلکه از عمودِ نوار مشتق می‌شود. نوشتنش با دست در نوارِ افقی درست بود و در نوارِ عمودی غلط — یک باگِ نهفته که فقط چون این مخزن نوار عمودی نداشت دیده نمی‌شد. از فهرستِ ثبت هم بیرون می‌ماند، پس ایستِ فوکوس نیست.",
          "en-US":
            "The divider, and it got MORE correct by losing a line: its announced orientation is no longer hand-written but derived as the perpendicular of the toolbar. The hand-written attribute was right in a horizontal toolbar and wrong in a vertical one — a latent bug, invisible only because the repository had no vertical toolbar. It also stays out of the registry, so it is never a focus stop.",
        },
      },
      {
        name: "toolbarSeparatorVariants",
        description: {
          "fa-IR":
            "شکلِ خط. در نوار افقی یک خطِ عمودی است و در نوارِ عمودی یک خطِ افقی؛ هر دو متقارن‌اند، پس هیچ‌کدام شکلِ منطقی لازم ندارند و ویژگیِ راستا که این قاعده‌ها را عوض می‌کند تنها حالتی در کلِ مهاجرت بود که هیچ ویرایشی نخواست.",
          "en-US":
            "The rule's shape. On a horizontal toolbar it is a vertical hairline and on a vertical one a horizontal one; both are symmetric, so neither needs a logical form — and the orientation attribute that switches between them is one of the very few states in the whole migration that needed no edit at all.",
        },
      },
    ],
  },
  examples: [
    {
      id: "formatting",
      title: { "fa-IR": "نوار قالب‌بندی", "en-US": "A formatting toolbar" },
      description: {
        "fa-IR":
          "با کلید تب واردش شوید و بعد فقط از کلیدهای جهت استفاده کنید: کلِ نوار یک ایست است. روی صفحهٔ فارسی کلید چپ به کنترلِ بعدی می‌رود، چون مرکبِ زیرین کلید را در برابر جهت حل می‌کند — دقیقاً همان چیزی که یک switch دست‌نویس اشتباه می‌کند و هیچ نماگرفتی نشانش نمی‌دهد.",
        "en-US":
          "Tab into it and then use only the arrow keys: the whole strip is one stop. On the Persian route ArrowLeft moves to the NEXT control, because the composite underneath resolves the key against direction — exactly what a hand-written `switch` gets wrong and no screenshot shows.",
      },
      render: FormattingExample,
    },
    {
      id: "registration",
      title: { "fa-IR": "چیزی که ثبت نمی‌شود", "en-US": "The child that does not register" },
      description: {
        "fa-IR":
          "دو کنترلِ اول درون ToolbarItem هستند و سومی نیست. با کلیدهای جهت بین دوتای اول بروید و ببینید هرگز به سومی نمی‌رسید — سومی هنوز رندر می‌شود، هنوز نام دارد، و هنوز ایستِ تبیِ جداگانهٔ خودش را می‌گیرد، که دقیقاً همان چیزی است که نقشِ نوار ابزار قرار بود از بین ببرد. این تنها شکستی است که این جزء بی‌صدا می‌خورد، و برای همین یک بخشِ اِی‌پی‌آی گرفت نه یک توضیح در سرآیند.",
        "en-US":
          "The first two controls are inside a `ToolbarItem` and the third is not. Arrow between the first two and watch: you never reach the third — which still renders, still has a name, and still takes a Tab stop OF ITS OWN, which is precisely what the toolbar role was supposed to collapse. This is the one failure this component takes silently, and it is why the fix is an API part rather than a note in the header.",
      },
      render: RegistrationExample,
    },
    {
      id: "vertical",
      title: { "fa-IR": "عمودی", "en-US": "Vertical" },
      description: {
        "fa-IR":
          "همان نوار، چرخیده — و جداکننده خودش خطِ افقی می‌شود و راستای اعلام‌شده‌اش را هم برعکس می‌کند، بی‌آنکه اینجا چیزی نوشته شود. کلیدهای جهت هم با آن جابه‌جا می‌شوند: بالا و پایین به‌جای چپ و راست.",
        "en-US":
          "The same toolbar, rotated — and the separator becomes a horizontal rule and flips its announced orientation too, with nothing written here to make it. The arrow keys move with it: Up and Down instead of Left and Right.",
      },
      render: VerticalExample,
    },
    {
      id: "groups",
      title: { "fa-IR": "چند دستهٔ کنترل", "en-US": "Several groups of controls" },
      description: {
        "fa-IR":
          "جداکننده‌ها کارها را دسته‌بندی می‌کنند و هیچ‌کدام ایستِ فوکوس نیستند، پس شمردنِ کلیدهای جهت با شمردنِ کنترل‌ها می‌خواند. هر کنترلِ آیکونی هم نامِ خودش را دارد: آیکون نام نیست، و در نواری با شش دکمه نبودنِ نام یعنی شش ایستِ یکسان.",
        "en-US":
          "The separators group the actions and neither is a focus stop, so counting arrow presses agrees with counting controls. Every icon control carries its own name: an icon is not a name, and in a strip of six buttons the absence of one means six identical stops.",
      },
      render: GroupsExample,
    },
  ],
};
