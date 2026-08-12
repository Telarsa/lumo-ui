/**
 * Two defects that the collection family carried in five files, and that
 * nothing in this suite could see, because NEITHER OF THEM PRODUCES BYTES.
 *
 * ── WHY THEY ARE ONE FILE ──────────────────────────────────────────────────
 *
 * `select.tsx`, `menu.tsx`, `combobox.tsx`, `breadcrumbs.tsx`, `list-box.tsx`
 * and `tree.tsx` are six components, and the two facts below are one fact about
 * all six: each was rebuilt off a React Aria collection builder that Base UI
 * does not have, and each kept a piece of the old API's SHAPE after the thing
 * that gave it meaning was gone. One kept it as a type parameter's last
 * anchorage (`items` / `value` / `selectedItem`), the other as a call form the
 * engine cannot render (`children` as a function). Splitting them across six
 * test files would put one line in each and lose the fact that it is a pattern.
 *
 * ── THE TIER: THE COMPILER, DELIBERATELY ───────────────────────────────────
 *
 * Most of what follows is `@ts-expect-error` and bare `void (<… />)` rather
 * than an assertion on markup, and that is the point rather than a shortcut.
 * `gate:types` fails if any one of these expectations goes UNUSED, so the
 * suite goes red the moment a carrier is re-widened into a live prop or the
 * function arm is re-declared — which are the two ways these defects come back,
 * and neither of them changes a single byte of output. Same instrument, and the
 * same reason, as `overlays.test.tsx`'s open-state block and `table.test.tsx`'s
 * owned-prop block.
 *
 * The one thing that IS asserted on output is the positive half of the second
 * claim: a function child that genuinely works has to be seen working, or
 * "we dropped it where it does not work" is unfalsifiable.
 */

import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { Breadcrumbs } from "./breadcrumbs.tsx";
import { ComboBoxItem } from "./combobox.tsx";
import { ListBox, ListBoxItem } from "./list-box.tsx";
import { Menu, MenuItem, MenuSection } from "./menu.tsx";
import { Select, SelectItem, SelectPopover, SelectValue } from "./select.tsx";
import { TreeItem } from "./tree.tsx";

interface City {
  id: string;
  name: string;
}
const CITIES: City[] = [
  { id: "thr", name: "تهران" },
  { id: "sh", name: "شیراز" },
];
/* Typed `City`, not `CITIES[0]`. Under `noUncheckedIndexedAccess` an index read
 * is `City | undefined`, which would still be rejected by a LIVE `value?: T` —
 * so a refusal written that way would keep its `@ts-expect-error` used even
 * after the carrier was widened back into a prop, and would guard nothing. */
const CITY: City = { id: "thr", name: "تهران" };

/* ════════════════════════════════════════════════════════════════════════════
 * A CARRIER REFUSES A VALUE AND ACCEPTS AN ABSENCE — BOTH HALVES
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Eight fields across six files are TYPE CARRIERS: they exist to hold a type
 * parameter that a consumer's `SelectProps<City>` annotation still names, and
 * to make passing a value a compile error instead of a silent drop.
 *
 * Seven of them were spelled `T & never` / `Iterable<T> & never`, which
 * resolves to `never` — and under this repo's `exactOptionalPropertyTypes` a
 * `never` field rejects an explicit `undefined` as well as a value. That is not
 * the carrier's job and it punishes a caller who passed nothing: measured
 * 12 Aug 2026 with this repo's own `tsc`, seven bags of the shape
 * `{ items: undefined, placeholder: "شهر" }` spread onto the seven components
 * produced seven `TS2375`, every one of them *"Type 'undefined' is not
 * assignable to type 'never'"*. `props.ts:1090` writes the rule down and spells
 * `isPending` `?: undefined` for exactly this reason; these sites predated it.
 *
 * The eighth, `TreeItemProps.value`, was not a carrier at all — it was `T`,
 * live in the type and dead in the file. `gate:props` could not see it: the
 * gate matches mentions by NAME and counts module scope for every component, so
 * `renderLevel`'s `<TreePositionContext.Provider value={{…}}>` cleared it as
 * "referenced at module scope". Renaming the field to `zzprobe` and changing
 * nothing else turned that run from 0 violations into
 * `inert-prop/unverified — TreeItemPropsBase.zzprobe`.
 *
 * So this block asserts both halves for all eight, because a fix that only did
 * the first half would be a live prop with a comment, and a fix that only did
 * the second would be the regression it was supposed to remove.
 */
describe("the eight collection type carriers", () => {
  it("accept the key spread in with no value — the half `& never` broke", () => {
    /* Each bag's inferred type for the carrier key is exactly `undefined`: the
     * shape a props object has when a caller never filled an optional field in.
     * Nothing here passes a value, so there is nothing for a carrier to refuse.
     * Every one of these lines was a TS2375 before 12 Aug 2026. */
    void (<Select<City> {...{ items: undefined, placeholder: "شهر" }} aria-label="شهر" />);
    void (<SelectValue<City> {...{ selectedItem: undefined }} />);
    void (<SelectItem<City> {...{ value: undefined, children: "تهران" }} />);
    void (<SelectPopover<City> {...{ items: undefined }} />);
    void (<MenuItem<City> {...{ value: undefined, children: "ویرایش" }} />);
    void (<MenuSection<City> {...{ items: undefined }} />);
    void (<Menu<City> {...{ items: undefined }} />);
    void (<ComboBoxItem<City> {...{ value: undefined, children: "تهران" }} />);
    void (<Breadcrumbs<City> {...{ items: undefined, label: "مسیر" }} />);
    void (<ListBoxItem<City> {...{ value: undefined, children: "تهران" }} />);
    void (<TreeItem<City> {...{ value: undefined }} textValue="تهران" title="تهران" />);
    expect(true).toBe(true);
  });

  it("refuse a value — the half the carriers exist for", () => {
    // @ts-expect-error `items` is a carrier: Base UI has no collection builder.
    void (<Select<City> items={[CITY]} placeholder="شهر" aria-label="شهر" />);
    // @ts-expect-error idem — `SelectValue` reads the value out of context.
    void (<SelectValue<City> selectedItem={CITY} />);
    // @ts-expect-error idem — an option's key is `id`; the object is held by nothing.
    void (<SelectItem<City> value={CITY}>تهران</SelectItem>);
    // @ts-expect-error idem — the panel takes static options only.
    void (<SelectPopover<City> items={[CITY]} />);
    // @ts-expect-error idem.
    void (<MenuItem<City> value={CITY}>ویرایش</MenuItem>);
    // @ts-expect-error idem — `menu.dynamic-collections`.
    void (<MenuSection<City> items={[CITY]} />);
    // @ts-expect-error idem.
    void (<Menu<City> items={[CITY]} />);
    // @ts-expect-error idem — `Combobox.Item` takes an untyped value of its own.
    void (<ComboBoxItem<City> value={CITY}>تهران</ComboBoxItem>);
    // @ts-expect-error idem — there is no collection behind the trail.
    void (<Breadcrumbs<City> items={[CITY]} label="مسیر" />);
    // @ts-expect-error idem — `ListBoxItem` binds no rest.
    void (<ListBoxItem<City> value={CITY}>تهران</ListBoxItem>);
    // @ts-expect-error idem — `TreeItem` reads six names and spreads nothing.
    void (<TreeItem<City> value={CITY} textValue="تهران" title="تهران" />);
    expect(true).toBe(true);
  });

  it("keep the type parameter they exist to keep", () => {
    /* The whole reason none of the eight was simply DELETED. If `<T>` went, so
     * did every `SelectProps<City>` a consumer has already written — and the
     * compiler would not even be able to say what broke, because the annotation
     * would fail on arity rather than on a name. */
    const a: import("./select.tsx").SelectProps<City> = { placeholder: "شهر" };
    const b: import("./menu.tsx").MenuItemProps<City> = { id: "thr" };
    const c: import("./tree.tsx").TreeItemProps<City> = { textValue: "تهران", title: "تهران" };
    const d: import("./select.tsx").SelectPopoverProps<City> = {};
    expect([a.placeholder, b.id, c.textValue, typeof d]).toEqual(["شهر", "thr", "تهران", "object"]);
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * THE FUNCTION CHILD EXISTS EXACTLY WHERE SOMETHING CALLS IT
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Five components declared `children?: LumoNode | ((item: T) => LumoNode)`.
 * Three could render it and two could not, and nothing said which was which —
 * so the docs taught one call shape that worked in three places and silently
 * rendered nothing in two.
 *
 * Measured 12 Aug 2026, one probe per arm:
 *
 *   Menu, function child            0 items, `<div role="none"></div>`, and
 *                                   one console.error: "Functions are not valid
 *                                   as a React child."
 *   SelectPopover, function child   0 × role="option" in an OPEN, mounted
 *                                   listbox, same console.error
 *   SelectPopover, static children  2 × role="option", no error
 *   Base UI Combobox.List, fn child 2 × role="option", no error
 *   Lumo ListBox, function child    2 × role="option", no error
 *
 * The difference is the engine's, which is why the arm was dropped from two
 * components rather than from all five. `@base-ui/react@1.7.0`'s
 * `ComboboxList.d.ts` declares `children?: React.ReactNode | ((item: any,
 * index: number) => React.ReactNode)` and calls it per item; `SelectList.d.ts`
 * declares `SelectListProps extends BaseUIComponentProps<'div',
 * SelectListState>` and adds nothing, so its `children` is a `<div>`'s. `Menu`
 * renders a literal `<div>`. `ListBox` is Lumo's own collection walk and calls
 * the function itself.
 */
describe("the function-child arm", () => {
  it("is a compile error where React would have to render a function", () => {
    // @ts-expect-error `Select.List` has no function arm; this rendered an empty listbox.
    void (<SelectPopover<City>>{(c: City) => <SelectItem id={c.id}>{c.name}</SelectItem>}</SelectPopover>);
    // @ts-expect-error `Menu` renders a plain <div>; this rendered an empty menu.
    void (<Menu<City>>{(c: City) => <MenuItem id={c.id}>{c.name}</MenuItem>}</Menu>);
    expect(true).toBe(true);
  });

  it("still renders where something calls it — ListBox, in the first byte", () => {
    const errors: string[] = [];
    const spy = vi.spyOn(console, "error").mockImplementation((...a: unknown[]) => {
      errors.push(a.map(String).join(" "));
    });
    const html = renderToStaticMarkup(
      <ListBox<City> label="شهرها" items={CITIES}>
        {(c: City) => <ListBoxItem id={c.id}>{c.name}</ListBoxItem>}
      </ListBox>,
    );
    spy.mockRestore();

    /* The positive half. Without it, "dropped where it does not work" is a
     * claim about two components and silence about the other three. */
    expect(html.match(/role="option"/g)).toHaveLength(2);
    expect(html).toContain("تهران");
    expect(html).toContain("شیراز");
    expect(errors).toEqual([]);
  });

  it("and static children still reach the container that lost the arm", () => {
    /*
     * The removal is a narrowing, not a capability loss: every `Select` and
     * `Menu` in this repository's examples and blocks already builds its
     * options with `.map()`, which produces static children and is unaffected.
     * Checked before the removal — no example, block or test used the function
     * form on either component.
     *
     * What this asserts is narrow on purpose: that dropping `{children as
     * LumoNode}` for `{children}` still DELIVERS. It uses bare `<span>`s rather
     * than `<MenuItem>`s because `Menu.Item` throws without a `Menu.Root`
     * ancestor, and the real trigger→popover→menu composition is portaled, so
     * it renders nothing on the server at all. The real composition is covered,
     * open and in a DOM, by `context-menu.test.tsx` and `menubar.test.tsx`.
     */
    const html = renderToStaticMarkup(
      <Menu<City>>
        {CITIES.map((c) => (
          <span key={c.id}>{c.name}</span>
        ))}
      </Menu>,
    );
    expect(html).toContain('role="none"');
    expect(html).toContain("تهران");
    expect(html).toContain("شیراز");
  });
});
