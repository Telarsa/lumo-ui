"use client";

import { Children, createContext, isValidElement, useContext, useId, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, ChevronDown } from "lucide-react";
import { Select as BaseSelect } from "@base-ui/react/select";
import { cn, type LumoNode, type ValidationError } from "@lumo-ui/core";
import { popoverVariants } from "./popover.tsx";
import { Description, Field, FieldError, optional, useFieldControl } from "./form.tsx";

/**
 * EXPERIMENT — this file is the React Aria Select rebuilt on Base UI 1.7.0.
 * The React Aria original is `experiments/baseline-rac/select.tsx`; the public
 * API below is unchanged, and `packages/ui/src/overlays.test.tsx` runs against
 * it UNEDITED. Every divergence found while porting is recorded, with evidence,
 * in `experiments/measurements/rebuild-collections.json`.
 *
 * A single-select listbox in a popover.
 *
 *     <Select placeholder="یک شهر انتخاب کنید" onSelectionChange={…}>
 *       <SelectTrigger />
 *       <SelectPopover>
 *         <SelectItem id="thr">تهران</SelectItem>
 *         <SelectItem id="isf">اصفهان</SelectItem>
 *       </SelectPopover>
 *     </Select>
 *
 * ── WHY `placeholder` IS STILL REQUIRED, FOR A DIFFERENT REASON ─────────────
 *
 * Under React Aria the prop was required because `SelectValue` fell back to
 * RAC's own `selectPlaceholder: "Select an item"` bundle string, which rendered
 * the English phrase into the first byte of a Persian page.
 *
 * Base UI ships **no string bundle at all** — grepped, not assumed: the whole
 * of `@base-ui/react/select` contains zero `aria-label` literals and zero
 * translatable strings (see `rebuild-collections.json`, `english_strings`).
 * `<Select.Value>` with no `placeholder` and no value renders EMPTY.
 *
 * So the failure mode inverts: React Aria shipped the wrong language, Base UI
 * ships nothing. An empty collapsed control is a worse defect than an English
 * one, because it is invisible in review — there is no Latin word for a gate to
 * catch, and a screenshot of an unselected Select looks like a styling bug
 * rather than a missing string. The prop stays required, and the argument for
 * requiring it is now stronger, not weaker.
 *
 * ── THE CAPABILITY GAP THAT SHIPPED A LATIN KEY TO PERSIAN READERS ──────────
 *
 * React Aria resolves a selected KEY to that item's rendered text, because the
 * collection is built before render. Base UI's `<Select.Value>` resolves the
 * label only from the Root's `items` prop (`resolveSelectedLabel` in
 * `internals/resolveValueLabel.mjs` — it never consults mounted items), and the
 * items live inside a portal that is `null` while closed. With
 * `defaultSelectedKey="thr"` and no `items`, this component rendered the raw
 * key `thr` where React Aria rendered `تهران`.
 *
 * That was documented here as "left HONEST rather than patched" and SHIPPED for
 * two weeks. Measured in the built export at `10a08dc`:
 *
 *     fa/components/select/index.html        <span …>thr</span>
 *     view-block/fa/data-toolbar/index.html  newest
 *     view-block/fa/table-view/index.html    newest
 *
 * with the RSC payload immediately below each carrying `label:"تازه‌ترین"`. It
 * SELF-HEALS on hydration — `Select.Item` publishes its text to the store from
 * an effect — so 1782 tests and nine gate rules were green over it: a `render()`
 * under jsdom sees the Persian a tick later, and no rule grades Latin WORDS in
 * visible text, only digits and `aria-*`. The comment was true, and being true
 * bought nothing. AUDIT §2.1.
 *
 * ── WHY THE FIX IS A LABEL MAP AND NOT A COLLECTION BUILDER ─────────────────
 *
 * The old argument against walking `children` was that it "would reimplement a
 * collection builder inside a wrapper, which is the exact thing renting a
 * headless library is supposed to buy." That argument mis-states what is being
 * built. `collectItemLabels` below derives ONE thing — a `value → label`
 * record — and hands it to `Select.Root`'s own `items` prop, which is the
 * documented input Base UI asks for and which `resolveSelectedLabel` reads
 * directly (`items[value] ?? fallback()`). Everything a collection actually is
 * — highlight, typeahead, selection, keyboard order, the `aria-activedescendant`
 * chain — stays the engine's, unread and untouched by this file.
 *
 * The alternative the audit offered — make `items` a REQUIRED public prop when
 * a key is selected — was declined. It makes the defect a compile error, but it
 * buys that by asking every caller to write each option's label TWICE, once in
 * the array and once as the `SelectItem`'s child, with nothing checking that
 * the two agree. That is a new silent-divergence class traded for an old one,
 * and in a Persian-first library the string that would drift is the announced
 * one. The children are already the single source of truth; the fix reads them.
 *
 * ── THE HALF A DERIVATION CANNOT REACH, WHICH IS THEREFORE A TYPE ───────────
 *
 * A derivation can only take a label an item HAS. `<SelectItem id="ent">` whose
 * child is a flex row holding a city and a «تکمیل ظرفیت» note has no string to
 * take, and would fall straight back to the raw key. `textValue` was the prop
 * for that and was optional, with the requirement written in prose — the same
 * shape as the defect above, one line down.
 *
 * `SelectItemProps` is now a discriminated union: a plain string child needs
 * nothing, and any other child requires `textValue`. `link.tsx`'s
 * `newTab`/`newTabLabel` pair is the same construction for the same reason.
 * With both halves in place there is no `SelectItem` this file can compile that
 * it cannot name, and `select.test.tsx` asserts each half — the strings against
 * `renderToStaticMarkup`, the type against `@ts-expect-error`.
 *
 * ── THE FIELD THIS COMPONENT DID NOT HAVE ──────────────────────────────────
 *
 * Until 12 Aug 2026 `<Select>` rendered no `Field.Root`, and the three things a
 * field says other than its name were therefore not sayable. Measured at that
 * commit with `renderToStaticMarkup`, and pinned as the poison twins at the top
 * of `ssr-field-wiring.test.tsx`:
 *
 *     description   no prop, no element, no `aria-describedby` on the trigger.
 *     errorMessage  no prop — so a REQUIRED Select that failed validation had
 *                   nothing to render and nothing to announce.
 *     isInvalid     no prop, and neither `data-invalid` nor `aria-invalid` in
 *                   the served bytes, because BOTH reach `Select.Trigger` from
 *                   `useFieldRootContext` and there was no root to read.
 *
 * All three were GENUINELY ABSENT from `SelectProps` rather than typed and
 * inert — `SelectProps` declares no index signature and `Select` spreads no
 * rest, so `<Select isInvalid>` was a compile error, verified by running `tsc`
 * against exactly that call site before the fix. That is the better of the two
 * failure modes (contrast `isPending`, `isKeyboardDismissDisabled` and
 * `preventFocusOnPress`, which this repository shipped as accepted-and-dropped)
 * and it is why the fix could be purely additive: no call site was relying on a
 * spelling that did nothing.
 *
 * The fix is `form.tsx`'s `<Field>`, wrapped around `Select.Root` rather than
 * inside it, and the direction is forced rather than chosen: `SelectRoot.mjs`
 * reads `name`, `disabled`, `validation` and `validationMode` out of
 * `useFieldRootContext()`, so a `Field.Root` BELOW the Select root reaches
 * nothing. Base UI's own `Select.Root` renders no DOM, so putting the field
 * above it costs no element — `Field.Root`'s `<div>` simply becomes the box
 * `selectVariants` and `className` were already being attached to.
 *
 * Two consequences that had to be measured rather than assumed:
 *
 *   1. `aria-invalid="true"` DOES reach `Select.Trigger` in the first byte once
 *      a `Field.Root` is above it, from `useFieldValidation`'s
 *      `getValidationProps`. It is not one of the layout-effect relationships
 *      `@lumo-ui/base-ui-ssr` exists for, so nothing here works around it.
 *   2. `aria-describedby` does NOT — the description and error register their
 *      ids from a layout effect, exactly as they do for Checkbox and Switch. So
 *      the trigger takes its describedby from `useFieldControl()`, resolved
 *      during render. A `Field.Root` alone would have fixed the validity half
 *      and left the announcement half silently missing, which is the shape of
 *      defect this repository's ledger is full of.
 */

export const selectVariants = cva("group flex w-full flex-col gap-1.5");

/**
 * The collapsed control.
 *
 * ── WHY IT GREW A `size`, AND WHY THE SIZE IS NOT SHADCN'S ─────────────────
 *
 * The height was a hardcoded `h-control-md`, which made this the only field
 * control in the library without one: `inputVariants`, `searchInputVariants`,
 * `toggleVariants` and `buttonVariants` all take sm/md/lg from the same
 * density-scaled tokens. A `<TextField size="sm">` beside a `<Select>` in one
 * form row therefore rendered two different heights with no prop to reconcile
 * them — a gap in Lumo's own system rather than a feature copied from anyone.
 *
 * shadcn's select takes `"sm" | "default"` and emits it as `data-size`. The
 * three-value scale is taken instead because that is what every other control
 * here already answers to, and `lg` is the one that meets the 44px touch floor
 * Khroos specifies — a two-value scale topping out at 36px cannot.
 */
export const selectTriggerVariants = cva(
  "flex w-full cursor-pointer items-center justify-between gap-2 " +
    "rounded-md border border-border-control bg-surface ps-3 pe-2 text-sm text-fg " +
    // Logical padding, asymmetric on purpose: the value needs breathing room at
    // the reading edge, the chevron sits tight against the trailing edge. In
    // Persian both swap sides, which `pl-3 pr-2` would not.
    //
    // `hover:` replaces RAC's `data-hovered:`. Base UI emits NO hover attribute
    // on any part — its trigger's full set is data-popup-open / data-pressed /
    // data-disabled / data-readonly / data-popup-side / data-required /
    // data-valid / data-invalid / data-touched / data-dirty / data-filled /
    // data-focused / data-placeholder. Keeping `data-hovered:` would have left
    // a class that styles nothing and reviews as if it did.
    "hover:bg-surface-hover " +
    // `data-invalid` on the TRIGGER, not on a wrapper: `Select.Trigger` spreads
    // the field's state into its own, so the attribute is on the button whose
    // border this colours. Same declaration as `inputVariants`, so an invalid
    // Select and an invalid TextField in one form row read alike.
    "data-invalid:border-critical " +
    // `pointer-events-none` only. The DIMMING lives on the `Field.Root` wrapper
    // (`fieldVariants`' `data-disabled:opacity-60`), and Base UI writes
    // `data-disabled` on BOTH — measured, `renderToStaticMarkup` of a disabled
    // Select carries it on the wrapper `<div>` and on the `<button>`. Restating
    // `opacity-50` here would multiply to 0.30, which reads as broken rather
    // than as disabled; form.tsx's header states the same rule for the same
    // reason.
    "data-disabled:pointer-events-none " +
    // RAC wrote `data-open`; Base UI writes `data-popup-open`.
    "data-popup-open:border-border-strong",
  {
    variants: {
      size: {
        // The same three the rest of the field family uses, from the same
        // density-scaled control tokens rather than literal rems. `text-*`
        // moves with them: a 44px control holding 14px text reads as a mistake.
        sm: "h-control-sm text-sm",
        md: "h-control-md text-sm",
        lg: "h-control-lg text-base",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type SelectTriggerVariantProps = VariantProps<typeof selectTriggerVariants>;

export const selectValueVariants = cva(
  // `text-start`, never `text-left`. This is the single most copied physical
  // utility in form controls.
  "flex-1 truncate text-start data-placeholder:text-fg-subtle",
);

export const selectPopoverVariants = cva(
  // RAC wrote the trigger's measured width as `--trigger-width`; Base UI's
  // positioner writes `--anchor-width` (verified in useAnchorPositioning.mjs).
  // The variable name is engine-owned, so this is a forced edit, not a restyle
  // — keeping `--trigger-width` would silently shrink-wrap the panel.
  "w-[var(--anchor-width)] overflow-auto p-0",
);

export const selectListBoxVariants = cva("max-h-[inherit] overflow-auto p-1 outline-none");

export const selectGroupLabelVariants = cva(
  // `px-2` matches the item's inline padding so the heading's first glyph lines
  // up with the option text under it, in both scripts — `px-*` is
  // `padding-inline`. `pt-1.5 pb-1` is asymmetric on the BLOCK axis on purpose:
  // a heading belongs closer to what it heads than to what precedes it.
  "px-2 pt-1.5 pb-1 text-xs font-medium text-fg-subtle",
);

export const selectSeparatorVariants = cva(
  // `-mx-1` bleeds the rule through the list's own `p-1` so it spans the full
  // popup width. Logical, so it bleeds the same amount on each side either way.
  "-mx-1 my-1 h-px bg-border",
);

export const selectItemVariants = cva(
  "flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 " +
    "text-sm text-fg outline-none " +
    // RAC's one focus cursor was `data-focused`; Base UI calls the same state
    // `data-highlighted`, and drives it for pointer and keyboard alike exactly
    // as RAC did. Same behaviour, different attribute name.
    "data-highlighted:bg-surface-hover " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
);

/**
 * Carries the two strings that React Aria took on the Root and delivered to
 * descendants through its own context: the required `placeholder`, read by
 * `SelectValue`, and `aria-label`, which Base UI expects on `Select.Trigger`
 * rather than on the root.
 *
 * A Lumo-owned React context is the right tool here and NOT the thing DECISIONS
 * §0.1 rules out — that section is about RAC's `LocalizedStringProvider`, which
 * renders no children and only sets a `window` global. A plain React context
 * renders on the server, which is the tier this library is measured at.
 *
 * It no longer carries the trigger's id. That pairing now comes from the
 * `<Field>` above, through `useFieldControl()`, which is the same seam every
 * other control in the library reads — and it delivers `aria-describedby` in
 * the same object, so there is nothing left for a second channel to carry.
 */
interface SelectFieldContextValue {
  placeholder: string;
  label: string | undefined;
}

const SelectFieldContext = createContext<SelectFieldContextValue | null>(null);

/**
 * Every `SelectItem` reachable from `node`, as `{ [id]: label }`.
 *
 * ── WHAT THIS IS AND IS NOT ────────────────────────────────────────────────
 *
 * It is the argument `Select.Root`'s `items` prop wants, in the RECORD form
 * `resolveSelectedLabel` reads with a single lookup (`items[value] ??
 * fallback()`, `internals/resolveValueLabel.mjs`). It is not a collection: it
 * carries no order, no disabled state, no element identity, and nothing reads
 * it except the collapsed `<Select.Value>`. The engine's own item registry
 * still runs, still wins after mount, and still agrees.
 *
 * ── WHY IT RECURSES RATHER THAN SCANNING ONE LEVEL ─────────────────────────
 *
 * The items a real Persian form uses are inside `<SelectPopover>`, and grouped
 * ones are inside a `<SelectGroup>` inside that — two and three levels down
 * from `Select`'s own children. A one-level scan passes the flat exemplar in
 * this file's header and ships the grouped case broken, which is why
 * `select.test.tsx` asserts the grouped case separately.
 *
 * `Children.forEach` is used rather than a bare array walk because it flattens
 * fragments and nested arrays, which is what `{items.map(…)}` at a call site
 * produces. Elements that are not items are descended into rather than skipped,
 * so a caller's own wrapper component's CHILDREN are still seen — but a wrapper
 * that renders its items from its own props rather than from `children` is
 * invisible here, exactly as it is to any pre-render walk. That is the residue,
 * and it is bounded: such an item resolves to the raw key, the same as before,
 * and `SelectValue` accepts `children` for callers who need to take the label
 * into their own hands.
 *
 * ── WHY THE TEST IS `props`-SHAPED AND NOT `child.type === SelectItem` ─────
 *
 * That identity check is the obvious one, it is what the first version of this
 * function used, it passes every test in `select.test.tsx`, AND IT SHIPS THE
 * DEFECT ANYWAY. Measured by instrumenting `next build` on 12 Aug 2026 and
 * reading the export: the label map came out `{}` for every `<Select>` written
 * in a SERVER component, and non-empty only for the ones inside `"use client"`
 * blocks. Exactly one `thr` survived in `fa/components/select/index.html` — the
 * disabled example — while `view-block/fa/data-toolbar` and
 * `view-block/fa/table-view` were fixed. One page's worth of the original
 * defect, hidden behind a green suite, is precisely the shape this repository's
 * ledger is made of, so the mechanism is recorded rather than the symptom.
 *
 * The cause is the RSC boundary. `Select` and `SelectItem` are both `"use
 * client"`. When a Server Component writes `<Select><SelectPopover><SelectItem
 * id="thr">تهران</SelectItem>…`, those elements are created in the SERVER graph,
 * serialised into the flight payload, and revived for SSR. The revived elements
 * are real elements — `$$typeof: Symbol(react.transitional.element)`, `props`
 * intact, nesting intact, dumped and read — but `element.type` is a CLIENT
 * REFERENCE object standing in for the module export, not the `SelectItem`
 * function this module holds. `===` against a function is therefore false for
 * every item, on every server-rendered page, and true only when the caller is
 * itself a client component and no boundary was crossed.
 *
 * So the identity test is not a stricter version of this one. It is a test that
 * silently answers "no" on exactly the tier this library is measured at, and
 * that is why it is gone rather than kept as a fast path — a fast path whose
 * slow path must be correct anyway is two things to maintain and one of them is
 * never exercised where it matters.
 *
 * What survives the boundary is `props`, so the predicate reads `props`: an
 * `id` to key the map by, and a string to put in it. The false-positive surface
 * is the exact set of elements inside a `<Select>` that carry an `id` AND
 * either a string child or a `textValue`, and inside this component's own parts
 * that set is empty — `SelectGroup` takes `label` and element children,
 * `SelectTrigger` and `SelectSeparator` take no `id`, and a `<Label>` written
 * as a child carries neither. A stray `<div id="…">متن</div>` would register,
 * and would change what the collapsed control reads only if `selectedKey` were
 * equal to that `id` — at which point the caller has two things claiming one
 * key and the ambiguity is theirs.
 */
function isItemProps(props: unknown): props is SelectItemProps & { id: string } {
  if (props === null || typeof props !== "object") return false;
  const p = props as { id?: unknown; textValue?: unknown; children?: unknown };
  if (typeof p.id !== "string") return false;
  return typeof p.textValue === "string" || typeof p.children === "string";
}

function collectItemLabels(node: LumoNode, into: Record<string, string>): void {
  Children.forEach(node as ReactNode, (child) => {
    if (!isValidElement(child)) return;
    if (isItemProps(child.props)) {
      const props = child.props;
      // `textValue` first: an item that carries one has said outright what the
      // collapsed control should read, and a string child is only the shortcut
      // for the case where those two are the same sentence.
      into[props.id] =
        typeof props.textValue === "string" ? props.textValue : (props.children as string);
      return;
    }
    const inner = (child.props as { children?: LumoNode }).children;
    if (inner !== undefined) collectItemLabels(inner, into);
  });
}

export interface SelectProps<T extends object> {
  /**
   * Visible text shown when nothing is selected. REQUIRED — see the file
   * header: Base UI's fallback is an EMPTY control, which is worse than RAC's
   * English one because nothing on screen says a string is missing.
   */
  placeholder: string;
  /** Announced name, when no visible `<Label>` names the control. */
  "aria-label"?: string | undefined;
  /**
   * Help text under the control, wired into the trigger's `aria-describedby`
   * during RENDER — not after hydration. Rendered by this component, below
   * `children`, so a consumer composing `<Label>`/`<SelectTrigger>` by hand
   * cannot put it in the wrong place or forget it.
   */
  description?: LumoNode;
  /**
   * An error to display. Supplying one marks the field invalid, because a field
   * carrying an error message and reporting itself valid is a contradiction the
   * caller should not have to resolve by hand. Same rule as `TextField`.
   */
  errorMessage?: LumoNode;
  /** Overrides the invalid state derived from `errorMessage`. */
  isInvalid?: boolean | undefined;
  /** Returns a caller-authored error for the selected key, or `true` when valid. */
  validate?: ((key: string | null) => ValidationError | true | null | undefined) | undefined;
  /** The selected key. Maps to Base UI's `value`. */
  selectedKey?: string | null | undefined;
  /** The initially selected key. Maps to Base UI's `defaultValue`. */
  defaultSelectedKey?: string | null | undefined;
  /** Called with the newly selected key. Maps to Base UI's `onValueChange`. */
  onSelectionChange?: ((key: string | null) => void) | undefined;
  isDisabled?: boolean | undefined;
  isRequired?: boolean | undefined;
  isOpen?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((isOpen: boolean) => void) | undefined;
  /** Form field name for the hidden input Base UI renders. */
  name?: string | undefined;
  /**
   * TYPE CARRIER, NOT A PROP. React Aria's `SelectProps<T>` fed `T` to
   * `AriaSelectProps<T>`'s `items?: Iterable<T>`. Base UI has no collection
   * builder, so nothing is left for `T` to type. Keeping the field keeps the
   * type PARAMETER, so a `SelectProps<City>` annotation a consumer already
   * wrote still compiles, and the carrier makes passing a value a compile
   * error rather than a prop that is accepted and silently dropped.
   *
   * ── THIS FIELD WAS `Iterable<T> & never`, AND THAT SPELLING HAD A COST ────
   *
   * The three carriers in this file, the two in `menu.tsx`, one in
   * `combobox.tsx` and one in `breadcrumbs.tsx` were all spelled `& never`.
   * That resolves to `never`, and under this repo's
   * `exactOptionalPropertyTypes: true` a `never` field rejects an explicit
   * `undefined` as well as a value — which is a different thing and is not the
   * carrier's job. `props.ts:1090` states the rule and spells `isPending`
   * `?: undefined` for exactly this reason; these seven sites predated it.
   *
   * Measured 12 Aug 2026 with this repo's own `tsc`, before touching any of
   * them: seven bags of the shape `{ items: undefined, placeholder: "شهر" }` —
   * no value passed, the key present and holding nothing — spread onto the
   * seven components produced SEVEN `TS2375`, one per site, every one of them
   * *"Type 'undefined' is not assignable to type 'never'"*. That is a caller
   * whose spread was already correct being told to stop. `ListBoxItem.value`,
   * already `(T & never) | undefined`, took the identical bag and compiled —
   * the control that says the seven failures were the spelling and not the
   * spread.
   *
   * Written `(Iterable<T> & never) | undefined` rather than a bare `undefined`
   * for the mechanical reason `list-box.tsx:754` gives: `T` has to stay READ or
   * `noUnusedLocals` rejects the file, and dropping `<T>` is the API break this
   * field exists to prevent. `Iterable<T> & never` collapses to `never` and
   * `never | undefined` collapses to `undefined`, so the resolved type IS the
   * carrier, `T` keeps its job, and an explicit `items: undefined` in a spread
   * compiles again.
   */
  items?: (Iterable<T> & never) | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

export function Select<T extends object>({
  placeholder,
  "aria-label": ariaLabel,
  description,
  errorMessage,
  isInvalid,
  validate,
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  isDisabled,
  isRequired,
  isOpen,
  defaultOpen,
  onOpenChange,
  name,
  className,
  children,
}: SelectProps<T>) {
  const [uncontrolledKey, setUncontrolledKey] = useState<string | null>(
    defaultSelectedKey ?? null,
  );
  const validationKey = selectedKey !== undefined ? selectedKey : uncontrolledKey;
  const validationResult = validate?.(validationKey);
  const validationMessage =
    validationResult === true || validationResult == null
      ? undefined
      : Array.isArray(validationResult)
        ? validationResult[0]
        : validationResult;
  const effectiveError = errorMessage ?? validationMessage;
  /*
   * The `value → label` record `Select.Value` resolves the collapsed text
   * from. Derived from `children` on EVERY render path including the server's,
   * which is the whole point: the defect this replaces was visible only in the
   * first byte and healed before any effect-based instrument could see it.
   *
   * `useMemo` is not a micro-optimisation here. `SelectRoot` writes `items`
   * into its store from a `useIsoLayoutEffect` whose dependency list includes
   * it, so a fresh object identity every render would queue a store write every
   * render. Keyed on `children`, which is a new object exactly when the item
   * set can have changed.
   */
  const itemLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    collectItemLabels(children, labels);
    return labels;
  }, [children]);

  return (
    /*
     * ── THE TWELVE, AND THE SEAM PHASE A SAID DID NOT EXIST ─────────────────
     *
     * Every one of `gate:html`'s twelve remaining `named-controls` violations
     * was this component: `<button role="combobox">` with no accessible name,
     * on the six Select instances across the docs site that use a visible
     * `<Label>` instead of `aria-label`, in two locales.
     *
     * `phase-a-result.json` recorded the cause as STRUCTURAL — "the CONSUMER
     * renders the Label, so there is no seam to inject through without either
     * cloning children or making form.tsx's Label context-aware". The second
     * half of that sentence is the answer, and it is what happens here: the
     * `<Label>` a consumer writes as a child sits inside this `<Field>`, reads
     * the chrome context it publishes, and emits the `htmlFor` whose other end
     * `SelectTrigger` carries as its `id`.
     *
     * That association used to be threaded through a second, Select-only
     * context (`FieldLabelContext`) because there was no `Field` here to read.
     * There is one now, so the special case is gone: this component's label,
     * description and error all travel the same seam every other Lumo control
     * uses, and there is one fewer mechanism to get wrong.
     *
     * The DIRECTION is unchanged and is still argued in `FieldWiringMode`: the
     * LABEL points at the control with `htmlFor`, not the reverse — hence
     * `mode="native"`. This component cannot know whether the consumer rendered
     * a `<Label>`, and an `aria-labelledby` minted on that guess would dangle.
     * `htmlFor` on an element that does not exist emits nothing.
     *
     * `<Field>` is ABOVE `Select.Root` and not inside it, which is forced
     * rather than chosen — see the file header. Base UI's Root renders no DOM,
     * so `Field.Root`'s `<div>` is the field box, carrying `data-lumo` and
     * `className` exactly as the hand-rolled `<div>` here used to.
     */
    <Field
      mode="native"
      description={description}
      errorMessage={effectiveError}
      explicit={{ "aria-label": ariaLabel }}
      className={cn(selectVariants(), className)}
      {...optional("isDisabled", isDisabled)}
      {...optional("isInvalid", isInvalid)}
      {...optional("name", name)}
      {...optional(
        "validate",
        validate === undefined
          ? undefined
          : (fieldValue: unknown) => {
              const key = fieldValue == null || fieldValue === "" ? null : String(fieldValue);
              const result = validate(key);
              return result === true || result === undefined ? null : result;
            },
      )}
    >
      {/*
       * `name` goes to BOTH roots, and the duplication is deliberate. Base UI
       * resolves the submitted name as `fieldName ?? nameProp`
       * (`SelectRoot.mjs`), so the hidden input is byte-identical either way;
       * what the second copy buys is `useRegisterFieldControl`, which is handed
       * `nameProp` and not the field's, and which is how a `<Form>` maps a
       * server error back onto this control.
       */}
      <BaseSelect.Root
        items={itemLabels}
        {...(selectedKey === undefined ? {} : { value: selectedKey })}
        {...(defaultSelectedKey === undefined ? {} : { defaultValue: defaultSelectedKey })}
        {...(onSelectionChange === undefined && validate === undefined
          ? {}
          : {
              onValueChange: (value: string | null) => {
                setUncontrolledKey(value);
                onSelectionChange?.(value);
              },
            })}
        {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
        {...(isRequired === undefined ? {} : { required: isRequired })}
        {...(isOpen === undefined ? {} : { open: isOpen })}
        {...(defaultOpen === undefined ? {} : { defaultOpen })}
        {...(onOpenChange === undefined
          ? {}
          : { onOpenChange: (open: boolean) => onOpenChange(open) })}
        {...(name === undefined ? {} : { name })}
      >
        <SelectFieldContext.Provider value={{ placeholder, label: ariaLabel }}>
          {children}
          {/*
           * Rendered HERE rather than left to the consumer, and it is the same
           * argument `SelectGroup`'s fused label makes: a part cannot be
           * required, and a `<Description>` a consumer forgets to place is help
           * text that exists in the props and not on the page. Order matters —
           * `useFieldWiring` lists the description's id before the error's, so
           * the DOM order and the announced order agree.
           */}
          {description != null ? <Description>{description}</Description> : null}
          <FieldError>{effectiveError}</FieldError>
        </SelectFieldContext.Provider>
      </BaseSelect.Root>
    </Field>
  );
}

/**
 * The collapsed control. Renders `<SelectValue>` unless you pass your own
 * children, so the common case cannot forget it.
 *
 * The chevron is `ChevronDown` — a BLOCK-axis glyph. A downward arrow means the
 * same thing in both scripts and needs no mirroring, which is why the trigger
 * affordance is an icon here while the submenu affordance in menu.tsx has to be
 * a bidi-mirrored character.
 */
export interface SelectTriggerProps extends SelectTriggerVariantProps {
  children?: LumoNode;
  className?: string | undefined;
}

export function SelectTrigger({ className, size, children }: SelectTriggerProps) {
  const field = useContext(SelectFieldContext);
  /*
   * `id` is the other end of the `htmlFor` the consumer's `<Label>` is carrying,
   * and `aria-describedby` is the reference to the description and error
   * `<Select>` renders — both minted during render by the `<Field>` above, both
   * arriving in one object. Overriding Base UI's own generated trigger id is
   * safe: nothing else in the server output references it.
   *
   * `aria-invalid` is NOT here, and that is a measurement rather than an
   * omission: `Select.Trigger` reads the field's validity out of
   * `useFieldRootContext` during its own render, so the attribute is already in
   * the first byte. `ssr-field-wiring.test.tsx` asserts it, and a poison twin
   * there shows what is missing without the `Field.Root`.
   */
  const control = useFieldControl();
  return (
    <BaseSelect.Trigger
      data-lumo=""
      {...control}
      {...(field?.label === undefined ? {} : { "aria-label": field.label })}
      className={cn(selectTriggerVariants({ size }), className)}
    >
      {children ?? <SelectValue />}
      <ChevronDown aria-hidden="true" className="shrink-0 text-fg-muted" />
    </BaseSelect.Trigger>
  );
}

export interface SelectValueProps<T extends object> {
  /** TYPE CARRIER, NOT A PROP — see `SelectProps.items`, including why the
   *  spelling is `(T & never) | undefined` and not `T & never`. */
  selectedItem?: (T & never) | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

export function SelectValue<T extends object>({ className, children }: SelectValueProps<T>) {
  const field = useContext(SelectFieldContext);
  return (
    <BaseSelect.Value
      className={cn(selectValueVariants(), className)}
      {...(field === null ? {} : { placeholder: field.placeholder })}
    >
      {children}
    </BaseSelect.Value>
  );
}

/**
 * The popover AND the list inside it, in one component.
 *
 * Fused deliberately, and Base UI needs the fusion MORE than React Aria did:
 * where RAC wanted one `<ListBox>` between Popover and items, Base UI wants
 * four nested parts — `Portal` → `Positioner` → `Popup` → `List` — none of
 * which carries a styling decision a caller would ever want to make, and every
 * one of which renders nothing at all if omitted.
 *
 * `alignItemWithTrigger={false}` is deliberate. Base UI's default overlaps the
 * popup on the trigger so the selected item's text lines up with the trigger's
 * value text. That is a native-macOS behaviour React Aria never had, and
 * adopting it here would change the component's appearance while the brief is
 * to swap the engine — so it is switched off and the panel drops below the
 * control exactly as before.
 */
export interface SelectPopoverProps<T extends object> {
  /**
   * The options. STATIC ONLY.
   *
   * ── IT ADVERTISED A RENDER FUNCTION AND RENDERED NOTHING ──────────────────
   *
   * Until 12 Aug 2026 this was `LumoNode | ((item: T) => LumoNode)`, and the
   * body below has always written `{children}` straight into
   * `<BaseSelect.List>`. React cannot render a function child, and Base UI's
   * `Select.List` has no arm for one: in `@base-ui/react@1.7.0`,
   * `SelectListProps extends BaseUIComponentProps<'div', SelectListState>` and
   * adds nothing, so its `children` is a `<div>`'s `children`, i.e. `ReactNode`.
   *
   * Measured on a `defaultOpen` select, rendered into jsdom so the portal
   * actually mounts:
   *
   *     function child   0 × role="option", console.error:
   *                      "Functions are not valid as a React child."
   *     static children  2 × role="option", 0 console.error
   *
   * So the form this type offered compiled, opened an EMPTY listbox, and said
   * so only on a console. `menu.tsx`'s `MenuProps.children` had the identical
   * defect — and its own docblock denied the form on the line above the one
   * that declared it.
   *
   * The form survives on `ComboBox`, `AutocompleteListBox` and `CommandList`
   * because Base UI's `Combobox.List` genuinely declares
   * `children?: ReactNode | ((item: any, index: number) => ReactNode)` and
   * calls it per item — the same probe put two options on screen with no
   * error — and on `ListBox`, which is Lumo's own collection walk and calls the
   * function itself (`list-box.tsx:405`). The asymmetry is Base UI's, not a
   * style choice, which is why it is recorded here instead of being smoothed
   * over by making all five alike.
   */
  children?: LumoNode;
  /**
   * TYPE CARRIER, NOT A PROP — see `SelectProps.items`.
   *
   * This is the field that keeps `<T>` on this interface. React Aria composed
   * a select's panel as `<Popover><ListBox items={…}>{item => …}</ListBox>`,
   * and this component is that fusion, so `items` is precisely the prop the
   * removed render function was driven by. Without it `T` names nothing and
   * `noUnusedLocals` rejects the file (`TS6133`, measured); deleting `<T>`
   * instead would break a consumer's existing `SelectPopoverProps<City>`.
   */
  items?: (Iterable<T> & never) | undefined;
  /** Class for the popover surface. */
  className?: string | undefined;
  /** Class for the scrolling list inside it. */
  listBoxClassName?: string | undefined;
}

export function SelectPopover<T extends object>({
  className,
  listBoxClassName,
  children,
}: SelectPopoverProps<T>) {
  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner
        className="isolate z-50"
        side="bottom"
        align="start"
        sideOffset={4}
        alignItemWithTrigger={false}
      >
        <BaseSelect.Popup
          className={cn(popoverVariants({ padded: false }), selectPopoverVariants(), className)}
        >
          <BaseSelect.List
            data-lumo=""
            className={cn(selectListBoxVariants(), listBoxClassName)}
          >
            {/* No cast. `children` is `LumoNode` now that the function arm is
                gone, and the cast was what let the two disagree. */}
            {children}
          </BaseSelect.List>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

/**
 * One option.
 *
 * The check mark goes at the INLINE END (`ms-auto` pushes it to the trailing
 * edge), so it lands on the right in English and on the left in Persian —
 * beside the item's own trailing edge either way.
 *
 * `textValue` maps onto Base UI's `label`, which is the same idea arrived at
 * from the opposite direction. React Aria DERIVED a typeahead string from a
 * literal string child and lost it the moment a wrapper appeared (the trap
 * documented at length in menu.tsx); Base UI never derives from `children` at
 * all — `SelectItem.label` "defaults to the item text content", read off the
 * DOM after mount — so the wrapper cannot break it. The re-derivation is kept
 * anyway, because it also feeds the SERVER-rendered markup, which has no DOM to
 * read text content from.
 */
interface SelectItemBaseProps<T extends object = object> {
  /** TYPE CARRIER, NOT A PROP — see `SelectProps.items`, including why the
   *  spelling is `(T & never) | undefined` and not `T & never`. */
  value?: (T & never) | undefined;
  /** The item's key. Maps to Base UI's `value`. */
  id?: string | undefined;
  isDisabled?: boolean | undefined;
  className?: string | undefined;
}

/** The ordinary option: its visible text IS its label. */
interface StringChildProps {
  children: string;
  textValue?: undefined;
}

/**
 * An option whose row is markup — a city beside a «تکمیل ظرفیت» note, a flag
 * beside a country.
 */
interface RichChildProps {
  children?: LumoNode;
  /**
   * Typeahead string, AND the text the collapsed control reads when this item
   * is the selected one.
   *
   * REQUIRED in this arm, and required by the type rather than by a comment:
   * `collectItemLabels` can only take a label an item HAS, and markup children
   * offer none. Before the union this was optional with "Required for
   * non-string children" written in prose, and forgetting it served the raw key
   * — `thr` — into a Persian page's first byte. See the file header.
   */
  textValue: string;
}

export type SelectItemProps<T extends object = object> = SelectItemBaseProps<T> &
  (StringChildProps | RichChildProps);

export function SelectItem<T extends object = object>({
  className,
  children,
  textValue,
  id,
  isDisabled,
}: SelectItemProps<T>) {
  const resolvedTextValue = textValue ?? (typeof children === "string" ? children : undefined);
  return (
    <BaseSelect.Item
      data-lumo=""
      className={cn(selectItemVariants(), className)}
      {...(id === undefined ? {} : { value: id })}
      {...(resolvedTextValue === undefined ? {} : { label: resolvedTextValue })}
      {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
    >
      <BaseSelect.ItemText className="flex-1 truncate">{children}</BaseSelect.ItemText>
      {/*
       * `aria-hidden` on the glyph: selection is already in the tree as
       * `aria-selected`, so the mark would only add noise to the name.
       * `ItemIndicator` renders nothing at all when the item is unselected, so
       * `ms-auto` sits on it rather than on a wrapper that would otherwise
       * reserve trailing space in every row.
       */}
      <BaseSelect.ItemIndicator className="ms-auto flex items-center">
        <Check aria-hidden="true" className="text-accent" />
      </BaseSelect.ItemIndicator>
    </BaseSelect.Item>
  );
}

/**
 * A named block of related options.
 *
 * ── THE GAP, WHICH IS SEMANTIC AND NOT VISUAL ──────────────────────────────
 *
 * A flat list of forty cities is a list of forty cities. Grouped by province it
 * is eight groups a reader can skip through — and the skipping is the point: an
 * option inside a `role="group"` with an `aria-labelledby` is announced as
 * «تهران، گروه استان تهران», so a listener who has arrowed past the province
 * boundary is told, rather than having to remember. There is no way to build
 * that out of `SelectItem`s, which is what makes it a gap rather than a
 * convenience.
 *
 * ── ONE PART WITH A REQUIRED `label`, NOT TWO PARTS ────────────────────────
 *
 * shadcn splits this into `<SelectGroup>` + `<SelectLabel>`, and Base UI ships
 * the matching `Select.Group` / `Select.GroupLabel` pair. Lumo fuses them for
 * the reason the `Empty` decision records: **a part cannot be required.** A
 * `<SelectGroup>` written without its label compiles, renders an unnamed
 * `role="group"`, and announces every option inside it as a member of nothing —
 * which is worse than no group at all, because the group node is still in the
 * tree. `label: string` does not compile when it is missing.
 *
 * There is also nothing for the split to buy here. A group label is a flat
 * string to a screen reader whichever way it is written, and the one thing
 * separate parts would allow — arbitrary markup in the heading — is markup
 * inside a name, which is the trade `TextField.label` already refuses.
 *
 * ── THE ASSOCIATION IS MINTED HERE, NOT WAITED FOR ─────────────────────────
 *
 * MEASURED, in `select/group-label/SelectGroupLabel.mjs`: Base UI publishes the
 * label's id to its group through `useIsoLayoutEffect` → `setLabelId`, so
 * `Select.Group` renders `aria-labelledby={undefined}` on its FIRST pass and
 * acquires the name on a second one. That is harmless on this component today
 * — the popup lives in a portal that is `null` while closed, so no unnamed
 * group is ever served or painted — but it makes the naming depend on an effect
 * for a relationship that is knowable at render time.
 *
 * `Select.Group` merges caller props AFTER its own defaults
 * (`props: [{role, 'aria-labelledby': labelId}, elementProps]`, verified in
 * `SelectGroup.mjs`), so an explicit `aria-labelledby` from a `useId` wins
 * outright and the group is named on the first render it ever has. The engine's
 * own effect still runs and still agrees; it is simply no longer load-bearing.
 */
export interface SelectGroupProps {
  /**
   * Announced name of the group, e.g. «استان تهران».
   *
   * REQUIRED — see the header. Neither engine supplies one, and an unnamed
   * `role="group"` is a node every option inside it reports membership of.
   */
  label: string;
  children?: LumoNode;
  className?: string | undefined;
  /** Classes for the visible heading, when the group box is not what you mean. */
  labelClassName?: string | undefined;
}

export function SelectGroup({ label, className, labelClassName, children }: SelectGroupProps) {
  const labelId = useId();
  return (
    <BaseSelect.Group
      data-lumo=""
      aria-labelledby={labelId}
      {...(className === undefined ? {} : { className })}
    >
      <BaseSelect.GroupLabel
        id={labelId}
        className={cn(selectGroupLabelVariants(), labelClassName)}
      >
        {label}
      </BaseSelect.GroupLabel>
      {children}
    </BaseSelect.Group>
  );
}

export interface SelectSeparatorProps {
  className?: string | undefined;
}

/**
 * A rule between two groups.
 *
 * DECORATION ONLY, and that is why it takes no props and announces nothing.
 * Base UI's `Select.Separator` is `ListboxSeparator`, which renders a `<div>`
 * with `role="presentation"` — deliberately NOT `role="separator"`, because a
 * separator node inside a listbox is a child that is not an option, and screen
 * readers count listbox children. The boundary a reader actually needs is the
 * one `SelectGroup` announces; this draws the same boundary for the eye.
 *
 * It is therefore not a substitute for a group, and a list that uses only
 * separators is a list whose structure is visible and unannounced — the shape
 * `breadcrumbs`' `data-current` had.
 */
export function SelectSeparator({ className }: SelectSeparatorProps) {
  return <BaseSelect.Separator className={cn(selectSeparatorVariants(), className)} />;
}
