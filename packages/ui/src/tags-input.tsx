"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@lumo-ui/core";

export interface TagsInputProps {
  label: string;
  placeholder: string;
  removeLabel: (tag: string) => string;
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: readonly string[]) => void;
  suggestions?: readonly string[];
  splitCharacters?: readonly string[];
  isDuplicate?: (candidate: string, current: readonly string[]) => boolean;
  maxTags?: number;
  isDisabled?: boolean;
  name?: string;
  className?: string;
}

export function TagsInput({
  label,
  placeholder,
  removeLabel,
  value,
  defaultValue = [],
  onValueChange,
  suggestions = [],
  splitCharacters = [","],
  isDuplicate = (candidate, current) => current.includes(candidate),
  maxTags,
  isDisabled,
  name,
  className,
}: TagsInputProps) {
  const id = React.useId();
  const [internal, setInternal] = React.useState<readonly string[]>(defaultValue);
  const [draft, setDraft] = React.useState("");
  const tags = value ?? internal;
  const commit = (next: readonly string[]) => {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };
  const add = (input: string) => {
    const candidates = [input].flatMap((part) => {
      let pieces = [part];
      for (const separator of splitCharacters) pieces = pieces.flatMap((piece) => piece.split(separator));
      return pieces;
    }).map((tag) => tag.trim()).filter(Boolean);
    const next = [...tags];
    for (const candidate of candidates) {
      if ((maxTags === undefined || next.length < maxTags) && !isDuplicate(candidate, next)) next.push(candidate);
    }
    commit(next);
    setDraft("");
  };
  return (
    <div data-lumo="" className={cn("flex w-full flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-fg">{label}</label>
      <div className="flex min-h-10 flex-wrap items-center gap-1 rounded-md border border-border-control bg-surface px-2 py-1">
        {tags.map((tag, index) => (
          <span key={`${tag}-${index}`} className="inline-flex items-center gap-1 rounded bg-surface-sunken px-2 py-1 text-sm">
            {tag}
            <button type="button" aria-label={removeLabel(tag)} disabled={isDisabled} onClick={() => commit(tags.filter((_, itemIndex) => itemIndex !== index))}>
              <X aria-hidden="true" className="size-3.5" />
            </button>
          </span>
        ))}
        <input
          id={id}
          list={`${id}-suggestions`}
          value={draft}
          disabled={isDisabled}
          placeholder={tags.length === 0 ? placeholder : undefined}
          className="min-w-24 flex-1 bg-transparent py-1 text-sm outline-none"
          onChange={(event) => setDraft(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") { event.preventDefault(); add(draft); }
            if (event.key === "Backspace" && !draft && tags.length > 0) commit(tags.slice(0, -1));
          }}
          onPaste={(event) => {
            const text = event.clipboardData.getData("text");
            if (splitCharacters.some((separator) => text.includes(separator))) { event.preventDefault(); add(text); }
          }}
        />
        <datalist id={`${id}-suggestions`}>{suggestions.map((suggestion) => <option key={suggestion} value={suggestion} />)}</datalist>
      </div>
      {name === undefined ? null : tags.map((tag, index) => <input key={`${tag}-${index}`} type="hidden" name={name} value={tag} />)}
    </div>
  );
}
