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
 * ── SELECTION IS `onSelect` FOR ACTIONS, `href` FOR NAVIGATION ───────────────
 *
 * `CommandPaletteItem.href` renders through `CommandItem`'s own `href`, so a
 * navigable entry is a real link — RAC's Menu already knows how to activate it
 * with Enter, with a click, and (per menu.tsx) with the keyboard model that
 * resolves correctly under `dir="rtl"`. An item with no `href` instead fires
 * `onSelect` with its id, wired ONCE at the list level via `onAction` rather
 * than once per item, so a consumer building the list from an array never has
 * to remember to close over a per-item handler.
 *
 * ── THE EMPTY STATE IS `renderEmptyState`, NOT A STATIC CHILD ───────────────
 *
 * `CommandEmpty` is plain, unstyled-logic markup — see `command.tsx`, it holds
 * no visibility rule of its own. Placed as an ordinary child of `CommandList`
 * it would render unconditionally, present alongside real results instead of
 * replacing them. `renderEmptyState` is the render prop RAC's own collection
 * components use to swap in content precisely when the (filtered) collection
 * resolves to zero items, which is the only place "no commands match" belongs.
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
  /** Visible AND typeahead/filter text. Passed straight through as `textValue`,
   * so a rich rendering below never loses the plain string the filter needs
   * — see `command.tsx`'s note on the `textValue` derivation trap. */
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
      <Command>
        <CommandInput label={strings.inputLabel} placeholder={strings.inputPlaceholder} />
        <CommandList
          onAction={(key) => onSelect?.(String(key))}
          renderEmptyState={() => <CommandEmpty>{strings.emptyMessage}</CommandEmpty>}
        >
          {groups.map((group) => (
            <CommandGroup key={group.id} heading={group.heading}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.id}
                  id={item.id}
                  textValue={item.label}
                  {...optional("href", item.href)}
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
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
