export type { LumoNode, Locale, Direction } from "./types.ts";
export type { BuiltinLocale } from "./types.ts";
export { BUILTIN_LOCALES, LOCALES, FORMAT_LOCALE, RTL_PRIMARY, direction, formatLocale, isBuiltinLocale, isLocale, primarySubtag } from "./types.ts";
// The prop SHAPES the public API is pinned to (see `props.ts`).
export type {
  AriaLabelingProps,
  AriaValidationProps,
  Axis,
  ButtonAriaProps,
  ButtonFormProps,
  ButtonPropsBase,
  CollectionStateBase,
  DialogPropsBase,
  DisabledBehavior,
  DOMProps,
  Expandable,
  FocusableDOMProps,
  FieldGroupPropsBase,
  FocusableElement,
  FocusableProps,
  FocusEvents,
  FocusStrategy,
  FocusWithinEvents,
  GlobalDOMAttributes,
  GlobalDOMEvents,
  HelpTextProps,
  HoverEvent,
  HoverEvents,
  InputBase,
  InputDOMProps,
  Key,
  KeyboardEvents,
  LinkDOMProps,
  LumoKeyboardEvent,
  ModalOverlayPropsBase,
  MultipleSelection,
  Orientation,
  OverlayOpenStateKeys,
  OverlayTriggerProps,
  Placement,
  PlacementAxis,
  PointerType,
  PositionProps,
  PressEvent,
  PressEvents,
  Selection,
  SelectionBehavior,
  SelectionMode,
  StyleProps,
  TextFieldPropsBase,
  ToggleFieldPropsBase,
  TextInputDOMEvents,
  TextInputDOMProps,
  ValidationError,
  ValidationResult,
  Validation,
  ValueBase,
} from "./props.ts";
export { cn } from "./cn.ts";
export { LumoHtml, documentDirection } from "./html.tsx";
export type { LumoHtmlProps } from "./html.tsx";
export { formatNumber, formatDate, parseNumber } from "./format.ts";
// The Latin-island helpers: the one exemption the gate honours, as components
// and attribute spreads that AGREE with the gate's test (see ./latn.tsx).
export { isLatinRun, latnAttrs, latnNodeAttrs, plain } from "./latn.ts";
export type { LatnAttrs } from "./latn.ts";
export { Latn, Name, Prose } from "./latn.tsx";
export type { LatnProps, ProseProps } from "./latn.tsx";

export { STRINGS, stringsFor, fa, en } from "./strings.ts";
// The locale context and its provider (decision §50.2). Locale + strings only:
// Base UI's direction context is NOT mounted here — see ./locale.tsx.
export {
  LumoLocaleContext,
  LumoLocaleProvider,
  useLumoLocale,
  useLumoStrings,
  useLumoStringsFor,
} from "./locale.tsx";
export type { LumoLocaleValue, LumoLocaleProviderProps } from "./locale.tsx";
export type { LumoStrings } from "./strings.ts";
// The Base UI string catalogue lives in `@lumo-ui/base-ui-ssr`, not here.
export { themeScript, getTheme, resolvedTheme, setTheme } from "./theme.ts";
export type { Theme, ResolvedTheme, ThemeOptions } from "./theme.ts";
