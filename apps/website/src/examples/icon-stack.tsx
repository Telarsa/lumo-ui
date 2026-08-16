import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { formatNumber } from "@lumo-ui/core";
import { Avatar, IconStack } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the icon-stack page. Contract: `_system/types.ts`.
 *
 * A SERVER module, and `icon-stack.tsx` is directive-free too — a members row
 * on a list page costs no bundle.
 *
 * Two things on this page are worth watching rather than reading about.
 *
 * The OVERLAP has a direction. Every stack of this kind is built with `-ml-2`
 * on every child but the first, which pulls each avatar toward the physical
 * left — away from the one before it in Persian reading order — so the overlap
 * runs backwards and the faces layer the wrong way. Nothing about that shows in
 * a screenshot taken in English. Switch this page to fa and the stack leans the
 * other way from the same single class.
 *
 * The COUNT is a number, so it is formatted: «+۲», never «+2». That is the exact
 * defect `LumoNode` exists to make unrepresentable.
 *
 * The `label`s below are assembled here from `formatNumber` plus a per-locale
 * noun, the same contract `PaginationIsland`'s `pageWord` uses — this file never
 * hands a reader a raw `number` and never hands a translator one either.
 */

const t = {
  membersWord: { "fa-IR": "عضو", "en-US": "members" },
  viewersWord: { "fa-IR": "بیننده", "en-US": "viewers" },
  reviewersWord: { "fa-IR": "بازبین", "en-US": "reviewers" },

  docTitle: { "fa-IR": "پیش‌نویس قرارداد تأمین", "en-US": "Supply contract draft" },
  docMeta: { "fa-IR": "آخرین ویرایش امروز", "en-US": "Edited today" },
} satisfies Record<string, LocalizedText>;

/**
 * Initials per locale, deliberately.
 *
 * `avatar.tsx` applies no `text-transform` — Arabic script has no letter case,
 * so a `uppercase` utility would be a silent no-op for the primary locale while
 * quietly rewriting the Latin one. The glyphs are the caller's to choose, so
 * they are written out here in both scripts.
 */
const PEOPLE: ReadonlyArray<LocalizedText> = [
  { "fa-IR": "س م", "en-US": "SM" },
  { "fa-IR": "ر ک", "en-US": "RK" },
  { "fa-IR": "ن ا", "en-US": "NA" },
  { "fa-IR": "پ ط", "en-US": "PT" },
  { "fa-IR": "م ح", "en-US": "MH" },
  { "fa-IR": "ز ف", "en-US": "ZF" },
];

function OverflowExample(l: Locale) {
  return (
    <IconStack
      locale={l}
      label={`${formatNumber(PEOPLE.length, l)} ${t.membersWord[l]}`}
      max={4}
    >
      {PEOPLE.map((person) => (
        <Avatar key={person["en-US"]} initials={person[l]} />
      ))}
    </IconStack>
  );
}

function NoOverflowExample(l: Locale) {
  const three = PEOPLE.slice(0, 3);
  return (
    <IconStack
      locale={l}
      label={`${formatNumber(three.length, l)} ${t.reviewersWord[l]}`}
      max={4}
    >
      {three.map((person) => (
        <Avatar key={person["en-US"]} initials={person[l]} />
      ))}
    </IconStack>
  );
}

function SizesExample(l: Locale) {
  const five = PEOPLE.slice(0, 5);
  const label = `${formatNumber(five.length, l)} ${t.viewersWord[l]}`;
  return (
    <div className="flex flex-col items-start gap-4">
      <IconStack locale={l} label={label} size="sm" max={3}>
        {five.map((person) => (
          <Avatar key={person["en-US"]} initials={person[l]} />
        ))}
      </IconStack>
      <IconStack locale={l} label={label} size="md" max={3}>
        {five.map((person) => (
          <Avatar key={person["en-US"]} initials={person[l]} />
        ))}
      </IconStack>
      <IconStack locale={l} label={label} size="lg" max={3}>
        {five.map((person) => (
          <Avatar key={person["en-US"]} initials={person[l]} />
        ))}
      </IconStack>
    </div>
  );
}

function InRowExample(l: Locale) {
  return (
    <div className="flex w-full max-w-sm items-center gap-3 rounded-lg border border-border bg-surface p-3">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-fg">{t.docTitle[l]}</div>
        <div className="text-xs text-fg-subtle">{t.docMeta[l]}</div>
      </div>
      <IconStack
        locale={l}
        label={`${formatNumber(PEOPLE.length, l)} ${t.membersWord[l]}`}
        size="sm"
        max={3}
      >
        {PEOPLE.map((person) => (
          <Avatar key={person["en-US"]} initials={person[l]} />
        ))}
      </IconStack>
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "آواتارهای روی‌هم با شمارندهٔ باقی‌مانده: چه کسانی در گفتگو هستند، چه کسانی سند را ویرایش کرده‌اند.",
        "en-US": "Overlapping avatars with a count for the rest: who is in a conversation, who edited a document.",
      },
      whenNot: {
        "fa-IR": "یک نفر — `Avatar`. آیکون قابلیت در جعبهٔ رنگی — `IconTile`. فقط یک شمارنده — `Badge`.",
        "en-US": "One person — `Avatar`. A feature icon in a tinted square — `IconTile`. A count on its own — `Badge`.",
      },
    },
    tier: "display",
    isNew: true,
    title: { "fa-IR": "پشتهٔ آیکون", "en-US": "Icon stack" },
    intro: {
      "fa-IR":
        "آواتارهای روی‌هم‌افتاده با شمارهٔ بقیه — همان ردیفی که روی یک سند مشترک یا گفت‌وگوی گروهی می‌نشیند. همپوشانی روی محور منطقی نوشته شده، پس در فارسی به سمت راست تکیه می‌کند و در انگلیسی به چپ، از یک کلاس. شمارندهٔ سرریز از formatNumber می‌گذرد — «+۲» و نه شکلِ لاتینِ همان. برای صفحه‌خوان، پشته یک چیز است با یک نام، نه پنج تصویر بی‌نام.",
      "en-US":
        "Overlapping avatars with a count for the rest — the row on a shared document or a group conversation. The overlap is written on the logical axis, so it leans right in Persian and left in English from one class. The overflow count goes through formatNumber — «+۲», never «+2». To a screen reader the stack is ONE thing with one name, not five unnamed images.",
    },
    composition: [
      `<IconStack label locale max size>   ← label is required: the stack is one fact`,
      `  <Avatar initials />               ← the children are hidden beneath the label`,
      `  <Avatar initials />`,
      `</IconStack>                        ← anything past max becomes «+۲»`,
    ].join("\n"),
    parts: [
      {
        name: "IconStack",
        description: {
          "fa-IR":
            "خودِ پشته. label الزامی است و باید همان جمله‌ای باشد که یک انسان می‌گوید — «۶ عضو». پنج نام و یک «+۲» روایتِ بدتری از همان واقعیت است.",
          "en-US":
            "The stack itself. label is required and should be the sentence a person would say — «6 members». Five names followed by «+2» is a worse rendering of the same fact.",
        },
      },
      {
        name: "Avatar",
        description: {
          "fa-IR":
            "هر چهره. اندازه را پشته تعیین می‌کند نه آواتار، تا یک ردیف با چهره‌های ناهم‌اندازه در نیاید. حلقهٔ دور هر چهره هم از پشته می‌آید و همان چیزی است که لبه‌ها را خوانا می‌کند.",
          "en-US":
            "Each face. The STACK sets the size rather than the avatar, so a row never comes out with mismatched faces. The ring around each one comes from the stack too, and it is what makes the edges legible.",
        },
      },
    ],
  },
  examples: [
    {
      id: "overflow",
      title: { "fa-IR": "شش نفر، چهار چهره", "en-US": "Six people, four faces" },
      description: {
        "fa-IR":
          "شمارنده از formatNumber می‌آید، پس روی مسیر فارسی «+۲» است. یک {overflow} خام در JSX زیر ReactNode معمولی بدون خطا کامپایل می‌شود و همان عدد را با ارقام لاتین وسط صفحه‌ای می‌نشاند که هر عدد دیگرش فارسی است — همان نقصی که LumoNode برای غیرممکن‌کردنش نوشته شد.",
        "en-US":
          "The count comes from formatNumber, so the fa route reads «+۲». A bare {overflow} in JSX compiles fine under a plain ReactNode and renders «+2» in the middle of a page whose every other number is Persian — the exact defect LumoNode was written to make unrepresentable.",
      },
      render: OverflowExample,
    },
    {
      id: "no-overflow",
      title: { "fa-IR": "کمتر از حد", "en-US": "Under the limit" },
      description: {
        "fa-IR":
          "وقتی همه جا می‌شوند، شمارنده اصلاً کشیده نمی‌شود — نه «+۰» و نه یک جای خالی. label همچنان کل ماجرا را می‌گوید.",
        "en-US":
          "When everyone fits, the count is not drawn at all — no «+0» and no empty slot. label still tells the whole story.",
      },
      render: NoOverflowExample,
    },
    {
      id: "sizes",
      title: { "fa-IR": "سه اندازه", "en-US": "Three sizes" },
      description: {
        "fa-IR":
          "اندازه روی فرزندان اعمال می‌شود نه روی خود پشته، پس شمارندهٔ سرریز هم با چهره‌ها هم‌اندازه می‌ماند بدون آنکه فراخوان چیزی را هماهنگ کند.",
        "en-US":
          "The size is applied to the children rather than to the stack, so the overflow counter stays the same size as the faces with nothing for the caller to keep in step.",
      },
      render: SizesExample,
    },
    {
      id: "in-row",
      title: { "fa-IR": "در یک ردیف فهرست", "en-US": "In a list row" },
      description: {
        "fa-IR":
          "جایی که این جزء واقعاً زندگی می‌کند. پشته به پایانِ سطر می‌رود — که در فارسی یعنی چپ — و این کار را flex از روی dir انجام می‌دهد، نه یک کلاس فیزیکی.",
        "en-US":
          "Where the component actually lives. The stack sits at the inline end — the left in Persian — and flex does that from dir alone, not from a physical class.",
      },
      render: InRowExample,
    },
  ],
};
