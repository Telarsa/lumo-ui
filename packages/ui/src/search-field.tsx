"use client";

import { useRef, type KeyboardEvent } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { SearchIcon, XIcon } from "lucide-react";
import { cn, type LumoNode, type TextFieldPropsBase } from "@lumo-ui/core";
import { IconButton } from "./button.tsx";
import { Description, Field, FieldError, FieldInput, Label, optional } from "./form.tsx";

/**
 * The search input.
 *
 * The icon and the clear button are ABSOLUTELY POSITIONED over the input rather
 * than laid out beside it inside a flex group, and that is a focus decision
 * before it is a layout one. If the border lived on a wrapper, the element that
 * actually takes focus would be a borderless `<input>` inset inside it, and the
 * shared `:where([data-lumo]):focus-visible` ring would draw a rectangle around
 * the text run instead of around the control. Keeping the border on the input
 * means the one focus rule in theme.css is still the only focus rule.
 *
 * `ps-9`/`pe-9` reserve the two overlays. Both are `padding-inline-*`, so the
 * magnifier sits at the reading start and the clear button at the reading end in
 * either script, with no `rtl:` override anywhere.
 *
 * `::-webkit-search-cancel-button` is hidden because `type="search"` gives WebKit
 * its own clear affordance — an unlabelled native control that would sit beside
 * ours, be announced with no name, and always in English if it were announced.
 *
 * `data-hovered:` became `hover:`; `data-invalid` and `data-disabled` carry
 * over. See `inputVariants` in text-field.tsx for the measurement.
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
 * A search field.
 *
 * ── THERE IS NO BASE UI SEARCH FIELD, AND THAT IS THE INTERESTING PART ─────
 *
 * `@base-ui/react` has 83 export subpaths and none of them is `search-field`.
 * So this component is BUILT rather than migrated: `Field` + `Input` +
 * `type="search"` + a clear button this file owns. Three behaviours React Aria
 * supplied for free had to be re-authored, and each is worth stating because
 * each is a place a hand-rolled search box is normally wrong.
 *
 * **1. Clearing must go through the platform, not through a state mirror.**
 * House rule 5 forbids a `useState` that mirrors what the DOM already says, and
 * this control has to work uncontrolled AND controlled. So the button writes
 * the empty string through the native `value` setter and dispatches a bubbling
 * `input` event. That is the one route that makes React's synthetic `onChange`
 * fire for a controlled input — assigning `el.value = ""` directly is swallowed
 * by React's value tracker and the consumer's `onChange` never runs, which is
 * the silent version of this bug. The same event is what tells Base UI's
 * `Field.Root` the field is no longer filled, so the button hides itself.
 *
 * **2. Escape clears.** React Aria bound it; nothing in Base UI does. A search
 * box that does not answer Escape is a small thing that keyboard users notice
 * immediately.
 *
 * **3. `clearLabel` is REQUIRED and typed `string`,** and the argument for it
 * INVERTED rather than disappearing. Under React Aria the prop existed because
 * RAC composed the button's name itself as `aria-label="Clear search"` from a
 * bundle with no `fa` entry, unreachable on the server. Base UI ships no string
 * bundle at all — so with no prop there would be no name, and an unnamed button
 * is worse than an English one: there is no Latin word for the HTML gate to
 * catch, and a screenshot of a bare × looks like a styling choice. The prop
 * stays required and the argument is now stronger.
 *
 * ── ONE FIRST-BYTE GAP, LEFT HONEST ────────────────────────────────────────
 *
 * The clear button's visibility is CSS, driven by Base UI's `data-filled` on
 * `Field.Root` — no JavaScript, no state mirror. But `Field.Root` initialises
 * that state as `React.useState(false)` (`field/root/FieldRoot.mjs:45`) and
 * exposes no prop to seed it: `FieldRootProps` has controlled overrides for
 * `dirty` and `touched` and none for `filled`. So a SERVER-RENDERED
 * `<SearchField defaultValue="تهران">` serves its clear button hidden, and it
 * appears on hydration.
 *
 * The adapter cannot close this one — every fix in `@lumo-ui/base-ui-ssr` is a
 * value passed INTO Base UI through a public prop, and here there is no prop to
 * pass. It is recorded rather than papered over: the alternatives are a
 * `useState` mirror (rule 5, and it would fight the uncontrolled case) or
 * `:placeholder-shown`, which is a real CSS answer but silently does nothing
 * when the caller passes no `placeholder`. A control that works only when an
 * unrelated optional prop is set is worse than a documented gap.
 */
/**
 * A search field is a text field plus two events the text field has no notion
 * of. Stated here rather than in `@lumo-ui/core` because they are this
 * component's, and only this component's.
 */
interface SearchFieldPropsBase
  extends Omit<TextFieldPropsBase, "isInvalid" | "validationBehavior" | "type"> {
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
  /**
   * The clear button's accessible name. REQUIRED, no default: a default would be
   * English, and English is the defect this library exists to prevent.
   */
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
  excludeFromTabOrder,
  ...rest
}: SearchFieldProps) {
  /*
   * Typed `HTMLElement` rather than `HTMLInputElement` because that is what
   * `Field.Control` declares its ref as — it can render any element through
   * `render`. The narrowing below is a real check rather than a cast, so a
   * future `render={<textarea/>}` here would fail loudly instead of clearing
   * nothing.
   */
  const inputRef = useRef<HTMLElement>(null);
  const initiallyFilled = String(value ?? defaultValue ?? "").length > 0;

  /*
   * The native setter, and why it is not cleverness for its own sake. React
   * installs its own `value` descriptor on the input instance to track changes;
   * assigning through it marks the new value as "already seen" and no synthetic
   * `change` is dispatched, so a CONTROLLED SearchField would visibly clear and
   * then snap back on the next render with the consumer never told. Reaching
   * the prototype's setter writes the value where React's tracker will notice
   * it, and the bubbling `input` event is what both React and Base UI's
   * `Field.Control` listen for.
   */
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
      // Named rather than bare `group` so a SearchField nested inside another
      // grouped component cannot read the wrong ancestor's state.
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
              // React Aria's SearchField submitted on Enter. Base UI does not,
              // and inside a real `<form>` the browser would submit the form
              // instead — so this fires the callback and lets the form keep its
              // own behaviour rather than calling preventDefault.
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
          {...optional("tabIndex", excludeFromTabOrder === true ? -1 : undefined)}
        />
        {/*
         * `-translate-y-1/2` is a BLOCK-axis transform. It is not mirrored by
         * writing direction and is therefore safe; the inline axis is handled by
         * `end-1`, which is `inset-inline-end`.
         *
         * `hidden` plus a `group-data-filled` restore, rather than the old
         * `group-data-empty:hidden`: Base UI states the POSITIVE (the field has
         * a value) where React Aria stated the negative. `type="button"` so the
         * clear control cannot submit a surrounding form.
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
