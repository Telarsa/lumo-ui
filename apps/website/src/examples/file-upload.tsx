import type { Locale } from "@lumo-ui/core";
import { FileUploadIsland, type UploadedFile } from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the file-upload page. Contract: `_system/types.ts`.
 *
 * Islands, and for a narrower reason than usual: the DROP AREA alone would
 * render from a server module, but every row of the list requires `onRemove` and
 * a `removeLabel` built from the file's own name — two functions per row. So the
 * pair travels together here. The copy lives in this file, in both locales.
 *
 * ── «BASE UI HAS NO PRIMITIVE» IS NOT ONE NUMBER ────────────────────────────
 *
 * Neither a drop zone nor a file trigger exists in the engine, and that reads
 * like the worst case in this batch. It is close to the best, and the difference
 * is worth separating from the headline, because the same sentence is true of
 * `tree.tsx` and means something completely different there:
 *
 *   - A TREE rents a STATE MACHINE — roving tabindex over a flattened visible
 *     order, typeahead in the reader's own script, expand and collapse bound to
 *     arrow keys that swap under right-to-left. None of that is in the platform.
 *   - A DROP AREA rents FOUR DOM EVENTS. `dragenter`, `dragover`, `dragleave`
 *     and `drop` are platform APIs, `<input type="file">` is a platform element,
 *     and clicking a hidden one is the pattern every custom file button has used
 *     for twenty years. No keyboard model, no focus order, no collection.
 *
 * ── AND BOTH OF THE PREVIOUS ENGINE'S ENGLISH LEAKS RETIRED ─────────────────
 *
 * The drop area used to NAME ITSELF in English from a bundle the repository's
 * own patch does not cover, so a Persian page with the patch applied and the
 * provider mounted still served an English name. And the file input had no
 * accessible name at all, because the engine filtered `aria-label` off it before
 * it reached the DOM. There is no bundle now and the input is written directly,
 * so both are gone — and the area is a `role="group"` rather than a hidden
 * button, which is what it actually is.
 *
 * The one genuine regression is stated on the last example: that hidden button
 * was itself a tab stop, so the area could receive a clipboard paste on its own.
 * Now something inside must be focused first.
 */

const t = {
  dropFiles: { "fa-IR": "کشیدن و رها کردن پرونده‌ها", "en-US": "Drag and drop your files" },
  chooseFile: { "fa-IR": "انتخاب پرونده", "en-US": "Choose a file" },
  removeWord: { "fa-IR": "حذف", "en-US": "Remove" },

  uploadHint: {
    "fa-IR": "تصویر یا سند چاپی، هرکدام تا ده مگابایت.",
    "en-US": "Images or printable documents, up to ten megabytes each.",
  },

  attachments: { "fa-IR": "پیوست‌های تیکت", "en-US": "Ticket attachments" },
  attachmentsHint: {
    "fa-IR": "می‌توانید تصویر را مستقیم از کلیپ‌بورد بچسبانید.",
    "en-US": "You can paste an image straight from the clipboard.",
  },

  avatar: { "fa-IR": "تصویر نمایه", "en-US": "Profile picture" },
  chooseImage: { "fa-IR": "انتخاب تصویر", "en-US": "Choose an image" },
  avatarHint: {
    "fa-IR": "فقط یک تصویر؛ انتخاب تازه جای قبلی را می‌گیرد.",
    "en-US": "One image only; a new choice replaces the previous one.",
  },

  locked: { "fa-IR": "مدارک تأییدشده", "en-US": "Approved documents" },
  lockedTrigger: { "fa-IR": "افزودن مدرک", "en-US": "Add a document" },
  lockedHint: {
    "fa-IR": "پس از تأیید کارشناس، مدارک قفل می‌شوند.",
    "en-US": "Once an assessor approves them, the documents are locked.",
  },

  persianReport: { "fa-IR": "گزارش سالانه.pdf", "en-US": "گزارش سالانه.pdf" },
  latinReport: { "fa-IR": "invoice-april.pdf", "en-US": "invoice-april.pdf" },
  screenshot: { "fa-IR": "نماگرفت میز کار.png", "en-US": "نماگرفت میز کار.png" },
  uploading: { "fa-IR": "در حال بارگذاری", "en-US": "Uploading" },
  uploaded: { "fa-IR": "بارگذاری شد", "en-US": "Uploaded" },
  failed: { "fa-IR": "بارگذاری ناموفق بود", "en-US": "Upload failed" },
  retry: { "fa-IR": "تلاش دوباره", "en-US": "Retry" },
  percent: { "fa-IR": "هفتاد و دو درصد", "en-US": "Seventy-two percent" },
} satisfies Record<string, LocalizedText>;

/**
 * Seeded rows, so the size formatter can be shown without anyone opening a file
 * picker. Sizes in BYTES, chosen to straddle the unit boundary: one just under a
 * megabyte, one just over, one small enough to stay in kilobytes.
 *
 * The names are deliberately mixed-script. A file name is the one string this
 * component cannot predict the direction of — a Latin one and a Persian one land
 * in the same list from the same picker — which is why each is isolated so the
 * extension cannot be dragged around the stem by the row's own direction.
 */
function seeded(l: Locale): readonly UploadedFile[] {
  return [
    { name: t.persianReport[l], size: 1_248_000 },
    { name: t.latinReport[l], size: 862_400 },
    { name: t.screenshot[l], size: 91_500 },
  ];
}

function DropAreaExample(l: Locale) {
  return (
    <FileUploadIsland
      locale={l}
      label={t.dropFiles[l]}
      triggerLabel={t.chooseFile[l]}
      hint={t.uploadHint[l]}
      removeWord={t.removeWord[l]}
      acceptedFileTypes={["image/*", "application/pdf"]}
      allowsMultiple
    />
  );
}

function SizeUnitExample(l: Locale) {
  return (
    <FileUploadIsland
      locale={l}
      label={t.attachments[l]}
      triggerLabel={t.chooseFile[l]}
      removeWord={t.removeWord[l]}
      allowsMultiple
      initialFiles={seeded(l)}
    />
  );
}

function SingleFileExample(l: Locale) {
  return (
    <FileUploadIsland
      locale={l}
      label={t.avatar[l]}
      triggerLabel={t.chooseImage[l]}
      hint={t.avatarHint[l]}
      removeWord={t.removeWord[l]}
      acceptedFileTypes={["image/png", "image/jpeg"]}
    />
  );
}

function LifecycleExample(l: Locale) {
  return (
    <FileUploadIsland
      locale={l}
      label={t.attachments[l]}
      triggerLabel={t.chooseFile[l]}
      hint={t.uploadHint[l]}
      removeWord={t.removeWord[l]}
      allowsMultiple
      maxFiles={5}
      maxFileSize={10_000_000}
      initialFiles={[
        {
          name: t.persianReport[l],
          size: 1_248_000,
          lifecycle: {
            status: "uploading",
            statusText: t.uploading[l],
            progress: 0.72,
            progressText: t.percent[l],
          },
        },
        {
          name: t.latinReport[l],
          size: 862_400,
          lifecycle: {
            status: "error",
            statusText: t.failed[l],
            actionLabel: t.retry[l],
            actionResultText: t.uploaded[l],
          },
        },
      ]}
    />
  );
}

function PasteExample(l: Locale) {
  return (
    <FileUploadIsland
      locale={l}
      label={t.attachments[l]}
      triggerLabel={t.chooseFile[l]}
      hint={t.attachmentsHint[l]}
      removeWord={t.removeWord[l]}
      allowsMultiple
    />
  );
}

function DisabledExample(l: Locale) {
  return (
    <FileUploadIsland
      locale={l}
      label={t.locked[l]}
      triggerLabel={t.lockedTrigger[l]}
      hint={t.lockedHint[l]}
      removeWord={t.removeWord[l]}
      isDisabled
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "form",
    title: { "fa-IR": "بارگذاری پرونده", "en-US": "File upload" },
    intro: {
      "fa-IR":
        "یک ناحیهٔ رها کردن، یک انتخابگرِ پرونده و فهرستِ آنچه انتخاب شده. ناحیه یک گروهِ نام‌دار است و نه یک دکمهٔ پنهان: هدفِ رها کردن برای کاربرِ صفحه‌کلید دکمه نیست — انتخابگر است، که دیده می‌شود، برچسب دارد و از پیش در ترتیبِ تب هست. اندازهٔ هر پرونده هم یک عدد است و واحدش هم: تنظیمِ پیش‌فرضِ قالب‌بندی روی صفحهٔ فارسی «۱٫۲ MB» می‌سازد — ارقام فارسی، واحدِ لاتین — و دروازه‌ای که ارقام را نمره می‌دهد از کنارش رد می‌شود.",
      "en-US":
        "A drop area, a file picker and the list of what was chosen. The area is a NAMED GROUP rather than a hidden button: a drop target is not a button for a keyboard user — the picker is, and it is visible, labelled and already in the tab order. A file's size is a number and so is its UNIT: the formatter's default produces «۱٫۲ MB» on a Persian page — Persian digits, Latin unit — and a gate that grades digits passes it.",
    },
    composition: [
      `<FileUpload`,
      `  label            ← REQUIRED: names the role="group" drop area`,
      `  onSelectFiles    ← called for dropped, picked AND pasted files alike`,
      `  acceptedFileTypes maxFileSize maxFiles currentFileCount`,
      `  allowsMultiple isDisabled onRejectFiles>`,
      `  …the hint…       ← rendered only when there is one`,
      `</FileUpload>`,
      ``,
      `<FileUploadList>`,
      `  <FileUploadItem name size locale lifecycle removeLabel onRemove />`,
      `</FileUploadList>`,
    ].join("\n"),
    parts: [
      {
        name: "FileUpload",
        description: {
          "fa-IR":
            "ناحیهٔ رها کردن و انتخابگرش. شمارندهٔ عمقِ کشیدن یک عدد است و نه یک پرچمِ بولی، و این همان باگی است که هر ناحیهٔ رها کردنِ دست‌نویس با خود می‌آورد: رویدادِ ترکِ کشیدن وقتی هم شلیک می‌شود که اشاره‌گر واردِ یک فرزند شود، پس پرچم هر بار که کشیدن از روی آیکون یا متنِ راهنما رد شود خاموش می‌شود و برجستگی چشمک می‌زند. جلوگیری از رفتارِ پیش‌فرض هم روی هر رویدادِ حرکت لازم است و نه فقط اولی، وگرنه رویدادِ رها کردن اصلاً شلیک نمی‌شود.",
          "en-US":
            "The drop area and its picker. The drag depth is a COUNTER rather than a boolean flag, and that is the bug every hand-written drop zone ships: `dragleave` fires when the pointer crosses into a CHILD, so a flag flickers off every time the drag passes over the icon or the hint and the highlight strobes. Preventing the default is likewise needed on EVERY `dragover` and not just the first, or the drop event never fires at all.",
        },
      },
      {
        name: "FileUploadList",
        description: {
          "fa-IR":
            "فهرستِ پرونده‌های انتخاب‌شده، و یک فهرستِ واقعی: شمارش آن‌وقت رایگان در درختِ دسترس‌پذیری هست و صفحه‌خوان آن را به زبانِ خودش می‌گوید، به‌جای رشته‌ای که این کتابخانه باید بخواهد و قالب‌بندی کند. ارزان‌ترین پاسخِ درست به «چند پرونده پیوست کردم».",
          "en-US":
            "The list of chosen files, and a REAL list: the count is then in the accessibility tree for free and a screen reader announces it in its own language, rather than through a string this library would have to require and format. The cheapest correct answer to «how many files did I attach».",
        },
      },
      {
        name: "FileUploadItem",
        description: {
          "fa-IR":
            "یک سطر. نامِ پرونده در یک عنصرِ جداسازِ دوجهته می‌نشیند و نه در یک span، چون این تنها رشته‌ای است که این جزء نمی‌تواند خطش را پیش‌بینی کند؛ جهتِ خودکارِ آن عنصر جهتِ هر نام را از اولین نویسهٔ قویِ خودش می‌گیرد، و span برهنه پسوند را به شکلِ کلاسیکِ دوجهته از تنه جدا می‌کند. سایز هم پیش از رسیدن به جِی‌اِس‌اِکس یک رشته است، و همین است که از قاعدهٔ گرهِ لومو ردش می‌کند — نوشتنِ عددِ خام اینجا همان چیزی بود که هفتادوهفت خانهٔ لاتینِ تقویم را فرستاد.",
          "en-US":
            "One row. The file name sits in a bidirectional isolate rather than a span, because it is the one string whose script this component cannot predict; the isolate's automatic direction derives each name's own from its first strong character, and a bare span separates the extension from the stem in the classic bidi way. The size is a STRING by the time it reaches JSX, which is also what gets it past the `LumoNode` rule — a raw number here is the file-upload spelling of the one that shipped 77 Latin calendar cells.",
        },
      },
    ],
  },
  examples: [
    {
      id: "drop-area",
      title: { "fa-IR": "کشیدن، انتخاب‌کردن، چسباندن", "en-US": "Drop, pick, paste" },
      description: {
        "fa-IR":
          "پرونده‌ای را روی جعبه بکشید و اشاره‌گر را از روی آیکون رد کنید: برجستگی چشمک نمی‌زند، چون ورود و خروج شمرده می‌شوند و نه با یک پرچم دنبال. بعد همان پرونده را دو بار پشت‌سرِهم از انتخابگر بردارید — بارِ دوم هم شلیک می‌شود، چون مقدارِ ورودی پس از هر بار پاک می‌شود.",
        "en-US":
          "Drag a file over the box and pass the pointer across the icon: the highlight does not strobe, because enters and leaves are COUNTED rather than tracked with a flag. Then pick the same file twice in a row from the picker — the second attempt still fires, because the input's value is cleared after each one.",
      },
      render: DropAreaExample,
    },
    {
      id: "size-unit",
      title: { "fa-IR": "یک اندازه، و واحدش", "en-US": "A size, and its unit" },
      description: {
        "fa-IR":
          "سه سطر که مرزِ واحد را قیچی می‌کنند: یکی کمی زیر یک مگابایت، یکی کمی بالای آن، یکی به‌قدری کوچک که کیلوبایت بماند. واحد هم به زبانِ خواننده نوشته می‌شود و نه به‌صورت دو حرفِ لاتینِ چسبیده به رقمِ فارسی. نام‌ها هم عمداً دوخطی‌اند: نامِ لاتین و نامِ فارسی در یک فهرست، هرکدام جهتِ خودشان را نگه می‌دارند و پسوند از تنه جدا نمی‌افتد.",
        "en-US":
          "Three rows that straddle the unit boundary: one just under a megabyte, one just over, one small enough to stay in kilobytes. The unit is written in the reader's language rather than as two Latin letters glued to a Persian digit. The names are deliberately mixed-script too: a Latin name and a Persian one in one list, each keeping its own direction with the extension never separated from the stem.",
      },
      render: SizeUnitExample,
    },
    {
      id: "single-file",
      title: { "fa-IR": "فقط یک پرونده", "en-US": "One file only" },
      description: {
        "fa-IR":
          "بدون اجازهٔ چندتایی، انتخابگرِ سیستم یک پرونده می‌گیرد و انتخابِ تازه جای قبلی را می‌گیرد. قانونِ نوع روی هر سه مسیرِ انتخاب، رهاکردن و چسباندن اجرا می‌شود؛ پروندهٔ ناسازگار به onRejectFiles می‌رود و هرگز به فهرستِ پذیرفته‌شده نمی‌رسد.",
        "en-US":
          "Without the multiple flag the system picker takes one file and a new choice replaces the previous one. Type rules run across picker, drop and paste alike; an incompatible file reaches `onRejectFiles` and never enters the accepted list.",
      },
      render: SingleFileExample,
    },
    {
      id: "lifecycle",
      title: { "fa-IR": "چرخهٔ بارگذاری", "en-US": "Upload lifecycle" },
      description: {
        "fa-IR":
          "یک ردیف در حال پیشرفت است و مقدار دیداری و aria-valuetext نوشته‌شده دارد؛ ردیف دیگر خطا و عملِ تلاش دوباره را در همان وضعیت نشان می‌دهد. وضعیت فقط رنگ نیست و در ناحیهٔ زنده هم گفته می‌شود.",
        "en-US":
          "One row is progressing with authored visible and `aria-valuetext` copy; another exposes an error and retry action in the same state. Status is not carried by color alone and is also spoken through a live region.",
      },
      render: LifecycleExample,
    },
    {
      id: "paste",
      title: { "fa-IR": "چسباندن، و یک پس‌رفتِ نوشته‌شده", "en-US": "Pasting, and a recorded regression" },
      description: {
        "fa-IR":
          "با کلید تب روی «انتخاب پرونده» بایستید و تصویری را از کلیپ‌بورد بچسبانید: رویدادِ چسباندن حباب می‌کند، پس ظرف آن را از هر نواده‌ای که فوکوس داشته باشد می‌گیرد. این باریک‌تر از قبل است و صادقانه نوشته می‌شود: پیش‌تر یک دکمهٔ پنهان خودش ایستِ تب بود و کلِ ناحیه می‌توانست بی‌آنکه چیزی درونش فوکوس داشته باشد چسباندن را بگیرد.",
        "en-US":
          "Tab onto «Choose a file» and paste an image from the clipboard: the paste event BUBBLES, so the container catches it from any focusable descendant. This is narrower than before and is written down rather than presented as parity: the previous engine's hidden button was itself a tab stop, so the whole area could receive a paste with nothing inside it focused.",
      },
      render: PasteExample,
    },
    {
      id: "disabled",
      title: { "fa-IR": "قفل‌شده", "en-US": "Locked" },
      description: {
        "fa-IR":
          "ناحیه رها کردن را رد می‌کند، انتخابگر غیرفعال است و چسباندن هم کاری نمی‌کند — هر سه مسیر یک بار بررسی می‌شوند و نه فقط آنکه دیده می‌شود. ناحیه همچنان نام دارد و همچنان یک گروه است، چون کنترلِ غیرفعال از درختِ دسترس‌پذیری بیرون نمی‌رود.",
        "en-US":
          "The area refuses drops, the picker is disabled and pasting does nothing — all three routes are checked rather than only the visible one. The area keeps its name and is still a group, because a disabled control does not leave the accessibility tree.",
      },
      render: DisabledExample,
    },
  ],
};
