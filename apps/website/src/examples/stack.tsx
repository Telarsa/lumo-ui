import type { Locale } from "@lumo-ui/core";
import { formatNumber } from "@lumo-ui/core";
import { Badge, Button, Container, Grid, Stack } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the stack page. Contract: `_system/types.ts`.
 *
 * A SERVER module, and `stack.tsx` has no `"use client"` — these wrap page
 * structure, and a client directive on a layout primitive quietly pulls whole
 * route subtrees across the boundary. It is the most expensive possible place to
 * get that rule wrong.
 *
 * These three components are the library's RTL story rather than its spacing
 * story. Almost every mirroring bug is a layout bug, and the fix is almost
 * always to stop positioning things and let a layout algorithm do it: flex and
 * grid resolve start and end against the container's `direction`, so
 * `justify-end` is the right edge in English and the left edge in Persian with
 * no `rtl:` variant and nothing to keep in sync.
 *
 * Note what is deliberately ABSENT: there is no `space` variant. Tailwind's
 * `space-x-*` emits `margin-left`, not `margin-inline-start`, so a horizontal
 * stack built with it bunches to the wrong side in Persian — `gap` is the only
 * spacing mechanism these components offer, so the broken one cannot be picked
 * by mistake.
 */

const t = {
  invoiceTitle: { "fa-IR": "فاکتور مرداد", "en-US": "August invoice" },
  paid: { "fa-IR": "پرداخت‌شده", "en-US": "Paid" },
  download: { "fa-IR": "دریافت فاکتور", "en-US": "Download" },
  share: { "fa-IR": "هم‌رسانی", "en-US": "Share" },

  ordersLabel: { "fa-IR": "سفارش‌های امروز", "en-US": "Orders today" },
  revenueLabel: { "fa-IR": "فروش امروز", "en-US": "Revenue today" },
  returnsLabel: { "fa-IR": "مرجوعی‌ها", "en-US": "Returns" },
  visitorsLabel: { "fa-IR": "بازدیدکنندگان", "en-US": "Visitors" },

  pageTitle: { "fa-IR": "گزارش فروش", "en-US": "Sales report" },
  pageBody: {
    "fa-IR": "این ظرف tag=\"main\" است، پس پرش «به محتوا» به آن می‌رسد و در فهرست نشانه‌های صفحه‌خوان دیده می‌شود.",
    "en-US": "This container renders as a main element, so \"skip to content\" lands on it and a screen reader's landmark rotor lists it.",
  },

  stepOne: { "fa-IR": "انتخاب کالا", "en-US": "Choose the items" },
  stepTwo: { "fa-IR": "نشانی تحویل", "en-US": "Delivery address" },
  stepThree: { "fa-IR": "پرداخت", "en-US": "Payment" },
} satisfies Record<string, LocalizedText>;

function RowExample(l: Locale) {
  return (
    <Stack
      direction="row"
      align="center"
      justify="between"
      gap="md"
      className="w-full max-w-md rounded-lg border border-border bg-surface p-4"
    >
      <Stack gap="xs">
        <span className="text-sm font-medium text-fg">{t.invoiceTitle[l]}</span>
        <Badge tone="positive">{t.paid[l]}</Badge>
      </Stack>
      <Stack direction="row" gap="sm">
        <Button variant="ghost" size="sm">
          {t.share[l]}
        </Button>
        <Button variant="outline" size="sm">
          {t.download[l]}
        </Button>
      </Stack>
    </Stack>
  );
}

function GridExample(l: Locale) {
  const tiles = [
    { key: "orders", label: t.ordersLabel[l], value: 128 },
    { key: "revenue", label: t.revenueLabel[l], value: 48_200_000 },
    { key: "returns", label: t.returnsLabel[l], value: 6 },
    { key: "visitors", label: t.visitorsLabel[l], value: 3_412 },
  ];
  return (
    <Grid cols="auto" gap="md" className="w-full">
      {tiles.map((tile) => (
        <Stack key={tile.key} gap="xs" className="rounded-lg border border-border bg-surface p-4">
          <span className="text-xs text-fg-muted">{tile.label}</span>
          <span className="text-lg font-semibold text-fg">{formatNumber(tile.value, l)}</span>
        </Stack>
      ))}
    </Grid>
  );
}

function ContainerExample(l: Locale) {
  return (
    <Container tag="main" size="sm" className="rounded-lg border border-border bg-surface py-6">
      <Stack gap="sm">
        <h3 className="m-0 text-base font-semibold text-fg">{t.pageTitle[l]}</h3>
        <p className="m-0 text-sm text-fg-muted">{t.pageBody[l]}</p>
      </Stack>
    </Container>
  );
}

function SemanticTagExample(l: Locale) {
  const steps = [t.stepOne[l], t.stepTwo[l], t.stepThree[l]];
  return (
    <Stack
      tag="ol"
      direction="row"
      gap="lg"
      wrap
      className="m-0 list-none p-0 text-sm text-fg-muted"
    >
      {steps.map((step, index) => (
        <li key={step} className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-surface-sunken text-xs text-fg">
            {formatNumber(index + 1, l)}
          </span>
          {step}
        </li>
      ))}
    </Stack>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "چیدن فرزندان با فاصله روی فلکس یا گرید، و اندازهٔ صفحه: `Stack`، `Grid`، `Container`.",
        "en-US": "Laying out children with gaps on flex or grid, and the page measure: `Stack`, `Grid`, `Container`.",
      },
      whenNot: {
        "fa-IR": "سطحی با سربرگ و پابرگ — `Card`. پنجرک‌هایی که خواننده اندازه می‌دهد — `Resizable`. ردیفی که سرریز را پنهان می‌کند — `OverflowList`.",
        "en-US": "A surface with header and footer — `Card`. Panes the reader resizes — `Resizable`. A row that hides its overflow — `OverflowList`.",
      },
    },
    tier: "layout",
    title: { "fa-IR": "چیدمان", "en-US": "Layout primitives" },
    intro: {
      "fa-IR":
        "سه اولیهٔ چیدمان: Stack روی فلکس، Grid روی گرید و Container برای عرض صفحه. این‌ها داستان راست‌چینِ کتابخانه‌اند نه داستان فاصله‌گذاری: تقریباً هر ایراد قرینه‌شدن یک ایراد چیدمان است و درمانش این است که دست از موقعیت‌دادن برداریم. فلکس و گرید آغاز و پایان را نسبت به جهتِ ظرف حل می‌کنند، پس justify-end در انگلیسی راست است و در فارسی چپ، بدون هیچ قاعدهٔ دوم. هیچ گونهٔ space هم عرضه نمی‌شود، چون آن ابزار حاشیهٔ چپ می‌سازد و در فارسی همه‌چیز را به سمت غلط جمع می‌کند.",
      "en-US":
        "Three layout primitives: Stack over flex, Grid over grid, Container for the page measure. They are the library's RTL story rather than its spacing story: nearly every mirroring bug is a layout bug, and the cure is to stop positioning things. Flex and grid resolve start and end against the container's direction, so justify-end is the right edge in English and the left in Persian with no second rule. No space variant is offered at all, because that utility emits a left margin and bunches everything to the wrong side in Persian.",
    },
    composition: [
      `<Stack tag direction gap align justify wrap>   ← flex; gap only, never space-*`,
      `<Grid tag cols gap align>                      ← "auto" fills the row at 16rem`,
      `<Container tag size padded>                    ← mx-auto is margin-inline in v4`,
    ].join("\n"),
    parts: [
      {
        name: "Stack",
        description: {
          "fa-IR":
            "چیدمان فلکس. direction فقط row و column دارد و row-reverse عمداً نیست: آن ابزار برخلاف جهت وارونه می‌کند، پس در فارسی دو بار می‌چرخد و به جای اول برمی‌گردد — ابزاری «بدیهی» که خلاف انتظارِ خوانندهٔ نام کلاس عمل می‌کند.",
          "en-US":
            "The flex primitive. direction offers only row and column; row-reverse is deliberately absent, because it reverses AGAINST the direction rather than with it, so in Persian it flips twice and lands back where it started — an \"obvious\" utility that does the opposite of what its name suggests.",
        },
      },
      {
        name: "Grid",
        description: {
          "fa-IR":
            "چیدمان گرید. ردیف‌های گرید روی محور درون‌خطی چیده می‌شوند، پس ستون نخست در هر دو خط ستونِ نخستِ خواننده است. cols=auto هم بدون نقطهٔ شکست، هر چند ستون که جا شود می‌سازد.",
          "en-US":
            "The grid primitive. Grid tracks are laid out along the inline axis, so column one is the reader's first column in both scripts. cols=auto fills as many columns as fit, with no breakpoints involved.",
        },
      },
      {
        name: "Container",
        description: {
          "fa-IR":
            "عرض صفحه. mx-auto در تیلویند نسخهٔ چهار margin-inline می‌دهد نه حاشیهٔ چپ و راست، پس ناودان دو طرف قرینه است. ظرف اصلی صفحه باید tag=\"main\" بگیرد.",
          "en-US":
            "The page measure. mx-auto emits margin-inline in Tailwind v4 rather than a left/right pair, so the gutters are symmetric. A page's main content container should take tag=\"main\".",
        },
      },
    ],
  },
  examples: [
    {
      id: "row",
      title: { "fa-IR": "سطری با دو انتها", "en-US": "A row with two ends" },
      description: {
        "fa-IR":
          "justify=between و align=center هر دو از پیش منطقی‌اند و شکل s و e ندارند، چون لازم نیست: آغاز و پایانِ فلکس از جهتِ ظرف می‌آیند. مقایسه کنید با text-left که واقعاً فیزیکی است و شکل منطقی‌اش text-start.",
        "en-US":
          "justify=between and align=center are already logical and have no s/e variants, because none is needed: flex start and end follow the container's direction. Contrast text-left, which genuinely is physical and whose logical form is text-start.",
      },
      render: RowExample,
    },
    {
      id: "grid",
      title: { "fa-IR": "شبکه بدون نقطهٔ شکست", "en-US": "A grid with no breakpoints" },
      description: {
        "fa-IR":
          "cols=auto با auto-fill ساخته شده نه auto-fit، تا یک کاشیِ تنها تمام عرض ردیف را نکِشد. این شبکه هیچ کار راست‌چینی لازم ندارد؛ همان شبکه اگر با شناوری یا موقعیت مطلق ساخته می‌شد، همه‌جا لازم داشت.",
        "en-US":
          "cols=auto is built on auto-fill rather than auto-fit, so a single tile does not stretch across the whole row. This grid needs no RTL work at all; the same grid built from floats or absolute positioning would need it everywhere.",
      },
      render: GridExample,
    },
    {
      id: "container",
      title: { "fa-IR": "ظرف صفحه", "en-US": "The page container" },
      description: {
        "fa-IR":
          "tag تنها راه رسیدن به عنصر معنایی است و عمداً به‌جای asChild انتخاب شده: یک عنصر واقعی، یک ref واقعی و بدون شبیه‌سازی فرزند. اینکه این ظرف main است، همان چیزی است که پرش «به محتوا» و فهرست نشانه‌ها به آن تکیه دارند.",
        "en-US":
          "tag is the only route to a semantic element, and it was chosen over asChild on purpose: a real element, a real ref, no cloning. That this container IS a main is what \"skip to content\" and the landmark rotor both rely on.",
      },
      render: ContainerExample,
    },
    {
      id: "semantic-tag",
      title: { "fa-IR": "وقتی ترتیب خودِ اطلاعات است", "en-US": "When the order is the information" },
      description: {
        "fa-IR":
          "همان Stack، این‌بار به‌صورت «ol». شماره‌های دیداری خاموش‌اند و شمارهٔ هر مرحله از formatNumber می‌آید، اما معنای ترتیبی برای صفحه‌خوان می‌ماند — چیزی که یک div با کلاس flex هرگز نمی‌گوید.",
        "en-US":
          "The same Stack, this time as an «ol». The visible numbering is suppressed and each step's number comes from formatNumber, but the ordered semantics stay for a screen reader — which a div with a flex class never conveys.",
      },
      render: SemanticTagExample,
    },
  ],
};
