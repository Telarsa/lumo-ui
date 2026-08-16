import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { formatDate } from "@lumo-ui/core";
import {
  Bubble,
  BubbleGroup,
  Marker,
  MessageScroller,
} from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the message-scroller page. Contract: `_system/types.ts`.
 *
 * A SERVER module. `MessageScroller` is a client component, but `label`,
 * `jumpLabel` and the bubbles inside it are all strings and markup, so these
 * prerender — which matters here more than usual: the transcript is in the
 * served bytes, so `lumo-gate` grades a real Persian conversation rather than
 * an empty box waiting for a bundle.
 *
 * ── WHAT TO ACTUALLY DO ON THIS PAGE ────────────────────────────────────────
 *
 * The whole component is one rule — *follow the bottom only while the reader is
 * already at the bottom* — and a screenshot cannot show a rule. Scroll a
 * transcript UP a little. The jump button appears, and it appears on the LEFT
 * on the fa route because it is placed with `end-4` rather than `right-4`.
 * Press it and the transcript returns to the newest message.
 *
 * The first paint is at the TOP and an effect scrolls it down. That is a stated
 * cost, not an oversight: `column-reverse` would fix it with no JavaScript and
 * would reverse the DOM order of the messages, so a screen reader would read
 * the conversation backwards and Tab would walk it backwards. A one-frame jump
 * is a much smaller defect than a transcript announced newest-first.
 *
 * The times are built HERE through `formatDate`, from fixed instants with an
 * explicit zone, so the prerendered bytes are the same on every build machine —
 * the same call `examples/message.tsx` and `examples/timeline.tsx` make.
 */

const t = {
  chatLabel: { "fa-IR": "گفت‌وگو با پشتیبانی", "en-US": "Conversation with support" },
  jumpLabel: { "fa-IR": "رفتن به آخرین پیام", "en-US": "Jump to the latest message" },
  ticketLabel: { "fa-IR": "تاریخچهٔ تیکت", "en-US": "Ticket history" },
  shortLabel: { "fa-IR": "گفت‌وگوی کوتاه", "en-US": "Short conversation" },

  today: { "fa-IR": "امروز", "en-US": "Today" },

  r1: { "fa-IR": "سلام، سفارشم هنوز نرسیده.", "en-US": "Hello — my order has not arrived yet." },
  s1: { "fa-IR": "سلام. شمارهٔ سفارش را می‌فرستید؟", "en-US": "Hello. Could you send the order number?" },
  r2: { "fa-IR": "بله، همین الان از پنل برداشتم.", "en-US": "Yes, just took it from my dashboard." },
  s2: { "fa-IR": "ممنون، دارم بررسی می‌کنم.", "en-US": "Thank you — I am checking it now." },
  s3: {
    "fa-IR": "مرسوله دیروز تحویل پست شد و کد رهگیری برایتان پیامک شده.",
    "en-US": "The parcel was handed to the courier yesterday and the tracking code was texted to you.",
  },
  r3: { "fa-IR": "پیامکی نیامده متأسفانه.", "en-US": "No text came through, unfortunately." },
  s4: {
    "fa-IR": "الان دوباره ارسالش می‌کنم. اگر تا ده دقیقه نرسید خبر بدهید.",
    "en-US": "I am resending it now. Tell me if it has not arrived within ten minutes.",
  },
  r4: { "fa-IR": "رسید، ممنون از پیگیری.", "en-US": "It arrived — thank you for chasing it." },
  s5: { "fa-IR": "خواهش می‌کنم. روز خوبی داشته باشید.", "en-US": "You are welcome. Have a good day." },

  t1: { "fa-IR": "تیکت باز شد.", "en-US": "Ticket opened." },
  t2: { "fa-IR": "به کارشناس فنی ارجاع شد.", "en-US": "Escalated to a technical agent." },
  t3: { "fa-IR": "راه‌حل پیشنهاد شد.", "en-US": "A workaround was proposed." },
  t4: { "fa-IR": "تیکت بسته شد.", "en-US": "Ticket closed." },
} satisfies Record<string, LocalizedText>;

/* Fixed instants, so the prerendered bytes are deterministic per build. */
const START = new Date("2026-08-10T10:02:00+03:30");
const TIME: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Tehran",
};

/** `START` plus a whole number of minutes. Never `Date.now()` — see the header. */
function at(minutes: number, l: Locale): string {
  return formatDate(new Date(START.getTime() + minutes * 60_000), l, TIME);
}

/** The trailing time stamp. Takes the already-formatted string, never a Date. */
function Stamp({ children }: { children: string }) {
  return <div className="px-1 pb-1 text-xs text-fg-subtle">{children}</div>;
}

function ConversationExample(l: Locale) {
  return (
    <div className="flex h-80 w-full max-w-md flex-col rounded-lg border border-border bg-surface">
      <MessageScroller label={t.chatLabel[l]} jumpLabel={t.jumpLabel[l]}>
        <div className="flex flex-col gap-3">
          <Marker variant="separator">{t.today[l]}</Marker>
          <BubbleGroup variant="received">
            <Bubble variant="received">{t.r1[l]}</Bubble>
          </BubbleGroup>
          <BubbleGroup variant="sent">
            <Bubble variant="sent">{t.s1[l]}</Bubble>
          </BubbleGroup>
          <BubbleGroup variant="received">
            <Bubble variant="received">{t.r2[l]}</Bubble>
          </BubbleGroup>
          <BubbleGroup variant="sent">
            <Bubble variant="sent" grouping="first">
              {t.s2[l]}
            </Bubble>
            <Bubble variant="sent" grouping="last">
              {t.s3[l]}
            </Bubble>
          </BubbleGroup>
          <BubbleGroup variant="received">
            <Bubble variant="received">{t.r3[l]}</Bubble>
          </BubbleGroup>
          <BubbleGroup variant="sent">
            <Bubble variant="sent">{t.s4[l]}</Bubble>
          </BubbleGroup>
          <BubbleGroup variant="received">
            <Bubble variant="received">{t.r4[l]}</Bubble>
          </BubbleGroup>
          <BubbleGroup variant="sent">
            <Bubble variant="sent">{t.s5[l]}</Bubble>
          </BubbleGroup>
          <Stamp>{at(31, l)}</Stamp>
        </div>
      </MessageScroller>
    </div>
  );
}

function ShortExample(l: Locale) {
  return (
    <div className="flex h-80 w-full max-w-md flex-col rounded-lg border border-border bg-surface">
      <MessageScroller label={t.shortLabel[l]} jumpLabel={t.jumpLabel[l]}>
        <div className="flex flex-col gap-3">
          <BubbleGroup variant="received">
            <Bubble variant="received">{t.r1[l]}</Bubble>
          </BubbleGroup>
          <BubbleGroup variant="sent">
            <Bubble variant="sent">{t.s1[l]}</Bubble>
          </BubbleGroup>
          <Stamp>{at(2, l)}</Stamp>
        </div>
      </MessageScroller>
    </div>
  );
}

function LogExample(l: Locale) {
  const entries = [
    { id: "opened", text: t.t1[l], minutes: 0 },
    { id: "escalated", text: t.t2[l], minutes: 12 },
    { id: "workaround", text: t.t3[l], minutes: 25 },
    { id: "closed", text: t.t4[l], minutes: 31 },
  ];
  return (
    <div className="flex h-56 w-full max-w-md flex-col rounded-lg border border-border bg-surface">
      <MessageScroller
        label={t.ticketLabel[l]}
        jumpLabel={t.jumpLabel[l]}
        viewportClassName="p-3"
      >
        <ul className="flex list-none flex-col gap-2 p-0">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-fg">{entry.text}</span>
              <span className="shrink-0 text-xs text-fg-subtle">{at(entry.minutes, l)}</span>
            </li>
          ))}
        </ul>
      </MessageScroller>
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "ظرف پیمایشی یک گفتگوی زنده که تا وقتی خواننده برنگشته، دنبال تازه‌ترین پیام می‌رود.",
        "en-US": "The scroll container of a live transcript that follows the newest message until the reader scrolls back.",
      },
      whenNot: {
        "fa-IR": "فهرست بلند ایستا — `VirtualList` یا `ScrollArea`. یک ردیف پیام — `Message`.",
        "en-US": "A long static list — `VirtualList` or `ScrollArea`. One message row — `Message`.",
      },
    },
    tier: "display",
    isNew: true,
    title: { "fa-IR": "پیمایشگر گفت‌وگو", "en-US": "Message scroller" },
    intro: {
      "fa-IR":
        "رونوشتی که به تازه‌ترین پیام چسبیده می‌ماند — تا وقتی خواننده به عقب برگردد، و آن‌وقت با او نمی‌جنگد. کل جزء یک قاعده است: فقط تا وقتی انتها را دنبال کن که خواننده خودش انتهاست. حالتِ چسبیده از خودِ عنصر اندازه‌گیری می‌شود، نه از یک پرچمِ «کاربر پیمایش کرده» که از هم‌گام می‌افتد. نقش log و aria-live=\"polite\" است، چون رسیدن یک پیام تغییری است که هیچ نشانهٔ دیداری آن را اعلام نمی‌کند.",
      "en-US":
        "A transcript that stays pinned to the newest message — until the reader scrolls back, and then it does not fight them. The whole component is one rule: follow the bottom only while the reader is already at the bottom. The pinned state is measured from the element rather than kept in a «user has scrolled» flag that drifts. The role is log with aria-live=\"polite\", because a message arriving is a change no visible affordance announces.",
    },
    composition: [
      `<MessageScroller               ← role="log" aria-live="polite", and a tab stop`,
      `  label                        ← required: an unnamed scroll region is announced as`,
      `                                 "scroll area" and nothing else`,
      `  jumpLabel                    ← required: the jump control is an icon`,
      `  viewportClassName>           ← class for the scrolling box itself`,
      `  <BubbleGroup>                ← anything: bubbles, messages, a plain list`,
      `    <Bubble />`,
      `  </BubbleGroup>`,
      `</MessageScroller>`,
    ].join("\n"),
    parts: [
      {
        name: "MessageScroller",
        description: {
          "fa-IR":
            "خودِ ناحیهٔ پیمایش. دکمهٔ «آخرین پیام» فقط وقتی رندر می‌شود که خواننده از انتها فاصله گرفته باشد — نه همیشه با کلاس hidden — چون کنترلی که اعلام می‌شود ولی کاری نمی‌کند از نبودنش بدتر است. جایش با ویژگیِ منطقیِ end تعیین شده و نه با right، پس در فارسی سمت چپ می‌نشیند.",
          "en-US":
            "The scroll region itself. The jump button is RENDERED only while the reader is away from the bottom — never always-rendered-and-hidden — because a control that is announced but does nothing is worse than one that is absent. It is placed with end-4, so it sits on the left in Persian.",
        },
      },
      {
        name: "Bubble",
        description: {
          "fa-IR":
            "محتوای داخل رونوشت هر چیزی می‌تواند باشد. حباب‌ها فقط رایج‌ترین‌اند؛ مثال سوم یک فهرست ساده است.",
          "en-US":
            "The content inside is anything at all. Bubbles are merely the common case; the third example is a plain list.",
        },
      },
    ],
  },
  examples: [
    {
      id: "conversation",
      title: { "fa-IR": "یک گفت‌وگوی کامل", "en-US": "A full conversation" },
      description: {
        "fa-IR":
          "کمی به بالا بپیمایید: دکمهٔ بازگشت پیدا می‌شود، و روی مسیر فارسی سمت چپ ظاهر می‌شود چون با ویژگیِ منطقیِ end جای‌گذاری شده نه با right. آستانهٔ «انتها» بیست‌وچهار پیکسل است و نه صفر، چون برابریِ دقیقِ scrollTop در بسیاری از پیمایشگرهای واقعی هرگز برقرار نمی‌شود.",
        "en-US":
          "Scroll up a little: the return button appears, and on the fa route it appears on the LEFT because it is placed with end-4 rather than right-4. The bottom threshold is twenty-four pixels rather than zero, because the exact scrollTop equality is simply never true in a great many real scrollers.",
      },
      render: ConversationExample,
    },
    {
      id: "short",
      title: { "fa-IR": "کوتاه‌تر از قاب", "en-US": "Shorter than the frame" },
      description: {
        "fa-IR":
          "وقتی چیزی برای پیمایش نیست، خواننده همیشه در انتهاست و دکمه هرگز کشیده نمی‌شود. حالتِ چسبیده اندازه‌گیری می‌شود، پس این یک شرطِ جداگانه نیست.",
        "en-US":
          "With nothing to scroll the reader is always at the bottom, so the button is never drawn. The pinned state is measured, so this is not a special case in the code.",
      },
      render: ShortExample,
    },
    {
      id: "log",
      title: { "fa-IR": "هر محتوایی، نه فقط حباب", "en-US": "Any content, not only bubbles" },
      description: {
        "fa-IR":
          "همان ناحیه با یک فهرست ساده. نقش log برای هر رکوردِ در حال رشد درست است — تاریخچهٔ تیکت، خروجی ساخت، رویدادهای زنده — و viewportClassName فاصله‌های داخلی را جدا از قاب بیرونی تنظیم می‌کند.",
        "en-US":
          "The same region with a plain list in it. The log role is right for any running record — a ticket history, build output, a live event feed — and viewportClassName sets the inner padding separately from the outer box.",
      },
      render: LogExample,
    },
  ],
};
