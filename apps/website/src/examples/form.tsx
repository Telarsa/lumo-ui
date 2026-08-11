import type { Locale } from "@lumo-ui/core";
import { Description, Field, FieldError, FieldInput, Form, Label } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the form page. Contract: `_system/types.ts` — each render
 * is a named top-level function so the loader can slice its source.
 *
 * A server module, and that is the whole point of this page. `Field` is a client
 * component, but every prop below is a string, so these PRERENDER — which is the
 * only tier on which this component's argument can be checked at all. The defect
 * `form.tsx` exists to close is a name that arrives on hydration: measured on a
 * 442-document export of this library, 98 controls served with no
 * accessible name, self-healing the moment JavaScript ran, and therefore
 * invisible to jsdom, to Testing Library and to axe-in-a-browser alike.
 *
 * ── WHAT TO LOOK AT, WITH THE VIEW-SOURCE OPEN ──────────────────────────────
 *
 * Every example on this page is worth reading in the SERVED bytes rather than
 * in the browser: the `<label>` carries an id, the `<input>` carries an
 * `aria-labelledby` and an `aria-describedby` pointing at it and at the
 * description, and all of that is in the first byte instead of in a layout
 * effect. That is the one thing the preview cannot show you, because by the
 * time you are looking at the preview the engine has caught up.
 */

const t = {
  displayName: { "fa-IR": "نام نمایشی", "en-US": "Display name" },
  displayNameHelp: {
    "fa-IR": "همین نام کنار پیام‌های شما دیده می‌شود.",
    "en-US": "This is the name shown beside your messages.",
  },

  nationalId: { "fa-IR": "کد ملی", "en-US": "National ID" },
  nationalIdError: {
    "fa-IR": "کد ملی باید ده رقم باشد و رقم کنترلی‌اش بخواند.",
    "en-US": "A national ID is ten digits and its check digit has to agree.",
  },

  workspace: { "fa-IR": "نام فضای کاری", "en-US": "Workspace name" },
  workspaceHelp: {
    "fa-IR": "بعداً هم می‌شود عوضش کرد.",
    "en-US": "You can change this later.",
  },
  contactEmail: { "fa-IR": "ایمیل تماس", "en-US": "Contact email" },
  contactEmailError: {
    "fa-IR": "این نشانی ایمیل کامل نیست.",
    "en-US": "That email address is incomplete.",
  },

  invoiceTo: { "fa-IR": "صورت‌حساب به نام", "en-US": "Invoice made out to" },
  invoiceToHelp: {
    "fa-IR": "روی برگهٔ صورت‌حساب همین‌طور چاپ می‌شود.",
    "en-US": "Printed on the invoice exactly like this.",
  },

  frozen: { "fa-IR": "دامنهٔ سازمان", "en-US": "Organisation domain" },
  frozenValue: { "fa-IR": "سامانهٔ درون‌سازمانی", "en-US": "Internal service" },
  frozenHelp: {
    "fa-IR": "دامنه را مدیر سازمان تعیین می‌کند.",
    "en-US": "The domain is set by your organisation's administrator.",
  },
} satisfies Record<string, LocalizedText>;

/**
 * The input's skin, written out rather than imported.
 *
 * `inputVariants` lives in `text-field.tsx`, which carries `"use client"` — so
 * in a server module its export is a client REFERENCE, not the cva function,
 * and calling it here would throw at build time. This page is about the chrome
 * around a control rather than about the control's own paint, so the class list
 * is stated once and the examples stay readable.
 */
const INPUT =
  "h-control-md w-full rounded-md border border-border-control bg-surface " +
  "px-3 text-sm text-fg text-start";

/** The same box, marked invalid. */
const INPUT_INVALID =
  "h-control-md w-full rounded-md border border-critical bg-surface " +
  "px-3 text-sm text-fg text-start";

function AnatomyExample(l: Locale) {
  return (
    <Field
      className="w-full max-w-sm"
      label={t.displayName[l]}
      description={t.displayNameHelp[l]}
    >
      <Label>{t.displayName[l]}</Label>
      <FieldInput className={INPUT} />
      <Description>{t.displayNameHelp[l]}</Description>
    </Field>
  );
}

function ErrorExample(l: Locale) {
  return (
    <Field
      className="w-full max-w-sm"
      label={t.nationalId[l]}
      errorMessage={t.nationalIdError[l]}
    >
      <Label>{t.nationalId[l]}</Label>
      <FieldInput
        inputMode="numeric"
        className={INPUT_INVALID}
      />
      <FieldError>{t.nationalIdError[l]}</FieldError>
    </Field>
  );
}

function FormExample(l: Locale) {
  return (
    <Form className="w-full max-w-sm">
      <Field label={t.workspace[l]} description={t.workspaceHelp[l]}>
        <Label>{t.workspace[l]}</Label>
        <FieldInput className={INPUT} />
        <Description>{t.workspaceHelp[l]}</Description>
      </Field>
      <Field label={t.contactEmail[l]} errorMessage={t.contactEmailError[l]}>
        <Label>{t.contactEmail[l]}</Label>
        <FieldInput
          type="email"
          className={INPUT_INVALID}
        />
        <FieldError>{t.contactEmailError[l]}</FieldError>
      </Field>
    </Form>
  );
}

function GroupLabelExample(l: Locale) {
  return (
    <Field className="w-full max-w-sm" label={t.invoiceTo[l]} description={t.invoiceToHelp[l]}>
      <Label nativeLabel={false}>{t.invoiceTo[l]}</Label>
      <FieldInput className={INPUT} />
      <Description>{t.invoiceToHelp[l]}</Description>
    </Field>
  );
}

function DisabledExample(l: Locale) {
  return (
    <Field
      className="w-full max-w-sm"
      label={t.frozen[l]}
      description={t.frozenHelp[l]}
      isDisabled
    >
      <Label>{t.frozen[l]}</Label>
      <FieldInput
        defaultValue={t.frozenValue[l]}
        className={INPUT}
      />
      <Description>{t.frozenHelp[l]}</Description>
    </Field>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "form",
    title: { "fa-IR": "میدان و فرم", "en-US": "Field and form" },
    intro: {
      "fa-IR":
        "زیرساختی که هر کنترلِ برچسب‌دار این کتابخانه از آن ساخته شده: پوشش، برچسب، متن راهنما، خطا و خودِ فرم. اهمیتش در چیزی است که در بایتِ اول اتفاق می‌افتد — موتور، پیوند برچسب به کنترل را در یک اثر چیدمانی حل می‌کند و اثر چیدمانی روی سرور اجرا نمی‌شود. Field همان محاسبه را هنگام رندر انجام می‌دهد و نتیجه را روی یک زمینهٔ لومو منتشر می‌کند، پس Label و Description و FieldError هیچ ویژگی‌ای لازم ندارند و کنترل با useFieldControl آن را برمی‌دارد.",
      "en-US":
        "The chrome every labelled control in this library is built from: the wrapper, the label, the help text, the error and the `<form>` itself. What makes it matter is what happens in the FIRST BYTE — the engine resolves label-to-control association in a layout effect, and a layout effect does not run on the server. Field does the same computation during render and publishes it on a Lumo context, so Label, Description and FieldError need no props at all and the control picks it up with useFieldControl.",
    },
    composition: [
      `<Form validationBehavior="aria">      ← noValidate: the browser's own message is a`,
      `                                         different language from the page`,
      `  <Field label description errorMessage isDisabled name validate>`,
      `    <Label>…</Label>                   ← reads the wiring off the context`,
      `    <FieldInput />                     ← spreads useFieldControl for you`,
      `    <Description>…</Description>`,
      `    <FieldError>…</FieldError>         ← renders NOTHING when there is no error`,
      `  </Field>`,
      `</Form>`,
    ].join("\n"),
    parts: [
      {
        name: "Field",
        description: {
          "fa-IR":
            "یک میدان: ریشهٔ موتور به‌علاوهٔ سیم‌کشیِ سرورامنِ هر چیزی که درونش است. دو مسئولیت عمداً یکی شده‌اند؛ کسی که یکی را بردارد و دیگری را جا بگذارد، در هر ابزاری که این مخزن دارد درست به نظر می‌رسد.",
          "en-US":
            "One field: the engine's root plus the server-safe wiring for everything inside it. The two responsibilities are deliberately fused — take one and forget the other and it looks right in every instrument this repository owns.",
        },
      },
      {
        name: "Label",
        description: {
          "fa-IR":
            "برچسب. w-fit تزئینی نیست: برچسب یک جعبهٔ بلوکی است، پس برچسبِ تمام‌عرض کل خط را کلیک‌پذیر می‌کند — از جمله دنبالهٔ خالی که در فارسی سمت چپ است. nativeLabel={false} برای گروهی است که هیچ کنترلِ برچسب‌پذیرِ یکتایی ندارد.",
          "en-US":
            "The label. `w-fit` is not cosmetic: a `<label>` is a block box, so a full-width one makes the whole line clickable — including the empty run, which in Persian is the LEFT side. `nativeLabel={false}` is for a group with no single labelable control.",
        },
      },
      {
        name: "FieldInput",
        description: {
          "fa-IR":
            "ورودیِ از پیش سیم‌کشی‌شده. جزء جداگانه‌ای است به دلیلی که مالِ ری‌اکت است نه موتور: قلابی که Field را رندر می‌کند نمی‌تواند زمینه‌ای را بخواند که خودِ Field در درختِ برگشتی‌اش فراهم می‌کند.",
          "en-US":
            "The already-wired input. It is its own component for a reason that is React's rather than the engine's: the component that RENDERS `<Field>` cannot read the context `<Field>` provides, because the provider is in the returned tree.",
        },
      },
      {
        name: "Description",
        description: {
          "fa-IR":
            "متن کمکی. شناسه‌اش را Field می‌سازد و در aria-describedby کنترل هُل می‌دهد — موتور شناسه را می‌سازد ولی ارجاع را از اثر چیدمانی منتشر می‌کند، یعنی توضیحِ سرورساخته را هیچ‌کس اعلام نمی‌کند. این نیمی از نقص است که هیچ ابزاری نمی‌شمردش.",
          "en-US":
            "Help text. Its id is minted by `<Field>` and pushed into the control's `aria-describedby` during render — the engine mints an id here too, but publishes the REFERENCE from a layout effect, so a server-rendered description is announced by nothing. That is the half nobody was counting.",
        },
      },
      {
        name: "FieldError",
        description: {
          "fa-IR":
            "پیام اعتبارسنجی. برای فرزندِ غایب null برمی‌گرداند، چون عنصرِ خالیِ خطا زیر هر میدان یک جابه‌جاییِ چیدمان است نه یک بی‌عملی.",
          "en-US":
            "The validation message. Returns `null` for absent children, because an empty error element under every field is a visible layout shift rather than a no-op.",
        },
      },
      {
        name: "Form",
        description: {
          "fa-IR":
            "خودِ فرم. پیش‌فرضش پیام‌های بومیِ مرورگر را خاموش می‌کند و این یک ترجیح نیست: مرورگر زبانِ پیامش را از زبانِ رابطِ خودش برمی‌دارد، نه از lang صفحه — پس یک صفحهٔ فارسی در مرورگری با رابطِ انگلیسی، خطای انگلیسی زیر برچسب فارسی نشان می‌دهد، و چون مرورگر بازبین معمولاً هم‌زبانِ صفحه است، در بازبینی دیده نمی‌شود.",
          "en-US":
            "The form. Its default turns the browser's native messages off, and that is not a preference: the browser picks that string from its own UI language rather than from `<html lang>`, so a Persian page in an English-chrome browser shows an English error under a Persian label — invisible in review, because the reviewer's browser is usually set to the page's language.",
        },
      },
      {
        name: "useFieldControl",
        description: {
          "fa-IR":
            "ویژگی‌هایی که یک کنترل باید پخش کند تا در بایتِ اول نام و توضیح داشته باشد. بیرون از Field شیء خالی برمی‌گرداند، که آنجا دقیقاً درست است: هر چیزی که کنترل را پیچیده، خودش مالکِ پیوند است.",
          "en-US":
            "The props a control spreads to be named and described in the first byte. Outside a `<Field>` it returns an empty object, which is exactly right there — whatever wraps the control owns the association instead.",
        },
      },
    ],
  },
  examples: [
    {
      id: "anatomy",
      title: { "fa-IR": "کالبدشکافی یک میدان", "en-US": "The anatomy of a field" },
      description: {
        "fa-IR":
          "به Label و Description هیچ ویژگی‌ای داده نشده و هر دو سیم‌کشی‌شده‌اند. آنچه ارزشِ دیدن دارد در منبعِ صفحه است نه در پیش‌نمایش: برچسب شناسه دارد، ورودی aria-labelledby و aria-describedby دارد، و همه پیش از اجرای هر جاوااسکریپتی آنجا هستند.",
        "en-US":
          "Neither Label nor Description is given a prop, and both are wired. What is worth looking at is in view-source rather than in the preview: the label carries an id, the input carries an aria-labelledby and an aria-describedby pointing at it, and all of it is there before any JavaScript runs.",
      },
      render: AnatomyExample,
    },
    {
      id: "error-order",
      title: { "fa-IR": "توضیح و خطا، به همان ترتیب", "en-US": "Description then error" },
      description: {
        "fa-IR":
          "دادن errorMessage خودش میدان را نامعتبر می‌کند — میدانی که پیام خطا دارد و خودش را معتبر اعلام می‌کند تناقضی است که فراخوان نباید حلش کند. توضیح و خطا یک aria-describedby را با همین ترتیب شریک می‌شوند، پس خطا آخر شنیده می‌شود؛ و وقتی خطایی نیست، FieldError اصلاً عنصری نمی‌سازد.",
        "en-US":
          "Supplying errorMessage marks the field invalid on its own — a field carrying an error message and reporting itself valid is a contradiction the caller should not have to resolve. Description and error share one aria-describedby in that order, so the error is heard last; with no error, FieldError renders no element at all.",
      },
      render: ErrorExample,
    },
    {
      id: "form-shell",
      title: { "fa-IR": "دو میدان در یک فرم", "en-US": "Two fields in a form" },
      description: {
        "fa-IR":
          "هر Field سیم‌کشیِ خودش را دارد و هیچ شناسه‌ای بین دو میدان مشترک نیست. Form هم noValidate است: اعتبارسنجیِ بومی، پیامش را به زبانِ رابطِ مرورگر می‌نویسد و آن زبان هیچ ربطی به زبانِ صفحه ندارد. بهایش صادقانه نوشته می‌شود — «aria» میدان را برای فناوری یاری‌رسان نامعتبر علامت می‌زند ولی جلوی ارسال را نمی‌گیرد.",
        "en-US":
          "Each Field carries its own wiring and no id is shared between the two. Form is noValidate as well: native constraint validation writes its message in the browser's UI language, which has nothing to do with the page's. The cost is stated rather than hidden — «aria» marks the field invalid for assistive technology but does not block submission.",
      },
      render: FormExample,
    },
    {
      id: "group-label",
      title: { "fa-IR": "برچسبی که کنترل ندارد", "en-US": "A label with no control" },
      description: {
        "fa-IR":
          "nativeLabel={false} یک span می‌سازد نه یک label، و نام از راه aria-labelledby می‌رسد. برای یک گروه رادیویی یا گروه چک‌باکس همین درست است: هیچ کنترلِ یکتایی برای اشاره‌کردن وجود ندارد، و یک label بومی ادعا می‌کند کنترلی را فوکوس می‌کند که نیست.",
        "en-US":
          "`nativeLabel={false}` renders a span rather than a label, and the name arrives through aria-labelledby. That is the right shape for a radio group or a checkbox group: there is no single control to point a `<label for>` at, and a native label claims to focus one that does not exist.",
      },
      render: GroupLabelExample,
    },
    {
      id: "disabled",
      title: { "fa-IR": "غیرفعال، یک بار", "en-US": "Disabled, once" },
      description: {
        "fa-IR":
          "کم‌رنگ‌شدن روی همان پوششی می‌نشیند که موتور data-disabled را رویش می‌گذارد، نه روی تک‌تک فرزندان. گذاشتنِ opacity روی فرزندِ والدِ از پیش کم‌رنگ‌شده ضرب می‌شود و به یک‌چهارم می‌رسد، که خراب به نظر می‌رسد نه غیرفعال.",
        "en-US":
          "The dimming sits on the wrapper the engine marks with data-disabled, not on each child. Stacking an opacity on a child of an already-dimmed parent multiplies to a quarter and reads as broken rather than as disabled.",
      },
      render: DisabledExample,
    },
  ],
};
