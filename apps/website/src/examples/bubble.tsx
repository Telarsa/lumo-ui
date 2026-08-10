import type { Locale, LumoNode } from "@lumo-ui/core";
import { formatNumber } from "@lumo-ui/core";
import {
  Bubble,
  BubbleCollapse,
  BubbleGroup,
  BubbleReactions,
} from "@lumo-ui/ui";

/**
 * Bubble examples. Server module — bubbles are content, and even the
 * collapsible one crosses the boundary with nothing but strings: Disclosure
 * keeps its own state on the client.
 */

const copy = {
  r1: { "fa-IR": "سلام! فایل ارائه رو دیدی؟", "en-US": "Hi! Did you see the deck?" },
  r2: { "fa-IR": "نظرت رو بگو، فردا جلسه داریم.", "en-US": "Tell me what you think — we meet tomorrow." },
  s1: { "fa-IR": "آره، همین الان بازش کردم.", "en-US": "Yes, just opened it." },
  s2: { "fa-IR": "بخش دوم عالی شده.", "en-US": "The second section turned out great." },
  s3: { "fa-IR": "فقط نمودار صفحهٔ آخر را ساده‌تر کن.", "en-US": "Just simplify the last page's chart." },
  reactionBody: { "fa-IR": "قرارداد نهایی شد!", "en-US": "The contract is final!" },
  more: { "fa-IR": "نمایش بیشتر", "en-US": "Show more" },
  longIntro: { "fa-IR": "خلاصهٔ صورتجلسه را می‌فرستم:", "en-US": "Sending the meeting summary:" },
  longBody: {
    "fa-IR":
      "دربارهٔ بودجهٔ سال آینده توافق شد که هزینهٔ زیرساخت ثابت بماند، تیم پشتیبانی دو نفر بزرگ‌تر شود و بازنگری قیمت‌ها به فصل پاییز موکول شود.",
    "en-US":
      "On next year's budget we agreed to keep infrastructure spending flat, grow the support team by two people, and defer the pricing review to autumn.",
  },
} satisfies Record<string, Record<Locale, string>>;

export const meta = {
  id: "bubble",
  tier: "display",
  title: { "fa-IR": "حباب گفتگو", "en-US": "Bubble" },
  intro: {
    "fa-IR":
      "حباب پیام با هم‌ترازی منطقی: «ارسالی» به پایانِ سطر می‌چسبد، نه به راستِ صفحه — در فارسی یعنی سمت چپ، همان‌طور که پیام‌رسان‌ها رفتار می‌کنند.",
    "en-US":
      "The message bubble with logical alignment: sent hugs the inline end, never the physical right — in Persian that is the left, exactly as messengers behave.",
  },
} as const;

export const examples: Array<{
  id: string;
  title: Record<Locale, string>;
  intro?: Record<Locale, string>;
  render: (locale: Locale) => LumoNode;
}> = [
  {
    id: "conversation",
    title: { "fa-IR": "گروه‌بندی و هم‌ترازی", "en-US": "Grouping and alignment" },
    intro: {
      "fa-IR":
        "گوشه‌های سمتِ چسبیده با چهار گوشهٔ منطقی صاف می‌شوند؛ بین دو زبان حتی یک کلاس عوض نمی‌شود.",
      "en-US":
        "The joined-side corners square off with the four logical corners; not one class changes between the two scripts.",
    },
    render: (l) => (
      <div className="flex w-full max-w-sm flex-col gap-2">
        <BubbleGroup variant="received">
          <Bubble variant="received" grouping="first">
            {copy.r1[l]}
          </Bubble>
          <Bubble variant="received" grouping="last">
            {copy.r2[l]}
          </Bubble>
        </BubbleGroup>
        <BubbleGroup variant="sent">
          <Bubble variant="sent" grouping="first">
            {copy.s1[l]}
          </Bubble>
          <Bubble variant="sent" grouping="middle">
            {copy.s2[l]}
          </Bubble>
          <Bubble variant="sent" grouping="last">
            {copy.s3[l]}
          </Bubble>
        </BubbleGroup>
      </div>
    ),
  },
  {
    id: "reactions",
    title: { "fa-IR": "واکنش‌ها", "en-US": "Reactions" },
    intro: {
      "fa-IR": "شمار واکنش از formatNumber می‌گذرد؛ عدد خام در JSX کامپایل نمی‌شود.",
      "en-US": "The reaction count goes through formatNumber; a raw number does not compile in JSX.",
    },
    render: (l) => (
      <BubbleGroup variant="received" className="max-w-sm pb-3">
        <Bubble variant="received">
          {copy.reactionBody[l]}
          <BubbleReactions>
            <span aria-hidden="true">🎉</span>
            <span>{formatNumber(2, l)}</span>
          </BubbleReactions>
        </Bubble>
      </BubbleGroup>
    ),
  },
  {
    id: "collapse",
    title: { "fa-IR": "متن بلند جمع‌شونده", "en-US": "Collapsible long content" },
    intro: {
      "fa-IR": "ترکیب با Disclosure؛ دکمهٔ بازکردن متن فارسیِ اجباری دارد و وضعیتش را ری‌اکت‌آریا نگه می‌دارد.",
      "en-US": "Composed from Disclosure; the trigger takes required Persian text and React Aria keeps its state.",
    },
    render: (l) => (
      <BubbleGroup variant="sent" className="max-w-sm">
        <Bubble variant="sent">
          {copy.longIntro[l]}
          <BubbleCollapse label={copy.more[l]}>
            <p>{copy.longBody[l]}</p>
          </BubbleCollapse>
        </Bubble>
      </BubbleGroup>
    ),
  },
];
