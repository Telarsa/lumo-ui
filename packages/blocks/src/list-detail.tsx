"use client";

import { cn, type LumoNode } from "@lumo-ui/core";
import { Badge, Button, EmptyState, Separator } from "@lumo-ui/ui";

/**
 * The two-pane pattern: a list on the reading edge, the selected record beside it.
 *
 * `"use client"`: `onSelect` is a callback.
 *
 * The list is first in READING order and its divider is `border-e`, so the seam
 * always falls between the panes. Rows are `Button`s carrying `aria-current`
 * rather than a listbox — `ListBox` now ships in `@lumo-ui/ui`, so this block
 * can move onto it (regaining typeahead) in its own commit.
 */
export interface ListDetailItem {
  /** Stable key, sent back through `onSelect`. Not rendered. */
  id: string;
  /** The row's primary line. */
  title: string;
  /** A second, dimmer line under it. */
  description?: string | undefined;
  /** A trailing marker — a status, a count ALREADY FORMATTED by the caller. `string`, never `number`. */
  badge?: string | undefined;
}

export interface ListDetailStrings {
  /** Announced name of the list pane, e.g. «پرونده‌ها». */
  listLabel: string;
  /** Announced name of the detail pane, e.g. «جزئیات پرونده». */
  detailLabel: string;
  /** Announced suffix on the selected row, e.g. «انتخاب‌شده». */
  selectedLabel: string;
  /** Shown in the detail pane when nothing is selected. */
  emptyTitle: string;
  emptyDescription?: string | undefined;
  /** Shown in the list pane when there are no records at all. */
  listEmptyTitle: string;
}

export interface ListDetailProps {
  strings: ListDetailStrings;
  items: readonly ListDetailItem[];
  /** `ListDetailItem.id` of the open record. */
  selectedId?: string | undefined;
  onSelect?: ((id: string) => void) | undefined;
  /** The detail pane. Rendered only when `selectedId` names a record; otherwise the empty state takes its place. */
  children?: LumoNode;
  /** Shown above the list — a search field, a filter bar. */
  listHeader?: LumoNode;
  className?: string | undefined;
}

export function ListDetail({
  strings,
  items,
  selectedId,
  onSelect,
  children,
  listHeader,
  className,
}: ListDetailProps) {
  const hasSelection = selectedId !== undefined && items.some((item) => item.id === selectedId);

  return (
    // Below md the two panes stack on the BLOCK axis, which is direction-invariant.
    <div className={cn("flex w-full flex-col md:flex-row", className)}>
      <section
        aria-label={strings.listLabel}
        className="flex w-full shrink-0 flex-col border-be border-border md:w-80 md:border-be-0 md:border-e"
      >
        {listHeader !== undefined ? (
          <>
            <div className="p-3">{listHeader}</div>
            <Separator />
          </>
        ) : null}

        {items.length === 0 ? (
          <EmptyState size="sm" title={strings.listEmptyTitle} />
        ) : (
          <ul className="flex list-none flex-col p-0">
            {items.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <li key={item.id}>
                  <Button
                    variant="ghost"
                    // `aria-current`, not `aria-selected`: outside a listbox the
                    // latter is invalid ARIA that some screen readers drop.
                    {...(isSelected ? ({ "aria-current": "page" } as const) : {})}
                    className={cn(
                      // `h-auto` unsets Button's fixed height (a row is two lines of
                      // Persian); `text-start`, never `text-left`.
                      "h-auto w-full items-start justify-between gap-2 rounded-none px-3 py-2.5 text-start whitespace-normal",
                      isSelected ? "bg-surface-sunken" : "",
                    )}
                    onPress={() => onSelect?.(item.id)}
                  >
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-sm font-medium text-fg">
                        {item.title}
                      </span>
                      {item.description !== undefined ? (
                        <span className="truncate text-xs text-fg-muted">
                          {item.description}
                        </span>
                      ) : null}
                      {/*
                       * The state as a WORD as well as an attribute — the tint is the
                       * only other signal, and the sr-only string costs nothing.
                       */}
                      {isSelected ? (
                        <span className="sr-only">{strings.selectedLabel}</span>
                      ) : null}
                    </span>
                    {item.badge !== undefined ? (
                      <Badge tone="neutral" variant="subtle">
                        {item.badge}
                      </Badge>
                    ) : null}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-label={strings.detailLabel} className="min-w-0 flex-1">
        {hasSelection ? (
          children
        ) : (
          <EmptyState
            title={strings.emptyTitle}
            {...(strings.emptyDescription === undefined
              ? {}
              : { description: strings.emptyDescription })}
          />
        )}
      </section>
    </div>
  );
}
