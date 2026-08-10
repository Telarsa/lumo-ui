"use client";

import { createContext, useContext, useId } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Button as AriaButton,
  Tag as AriaTag,
  TagGroup as AriaTagGroup,
  TagList as AriaTagList,
  type Key,
  type TagGroupProps as AriaTagGroupProps,
  type TagListProps as AriaTagListProps,
  type TagProps as AriaTagProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A keyboard-navigable list of filters, keywords or selected values.
 *
 *     <TagGroup
 *       label="فیلترهای فعال"
 *       onRemove={(keys) => drop(keys)}
 *       removeLabel={(tag) => `حذف ${tag}`}
 *     >
 *       <TagList>
 *         <TagItem id="thr" textValue="تهران">تهران</TagItem>
 *         <TagItem id="isf" textValue="اصفهان">اصفهان</TagItem>
 *       </TagList>
 *     </TagGroup>
 *
 * Distinct from `tag.tsx`, which is a single static chip — a `<span>` with no
 * collection, no roving focus and no Delete-key handling. This one is RAC's
 * `role="grid"` collection: arrow keys move between tags, Delete removes, and
 * arrow direction is resolved against the document direction so ArrowLeft moves
 * FORWARD in Persian. None of that is implemented here; it is why Lumo rents
 * behaviour from React Aria.
 *
 * `"use client"` for that behaviour, and independently because `onRemove` is a
 * function prop — a function cannot cross the server/client boundary.
 *
 * ═══ `removeLabel` IS A FUNCTION, AND THE REASON IS NOT STYLE ═══════════════
 *
 * The remove control is an ✕ with no text, so it has no name of its own. RAC
 * supplies one, and supplies it TWICE. From
 * `react-aria/private/tag/useTag.mjs`:
 *
 *     removeButtonProps: {
 *       'aria-label': stringFormatter.format('removeButtonLabel'),   // "Remove"
 *       'aria-labelledby': `${buttonId} ${rowProps.id}`,
 *       ...
 *     }
 *
 * Measured output, with a Persian `aria-label` passed in:
 *
 *     <button id="…_r_7_" aria-label="حذف تهران"
 *             aria-labelledby="…_r_7_ …_r_0_-thr" slot="remove">
 *
 * Read that carefully, because it decides the whole API:
 *
 *  1. `aria-labelledby` OVERRIDES `aria-label` in the accessible-name
 *     computation. It names the button by concatenating the button's own label
 *     with the TAG ROW's — so RAC's design is "verb here, noun appended
 *     automatically": `"Remove"` + `"Tehran"`. Pass a complete Persian phrase
 *     and you get «حذف تهران تهران», the noun twice.
 *  2. The English `aria-label="Remove"` is in the served HTML whether or not
 *     the name computation uses it, and `lumo-gate` greps `aria-label` for
 *     Latin script. Overriding only `aria-labelledby` would leave the gate red.
 *
 * So both are overridden, deliberately: `aria-label` to keep English out of the
 * bytes, and `aria-labelledby` — pointed at a visually-hidden span inside the
 * button — to make the announced name EXACTLY the consumer's string, with no
 * concatenation happening behind it. `aria-labelledby={undefined}` would not
 * work: `mergeProps` does `result[key] = b !== undefined ? b : a`, so an
 * undefined local value leaves RAC's context value standing.
 *
 * ── AND THAT IS WHY IT TAKES THE TAG'S OWN LABEL ────────────────────────────
 *
 * Once Lumo owns the whole name rather than a fragment RAC glues a noun onto,
 * a fixed string cannot express it. «حذف» alone announces eight identical
 * buttons on a page with eight filters — the measured 33-unnamed-controls defect
 * with a name attached but no distinguishing content. And the phrase is not
 * assemblable by the library: Persian can want «حذف تهران», «تهران را حذف کن» or
 * «برداشتن فیلتر تهران», and only the first happens to match English word order.
 * A `(tagLabel: string) => string` hands the consumer the noun and asks for the
 * sentence — the same shape `numberField.decrease` takes in
 * `@lumo-ui/core`'s strings.ts, and for the same reason recorded there: word
 * order must be authored, not interpolated.
 *
 * It lives on the GROUP rather than on each tag because `onRemove` does, and the
 * two are meaningless apart. The union below makes that structural: `onRemove`
 * without `removeLabel` is a type error, and `removeLabel` without `onRemove`
 * is unrepresentable.
 */

/**
 * Carries the group's `removeLabel` to each tag.
 *
 * A context rather than a prop on every `TagItem`, and the objection recorded in
 * `progress.tsx` — "a context has a default, and the default renders confidently
 * wrong" — does not apply here: the default is `null`, and a `null` reaching a
 * tag that is actually removable is impossible, because `removeLabel` and
 * `onRemove` are the same type-level decision on the same element.
 */
const RemoveLabelContext = createContext<((tagLabel: string) => string) | null>(null);

export const tagGroupVariants = cva("flex flex-col gap-2");

export const tagListVariants = cva(
  "flex flex-wrap items-center gap-2 outline-none " +
    // RAC publishes `data-empty` on the list; the empty state is the consumer's
    // to render via `renderEmptyState`, so all this does is keep the row from
    // collapsing to zero height and jumping the layout.
    "data-empty:min-h-8",
);

export const tagItemVariants = cva(
  "inline-flex w-fit max-w-full cursor-default select-none items-center " +
    "rounded-md border border-border bg-surface-sunken align-middle " +
    "whitespace-nowrap text-fg outline-none transition-colors " +
    "data-hovered:bg-surface-hover " +
    // `data-selected` is selection in the collection sense; `data-focus-visible`
    // is the roving tabindex landing on this tag. Both need to be visible, and
    // they are different states — styling only one of them is the usual bug.
    "data-selected:border-accent data-selected:bg-accent data-selected:text-accent-fg " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      size: {
        // `ps-`/`pe-` rather than `px-`: the inline-END cap is trimmed when a
        // remove button is present, and only a logical pair can express "the
        // cap the button sits in" without knowing which side that is.
        sm: "h-6 gap-1 ps-2 pe-2 text-xs",
        md: "h-7 gap-1.5 ps-2.5 pe-2.5 text-sm",
      },
      removable: {
        true: "pe-1",
        false: "",
      },
    },
    defaultVariants: { size: "md", removable: false },
  },
);

export const tagRemoveVariants = cva(
  // `ms-0.5 -me-1`: nudged toward the chip's inline END, which is the LEFT in
  // Persian, automatically. The `ml-`/`mr-` spelling of this line is the single
  // most copied RTL defect in chip components.
  "relative -me-1 ms-0.5 inline-flex size-5 shrink-0 cursor-pointer " +
    "items-center justify-center rounded-sm text-fg-muted outline-none " +
    "transition-colors data-hovered:bg-surface-hover data-hovered:text-fg " +
    // The glyph is 20px, under the 44px touch floor. Inflating the chip would
    // make a row of filters unusable, so the HIT AREA grows via a transparent
    // pseudo-element: the target changes, the layout does not.
    "after:absolute after:-inset-2.5 after:content-['']",
);

export type TagItemVariantProps = VariantProps<typeof tagItemVariants>;

interface TagGroupBaseProps
  extends Omit<AriaTagGroupProps, "className" | "onRemove" | "aria-label"> {
  /**
   * Announced name of the collection, e.g. «فیلترهای فعال».
   *
   * REQUIRED. RAC puts it on the `role="grid"` element; without it the whole
   * list is announced as a bare "grid" with no indication of what it holds.
   */
  label: string;
  children?: LumoNode;
  className?: string | undefined;
}

interface RemovableTagGroupProps extends TagGroupBaseProps {
  /** Called with the keys to drop. RAC also fires this on Delete/Backspace. */
  onRemove: (keys: Set<Key>) => void;
  /**
   * Builds the announced name of each tag's remove control from that tag's own
   * `textValue`, e.g. ``(tag) => `حذف ${tag}` `` → «حذف تهران».
   *
   * REQUIRED whenever the group is removable. See the file header — this prop is
   * what the union exists to force, and the function form is load-bearing rather
   * than decorative.
   */
  removeLabel: (tagLabel: string) => string;
}

interface StaticTagGroupProps extends TagGroupBaseProps {
  onRemove?: undefined;
  removeLabel?: undefined;
}

export type TagGroupProps = RemovableTagGroupProps | StaticTagGroupProps;

export function TagGroup(props: TagGroupProps) {
  const { label, className, children, onRemove, removeLabel, ...rest } = props;
  return (
    <RemoveLabelContext.Provider value={removeLabel ?? null}>
      <AriaTagGroup
        {...rest}
        aria-label={label}
        {...(onRemove !== undefined ? { onRemove } : {})}
        className={cn(tagGroupVariants(), className)}
      >
        {children}
      </AriaTagGroup>
    </RemoveLabelContext.Provider>
  );
}

export interface TagListProps<T extends object>
  extends Omit<AriaTagListProps<T>, "children" | "className"> {
  children?: LumoNode | ((item: T) => LumoNode);
  className?: string | undefined;
}

export function TagList<T extends object>({ className, ...props }: TagListProps<T>) {
  // `data-lumo` because the list is the roving-tabindex container and takes
  // focus itself when empty — RAC gives it `tabIndex={0}`.
  return (
    <AriaTagList
      data-lumo=""
      className={cn(tagListVariants(), className)}
      {...props}
    />
  );
}

export interface TagItemProps
  extends Omit<AriaTagProps, "children" | "className" | "textValue">,
    Omit<TagItemVariantProps, "removable"> {
  /**
   * The tag's text, as a plain string.
   *
   * REQUIRED, where RAC makes it optional. RAC derives it from a literal string
   * child and falls back to `''` otherwise — an unnamed row plus a broken
   * typeahead, silently, the moment a child is anything but bare text. It is
   * also the argument handed to the group's `removeLabel`, so the announced name
   * of the remove control depends on it existing.
   */
  textValue: string;
  children?: LumoNode;
  className?: string | undefined;
}

export function TagItem({ textValue, children, size, className, ...props }: TagItemProps) {
  const removeLabel = useContext(RemoveLabelContext);
  // The id of the hidden name element. See the file header: pointing
  // `aria-labelledby` at it is what stops RAC appending the tag's own text to
  // the phrase the consumer authored.
  const nameId = useId();

  return (
    <AriaTag
      {...props}
      data-lumo=""
      textValue={textValue}
      className={({ allowsRemoving }) =>
        cn(tagItemVariants({ size, removable: allowsRemoving }), className)
      }
    >
      {({ allowsRemoving }) => (
        <>
          <span className="truncate">{children ?? textValue}</span>
          {allowsRemoving && removeLabel !== null ? (
            <AriaButton
              slot="remove"
              data-lumo=""
              // Both overrides are needed and they do different jobs:
              // `aria-label` keeps RAC's "Remove" out of the served bytes, which
              // is what the HTML gate reads; `aria-labelledby` displaces the
              // `"{buttonId} {rowId}"` pair so the computed name is this phrase
              // and nothing else.
              aria-label={removeLabel(textValue)}
              aria-labelledby={nameId}
              className={cn(tagRemoveVariants())}
            >
              <span id={nameId} className="sr-only">
                {removeLabel(textValue)}
              </span>
              {/*
               * An ✕ drawn inline: no icon dependency for a copied file, and
               * the glyph is diagonally symmetric so it is identical under
               * mirroring. A chevron here would need `rtl:-scale-x-100`.
               */}
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                className="size-3"
              >
                <path d="M4 4 12 12M12 4 4 12" />
              </svg>
            </AriaButton>
          ) : null}
        </>
      )}
    </AriaTag>
  );
}
