import type { BuiltinLocale as Locale, LumoNode } from "@lumo-ui/core";
import { formatDate } from "@lumo-ui/core";
import {
  Avatar,
  Bubble,
  BubbleGroup,
  Marker,
  Message,
  MessageAvatar,
  MessageBody,
  MessageGroup,
  MessageHeader,
  MessageTime,
} from "@lumo-ui/ui";

/**
 * Message examples. Server module — a transcript is content. The timestamps
 * are formatted HERE, through formatDate, because MessageTime takes a string
 * by contract: under fa-IR that string is Jalali, a decision the caller makes
 * once instead of the component guessing per render.
 */

const copy = {
  sender: { "fa-IR": "سارا محمدی", "en-US": "Sara Mohammadi" },
  initials: { "fa-IR": "س م", "en-US": "SM" },
  r1: { "fa-IR": "سلام! فایل ارائه رو دیدی؟", "en-US": "Hi! Did you see the deck?" },
  r2: { "fa-IR": "تا فردا نظرت رو لازم دارم.", "en-US": "I need your take by tomorrow." },
  s1: { "fa-IR": "دیدم، خیلی خوب شده.", "en-US": "Saw it — it looks great." },
  s2: { "fa-IR": "شب یادداشت‌هام رو می‌فرستم.", "en-US": "I'll send my notes tonight." },
  today: { "fa-IR": "امروز", "en-US": "Today" },
} satisfies Record<string, Record<Locale, string>>;

// Fixed instants, so the prerendered bytes are deterministic per build.
const RECEIVED_AT = new Date("2026-08-10T14:05:00+03:30");
const SENT_AT = new Date("2026-08-10T14:09:00+03:30");

const TIME: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };

export const meta = {
  usage: {
    when: {
      "fa-IR": "ردیف کامل یک پیام گفتگو: آواتار، حباب‌ها و زمان، ارسالی یا دریافتی.",
      "en-US": "The composed row of one chat message: avatar, bubbles and time, sent or received.",
    },
    whenNot: {
      "fa-IR": "فقط حباب — `Bubble`. خط‌های میان پیام‌ها — `Marker`. ظرف کل گفتگو — `MessageScroller`. ردیف عمومی — `Item`.",
      "en-US": "Only the bubble — `Bubble`. Lines between messages — `Marker`. The transcript container — `MessageScroller`. A generic row — `Item`.",
    },
  },
  id: "message",
  tier: "display",
  title: { "fa-IR": "پیام", "en-US": "Message" },
  intro: {
    "fa-IR":
      "ردیف کامل گفتگو: آواتار، حباب‌ها و زمان. ردیفِ ارسالی با flex-row-reverse جهتِ جریان را برمی‌گرداند، پس آواتار در هر دو زبان به پایانِ سطر می‌رود.",
    "en-US":
      "The composed chat row: avatar, bubbles, time. The sent row reverses FLOW with flex-row-reverse, so the avatar lands at the inline end in both scripts.",
  },
} as const;

export const examples: Array<{
  id: string;
  title: Record<Locale, string>;
  intro?: Record<Locale, string>;
  render: (locale: Locale) => LumoNode;
}> = [
  {
    id: "thread",
    title: { "fa-IR": "یک رشتهٔ کوتاه", "en-US": "A short thread" },
    intro: {
      "fa-IR":
        "زمان‌ها با formatDate ساخته می‌شوند — روی مسیر فارسی جلالی و با رقم فارسی — و به‌صورت رشته به MessageTime می‌رسند.",
      "en-US":
        "The times are built with formatDate — Jalali with Persian digits on the fa route — and reach MessageTime as strings.",
    },
    render: (l) => (
      <MessageGroup className="max-w-md">
        <Marker variant="separator">{copy.today[l]}</Marker>
        <Message variant="received">
          <MessageAvatar>
            <Avatar initials={copy.initials[l]} />
          </MessageAvatar>
          <MessageBody>
            <MessageHeader>{copy.sender[l]}</MessageHeader>
            <BubbleGroup variant="received">
              <Bubble variant="received" grouping="first">
                {copy.r1[l]}
              </Bubble>
              <Bubble variant="received" grouping="last">
                {copy.r2[l]}
              </Bubble>
            </BubbleGroup>
            <MessageTime
              value={formatDate(RECEIVED_AT, l, TIME)}
              dateTime={RECEIVED_AT.toISOString()}
            />
          </MessageBody>
        </Message>
        <Message variant="sent">
          <MessageBody>
            <BubbleGroup variant="sent">
              <Bubble variant="sent" grouping="first">
                {copy.s1[l]}
              </Bubble>
              <Bubble variant="sent" grouping="last">
                {copy.s2[l]}
              </Bubble>
            </BubbleGroup>
            <MessageTime value={formatDate(SENT_AT, l, TIME)} dateTime={SENT_AT.toISOString()} />
          </MessageBody>
        </Message>
      </MessageGroup>
    ),
  },
];
