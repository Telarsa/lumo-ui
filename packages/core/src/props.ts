import type {
  ButtonHTMLAttributes,
  CSSProperties,
  DOMAttributes,
  FocusEvent as ReactFocusEvent,
  HTMLAttributeAnchorTarget,
  HTMLAttributeReferrerPolicy,
  KeyboardEvent as ReactKeyboardEvent,
  FormEventHandler,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  RefObject,
} from "react";

/**
 * THE PROP SHAPES LUMO'S PUBLIC API IS PINNED TO.
 *
 * ── WHY THIS FILE EXISTS ────────────────────────────────────────────────────
 *
 * Every shipped component ran on `react-aria-components` until the Base UI
 * migration, and the migration's one hard rule was that the PUBLIC API may not
 * change: a consumer's `isDisabled` / `onChange(value: string)` / `onPress`
 * call sites had to keep compiling. So after the runtime left, 31 files still
 * carried `import type { … } from "react-aria-components"` purely to `Omit`
 * and `Pick` from — erased at build, invisible in a bundle, and yet decisive
 * for a consumer, because `registry.json` derives each item's `dependencies`
 * from its imports. A component that no longer runs React Aria was still
 * telling everyone who copied it to install React Aria, to get types for
 * behaviour that is not there.
 *
 * The type import is the dependency. Deleting it is the point of this file.
 *
 * ── WHAT IS IN HERE, AND WHAT IS NOT ────────────────────────────────────────
 *
 * These are the vocabulary types React Aria composed its prop bags out of —
 * `InputBase`, `ValueBase`, `Validation`, `FocusableProps`, `GlobalDOMEvents`
 * and friends — restated so the composition can be restated. They are
 * deliberately NOT a fork of React Aria: nothing here has behaviour, and
 * nothing here is versioned against that library any more. They are a
 * description of the shape Lumo's own API promised, now owned by Lumo.
 *
 * Three things React Aria declared are deliberately ABSENT, and their absence
 * is the honest part:
 *
 *   `render`      RAC's render-prop escape hatch — `(props, renderProps) =>
 *                 ReactElement`, where `renderProps` is that component's own
 *                 React Aria state object. There is no React Aria state object
 *                 any more, so the prop could only have been typed against a
 *                 shape nothing produces. It was accepted-and-unreachable
 *                 already; now it is neither.
 *
 *   `className` /
 *   `style` as
 *   FUNCTIONS    Same argument. RAC let both be `(state) => value`. Lumo's
 *                 components spread what they receive at a Base UI element,
 *                 which would render a function into the DOM. `className` was
 *                 already `Omit`ted by every component here and redeclared as
 *                 `string`; `style` is now `CSSProperties` for the same reason
 *                 rather than by oversight.
 *
 * Everything else is preserved field for field, including the props that are
 * accepted and unreachable under Base UI (`validationBehavior`,
 * `excludeFromTabOrder`, `slot`) — those are recorded in each component's
 * header and removing them WOULD be an API change.
 *
 * ── ONE MEASURED WIDENING ───────────────────────────────────────────────────
 *
 * The DOM event groups below are `Pick`ed from React's own `DOMAttributes`
 * rather than retyped by hand, so a handler's parameter type comes from React
 * and cannot drift from it. React declares these as `T | undefined`; React Aria
 * declared a few of them as bare `T`. Under this repo's
 * `exactOptionalPropertyTypes`, that means an explicit `onCopy={undefined}` now
 * compiles where it did not before. Widening what a caller may pass cannot
 * break a caller, which is why it is acceptable; it is recorded rather than
 * hidden.
 */

/* ════════════════════════════════════════════════════════════════════════════
 * THE ROOT CONTRACT — WHAT `ref`, `id` AND EVERY OTHER DOM ATTRIBUTE DO
 *
 * Decided 12 Aug 2026. AUDIT.md §5 item 2.1. This is the file the decision
 * lives in; `button.tsx`'s header states it again at the exemplar, and
 * `packages/gate/src/inert-props.ts` enforces it.
 *
 * ── THE STATE IT REPLACES ───────────────────────────────────────────────────
 *
 * There was no `ref` story and no `id` story. Whether `<Card ref={r}>` compiled
 * was an accident of which base type a file's author had reached for:
 *
 *     HTMLAttributes<T>     21 files, 49 sites   NO ref  (card, alert, item, …)
 *     ComponentProps<E>     10 files             ref     (frame, chart, table, …)
 *
 * Nothing documented the difference, and nothing could: it is not a difference
 * anybody chose. AUDIT §4.2 counted the FILES; the sweep found 49 declaration
 * sites in them, because the shape repeats per part — five in
 * `skeleton-presets.tsx`, five in `attachment.tsx`, four in `card.tsx`.
 *
 * Downstream, no collection, no overlay and no date component forwarded a ref at
 * all, so a consumer could not focus a drawer panel, measure a popover, or
 * scroll a `VirtualList` to an index. Separately, 96 of 243 exported components
 * (39.5%) declared no rest parameter, so they accepted no `id`, no
 * `data-testid`, and no `aria-*` the component had not thought of. `MenuItem`
 * could not take `aria-current` for exactly that reason, and it cost a new prop
 * to fix one instance of it.
 *
 * (The audit's figure was "108 of 244 (44%)". The denominators differ — this one
 * counts exported `function` components whose first parameter is annotated with
 * a `*Props` type — so it is a method difference rather than a contradiction,
 * recorded in AUDIT §8 with both methods stated. After the sweep: 81 of 243.)
 *
 * This item went first in Phase 2 because it is the only one whose cost is
 * QUADRATIC: every component added before the decision has to be revisited
 * after it.
 *
 * ── THE DECISION: OMIT WHAT YOU OWN, SPREAD THE REST ────────────────────────
 *
 * A component's props interface extends the DOM surface of the element it
 * actually renders, minus the names the component owns:
 *
 *     export interface CardProps
 *       extends Omit<ComponentProps<"div">, "children" | "className">,
 *         VariantProps<typeof cardVariants> {
 *       children?: LumoNode;              // narrowed: never `ReactNode`
 *       className?: string | undefined;   // merged last by `cn`, never replaced
 *     }
 *
 * and the component binds a rest and spreads it at that element. `spinner.tsx`
 * is the model the audit named: `:67` omits `role` from the accepted surface
 * and `:102` hardcodes it, so `role="status"` is not a convention the component
 * hopes callers respect — it is unrepresentable to override.
 *
 * Two clauses, and the second is the one that has actually shipped defects:
 *
 *   1. THE BASE IS `ComponentProps<E>`, NEVER `HTMLAttributes<T>`, where `E` is
 *      the root's tag. This is the entire `ref` story and it costs nothing.
 *   2. `Omit` WHAT THE COMPONENT OWNS, AND SAY WHY ON THE LINE. A component
 *      that both accepts an attribute and writes it has a defect waiting on
 *      whichever spread happens to be last.
 *
 * ── WHY, SPECIFICALLY, UNDER REACT 19 ───────────────────────────────────────
 *
 * React 19 made `ref` an ORDINARY PROP. Verified against this repo's own
 * `@types/react@19.2.18` with its own `tsc`, both directions asserted so the
 * probe could not pass vacuously:
 *
 *     type HasRef<P> = "ref" extends keyof P ? true : false;
 *     const a: HasRef<ComponentProps<"div">>     = true;   // compiles
 *     const b: HasRef<HTMLAttributes<HTMLDivElement>> = false;  // compiles
 *     …and the inverted pair produces TS2322 on both lines.
 *
 * So the whole `ref` question is answered by a BASE TYPE, not by a mechanism.
 * No `forwardRef`, no `ref` prop to declare, no element bookkeeping, no runtime
 * cost. That is what makes clause 1 a one-token edit per interface rather than
 * a refactor, and it is the fact that decides between the two shapes below.
 *
 * Also verified under this repo's `exactOptionalPropertyTypes: true`:
 * `const p: ComponentProps<"div"> = { id: undefined, ref: undefined, onClick:
 * undefined }` compiles. React's DOM types spell every optional field
 * `T | undefined`, so spreading a props bag that carries an explicit
 * `undefined` — the shape `props.ts` already protects under "ONE MEASURED
 * WIDENING" and the shape `?: never` breaks — keeps working untouched.
 *
 * ── THE SHAPE THAT WAS REJECTED, AND WHY ────────────────────────────────────
 *
 * The alternative on the table was an explicit `attr()`-forwarded allow-list —
 * `id` / `ref` / `aria-labelledby` / `aria-describedby` / `data-*`, hand-listed
 * and hand-delivered on every root. It is more ceremony in exchange for the
 * promise that nothing arrives the component has not considered. It loses on
 * four counts, in ascending order of importance:
 *
 *   1. It is 244 hand-maintained lists. The current 21-vs-10 split is what a
 *      per-file judgement call produces at this scale; a per-file list is the
 *      same bet with more surface.
 *
 *   2. It cannot be typed as cheaply as it can be written. Every field on the
 *      list has to be redeclared BY HAND with `| undefined` on it, or
 *      `exactOptionalPropertyTypes` turns a correct spread into an error. That
 *      is the mistake this file already records once.
 *
 *   3. React 19 removed the reason it existed. Under React 18 an allow-list at
 *      least bought an explicit `ref` story that `forwardRef` otherwise made
 *      per-component ceremony. Under React 19 `ComponentProps<E>` gives the same
 *      thing for free, so the allow-list is paying its full price for what is
 *      now a rounding error.
 *
 *   4. IT IS NOT MECHANICALLY CHECKABLE, AND THAT IS THE DECIDING ONE. A gate
 *      can ask "you accept `id` — do you deliver it?" and answer it from
 *      syntax. No gate can ask "should you ALSO have accepted
 *      `aria-keyshortcuts`?" — the answer lives in a component nobody has
 *      written yet, on a page nobody has built yet. An allow-list's guarantee
 *      is therefore exactly as strong as the diligence of whoever wrote each
 *      list, which is the property that produced the state this decision
 *      replaces. "Omit what you own" inverts that: the DEFAULT is complete, and
 *      each subtraction is a reviewed line the gate can see.
 *
 * ── THE HYBRID CLAUSE: A FLOOR, SO A CLOSED SURFACE IS A DECISION ───────────
 *
 * "Omit what you own" alone would let a component omit everything and still be
 * within the letter of the rule. So:
 *
 *   `ref` AND `id` ARE NEVER SUBTRACTED, only ever OWNED or WIDENED, and either
 *   one is a comment on the `Omit` line naming what breaks otherwise.
 *
 * The components that OWN their `ref` all read the DOM out of it, and that is
 * what earns it: `Table`, `ListBox`, `Tree` and `VirtualList` drive a roving tab
 * stop or a virtual window from the element; `Gantt`, `Kanban` and `Sortable`
 * hit-test a drag against it. A consumer's ref does not coexist with theirs — it
 * REPLACES it. `table.tsx` shipped exactly that: `ref` and `onKeyDown` accepted,
 * `{...props}` spread last, and every arrow key silently dead the moment a
 * consumer measured the table. See `TableProps`.
 *
 * `DateInput` owns its `ref` for a different and better reason: it hands back a
 * `DateInputHandle` instead. What a caller needs from that component is "focus
 * the first segment", not the `<div>`.
 *
 * WIDENING is the other legal answer and is not a subtraction. A component
 * whose root varies at run time — `Stack`'s `tag`, `Separator`'s `<hr>`/`<div>`
 * pair, `MessageTime`'s `<time>`/`<span>` — declares `ref?: Ref<HTMLElement>`,
 * the widest type true of every branch, and casts once at the element. Handing
 * back `Ref<HTMLDivElement>` for a `<section>` would be worse than handing back
 * nothing, because it type-checks.
 *
 * ── WHAT THE COMPONENT STILL OWNS, AND HOW IT SAYS SO ──────────────────────
 *
 * Ownership is not a judgement call about taste; it is one of three facts:
 *
 *   the component WRITES it        `role` on `Spinner`, `aria-label` on `Table`
 *                                  (it is built from a REQUIRED `label` prop)
 *   the component READS it         `ref` on `Table`/`ListBox`/`VirtualList`
 *   the state lives elsewhere      the open-state trio on an overlay SURFACE;
 *                                  see `OverlayOpenStateKeys` below
 *
 * Everything else is the consumer's. `id`, `data-testid`, `aria-describedby`,
 * `aria-keyshortcuts`, `aria-current`, `onScroll`, `dir` on a bidi island —
 * this library cannot enumerate what a page needs, and 44% of it was
 * previously answering "no" to all of them by default.
 *
 * ── ONE THING THIS CONTRACT DOES NOT BUY ───────────────────────────────────
 *
 * `Omit` protects a TypeScript consumer. It does nothing for the one who copied
 * a file into a JavaScript project, which is how this library is distributed.
 * So where a displaced attribute is a SILENT failure rather than a visible one,
 * the component ALSO spreads `{...props}` FIRST and writes what it owns after
 * it. That is the reverse of the house order — everywhere else a caller's value
 * should win, because that is what an escape hatch is for — and it applies to
 * every root that writes an attribute its own behaviour then reads back:
 * `Table`, `ListBox`, `VirtualList`, `Tree`, `Gantt`, `Kanban`, `Sortable` and
 * `FileUpload`. `table.tsx` explains it on the line, and the two tests in
 * `table.test.tsx` that failed before it moved are the evidence it is needed
 * rather than a precaution.
 *
 * `Calendar`, `RangeCalendar`, `EventCalendar` and `DateInput` are spread the
 * same way, and for a weaker reason that is worth stating rather than dressing
 * up: they own nothing a caller can kill, and the order is uniformity inside a
 * family whose four roots are read side by side. If that turns out to be the
 * wrong call, it is four lines.
 * ═══════════════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════════════════════
 * KEYS, SELECTION, ORIENTATION
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * A collection item's identity.
 *
 * NOT React's `Key`. React widened its own to include `bigint`; this one is the
 * two things a Lumo collection actually keys on, and it is the type
 * `onSelectionChange` and `onAction` hand back. Declared once here rather than
 * per component because a structurally-equal copy in seven files is seven
 * things that can drift.
 */
export type Key = string | number;

/** `'all'` is a real selection state, distinct from a set holding every key. */
export type Selection = "all" | Set<Key>;

export type SelectionMode = "none" | "single" | "multiple";
export type SelectionBehavior = "toggle" | "replace";
export type DisabledBehavior = "selection" | "all";
export type FocusStrategy = "first" | "last";

/**
 * Layout axis. Note this is a VISUAL prop in Lumo — since the Base UI swap the
 * keyboard model no longer reads it. See `radio-group.tsx`'s header.
 */
export type Orientation = "horizontal" | "vertical";

/* ════════════════════════════════════════════════════════════════════════════
 * VALIDATION
 * ═══════════════════════════════════════════════════════════════════════════ */

export type ValidationError = string | string[];

export interface ValidationResult {
  /** Whether the input value is invalid. */
  isInvalid: boolean;
  /** The current error messages for the input if it is invalid, otherwise an empty array. */
  validationErrors: string[];
  /** The native validation details for the input. */
  validationDetails: ValidityState;
}

export interface Validation<T = unknown> {
  /** Whether user input is required on the input before form submission. */
  isRequired?: boolean;
  /** Whether the input value is invalid. */
  isInvalid?: boolean;
  /**
   * ACCEPTED AND UNREACHABLE under Base UI, which decides this on `<Form>` and
   * `Field.Root` rather than per control. Kept because removing it is an API
   * change; see `form.tsx`.
   */
  validationBehavior?: "native" | "aria";
  /** Returns a validation error, or nothing if the value is acceptable. */
  validate?: (value: T) => ValidationError | true | null | undefined;
}

export interface InputBase {
  /** Whether the input is disabled. */
  isDisabled?: boolean;
  /** Whether the input can be selected but not changed by the user. */
  isReadOnly?: boolean;
}

export interface ValueBase<T, C = T> {
  /** The current value (controlled). */
  value?: T;
  /** The default value (uncontrolled). */
  defaultValue?: T;
  /** Handler that is called when the value changes. */
  onChange?: (value: C) => void;
}

export interface HelpTextProps {
  /** A description for the field. */
  description?: ReactNode;
  /** An error message for the field. */
  errorMessage?: ReactNode | ((v: ValidationResult) => ReactNode);
}

/* ════════════════════════════════════════════════════════════════════════════
 * INTERACTION EVENTS
 *
 * `PressEvent` is the one shape in this file that a consumer writes code
 * AGAINST rather than merely passes through: `onPress={(e) => …}` reads
 * `e.pointerType` to tell a keyboard activation from a pointer one. It is
 * restated field for field for that reason. `base-ui-adapter.ts` translates a
 * real DOM event into one of these at runtime.
 * ═══════════════════════════════════════════════════════════════════════════ */

export type PointerType = "mouse" | "pen" | "touch" | "keyboard" | "virtual";

export interface PressEvent {
  /** The type of press event being fired. */
  type: "pressstart" | "pressend" | "pressup" | "press";
  /** The pointer type that triggered the press event. */
  pointerType: PointerType;
  /** The target element of the press event. */
  target: Element;
  /** Whether the shift keyboard modifier was held during the press event. */
  shiftKey: boolean;
  /** Whether the ctrl keyboard modifier was held during the press event. */
  ctrlKey: boolean;
  /** Whether the meta keyboard modifier was held during the press event. */
  metaKey: boolean;
  /** Whether the alt keyboard modifier was held during the press event. */
  altKey: boolean;
  /** X position relative to the target. */
  x: number;
  /** Y position relative to the target. */
  y: number;
  /** The key that triggered the press, if it was a keyboard activation. */
  key?: string;
  /** Allows the event to continue propagating, which is not the default. */
  continuePropagation(): void;
}

export interface HoverEvent {
  /** The type of hover event being fired. */
  type: "hoverstart" | "hoverend";
  /** The pointer type that triggered the hover event. */
  pointerType: "mouse" | "pen";
  /** The target element of the hover event. */
  target: HTMLElement;
}

/**
 * A React keyboard event that does NOT propagate by default.
 *
 * Named with the `Lumo` prefix because an unprefixed `KeyboardEvent` in an
 * importing module shadows the DOM global of the same name — a rename that
 * type-checks and confuses every reader afterwards.
 *
 * The `any` is LOAD-BEARING and is not laziness. It is the target element of
 * the React event, and it is what makes a plain
 * `KeyboardEventHandler<HTMLButtonElement>` accept a handler written against
 * this type — the assignment `menubar.tsx` and `toolbar.tsx` make when they
 * spread `rest` at a bare `<button>`. Narrowing it to `Element` was tried and
 * produces TS2322 (`Property 'continuePropagation' is missing`) at those two
 * call sites, because the extra methods make the intersection unreachable from
 * React's own event unless one side is `any`. React Aria typed it the same way,
 * for the same reason, and this type exists to keep that API.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above
export type LumoKeyboardEvent = ReactKeyboardEvent<any> & {
  /** Stops propagation. Called for you unless you call `continuePropagation`. */
  stopPropagation(): void;
  /** Allows the event to continue propagating. */
  continuePropagation(): void;
};

export interface KeyboardEvents {
  /** Handler that is called when a key is pressed. */
  onKeyDown?: (e: LumoKeyboardEvent) => void;
  /** Handler that is called when a key is released. */
  onKeyUp?: (e: LumoKeyboardEvent) => void;
}

export interface FocusEvents<Target = Element> {
  /** Handler that is called when the element receives focus. */
  onFocus?: (e: ReactFocusEvent<Target>) => void;
  /** Handler that is called when the element loses focus. */
  onBlur?: (e: ReactFocusEvent<Target>) => void;
  /** Handler that is called when the element's focus status changes. */
  onFocusChange?: (isFocused: boolean) => void;
}

export interface FocusWithinEvents {
  /** Handler that is called when the element or a descendant receives focus. */
  onFocusWithin?: (e: ReactFocusEvent) => void;
  /** Handler that is called when focus leaves the element and its descendants. */
  onBlurWithin?: (e: ReactFocusEvent) => void;
  /** Handler that is called when the focus-within status changes. */
  onFocusWithinChange?: (isFocusWithin: boolean) => void;
}

export interface HoverEvents {
  /** Handler that is called when a hover interaction starts. */
  onHoverStart?: (e: HoverEvent) => void;
  /** Handler that is called when a hover interaction ends. */
  onHoverEnd?: (e: HoverEvent) => void;
  /** Handler that is called when the hover state changes. */
  onHoverChange?: (isHovering: boolean) => void;
}

/**
 * Any focusable element, HTML or SVG.
 *
 * The `onClick` in `PressEvents` is typed against this rather than `Element`,
 * and the difference is load-bearing in the contravariant direction: a caller
 * who ANNOTATED a handler `(e: MouseEvent<FocusableElement>) => void` — as the
 * published API invited — would not be assignable to an `Element` version.
 */
export interface FocusableElement extends Element, HTMLOrSVGElement {}

export interface PressEvents {
  /** Handler that is called when the press is released over the target. */
  onPress?: (e: PressEvent) => void;
  /** Handler that is called when a press interaction starts. */
  onPressStart?: (e: PressEvent) => void;
  /** Handler that is called when a press interaction ends. */
  onPressEnd?: (e: PressEvent) => void;
  /** Handler that is called when the press state changes. */
  onPressChange?: (isPressed: boolean) => void;
  /** Handler that is called when a press is released over any element. */
  onPressUp?: (e: PressEvent) => void;
  /** Handler that is called when the element is clicked. */
  onClick?: (e: ReactMouseEvent<FocusableElement>) => void;
}

export interface FocusableProps<Target = Element> extends FocusEvents<Target>, KeyboardEvents {
  /** Whether the element should receive focus on render. */
  autoFocus?: boolean;
}

/* ════════════════════════════════════════════════════════════════════════════
 * DOM PROPS
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface AriaLabelingProps {
  /** Defines a string value that labels the current element. */
  "aria-label"?: string;
  /** Identifies the element (or elements) that labels the current element. */
  "aria-labelledby"?: string;
  /** Identifies the element (or elements) that describes the object. */
  "aria-describedby"?: string;
  /** Identifies the element (or elements) that provide a detailed description. */
  "aria-details"?: string;
}

export interface AriaValidationProps {
  /** Identifies the element that provides an error message for the object. */
  "aria-errormessage"?: string;
}

export interface DOMProps {
  /** The element's unique identifier. */
  id?: string;
}

export interface FocusableDOMProps extends DOMProps {
  /**
   * Whether to exclude the element from the sequential tab order.
   *
   * ACCEPTED AND UNREACHABLE under Base UI — `tabIndex={-1}` reaches the
   * element directly and is what this ever meant. See `text-field.tsx`.
   */
  excludeFromTabOrder?: boolean;
}

export interface InputDOMProps {
  /** The name of the input element, used when submitting an HTML form. */
  name?: string;
  /** The id of the `<form>` element to associate the input with. */
  form?: string;
}

export interface SlotProps {
  /**
   * A slot name for the component.
   *
   * ACCEPTED AND UNREACHABLE: slots were React Aria's context-plumbing
   * mechanism and Base UI has no equivalent. Kept because removing a prop is
   * an API change.
   */
  slot?: string | null;
}

export interface StyleProps {
  /** The inline style for the element. */
  style?: CSSProperties;
}

/**
 * Text-input events, `Pick`ed from React so the handler parameter types are
 * React's own. See the header's note on the one widening this causes.
 */
export interface TextInputDOMEvents<T = HTMLInputElement>
  extends Pick<
    DOMAttributes<T>,
    | "onCopy"
    | "onCut"
    | "onPaste"
    | "onCompositionStart"
    | "onCompositionEnd"
    | "onCompositionUpdate"
    | "onSelect"
  > {
  /**
   * Handler that is called when the input value is about to be modified.
   *
   * NOT `Pick`ed from React with the others. React 19 types these two as
   * `InputEventHandler`, which is NARROWER than the `FormEventHandler` the
   * frozen API published — a caller's existing `FormEventHandler` would stop
   * compiling. Narrowing what a caller may pass is the one direction this file
   * is not allowed to move in, so they are declared by hand.
   */
  onBeforeInput?: FormEventHandler<T> | undefined;
  /** Handler that is called when the input value is modified. */
  onInput?: FormEventHandler<T> | undefined;
}

/** DOM props that apply to all text inputs. */
export interface TextInputDOMProps<T = HTMLInputElement>
  extends DOMProps,
    InputDOMProps,
    TextInputDOMEvents<T> {
  /** Describes the type of autocomplete functionality the input should provide. */
  autoComplete?: string;
  /** The maximum number of characters supported by the input. */
  maxLength?: number;
  /** The minimum number of characters required by the input. */
  minLength?: number;
  /** Regex pattern that the value of the input must match to be valid. */
  pattern?: string;
  /** Content that appears in the input when it is empty. */
  placeholder?: string;
  /**
   * The type of input to render.
   *
   * @default 'text'
   */
  type?: "text" | "search" | "url" | "tel" | "email" | "password" | (string & {});
  /** Hints at the type of data that might be entered by the user. */
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
  /** What, if any, autocomplete functionality the input should provide. */
  autoCorrect?: string;
  /** Whether the element may be checked for spelling errors. */
  spellCheck?: string;
}

/** The `<a>` attributes a pressable collection item may carry. */
export interface LinkDOMProps {
  /** A URL to link to. */
  href?: string;
  /** Hints at the human language of the linked URL. */
  hrefLang?: string;
  /** The target window for the link. */
  target?: HTMLAttributeAnchorTarget;
  /** The relationship between the linked resource and the current page. */
  rel?: string;
  /** Causes the browser to download the linked URL. */
  download?: boolean | string;
  /** A space-separated list of URLs to ping when the link is followed. */
  ping?: string;
  /** How much of the referrer to send when following the link. */
  referrerPolicy?: HTMLAttributeReferrerPolicy;
  /** Options for the configured client side router. */
  /** Compatibility carrier: client-router integration is not implemented. */
  routerOptions?: undefined;
}

/**
 * Global DOM events supported on any element, `Pick`ed from React.
 *
 * Drag-and-drop, media, keyboard and focus events are deliberately absent — the
 * first two are handled directly on the element that needs them, and the last
 * two are declared on the focusable groups above so a component that is not
 * focusable does not advertise them.
 */
export type GlobalDOMEvents<T = Element> = Pick<
  DOMAttributes<T>,
  | "onClick"
  | "onClickCapture"
  | "onAuxClick"
  | "onAuxClickCapture"
  | "onContextMenu"
  | "onContextMenuCapture"
  | "onDoubleClick"
  | "onDoubleClickCapture"
  | "onMouseDown"
  | "onMouseDownCapture"
  | "onMouseEnter"
  | "onMouseLeave"
  | "onMouseMove"
  | "onMouseMoveCapture"
  | "onMouseOut"
  | "onMouseOutCapture"
  | "onMouseOver"
  | "onMouseOverCapture"
  | "onMouseUp"
  | "onMouseUpCapture"
  | "onTouchCancel"
  | "onTouchCancelCapture"
  | "onTouchEnd"
  | "onTouchEndCapture"
  | "onTouchMove"
  | "onTouchMoveCapture"
  | "onTouchStart"
  | "onTouchStartCapture"
  | "onPointerDown"
  | "onPointerDownCapture"
  | "onPointerMove"
  | "onPointerMoveCapture"
  | "onPointerUp"
  | "onPointerUpCapture"
  | "onPointerCancel"
  | "onPointerCancelCapture"
  | "onPointerEnter"
  | "onPointerLeave"
  | "onPointerOver"
  | "onPointerOverCapture"
  | "onPointerOut"
  | "onPointerOutCapture"
  | "onGotPointerCapture"
  | "onGotPointerCaptureCapture"
  | "onLostPointerCapture"
  | "onLostPointerCaptureCapture"
  | "onScroll"
  | "onScrollCapture"
  | "onWheel"
  | "onWheelCapture"
  | "onAnimationStart"
  | "onAnimationStartCapture"
  | "onAnimationEnd"
  | "onAnimationEndCapture"
  | "onAnimationIteration"
  | "onAnimationIterationCapture"
  | "onTransitionCancel"
  | "onTransitionCancelCapture"
  | "onTransitionEnd"
  | "onTransitionEndCapture"
  | "onTransitionRun"
  | "onTransitionRunCapture"
  | "onTransitionStart"
  | "onTransitionStartCapture"
>;

/** Global attributes plus global events. `id` is handled by `DOMProps`. */
export interface GlobalDOMAttributes<T = Element> extends GlobalDOMEvents<T> {
  /** The element's own `dir` attribute. Rarely set directly: page direction is derived from `locale` by `LumoProvider`. */
  dir?: string | undefined;
  /** The element's `lang` attribute, when this subtree's language differs from the page's. */
  lang?: string | undefined;
  /** The DOM `hidden` attribute: removes the element from rendering and the accessibility tree. */
  hidden?: boolean | undefined;
  /** The DOM `inert` attribute: the subtree cannot be focused, clicked, or read by assistive technology. */
  inert?: boolean | undefined;
  /** The DOM `translate` attribute: whether machine translation may rewrite this subtree's text. */
  translate?: "yes" | "no" | undefined;
}

/* ════════════════════════════════════════════════════════════════════════════
 * TEXT FIELDS
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * The prop surface every single-line text control in Lumo is pinned to —
 * `TextField`, `TextArea`, `SearchField` and `InputGroup`.
 *
 * `label`, `description`, `errorMessage` and `placeholder` are deliberately
 * ABSENT and are redeclared by each component: Lumo makes `label` a REQUIRED
 * `string` rather than an optional `ReactNode`, which is the library's central
 * rule and the reason 33 unnamed controls cannot ship again. Inheriting the
 * optional version would quietly undo it.
 */
export interface TextFieldPropsBase<T = HTMLInputElement>
  extends InputBase,
    Validation<string>,
    ValueBase<string>,
    FocusableProps<T>,
    Omit<TextInputDOMProps<T>, "placeholder">,
    FocusableDOMProps,
    AriaLabelingProps,
    AriaValidationProps,
    SlotProps,
    StyleProps,
    GlobalDOMAttributes<HTMLDivElement> {
  "aria-activedescendant"?: string;
  "aria-autocomplete"?: "none" | "inline" | "list" | "both";
  "aria-haspopup"?: boolean | "false" | "true" | "menu" | "listbox" | "tree" | "grid" | "dialog";
  "aria-controls"?: string;
  /** The label of the on-screen keyboard's enter key. */
  enterKeyHint?: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
}

/* ════════════════════════════════════════════════════════════════════════════
 * BOOLEAN FIELDS AND FIELD GROUPS
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * A single boolean control that is also a form field — `Checkbox`, `Switch`.
 *
 * Distinct from a bare toggle BUTTON (`toggle.tsx`) because this one submits:
 * it has a hidden `<input>`, a `name`, and validation. `children` and
 * `className` are absent for the reason every shape in this file omits them.
 */
export interface ToggleFieldPropsBase
  extends InputBase,
    Validation<boolean>,
    FocusableProps,
    PressEvents,
    FocusableDOMProps,
    InputDOMProps,
    AriaLabelingProps,
    AriaValidationProps,
    SlotProps,
    StyleProps,
    // `onClick` is the press API's; see `ButtonPropsBase`.
    Omit<GlobalDOMAttributes<HTMLDivElement>, "onClick"> {
  "aria-controls"?: string;
  /** The value submitted with form data when the control is selected. */
  value?: string;
  /** Whether the control is selected (controlled). */
  isSelected?: boolean;
  /** Whether the control is selected by default (uncontrolled). */
  defaultSelected?: boolean;
  /** Handler that is called when the selection state changes. */
  onChange?: (isSelected: boolean) => void;
  /** A ref for the hidden `<input>` element. */
  inputRef?: RefObject<HTMLInputElement | null>;
}

/**
 * A group of controls that reports ONE value — `CheckboxGroup`, `RadioGroup`.
 *
 * Three type parameters rather than one because the three roles genuinely
 * differ: a radio group holds `string | null`, hands `string` to `onChange`,
 * and validates a `string`. Collapsing them would have made `validate` take a
 * nullable value for radios, which is a narrowing a caller would feel.
 */
export interface FieldGroupPropsBase<TValue, TChange = TValue, TValidate = TChange>
  extends InputBase,
    Validation<TValidate>,
    ValueBase<TValue, TChange>,
    FocusEvents,
    DOMProps,
    InputDOMProps,
    AriaLabelingProps,
    AriaValidationProps,
    SlotProps,
    StyleProps,
    GlobalDOMAttributes<HTMLDivElement> {}

/* ════════════════════════════════════════════════════════════════════════════
 * OVERLAYS
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface OverlayTriggerProps {
  /** Whether the overlay is open by default (controlled). */
  isOpen?: boolean;
  /** Whether the overlay is open by default (uncontrolled). */
  defaultOpen?: boolean;
  /** Handler that is called when the overlay's open state changes. */
  onOpenChange?: (isOpen: boolean) => void;
}

/**
 * The three keys above, as a union, so a SURFACE can subtract them in one line.
 *
 * ── WHY A SURFACE MUST NOT ACCEPT THEM ─────────────────────────────────────
 *
 * Open state under Base UI belongs to the ROOT — `Dialog.Root`, `Popover.Root`,
 * `Tooltip.Root` — and in Lumo the part that renders the Root is the TRIGGER:
 * `DialogTrigger`, `PopoverTrigger`, `TooltipTrigger`. A backdrop, a panel or a
 * popup is rendered INSIDE that Root and has no access to it.
 *
 * Six surfaces declared the trio anyway and destructured all three into `_`
 * discards — `DialogOverlay`, `DialogModal`, `DrawerOverlay`, `Drawer`,
 * `Popover`, `Tooltip`. So
 *
 *     <DialogModal isOpen={open} onOpenChange={setOpen}>
 *
 * reads perfectly, compiles, and does nothing at all: the dialog neither opens
 * nor reports. That is the same shape as `isKeyboardDismissDisabled`, which was
 * removed from `ModalOverlayPropsBase` for the same reason and RELOCATED to
 * `DialogTrigger` — and it gets the same answer, minus the relocation, because
 * these three are already on the trigger and always have been.
 *
 * `time-field.tsx` set the precedent this rests on: absent is a failure at the
 * call site, accepted-and-ignored is a bug report six months on.
 */
export type OverlayOpenStateKeys = "isOpen" | "defaultOpen" | "onOpenChange";

/**
 * A dialog's own props — `dialog.tsx` and `alert-dialog.tsx`, which differ only
 * in whether `role` is a caller's choice or fixed.
 */
export interface DialogPropsBase
  extends DOMProps,
    AriaLabelingProps,
    SlotProps,
    StyleProps,
    GlobalDOMAttributes<HTMLElement> {
  /**
   * The accessibility role for the dialog.
   *
   * @default 'dialog'
   */
  role?: "dialog" | "alertdialog";
}

/**
 * The overlay a modal renders into — `dialog.tsx`'s backdrop and panel, and
 * `drawer.tsx`'s.
 *
 * Several of these are ACCEPTED AND UNREACHABLE under Base UI and each
 * component's header names which; they are kept because removing a prop is an
 * API change.
 *
 * ── ONE OF THEM LEFT, AND IT LEFT BECAUSE IT WORKS SOMEWHERE ELSE ───────────
 *
 * `isKeyboardDismissDisabled` was declared here and was inert on all four
 * consumers of this type — `DialogOverlay`, `DialogModal`, `DrawerOverlay`,
 * `Drawer`. It is gone rather than kept, and the reason is the one
 * `PopoverTrigger` records: dismissal under Base UI lives on the ROOT, and none
 * of those four parts renders it. `DialogTrigger` does, and that is where the
 * prop now is — for dialogs and drawers alike, since a drawer's state owner is
 * `DialogTrigger` too. Passing it to an overlay or a panel is now a compile
 * error, which is what `time-field.tsx` set the precedent for: absent is a
 * failure at the call site, accepted-and-ignored is a bug report six months on.
 *
 * Those four are the ONLY consumers of this interface — checked before the
 * removal, not after.
 */
export interface ModalOverlayPropsBase
  extends OverlayTriggerProps,
    SlotProps,
    StyleProps,
    GlobalDOMAttributes<HTMLDivElement> {
  /** Whether pressing outside the overlay closes it. */
  isDismissable?: boolean;
  /** Decides, per element, whether an outside interaction should close it. */
  shouldCloseOnInteractOutside?: (element: Element) => boolean;
  /** Whether the overlay is currently performing an entry animation. */
  isEntering?: boolean;
  /** Whether the overlay is currently performing an exit animation. */
  isExiting?: boolean;
  /** The container the overlay portals into. */
  UNSTABLE_portalContainer?: Element;
}

/**
 * The full placement union, physical spellings included.
 *
 * Exported so `popover.tsx` can subtract the physical ones with the same
 * template-literal `Exclude` it always used — see `LumoPlacement` there. Kept
 * whole here rather than pre-filtered because the subtraction is the thing
 * worth reading at the call site: it is the rule that a placement in this
 * library mirrors with the writing direction.
 */
export type Placement =
  | "bottom"
  | "bottom left"
  | "bottom right"
  | "bottom start"
  | "bottom end"
  | "top"
  | "top left"
  | "top right"
  | "top start"
  | "top end"
  | "left"
  | "left top"
  | "left bottom"
  | "start"
  | "start top"
  | "start bottom"
  | "right"
  | "right top"
  | "right bottom"
  | "end"
  | "end top"
  | "end bottom";

export type Axis = "top" | "bottom" | "left" | "right";
export type PlacementAxis = Axis | "center";

/** Positioning knobs shared by every positioned overlay. */
export interface PositionProps {
  /** The placement of the element with respect to its anchor element. */
  placement?: Placement;
  /** The additional offset applied along the main axis. */
  offset?: number;
  /** The additional offset applied along the cross axis. */
  crossOffset?: number;
  /** Whether the element should flip its orientation when there is insufficient room. */
  shouldFlip?: boolean;
  /** The placement padding that should be applied between the element and its container. */
  containerPadding?: number;
  /** Whether the overlay is currently open. */
  isOpen?: boolean;
}

/* ════════════════════════════════════════════════════════════════════════════
 * COLLECTIONS
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface CollectionStateBase<T> {
  /** Item objects in the collection. */
  items?: Iterable<T>;
  /** Values that should invalidate the item cache when using dynamic collections. */
  dependencies?: ReadonlyArray<unknown>;
}

export interface MultipleSelection {
  /** The type of selection that is allowed in the collection. */
  selectionMode?: SelectionMode;
  /** Whether the collection allows empty selection. */
  disallowEmptySelection?: boolean;
  /** The currently selected keys in the collection (controlled). */
  selectedKeys?: "all" | Iterable<Key>;
  /** The initial selected keys in the collection (uncontrolled). */
  defaultSelectedKeys?: "all" | Iterable<Key>;
  /** Handler that is called when the selection changes. */
  onSelectionChange?: (keys: Selection) => void;
  /** The currently disabled keys in the collection (controlled). */
  disabledKeys?: Iterable<Key>;
}

export interface Expandable {
  /** The currently expanded keys in the collection (controlled). */
  expandedKeys?: Iterable<Key>;
  /** The initial expanded keys in the collection (uncontrolled). */
  defaultExpandedKeys?: Iterable<Key>;
  /** Handler that is called when items are expanded or collapsed. */
  onExpandedChange?: (keys: Set<Key>) => void;
}

/* ════════════════════════════════════════════════════════════════════════════
 * BUTTONS
 * ═══════════════════════════════════════════════════════════════════════════ */

/** The ARIA state attributes a button may carry explicitly. */
export interface ButtonAriaProps {
  "aria-expanded"?: boolean | "true" | "false";
  "aria-haspopup"?: boolean | "menu" | "listbox" | "tree" | "grid" | "dialog" | "true" | "false";
  "aria-controls"?: string;
  "aria-pressed"?: boolean | "true" | "false" | "mixed";
  "aria-disabled"?: boolean | "true" | "false";
  "aria-current"?: boolean | "true" | "false" | "page" | "step" | "location" | "date" | "time";
}

/** The `<button>` form attributes a button forwards. */
export interface ButtonFormProps {
  /** The behavior of the button when used in an HTML form. */
  type?: "button" | "submit" | "reset";
  /** The value associated with the button's name when submitted with form data. */
  value?: string;
  /** The name of the button, used when submitting an HTML form. */
  name?: string;
  /** The id of the `<form>` element the button is associated with. */
  form?: string;
  formAction?: ButtonHTMLAttributes<HTMLButtonElement>["formAction"];
  formEncType?: string;
  formMethod?: string;
  formNoValidate?: boolean;
  formTarget?: string;
}

/**
 * A pressable button's prop surface, minus its children and class.
 *
 * This is the single most-copied shape in the library — `button.tsx`,
 * `item.tsx`, `menubar.tsx` and `disclosure.tsx` all pin their public API to
 * it, and `base-ui-adapter.ts` translates it onto Base UI at runtime.
 */
export interface ButtonPropsBase
  extends FocusableProps,
    PressEvents,
    HoverEvents,
    FocusableDOMProps,
    AriaLabelingProps,
    ButtonAriaProps,
    ButtonFormProps,
    SlotProps,
    StyleProps,
    // `onClick` comes from `PressEvents`, not from the global set: a button's
    // click handler is the press API's, and declaring both is a conflict.
    Omit<GlobalDOMAttributes<HTMLButtonElement>, "onClick"> {
  /** Whether the button is disabled. */
  isDisabled?: boolean;
  /**
   * The button's position in the sequential tab order.
   *
   * ── WHY A PROP THE REACT ARIA API NEVER DECLARED IS ADDED HERE ────────────
   *
   * `FocusableDOMProps` above offers `excludeFromTabOrder`, and its own comment
   * records the finding that under Base UI it is unreachable — `tabIndex={-1}`
   * reaches the element directly and is what the flag ever meant. That covers
   * REMOVING a button from the tab order. It cannot express the other half of a
   * roving tabindex, which is putting the `0` BACK on exactly one member.
   *
   * A `role="grid"` needs both halves on the same control. `table.tsx` puts the
   * grid's single Tab stop on the widget inside a cell rather than on the cell
   * (ARIA's widget-focus model, and the reason `TableSelectionCell` exists), so
   * the control in the active cell must serve `tabindex="0"` and the same
   * control in every other row must serve `-1` — in the FIRST BYTE, because a
   * stop elected in a layout effect does not exist on the server. Measured
   * 12 Aug 2026 on a three-row grid with one `IconButton` per row: the served
   * bytes carried FOUR `tabindex="0"` — the active cell plus one per button,
   * since Base UI's `Button` writes an explicit `tabindex="0"` of its own
   * rather than relying on a `<button>`'s default tabbability.
   *
   * The value reaches the element: `button.tsx` leaves `tabIndex` in `...rest`
   * and spreads `rest` AFTER its own `attr("tabIndex", …)`, so a caller's value
   * wins over `excludeFromTabOrder`, and Base UI resolves a conflict with its
   * own default in the caller's favour. Verified by rendering — `<IconButton
   * tabIndex={-1}>` emits `tabindex="-1"` and no `tabindex="0"`.
   *
   * Declared on the BUTTON shape alone and not on `FocusableDOMProps`, which
   * would hand it to every focusable control in the library at once. Several of
   * those destructure their props rather than spreading them, so a blanket
   * declaration would mint accepted-and-unreachable props — the exact defect
   * `isPending` below exists to document. `CheckboxProps` still needs the same
   * one-line fix and still has the cast in `table.tsx` recording that it does;
   * widening this shape is not evidence about that one.
   */
  tabIndex?: number | undefined;
  /**
   * TYPE CARRIER, NOT A PROP — `never`, so passing a value is a compile error.
   *
   * ── IT READ "WHETHER THE BUTTON IS IN A PENDING STATE" AND DID NOTHING ────
   *
   * React Aria's `Button` had a real pending state: it rendered a busy
   * affordance and set `aria-disabled` while keeping the button focusable. Base
   * UI has no equivalent, so `button.tsx` destructures this prop for the sole
   * purpose of NOT spreading it onto the element. The result was the worst of
   * the three possible behaviours: set it and nothing renders, nothing is
   * announced, and nothing errors.
   *
   * That is the same defect as `isKeyboardDismissDisabled` on the overlay
   * surfaces, and it gets the same answer — except that this one has nowhere
   * correct to be relocated to, because the replacement is a COMPOSITION rather
   * than a prop. See the `busy` example on the button page: `isDisabled` blocks
   * the second submit, a `<Spinner>` announces the wait as real text inside
   * `role="status"`, and the button keeps its own label.
   *
   * The field survives rather than being deleted, following
   * `MenuItemProps.value`: keeping it is what keeps a consumer's existing
   * `ButtonPropsBase` annotation compiling, while `never` makes the one thing
   * that never worked into an error instead of a silence. Nothing in this
   * repository passed it — the blocks all declare an `isPending` of their own
   * and forward it as `isDisabled`, which is the composition above.
   *
   * SPELLED `?: undefined`, NOT `?: never`. Under this repo's
   * `exactOptionalPropertyTypes: true` a `never` field rejects an EXPLICIT
   * `undefined` too, so `<Button {...props}>` would stop compiling for any
   * caller whose object carries `isPending: undefined` — punishing a spread
   * that was already correct. `undefined` is the honest spelling anyway: the
   * only value this field may hold is no value.
   */
  isPending?: undefined;
  /**
   * TYPE CARRIER, NOT A PROP — same reason as `isPending`, same evidence.
   *
   * React Aria's press layer could suppress the focus move; Base UI's button is
   * a plain `<button>` and focus on press is the browser's. `button.tsx`,
   * `menubar.tsx` and `disclosure.tsx` all destructure it purely to keep it off
   * the element. `toggle.tsx` declares a `preventFocusOnPress` of its OWN and is
   * not affected by this.
   */
  preventFocusOnPress?: undefined;
}
