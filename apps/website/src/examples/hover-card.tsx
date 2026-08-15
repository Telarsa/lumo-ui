import type { Locale } from "@lumo-ui/core";
import { Avatar, HoverCard, Link } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the hover-card page. Contract: `_system/types.ts`.
 *
 * A SERVER module: `label`, `trigger` and `children` are all data, so the page
 * prerenders whole.
 *
 * ── THE TRIGGERS ARE THE PAGE ───────────────────────────────────────────────
 *
 * A closed card renders `null`, so nothing inside one below is in the served
 * bytes. `packages/core/src/strings.ts` files that under measurement error
 * rather than trivia: a first-byte string sweep scores a closed overlay clean
 * whether it is clean or not. Rest the pointer on a link to see the card.
 *
 * ── AND A CARD IS ALWAYS SUPPLEMENTARY ──────────────────────────────────────
 *
 * A tap never opens one — the engine's hover interaction is `mouseOnly`,
 * deliberately, because a tap fires enter and leave in one gesture and a card
 * that flashes open under a thumb and eats the next tap is worse than no card.
 * So whatever is inside has to be reachable some other way; the link itself is
 * the other way here.
 *
 * ── ONE MEASURED LOSS, WRITTEN DOWN RATHER THAN PAPERED OVER ────────────────
 *
 * Focus now WAITS. The previous build opened on focus with no delay, because a
 * keyboard user has already committed by arriving. The engine passes the same
 * `delay` to its focus interaction as to its hover one and there is a single
 * prop feeding both, so `openDelay` now delays the keyboard path too and the
 * two are not separable through any public prop.
 */

const t = {
  reviewedBy: {
    "fa-IR": "این گزارش را ",
    "en-US": "This report was reviewed by ",
  },
  introAfter: {
    "fa-IR": " بازبینی کرده و برای انتشار تأیید کرده است.",
    "en-US": " and approved for publication.",
  },
  person: { "fa-IR": "سمیرا محمدی", "en-US": "Samira Mohammadi" },
  personInitials: { "fa-IR": "س م", "en-US": "SM" },
  personCard: { "fa-IR": "نمای کوتاه نمایه", "en-US": "Profile preview" },
  personRole: { "fa-IR": "سرپرست تحلیل داده", "en-US": "Head of data analysis" },
  personBio: {
    "fa-IR": "از سال هزار و سیصد و نود و شش در تیم گزارش‌های مالی.",
    "en-US": "On the financial reporting team since 2017.",
  },

  repoIntro: {
    "fa-IR": "کدِ این نمودارها در ",
    "en-US": "The code behind these charts lives in ",
  },
  repoAfter: {
    "fa-IR": " نگهداری می‌شود.",
    "en-US": ".",
  },
  repo: { "fa-IR": "مخزن تحلیل", "en-US": "The analysis repo" },
  repoCard: { "fa-IR": "نمای کوتاه مخزن", "en-US": "Repository preview" },
  repoBody: {
    "fa-IR": "کتابخانهٔ داخلیِ نمودارها، به‌همراه دفترچه‌های بازتولیدپذیر.",
    "en-US": "The internal charting library, with reproducible notebooks.",
  },

  termIntro: {
    "fa-IR": "پرداخت‌ها پس از ",
    "en-US": "Payments settle after ",
  },
  termAfter: {
    "fa-IR": " تسویه می‌شوند.",
    "en-US": ".",
  },
  term: { "fa-IR": "دورهٔ تسویه", "en-US": "the settlement window" },
  termCard: { "fa-IR": "معنی این اصطلاح", "en-US": "What this term means" },
  termBody: {
    "fa-IR":
      "فاصلهٔ میان ثبت تراکنش و رسیدن وجه به حساب فروشنده. اینجا سه روز کاری است.",
    "en-US":
      "The gap between a transaction being recorded and the money reaching the seller's account. Here it is three working days.",
  },

  offIntro: {
    "fa-IR": "همین پیوند با کارتِ خاموش: ",
    "en-US": "The same link with the card switched off: ",
  },
  offCard: { "fa-IR": "نمای کوتاه، خاموش", "en-US": "Preview, disabled" },
} satisfies Record<string, LocalizedText>;

function ProfileExample(l: Locale) {
  return (
    <p className="max-w-md text-sm leading-relaxed text-fg">
      {t.reviewedBy[l]}
      <HoverCard
        label={t.personCard[l]}
        trigger={<Link href="#samira">{t.person[l]}</Link>}
      >
        <div className="flex items-center gap-3">
          <Avatar initials={t.personInitials[l]} size="md" />
          <div className="flex min-w-0 flex-col">
            <span className="text-sm font-medium text-fg">{t.person[l]}</span>
            <span className="text-xs text-fg-muted">{t.personRole[l]}</span>
          </div>
        </div>
        <p className="text-xs text-fg-muted">{t.personBio[l]}</p>
      </HoverCard>
      {t.introAfter[l]}
    </p>
  );
}

function PlacementExample(l: Locale) {
  return (
    <p className="max-w-md text-sm leading-relaxed text-fg">
      {t.repoIntro[l]}
      <HoverCard
        label={t.repoCard[l]}
        placement="bottom start"
        trigger={<Link href="#repo">{t.repo[l]}</Link>}
      >
        <p className="text-xs text-fg-muted">{t.repoBody[l]}</p>
      </HoverCard>
      {t.repoAfter[l]}
    </p>
  );
}

function DelayExample(l: Locale) {
  return (
    <p className="max-w-md text-sm leading-relaxed text-fg">
      {t.termIntro[l]}
      <HoverCard
        label={t.termCard[l]}
        openDelay={200}
        closeDelay={600}
        trigger={<Link href="#settlement">{t.term[l]}</Link>}
      >
        <p className="text-xs text-fg-muted">{t.termBody[l]}</p>
      </HoverCard>
      {t.termAfter[l]}
    </p>
  );
}

function DisabledExample(l: Locale) {
  return (
    <p className="max-w-md text-sm leading-relaxed text-fg">
      {t.offIntro[l]}
      <HoverCard
        isDisabled
        label={t.offCard[l]}
        trigger={<Link href="#samira">{t.person[l]}</Link>}
      >
        <p className="text-xs text-fg-muted">{t.personBio[l]}</p>
      </HoverCard>
      {t.introAfter[l]}
    </p>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "overlay",
    title: { "fa-IR": "کارت شناور", "en-US": "Hover card" },
    intro: {
      "fa-IR":
        "پیش‌نمایشی که با ماندنِ اشاره‌گر روی یک پیوند — یا با فوکوسِ صفحه‌کلید — باز می‌شود. با لمس هرگز باز نمی‌شود، چون یک لمس ورود و خروج را در یک حرکت می‌فرستد؛ پس محتوایش همیشه مکمل است و باید از راه دیگری هم رسیدنی باشد. label اجباری است: پنل خودش هیچ نقشی و هیچ نامی ندارد و بدون آن یک تکه محتوای بی‌نام در انتهای صفحه است. هیچ چیزِ درونِ کارت در بایت اول نیست.",
      "en-US":
        "A preview that opens when the pointer rests on a link — or when the keyboard focuses it. A tap never opens it, because a tap fires enter and leave in one gesture; so its content is always SUPPLEMENTARY and must be reachable another way. `label` is required: the panel carries no role and no name of its own, and without one it is an anonymous run of content parked at the end of the document. Nothing inside the card is in the first byte.",
    },
    composition: [
      `<HoverCard`,
      `  label="…"                         ← REQUIRED: the panel is otherwise anonymous`,
      `  trigger={<Link href="…">…</Link>} ← adopted as-is, with its OWN display`,
      `  placement="bottom start"          ← logical only`,
      `  openDelay={700} closeDelay={300}`,
      `  isDisabled                        ← renders the trigger alone`,
      `>…the preview…</HoverCard>`,
    ].join("\n"),
    parts: [
      {
        name: "HoverCard",
        description: {
          "fa-IR":
            "کلِ جزء: لنگر، پنل و قاعدهٔ قصد. تأخیرِ باز و بسته‌شدن اینجا صریح پاس داده می‌شود چون پیش‌فرضِ یک موتور عددی است که در یک انتشارِ اصلاحی جابه‌جا می‌شود، و تأخیرِ بازشدن تنها عددی است که این جزء دربارهٔ آن است. نگه‌داشتنِ کارت هنگام عبورِ اشاره‌گر هم دیگر یک زمان‌سنج نیست: مثلثی میان اشاره‌گر و پنل حساب می‌شود و تا وقتی اشاره‌گر درونش است کارت باز می‌ماند — همان چیزی که آن زمان‌سنج تقریبش را می‌زد.",
          "en-US":
            "The whole component: the anchor, the panel and the intent rule. The open and close delays are passed explicitly because an engine default is a number that moves in a patch release, and the open delay is the one number this component is about. Keeping the card open while the pointer crosses to it is no longer a timer either: a triangle between the pointer and the panel is computed and the card stays open while the pointer is inside it — which is what the timer was approximating.",
        },
      },
      {
        name: "Link",
        description: {
          "fa-IR":
            "پرکاربردترین لنگر، و دلیلِ اینکه این جزء دیگر هیچ کلاسی روی لنگر نمی‌گذارد. پیش‌تر یک inline-flex و یک align-middle بی‌قید‌وشرط روی عنصرِ داده‌شده می‌نشست: اولی نامِ چندواژه‌ای فارسی را از شکستن به سطر بعد بازمی‌داشت و دومی جعبهٔ سطر را بلندتر می‌کرد و متنِ بالای آن را جابه‌جا — که به‌صورت «وقتی باز می‌شود متن را بالا می‌بَرد» گزارش شد و کارِ بازشدن نبود، کارِ نخستین رنگ‌آمیزی بود.",
          "en-US":
            "The commonest anchor, and the reason this component now puts NO class on the trigger. It used to apply an unconditional `inline-flex` and `align-middle` to whatever element it was given: the first stopped a multi-word Persian name from wrapping, and the second grew the line box and shifted the text above it — reported as «when it opens it pushes the text up», which was not the opening at all but the first paint.",
        },
      },
      {
        name: "hoverCardVariants",
        description: {
          "fa-IR":
            "عرضِ سطح. با w-max تا max-w-xs بزرگ می‌شود و عرضِ ثابت نمی‌گیرد — فارسی در همان اندازهٔ قلم پهن‌تر از انگلیسی می‌نشیند و یک عرضِ ثابت آن را می‌بُرد.",
          "en-US":
            "The surface's width. `w-max` up to `max-w-xs` rather than a fixed width — Persian sets wider than English at the same point size, and a fixed width would clip it.",
        },
      },
      {
        name: "hoverCardContentVariants",
        description: {
          "fa-IR":
            "بالشتک و چیدمانِ درونِ کارت، که حالا روی همان عنصری می‌نشیند که نقش و نام را دارد. دیوِ درونیِ ساختِ پیشین حذف شد، چون مثلثِ ایمن هندسهٔ خودِ پنل را می‌خواند و نقش هم به همان‌جا رسید.",
          "en-US":
            "The padding and layout inside the card, now applied to the SAME element that carries the role and the name. The previous build's inner div is gone: the safe polygon works off the popup's own geometry and the role landed there too.",
        },
      },
      {
        name: "hoverCardTriggerVariants",
        description: {
          "fa-IR":
            "کلاس‌هایی که فقط وقتی به کار می‌آیند که خودِ جزء جعبه را می‌سازد — یعنی وقتی لنگر یک عنصر نیست. برای پیوندی درونِ متن هیچ‌کدام اعمال نمی‌شود، و همین است خواندنِ درستِ «لنگر نباید چیدمانِ اطرافش را عوض کند».",
          "en-US":
            "Classes that apply only when the component renders the box itself — that is, when the trigger is not an element. For a link inside prose none of them is applied, and that is the correct reading of «the trigger must not change the surrounding layout».",
        },
      },
    ],
  },
  examples: [
    {
      id: "profile",
      title: { "fa-IR": "پیوندی درون متن", "en-US": "A link inside prose" },
      description: {
        "fa-IR":
          "اشاره‌گر را روی نام نگه دارید. پیوند دقیقاً همان‌طور می‌شکند و می‌نشیند که بدون کارت می‌نشست — هیچ کلاسی به آن اضافه نشده. با کلید تب هم برسید: فوکوس کارت را باز می‌کند، ولی حالا با همان تأخیرِ اشاره‌گر، و این چیزی است که از دست رفته و نوشته شده.",
        "en-US":
          "Rest the pointer on the name. The link wraps and sits exactly as it would with no card on it — no class was added to it. Reach it with Tab as well: focus opens the card, but now after the same delay the pointer waits, which is the one behaviour that was lost and is written down rather than hidden.",
      },
      render: ProfileExample,
    },
    {
      id: "placement",
      title: { "fa-IR": "جای‌گیریِ منطقی", "en-US": "Logical placement" },
      description: {
        "fa-IR":
          "placement=\"bottom start\" است و «bottom left» اصلاً نوشتنی نیست: املاهای فیزیکی از خودِ نوع کم شده‌اند، پس در فارسی این کارت از لبهٔ راست هم‌تراز می‌شود و در انگلیسی از لبهٔ چپ، با یک رشته. نیمهٔ start در موتور یک عضوِ واقعیِ اجتماع است و نه ترجمه‌ای که این پرونده انجام دهد.",
        "en-US":
          "`placement=\"bottom start\"`, and «bottom left» is not writable at all: the physical spellings are subtracted from the type itself, so this card aligns to the right edge in Persian and the left in English from one string. The `start` half is a genuine union member in the engine rather than a translation this file performs.",
      },
      render: PlacementExample,
    },
    {
      id: "delays",
      title: { "fa-IR": "دو عددی که رفتار را می‌سازند", "en-US": "The two numbers that are the behaviour" },
      description: {
        "fa-IR":
          "تأخیرِ بازشدن کوتاه‌تر و مهلتِ بسته‌شدن بلندتر از پیش‌فرض است. مهلت هنوز اهمیت دارد ولی دیگر تنها سازوکار نیست: اشاره‌گر که به‌سمت کارت می‌رود درونِ مثلثی می‌ماند که کارت را باز نگه می‌دارد، پس یک حرکتِ مورب و کُند دیگر آن را نمی‌بندد. هیچ‌کدام از این دو در نماگرفت دیده نمی‌شود.",
        "en-US":
          "A shorter open delay and a longer close grace than the defaults. The grace still matters but is no longer the mechanism: a pointer heading for the card stays inside a triangle that keeps it open, so a slow diagonal no longer closes it. Neither number is visible in a screenshot.",
      },
      render: DelayExample,
    },
    {
      id: "disabled",
      title: { "fa-IR": "خاموش، بدون آنکه بند بپرد", "en-US": "Switched off, with no reflow" },
      description: {
        "fa-IR":
          "isDisabled ویژگی‌ای نیست که پذیرفته و نادیده گرفته شود — کارت اصلاً رندر نمی‌شود و پیوند تنها می‌ماند، با کلاس‌های خودش و بدون هیچ جعبه‌ای از جانبِ این جزء. برای همین خاموش‌کردنِ کارت بندی را که در آن نشسته جابه‌جا نمی‌کند. با همان بندِ بالا مقایسه کنید: سطرها دقیقاً یک‌جا می‌افتند.",
        "en-US":
          "`isDisabled` is not a prop that is accepted and ignored — the card is not rendered at all and the link is left alone, with its own classes and no box of ours. That is why switching a card off does not move the paragraph it sits in. Compare with the first example: the lines fall in exactly the same places.",
      },
      render: DisabledExample,
    },
  ],
};
