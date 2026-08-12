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
  routerOptions?: never;
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
  dir?: string | undefined;
  lang?: string | undefined;
  hidden?: boolean | undefined;
  inert?: boolean | undefined;
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
