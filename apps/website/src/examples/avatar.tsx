import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { Avatar } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the avatar page. Contract: `_system/types.ts`.
 *
 * A SERVER module, and `avatar.tsx` has no `"use client"` either — which is the
 * reason it has no `onError` fallback: swapping a broken portrait for initials
 * needs state, and state here would make every avatar in every table and every
 * comment list a client component.
 *
 * The portraits are inline SVG data URIs declared at module scope rather than
 * remote files, so the prerendered bytes are identical on every build machine
 * and nothing on this page depends on a network the build does not have.
 *
 * The question this page is about cannot be seen in a screenshot: WHAT `alt`
 * says. Both of the first two examples pass a written `alt`; only one of them
 * passes a non-empty one, and which is right depends entirely on whether the
 * name is already in the accessibility tree beside the picture.
 */

const PORTRAIT_A =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'><rect width='96' height='96' fill='%23bfd7ff'/><circle cx='48' cy='38' r='17' fill='%235b8def'/><path d='M16 96 A32 32 0 0 1 80 96 Z' fill='%235b8def'/></svg>";

const PORTRAIT_B =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'><rect width='96' height='96' fill='%23ffd9c2'/><circle cx='48' cy='38' r='17' fill='%23e07a3f'/><path d='M16 96 A32 32 0 0 1 80 96 Z' fill='%23e07a3f'/></svg>";

const t = {
  samira: { "fa-IR": "سمیرا محمدی", "en-US": "Samira Mohammadi" },
  samiraRole: { "fa-IR": "مدیر محصول", "en-US": "Product manager" },
  reza: { "fa-IR": "رضا کاظمی", "en-US": "Reza Kazemi" },
  rezaRole: { "fa-IR": "کارشناس پشتیبانی", "en-US": "Support agent" },

  samiraInitials: { "fa-IR": "س م", "en-US": "SM" },
  rezaInitials: { "fa-IR": "ر ک", "en-US": "RK" },
  narginInitials: { "fa-IR": "ن ط", "en-US": "NT" },
  nargin: { "fa-IR": "نرگین طاهری", "en-US": "Nargin Taheri" },

  online: { "fa-IR": "آنلاین", "en-US": "Online" },
  busy: { "fa-IR": "در جلسه", "en-US": "In a meeting" },
  offline: { "fa-IR": "آفلاین", "en-US": "Offline" },

  assignedTo: { "fa-IR": "ارجاع‌شده به", "en-US": "Assigned to" },
  ticketOne: { "fa-IR": "خطای درگاه پرداخت", "en-US": "Payment gateway error" },
  ticketTwo: { "fa-IR": "درخواست بازگشت کالا", "en-US": "Return request" },
} satisfies Record<string, LocalizedText>;

function BesideNameExample(l: Locale) {
  return (
    <ul className="flex w-full max-w-sm list-none flex-col gap-3 p-0">
      <li className="flex items-center gap-3">
        {/*
         * `alt=""` — written, and deliberately empty. The name is the very next
         * node in the tree, so a non-empty alt makes a screen reader say it twice.
         */}
        <Avatar size="lg" src={PORTRAIT_A} alt="" initials={t.samiraInitials[l]} />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-fg">{t.samira[l]}</span>
          <span className="truncate text-xs text-fg-muted">{t.samiraRole[l]}</span>
        </span>
      </li>
      <li className="flex items-center gap-3">
        <Avatar size="lg" src={PORTRAIT_B} alt="" initials={t.rezaInitials[l]} />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-fg">{t.reza[l]}</span>
          <span className="truncate text-xs text-fg-muted">{t.rezaRole[l]}</span>
        </span>
      </li>
    </ul>
  );
}

function StandaloneExample(l: Locale) {
  const rows = [
    { key: "one", subject: t.ticketOne[l], src: PORTRAIT_A, who: t.samira[l] },
    { key: "two", subject: t.ticketTwo[l], src: PORTRAIT_B, who: t.reza[l] },
  ];
  return (
    <table className="w-full max-w-sm text-sm">
      <caption className="pbe-2 text-start text-xs text-fg-muted">{t.assignedTo[l]}</caption>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className="border-bs border-border">
            <td className="p-2 text-fg">{row.subject}</td>
            <td className="p-2">
              {/*
               * Nothing else in this cell names the person, so the portrait is
               * the only carrier and `alt` has to be their name.
               */}
              <Avatar size="sm" src={row.src} alt={row.who} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function InitialsExample(l: Locale) {
  return (
    <div className="flex items-center gap-3">
      <Avatar size="lg" initials={t.samiraInitials[l]} />
      <Avatar size="lg" initials={t.rezaInitials[l]} />
      <Avatar size="lg" initials={t.narginInitials[l]} />
    </div>
  );
}

function StatusExample(l: Locale) {
  return (
    <ul className="flex w-full max-w-sm list-none flex-col gap-3 p-0">
      <li className="flex items-center gap-3">
        {/*
         * `statusLabel` is required to draw a dot at all — there is no boolean
         * and no default. The colour is the fast read; the word is what makes
         * the dot mean anything to a screen reader or to a reader who cannot
         * separate the green from the amber.
         */}
        <Avatar
          size="lg"
          src={PORTRAIT_A}
          alt=""
          initials={t.samiraInitials[l]}
          statusLabel={t.online[l]}
          statusTone="positive"
        />
        <span className="truncate text-sm font-medium text-fg">{t.samira[l]}</span>
      </li>
      <li className="flex items-center gap-3">
        <Avatar
          size="lg"
          src={PORTRAIT_B}
          alt=""
          initials={t.rezaInitials[l]}
          statusLabel={t.busy[l]}
          statusTone="caution"
        />
        <span className="truncate text-sm font-medium text-fg">{t.reza[l]}</span>
      </li>
      <li className="flex items-center gap-3">
        {/* No tone given — `neutral`, which is what "no signal" should look like. */}
        <Avatar size="lg" initials={t.narginInitials[l]} statusLabel={t.offline[l]} />
        <span className="truncate text-sm font-medium text-fg">{t.nargin[l]}</span>
      </li>
    </ul>
  );
}

function SizesExample(l: Locale) {
  return (
    <div className="flex items-center gap-3">
      <Avatar size="sm" src={PORTRAIT_A} alt="" initials={t.samiraInitials[l]} />
      <Avatar size="md" src={PORTRAIT_A} alt="" initials={t.samiraInitials[l]} />
      <Avatar size="lg" src={PORTRAIT_A} alt="" initials={t.samiraInitials[l]} />
      <Avatar size="xl" src={PORTRAIT_A} alt="" initials={t.samiraInitials[l]} />
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "یک شخص یا حساب، به‌صورت تصویر یا حروف اول: سربرگ پیام، فهرست اعضا، منوی حساب.",
        "en-US": "A person or an account, as a picture or initials: a message header, a member list, the account menu.",
      },
      whenNot: {
        "fa-IR": "چند نفر روی هم با شمارندهٔ باقی‌مانده — `IconStack`. آیکون یک قابلیت در جعبهٔ رنگی — `IconTile`. نشانگر وضعیت — `Badge`.",
        "en-US": "Several people overlapping with a count for the rest — `IconStack`. A feature's icon in a tinted box — `IconTile`. A status marker — `Badge`.",
      },
    },
    tier: "display",
    title: { "fa-IR": "آواتار", "en-US": "Avatar" },
    intro: {
      "fa-IR":
        "یک شخص، به‌صورت تصویر یا حروف نخست. هرجا src داده شود، نوشتنِ alt اجباری است — نه «ناتهی بودن»، بلکه نوشته‌شدن؛ چون رشتهٔ خالی در پرتکرارترین حالت پاسخ درست است و alt اختیاری تنها پاسخی را ممکن می‌کند که همیشه غلط است: نبودن صفت. حروف نخست پشت تصویر می‌نشینند و هیچ تبدیل حروف بزرگ در کار نیست، چون خط عربی حرف بزرگ ندارد.",
      "en-US":
        "A person, as a picture or as initials. Wherever src is given, WRITING alt is required — not \"required to be non-empty\", required to be written, because the empty string is the right answer in the commonest case and an optional alt only enables the one answer that is always wrong: no attribute at all. The initials sit behind the image, and nothing is uppercased, because Arabic script has no letter case.",
    },
    composition: [
      `<Avatar src alt initials size>   ← src present → alt is required by the TYPE`,
      `                                 ← no src → initials become required instead`,
      `       statusLabel statusTone    ← the dot needs a WORD; there is no boolean`,
      ``,
      `<IconStack label locale max>     ← the group and its +N count live there, not here`,
    ].join("\n"),
    parts: [
      {
        name: "Avatar",
        description: {
          "fa-IR":
            "کل جزء، به‌شکل یک اجتماع تفکیک‌شده: یا src و alt با هم می‌آیند، یا هیچ‌کدام و آنگاه initials اجباری می‌شود. جایگزینی تصویر خراب با حروف نخست عمداً وجود ندارد؛ آن کار به state نیاز دارد و هر آواتار را به جزء کلاینتی تبدیل می‌کند.",
          "en-US":
            "The whole component, as a discriminated union: either src and alt arrive together, or neither does and initials become required instead. There is deliberately no swap from a broken image to the initials — that needs state, and state here makes every avatar a client component. statusLabel is what draws the presence dot, and it is a string rather than a flag because a state carried by colour alone fails WCAG 1.4.1.",
        },
      },
      {
        name: "IconStack",
        description: {
          "fa-IR":
            "گروه آواتارها و شمارندهٔ سرریز جای دیگری است، نه اینجا. همپوشانی روی محور درون‌خطی نوشته شده تا در هر دو خط به سمت خواننده بیفتد، شمارنده از formatNumber می‌گذرد و رقمش فارسی درمی‌آید نه لاتین، و کل ردیف یک برچسب اجباری می‌گیرد چون پنج چهره یک واقعیت‌اند. جزء دومی برای همین کار، همان ایرادِ رقمِ لاتین را دوباره می‌آورد.",
          "en-US":
            "The avatar group and its overflow count live there, not here. The overlap is written on the inline axis so the stack leans the reader's way in both scripts, the count goes through formatNumber («+۲», never «+2»), and the whole row takes one required label because five faces are one fact. A second component for the same job would ship the Latin-digit defect back alongside the fix for it.",
        },
      },
    ],
  },
  examples: [
    {
      id: "beside-name",
      title: { "fa-IR": "کنار نام", "en-US": "Beside the name" },
      description: {
        "fa-IR":
          "هر دو آواتار alt خالی دارند و این تصمیمی است، نه فراموشی: نام درست در گرهٔ بعدی درخت نشسته، پس alt ناتهی باعث می‌شود صفحه‌خوان نام را دو بار بگوید. در نمایش دیداری هیچ تفاوتی با حالت اشتباه دیده نمی‌شود.",
        "en-US":
          "Both avatars carry an empty alt, and that is a decision rather than an omission: the name is the very next node in the tree, so a non-empty alt makes a screen reader say it twice. Visually this is indistinguishable from getting it wrong.",
      },
      render: BesideNameExample,
    },
    {
      id: "standalone",
      title: { "fa-IR": "وقتی تصویر تنهاست", "en-US": "When the picture is alone" },
      description: {
        "fa-IR":
          "همان جزء، همان اندازه، و alt این‌بار نامِ شخص است — چون در این خانهٔ جدول هیچ متنی نمی‌گوید پرونده به چه کسی ارجاع شده. تفاوت میان این مثال و مثال بالا کاملاً در چیزی است که خوانده می‌شود، نه در چیزی که دیده می‌شود.",
        "en-US":
          "The same component at the same size, and this time alt is the person's NAME — because nothing else in the cell says who the ticket went to. The whole difference between this example and the one above is in what is spoken, not in what is drawn.",
      },
      render: StandaloneExample,
    },
    {
      id: "initials",
      title: { "fa-IR": "بدون تصویر", "en-US": "Without a picture" },
      description: {
        "fa-IR":
          "بدون src، حروف نخست تمامِ محتوا هستند و تایپ آن‌ها را اجباری می‌کند. اینجا هیچ کلاس uppercase روی عنصر نیست: چنین قاعده‌ای برای خط عربی بی‌اثر است و در همان حال ورودی لاتین را بازنویسی می‌کند — دگرگونی‌ای که رفتارش با خط عوض می‌شود، ایرادی است که منتظر تعویض زبان مانده.",
        "en-US":
          "With no src the initials are the whole content, and the type makes them required. There is no uppercase utility on this element: such a rule is a silent no-op for Arabic script while quietly rewriting Latin input — a transformation that behaves differently per script is a bug waiting for a locale switch.",
      },
      render: InitialsExample,
    },
    {
      id: "status",
      title: { "fa-IR": "نقطهٔ وضعیت، با یک واژه", "en-US": "The status dot, with a word" },
      description: {
        "fa-IR":
          "نقطه روی گوشهٔ پایانیِ دایره می‌نشیند — پایین‌راست در انگلیسی، پایین‌چپ در فارسی — چون جایش با end تعیین شده نه با right. نسخهٔ دست‌سازِ همین نقطه را همه با right می‌نویسند و فقط در فارسی غلط است، یعنی در هیچ اسکرین‌شات انگلیسی دیده نمی‌شود. حلقهٔ دوپیکسلی به رنگ زمینه هم برای همین است که نقطه روی پرتره‌ای هم‌رنگ خودش گم نشود.",
        "en-US":
          "The dot sits at the circle's trailing corner — bottom-right in English, bottom-LEFT in Persian — because its place is written with end rather than right. The hand-rolled version of this dot is written right-0 by everyone and is wrong in Persian only, which means it shows up in no English screenshot. The two-pixel ring in the page colour is there so the dot does not vanish against a portrait that happens to share its hue.",
      },
      render: StatusExample,
    },
    {
      id: "sizes",
      title: { "fa-IR": "چهار اندازه و یک حلقه", "en-US": "Four sizes and one ring" },
      description: {
        "fa-IR":
          "مرز دایره یک ring درونی است، نه border. با border تصویر به اندازهٔ ضخامت مرز تورفتگی می‌گرفت و دایره در اندازه‌های کوچک از دایره‌بودن می‌افتاد؛ حلقهٔ درونی روی تصویر می‌نشیند و اندازه دست‌نخورده می‌ماند.",
        "en-US":
          "The circle's edge is an inset ring, not a border. A border would inset the image by its own width and the circle would stop being a circle at the smaller sizes; an inset ring is drawn over the image and leaves the box alone.",
      },
      render: SizesExample,
    },
  ],
};
