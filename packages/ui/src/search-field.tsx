"use client";

import { useRef, type KeyboardEvent } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { SearchIcon, XIcon } from "lucide-react";
import { cn, type LumoNode, type TextFieldPropsBase } from "@lumo-ui/core";
import { IconButton } from "./button.tsx";
import { Description, Field, FieldError, FieldInput, Label, optional } from "./form.tsx";

/**
 * The search input. The icon and clear button are ABSOLUTELY POSITIONED over
 * the input so the border — and the shared `data-lumo` focus ring — stay on the
 * element that takes focus. `ps-9`/`pe-9` reserve the overlays logically.
 * `::-webkit-search-cancel-button` is hidden: an unlabelled native control.
 */
export const searchInputVariants = cva(
  "w-full min-w-0 rounded-md border border-border-control bg-surface text-fg text-start " +
    "ps-9 pe-9 transition-colors placeholder:text-fg-subtle " +
    "[&::-webkit-search-cancel-button]:hidden " +
    "hover:border-border-strong " +
    "data-invalid:border-critical " +
    "data-disabled:cursor-not-allowed data-disabled:bg-surface-sunken",
  {
    variants: {
      /** The size step on the shared control scale. */
      size: {
        sm: "h-control-sm text-sm",
        md: "h-control-md text-sm",
        lg: "h-control-lg text-base",
      },
    },
    defaultVariants: { size: "md" },
  },
);

/**
 * A search field. Base UI has no search field, so this is BUILT: `Field` +
 * `Input` + `type="search"` + a clear button this file owns. Clearing goes
 * through the native `value` setter plus a bubbling `input` event (a state
 * mirror is forbidden, and `el.value = ""` is swallowed by React's tracker);
 * Escape clears; `clearLabel` is REQUIRED because Base UI ships no name at all.
 * FIRST-BYTE GAP, left honest: `Field.Root` seeds `filled` as `false` with no
 * prop to override, so a server-rendered `defaultValue` serves its clear button
 * hidden until hydration.
 */
/** A search field is a text field plus two events the text field has no notion of. */
interface SearchFieldPropsBase
  extends Omit<TextFieldPropsBase, "isInvalid" | "validationBehavior" | "type"> {
  /** The control's position in the sequential tab order — `-1` removes it (was `excludeFromTabOrder`). */
  tabIndex?: number | undefined;
  /** Handler that is called when the Enter key is pressed. */
  onSubmit?: (value: string) => void;
  /** Handler that is called when the clear button is pressed. */
  onClear?: () => void;
}

export interface SearchFieldProps
  extends SearchFieldPropsBase,
    VariantProps<typeof searchInputVariants> {
  /** Announced and displayed name. Required: an unnamed field is a defect. */
  label: string;
  /** The clear button's accessible name. REQUIRED, no default: a default would be English. */
  clearLabel: string;
  description?: LumoNode;
  /** Supplying one marks the field invalid. See `TextField`. */
  errorMessage?: LumoNode;
  /** Overrides the invalid state derived from `errorMessage`. */
  isInvalid?: boolean | undefined;
  placeholder?: string | undefined;
  className?: string | undefined;
  /** Classes for the `<input>` itself. */
  inputClassName?: string | undefined;
}

export function SearchField({
  label,
  clearLabel,
  description,
  errorMessage,
  isInvalid,
  placeholder,
  size,
  className,
  inputClassName,
  // — translated onto <Field> —
  isDisabled,
  name,
  validate,
  // — translated onto the control —
  value,
  defaultValue,
  onChange,
  onClear,
  onSubmit,
  isReadOnly,
  isRequired,
  autoFocus,
  // — accepted by the API, unreachable in Base UI. See text-field.tsx. —
  tabIndex,
  ...rest
}: SearchFieldProps) {
  // `HTMLElement`, as `Field.Control` declares its ref; the narrowing below is
  // a real check, so a future `render={<textarea/>}` fails loudly.
  const inputRef = useRef<HTMLElement>(null);
  const initiallyFilled = String(value ?? defaultValue ?? "").length > 0;

  // The native setter: React's own `value` descriptor marks a direct assignment
  // as already seen, so a CONTROLLED field would clear and snap back. The
  // prototype setter plus a bubbling `input` event is what React and Base UI listen for.
  function clear() {
    const el = inputRef.current;
    if (!(el instanceof HTMLInputElement)) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(el, "");
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.focus();
    onClear?.();
  }

  return (
    <Field
      label={label}
      description={description}
      errorMessage={errorMessage}
      explicit={rest}
      // Named group: the clear button reads `data-filled` from THIS root.
      className={cn("group/search", className)}
      {...optional("isDisabled", isDisabled)}
      {...optional("isInvalid", isInvalid)}
      {...optional("name", name)}
      {...optional(
        "validate",
        validate === undefined
          ? undefined
          : (fieldValue: unknown) => {
              const result = validate(String(fieldValue ?? ""));
              return result === true || result === undefined ? null : result;
            },
      )}
    >
      <Label>{label}</Label>
      <div className="relative flex items-center">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute start-3 size-4 shrink-0 text-fg-subtle"
        />
        <FieldInput
          ref={inputRef}
          type="search"
          className={cn(searchInputVariants({ size }), inputClassName)}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Escape") {
              event.preventDefault();
              clear();
            } else if (event.key === "Enter") {
              // Enter fires the callback and lets a surrounding form keep its own behaviour.
              onSubmit?.(event.currentTarget.value);
            }
          }}
          {...optional("placeholder", placeholder)}
          {...optional("value", value)}
          {...optional("defaultValue", defaultValue)}
          {...optional(
            "onValueChange",
            onChange === undefined ? undefined : (next: string) => onChange(next),
          )}
          {...optional("readOnly", isReadOnly)}
          {...optional("required", isRequired)}
          {...optional("autoFocus", autoFocus)}
          {...(rest as object)}
          {...optional("tabIndex", tabIndex)}
        />
        {/*
         * `-translate-y-1/2` is a BLOCK-axis transform, safe under RTL; the inline
         * axis is `end-1`. `hidden` + `group-data-filled` restore: Base UI states
         * the POSITIVE. `type="button"` so it cannot submit a surrounding form.
         */}
        <IconButton
          type="button"
          label={clearLabel}
          variant="ghost"
          size="sm"
          onPress={clear}
          className={cn(
            "absolute end-1 top-1/2 -translate-y-1/2 rounded-full",
            initiallyFilled
              ? "inline-flex group-data-empty/search:hidden"
              : "hidden group-data-filled/search:inline-flex",
          )}
        >
          <XIcon aria-hidden="true" />
        </IconButton>
      </div>
      {description != null ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
    </Field>
  );
}
