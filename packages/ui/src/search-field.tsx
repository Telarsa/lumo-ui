"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { SearchIcon, XIcon } from "lucide-react";
import {
  Input as AriaInput,
  SearchField as AriaSearchField,
  type SearchFieldProps as AriaSearchFieldProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
import { IconButton } from "./button.tsx";
import {
  Description,
  FieldError,
  Label,
  fieldVariants,
  optional,
} from "./form.tsx";

/**
 * The search input.
 *
 * The icon and the clear button are ABSOLUTELY POSITIONED over the input rather
 * than laid out beside it inside a flex `<Group>`, and that is a focus decision
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
 */
export const searchInputVariants = cva(
  "w-full min-w-0 rounded-md border border-border-control bg-surface text-fg text-start " +
    "ps-9 pe-9 transition-colors placeholder:text-fg-subtle " +
    "[&::-webkit-search-cancel-button]:hidden " +
    "data-hovered:border-border-strong " +
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
 * `clearLabel` is REQUIRED and typed `string` because of a measured leak: React
 * Aria composes the clear button's name itself as `aria-label="Clear search"`,
 * from a string bundle that has no `fa` entry and — because
 * `LocalizedStringProvider` emits a client `<script>` rather than context — is not
 * reachable on the server at all. See `packages/core/src/strings.ts`; the Persian
 * value lives at `searchField.clear`.
 *
 * The override works because `SearchField` publishes `clearButtonProps` through an
 * UNSLOTTED `ButtonContext`, and React Aria merges context first and local props
 * second. Anything local wins. There is no `clearButtonLabel` prop on the field
 * itself — the button is the only reachable surface, which is why this component
 * owns the button rather than accepting it as a child.
 */
export interface SearchFieldProps
  extends Omit<AriaSearchFieldProps, "children" | "className" | "isInvalid">,
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
  ...props
}: SearchFieldProps) {
  return (
    <AriaSearchField
      data-lumo=""
      // Named group: the clear button hides itself from `data-empty` on this
      // root. Named rather than bare `group` so a SearchField nested inside
      // another grouped component cannot read the wrong ancestor's state.
      className={cn("group/search", fieldVariants(), className)}
      {...optional("isInvalid", isInvalid ?? (errorMessage != null ? true : undefined))}
      {...props}
    >
      <Label>{label}</Label>
      <div className="relative flex items-center">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute start-3 size-4 shrink-0 text-fg-subtle"
        />
        <AriaInput
          data-lumo=""
          className={cn(searchInputVariants({ size }), inputClassName)}
          {...optional("placeholder", placeholder)}
        />
        {/*
         * `-translate-y-1/2` is a BLOCK-axis transform. It is not mirrored by
         * writing direction and is therefore safe; the inline axis is handled by
         * `end-1`, which is `inset-inline-end`.
         */}
        <IconButton
          label={clearLabel}
          variant="ghost"
          size="sm"
          className="absolute end-1 top-1/2 -translate-y-1/2 rounded-full group-data-empty/search:hidden"
        >
          <XIcon aria-hidden="true" />
        </IconButton>
      </div>
      {description != null ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
    </AriaSearchField>
  );
}
