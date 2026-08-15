import type { Locale, LumoNode } from "@lumo-ui/core";
import { Bell, FileText, User } from "lucide-react";
import {
  Badge,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@lumo-ui/ui";

/**
 * Item examples. Server module. The link form (`href`) is fully serializable,
 * so navigable rows render here; the pressable form needs an onPress function
 * and therefore appears only in client compositions, not in these demos.
 */

const copy = {
  profile: { "fa-IR": "پروفایل", "en-US": "Profile" },
  profileDesc: {
    "fa-IR": "نام و نشانی شما برای دیگر اعضای فضای کاری دیده می‌شود.",
    "en-US": "Your name and address are visible to everyone in the workspace.",
  },
  notifications: { "fa-IR": "اعلان‌ها", "en-US": "Notifications" },
  notificationsDesc: {
    "fa-IR": "زمان و راه اطلاع‌رسانی را خودتان تعیین کنید.",
    "en-US": "Decide when and how you are notified.",
  },
  docs: { "fa-IR": "اسناد تیم", "en-US": "Team documents" },
  docsDesc: {
    "fa-IR": "آخرین نسخهٔ قراردادها و صورتجلسه‌ها.",
    "en-US": "The latest contracts and meeting minutes.",
  },
  active: { "fa-IR": "فعال", "en-US": "Active" },
  newBadge: { "fa-IR": "تازه", "en-US": "New" },
} satisfies Record<string, Record<Locale, string>>;

export const meta = {
  usage: {
    when: {
      "fa-IR": "ردیف عمومی با رسانه، محتوا و کنش — به‌شکل پیوند، دکمه یا ردیف ایستا: ردیف تنظیمات، نتیجه، مورد فهرست.",
      "en-US": "The generic row with media, content and actions — as a link, a button or a static row: settings rows, results, list entries.",
    },
    whenNot: {
      "fa-IR": "سطحی با سربرگ، بدنه و پابرگ — `Card`. جفت‌های نام/مقدار — `DescriptionList`. پرونده‌ای در گفتگو — `Attachment`.",
      "en-US": "A surface with header, body and footer — `Card`. Name/value pairs — `DescriptionList`. A file in a conversation — `Attachment`.",
    },
  },
  id: "item",
  tier: "display",
  title: { "fa-IR": "آیتم", "en-US": "Item" },
  intro: {
    "fa-IR":
      "ردیف عمومی: رسانه، محتوا، عمل‌ها. با href لینک واقعی می‌شود، با onPress دکمه و بی‌هیچ‌کدام یک div ساده — هر سه از یک ترکیب.",
    "en-US":
      "The generic row: media, content, actions. href makes it a real link, onPress a button, and neither a plain div — three renderings of one composition.",
  },
} as const;

export const examples: Array<{
  id: string;
  title: Record<Locale, string>;
  intro?: Record<Locale, string>;
  render: (locale: Locale) => LumoNode;
}> = [
  {
    id: "list",
    title: { "fa-IR": "فهرست ایستا", "en-US": "A static list" },
    intro: {
      "fa-IR": "ردیف ایستا نه نقش دارد و نه ایست تب؛ توضیحِ دوخطی رسانه را به آغازِ بلوک می‌برد.",
      "en-US": "The static row has no role and no tab stop; a two-line description top-aligns the media.",
    },
    render: (l) => (
      <ItemGroup className="max-w-md">
        <Item variant="outlined">
          <ItemMedia media="icon">
            <User aria-hidden="true" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{copy.profile[l]}</ItemTitle>
            <ItemDescription>{copy.profileDesc[l]}</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Badge>{copy.active[l]}</Badge>
          </ItemActions>
        </Item>
        <Item variant="outlined">
          <ItemMedia media="icon">
            <Bell aria-hidden="true" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{copy.notifications[l]}</ItemTitle>
            <ItemDescription>{copy.notificationsDesc[l]}</ItemDescription>
          </ItemContent>
        </Item>
      </ItemGroup>
    ),
  },
  {
    id: "links",
    title: { "fa-IR": "ردیف‌های پیوندی", "en-US": "Link rows" },
    intro: {
      "fa-IR": "href ردیف را یک لنگر واقعی می‌کند: قابل خزش و قابل بازکردن در برگهٔ نو.",
      "en-US": "href renders a real anchor: crawlable and middle-clickable.",
    },
    render: (l) => (
      <ItemGroup className="max-w-md">
        <Item href="#" variant="muted">
          <ItemMedia media="icon">
            <FileText aria-hidden="true" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{copy.docs[l]}</ItemTitle>
            <ItemDescription>{copy.docsDesc[l]}</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Badge>{copy.newBadge[l]}</Badge>
          </ItemActions>
        </Item>
        <ItemSeparator />
        <Item href="#" size="sm">
          <ItemContent>
            <ItemTitle>{copy.notifications[l]}</ItemTitle>
          </ItemContent>
        </Item>
      </ItemGroup>
    ),
  },
];
