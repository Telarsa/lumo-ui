import type { ComponentExamples } from "./_system/types";

/**
 * `pull-to-refresh` is a MOBILE-ONLY family: it exists in `lumo_ui_mobile` and
 * has no web counterpart, deliberately.
 *
 * Pull-to-refresh is a touch gesture. Building a web component so that a
 * documentation page could exist would be the tail wagging the dog — the page is
 * what needed fixing, not the library (decisions §39, §40). So this file carries
 * `meta` and no `examples`: the family gets its page, its sidebar row and its
 * Mobile side, and the page's Web side says the web has no such thing.
 *
 * This is the whole registration. There is no second list.
 */
export const EXAMPLES: ComponentExamples = {
  meta: {
    platforms: ["mobile"],
    tier: "navigation",
    title: { "fa-IR": "کشیدن برای تازه‌سازی", "en-US": "Pull to refresh" },
    intro: {
      "fa-IR":
        "فهرست را از بالا بکشید تا دوباره بارگیری شود — ژستی که فقط روی صفحهٔ لمسی معنا دارد، و برای همین همتای وب ندارد. سه رشتهٔ گفتنی دارد (کشیدن، رهاکردن، در حال تازه‌سازی) و هر سه اجباری‌اند، چون یک چرخندهٔ بی‌کلام به کسی که نمی‌بیندش هیچ نمی‌گوید.",
      "en-US":
        "Drag the list down from the top to reload it — a gesture that only means something on a touch screen, which is why it has no web counterpart. It announces three states (pulling, release, refreshing) and all three strings are required, because a silent spinner says nothing to a reader who cannot see it.",
    },
    usage: {
      when: {
        "fa-IR": "فهرستی که کاربر انتظار دارد با یک حرکت تازه‌اش کند: صندوق پیام، خوراک سفارش‌ها، اعلان‌ها.",
        "en-US": "A list a reader expects to refresh with a gesture: an inbox, an order feed, notifications.",
      },
      whenNot: {
        "fa-IR":
          "دکمهٔ تازه‌سازی صریح، وقتی بارگیری گران است و کاربر باید عمداً بخواهدش. محتوایی که خودش زنده به‌روز می‌شود — آنجا `Progress` یا یک ناحیهٔ زنده درست‌تر است.",
        "en-US":
          "An explicit refresh button, when reloading is expensive and should be asked for on purpose. Content that updates itself — `Progress` or a live region is the honest shape there.",
      },
    },
  },
  examples: [],
};
