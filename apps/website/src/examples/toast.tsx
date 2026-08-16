import type { Locale } from "@lumo-ui/core";
import { ToastExampleIsland, type ToastButtonSpec } from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the toast page. Contract: `_system/types.ts`.
 *
 * ISLANDS, unavoidably: `ToastRegion.queue` is a live object with a
 * subscription list, and only plain objects cross into the RSC payload. The
 * copy lives HERE in both locales; the island holds the queues and the buttons.
 *
 * ── AND THE QUEUE BEING AN OBJECT IS THE POINT, NOT THE OBSTACLE ────────────
 *
 * `createToastQueue()` is called at MODULE SCOPE — outside React, outside any
 * component, with no context to reach for — so a fetch wrapper, a route
 * handler's error branch or a service-worker message can raise a toast without
 * being a React component. The island's `raiseToast` is exactly that: an
 * ordinary function that happens to add to a queue.
 *
 * ── WHAT IS IN THE SERVED BYTES ─────────────────────────────────────────────
 *
 * The buttons, and ONE empty landmark. A region with nothing queued renders a
 * single element, so the toast text below never reaches the first byte — the
 * same reason every overlay on this site is shown as its trigger, and the same
 * measurement error `packages/core/src/strings.ts` records: a first-byte sweep
 * scores an unopened surface clean whether it is or not.
 *
 * ── THE DEFAULT THAT HAD TO BE RESTORED AT THE ADAPTER ──────────────────────
 *
 * The engine's own `timeout` default is five seconds. Lumo has deliberately had
 * NO default: an auto-dismissing toast is a moving target under WCAG 2.2.1, and
 * anything a reader must act on should not have a fuse at all. Adopting the
 * store as-is would have given every existing `toasts.add(…)` call in every
 * consuming project a five-second timer with nothing red anywhere, so
 * `createToastQueue` passes the engine's "never auto-dismiss" value when the
 * caller gives none.
 */

const t = {
  regionSaved: { "fa-IR": "اعلان‌های ذخیره‌سازی", "en-US": "Save notifications" },
  regionTones: { "fa-IR": "اعلان‌های وضعیت", "en-US": "Status notifications" },
  regionTimeout: { "fa-IR": "اعلان‌های زمان‌دار", "en-US": "Timed notifications" },
  regionPlacement: { "fa-IR": "اعلان‌های گوشهٔ آغاز", "en-US": "Leading-corner notifications" },
  close: { "fa-IR": "بستن", "en-US": "Close" },

  saveTrigger: { "fa-IR": "ذخیرهٔ پیش‌نویس", "en-US": "Save the draft" },
  saveTitle: { "fa-IR": "پیش‌نویس ذخیره شد", "en-US": "The draft was saved" },
  saveBody: {
    "fa-IR": "نسخهٔ تازه روی سرور نشست.",
    "en-US": "The new revision landed on the server.",
  },

  uploadTrigger: { "fa-IR": "بارگذاری پیوست", "en-US": "Upload the attachment" },
  uploadTitle: { "fa-IR": "پیوست بارگذاری شد", "en-US": "The attachment was uploaded" },

  failTrigger: { "fa-IR": "ذخیره با خطا", "en-US": "Save and fail" },
  failTitle: { "fa-IR": "ذخیره نشد", "en-US": "It was not saved" },
  failBody: {
    "fa-IR": "اتصال به سرور قطع شد. متن شما در همین صفحه مانده است.",
    "en-US": "The connection to the server dropped. Your text is still on this page.",
  },

  quotaTrigger: { "fa-IR": "هشدار سهمیه", "en-US": "Quota warning" },
  quotaTitle: { "fa-IR": "سهمیهٔ فضای شما رو به پایان است", "en-US": "Your storage quota is nearly used up" },
  quotaBody: {
    "fa-IR": "پیش از بارگذاری بعدی چند پرونده را پاک کنید.",
    "en-US": "Delete a few files before the next upload.",
  },

  infoTrigger: { "fa-IR": "خبر بی‌اهمیت", "en-US": "Something unimportant" },
  infoTitle: { "fa-IR": "همگام‌سازی انجام شد", "en-US": "The sync finished" },

  syncTrigger: { "fa-IR": "همگام‌سازی پس‌زمینه", "en-US": "Background sync" },
  syncTitle: { "fa-IR": "همگام‌سازی آغاز شد", "en-US": "The sync has started" },
  syncBody: {
    "fa-IR": "این پیام خودش می‌رود؛ کاری برای انجام‌دادن ندارد.",
    "en-US": "This one leaves on its own; there is nothing to act on.",
  },

  actionTrigger: { "fa-IR": "پیام ماندگار", "en-US": "A message that stays" },
  actionTitle: { "fa-IR": "کارت بانکی منقضی شده است", "en-US": "Your card has expired" },
  actionBody: {
    "fa-IR": "تا وقتی خودتان نبندیدش می‌ماند، چون کاری هست که باید انجام شود.",
    "en-US": "It stays until you close it, because there is something to do.",
  },

  cornerTrigger: { "fa-IR": "نمایش در گوشهٔ آغاز", "en-US": "Show in the leading corner" },
  cornerTitle: { "fa-IR": "گوشه با زبان جابه‌جا می‌شود", "en-US": "The corner moves with the language" },
  cornerBody: {
    "fa-IR": "پایین‌+آغاز در فارسی گوشهٔ پایین‌راست است و در انگلیسی پایین‌چپ.",
    "en-US": "«bottom start» is the bottom-right corner in Persian and the bottom-left in English.",
  },
} satisfies Record<string, LocalizedText>;

function savedButtons(l: Locale): readonly ToastButtonSpec[] {
  return [
    {
      key: "save",
      trigger: t.saveTrigger[l],
      title: t.saveTitle[l],
      description: t.saveBody[l],
      tone: "positive",
    },
    {
      key: "upload",
      trigger: t.uploadTrigger[l],
      title: t.uploadTitle[l],
      tone: "positive",
    },
  ];
}

function QueueExample(l: Locale) {
  return (
    <ToastExampleIsland
      locale={l}
      queueKey="queue"
      regionLabel={t.regionSaved[l]}
      closeLabel={t.close[l]}
      buttons={savedButtons(l)}
    />
  );
}

function TonesExample(l: Locale) {
  return (
    <ToastExampleIsland
      locale={l}
      queueKey="tones"
      regionLabel={t.regionTones[l]}
      closeLabel={t.close[l]}
      buttons={[
        {
          key: "fail",
          trigger: t.failTrigger[l],
          title: t.failTitle[l],
          description: t.failBody[l],
          tone: "critical",
        },
        {
          key: "quota",
          trigger: t.quotaTrigger[l],
          title: t.quotaTitle[l],
          description: t.quotaBody[l],
          tone: "caution",
        },
        {
          key: "info",
          trigger: t.infoTrigger[l],
          title: t.infoTitle[l],
        },
      ]}
    />
  );
}

function TimeoutExample(l: Locale) {
  return (
    <ToastExampleIsland
      locale={l}
      queueKey="timeout"
      regionLabel={t.regionTimeout[l]}
      closeLabel={t.close[l]}
      buttons={[
        {
          key: "sync",
          trigger: t.syncTrigger[l],
          title: t.syncTitle[l],
          description: t.syncBody[l],
          tone: "neutral",
          timeout: 5000,
        },
        {
          key: "expired",
          trigger: t.actionTrigger[l],
          title: t.actionTitle[l],
          description: t.actionBody[l],
          tone: "critical",
        },
      ]}
    />
  );
}

function PlacementExample(l: Locale) {
  return (
    <ToastExampleIsland
      locale={l}
      queueKey="placement"
      placement="bottom-start"
      regionLabel={t.regionPlacement[l]}
      closeLabel={t.close[l]}
      buttons={[
        {
          key: "corner",
          trigger: t.cornerTrigger[l],
          title: t.cornerTitle[l],
          description: t.cornerBody[l],
        },
      ]}
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "پیام کوتاهی که پس از یک کنش می‌آید و خودش می‌رود: ذخیره شد، ارسال شد؛ با یک کنش برگشت در صورت نیاز.",
        "en-US": "A short message after an action that leaves on its own: saved, sent; with an undo action when needed.",
      },
      whenNot: {
        "fa-IR": "کاربر باید پیام را بخواند یا تصمیم بگیرد — `Alert` در صفحه یا `AlertDialog`. خطای یک میدان — همان‌جا کنار میدان.",
        "en-US": "The user must read it or decide — an inline `Alert` or an `AlertDialog`. A field's error — beside the field.",
      },
    },
    tier: "feedback",
    title: { "fa-IR": "اعلان گذرا", "en-US": "Toast" },
    intro: {
      "fa-IR":
        "پیام‌های کوتاهی که در گوشه‌ای روی هم می‌نشینند. صفِ آن‌ها یک شیءِ ساده در دامنهٔ ماژول است و نه یک قلاب، پس یک پوشندهٔ fetch یا شاخهٔ خطای یک مسیر هم می‌تواند اعلان بلند کند بی‌آنکه جزء ری‌اکتی باشد. ناحیه یک بار نزدیکِ ریشه سوار می‌شود و تا چیزی در صف نباشد فقط یک عنصرِ خالی است — پس متنِ هیچ اعلانی در بایت اول نیست. هیچ مهلتِ پیش‌فرضی هم وجود ندارد: مهلت را برای هر اعلان جداگانه بدهید.",
      "en-US":
        "Short messages that stack in a corner. Their queue is a plain module-scope object rather than a hook, so a fetch wrapper or a route handler's error branch can raise one without being a React component. The region mounts once near the root and is a single empty element until something is queued — so no toast text is in the first byte. There is no default timeout either: pass one per toast.",
    },
    composition: [
      `// module scope — outside React, so anything can raise one`,
      `export const toasts = createToastQueue({ maxVisibleToasts: 3 })`,
      ``,
      `// once, near the root`,
      `<ToastRegion queue locale label closeLabel placement />`,
      ``,
      `// anywhere at all`,
      `toasts.add({ title, description, tone }, { timeout })`,
    ].join("\n"),
    parts: [
      {
        name: "createToastQueue",
        description: {
          "fa-IR":
            "صف را می‌سازد، و همین‌جاست که پیش‌فرضِ مهلت برگردانده می‌شود. موتورِ زیرین مهلتِ پنج‌ثانیه‌ای دارد و پذیرفتنش یعنی هر فراخوانِ موجود در هر پروژه‌ای یک فتیلهٔ پنج‌ثانیه‌ای می‌گرفت، بی‌آنکه چیزی قرمز شود. آداپتور وقتی فراخواننده چیزی ندهد «هرگز خودبه‌خود بسته نشو» می‌فرستد. maxVisibleToasts هم تعیین می‌کند چند تا هم‌زمان دیده شوند و بقیه صبر می‌کنند.",
          "en-US":
            "Builds the queue, and this is where the timeout default is restored. The engine underneath defaults to five seconds, and adopting that would have given every existing call in every consuming project a five-second fuse with nothing red anywhere. The adapter sends the engine's «never auto-dismiss» value when the caller gives none. `maxVisibleToasts` decides how many are on screen at once; the rest wait.",
        },
      },
      {
        name: "ToastRegion",
        description: {
          "fa-IR":
            "نشانهٔ ناحیه و پورتالش. label اجباری است چون پیش‌فرضِ موتور یک واژهٔ انگلیسی روی یک role=\"region\" است که هر بار فوکوس به آن می‌رسد خوانده می‌شود. locale هنوز اجباری است و حالا بی‌اثر: موتورِ فعلی روی پورتال هیچ dir ای نمی‌نویسد، پس ناحیه جهت را از خودِ سند به ارث می‌برد — و همین صریح نوشته شده، چون توجیهی که دیگر درست نیست از نبودِ توجیه بدتر است.",
          "en-US":
            "The landmark and its portal. `label` is required because the engine's default is an English word on a `role=\"region\"` that is spoken every time focus reaches it. `locale` is still required and is now INERT: the current engine writes no `dir` on its portal, so the region inherits direction from the document — which is written down explicitly, because a justification that is no longer true is worse than none.",
        },
      },
      {
        name: "Toast",
        description: {
          "fa-IR":
            "یک اعلان. عنوان و توضیحش قطعاتِ موتورند و نه پاراگراف‌های سبک‌دهی‌شده، چون همان‌ها شناسه‌هایی را می‌سازند که ریشه با aria-labelledby و aria-describedby به آن‌ها اشاره می‌کند؛ یک عنصرِ ساده با همان متن، ریشه را به هیچ می‌رساند. جداگانه صادر شده چون اجزای این کتابخانه رونوشت می‌شوند و نه وارد: کسی که دکمهٔ کنش می‌خواهد همین تابع را ویرایش می‌کند.",
          "en-US":
            "One toast. Its title and description are engine PARTS rather than styled paragraphs, because they mint the ids the root points `aria-labelledby` and `aria-describedby` at; a plain element with the same text leaves the root pointing at nothing. It is exported separately because this library's components are COPIED rather than imported: someone who wants an action button edits this function.",
        },
      },
      {
        name: "toastRegionVariants",
        description: {
          "fa-IR":
            "جای پشته. گوشه‌ها با start و end نوشته شده‌اند، پس پیش‌فرضِ پایین‌+پایانی در فارسی گوشهٔ پایین‌چپ است و در انگلیسی پایین‌راست، از یک کلاس. تنها لایهٔ کتابخانه است که لایهٔ مشترکِ شناورها را نمی‌گیرد و بالاتر می‌نشیند: ناحیه یک بار در ریشه سوار می‌شود، پس در ترتیبِ سند از هر گفت‌وگویی که بعداً باز شود جلوتر است و پس‌زمینهٔ تیرهٔ آن گفت‌وگو رویش می‌افتد — دقیقاً وقتی که یک ذخیرهٔ ناموفق درون یک مودال گزارش می‌شود.",
          "en-US":
            "Where the stack sits. The corners are written with `start` and `end`, so the default bottom-end is the bottom-LEFT corner in Persian and the bottom-right in English, from one class. It is the one layer in the library that is not `z-50`: the region mounts once at the root, so it is EARLIER in the document than any dialog opened later and that dialog's scrim paints over it — precisely when a failed save inside a modal reports itself.",
        },
      },
      {
        name: "toastVariants",
        description: {
          "fa-IR":
            "نوارِ لبه و بدنهٔ اعلان. نوار با border-s روی لبهٔ آغازِ خواندن می‌نشیند. رنگ تزئین است: اعلانی که تنها نشانه‌اش از شکست یک نوارِ قرمز باشد برای کسی که آن را نمی‌بیند هیچ نگفته — واژه را در عنوان بگذارید، «ذخیره نشد» و نه «ذخیره» به قرمز.",
          "en-US":
            "The edge stripe and the toast's body. The stripe sits on the reading START edge via `border-s`. The colour is DECORATION: a toast whose only signal of failure is a red stripe has said nothing to anyone who cannot see it — put the word in the title, «ذخیره نشد» rather than «ذخیره» in red.",
        },
      },
    ],
  },
  examples: [
    {
      id: "queue",
      title: { "fa-IR": "صفی که جزء ری‌اکتی نیست", "en-US": "A queue that is not a React component" },
      description: {
        "fa-IR":
          "دکمه‌ها را بزنید. تابعی که اعلان را بلند می‌کند نه جزء است و نه قلاب — یک تابعِ معمولی است که به صفی در دامنهٔ ماژول اضافه می‌کند، و دقیقاً همین است که یک پوشندهٔ fetch می‌تواند صدایش بزند. حداکثر سه اعلان هم‌زمان دیده می‌شود و چهارمی صبر می‌کند.",
        "en-US":
          "Press the buttons. The function that raises the toast is neither a component nor a hook — it is an ordinary function adding to a module-scope queue, which is exactly what lets a fetch wrapper call it. At most three are on screen at once and a fourth waits.",
      },
      render: QueueExample,
    },
    {
      id: "tones",
      title: { "fa-IR": "رنگ چیزی نمی‌گوید", "en-US": "The colour says nothing" },
      description: {
        "fa-IR":
          "سه اعلان با سه نوارِ رنگی متفاوت، و هر سه عنوانی دارند که بدون دیدنِ رنگ کامل است: «ذخیره نشد»، «سهمیهٔ فضای شما رو به پایان است». موتور یک اولویتِ بالا هم دارد که اعلان را به قطعِ حرفِ کاربر تبدیل می‌کند؛ عمداً به نوعِ critical گره نخورده، چون رنگ یک چیز است و وقفه چیزی دیگر.",
        "en-US":
          "Three toasts with three stripe colours, each with a title that is complete without seeing the colour: «ذخیره نشد», «Your storage quota is nearly used up». The engine also offers a high priority that promotes a toast to an interruption; it is deliberately not wired to `critical`, because a colour is one thing and cutting into the reader's sentence is another.",
      },
      render: TonesExample,
    },
    {
      id: "timeout",
      title: { "fa-IR": "فتیله، فقط وقتی کاری نیست", "en-US": "A fuse, only when there is nothing to do" },
      description: {
        "fa-IR":
          "اولی مهلت دارد و خودش می‌رود؛ دومی هیچ مهلتی نمی‌گیرد و می‌ماند تا بسته شود. نبودنِ مهلت پیش‌فرض است و نه سهو: هدفی که حرکت می‌کند بندِ ۲٫۲٫۱ را می‌شکند. اشاره‌گر را روی پشته نگه دارید تا ببینید زمان‌سنجِ اعلانِ اول می‌ایستد — همان چیزی که یک مهلتِ صریح را اصلاً قابل دفاع می‌کند.",
        "en-US":
          "The first has a timeout and leaves on its own; the second takes none and stays until it is closed. The absence is the DEFAULT rather than an oversight: a target that moves fails WCAG 2.2.1. Hold the pointer over the stack and watch the first one's timer pause — which is what makes an explicit timeout defensible at all.",
      },
      render: TimeoutExample,
    },
    {
      id: "placement",
      title: { "fa-IR": "گوشه‌ای که با زبان جابه‌جا می‌شود", "en-US": "A corner that moves with the language" },
      description: {
        "fa-IR":
          "placement=\"bottom-start\" است: در فارسی گوشهٔ پایین‌راست و در انگلیسی پایین‌چپ، از یک کلاس و بدون هیچ نوعِ rtl:. نیمهٔ عمودی عمداً فیزیکی مانده، چون محورِ بلوکی با جهتِ خواندن آینه نمی‌شود و ساختنِ املای منطقی برایش فقط این واقعیت را پنهان می‌کرد.",
        "en-US":
          "`placement=\"bottom-start\"`: the bottom-right corner in Persian and the bottom-left in English, from one class and with no `rtl:` variant. The vertical half stays physical on purpose, because the block axis does not mirror with reading direction and inventing a logical spelling for it would only obscure that.",
      },
      render: PlacementExample,
    },
  ],
};
