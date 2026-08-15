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
 * The vocabulary types Lumo's prop bags are composed from (`InputBase`,
 * `ValueBase`, `Validation`, `FocusableProps`, `GlobalDOMEvents`, …), owned by
 * Lumo so no component carries a type-only import of a retired engine — the
 * type import IS the dependency `registry.json` derives. Nothing here has
 * behaviour. RAC's `render` prop and function-valued `className`/`style` are
 * deliberately absent; DOM event groups are `Pick`ed from React (one measured
 * widening: `T | undefined`). Reasoning: `docs/architecture.md`,
 * `docs/decisions/log.md`.
 */

/*
 * THE ROOT CONTRACT — `ref`, `id` and every other DOM attribute (12 Aug 2026;
 * enforced by `packages/gate/src/inert-props.ts`, exemplar in `button.tsx`):
 * a props interface extends `ComponentProps<E>` of the root it renders (never
 * `HTMLAttributes<T>` — under React 19 that base type IS the `ref` story),
 * `Omit`s only what the component owns and says why on the line, and spreads
 * the rest at the root. `ref` and `id` are never subtracted, only OWNED (the
 * component reads/writes it) or WIDENED (`Ref<HTMLElement>` for a varying
 * root), each with a comment on the `Omit` line. Roots that read back an
 * attribute they write spread `{...props}` FIRST. Full decision and the
 * rejected allow-list alternative: `docs/decisions/log.md`.
 */

// KEYS, SELECTION, ORIENTATION

/**
 * A collection item's identity. NOT React's `Key` (which includes `bigint`);
 * the type `onSelectionChange` and `onAction` hand back.
 */
export type Key = string | number;

/** `'all'` is a real selection state, distinct from a set holding every key. */
export type Selection = "all" | Set<Key>;

export type SelectionMode = "none" | "single" | "multiple";
export type SelectionBehavior = "toggle" | "replace";
export type DisabledBehavior = "selection" | "all";
export type FocusStrategy = "first" | "last";

/** Layout axis. A VISUAL prop in Lumo — the keyboard model no longer reads it. */
export type Orientation = "horizontal" | "vertical";

// VALIDATION

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
  /** ACCEPTED AND UNREACHABLE under Base UI, which decides this on `<Form>`; kept as API. */
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

// INTERACTION EVENTS — `PressEvent` is the one shape a consumer writes code
// AGAINST; `base-ui-adapter.ts` translates a real DOM event into one at runtime.

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
 * A React keyboard event that does NOT propagate by default. `Lumo`-prefixed so
 * it never shadows the DOM global. The `any` is LOAD-BEARING: narrowing it to
 * `Element` makes the type unassignable to React's own `KeyboardEventHandler`
 * where `menubar.tsx`/`toolbar.tsx` spread `rest` at a bare `<button>`.
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
 * Any focusable element, HTML or SVG. `PressEvents.onClick` is typed against
 * this, not `Element`: a caller-annotated handler must stay assignable.
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

// DOM PROPS

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
}

export interface InputDOMProps {
  /** The name of the input element, used when submitting an HTML form. */
  name?: string;
  /** The id of the `<form>` element to associate the input with. */
  form?: string;
}

export interface StyleProps {
  /** The inline style for the element. */
  style?: CSSProperties;
}

/** Text-input events, `Pick`ed from React so the handler parameter types are React's own. */
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
   * Not `Pick`ed: React 19's `InputEventHandler` is narrower than the published `FormEventHandler`.
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
  /** Whether the browser may auto-correct typed text: `"on"` or `"off"`. */
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
}

/**
 * Global DOM events supported on any element, `Pick`ed from React. Keyboard and
 * focus events live on the focusable groups above; drag/media are absent.
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

/**
 * Global attributes plus global events. `id` is handled by `DOMProps`. There is
 * NO `dir` here, on purpose: direction is `direction(locale)` from `LumoProvider`,
 * and a component that needs an LTR island sets `dir` on its own host element
 * (Kbd, InputOtp, the phone run). Since 16 Aug 2026 — it was declared and
 * forwarded on ~40 interfaces while the docs said "no dir prop".
 */
export interface GlobalDOMAttributes<T = Element> extends GlobalDOMEvents<T> {
  /** The element's `lang` attribute, when this subtree's language differs from the page's. */
  lang?: string | undefined;
  /** The DOM `hidden` attribute: removes the element from rendering and the accessibility tree. */
  hidden?: boolean | undefined;
  /** The DOM `inert` attribute: the subtree cannot be focused, clicked, or read by assistive technology. */
  inert?: boolean | undefined;
  /** The DOM `translate` attribute: whether machine translation may rewrite this subtree's text. */
  translate?: "yes" | "no" | undefined;
}

// TEXT FIELDS

/**
 * The prop surface every single-line text control in Lumo is pinned to —
 * `TextField`, `TextArea`, `SearchField` and `InputGroup`. `label`, `description`,
 * `errorMessage` and `placeholder` are deliberately ABSENT: each component
 * redeclares `label` as a REQUIRED `string`, and inheriting the optional version
 * would quietly undo that.
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
    StyleProps,
    GlobalDOMAttributes<HTMLDivElement> {
  "aria-activedescendant"?: string;
  "aria-autocomplete"?: "none" | "inline" | "list" | "both";
  "aria-haspopup"?: boolean | "false" | "true" | "menu" | "listbox" | "tree" | "grid" | "dialog";
  "aria-controls"?: string;
  /** The label of the on-screen keyboard's enter key. */
  enterKeyHint?: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
}

// BOOLEAN FIELDS AND FIELD GROUPS

/**
 * A single boolean control that is also a form field — `Checkbox`, `Switch`.
 * Distinct from a bare toggle BUTTON (`toggle.tsx`) because this one submits.
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
 * Three type parameters because a radio group holds `string | null`, hands
 * `string` to `onChange`, and validates a `string`.
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
    StyleProps,
    GlobalDOMAttributes<HTMLDivElement> {}

// OVERLAYS

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
 * Open state under Base UI belongs to the ROOT, which in Lumo the TRIGGER
 * renders; a backdrop, panel or popup that accepted the trio would compile and
 * do nothing. Absent is a failure at the call site; accepted-and-ignored is a
 * bug report six months on.
 */
export type OverlayOpenStateKeys = "isOpen" | "defaultOpen" | "onOpenChange";

/** A dialog's own props — `dialog.tsx` and `alert-dialog.tsx`. */
export interface DialogPropsBase
  extends DOMProps,
    AriaLabelingProps,
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
 * `drawer.tsx`'s. Several are ACCEPTED AND UNREACHABLE under Base UI (each
 * component's header names which); `isKeyboardDismissDisabled` was removed and
 * relocated to `DialogTrigger`, where the Root that reads it lives.
 */
export interface ModalOverlayPropsBase
  extends OverlayTriggerProps,
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
 * The full placement union, physical spellings included; `popover.tsx`
 * subtracts the physical ones at the call site (`LumoPlacement`).
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

// COLLECTIONS

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

// BUTTONS

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
 * A pressable button's prop surface, minus its children and class — the
 * most-copied shape in the library; `base-ui-adapter.ts` translates it onto Base UI.
 */
export interface ButtonPropsBase
  extends FocusableProps,
    PressEvents,
    HoverEvents,
    FocusableDOMProps,
    AriaLabelingProps,
    ButtonAriaProps,
    ButtonFormProps,
    StyleProps,
    // `onClick` comes from `PressEvents`, not from the global set.
    Omit<GlobalDOMAttributes<HTMLButtonElement>, "onClick"> {
  /** Whether the button is disabled. */
  isDisabled?: boolean;
  /**
   * The button's position in the sequential tab order.
   *
   * A real prop (not RAC's `excludeFromTabOrder`) because a roving tabindex
   * needs the `0` put BACK on one member in the FIRST BYTE — `table.tsx`'s grid.
   * `button.tsx` spreads `rest` AFTER its own `attr("tabIndex", …)`, so a
   * caller's value wins. Declared on the BUTTON shape alone, not
   * `FocusableDOMProps`, so no destructuring control mints an inert prop.
   */
  tabIndex?: number | undefined;
}
