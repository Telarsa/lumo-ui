import type { Locale } from "@lumo-ui/core";
import { Steps } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the steps page. Contract: `_system/types.ts` — each render
 * is a named top-level function so the loader can slice its source.
 *
 * A server module, and so is the component: `steps.tsx` carries no `"use
 * client"` at all, which is a decision rather than an omission. A stepper is a
 * PICTURE of state, not a control — nothing is pressable, nothing subscribes to
 * anything, and the step you are on is decided by the route or the form that
 * renders it. So a checkout's progress costs no hydration.
 *
 * ── TWO WAYS TO GET A STEPPER WRONG, BOTH OF THEM SILENT ────────────────────
 *
 *  1. **The step number.** `<span>{index + 1}</span>` renders `1 2 3` on a page
 *     whose every other number is `۱ ۲ ۳`. It type-checks, it renders, and it
 *     looks right to anyone who is not reading it — the measured defect that
 *     produced `LumoNode`, in which 77 of 77 calendar cells shipped Latin
 *     digits. Here the number is GENERATED inside the component rather than
 *     passed in, so it goes through `formatNumber` and `locale` is required.
 *  2. **The state.** The obvious stepper says «done» with a green circle and
 *     «here» with a filled one, and says nothing at all to a screen reader or to
 *     anyone who cannot separate those hues. That is colour as the sole carrier
 *     of meaning, and it is the failure mode that survives review because the
 *     reviewer can see the colours. So every step carries its status IN WORDS,
 *     in a visually hidden span, from three required props with no defaults.
 */

const t = {
  signupSteps: { "fa-IR": "مراحل ثبت‌نام", "en-US": "Sign-up steps" },
  stepComplete: { "fa-IR": "تکمیل‌شده", "en-US": "Complete" },
  stepCurrent: { "fa-IR": "مرحلهٔ فعلی", "en-US": "Current step" },
  stepUpcoming: { "fa-IR": "انجام‌نشده", "en-US": "Not started" },

  identity: { "fa-IR": "احراز هویت", "en-US": "Identity check" },
  plan: { "fa-IR": "انتخاب طرح", "en-US": "Choose a plan" },
  planHelp: { "fa-IR": "ماهانه یا سالانه", "en-US": "Monthly or yearly" },
  payment: { "fa-IR": "پرداخت", "en-US": "Payment" },

  onboarding: { "fa-IR": "راه‌اندازی فضای کاری", "en-US": "Workspace setup" },
  workspace: { "fa-IR": "نام فضای کاری", "en-US": "Name the workspace" },
  workspaceHelp: { "fa-IR": "بعداً هم قابل تغییر است", "en-US": "Changeable later" },
  invite: { "fa-IR": "دعوت هم‌تیمی‌ها", "en-US": "Invite your team" },
  inviteHelp: { "fa-IR": "با ایمیل سازمانی", "en-US": "By work email" },
  connect: { "fa-IR": "اتصال مخزن", "en-US": "Connect a repository" },
  finish: { "fa-IR": "پایان", "en-US": "Finish" },

  returnSteps: { "fa-IR": "مراحل مرجوع کردن کالا", "en-US": "Return steps" },
  request: { "fa-IR": "ثبت درخواست", "en-US": "Request submitted" },
  pickup: { "fa-IR": "تحویل به پیک", "en-US": "Handed to the courier" },
  refund: { "fa-IR": "بازگشت وجه", "en-US": "Refunded" },

  migration: { "fa-IR": "مراحل انتقال داده", "en-US": "Data migration steps" },
  audit: { "fa-IR": "بررسی داده", "en-US": "Audit" },
  mapping: { "fa-IR": "نگاشت ستون‌ها", "en-US": "Column mapping" },
  dryRun: { "fa-IR": "اجرای آزمایشی", "en-US": "Dry run" },
  review: { "fa-IR": "بازبینی نتیجه", "en-US": "Review the result" },
  cutover: { "fa-IR": "جابه‌جایی نهایی", "en-US": "Cut over" },
  verify: { "fa-IR": "راستی‌آزمایی", "en-US": "Verify" },
  archive: { "fa-IR": "بایگانی منبع", "en-US": "Archive the source" },
  handover: { "fa-IR": "تحویل به تیم", "en-US": "Hand over" },
  closeout: { "fa-IR": "بستن پرونده", "en-US": "Close out" },
  report: { "fa-IR": "گزارش نهایی", "en-US": "Final report" },
} satisfies Record<string, LocalizedText>;

function CheckoutExample(l: Locale) {
  return (
    <Steps
      className="max-w-2xl"
      locale={l}
      label={t.signupSteps[l]}
      current={2}
      completeLabel={t.stepComplete[l]}
      currentLabel={t.stepCurrent[l]}
      upcomingLabel={t.stepUpcoming[l]}
      items={[
        { id: "identity", title: t.identity[l] },
        { id: "plan", title: t.plan[l], description: t.planHelp[l] },
        { id: "payment", title: t.payment[l] },
      ]}
    />
  );
}

function VerticalExample(l: Locale) {
  return (
    <Steps
      className="max-w-md"
      locale={l}
      label={t.onboarding[l]}
      orientation="vertical"
      current={3}
      completeLabel={t.stepComplete[l]}
      currentLabel={t.stepCurrent[l]}
      upcomingLabel={t.stepUpcoming[l]}
      items={[
        { id: "workspace", title: t.workspace[l], description: t.workspaceHelp[l] },
        { id: "invite", title: t.invite[l], description: t.inviteHelp[l] },
        { id: "connect", title: t.connect[l] },
        { id: "finish", title: t.finish[l] },
      ]}
    />
  );
}

function FinishedExample(l: Locale) {
  return (
    <Steps
      className="max-w-2xl"
      locale={l}
      label={t.returnSteps[l]}
      current={4}
      completeLabel={t.stepComplete[l]}
      currentLabel={t.stepCurrent[l]}
      upcomingLabel={t.stepUpcoming[l]}
      items={[
        { id: "request", title: t.request[l] },
        { id: "pickup", title: t.pickup[l] },
        { id: "refund", title: t.refund[l] },
      ]}
    />
  );
}

function TwoDigitExample(l: Locale) {
  return (
    <Steps
      className="max-w-3xl"
      locale={l}
      label={t.migration[l]}
      orientation="vertical"
      current={9}
      completeLabel={t.stepComplete[l]}
      currentLabel={t.stepCurrent[l]}
      upcomingLabel={t.stepUpcoming[l]}
      items={[
        { id: "audit", title: t.audit[l] },
        { id: "mapping", title: t.mapping[l] },
        { id: "dry-run", title: t.dryRun[l] },
        { id: "review", title: t.review[l] },
        { id: "cutover", title: t.cutover[l] },
        { id: "verify", title: t.verify[l] },
        { id: "archive", title: t.archive[l] },
        { id: "handover", title: t.handover[l] },
        { id: "closeout", title: t.closeout[l] },
        { id: "report", title: t.report[l] },
      ]}
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "navigation",
    title: { "fa-IR": "مراحل", "en-US": "Steps" },
    intro: {
      "fa-IR":
        "کجای یک دنبالهٔ اجباری ایستاده‌اید. شمارهٔ هر مرحله درونِ خودِ جزء ساخته می‌شود و از قالب‌بندیِ عدد می‌گذرد، پس locale اجباری است — یک زمینه پیش‌فرض می‌داشت و صفحه‌ای که فراهم‌کننده را فراموش کرده بود با اطمینان در نظامِ شمارشِ اشتباه می‌نوشت. وضعیتِ هر مرحله هم با واژه گفته می‌شود و نه فقط با رنگ. اِی‌پی‌آی یک آرایه است و نه فرزندانِ تودرتو، چون شماره‌گذاریِ فرزندان یا به یک زمینه نیاز دارد — که جزءِ سروری ندارد — یا به بازسازیِ عناصر، که به‌محضِ اینکه کسی مرحله‌ای را در یک قطعه بپیچد بی‌صدا می‌شکند.",
      "en-US":
        "Where you are in a sequence you have to finish. Each step's number is generated INSIDE the component and goes through the number formatter, which is why `locale` is required — a context would have a default, and a page that forgot the provider would render confidently in the wrong numbering system. Each step's state is spoken in words rather than carried by colour. The API is an array rather than nested children, because numbering children needs either a context — which a server component does not have — or element cloning, which breaks the moment someone wraps a step in a fragment.",
    },
    composition: [
      `<Steps`,
      `  locale           ← REQUIRED: every step number goes through formatNumber`,
      `  label            ← REQUIRED: names the <nav> landmark`,
      `  current          ← 1-based; earlier steps are complete, later ones are not`,
      `  items            ← [{ id, title, description? }]`,
      `  completeLabel currentLabel upcomingLabel   ← REQUIRED, all three`,
      `  orientation />`,
    ].join("\n"),
    parts: [
      {
        name: "Steps",
        description: {
          "fa-IR":
            "کلِ دنباله: یک ناحیهٔ ناوبریِ نام‌دار با یک فهرستِ مرتب داخلش. نقشِ فهرست روی همان فهرستِ مرتب دوباره نوشته می‌شود و این زائد نیست — سافاری معناشناسیِ فهرست را از فهرستی که نشانهٔ گلوله ندارد برمی‌دارد، و همین چیزی است که کلاسِ بدون‌گلوله تنظیم می‌کند، پس بدون آن مرحله‌ها متنِ رهای بی «۳ از ۵» اعلام می‌شوند.",
          "en-US":
            "The whole sequence: a named navigation landmark holding an ordered list. The list role is restated on that `<ol>` and it is NOT redundant — Safari strips list semantics from a list whose marker is none, which is exactly what the class sets, so without it the steps announce as loose text with no «3 of 5».",
        },
      },
      {
        name: "stepMarkerVariants",
        description: {
          "fa-IR":
            "قرصِ شماره‌دار. حاشیه در هر سه وضعیت هست، پس قرص در همهٔ حالت‌ها یک اندازه می‌ماند؛ حاشیه‌ای که فقط در وضعیتِ فعلی ظاهر شود هر همسایه را با هر پیشروی دو پیکسل جابه‌جا می‌کند. خودِ قرص از درختِ دسترس‌پذیری بیرون است، چون فهرستِ مرتب همین حالا «مورد ۲ از ۴» را می‌گوید و شنیدنِ «۲» روی آن، همان واقعیت دو بار است.",
          "en-US":
            "The numbered disc. The border is present in all three states, so the disc is the same size everywhere; a border that appears only when current shifts every neighbour by two pixels as you advance. The disc itself is out of the accessibility tree, because the ordered list already says «item 2 of 4» and an announced «۲» on top of that is the same fact twice.",
        },
      },
      {
        name: "stepConnectorVariants",
        description: {
          "fa-IR":
            "خطِ میانِ دو قرص. در حالتِ عمودی، قرص و خطِ زیرش یک ستون می‌سازند، پس خط از یک قرص به قرصِ بعدی می‌رسد بدون هیچ جای‌گذاریِ مطلق — و بنابراین بدون هیچ فرورفتگیِ درون‌خطی که بشود اشتباه نوشتش.",
          "en-US":
            "The rule between two discs. In the vertical form the disc and the line under it form a column, so the connector runs from one disc to the next with no absolute positioning — and therefore with no inline inset to get wrong.",
        },
      },
      {
        name: "stepsListVariants",
        description: {
          "fa-IR":
            "چیدمانِ مرحله‌ها. جریانِ عادی، بدون وارونه‌کردنِ ردیف: زیر جهتِ راست‌به‌چپ، یک ردیفِ منعطف همین حالا مرحلهٔ یک را سمت راست می‌گذارد و به چپ می‌رود؛ وارونه‌کردنش اینجا دنباله را در صفحهٔ فارسی دو بار آینه می‌کرد و آخرین مرحله را اول می‌گذاشت.",
          "en-US":
            "The steps' layout. Normal flow, with no row reversal: under a right-to-left direction a flex row already lays step one out on the RIGHT and walks leftwards; reversing it here would double-mirror the sequence on a Persian page and put the last step first.",
        },
      },
    ],
  },
  examples: [
    {
      id: "checkout",
      title: { "fa-IR": "دنبالهٔ ثبت‌نام", "en-US": "A sign-up sequence" },
      description: {
        "fa-IR":
          "شماره‌ها را بخوانید: از قالب‌بندیِ عدد گذشته‌اند، نه از یک جمعِ نمایه با یک. وضعیت هر مرحله هم در یک span پنهان نوشته شده، پس «تکمیل‌شده» و «مرحلهٔ فعلی» شنیده می‌شوند و رنگ تنها حاملِ معنا نیست. مرحلهٔ فعلی جدا هم علامت خورده، تا فناوریِ یاری‌رسان بتواند مستقیم به آن بپرد.",
        "en-US":
          "Read the numbers: they came out of the number formatter rather than out of an index plus one. Each step's state is also written into a hidden span, so «Complete» and «Current step» are heard and colour is not the sole carrier of meaning. The current step is separately marked, so assistive technology can jump straight to it.",
      },
      render: CheckoutExample,
    },
    {
      id: "vertical",
      title: { "fa-IR": "عمودی، با توضیح", "en-US": "Vertical, with descriptions" },
      description: {
        "fa-IR":
          "در حالتِ عمودی خطِ رابط از خودِ ستونِ قرص‌ها می‌آید و نه از یک عنصرِ مطلقاً جاگذاشته، پس هیچ فرورفتگیِ درون‌خطی‌ای وجود ندارد که در فارسی وارونه شود. توضیح‌ها زیر عنوان می‌آیند و هم‌ترازیِ متن از تورفتگیِ ستون می‌آید، نه از یک حاشیهٔ سمتی.",
        "en-US":
          "In the vertical form the connector comes out of the discs' own column rather than from an absolutely positioned element, so there is no inline inset to mirror wrongly in Persian. The descriptions sit under the titles and the text alignment comes from the column's indent rather than from a side margin.",
      },
      render: VerticalExample,
    },
    {
      id: "finished",
      title: { "fa-IR": "وقتی همه‌چیز تمام شده", "en-US": "When everything is done" },
      description: {
        "fa-IR":
          "با مقدارِ فعلیِ بزرگ‌تر از تعدادِ مرحله‌ها همه تکمیل‌شده‌اند و هیچ مرحله‌ای علامتِ «فعلی» نمی‌گیرد. این حالت را عمداً می‌شود بیان کرد: دنباله‌ای که پایان یافته هنوز باید بشود نشانش داد، و مجبورکردنِ فراخوان به گذاشتنِ نشانگر روی آخرین مرحله دروغ می‌بود.",
        "en-US":
          "With `current` past the end of the list every step is complete and none is marked as current. That state is deliberately expressible: a finished sequence still has to be showable, and forcing the caller to park the marker on the last step would be a lie.",
      },
      render: FinishedExample,
    },
    {
      id: "two-digit",
      title: { "fa-IR": "شماره‌های دورقمی", "en-US": "Two-digit numbers" },
      description: {
        "fa-IR":
          "با ده مرحله، شمارهٔ آخر دورقمی می‌شود و قرص همان اندازه می‌ماند — همین جایی است که یک استپرِ ساخته‌شده با جمعِ نمایه، رقمِ لاتینِ خودش را با بیشترین تضاد نشان می‌دهد، چون کنارِ نُه رقمِ فارسیِ درست می‌نشیند.",
        "en-US":
          "With ten steps the last number is two digits and the disc stays the same size — and this is exactly where a stepper built on an index-plus-one shows its Latin digit at maximum contrast, because it sits beside nine correct Persian ones.",
      },
      render: TwoDigitExample,
    },
  ],
};
