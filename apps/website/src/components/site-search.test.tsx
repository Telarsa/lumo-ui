/**
 * `search-index.test.ts` proves `normalize()`/`matches()` in isolation. This
 * file proves the palette actually USES them — that a query typed on the
 * "wrong" keyboard finds a component here, end to end, the way it would for a
 * real visitor, not just as a pure-function claim.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { LumoProvider } from "@lumo-ui/ui";
import type { SearchDoc } from "@/lib/search-index";
import { SiteSearch } from "./site-search";

afterEach(cleanup);

const INDEX: SearchDoc[] = [
  {
    id: "button",
    kind: "component",
    title: { "fa-IR": "دکمه", "en-US": "Button" },
    intro: { "fa-IR": "کنش اصلی رابط کاربری.", "en-US": "The interface's primary action." },
    tier: "form",
    href: { "fa-IR": "/fa-IR/components/button/", "en-US": "/en-US/components/button/" },
  },
  {
    id: "table",
    kind: "component",
    title: { "fa-IR": "جدول", "en-US": "Table" },
    intro: { "fa-IR": "نمایش داده‌های ردیفی.", "en-US": "Displays tabular data." },
    tier: "data",
    href: { "fa-IR": "/fa-IR/components/table/", "en-US": "/en-US/components/table/" },
  },
  {
    id: "hero",
    kind: "block",
    title: { "fa-IR": "سربرگ صفحه", "en-US": "Hero" },
    intro: { "fa-IR": "نخستین بخش صفحه.", "en-US": "The opening section." },
    tier: undefined,
    href: { "fa-IR": "/fa-IR/blocks/hero/", "en-US": "/en-US/blocks/hero/" },
  },
];

function renderSearch(lang: "fa-IR" | "en-US" = "fa-IR") {
  return render(
    <LumoProvider locale={lang}>
      <SiteSearch lang={lang} index={INDEX} />
    </LumoProvider>,
  );
}

async function openPalette() {
  fireEvent.click(screen.getByRole("button", { name: /جستجو|Search/ }));
  return screen.findByRole("dialog");
}

describe("SiteSearch — the header trigger", () => {
  // The button's computed accessible name is its full text content, which
  // includes the Kbd hint's own "Ctrl"/"K" glyphs — "جستجوCtrlK" — exactly
  // like @lumo-ui/blocks' CommandPalette default trigger (label + Kbd, same
  // shape, already shipped). A prefix match asserts the translated label
  // leads the name without hard-coding that concatenation here too.
  it("has a real accessible name in fa-IR, not just an icon", () => {
    renderSearch("fa-IR");
    expect(screen.getByRole("button", { name: /^جستجو/ })).toBeTruthy();
  });

  it("has a real accessible name in en-US", () => {
    renderSearch("en-US");
    expect(screen.getByRole("button", { name: /^Search/ })).toBeTruthy();
  });

  it("shows the shortcut hint through Kbd, not a bare string", () => {
    renderSearch("fa-IR");
    // jsdom's default userAgent is not a Mac, so the default hint is Ctrl+K.
    expect(screen.getByText("Ctrl")).toBeTruthy();
    expect(screen.getByText("K")).toBeTruthy();
  });
});

describe("SiteSearch — opening the palette", () => {
  it("opens on click and shows both groups with an empty query", async () => {
    renderSearch("fa-IR");
    await openPalette();
    expect(screen.getByText("دکمه")).toBeTruthy();
    expect(screen.getByText("جدول")).toBeTruthy();
    expect(screen.getByText("سربرگ صفحه")).toBeTruthy();
  });

  it("names the dialog and its search field, both in Persian", async () => {
    renderSearch("fa-IR");
    const dialog = await openPalette();
    expect(dialog.textContent).toContain("جستجوی سراسری");
    expect(screen.getByRole("searchbox").getAttribute("aria-label")).toBe(
      "جستجوی کامپوننت‌ها و بلوک‌ها",
    );
  });
});

const LATIN_WORD = /[A-Za-z]{2,}/;

function spokenAttributes(html: string): string[] {
  return [...html.matchAll(/aria-(?:label|roledescription|placeholder|valuetext)="([^"]*)"/g)].map(
    (m) => m[1]!,
  );
}

/**
 * The VISIBLE text a reader (or lumo-gate's own `visibleTextNodes` walk) sees
 * — as opposed to markup: class names, ids and `stroke-width="2"` all contain
 * ASCII digits and are not text a Persian-route reader encounters.
 */
function visibleText(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent ?? "";
}

describe("SiteSearch — the server render, which is what the HTML gate grades", () => {
  // `site-shell.tsx` puts this trigger in the header of ~every page the site
  // serves, so this is the one part of the palette lumo-gate actually sees —
  // CommandDialog's overlay returns null during SSR (see command-palette's own
  // demo entry in demos.tsx for the same fact about every other overlay), so
  // the dialog's interior never reaches prerendered bytes at all.
  it("server-renders the fa-IR trigger with a Persian name and no ASCII digits", () => {
    const html = renderToStaticMarkup(
      <LumoProvider locale="fa-IR">
        <SiteSearch lang="fa-IR" index={INDEX} />
      </LumoProvider>,
    );
    expect(html).toContain("جستجو");
    // "Ctrl"/"K" are letters, not digits — no-latin-digits does not apply to
    // them, and they sit inside Kbd's own data-lumo-latn island regardless.
    expect(visibleText(html)).not.toMatch(/[0-9]/);
  });

  it("carries no Latin-script aria-label/aria-roledescription anywhere in the trigger", () => {
    const html = renderToStaticMarkup(
      <LumoProvider locale="fa-IR">
        <SiteSearch lang="fa-IR" index={INDEX} />
      </LumoProvider>,
    );
    expect(spokenAttributes(html).filter((v) => LATIN_WORD.test(v))).toEqual([]);
  });

  it("still renders correctly, in English, on the en-US route", () => {
    const html = renderToStaticMarkup(
      <LumoProvider locale="en-US">
        <SiteSearch lang="en-US" index={INDEX} />
      </LumoProvider>,
    );
    expect(html).toContain("Search");
    expect(html).not.toContain("جستجو");
  });
});

describe("SiteSearch — Persian search actually works through the real UI", () => {
  it("finds «دکمه» when the query is typed with an Arabic keyboard's ك", async () => {
    renderSearch("fa-IR");
    await openPalette();
    // The Arabic kaf (ك, U+0643), not the Persian keheh (ک, U+06A9) «دکمه» is
    // written with. Without normalize() wired into the live filter, this
    // query finds nothing — see search-index.ts and search-index.test.ts.
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "دكمه" } });
    expect(screen.getByText("دکمه")).toBeTruthy();
    expect(screen.queryByText("جدول")).toBeNull();
    expect(screen.queryByText("سربرگ صفحه")).toBeNull();
  });

  it("shows the translated empty state when nothing matches", async () => {
    renderSearch("fa-IR");
    await openPalette();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "xyz-nonsense" } });
    expect(screen.getByText("نتیجه‌ای پیدا نشد")).toBeTruthy();
  });

  // The visible result count was removed with the cmdk restyle — the list is
  // its own count. That promotion makes the empty state the ONLY signal that
  // nothing matched, so it must be a live region a reader hears, not just a
  // sentence a looker sees.
  it("announces the empty state as a status, since there is no result count", async () => {
    renderSearch("fa-IR");
    await openPalette();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "xyz-nonsense" } });
    const status = screen.getByRole("status");
    expect(status.textContent).toContain("نتیجه‌ای پیدا نشد");
  });
});
