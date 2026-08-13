"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@lumo-ui/core";

interface TagsInputBaseProps {
  label: string;
  placeholder: string;
  removeLabel: (tag: string) => string;
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: readonly string[]) => void;
  splitCharacters?: readonly string[];
  isDuplicate?: (candidate: string, current: readonly string[]) => boolean;
  maxTags?: number;
  isDisabled?: boolean;
  name?: string;
  className?: string;
}

export type TagsInputProps = TagsInputBaseProps &
  (
    | { suggestions?: undefined; suggestionsLabel?: undefined }
    | { suggestions: readonly string[]; suggestionsLabel: string }
  );

export function TagsInput({
  label,
  placeholder,
  removeLabel,
  value,
  defaultValue = [],
  onValueChange,
  suggestions = [],
  suggestionsLabel,
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
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const tags = value ?? internal;
  const availableSuggestions = suggestions.filter(
    (suggestion) => !isDuplicate(suggestion, tags) && suggestion.includes(draft),
  );
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
    <div data-lumo="" className={cn("relative flex w-full flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-fg">{label}</label>
      <div className="flex min-h-control-md flex-wrap items-center gap-1 rounded-md border border-border-control bg-surface px-2 py-1">
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
          role="combobox"
          aria-expanded={open && availableSuggestions.length > 0}
          aria-controls={open && availableSuggestions.length > 0 ? `${id}-suggestions` : undefined}
          aria-activedescendant={
            open && availableSuggestions[activeIndex] !== undefined
              ? `${id}-suggestion-${activeIndex}`
              : undefined
          }
          value={draft}
          disabled={isDisabled}
          placeholder={tags.length === 0 ? placeholder : undefined}
          className="min-w-24 flex-1 bg-transparent py-1 text-sm outline-none"
          onFocus={() => setOpen(true)}
          onBlur={() => queueMicrotask(() => setOpen(false))}
          onChange={(event) => {
            setDraft(event.currentTarget.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && availableSuggestions.length > 0) {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((activeIndex + 1) % availableSuggestions.length);
            } else if (event.key === "ArrowUp" && availableSuggestions.length > 0) {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((activeIndex - 1 + availableSuggestions.length) % availableSuggestions.length);
            } else if (event.key === "Enter") {
              event.preventDefault();
              add(open && availableSuggestions[activeIndex] !== undefined ? availableSuggestions[activeIndex] : draft);
              setOpen(false);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
            if (event.key === "Backspace" && !draft && tags.length > 0) commit(tags.slice(0, -1));
          }}
          onPaste={(event) => {
            const text = event.clipboardData.getData("text");
            if (splitCharacters.some((separator) => text.includes(separator))) { event.preventDefault(); add(text); }
          }}
        />
      </div>
      {open && availableSuggestions.length > 0 ? (
        <div
          id={`${id}-suggestions`}
          role="listbox"
          aria-label={suggestionsLabel}
          className="absolute inset-is-0 top-full z-40 mt-1 w-full rounded-md border border-border bg-surface p-1 shadow-overlay"
        >
          {availableSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              id={`${id}-suggestion-${index}`}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                add(suggestion);
                setOpen(false);
              }}
              className="flex w-full rounded-sm px-2 py-1.5 text-start text-sm text-fg outline-none aria-selected:bg-surface-hover"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
      {name === undefined ? null : tags.map((tag, index) => <input key={`${tag}-${index}`} type="hidden" name={name} value={tag} />)}
    </div>
  );
}
