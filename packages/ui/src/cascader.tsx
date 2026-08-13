"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn, direction, type Locale } from "@lumo-ui/core";

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
  label: string;
  columnsLabel: string;
  placeholder: string;
  options: readonly CascaderOption[];
  value?: readonly string[] | null;
  defaultValue?: readonly string[] | null;
  onValueChange?: (path: readonly string[] | null, options: readonly CascaderOption[]) => void;
  changeOnSelect?: boolean;
  isDisabled?: boolean;
  name?: string;
  className?: string;
}

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
  const [draftPath, setDraftPath] = React.useState<readonly string[]>(value ?? defaultValue ?? []);
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
  return (
    <div data-lumo="" className={cn("relative flex w-full flex-col gap-1.5", className)}>
      <label id={`${id}-label`} className="text-sm font-medium text-fg">{label}</label>
      <button
        id={id}
        type="button"
        aria-labelledby={`${id}-label ${id}-value`}
        aria-expanded={open}
        aria-haspopup="dialog"
        disabled={isDisabled}
        className="flex h-10 items-center justify-between rounded-md border border-border-control bg-surface px-3 text-start text-sm"
        onClick={() => setOpen((current) => !current)}
      >
        <span id={`${id}-value`}>{selected.length ? selected.map((node) => node.label).join(" / ") : placeholder}</span>
        <ChevronRight aria-hidden="true" className={cn("size-4", direction(locale) === "rtl" && "rotate-180")} />
      </button>
      {name === undefined || !selectedPath ? null : <input type="hidden" name={name} value={selectedPath.join("/")} />}
      {open ? (
        <div role="dialog" aria-label={columnsLabel} className="absolute inset-x-0 top-full z-50 mt-1 flex max-w-full overflow-auto rounded-md border border-border bg-surface p-1 shadow-raised">
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} role="listbox" aria-label={`${columnsLabel} ${columnIndex + 1}`} className="min-w-40 border-e border-border p-1 last:border-0">
              {column.map((option) => {
                const active = draftPath[columnIndex] === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    disabled={option.disabled}
                    className={cn("flex w-full items-center justify-between rounded px-2 py-1.5 text-start text-sm", active && "bg-surface-hover")}
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
      ) : null}
    </div>
  );
}
