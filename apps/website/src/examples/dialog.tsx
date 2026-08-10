import type { Locale } from "@lumo-ui/core";
import {
  Button,
  Dialog,
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
 * TRIGGER — React Aria's Overlay returns null during SSR, so the modal itself
 * cannot contribute to the graded bytes (see demos.tsx's header).
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
            <p className="text-sm text-fg-muted">{t.dialogBody[l]}</p>
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
    <DialogTrigger>
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
              <p className="text-sm text-fg-muted">{t.quickNoteBody[l]}</p>
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
              <p className="text-sm text-fg-muted">{t.releaseNotesBody[l]}</p>
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
            <div className="flex flex-col gap-3">
              {Array.from({ length: 10 }, (_, i) => (
                <p key={i} className="text-sm text-fg-muted">
                  {t.termsParagraph[l]}
                </p>
              ))}
            </div>
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
      `        <DialogHeading>…</DialogHeading>`,
      `        …`,
      `      </Dialog>`,
      `    </DialogModal>`,
      `  </DialogOverlay>`,
      `</DialogTrigger>`,
    ].join("\n"),
    parts: [
      {
        name: "DialogTrigger",
        description: {
          "fa-IR": "جفت‌کنندهٔ دکمه و پنجره؛ تنها چیزی که در نخستین بایت هست خود دکمه است.",
          "en-US": "Pairs the button with the window; the button is all that exists in the first byte.",
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
          "fa-IR": "عنوانی که با slot به aria-labelledby پنجره وصل می‌شود.",
          "en-US": "The heading, slot-wired into the dialog's aria-labelledby.",
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
        "fa-IR": "فیلدها درون گفت‌وگو همان فیلدهای همیشگی‌اند؛ برچسب هر کدام همچنان اجباری است.",
        "en-US": "Fields inside a dialog are the ordinary fields; each label is still required.",
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
