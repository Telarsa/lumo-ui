import type { Locale } from "@lumo-ui/core";
import {
  Button,
  Dialog,
  DialogDescription,
  DialogHeading,
  DialogModal,
  DialogOverlay,
  DialogTrigger,
  TextField,
} from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the dialog page. Contract: `_system/types.ts` — each
 * render is a named top-level function so the loader can slice its source.
 *
 * Like every overlay demo on this site, what exists in the first byte is the
 * TRIGGER — a closed Base UI Dialog renders nothing at all, so the modal itself
 * cannot contribute to the graded bytes (see demos.tsx's header).
 *
 * Every body paragraph here is a `DialogDescription` rather than a hand-written
 * `<p className="text-sm text-fg-muted">`. That is not a styling tidy-up: the
 * part publishes the paragraph's id into the dialog's `aria-describedby`, and
 * the hand-written version — which is what these examples used to show, and
 * therefore what every reader copied — was announced to nobody.
 */

const t = {
  editProfile: { "fa-IR": "ویرایش پروفایل", "en-US": "Edit profile" },
  dialogBody: {
    "fa-IR": "نام و نشانی ایمیل شما برای دیگر اعضای فضای کاری دیده می‌شود.",
    "en-US": "Your name and email address are visible to everyone in the workspace.",
  },
  close: { "fa-IR": "بستن", "en-US": "Close" },
  cancel: { "fa-IR": "انصراف", "en-US": "Cancel" },
  save: { "fa-IR": "ذخیره", "en-US": "Save" },
  fullName: { "fa-IR": "نام و نام خانوادگی", "en-US": "Full name" },
  email: { "fa-IR": "ایمیل", "en-US": "Email" },
  small: { "fa-IR": "کوچک", "en-US": "Small" },
  large: { "fa-IR": "بزرگ", "en-US": "Large" },
  quickNote: { "fa-IR": "یادداشت کوتاه", "en-US": "Quick note" },
  quickNoteBody: {
    "fa-IR": "برای تصمیم‌های کوچک، قاب کوچک؛ پنجره نباید از محتوایش بزرگ‌تر باشد.",
    "en-US": "A small frame for a small decision; the window should not outgrow its content.",
  },
  releaseNotes: { "fa-IR": "یادداشت‌های انتشار", "en-US": "Release notes" },
  releaseNotesBody: {
    "fa-IR": "قاب بزرگ برای محتوای خواندنی؛ پهنا محدود می‌ماند تا سطر از حد خواندن بلندتر نشود.",
    "en-US": "The large frame suits readable content; width stays capped so lines stay readable.",
  },
  terms: { "fa-IR": "شرایط استفاده", "en-US": "Terms of use" },
  termsParagraph: {
    "fa-IR": "این بند برای نمایش پیمایش تکرار شده است: بدنهٔ گفت‌وگو با سقف ارتفاع خودش می‌پیماید و صفحهٔ پشت آن ثابت می‌ماند.",
    "en-US": "This paragraph repeats to show scrolling: the dialog body scrolls inside its own height cap while the page behind stays still.",
  },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <DialogTrigger>
      <Button>{t.editProfile[l]}</Button>
      <DialogOverlay>
        <DialogModal size="md">
          <Dialog closeLabel={t.close[l]}>
            <DialogHeading>{t.editProfile[l]}</DialogHeading>
            <DialogDescription>{t.dialogBody[l]}</DialogDescription>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" slot="close">
                {t.cancel[l]}
              </Button>
              <Button slot="close">{t.save[l]}</Button>
            </div>
          </Dialog>
        </DialogModal>
      </DialogOverlay>
    </DialogTrigger>
  );
}

function FormExample(l: Locale) {
  return (
    /*
     * `isKeyboardDismissDisabled` sits on the TRIGGER, because the trigger is
     * the state owner — the overlay and the panel cannot reach the dismissal
     * machinery and used to accept this prop and do nothing with it.
     *
     * It is on the FORM example specifically: this is the dialog where Escape
     * throws away typing the reader cannot get back. The ✕ and «انصراف» still
     * close it, so the exit is never blocked, only made deliberate.
     */
    <DialogTrigger isKeyboardDismissDisabled>
      <Button variant="outline">{t.editProfile[l]}</Button>
      <DialogOverlay>
        <DialogModal size="md">
          <Dialog closeLabel={t.close[l]}>
            <DialogHeading>{t.editProfile[l]}</DialogHeading>
            <div className="flex flex-col gap-4">
              <TextField label={t.fullName[l]} />
              <TextField label={t.email[l]} type="email" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" slot="close">
                {t.cancel[l]}
              </Button>
              <Button slot="close">{t.save[l]}</Button>
            </div>
          </Dialog>
        </DialogModal>
      </DialogOverlay>
    </DialogTrigger>
  );
}

function SizesExample(l: Locale) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <DialogTrigger>
        <Button variant="outline">{t.small[l]}</Button>
        <DialogOverlay>
          <DialogModal size="sm">
            <Dialog closeLabel={t.close[l]}>
              <DialogHeading>{t.quickNote[l]}</DialogHeading>
              <DialogDescription>{t.quickNoteBody[l]}</DialogDescription>
            </Dialog>
          </DialogModal>
        </DialogOverlay>
      </DialogTrigger>
      <DialogTrigger>
        <Button variant="outline">{t.large[l]}</Button>
        <DialogOverlay>
          <DialogModal size="lg">
            <Dialog closeLabel={t.close[l]}>
              <DialogHeading>{t.releaseNotes[l]}</DialogHeading>
              <DialogDescription>{t.releaseNotesBody[l]}</DialogDescription>
            </Dialog>
          </DialogModal>
        </DialogOverlay>
      </DialogTrigger>
    </div>
  );
}

function ScrollingExample(l: Locale) {
  return (
    <DialogTrigger>
      <Button variant="outline">{t.terms[l]}</Button>
      <DialogOverlay>
        <DialogModal size="md">
          <Dialog closeLabel={t.close[l]}>
            <DialogHeading>{t.terms[l]}</DialogHeading>
            {/*
              * `render={<div />}`: the description here is ten paragraphs, and
              * a `<p>` inside the part's default `<p>` is invalid HTML that
              * browsers repair by splitting the paragraph.
              */}
            <DialogDescription render={<div />} className="flex flex-col gap-3">
              {Array.from({ length: 10 }, (_, i) => (
                <p key={i}>{t.termsParagraph[l]}</p>
              ))}
            </DialogDescription>
            <div className="flex justify-end">
              <Button slot="close">{t.close[l]}</Button>
            </div>
          </Dialog>
        </DialogModal>
      </DialogOverlay>
    </DialogTrigger>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    composition: [
      `<DialogTrigger>`,
      `  <Button>…</Button>`,
      `  <DialogOverlay>`,
      `    <DialogModal size="…">`,
      `      <Dialog closeLabel="…">`,
      `        <DialogHeading>…</DialogHeading>       ← aria-labelledby`,
      `        <DialogDescription>…</DialogDescription>  ← aria-describedby`,
      `      </Dialog>`,
      `    </DialogModal>`,
      `  </DialogOverlay>`,
      `</DialogTrigger>`,
    ].join("\n"),
    parts: [
      {
        name: "DialogTrigger",
        description: {
          "fa-IR":
            "جفت‌کنندهٔ دکمه و پنجره؛ تنها چیزی که در نخستین بایت هست خود دکمه است. صاحبِ وضعیت هم همین است، پس isKeyboardDismissDisabled اینجاست و نه روی پس‌زمینه یا قاب — همان دلیلی که PopoverTrigger دارد. کشو هم از همین‌جا آن را می‌گیرد.",
          "en-US":
            "Pairs the button with the window; the button is all that exists in the first byte. It is also the state owner, so `isKeyboardDismissDisabled` lives here rather than on the backdrop or the frame — `PopoverTrigger`'s reason exactly. The drawer takes it from here too.",
        },
      },
      {
        name: "DialogOverlay",
        description: {
          "fa-IR": "پس‌زمینهٔ مودال؛ بسته‌شدن با کلیک بیرون، تصمیمِ همین لایه است.",
          "en-US": "The modal backdrop; dismiss-on-outside-press is this layer's decision.",
        },
      },
      {
        name: "DialogModal",
        description: {
          "fa-IR": "قاب پنجره با چهار اندازه؛ ورود و خروجش انیمیشن قابل‌خاموشی دارد.",
          "en-US": "The window frame in four sizes; its enter/exit animation honours reduced motion.",
        },
      },
      {
        name: "Dialog",
        description: {
          "fa-IR": "سطح محاوره؛ نام دکمهٔ بستن ویژگی اجباری است چون یک ✕ نام نیست.",
          "en-US": "The dialog surface; the close button's name is required because an ✕ is not a name.",
        },
      },
      {
        name: "DialogHeading",
        description: {
          "fa-IR":
            "عنوان پنجره، که شناسه‌اش را در انبارهٔ ریشه می‌نویسد و پنجره آن را به aria-labelledby خود می‌بندد.",
          "en-US":
            "The dialog's heading; it writes its id into the root store and the popup binds it to aria-labelledby.",
        },
      },
      {
        name: "DialogDescription",
        description: {
          "fa-IR":
            "متن پشتیبان پنجره، و رشته‌ای که پس از نام خوانده می‌شود. تا پیش از این هیچ‌چیز aria-describedby را منتشر نمی‌کرد، پس پنجره نامش را می‌گفت و بعد سکوت — و همان جملهٔ بعدی دلیلِ وقفه بود. اجباری نیست، چون این متن دیده می‌شود و نبودنش سوراخی است که مرورگرِ داور می‌بیند؛ برای محتوای بلوکی render={<div />} بدهید.",
          "en-US":
            "The dialog's supporting prose, and the string read AFTER the name. Nothing published aria-describedby before it, so a dialog announced its title and then silence — while the next sentence was the whole reason it interrupted. It is not required: this text is VISIBLE, so its absence is a hole a reviewer can see, and plenty of dialogs are a heading plus a form. Pass render={<div />} for block content.",
        },
      },
    ],
  },
  examples: [
    {
      id: "basic",
      title: { "fa-IR": "پایه", "en-US": "Basic" },
      description: {
        "fa-IR": "چهار لایه، هر کدام یک مسئولیت؛ دکمه‌های دارای slot بستن را خودشان انجام می‌دهند.",
        "en-US": "Four layers, one responsibility each; buttons with the close slot dismiss it themselves.",
      },
      render: BasicExample,
    },
    {
      id: "form",
      title: { "fa-IR": "با فرم", "en-US": "With a form" },
      description: {
        "fa-IR":
          "فیلدها درون گفت‌وگو همان فیلدهای همیشگی‌اند؛ برچسب هر کدام همچنان اجباری است. اینجا isKeyboardDismissDisabled روی DialogTrigger نشسته است — کلید گریز نوشته‌های نیمه‌تمام را دور نمی‌ریزد، ولی ✕ و انصراف همچنان می‌بندند.",
        "en-US":
          "Fields inside a dialog are the ordinary fields; each label is still required. `isKeyboardDismissDisabled` sits on `DialogTrigger` here — Escape no longer throws away half-finished typing, while the ✕ and Cancel still close it.",
      },
      render: FormExample,
    },
    {
      id: "sizes",
      title: { "fa-IR": "اندازه‌ها", "en-US": "Sizes" },
      description: {
        "fa-IR": "اندازه روی DialogModal می‌نشیند؛ محتوا قاب را انتخاب می‌کند، نه برعکس.",
        "en-US": "Size sits on DialogModal; the content picks the frame, not the other way around.",
      },
      render: SizesExample,
    },
    {
      id: "scrolling",
      title: { "fa-IR": "محتوای بلند", "en-US": "Long content" },
      description: {
        "fa-IR": "بدنه درون سقف ارتفاع خودش می‌پیماید و صفحهٔ پشت گفت‌وگو ثابت می‌ماند.",
        "en-US": "The body scrolls inside its own height cap while the page behind stays put.",
      },
      render: ScrollingExample,
    },
  ],
};
