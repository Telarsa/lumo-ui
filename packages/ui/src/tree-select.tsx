"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@lumo-ui/core";

import { Popover, PopoverTrigger } from "./popover.tsx";

export interface TreeSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  children?: readonly TreeSelectOption[];
}

function descendantKeys(node: TreeSelectOption): string[] {
  return [node.value, ...(node.children ?? []).flatMap(descendantKeys)];
}

export function treeSelectionState(
  node: TreeSelectOption,
  selected: ReadonlySet<string>,
): "checked" | "mixed" | "unchecked" {
  const leaves = node.children?.length ? node.children.flatMap(descendantKeys).filter((key) => key !== node.value) : [node.value];
  const count = leaves.filter((key) => selected.has(key)).length;
  if (count === 0) return "unchecked";
  return count === leaves.length ? "checked" : "mixed";
}

export interface TreeSelectProps {
  label: string;
  treeLabel: string;
  placeholder: string;
  options: readonly TreeSelectOption[];
  mode?: "single" | "multiple" | "checkbox";
  value?: string | readonly string[] | null;
  defaultValue?: string | readonly string[] | null;
  onValueChange?: (value: string | readonly string[] | null) => void;
  isDisabled?: boolean;
  name?: string;
  className?: string;
}

export function TreeSelect({
  label,
  treeLabel,
  placeholder,
  options,
  mode = "single",
  value,
  defaultValue = mode === "single" ? null : [],
  onValueChange,
  isDisabled,
  name,
  className,
}: TreeSelectProps) {
  const id = React.useId();
  const [internal, setInternal] = React.useState<string | readonly string[] | null>(defaultValue);
  const [open, setOpen] = React.useState(false);
  const selectedValue = value === undefined ? internal : value;
  const selected = new Set(Array.isArray(selectedValue) ? selectedValue : selectedValue ? [selectedValue] : []);
  const flat = (nodes: readonly TreeSelectOption[]): TreeSelectOption[] => nodes.flatMap((node) => [node, ...flat(node.children ?? [])]);
  const labels = flat(options).filter((node) => selected.has(node.value)).map((node) => node.label);
  const commit = (next: string | readonly string[] | null) => {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };
  const renderNodes = (nodes: readonly TreeSelectOption[], depth = 0): React.JSX.Element => (
    <ul role={depth === 0 ? "tree" : "group"} aria-label={depth === 0 ? treeLabel : undefined} className={depth === 0 ? "p-1" : "ps-5"}>
      {nodes.map((node) => {
        const state = treeSelectionState(node, selected);
        const checked = mode === "single" ? selected.has(node.value) : state === "checked";
        return (
          <li key={node.value} role="treeitem" aria-selected={selected.has(node.value)} aria-expanded={node.children?.length ? true : undefined} className="text-sm">
            <label className="flex min-h-8 items-center gap-2 rounded px-2 hover:bg-surface-hover">
              <input
                type={mode === "single" ? "radio" : "checkbox"}
                name={mode === "single" ? name ?? id : undefined}
                value={node.value}
                checked={checked}
                disabled={isDisabled || node.disabled}
                ref={(element) => { if (element) element.indeterminate = mode === "checkbox" && state === "mixed"; }}
                onChange={() => {
                  if (mode === "single") { commit(node.value); setOpen(false); return; }
                  const next = new Set(selected);
                  const affected = mode === "checkbox" ? descendantKeys(node) : [node.value];
                  const shouldAdd = state !== "checked";
                  for (const key of affected) shouldAdd ? next.add(key) : next.delete(key);
                  commit([...next]);
                }}
              />
              {node.label}
            </label>
            {node.children?.length ? renderNodes(node.children, depth + 1) : null}
          </li>
        );
      })}
    </ul>
  );
  /*
   * The popup rides the shared `Popover`/`PopoverTrigger` pair rather than a
   * hand-rolled `absolute` div — the hand-rolled form forfeited Escape,
   * outside-press dismissal, focus return, portalling and collision handling
   * at once, which an independent review measured as the exact gap. The tree
   * itself stays a form of native radios/checkboxes: Tab reaches every row,
   * and the native inputs carry the selection semantics a hand-rolled
   * `aria-activedescendant` tree would have to re-earn.
   */
  return (
    <div data-lumo="" className={cn("flex w-full flex-col gap-1.5", className)}>
      <label id={`${id}-label`} className="text-sm font-medium text-fg">{label}</label>
      <PopoverTrigger isOpen={open} onOpenChange={setOpen}>
        <button type="button" aria-labelledby={`${id}-label ${id}-value`} disabled={isDisabled} className="flex h-control-md items-center justify-between rounded-md border border-border-control bg-surface px-3 text-start text-sm">
          <span id={`${id}-value`}>{labels.length ? labels.join(", ") : placeholder}</span>
          <ChevronDown aria-hidden="true" className="size-4" />
        </button>
        <Popover aria-label={treeLabel} padded={false} className="max-h-72 w-[var(--anchor-width)] overflow-auto">
          {renderNodes(options)}
        </Popover>
      </PopoverTrigger>
      {mode !== "single" && name ? [...selected].map((key) => <input key={key} type="hidden" name={name} value={key} />) : null}
    </div>
  );
}
