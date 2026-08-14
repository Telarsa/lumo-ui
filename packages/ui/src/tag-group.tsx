"use client";

import { Children, createContext, Fragment, isValidElement, useContext } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";
import { cn, type Key, type LumoNode } from "@lumo-ui/core";
import { useCompositeTabStop } from "@lumo-ui/base-ui-ssr";

/**
 * A keyboard-navigable list of filters, keywords or selected values.
 * **BASE UI ENGINE — for the removable form. See below; the static form has no
 * engine at all, and that is the correct answer rather than a gap.**
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
 * Distinct from `tag.tsx`, which is a single static chip.
 *
 * ═══ THE PINNED DEFECT IS RETIRED. THAT IS THE HEADLINE. ════════════════════
 *
 * This file's previous header carried a PIN: a React Aria defect described as
 * "verified unreachable", which failed `@lumo-ui/gate`'s `resolved-idrefs` on
 * any prerendered Persian route and was the stated reason the showcase site had
 * no tag-group demo. From `react-aria/private/gridlist/useGridListItem.mjs`,
 * which `useTag` built on:
 *
 *     let descriptionId = useSlotId();
 *     'aria-labelledby': descriptionId && (…) ? `${getRowId(…)} ${descriptionId}` : undefined
 *
 * `useSlotId` only CLEARS an unclaimed id inside a layout effect, which never
 * runs during `renderToStaticMarkup`, and `useTag` then threw the matching props
 * away (`let {descriptionProps: _, ...rest} = states`) so no composition could
 * claim it. The served row carried a second idref pointing at nothing.
 *
 * **It is gone, and it needed no workaround to remove.** There is no `useTag`,
 * no `useSlotId` and no gridlist here any more, so there is no unclaimed id.
 * `tag-group.test.tsx` asserts zero dangling idrefs in the SERVER render — the
 * tier the pin was about — and the pin is deleted rather than re-worded.
 *
 * **Consequence, stated so the ledger can be closed:** the showcase site can
 * carry a tag-group demo again. Nothing in this file blocks it.
 *
 * ═══ WHAT BASE UI HAS, AND WHAT IT COST ═════════════════════════════════════
 *
 * Base UI ships no tag group, no chip and no gridlist. What it does ship is
 * `Toolbar` — a `CompositeRoot` with `role="toolbar"`, roving tabindex, arrow
 * keys and Home/End — which is the whole keyboard model a row of removable
 * chips needs. Measured, bare library:
 *
 *     <div role="toolbar" aria-orientation="horizontal" aria-label="…">
 *       <button data-focusable tabindex="-1">…
 *
 * So the removable form is a toolbar of remove controls, and the arrowing
 * announcement is good BECAUSE `removeLabel` was already a function of the tag's
 * own text: a reader arrowing the group hears «حذف تهران»، «حذف اصفهان», which
 * names both the tag and the action. The prop that existed to avoid eight
 * identical "remove" buttons is what makes this composition readable.
 *
 * The STATIC form has no toolbar, and that is deliberate rather than a shortfall:
 * a `role="toolbar"` with nothing focusable in it is an empty control. A list of
 * chips nobody can act on is a LIST, so it renders `<ul>`/`<li>` and the count
 * arrives in the accessibility tree for free — "list, 3 items", announced in the
 * reader's own language by the screen reader rather than by a string this
 * library would otherwise have to require and format. `file-upload.tsx` chooses
 * `<ul>` for the same reason.
 *
 * ═══ TWO CAPABILITIES ARE GONE. BOTH ARE REAL. ══════════════════════════════
 *
 * **1. Selection.** React Aria's `TagGroup` took `selectionMode`,
 * `selectedKeys` and `onSelectionChange`, and published `data-selected` onto
 * each row — the class rules for it were in `tagItemVariants` below. Base UI's
 * `Toolbar` has no selection model of any kind. Rebuilding one means a roving
 * grid with `aria-selected`, which is the state machine this migration is
 * supposed to be renting rather than writing. The props are REMOVED rather than
 * accepted and ignored, so a consumer using them gets a compile error naming the
 * thing that no longer exists. If a selectable chip row is needed, compose
 * `ListBox` — it is a listbox with `aria-selected` and it is what that widget is.
 *
 * **2. Delete/Backspace on a focused tag.** RAC made each ROW a tab stop and
 * bound Delete to `onRemove`. Here the focusable element is the remove BUTTON,
 * so removal is Enter or Space on a control that says what it does. That is a
 * fair trade for a filter row and it is a loss for a power user who had learned
 * the Delete key. Recorded, not smoothed over.
 *
 * ── DIRECTION IS NO LONGER FREE (same gap tabs.tsx records) ────────────────
 *
 * `CompositeRoot` reads `useDirection()`, which returns `'ltr'` unless the
 * application mounts `<DirectionProvider direction="rtl">` — `LumoProvider` does
 * not. React Aria resolved arrow direction from the document. So on a Persian
 * page ArrowLeft moves BACKWARD through the chips rather than forward, silently.
 *
 * ═══ `removeLabel` IS STILL A FUNCTION, FOR A DIFFERENT REASON NOW ══════════
 *
 * Under React Aria this prop existed to defeat a double-naming defect. `useTag`
 * supplied the remove control's name twice — an English `aria-label="Remove"`
 * from its bundle AND an `aria-labelledby="{buttonId} {rowId}"` that appended
 * the tag's own text — so a complete Persian phrase came out as «حذف تهران
 * تهران», and overriding only one of the two left the other in the served bytes
 * for the gate to read.
 *
 * None of that machinery exists here. The button is Lumo's own and its
 * `aria-label` is simply its name. **The prop stays required anyway, and the
 * argument for it is the plain one:** an ✕ has no text, and «حذف» alone
 * announces eight identical buttons on a page with eight filters. Persian word
 * order is not English word order with the words swapped — «حذف تهران»،
 * «تهران را حذف کن» and «برداشتن فیلتر تهران» are all correct in different
 * contexts and only the first happens to match English. A `(tagLabel: string) =>
 * string` hands the consumer the noun and asks for the sentence.
 *
 * The union below makes the pairing structural: `onRemove` without `removeLabel`
 * is a type error, and `removeLabel` without `onRemove` is unrepresentable.
 *
 * `"use client"` because `onRemove` is a function prop — a function cannot cross
 * the server/client boundary — and independently for the toolbar's behaviour.
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
interface TagGroupContextValue {
  removeLabel: (tagLabel: string) => string;
  onRemove: (keys: Set<Key>) => void;
  /**
   * The key of the chip that holds the tab stop until hydration.
   *
   * See `useCompositeTabStop` in `@lumo-ui/base-ui-ssr`: a server-rendered Base
   * UI composite serves `tabindex="-1"` on every item and `tabindex="0"` on
   * none, so the Tab key cannot reach this toolbar at all before JavaScript
   * loads. `TagList` picks the first chip and publishes its key here, because
   * the chip cannot know whether it is first and the group cannot see through
   * `TagList` to find out.
   */
  firstKey: Key | undefined;
}

const TagGroupContext = createContext<TagGroupContextValue | null>(null);

export const tagGroupVariants = cva("flex flex-col gap-2");

export const tagListVariants = cva(
  "flex flex-wrap items-center gap-2 outline-none " +
    // Was `data-empty:min-h-8`, keyed to an attribute React Aria published on
    // its TagList. Nothing publishes it now, so the rule is expressed against
    // the DOM instead: `:empty` is the platform's own version of the same idea
    // and it needs no library at all. Keeps the row from collapsing to zero
    // height and jumping the layout when the last filter is dropped.
    "empty:min-h-8",
);

export const tagItemVariants = cva(
  "inline-flex w-fit max-w-full cursor-default select-none items-center " +
    "rounded-md border border-border bg-surface-sunken align-middle " +
    "whitespace-nowrap text-fg outline-none transition-colors " +
    // `data-hovered` → CSS `:hover`. Not a Base UI rename — nothing tracks a
    // pointer here any more, so this is the platform doing a library's job.
    "hover:bg-surface-hover " +
    // The three `data-selected:` rules that were here are DELETED, not renamed.
    // Base UI's Toolbar has no selection model, so the attribute can never
    // appear on any engine — see the file header. A renamed rule would have
    // reviewed as working and styled nothing, which is the failure mode this
    // repository's ledger is full of.
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      /** The tag-size step. */
      size: {
        // `ps-`/`pe-` rather than `px-`: the inline-END cap is trimmed when a
        // remove button is present, and only a logical pair can express "the
        // cap the button sits in" without knowing which side that is.
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
  // `ms-0.5 -me-1`: nudged toward the chip's inline END, which is the LEFT in
  // Persian, automatically. The `ml-`/`mr-` spelling of this line is the single
  // most copied RTL defect in chip components.
  "relative -me-1 ms-0.5 inline-flex size-5 shrink-0 cursor-pointer " +
    "items-center justify-center rounded-sm text-fg-muted outline-none " +
    "transition-colors hover:bg-surface-hover hover:text-fg " +
    // The press. Same reasoning as `tag.tsx`: the chip is removed, so there is
    // no element left to carry a state change.
    "active:translate-y-px " +
    // WCAG 2.4.7, and NO ring class. This IS the focusable element now — React
    // Aria's roving tabindex sat on the row and the ring had to be mirrored down
    // to it — and it carries `data-lumo`, so theme.css's one rule reaches it.
    // The two lines that re-typed `FOCUS_RING_SELF` here were dead for the layer
    // reason `segmented-control.tsx` records.
    // The glyph is 20px, under the 44px touch floor. Inflating the chip would
    // make a row of filters unusable, so the HIT AREA grows via a transparent
    // pseudo-element: the target changes, the layout does not.
    "after:absolute after:-inset-2.5 after:content-['']",
);

export type TagItemVariantProps = VariantProps<typeof tagItemVariants>;

interface TagGroupBaseProps {
  /**
   * Announced name of the collection, e.g. «فیلترهای فعال».
   *
   * REQUIRED. It names the `role="toolbar"` when the group is removable and the
   * `<ul>` when it is not; without it a reader lands in an unnamed collection
   * with no indication of what it holds.
   */
  label: string;
  children?: LumoNode;
  className?: string | undefined;
}

interface RemovableTagGroupProps extends TagGroupBaseProps {
  /**
   * Called with the keys to drop.
   *
   * BEHAVIOUR CHANGE: React Aria also fired this on Delete/Backspace over a
   * focused row. See the file header — the rows are not tab stops any more.
   */
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

/**
 * The group.
 *
 * Two different elements by shape, argued in the file header: a `role="toolbar"`
 * when there is something to operate, and nothing at all when there is not — the
 * static form's semantics live on `TagList`'s `<ul>`.
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
 * The name for the STATIC form's `<ul>`.
 *
 * `undefined` inside a toolbar, because the toolbar already carries the name and
 * a second `aria-label` on the list inside it would announce the group twice.
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

  // A real `<ul>` in the static form: the count reaches the accessibility tree
  // for free ("list, 3 items"), announced in the reader's own language by the
  // screen reader rather than by a string this library would have to require.
  if (listLabel !== undefined) {
    return (
      <ul aria-label={listLabel} className={cn(tagListVariants(), className)}>
        {children}
      </ul>
    );
  }

  // Inside a toolbar, `<ul>` would put a list between the toolbar and its
  // controls. A plain flex box keeps the composite's children where the
  // composite expects them.
  //
  // Descend through Fragments: React.Children flattens arrays, not Fragments.
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
   * The tag's text, as a plain string.
   *
   * REQUIRED, where React Aria made it optional and derived it from a literal
   * string child — falling back to `''` the moment a child was anything but bare
   * text, which produced an unnamed row silently. Nothing derives it now, so the
   * prop is the only source and it cannot be empty by accident. It is also the
   * argument handed to the group's `removeLabel`.
   */
  textValue: string;
  children?: LumoNode;
  className?: string | undefined;
}

export function TagItem({ id, textValue, children, size, className }: TagItemProps) {
  const group = useContext(TagGroupContext);
  const isStatic = useContext(TagGroupLabelContext) !== undefined;
  // One tab stop in the served HTML, handed back to Base UI's roving tabindex
  // the moment the tree hydrates. A CONSTANT `tabIndex={0}` here is measurably
  // wrong — it survives the first arrow press and leaves two stops forever. The
  // measurement and the mechanism are in the hook's own header.
  const tabStop = useCompositeTabStop(group !== null && group.firstKey === id);

  const chip = (
    <>
      <span className="truncate">{children ?? textValue}</span>
      {group === null ? null : (
        <BaseToolbar.Button
          data-lumo=""
          // ONE naming attribute, and only one. React Aria emitted an
          // `aria-label` AND an `aria-labelledby` here and the second won the
          // name computation while the first stayed in the bytes for the gate to
          // read. There is no second attribute to displace now.
          aria-label={group.removeLabel(textValue)}
          {...tabStop}
          onClick={() => {
            group.onRemove(new Set([id]));
          }}
          className={cn(tagRemoveVariants())}
        >
          {/*
           * An ✕ drawn inline: no icon dependency for a copied file, and the
           * glyph is diagonally symmetric so it is identical under mirroring. A
           * chevron here would need `rtl:-scale-x-100`.
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
