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
 * The primitives are unopinionated about DATA; this block takes `groups` as
 * plain data and assembles the composition once. On Base UI the commands are
 * an `items` array (a JSX-only palette is silently never filtered), `onSelect`
 * is wired per item via `CommandItem.onAction`, and the empty state is a
 * `role="status"` SIBLING of the list. Icons are a caller slot, not an import.
 *
 * `"use client"`: the whole point of this block is interaction.
 */
export interface CommandPaletteItem {
  /** Stable key, sent back through `onSelect` when there is no `href`. */
  id: string;
  /** Visible AND filter text: the `label` member Base UI matches on, so the filter and the row can never detach. */
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
  /** Overrides the default trigger entirely. A slot, exactly as `CommandDialog.trigger` is. */
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
         * `CommandList` requires a name; the dialog's title is the honest value
         * — the results ARE the palette.
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
                  // Only a non-`href` row is an action; wiring both would fire
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
