import type { Locale, LumoNode } from "@lumo-ui/core";
import { ShieldCheck, UserPlus } from "lucide-react";
import { Marker, MarkerIcon } from "@lumo-ui/ui";

/**
 * Marker examples. Server module — markers are pure content and stay on the
 * server; nothing here hydrates.
 */

const copy = {
  joined: { "fa-IR": "سارا به گفتگو پیوست", "en-US": "Sara joined the conversation" },
  encrypted: {
    "fa-IR": "پیام‌ها سراسر رمزگذاری‌شده‌اند",
    "en-US": "Messages are end-to-end encrypted",
  },
  yesterday: { "fa-IR": "دیروز", "en-US": "Yesterday" },
  today: { "fa-IR": "امروز", "en-US": "Today" },
  unread: { "fa-IR": "پیام‌های خوانده‌نشده", "en-US": "Unread messages" },
} satisfies Record<string, Record<Locale, string>>;

export const meta = {
  usage: {
    when: {
      "fa-IR": "خط‌های میان پیام‌ها: تاریخ، وضعیت، «سارا به گفتگو پیوست»؛ جداکنندهٔ برچسب‌دار یا ردیف حاشیه‌دار.",
      "en-US": "The lines between messages: a date, a status, «Sara joined the conversation»; a labelled separator or a bordered row.",
    },
    whenNot: {
      "fa-IR": "خطی میان دو گروه محتوا — `Separator`. وضعیت روی یک ردیف — `Badge`. خودِ پیام — `Bubble` یا `Message`.",
      "en-US": "A rule between two groups of content — `Separator`. A status on a row — `Badge`. The message itself — `Bubble` or `Message`.",
    },
  },
  id: "marker",
  tier: "display",
  title: { "fa-IR": "نشانگر گفتگو", "en-US": "Marker" },
  intro: {
    "fa-IR":
      "نشانگرهای میان پیام‌ها: خط وضعیت، جداکنندهٔ برچسب‌دار و ردیف مرزدار. تماماً سمت سرور و بدون جاوااسکریپت رندر می‌شود.",
    "en-US":
      "The in-between-messages markers: a status line, a labeled separator and a bordered row. Renders entirely on the server with no JavaScript.",
  },
} as const;

export const examples: Array<{
  id: string;
  title: Record<Locale, string>;
  intro?: Record<Locale, string>;
  render: (locale: Locale) => LumoNode;
}> = [
  {
    id: "status",
    title: { "fa-IR": "خط وضعیت", "en-US": "Status lines" },
    intro: {
      "fa-IR": "آیکون همیشه از درخت دسترس‌پذیری بیرون است؛ متنِ نشانگر همان چیزی است که خوانده می‌شود.",
      "en-US": "The icon is always out of the accessibility tree; the marker's information is its text.",
    },
    render: (l) => (
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Marker>
          <MarkerIcon>
            <UserPlus />
          </MarkerIcon>
          {copy.joined[l]}
        </Marker>
        <Marker>
          <MarkerIcon>
            <ShieldCheck />
          </MarkerIcon>
          {copy.encrypted[l]}
        </Marker>
      </div>
    ),
  },
  {
    id: "separator",
    title: { "fa-IR": "جداکنندهٔ برچسب‌دار", "en-US": "Labeled separator" },
    intro: {
      "fa-IR": "خط — برچسب — خط؛ فاصله‌ها از gap می‌آیند، نه از حاشیهٔ فیزیکی، پس آینه‌شدن رایگان است.",
      "en-US": "Hairline — label — hairline; spacing comes from gap, not physical margins, so mirroring is free.",
    },
    render: (l) => (
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Marker variant="separator">{copy.yesterday[l]}</Marker>
        <Marker variant="separator">{copy.today[l]}</Marker>
      </div>
    ),
  },
  {
    id: "border",
    title: { "fa-IR": "ردیف مرزدار", "en-US": "Bordered row" },
    intro: {
      "fa-IR": "مرزِ خوانده‌نشده‌ها با border-be بسته می‌شود — منطقی، حتی روی محوری که آینه نمی‌شود.",
      "en-US": "The unread boundary closes with border-be — logical even on the axis that never mirrors.",
    },
    render: (l) => (<Marker variant="border" className="max-w-sm">{copy.unread[l]}</Marker>),
  },
];
