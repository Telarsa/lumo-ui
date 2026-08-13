"use client";

import * as React from "react";
import { cn } from "@lumo-ui/core";

export type JsonValidation = { valid: false } | { valid: true; value: unknown };

export function validateJson(text: string): JsonValidation {
  try {
    return { valid: true, value: JSON.parse(text) };
  } catch {
    return { valid: false };
  }
}

export interface JsonInputProps
  extends Omit<React.ComponentProps<"textarea">, "children" | "defaultValue" | "value" | "onChange"> {
  label: string;
  invalidJsonMessage: string;
  description?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (text: string, parsed: JsonValidation) => void;
  formatOnBlur?: boolean;
  indent?: number;
}

export function JsonInput({
  label,
  invalidJsonMessage,
  description,
  value,
  defaultValue = "",
  onValueChange,
  formatOnBlur = false,
  indent = 2,
  className,
  id,
  ...props
}: JsonInputProps) {
  const generated = React.useId();
  const inputId = id ?? generated;
  const errorId = `${inputId}-error`;
  const descriptionId = `${inputId}-description`;
  const [internal, setInternal] = React.useState(defaultValue);
  const text = value ?? internal;
  const validation = validateJson(text);
  const invalid = text.trim() !== "" && !validation.valid;
  const change = (next: string) => {
    if (value === undefined) setInternal(next);
    onValueChange?.(next, validateJson(next));
  };
  return (
    <div data-lumo="" className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-fg">{label}</label>
      <textarea
        {...props}
        dir="ltr"
        lang="en"
        data-lumo-latn=""
        id={inputId}
        value={text}
        aria-invalid={invalid || undefined}
        aria-describedby={[description ? descriptionId : "", invalid ? errorId : ""].filter(Boolean).join(" ") || undefined}
        className={cn("min-h-32 w-full rounded-md border border-border-control bg-surface px-3 py-2 font-mono text-sm text-fg outline-none", className)}
        onChange={(event) => change(event.currentTarget.value)}
        onBlur={(event) => {
          if (formatOnBlur && validation.valid) change(JSON.stringify(validation.value, null, indent));
          props.onBlur?.(event);
        }}
      />
      {description === undefined ? null : <p id={descriptionId} className="text-sm text-fg-muted">{description}</p>}
      {invalid ? <p id={errorId} className="text-sm text-critical">{invalidJsonMessage}</p> : null}
    </div>
  );
}
