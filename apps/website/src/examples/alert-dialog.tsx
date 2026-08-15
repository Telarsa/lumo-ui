import type { Locale } from "@lumo-ui/core";
import {
  AlertDialog,
  Button,
  DialogModal,
  DialogOverlay,
  DialogTrigger,
} from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the alert-dialog page. Contract: `_system/types.ts`.
 *
 * A SERVER module. `alert-dialog.tsx` carries `"use client"`, but every prop
 * this page passes is a string or a variant name — `onConfirm` is optional and
 * is deliberately not used here — so the whole page prerenders and there is no
 * island.
 *
 * ── WHAT IS AND IS NOT IN THE SERVED BYTES ──────────────────────────────────
 *
 * The buttons below. Nothing else. A closed overlay renders `null`, so the
 * title, the question, both verbs and the `role="alertdialog"` are ABSENT from
 * the first byte — which `packages/core/src/strings.ts` records as a real
 * measurement error rather than a curiosity: a first-byte sweep scores an
 * overlay's strings clean whether they are clean or not. So this page shows
 * triggers, and says so, instead of pretending the panel is on screen.
 *
 * ── THE THING THAT IS WORTH DEMONSTRATING ANYWAY ────────────────────────────
 *
 * `title`, `confirmLabel` and `cancelLabel` are all REQUIRED, and the reason is
 * the component's own: an alert dialog has no ✕ and takes no `closeLabel`,
 * because three exits from a two-way question is one more than the question has
 * answers. The two verbs ARE the exits, so they cannot be optional, and they
 * cannot be «بله»/«خیر» either — a reader who arrives at the confirm button
 * mid-sentence has to hear what pressing it does.
 *
 * And do not pass `isDismissable` to the overlay of one of these. Passing
 * nothing means not dismissable, which is React Aria's own default restored by
 * `dialog.tsx`; a scrim click that quietly picks "cancel" is the answer the
 * reader did not give.
 */

const t = {
  deleteInvoice: { "fa-IR": "حذف فاکتور", "en-US": "Delete invoice" },
  deleteInvoiceBody: {
    "fa-IR":
      "فاکتور و همهٔ ردیف‌هایش برداشته می‌شوند. این کار بازگشتی ندارد.",
    "en-US": "The invoice and all of its lines are removed. This cannot be undone.",
  },
  deleteVerb: { "fa-IR": "حذف کن", "en-US": "Delete it" },
  cancel: { "fa-IR": "انصراف", "en-US": "Cancel" },

  publish: { "fa-IR": "انتشار فهرست قیمت", "en-US": "Publish the price list" },
  publishBody: {
    "fa-IR":
      "فهرست برای همهٔ مشتریان دیده می‌شود و اعلان قیمت جدید فرستاده می‌شود.",
    "en-US":
      "The list becomes visible to every customer and a new-price notice goes out.",
  },
  publishVerb: { "fa-IR": "منتشر کن", "en-US": "Publish it" },
  later: { "fa-IR": "بعداً", "en-US": "Not yet" },
  reviewAgain: { "fa-IR": "بازبینی دوباره", "en-US": "Review it again" },

  leaveDraft: { "fa-IR": "خروج از پیش‌نویس", "en-US": "Leave the draft" },
  leaveDraftTitle: { "fa-IR": "پیش‌نویس ذخیره نشده", "en-US": "The draft is unsaved" },
  leaveDraftBody: {
    "fa-IR":
      "اگر بیرون بروید، متنی که نوشته‌اید نگه داشته نمی‌شود. کلیک روی پس‌زمینه اینجا کاری نمی‌کند — پرسش باید پاسخ داده شود.",
    "en-US":
      "Leaving does not keep what you have written. A click on the scrim does nothing here — the question has to be answered.",
  },
  discard: { "fa-IR": "دور بریز", "en-US": "Discard it" },
  keepWriting: { "fa-IR": "به نوشتن برگرد", "en-US": "Keep writing" },

  revoke: { "fa-IR": "لغو دسترسی", "en-US": "Revoke access" },
  revokeTitle: { "fa-IR": "لغو دسترسی سمیرا محمدی", "en-US": "Revoke Samira Mohammadi's access" },
  revokeBody: {
    "fa-IR":
      "دسترسی او به فضای کاری همین حالا بسته می‌شود. پرونده‌هایی که ساخته دست‌نخورده می‌مانند.",
    "en-US":
      "Her access to the workspace closes immediately. The files she created stay where they are.",
  },
  revokeVerb: { "fa-IR": "دسترسی را ببند", "en-US": "Close the access" },
  keepAccess: { "fa-IR": "باز بماند", "en-US": "Leave it open" },
} satisfies Record<string, LocalizedText>;

function CriticalExample(l: Locale) {
  return (
    <DialogTrigger>
      <Button variant="critical">{t.deleteInvoice[l]}</Button>
      <DialogOverlay>
        <DialogModal size="sm">
          <AlertDialog
            tone="critical"
            title={t.deleteInvoice[l]}
            confirmLabel={t.deleteVerb[l]}
            cancelLabel={t.cancel[l]}
          >
            <p className="text-sm text-fg-muted">{t.deleteInvoiceBody[l]}</p>
          </AlertDialog>
        </DialogModal>
      </DialogOverlay>
    </DialogTrigger>
  );
}

function AccentExample(l: Locale) {
  return (
    <DialogTrigger>
      <Button variant="outline">{t.publish[l]}</Button>
      <DialogOverlay>
        <DialogModal size="sm">
          <AlertDialog
            title={t.publish[l]}
            confirmLabel={t.publishVerb[l]}
            cancelLabel={t.later[l]}
          >
            <p className="text-sm text-fg-muted">{t.publishBody[l]}</p>
          </AlertDialog>
        </DialogModal>
      </DialogOverlay>
    </DialogTrigger>
  );
}

function NotDismissableExample(l: Locale) {
  return (
    <DialogTrigger>
      <Button variant="outline">{t.leaveDraft[l]}</Button>
      <DialogOverlay>
        <DialogModal size="sm">
          <AlertDialog
            tone="critical"
            title={t.leaveDraftTitle[l]}
            confirmLabel={t.discard[l]}
            cancelLabel={t.keepWriting[l]}
          >
            <p className="text-sm text-fg-muted">{t.leaveDraftBody[l]}</p>
          </AlertDialog>
        </DialogModal>
      </DialogOverlay>
    </DialogTrigger>
  );
}

function VerbsExample(l: Locale) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <DialogTrigger>
        <Button variant="critical">{t.revoke[l]}</Button>
        <DialogOverlay>
          <DialogModal size="sm">
            <AlertDialog
              tone="critical"
              title={t.revokeTitle[l]}
              confirmLabel={t.revokeVerb[l]}
              cancelLabel={t.keepAccess[l]}
            >
              <p className="text-sm text-fg-muted">{t.revokeBody[l]}</p>
            </AlertDialog>
          </DialogModal>
        </DialogOverlay>
      </DialogTrigger>
      <DialogTrigger>
        <Button variant="outline">{t.publish[l]}</Button>
        <DialogOverlay>
          <DialogModal size="md">
            <AlertDialog
              title={t.publish[l]}
              confirmLabel={t.publishVerb[l]}
              cancelLabel={t.reviewAgain[l]}
            >
              <p className="text-sm text-fg-muted">{t.publishBody[l]}</p>
            </AlertDialog>
          </DialogModal>
        </DialogOverlay>
      </DialogTrigger>
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "کنشی برگشت‌ناپذیر یا پرهزینه در راه است — حذف، خروج بدون ذخیره — و کاربر باید آگاهانه تأیید کند. دکمهٔ تأیید همان فعل است، نه «بله».",
        "en-US": "An irreversible or costly action is about to happen — delete, leave without saving — and the user must confirm knowingly. The confirm button is the verb, not “Yes”.",
      },
      whenNot: {
        "fa-IR": "تأیید ساده‌ای است که پیامدی ندارد؛ کنش را انجام دهید و با `Toast` امکان بازگشت بدهید. برای فرم یا محتوای بیشتر، `Dialog`.",
        "en-US": "It is a harmless confirmation; do the action and offer undo with a `Toast`. For a form or more content, `Dialog`.",
      },
    },
    tier: "overlay",
    title: { "fa-IR": "گفت‌وگوی هشدار", "en-US": "Alert dialog" },
    intro: {
      "fa-IR":
        "گفت‌وگویی که کار را قطع می‌کند تا یک تصمیم گرفته شود و دقیقاً دو راه بیرون‌رفت می‌گذارد. ✕ ندارد و closeLabel نمی‌گیرد: سه راه خروج برای پرسشی که دو پاسخ دارد یکی زیادی است. در عوض هر دو فعلِ تصمیم اجباری‌اند، چون همان‌ها راه‌های خروج‌اند. isDismissable را به پوششش ندهید — کلیک روی پس‌زمینه پاسخی است که خواننده نداده. آنچه در بایت اول هست فقط دکمهٔ بازکننده است؛ پنل بسته null است.",
      "en-US":
        "A dialog that interrupts to force a decision and offers exactly two ways out. It has no ✕ and takes no `closeLabel`: three exits from a two-answer question is one too many. Both verbs of the decision are required instead, because they ARE the exits. Do not give its overlay `isDismissable` — a scrim click is an answer the reader never gave. What exists in the first byte is the trigger alone; a closed panel is `null`.",
    },
    composition: [
      `<DialogTrigger>`,
      `  <Button variant="critical">…</Button>       ← all the first byte holds`,
      `  <DialogOverlay>                             ← pass NO isDismissable here`,
      `    <DialogModal size="sm">                   ← owns role="alertdialog"`,
      `      <AlertDialog title confirmLabel cancelLabel tone>`,
      `        …the question…                        ← wired to aria-describedby`,
      `      </AlertDialog>`,
      `    </DialogModal>`,
      `  </DialogOverlay>`,
      `</DialogTrigger>`,
    ].join("\n"),
    parts: [
      {
        name: "AlertDialog",
        description: {
          "fa-IR":
            "خودِ پرسش و دو فعلش. عنوان و هر دو فعل رشته‌های اجباری‌اند و نه اختیاری‌های دارای پیش‌فرض: این کتابخانه زبانی از خودش ندارد که در آن پیش‌فرض بگذارد. هیچ نقشی و هیچ aria-labelledby ای اینجا اعلام نمی‌شود — هر دو یک لایه بالاتر روی عنصری نشسته‌اند که تلهٔ فوکوس را دارد، وگرنه یک alertdialog داخل یک dialog می‌شد و اشتباهی‌اش اعلام می‌شد. فرزندان هم متنِ رها نیستند: به aria-describedby بسته می‌شوند تا پیامدِ کار پس از نام خوانده شود — عنوان فقط فعل است، و خواننده‌ای که تنها «حذف فاکتور» را می‌شنود، دارد چیزی را تأیید می‌کند که به او گفته نشده.",
          "en-US":
            "The question and its two verbs. The title and both verbs are REQUIRED strings rather than optional ones with defaults: this library has no language of its own to default them in. No role and no `aria-labelledby` is declared here — both moved one level up onto the element that owns the focus trap, or an `alertdialog` would sit nested inside a `dialog` and the wrong one would be announced. The children are not loose body text either: they are wired through the description part, so the CONSEQUENCE is announced after the name. The title is the verb — a reader who hears «حذف فاکتور» and nothing else is being asked to confirm something they have not been told.",
        },
      },
      {
        name: "DialogModal",
        description: {
          "fa-IR":
            "قابِ پنجره، و حالا عنصری که role=\"alertdialog\" را می‌گیرد. همان قاب گفت‌وگوی معمولی است با یک ویژگی بیشتر، پس اِی‌پی‌آی عمومی برای این جزء تغییری نکرد.",
          "en-US":
            "The window frame, and now the element that carries `role=\"alertdialog\"`. It is the ordinary dialog frame with one more attribute, which is why the public API for this part did not change.",
        },
      },
      {
        name: "DialogOverlay",
        description: {
          "fa-IR":
            "پس‌زمینهٔ تیره، و مرزِ پورتال. isDismissable از همین‌جا خوانده می‌شود و نبودش یعنی «بسته نمی‌شود» — پیش‌فرضی که برگردانده شد تا قاعدهٔ این پرونده به‌جای گفته‌شدن، اجرا شود.",
          "en-US":
            "The scrim, and the portal boundary. `isDismissable` is read from here and its absence means NOT dismissable — a default that was restored so this file's rule is enforced rather than merely stated.",
        },
      },
      {
        name: "DialogTrigger",
        description: {
          "fa-IR":
            "دارندهٔ حالتِ باز و بسته. تنها چیزی که در بایت اول رندر می‌شود فرزند اولش است، یعنی دکمه — و دکمه‌ای بی‌نام همان‌جا قاعدهٔ named-controls را می‌شکند، پیش از آنکه پرسشی وجود داشته باشد.",
          "en-US":
            "Owns the open state. The only thing it renders in the first byte is its first child, the button — and an unnamed trigger fails `named-controls` right there, before any question exists.",
        },
      },
      {
        name: "alertDialogFooterVariants",
        description: {
          "fa-IR":
            "ردیف دو فعل. ترتیبِ منبع «انصراف، سپس تأیید» است تا کنشِ بی‌خطر اول در ترتیب تب بیفتد، و justify-end فعلِ تأیید را به لبهٔ پایانِ خواندن می‌برد. هر دو ویژگی فلکس‌محورند، پس جفت خودش با زبان آینه می‌شود و چیزی فیزیکی برای اشتباه‌کردن نمانده.",
          "en-US":
            "The row of two verbs. Source order is cancel-then-confirm so the safe action comes first in tab order, while `justify-end` puts the confirming verb at the reading end. Both properties are flex-relative, so the pair mirrors with the locale on its own and there is nothing physical left to get wrong.",
        },
      },
    ],
  },
  examples: [
    {
      id: "critical",
      title: { "fa-IR": "تصمیمی که برگشت ندارد", "en-US": "A decision with no undo" },
      description: {
        "fa-IR":
          "tone=\"critical\" فقط دکمهٔ تأیید را قرمز می‌کند و هیچ چیز دیگری. رنگ تنها حاملِ معنا نیست: فعلِ «حذف کن» خودش می‌گوید چه اتفاقی می‌افتد، و همان است که یک صفحه‌خوان می‌شنود. باز که کنید ببینید ✕ ای نیست و کلیک روی پس‌زمینه هم آن را نمی‌بندد.",
        "en-US":
          "`tone=\"critical\"` reddens the confirm button and nothing else. Colour is not the sole carrier of meaning: the verb «حذف کن» says what happens, and that is what a screen reader hears. Open it and note there is no ✕, and that a click on the scrim does not close it.",
      },
      render: CriticalExample,
    },
    {
      id: "accent",
      title: { "fa-IR": "هر هشداری چیزی را نابود نمی‌کند", "en-US": "Not every alert destroys something" },
      description: {
        "fa-IR":
          "بدون tone، دکمهٔ تأیید حالت پُررنگِ معمولی می‌گیرد. انتشار یک فهرست قیمت برگشت‌پذیر است و قرمزکردنش تنها کاری که می‌کند این است که قرمزِ حالتِ واقعاً خطرناک را کم‌ارزش کند.",
        "en-US":
          "With no `tone`, the confirm button takes the ordinary solid variant. Publishing a price list is reversible, and reddening it only devalues the red on the case that genuinely is not.",
      },
      render: AccentExample,
    },
    {
      id: "not-dismissable",
      title: { "fa-IR": "پس‌زمینه پاسخ نمی‌دهد", "en-US": "The scrim does not answer" },
      description: {
        "fa-IR":
          "این نمونه هیچ isDismissable ای نمی‌دهد، و همین است که نکته را می‌سازد: نبودنش یعنی بسته نمی‌شود. پیش‌تر نبودِ آن ویژگی به لطفِ موتورِ زیرین به «بسته می‌شود» ترجمه می‌شد و یک کلیکِ ناخواسته روی حاشیهٔ صفحه بی‌صدا «انصراف» را انتخاب می‌کرد. کلید گریز همچنان می‌بندد و این عمدی است — گریز یک کنشِ صریح است.",
        "en-US":
          "This example passes no `isDismissable` at all, and that IS the point: its absence means not dismissable. It used to resolve, via the engine underneath, to dismissable — so a stray click on the page margin silently chose «cancel». Escape still closes, deliberately: Escape is an explicit act.",
      },
      render: NotDismissableExample,
    },
    {
      id: "verbs",
      title: { "fa-IR": "فعل‌ها، نه «بله» و «خیر»", "en-US": "Verbs, not «yes» and «no»" },
      description: {
        "fa-IR":
          "دو پرسش کنار هم با چهار فعلِ متفاوت. کسی که با کلید تب وارد پنجره می‌شود اول به کنشِ بی‌خطر می‌رسد چون ترتیبِ منبع همان است، در حالی که فعلِ تأیید در لبهٔ پایانِ خواندن دیده می‌شود — راست در انگلیسی، چپ در فارسی — از یک کلاسِ فلکس، بدون هیچ املای فیزیکی.",
        "en-US":
          "Two questions side by side with four different verbs. Someone tabbing into the window reaches the safe action first because source order says so, while the confirming verb is SEEN at the reading end — right in English, left in Persian — from one flex class and no physical spelling.",
      },
      render: VerbsExample,
    },
  ],
};
