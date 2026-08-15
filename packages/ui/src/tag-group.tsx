"use client";

import { Children, createContext, Fragment, isValidElement, useContext } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";
import { cn, type Key, type LumoNode } from "@lumo-ui/core";
import { useCompositeTabStop } from "@lumo-ui/base-ui-ssr";

/**
 * A keyboard-navigable list of filters, keywords or selected values. BASE UI
 * ENGINE (`Toolbar`) for the removable form; the static form has no engine and
 * renders a plain `<ul>`. Distinct from `tag.tsx`, a single static chip.
 *
 *     <TagGroup label="فیلترهای فعال" onRemove={(keys) => drop(keys)}
 *               removeLabel={(tag) => `حذف ${tag}`}>
 *       <TagList>
 *         <TagItem id="thr" textValue="تهران">تهران</TagItem>
 *       </TagList>
 *     </TagGroup>
 *
 * The React Aria dangling-idref pin is retired (no `useTag`, no `useSlotId`).
 * The removable form is a toolbar of remove BUTTONS, so arrowing announces
 * «حذف تهران»; a static list is a LIST, so the count is announced for free.
 * Gone, and removed from the type: selection (compose `ListBox` instead) and
 * Delete/Backspace on a focused row. Direction is NOT free: `CompositeRoot`
 * reads `useDirection()`, `'ltr'` unless the app mounts `<DirectionProvider>`.
 * `removeLabel` stays a required FUNCTION: an ✕ has no text, and Persian word
 * order is not English with the words swapped; the union makes
 * `onRemove`/`removeLabel` one decision. `"use client"` because `onRemove` is a
 * function prop and for the toolbar's behaviour. Long form: `docs/decisions/log.md`.
 */

/**
 * Carries the group's `removeLabel` to each tag. Default `null` cannot reach a
 * removable tag, because `removeLabel` and `onRemove` are one type-level decision.
 */
interface TagGroupContextValue {
  removeLabel: (tagLabel: string) => string;
  onRemove: (keys: Set<Key>) => void;
  /**
   * The key of the chip that holds the tab stop until hydration (see
   * `useCompositeTabStop`): a served Base UI composite has no `tabindex="0"`.
   * `TagList` picks the first chip because the chip cannot know it is first.
   */
  firstKey: Key | undefined;
}

const TagGroupContext = createContext<TagGroupContextValue | null>(null);

export const tagGroupVariants = cva("flex flex-col gap-2");

export const tagListVariants = cva(
  "flex flex-wrap items-center gap-2 outline-none " +
    // `:empty` replaces RAC's `data-empty`; keeps the row from collapsing when
    // the last filter is dropped.
    "empty:min-h-8",
);

export const tagItemVariants = cva(
  "inline-flex w-fit max-w-full cursor-default select-none items-center " +
    "rounded-md border border-border bg-surface-sunken align-middle " +
    "whitespace-nowrap text-fg outline-none transition-colors " +
    // `data-hovered` → CSS `:hover`; nothing tracks a pointer here any more.
    "hover:bg-surface-hover " +
    // The `data-selected:` rules are DELETED: Base UI's Toolbar has no selection model.
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      /** The tag-size step. */
      size: {
        // `ps-`/`pe-` rather than `px-`: the inline-END cap is trimmed when a
        // remove button is present.
        sm: "h-6 gap-1 ps-2 pe-2 text-xs",
        md: "h-7 gap-1.5 ps-2.5 pe-2.5 text-sm",
      },
      /** Reserves the inline-end space the remove control occupies. */
      removable: {
        true: "pe-1",
        false: "",
      },
    },
    defaultVariants: { size: "md", removable: false },
  },
);

export const tagRemoveVariants = cva(
  // `ms-0.5 -me-1`: nudged toward the chip's inline END, LEFT in Persian.
  "relative -me-1 ms-0.5 inline-flex size-5 shrink-0 cursor-pointer " +
    "items-center justify-center rounded-sm text-fg-muted outline-none " +
    "transition-colors hover:bg-surface-hover hover:text-fg " +
    // The press: the chip is removed, so no element is left to carry a state.
    "active:translate-y-px " +
    // No ring class: this IS the focusable element and carries `data-lumo`. The
    // glyph is 20px, under the 44px touch floor, so the HIT AREA grows via a
    // transparent pseudo-element: the target changes, the layout does not.
    "after:absolute after:-inset-2.5 after:content-['']",
);

export type TagItemVariantProps = VariantProps<typeof tagItemVariants>;

interface TagGroupBaseProps {
  /**
   * Announced name of the collection, e.g. «فیلترهای فعال». REQUIRED — names
   * the toolbar when removable and the `<ul>` when not.
   */
  label: string;
  children?: LumoNode;
  className?: string | undefined;
}

interface RemovableTagGroupProps extends TagGroupBaseProps {
  /** Called with the keys to drop. No longer fired on Delete/Backspace — rows are not tab stops. */
  onRemove: (keys: Set<Key>) => void;
  /**
   * Builds the announced name of each tag's remove control from that tag's own
   * `textValue`, e.g. ``(tag) => `حذف ${tag}` `` → «حذف تهران». REQUIRED
   * whenever the group is removable.
   */
  removeLabel: (tagLabel: string) => string;
}

interface StaticTagGroupProps extends TagGroupBaseProps {
  onRemove?: undefined;
  removeLabel?: undefined;
}

export type TagGroupProps = RemovableTagGroupProps | StaticTagGroupProps;

/**
 * A keyboard-navigable group of tags: filters, keywords, or selected values, removable when told how.
 * A `role="toolbar"` when there is something to operate; otherwise `TagList`'s `<ul>`.
 */
export function TagGroup(props: TagGroupProps) {
  const { label, className, children, onRemove, removeLabel } = props;

  if (onRemove === undefined || removeLabel === undefined) {
    return (
      <div data-lumo="" className={cn(tagGroupVariants(), className)}>
        <TagGroupLabelContext.Provider value={label}>{children}</TagGroupLabelContext.Provider>
      </div>
    );
  }

  return (
    <TagGroupContext.Provider value={{ removeLabel, onRemove, firstKey: undefined }}>
      <BaseToolbar.Root
        data-lumo=""
        aria-label={label}
        className={cn(tagGroupVariants(), className)}
      >
        <TagGroupLabelContext.Provider value={undefined}>{children}</TagGroupLabelContext.Provider>
      </BaseToolbar.Root>
    </TagGroupContext.Provider>
  );
}

/**
 * The name for the STATIC form's `<ul>`. `undefined` inside a toolbar, which
 * already carries the name.
 */
const TagGroupLabelContext = createContext<string | undefined>(undefined);

export interface TagListProps {
  children?: LumoNode;
  className?: string | undefined;
}

function firstTagKey(children: LumoNode): Key | undefined {
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue;
    const props = child.props as { id?: Key; children?: LumoNode };
    if (child.type === Fragment) {
      const nested = firstTagKey(props.children);
      if (nested !== undefined) return nested;
    } else if (props.id !== undefined) {
      return props.id;
    }
  }
  return undefined;
}

export function TagList({ className, children }: TagListProps) {
  const listLabel = useContext(TagGroupLabelContext);
  const group = useContext(TagGroupContext);

  // A real `<ul>` in the static form: the count is announced for free.
  if (listLabel !== undefined) {
    return (
      <ul aria-label={listLabel} className={cn(tagListVariants(), className)}>
        {children}
      </ul>
    );
  }

  // Inside a toolbar, a plain flex box keeps the composite's children where it
  // expects them. Descend through Fragments: React.Children flattens only arrays.
  const firstKey = firstTagKey(children);
  return (
    <TagGroupContext.Provider
      value={group === null ? null : { ...group, firstKey }}
    >
      <div className={cn(tagListVariants(), className)}>{children}</div>
    </TagGroupContext.Provider>
  );
}

export interface TagItemProps extends Omit<TagItemVariantProps, "removable"> {
  /** The tag's key, handed back to `onRemove`. */
  id: Key;
  /**
   * The tag's text, as a plain string. REQUIRED — nothing derives it, so it
   * cannot be empty by accident. Also the argument handed to `removeLabel`.
   */
  textValue: string;
  children?: LumoNode;
  className?: string | undefined;
}

export function TagItem({ id, textValue, children, size, className }: TagItemProps) {
  const group = useContext(TagGroupContext);
  const isStatic = useContext(TagGroupLabelContext) !== undefined;
  // One tab stop in the served HTML, handed back to Base UI on hydration. A
  // CONSTANT `tabIndex={0}` would leave two stops forever.
  const tabStop = useCompositeTabStop(group !== null && group.firstKey === id);

  const chip = (
    <>
      <span className="truncate">{children ?? textValue}</span>
      {group === null ? null : (
        <BaseToolbar.Button
          data-lumo=""
          // ONE naming attribute, and only one.
          aria-label={group.removeLabel(textValue)}
          {...tabStop}
          onClick={() => {
            group.onRemove(new Set([id]));
          }}
          className={cn(tagRemoveVariants())}
        >
          {/* An ✕ drawn inline: no icon dependency, and symmetric under mirroring. */}
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
        </BaseToolbar.Button>
      )}
    </>
  );

  const classes = cn(tagItemVariants({ size, removable: group !== null }), className);

  return isStatic ? (
    <li data-lumo="" className={classes}>
      {chip}
    </li>
  ) : (
    <span data-lumo="" className={classes}>
      {chip}
    </span>
  );
}
