/**
 * Three controls that looked like they did something and did not.
 *
 * ── WHY THESE THREE ARE ONE FILE ───────────────────────────────────────────
 *
 * A pager, a menu and a popover share nothing structurally. They share the
 * failure mode this suite exists for: **an affordance that is present to every
 * reader of the source and absent to the person using it.** Each was reported
 * out of the previous batch and each is invisible to the kind of test that
 * would normally guard it.
 *
 *   pagination   `grep -o 'active:[^ ]*'` returned NOTHING across the whole
 *                file, while three `hover:` rules made the row look styled. On
 *                touch — where `:hover` never fires — every tap on a page
 *                number produced no feedback at all.
 *   menu         `MenuCheckboxItem` existed and no radio item did, so "one of
 *                these" was rebuilt out of checkboxes: identical pixels,
 *                different announcement, and nothing telling a reader that
 *                choosing here unchooses there.
 *   popover      `isKeyboardDismissDisabled` was in the type, destructured into
 *                a discard, and never reached anything. It compiled, it read as
 *                supported, and Escape closed the popover anyway.
 *
 * The assertions below are shaped to fail on the ORIGINAL defect rather than on
 * its absence. Two consequences worth stating, because both were learned the
 * expensive way in `state-vocabulary.test.tsx`:
 *
 *  1. The press assertions are COMPARISONS, not presence checks. `active:` and
 *     `hover:` being byte-identical is what shipped on button, and a presence
 *     check passes on it. jsdom models no pointer — `matches(":active")` is
 *     permanently false — so this stays structural, but structural is exactly
 *     what would have caught it.
 *  2. The radio assertions are about the ROLE and the GROUP, not the tick. A
 *     checkbox rebuild draws the same dot; what it cannot produce is
 *     `menuitemradio` inside a named `role="group"`.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";

import { Button } from "./button.tsx";
import { Dialog, DialogHeading, DialogModal, DialogOverlay, DialogTrigger } from "./dialog.tsx";
import { Drawer, DrawerOverlay } from "./drawer.tsx";
import { Item, ItemTitle } from "./item.tsx";
import { itemVariants } from "./item.variants.ts";
import { linkVariants } from "./link.tsx";
import { Menu, MenuPopover, MenuRadioGroup, MenuRadioItem, MenuTrigger } from "./menu.tsx";
import { paginationItemVariants } from "./pagination.variants.ts";
import { Popover, PopoverDescription, PopoverTrigger } from "./popover.tsx";
import { toggleButtonVariants } from "./toggle-group.variants.ts";

afterEach(cleanup);

/** The utilities a class string carries under one variant prefix, sorted. */
function utilities(classes: string, prefix: string): string {
  return classes
    .split(/\s+/)
    .filter((c) => c.startsWith(prefix))
    .map((c) => c.slice(prefix.length))
    .sort()
    .join(" ");
}

// ═══════════════════════════════════════════════════════════════════════════
// The press that produced nothing
// ═══════════════════════════════════════════════════════════════════════════

describe("pagination — a tap on a page number now changes something", () => {
  it("has a press treatment at all, in both the resting and current cells", () => {
    // The measured defect was ABSENCE, not duplication: zero `active:`
    // utilities in the whole file against three `hover:` ones.
    for (const current of [false, true] as const) {
      const classes = paginationItemVariants({ current });
      expect(utilities(classes, "active:"), `current=${current} has no press treatment`).not.toBe(
        "",
      );
    }
  });

  it("does not spend the press on a copy of the hover", () => {
    for (const current of [false, true] as const) {
      const classes = paginationItemVariants({ current });
      expect(
        utilities(classes, "active:"),
        `current=${current}'s press is a copy of its hover`,
      ).not.toBe(utilities(classes, "hover:"));
    }
  });

  it("nudges on the block axis, and carries no overlay carve-out", () => {
    /*
     * `button.variants.ts` exempts `aria-haspopup` triggers because Base UI
     * anchors an overlay to its trigger's box. No cell in a pager owns an
     * overlay, so the carve-out here would be a selector guarding a state this
     * component cannot enter — the same dead-rule shape the file deleted its
     * `data-hovered:` halves for.
     */
    const base = paginationItemVariants();
    expect(base).toContain("active:translate-y-px");
    expect(base).not.toContain("not-aria-[haspopup]");
  });
});

describe("link — the press was a copy of the hover in every variant", () => {
  it("differs from the hover in all three", () => {
    for (const variant of ["accent", "subtle", "quiet"] as const) {
      const classes = linkVariants({ variant });
      const hover = utilities(classes, "hover:");
      const active = utilities(classes, "active:");
      expect(active, `${variant} has no press treatment`).not.toBe("");
      expect(active, `${variant}'s press is a copy of its hover`).not.toBe(hover);
    }
  });

  it("is not a SUBSET of the hover either, which is what `subtle` was", () => {
    /*
     * `active:text-fg` against `hover:text-fg hover:underline` is not
     * byte-identical, so a naive comparison passes — and yet a press after a
     * hover changed nothing, because everything the press asked for was
     * already on. The press has to say at least one thing the hover does not.
     */
    for (const variant of ["accent", "subtle", "quiet"] as const) {
      const classes = linkVariants({ variant });
      const hover = new Set(utilities(classes, "hover:").split(" "));
      const active = utilities(classes, "active:").split(" ");
      expect(
        active.some((u) => !hover.has(u)),
        `${variant}'s press adds nothing its hover had not already added`,
      ).toBe(true);
    }
  });

  it("does not nudge, because a link is a run of text inside a sentence", () => {
    expect(linkVariants()).not.toContain("translate-y");
  });
});

describe("item — the row had no pointer states, under two dead attribute names", () => {
  it("addresses no React Aria attribute any more", () => {
    // `data-hovered` is in zero files of the installed Base UI dist, and
    // `data-pressed` means the persistent ON state of a Toggle there. Both
    // were in this cva, and neither could ever match an Item.
    const all = itemVariants({ interactive: true });
    expect(all).not.toContain("data-hovered:");
    expect(all).not.toContain("data-pressed:");
  });

  it("paints the pointer states only on a row that is really a control", () => {
    expect(itemVariants({ interactive: true })).toContain("hover:bg-surface-hover");
    expect(itemVariants({ interactive: true })).toContain("active:bg-surface-sunken");
    expect(itemVariants({ interactive: false })).not.toContain("hover:");
    expect(itemVariants({ interactive: false })).not.toContain("active:");
  });

  it("defaults to inert, so a forgotten flag loses feedback rather than lying", () => {
    expect(itemVariants()).not.toContain("hover:");
  });

  it("derives the flag from the rendering, so a static div cannot be painted", () => {
    const link = render(
      <Item href="/fa/profile">
        <ItemTitle>پروفایل</ItemTitle>
      </Item>,
    ).container.querySelector("a")!;
    expect(link.getAttribute("class")).toContain("hover:bg-surface-hover");

    cleanup();
    const button = render(
      <Item onPress={() => {}}>
        <ItemTitle>پروفایل</ItemTitle>
      </Item>,
    ).container.querySelector("button")!;
    expect(button.getAttribute("class")).toContain("hover:bg-surface-hover");

    cleanup();
    const div = render(
      <Item>
        <ItemTitle>پروفایل</ItemTitle>
      </Item>,
    ).container.firstElementChild!;
    expect(div.tagName).toBe("DIV");
    expect(div.getAttribute("class")).not.toContain("hover:");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// The choice that was three checkboxes
// ═══════════════════════════════════════════════════════════════════════════

function SortMenu({ value = "new" }: { value?: string }) {
  return (
    <MenuTrigger defaultOpen>
      <Button variant="outline">مرتب‌سازی</Button>
      <MenuPopover>
        <Menu aria-label="مرتب‌سازی">
          <MenuRadioGroup label="ترتیب نمایش" value={value} onChange={() => {}}>
            <MenuRadioItem value="new">جدیدترین</MenuRadioItem>
            <MenuRadioItem value="old">قدیمی‌ترین</MenuRadioItem>
            <MenuRadioItem value="name">بر پایهٔ نام</MenuRadioItem>
          </MenuRadioGroup>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  );
}

describe("MenuRadioItem — the role a checkbox rebuild cannot produce", () => {
  it("is menuitemradio, not menuitemcheckbox", () => {
    render(<SortMenu />);
    const items = document.querySelectorAll('[role="menuitemradio"]');
    expect(items).toHaveLength(3);
    expect(document.querySelectorAll('[role="menuitemcheckbox"]')).toHaveLength(0);
  });

  it("marks exactly one item checked, which is the fact a checkbox set cannot state", () => {
    render(<SortMenu value="old" />);
    const checked = [...document.querySelectorAll('[role="menuitemradio"]')].filter(
      (el) => el.getAttribute("aria-checked") === "true",
    );
    expect(checked).toHaveLength(1);
    expect(checked[0]!.textContent).toContain("قدیمی‌ترین");
  });

  it("sits inside a role=group that is NAMED — the label is not decoration", () => {
    render(<SortMenu />);
    const group = document.querySelector('[role="group"]')!;
    const labelledBy = group.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    // Resolved in the SAME render rather than in a layout effect. Base UI's own
    // GroupLabel handshake sets the id from `useIsoLayoutEffect`, so the group
    // would be nameless in a server render; menu.tsx generates the id itself.
    expect(document.getElementById(labelledBy!)!.textContent).toBe("ترتیب نمایش");
  });

  it("keeps the indicator out of the accessible name", () => {
    /*
     * The tick and the dot are real elements rather than `::before` content
     * because browsers fold pseudo-element content into an accessible name.
     * The gutter is `aria-hidden`, so the name is the label and nothing else.
     */
    render(<SortMenu />);
    const item = document.querySelector('[role="menuitemradio"]')!;
    expect(item.querySelector("[aria-hidden='true']")).not.toBeNull();
    expect(item.textContent).toBe("جدیدترین");
  });

  it("reserves the gutter whether or not the dot is drawn, at the checkbox width", () => {
    // Both indicator gutters are `size-4`. A menu holding a radio group above a
    // checkbox group must have ONE text inset or the two groups' labels step.
    render(<SortMenu />);
    for (const item of document.querySelectorAll('[role="menuitemradio"]')) {
      expect(item.querySelector("[aria-hidden='true']")!.getAttribute("class")).toContain("size-4");
    }
  });

  it("leaks no English into an open menu", () => {
    render(<SortMenu />);
    for (const el of document.querySelectorAll("[aria-label]")) {
      expect(el.getAttribute("aria-label")).not.toMatch(/[A-Za-z]{3,}/);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// The prop that was accepted and did nothing
// ═══════════════════════════════════════════════════════════════════════════

describe("Popover's isKeyboardDismissDisabled", () => {
  it("is gone from the surface, so passing it there does not compile", () => {
    /*
     * The type is the assertion — this body only pins that the runtime no
     * longer swallows it either. `@ts-expect-error` FAILS the build if the prop
     * ever becomes assignable again, which is what makes this a test rather
     * than a comment.
     */
    render(
      <PopoverTrigger defaultOpen>
        <Button>بیشتر</Button>
        {/* @ts-expect-error dismissal lives on PopoverTrigger, not on the surface */}
        <Popover isKeyboardDismissDisabled>متن</Popover>
      </PopoverTrigger>,
    );
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it("describes the panel, which nothing did before — the DialogDescription gap", () => {
    /*
     * The popup is `role="dialog"`. Its NAME was already solved (it points at
     * the trigger); its DESCRIPTION was not published at all, so every panel
     * announced the trigger's text and then went silent while a hand-rolled
     * `<p className="text-sm text-fg-muted">` sat visible on the page.
     */
    render(
      <PopoverTrigger defaultOpen>
        <Button>گزینه‌ها</Button>
        <Popover>
          <PopoverDescription>این پنل نامش را از دکمه می‌گیرد.</PopoverDescription>
        </Popover>
      </PopoverTrigger>,
    );
    const popup = document.querySelector('[role="dialog"]')!;
    const describedBy = popup.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)!.textContent).toBe(
      "این پنل نامش را از دکمه می‌گیرد.",
    );
    // The name still comes from the trigger. The two attributes are read in
    // sequence, not in competition — this pins that adding one did not take
    // the other away.
    expect(popup.getAttribute("aria-labelledby")).toBeTruthy();
  });

  it("reaches the state owner, where Base UI can actually act on it", () => {
    // `PopoverTrigger` renders `Popover.Root`, which is the only part with an
    // `onOpenChange` carrying a cancellable `escape-key` reason.
    render(
      <PopoverTrigger defaultOpen isKeyboardDismissDisabled>
        <Button>بیشتر</Button>
        <Popover>متن</Popover>
      </PopoverTrigger>,
    );
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// The same prop, on the two overlays that still swallowed it
// ═══════════════════════════════════════════════════════════════════════════

/**
 * `dialog.tsx` and `drawer.tsx` carried the identical defect one batch longer:
 * the prop was declared on `ModalOverlayPropsBase`, i.e. on FOUR parts —
 * `DialogOverlay`, `DialogModal`, `DrawerOverlay`, `Drawer` — and none of them
 * renders the `Dialog.Root` that owns dismissal. It is now on `DialogTrigger`,
 * which is the state owner for dialogs and drawers alike.
 *
 * Unlike the popover pair above, these assertions are BEHAVIOURAL rather than
 * structural: Escape is a keydown, and jsdom dispatches keydowns faithfully —
 * unlike `:active`, which it can never model. So each case is a comparison
 * against the same tree WITHOUT the prop, which is the arm that has to keep
 * closing. A test that only asserted "still open with the prop" would pass
 * against a dialog that Escape had never closed in the first place.
 */
function DialogUnderTest(props: { isKeyboardDismissDisabled?: boolean; onOpenChange?: () => void }) {
  return (
    <DialogTrigger defaultOpen {...props}>
      <Button>ویرایش</Button>
      <DialogOverlay>
        <DialogModal>
          <Dialog closeLabel="بستن">
            <DialogHeading>ویرایش پروفایل</DialogHeading>
          </Dialog>
        </DialogModal>
      </DialogOverlay>
    </DialogTrigger>
  );
}

function DrawerUnderTest(props: { isKeyboardDismissDisabled?: boolean }) {
  return (
    <DialogTrigger defaultOpen {...props}>
      <Button>منو</Button>
      <DrawerOverlay>
        <Drawer side="start">
          <Dialog closeLabel="بستن">
            <DialogHeading>فهرست</DialogHeading>
          </Dialog>
        </Drawer>
      </DrawerOverlay>
    </DialogTrigger>
  );
}

const pressEscape = () => fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });

describe("Dialog and Drawer's isKeyboardDismissDisabled", () => {
  it("is gone from all four overlay parts, so passing it there does not compile", () => {
    /*
     * The types are the assertions. `@ts-expect-error` FAILS the build if any
     * of these becomes assignable again — which is what makes this a test and
     * not a comment. The body only pins that the runtime still renders.
     */
    render(
      <DialogTrigger defaultOpen>
        <Button>ویرایش</Button>
        {/* @ts-expect-error dismissal lives on DialogTrigger, not on the overlay */}
        <DialogOverlay isKeyboardDismissDisabled>
          {/* @ts-expect-error dismissal lives on DialogTrigger, not on the panel */}
          <DialogModal isKeyboardDismissDisabled>
            <Dialog closeLabel="بستن">
              <DialogHeading>عنوان</DialogHeading>
            </Dialog>
          </DialogModal>
        </DialogOverlay>
      </DialogTrigger>,
    );
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    cleanup();

    render(
      <DialogTrigger defaultOpen>
        <Button>منو</Button>
        {/* @ts-expect-error dismissal lives on DialogTrigger, not on the overlay */}
        <DrawerOverlay isKeyboardDismissDisabled>
          {/* @ts-expect-error dismissal lives on DialogTrigger, not on the panel */}
          <Drawer side="start" isKeyboardDismissDisabled>
            <Dialog closeLabel="بستن">
              <DialogHeading>فهرست</DialogHeading>
            </Dialog>
          </Drawer>
        </DrawerOverlay>
      </DialogTrigger>,
    );
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it("a dialog without it still closes on Escape — the arm that proves the other one", () => {
    render(<DialogUnderTest />);
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    pressEscape();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("a dialog with it survives Escape", () => {
    render(<DialogUnderTest isKeyboardDismissDisabled />);
    pressEscape();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it("a drawer behaves the same, because its state owner is the same component", () => {
    // And `close-watcher` — the Android back gesture reason — cannot arrive on
    // this path: `CloseWatcher` is constructed only in `drawer/root/DrawerRoot`,
    // which this component deliberately does not render. See drawer.tsx.
    render(<DrawerUnderTest />);
    pressEscape();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    cleanup();

    render(<DrawerUnderTest isKeyboardDismissDisabled />);
    pressEscape();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it("does not tell a controlled caller it closed when it did not", () => {
    /*
     * The half-fix worth guarding: cancelling Base UI's own handling while
     * still forwarding `onOpenChange(false)` would leave a controlled dialog
     * with `isOpen={false}` in the caller's state and an open dialog on screen.
     */
    const onOpenChange = vi.fn();
    render(<DialogUnderTest isKeyboardDismissDisabled onOpenChange={onOpenChange} />);
    pressEscape();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it("intercepts Escape only — the ✕ closes a dialog that refuses the key", () => {
    // The reason is `close-press`, a different member of the union measured in
    // dialog.tsx's header, so the cancel above must not touch it.
    const { getByRole } = render(<DialogUnderTest isKeyboardDismissDisabled />);
    fireEvent.click(getByRole("button", { name: "بستن" }));
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// The press that the engine cancels
// ═══════════════════════════════════════════════════════════════════════════

describe("toggle-group — the one press in the toggle family that answers nothing", () => {
  it("has a press treatment that is not a copy of its hover", () => {
    /*
     * `toggle.variants.ts` declines `active:` because a toggle's press changes
     * its state. Inside a group with `disallowEmptySelection` the un-press is
     * CANCELLED (`details.cancel()`), so the state does not change and on touch
     * — no `:hover` — the item reads as dead. jsdom models no pointer, so this
     * is structural for the reason `state-vocabulary.test.tsx` states.
     */
    const classes = toggleButtonVariants();
    const active = utilities(classes, "active:");
    expect(active, "the cancelled press produces nothing at all").not.toBe("");
    expect(active, "the press is a copy of the hover").not.toBe(utilities(classes, "hover:"));
  });

  it("does not nudge, because the items are welded into one clipped strip", () => {
    // The group is `overflow-hidden`, so a `translate-y-px` on one item clips
    // against the group's own edge and opens a gap beside its neighbours.
    expect(toggleButtonVariants()).not.toContain("translate-y");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// The prop that compiled, rendered nothing, and announced nothing
// ═══════════════════════════════════════════════════════════════════════════

describe("ButtonPropsBase — the two props that never reached the element", () => {
  /*
   * `isPending` and `preventFocusOnPress` came from the frozen React Aria API
   * and have no Base UI equivalent, so `button.tsx` destructured both for the
   * sole purpose of NOT spreading them. Set either and nothing rendered,
   * nothing was announced, and nothing errored — while `props.ts` documented
   * `isPending` in the present tense as "whether the button is in a pending
   * state".
   *
   * Both are `?: undefined` now, which turns the silence into a compile error.
   * THE TYPES ARE THE ASSERTION: `@ts-expect-error` fails the build if either
   * prop ever becomes settable again, so this cannot regress quietly the way it
   * originally arrived.
   *
   * `?: undefined` and not `?: never`, which was the first cut here: under this
   * repo's `exactOptionalPropertyTypes: true`, a `never` field rejects an
   * EXPLICIT `undefined` as well, so `<Button {...props}>` stopped compiling for
   * any caller whose object carried `isPending: undefined`. The second test
   * below is what caught that — it is the spread case, not a formality.
   */
  it("cannot be passed a value", () => {
    const { getByRole } = render(
      <>
        {/* @ts-expect-error a busy button is a composition; see the busy example */}
        <Button isPending>ذخیره</Button>
        {/* @ts-expect-error focus on press is the browser's here, not the library's */}
        <Button preventFocusOnPress>انصراف</Button>
      </>,
    );
    // Rendered, not just typechecked: the props must be absent from the DOM
    // too, or a future spread would put `ispending="true"` in the markup.
    const busy = getByRole("button", { name: "ذخیره" });
    expect(busy.getAttribute("ispending")).toBeNull();
    expect(busy.getAttribute("aria-busy")).toBeNull();
  });

  it("still accepts undefined, so optional annotations keep compiling", () => {
    const maybe: { isPending?: undefined } = {};
    const { getByRole } = render(<Button {...maybe}>ذخیره</Button>);
    expect(getByRole("button", { name: "ذخیره" })).toBeDefined();
  });
});
