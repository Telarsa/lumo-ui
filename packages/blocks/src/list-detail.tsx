"use client";

import { cn, type LumoNode } from "@lumo-ui/core";
import { Badge, Button, EmptyState, Separator } from "@lumo-ui/ui";

/**
 * The two-pane pattern: a list on the reading edge, the selected record beside it.
 *
 * `"use client"`: `onSelect` is a callback.
 *
 * ── THE LIST IS ON THE INLINE START, AND THE DIVIDER IS `border-e` ──────────
 *
 * `flex-row` lays the list out first in READING order — left in English, right
 * in Persian — and its divider is `border-inline-end`, so the rule always falls
 * between the two panes. `border-r` would draw it on the far edge of the list
 * in Persian, i.e. against the viewport, where it reads as a stray outline
 * rather than as a mirrored seam. That is the failure mode this library exists
 * to make impossible: it renders, and it is only wrong to the reader.
 *
 * ── A GAP IN `@lumo-ui/ui`, AND WHY THE ROWS ARE BUTTONS ────────────────────
 *
 * The correct control for "pick one record from a list" is a listbox — RAC
 * ships `ListBox`/`ListBoxItem`, but `@lumo-ui/ui` exports them only through
 * `Select` and `ComboBox`, both of which are popover-bound. Reimplementing one
 * here would break rule 4, so each row is a `Button` carrying
 * `aria-current="page"` instead.
 *
 * That is not a workaround for its own sake: `Button` genuinely accepts
 * `aria-current` (React Aria declares it on `AriaBaseButtonProps`), so the
 * selected row is announced as the current one rather than merely tinted. What
 * is lost is listbox typeahead and single-Tab-stop arrow navigation, which is
 * the cost of not having a standalone `ListBox` export. Reported as a gap.
 */
export interface ListDetailItem {
  /** Stable key, sent back through `onSelect`. Not rendered. */
  id: string;
  /** The row's primary line. */
  title: string;
  /** A second, dimmer line under it. */
  description?: string | undefined;
  /**
   * A trailing marker — a status, a count ALREADY FORMATTED by the caller.
   *
   * `string`, never `number`: a raw count here is the badge case that
   * badge.tsx names as the likeliest place in the library to render Latin
   * digits on a Persian page.
   */
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
  /**
   * The detail pane. Rendered only when `selectedId` names a record; otherwise
   * the empty state takes its place, so a caller cannot accidentally render a
   * stale record beside an empty selection.
   */
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
    // `md:flex-row`: below the medium breakpoint the two panes stack on the
    // BLOCK axis, which is direction-invariant and needs no second rule.
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
                    // `aria-current` rather than `aria-selected`: outside a
                    // listbox there is no selection semantic to attach to, and
                    // `aria-selected` on a bare button is invalid ARIA that
                    // some screen readers drop silently.
                    {...(isSelected ? ({ "aria-current": "page" } as const) : {})}
                    className={cn(
                      // `h-auto` unsets Button's fixed control height — a row
                      // is two lines of Persian, not a 40px control.
                      // `text-start` is `text-align: start`; `text-left` here
                      // would pin every row's text to the wrong edge.
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
                       * The state as a WORD as well as an attribute. Belt and
                       * braces on purpose: `aria-current` is announced by every
                       * modern screen reader, but the tinted background is the
                       * only signal a sighted reader with low colour vision
                       * gets, and the sr-only string costs nothing.
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
