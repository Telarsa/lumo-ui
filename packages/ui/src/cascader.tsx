"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn, direction, type Locale } from "@lumo-ui/core";

import { Popover, PopoverTrigger } from "./popover.tsx";

export interface CascaderOption {
  value: string;
  label: string;
  disabled?: boolean;
  children?: readonly CascaderOption[];
}

export function resolveCascaderPath(
  options: readonly CascaderOption[],
  path: readonly string[],
): CascaderOption[] {
  const resolved: CascaderOption[] = [];
  let level = options;
  for (const key of path) {
    const found = level.find((option) => option.value === key);
    if (!found) return [];
    resolved.push(found);
    level = found.children ?? [];
  }
  return resolved;
}

export interface CascaderProps {
  locale: Locale;
  /** The accessible name of the field, rendered as its visible label. */
  label: string;
  /** The accessible name announced for the drill-down popup and its columns. */
  columnsLabel: string;
  /** Text shown on the trigger before any path is chosen. */
  placeholder: string;
  /** The option tree; each node may carry children, forming one popup column per level. */
  options: readonly CascaderOption[];
  /** The selected path of option values from root to leaf, when controlled. */
  value?: readonly string[] | null;
  /** The initially selected path, when uncontrolled. */
  defaultValue?: readonly string[] | null;
  /** Called with the committed path and its resolved option objects. */
  onValueChange?: (path: readonly string[] | null, options: readonly CascaderOption[]) => void;
  /** Commits at every level rather than only at a leaf. */
  changeOnSelect?: boolean;
  isDisabled?: boolean;
  /** Submitted field name; the path is posted joined with '/'. */
  name?: string;
  className?: string;
}

/**
 * A drill-down selector over a tree of options, one column per level.
 *
 * The popup rides the shared `Popover`/`PopoverTrigger` pair rather than a
 * hand-rolled `absolute` div — an earlier version rolled its own and thereby
 * forfeited Escape dismissal, outside-press dismissal, focus return,
 * portalling and collision handling all at once, which an independent review
 * measured as the exact gap. Columns are navigated with the arrow keys:
 * Up/Down inside a column, the inline-end key drills into children, the
 * inline-start key returns to the parent column. `draftPath` is rebuilt from
 * the committed value every time the popup opens, so a controlled `value`
 * change while it was closed can never present a stale drill-down.
 */
export function Cascader({
  locale,
  label,
  columnsLabel,
  placeholder,
  options,
  value,
  defaultValue = null,
  onValueChange,
  changeOnSelect = false,
  isDisabled,
  name,
  className,
}: CascaderProps) {
  const id = React.useId();
  const [internal, setInternal] = React.useState<readonly string[] | null>(defaultValue);
  const [open, setOpen] = React.useState(false);
  const [draftPath, setDraftPath] = React.useState<readonly string[]>([]);
  const columnsRef = React.useRef<HTMLDivElement | null>(null);
  const pendingFocusColumn = React.useRef<number | null>(null);
  const selectedPath = value === undefined ? internal : value;
  const selected = selectedPath ? resolveCascaderPath(options, selectedPath) : [];
  const columns: CascaderOption[][] = [[...options]];
  let level = options;
  for (const key of draftPath) {
    const node = level.find((option) => option.value === key);
    if (!node?.children?.length) break;
    columns.push([...node.children]);
    level = node.children;
  }
  const commit = (path: readonly string[] | null, resolved: readonly CascaderOption[]) => {
    if (value === undefined) setInternal(path);
    onValueChange?.(path, resolved);
  };

  /* Focus moved BY KEY must land after the column it targets has rendered,
   * so the drill-down handler records the target and this effect delivers. */
  React.useEffect(() => {
    const target = pendingFocusColumn.current;
    if (target === null) return;
    pendingFocusColumn.current = null;
    const column = columnsRef.current?.querySelectorAll('[role="listbox"]')[target];
    const first = column?.querySelector<HTMLButtonElement>('[role="option"]:not([disabled])');
    first?.focus();
  });

  const onColumnsKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.getAttribute("role") !== "option") return;
    const root = columnsRef.current;
    const columnElement = target.closest('[role="listbox"]');
    if (!root || !columnElement) return;
    const columnElements = [...root.querySelectorAll('[role="listbox"]')];
    const columnIndex = columnElements.indexOf(columnElement);
    const optionElements = [
      ...columnElement.querySelectorAll<HTMLButtonElement>('[role="option"]:not([disabled])'),
    ];
    const optionIndex = optionElements.indexOf(target as HTMLButtonElement);
    const rtl = direction(locale) === "rtl";
    const deeperKey = rtl ? "ArrowLeft" : "ArrowRight";
    const shallowerKey = rtl ? "ArrowRight" : "ArrowLeft";

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      const step = event.key === "ArrowDown" ? 1 : -1;
      const count = optionElements.length;
      optionElements[(optionIndex + step + count) % count]?.focus();
      event.preventDefault();
    } else if (event.key === "Home" || event.key === "End") {
      optionElements[event.key === "Home" ? 0 : optionElements.length - 1]?.focus();
      event.preventDefault();
    } else if (event.key === deeperKey) {
      const optionValue = target.getAttribute("data-value");
      const option = columns[columnIndex]?.find((candidate) => candidate.value === optionValue);
      if (option?.children?.length) {
        setDraftPath([...draftPath.slice(0, columnIndex), option.value]);
        pendingFocusColumn.current = columnIndex + 1;
      }
      event.preventDefault();
    } else if (event.key === shallowerKey && columnIndex > 0) {
      const parentColumn = columnElements[columnIndex - 1];
      const parent =
        parentColumn?.querySelector<HTMLButtonElement>('[role="option"][aria-selected="true"]') ??
        parentColumn?.querySelector<HTMLButtonElement>('[role="option"]:not([disabled])');
      parent?.focus();
      event.preventDefault();
    }
  };

  return (
    <div data-lumo="" className={cn("flex w-full flex-col gap-1.5", className)}>
      <label id={`${id}-label`} className="text-sm font-medium text-fg">{label}</label>
      <PopoverTrigger
        isOpen={open}
        onOpenChange={(next) => {
          // The draft is rebuilt from the committed value on every open, so a
          // controlled change while closed can never show a stale drill-down.
          if (next) setDraftPath(selectedPath ?? []);
          setOpen(next);
        }}
      >
        <button
          id={id}
          type="button"
          aria-labelledby={`${id}-label ${id}-value`}
          disabled={isDisabled}
          className="flex h-control-md items-center justify-between rounded-md border border-border-control bg-surface px-3 text-start text-sm"
        >
          <span id={`${id}-value`}>{selected.length ? selected.map((node) => node.label).join(" / ") : placeholder}</span>
          <ChevronRight aria-hidden="true" className={cn("size-4", direction(locale) === "rtl" && "rotate-180")} />
        </button>
        <Popover aria-label={columnsLabel} padded={false} className="p-1">
          <div ref={columnsRef} onKeyDown={onColumnsKeyDown} className="flex max-w-[var(--available-width)] overflow-auto">
            {columns.map((column, columnIndex) => (
              <div key={columnIndex} role="listbox" aria-label={`${columnsLabel} ${columnIndex + 1}`} className="min-w-40 border-e border-border p-1 last:border-0">
                {column.map((option, optionIndex) => {
                  const active = draftPath[columnIndex] === option.value;
                  // Roving tabindex: one stop per column — the drilled option,
                  // or the first option where nothing is drilled. Arrow keys
                  // move within; without this every option was its own Tab
                  // stop, which this repo's own composite-tab-stop rule flags.
                  const stop = draftPath[columnIndex] === undefined ? optionIndex === 0 : active;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      data-value={option.value}
                      tabIndex={stop ? 0 : -1}
                      aria-selected={active}
                      disabled={option.disabled}
                      className={cn("flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-start text-sm outline-none focus-visible:bg-surface-hover", active && "bg-surface-hover")}
                      onClick={() => {
                        const next = [...draftPath.slice(0, columnIndex), option.value];
                        setDraftPath(next);
                        const resolved = resolveCascaderPath(options, next);
                        if (changeOnSelect || !option.children?.length) { commit(next, resolved); if (!option.children?.length) setOpen(false); }
                      }}
                    >
                      {option.label}
                      {option.children?.length ? <ChevronRight aria-hidden="true" className={cn("size-4", direction(locale) === "rtl" && "rotate-180")} /> : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </Popover>
      </PopoverTrigger>
      {name === undefined || !selectedPath ? null : <input type="hidden" name={name} value={selectedPath.join("/")} />}
    </div>
  );
}
