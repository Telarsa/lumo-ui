"use client";

import type { LumoNode } from "@lumo-ui/core";
import {
  Button,
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
  Kbd,
  optional,
} from "@lumo-ui/ui";

/**
 * A trigger plus the assembled dialog: search box, grouped actions, an empty
 * state and an optional keyboard-shortcut hint — the whole screen-level widget
 * around `@lumo-ui/ui`'s `Command`/`CommandDialog` primitives.
 *
 * Those primitives are deliberately unopinionated about DATA — a consumer
 * composes `<CommandGroup><CommandItem>` by hand, because a command palette in
 * one product is a flat action list and in another is five grouped sections
 * with icons and shortcuts, and the primitive should not guess which. This
 * block is the other end of that trade: it takes `groups` as plain data and
 * assembles the composition once, for the common case where a project just
 * wants "here are my commands, render them".
 *
 * ── PORTED TO THE BASE UI `Command`, AND THE BLOCK'S OWN API DID NOT MOVE ───
 *
 * Three things changed underneath and none of them reaches this block's
 * consumer, which is the whole argument for a block having its own props:
 *
 *  1. **The commands are DATA now.** `Command` takes `items` on the root because
 *     Base UI filters an array, not a JSX collection — a JSX-only palette
 *     renders and is silently never filtered (`command.tsx`'s header). This
 *     block already took `groups` as data, so it feeds them straight in and
 *     renders through the render-prop children. A palette assembled from JSX by
 *     hand had to be rewritten; this one had the array all along.
 *  2. **`onSelect` is wired per item, not once on the list.** Base UI's
 *     `Autocomplete` models no selection, so there is no list-level activation
 *     callback to subscribe to — `CommandItem.onAction` is the seam, and it
 *     fires for a pointer press and for Enter alike. This block still closes
 *     over the row it is already mapping, so `CommandPaletteProps.onSelect`
 *     keeps its exact shape.
 *  3. **The empty state is a SIBLING of the list.** `renderEmptyState` is gone
 *     with RAC's collections, and what replaces it is better: `CommandEmpty`
 *     renders Base UI's `Autocomplete.Empty`, which is `role="status"
 *     aria-live="polite"` and mounts only when the filter emptied the list. "No
 *     commands match" is now ANNOUNCED, where the RAC version was drawn and
 *     never spoken.
 *
 * `label` is no longer duplicated into a `textValue`: the filter matches the
 * items ARRAY before any JSX exists, so a row whose children are an icon plus a
 * `<Kbd>` — the commonest shape in this file — can no longer lose its search
 * string. That trap is structurally gone rather than worked around.
 *
 * ── ICONS ARE A CALLER SLOT, NOT AN IMPORT ───────────────────────────────────
 *
 * `@lumo-ui/blocks` carries no icon library dependency — see `app-shell.tsx`'s
 * `AppShellNavItem.icon` and `feature-grid.tsx`'s `Feature.icon` for the same
 * pattern. `CommandPaletteItem.icon` is a `LumoNode` the caller already has an
 * icon component for; this block never imports one of its own.
 *
 * `"use client"`: the whole point of this block is interaction.
 */
export interface CommandPaletteItem {
  /** Stable key, sent back through `onSelect` when there is no `href`. */
  id: string;
  /**
   * Visible AND filter text. It is the `label` member of the item object handed
   * to `Command`'s `items`, which is the shape Base UI matches on by default —
   * so the string the filter sees and the string the row draws are the same
   * value, and a rich rendering can no longer detach them.
   */
  label: string;
  /** A leading glyph. Rendered `aria-hidden` — the label already names it. */
  icon?: LumoNode;
  /** A trailing chord, e.g. `["⌘", "K"]`. Rendered through `Kbd`. */
  shortcut?: readonly string[] | undefined;
  /** Navigates instead of firing `onSelect`. See the file header. */
  href?: string | undefined;
}

export interface CommandPaletteGroup {
  /** Stable key. Not rendered. */
  id: string;
  /** The group's visible heading, e.g. «اقدامات». */
  heading: string;
  items: readonly CommandPaletteItem[];
}

export interface CommandPaletteStrings {
  /** The dialog's accessible name. `sr-only` — see `command.tsx`. */
  title: string;
  /** The dialog's accessible description. `sr-only`. */
  description: string;
  /** Announced name of the dialog's ✕. */
  closeLabel: string;
  /** Announced name of the search field. */
  inputLabel: string;
  inputPlaceholder?: string | undefined;
  /** Shown when no item matches the current query. */
  emptyMessage: string;
  /** Visible text of the DEFAULT trigger button. Ignored when `trigger` is set. */
  triggerLabel: string;
}

export interface CommandPaletteProps {
  strings: CommandPaletteStrings;
  groups: readonly CommandPaletteGroup[];
  /**
   * Overrides the default trigger entirely. A slot, exactly as
   * `CommandDialog.trigger` already is — see `command.tsx`.
   */
  trigger?: LumoNode;
  /** A chord shown on the DEFAULT trigger, e.g. `["⌘", "K"]`. Omit for none. */
  triggerShortcut?: readonly string[] | undefined;
  isOpen?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((isOpen: boolean) => void) | undefined;
  /** Fired with an item's id when that item has no `href`. */
  onSelect?: ((id: string) => void) | undefined;
  className?: string | undefined;
}

export function CommandPalette({
  strings,
  groups,
  trigger,
  triggerShortcut,
  isOpen,
  defaultOpen,
  onOpenChange,
  onSelect,
  className,
}: CommandPaletteProps) {
  return (
    <CommandDialog
      title={strings.title}
      description={strings.description}
      closeLabel={strings.closeLabel}
      trigger={
        trigger ?? (
          <Button
            variant="outline"
            className="w-full max-w-sm justify-between gap-3 text-fg-muted"
          >
            <span className="truncate">{strings.triggerLabel}</span>
            {triggerShortcut !== undefined ? <Kbd keys={triggerShortcut} size="sm" /> : null}
          </Button>
        )
      }
      isOpen={isOpen}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      className={className}
    >
      <Command<CommandPaletteGroup> items={groups}>
        <CommandInput label={strings.inputLabel} placeholder={strings.inputPlaceholder} />
        {/*
         * The list's own name. `CommandList` requires one now — it was RAC's
         * optional `aria-label` before — and the dialog's title is the honest
         * value: the results ARE the palette, and inventing a second sentence
         * for the block's `strings` would ask every consumer to write a string
         * no reader benefits from hearing twice.
         */}
        <CommandList<CommandPaletteGroup> label={strings.title}>
          {(group: CommandPaletteGroup) => (
            <CommandGroup<CommandPaletteItem>
              key={group.id}
              heading={group.heading}
              items={group.items}
            >
              {(item: CommandPaletteItem) => (
                <CommandItem
                  key={item.id}
                  id={item.id}
                  {...optional("href", item.href)}
                  // Navigation activates the anchor; only a non-`href` row is an
                  // action, and only that row reports one. Wiring both would fire
                  // `onSelect` on every link press as well.
                  {...(item.href === undefined && onSelect !== undefined
                    ? { onAction: () => onSelect(item.id) }
                    : {})}
                >
                  {item.icon !== undefined ? (
                    <span aria-hidden="true" className="flex shrink-0 [&_svg]:size-4">
                      {item.icon}
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.shortcut !== undefined ? (
                    <CommandShortcut>
                      <Kbd keys={item.shortcut} size="sm" />
                    </CommandShortcut>
                  ) : null}
                </CommandItem>
              )}
            </CommandGroup>
          )}
        </CommandList>
        {/* A sibling, not a render prop — see the file header. */}
        <CommandEmpty>{strings.emptyMessage}</CommandEmpty>
      </Command>
    </CommandDialog>
  );
}
