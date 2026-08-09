"use client";

import { cn, formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";
import {
  SearchField,
  Select,
  SelectItem,
  SelectPopover,
  SelectTrigger,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  ToolbarSeparator,
  optional,
} from "@lumo-ui/ui";

/**
 * The control strip above a table or a card grid: search, sort, view switch,
 * result count, and one primary action.
 *
 * `"use client"`: callbacks throughout.
 *
 * ── THE RESULT COUNT IS A FUNCTION OF A FORMATTED STRING ───────────────────
 *
 * `resultCount: (count: string) => string`, and the argument arrives already
 * run through `formatNumber`. Two separate rules meet here:
 *
 *  - Rule 0. `«۲۴ نتیجه»` needs Persian digits; `{items.length}` in JSX would
 *    render `24`, which is the calendar-cell defect wearing a different hat.
 *  - Rule 6. «۲۴ نتیجه» does not put its number where "24 results" does, so a
 *    `"{n} results"` template forces Persian into English clause order.
 *    `packages/core/src/strings.ts` types `numberField.decrease(label)` as a
 *    function for exactly this reason; this is the same shape.
 *
 * The block owns `formatNumber` and the caller owns the sentence. Neither can
 * do the other's job wrongly.
 *
 * ── WHY THE VIEW SWITCH LIVES IN A `Toolbar` ────────────────────────────────
 *
 * `Toolbar` collapses its contents into ONE Tab stop with arrow-key navigation
 * inside — and React Aria resolves those arrows against the document direction,
 * so ArrowLeft moves to the NEXT control under `dir="rtl"`. That is the exact
 * behaviour a hand-written `switch (e.key)` gets backwards, invisibly, in every
 * screenshot (toolbar.tsx has the argument). The search field is deliberately
 * OUTSIDE it: a text input inside a roving-tabindex group traps the arrow keys
 * a reader needs for caret movement.
 */
export interface SortOption {
  /** Stable key, sent back through `onSortChange`. Not rendered. */
  id: string;
  /** Visible option text, e.g. «تازه‌ترین». */
  label: string;
}

export interface DataToolbarStrings {
  /** Announced name of the toolbar. REQUIRED — see toolbar.tsx. */
  toolbarLabel: string;
  /** Announced and displayed name of the search field. */
  searchLabel: string;
  /** Announced name of the search field's ✕. REQUIRED — see search-field.tsx. */
  searchClearLabel: string;
  searchPlaceholder?: string | undefined;
  /** Announced name of the sort dropdown, e.g. «مرتب‌سازی». */
  sortLabel: string;
  /** Visible text when no sort is chosen. REQUIRED — see select.tsx. */
  sortPlaceholder: string;
  /** Announced name of the view switch, e.g. «نمایش». */
  viewLabel: string;
  /** The list-view toggle. */
  viewList: string;
  /** The grid-view toggle. */
  viewGrid: string;
  /**
   * The result count, as a function of the ALREADY-FORMATTED total.
   * See the file header for why this is a function and not a template.
   */
  resultCount: (count: string) => string;
}

export type DataToolbarView = "list" | "grid";

export interface DataToolbarProps {
  strings: DataToolbarStrings;
  /** Formats the result count. Required by design — see progress.tsx. */
  locale: Locale;
  /** How many records the current query matched. Never rendered raw. */
  total?: number | undefined;
  search?: string | undefined;
  sortOptions?: readonly SortOption[] | undefined;
  /** `SortOption.id` of the active sort. */
  sort?: string | undefined;
  view?: DataToolbarView | undefined;
  onSearchChange?: ((value: string) => void) | undefined;
  onSortChange?: ((sortId: string | null) => void) | undefined;
  onViewChange?: ((view: DataToolbarView) => void) | undefined;
  /** One primary action — a `<Button>`, a `<MenuTrigger>`. A slot, not a label. */
  action?: LumoNode;
  className?: string | undefined;
}

export function DataToolbar({
  strings,
  locale,
  total,
  search,
  sortOptions,
  sort,
  view,
  onSearchChange,
  onSortChange,
  onViewChange,
  action,
  className,
}: DataToolbarProps) {
  return (
    <div className={cn("flex w-full flex-col gap-3 px-4 py-3", className)}>
      <div className="flex flex-wrap items-end gap-2">
        <SearchField
          label={strings.searchLabel}
          clearLabel={strings.searchClearLabel}
          className="min-w-56 flex-1"
          {...optional("placeholder", strings.searchPlaceholder)}
          {...optional("value", search)}
          onChange={(value) => onSearchChange?.(value)}
        />

        {sortOptions !== undefined && sortOptions.length > 0 ? (
          <Select
            aria-label={strings.sortLabel}
            placeholder={strings.sortPlaceholder}
            className="w-48 shrink-0"
            selectedKey={sort ?? null}
            onSelectionChange={(key) => {
              onSortChange?.(key === null ? null : String(key));
            }}
          >
            <SelectTrigger />
            <SelectPopover>
              {sortOptions.map((option) => (
                <SelectItem key={option.id} id={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectPopover>
          </Select>
        ) : null}

        <Toolbar label={strings.toolbarLabel} className="shrink-0">
          <ToggleButtonGroup
            aria-label={strings.viewLabel}
            selectionMode="single"
            // `disallowEmptySelection`: a view switch with nothing selected
            // renders neither view. Unlike a filter, "off" is not a state here.
            disallowEmptySelection
            selectedKeys={view === undefined ? [] : [view]}
            onSelectionChange={(keys) => {
              // RAC hands back a `Set<Key>`; single-selection mode guarantees
              // at most one member. Iterating rather than indexing keeps
              // `noUncheckedIndexedAccess` honest — a Set has no index to be
              // wrong about.
              for (const key of keys) {
                if (key === "list" || key === "grid") onViewChange?.(key);
              }
            }}
          >
            <ToggleButton id="list" size="sm">
              {strings.viewList}
            </ToggleButton>
            <ToggleButton id="grid" size="sm">
              {strings.viewGrid}
            </ToggleButton>
          </ToggleButtonGroup>

          {action !== undefined ? <ToolbarSeparator /> : null}
          {action}
        </Toolbar>
      </div>

      {total !== undefined ? (
        /*
         * `role="status"` so a change in the count is announced after a filter
         * runs, politely — at the next pause rather than interrupting. The
         * count is a formatted STRING by the time it reaches JSX, which is what
         * gets it past `LumoNode` and past the gate's `no-latin-digits` rule.
         */
        <p role="status" className="text-sm text-fg-muted">
          {strings.resultCount(formatNumber(total, locale))}
        </p>
      ) : null}
    </div>
  );
}
